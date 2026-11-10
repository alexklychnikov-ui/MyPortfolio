import asyncio
import base64
import logging
import time
from datetime import UTC, datetime
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.services.readme_parser import (
    extract_first_readme_image,
    extract_readme_demo_url,
    extract_readme_media,
    extract_readme_title,
)

logger = logging.getLogger(__name__)

REQUESTS_PER_REPO = 4
RATE_LIMIT_REASON_PREFIX = "GitHub API rate limit exceeded"
# Wait at most ~15 min for reset; longer → fail with clear message.
DEFAULT_MAX_WAIT_SECONDS = 900


class GithubRateLimitError(RuntimeError):
    def __init__(self, message: str, *, reset_at: str | None = None) -> None:
        super().__init__(message)
        self.reset_at = reset_at


class GithubClient:
    base_url = "https://api.github.com"

    def __init__(self, *, max_wait_seconds: int | None = None) -> None:
        headers: dict[str, str] = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "portfolio-backend-api",
        }
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        self.headers = headers
        self.max_wait_seconds = (
            DEFAULT_MAX_WAIT_SECONDS if max_wait_seconds is None else max(0, int(max_wait_seconds))
        )
        self.auth_mode = "authenticated" if "Authorization" in headers else "anonymous"

    def normalize(self, url: str) -> tuple[str, str, str] | None:
        parsed = urlparse(url)
        if parsed.netloc != "github.com":
            return None
        chunks = [part for part in parsed.path.split("/") if part]
        if len(chunks) < 2:
            return None
        owner = chunks[0]
        repo = chunks[1].replace(".git", "")
        normalized = f"https://github.com/{owner}/{repo}"
        return owner, repo, normalized

    async def _json_or_none(self, client: httpx.AsyncClient, path: str):
        response = await client.get(path)
        if response.status_code >= 400:
            return None
        return response.json()

    @staticmethod
    def _format_reset(reset_ts: int | float | str | None) -> str | None:
        if reset_ts is None:
            return None
        try:
            return datetime.fromtimestamp(int(reset_ts), tz=UTC).isoformat()
        except Exception:
            return None

    @staticmethod
    def _rate_limit_reason(reset_at: str | None) -> str:
        if reset_at:
            return f"{RATE_LIMIT_REASON_PREFIX} (reset at {reset_at})"
        return RATE_LIMIT_REASON_PREFIX

    async def _read_core_rate(self, client: httpx.AsyncClient) -> tuple[int, int, str | None]:
        response = await client.get("/rate_limit")
        if response.status_code >= 400:
            return 0, 0, None
        payload = response.json()
        core = payload.get("resources", {}).get("core", {})
        remaining = int(core.get("remaining", 0) or 0)
        reset_ts = core.get("reset")
        reset_at = self._format_reset(reset_ts)
        seconds_left = 0
        if reset_ts is not None:
            try:
                seconds_left = max(0, int(reset_ts) - int(time.time()))
            except Exception:
                seconds_left = 0
        return remaining, seconds_left, reset_at

    async def _wait_until_rate_available(
        self,
        client: httpx.AsyncClient,
        *,
        needed: int,
    ) -> None:
        remaining, seconds_left, reset_at = await self._read_core_rate(client)
        if remaining >= needed:
            return
        if seconds_left <= 0:
            # Reset claimed "now" but still empty — brief backoff then recheck once.
            await asyncio.sleep(2)
            remaining, seconds_left, reset_at = await self._read_core_rate(client)
            if remaining >= needed:
                return
        if seconds_left > self.max_wait_seconds:
            raise GithubRateLimitError(
                self._rate_limit_reason(reset_at)
                + f"; wait {seconds_left}s exceeds max {self.max_wait_seconds}s "
                f"(auth={self.auth_mode})",
                reset_at=reset_at,
            )
        logger.warning(
            "GitHub rate limit: remaining=%s needed=%s auth=%s; sleeping %ss until %s",
            remaining,
            needed,
            self.auth_mode,
            seconds_left,
            reset_at,
        )
        await asyncio.sleep(seconds_left + 1)
        remaining, _, reset_at = await self._read_core_rate(client)
        if remaining < needed:
            raise GithubRateLimitError(
                self._rate_limit_reason(reset_at) + f" after wait (auth={self.auth_mode})",
                reset_at=reset_at,
            )

    def _decode_b64(self, value: str | None) -> str:
        if not value:
            return ""
        try:
            return base64.b64decode(value).decode("utf-8", errors="ignore")
        except Exception:
            return ""

    async def _headers_for_requests(self) -> dict[str, str]:
        headers = dict(self.headers)
        if "Authorization" not in headers:
            self.auth_mode = "anonymous"
            return headers

        async with httpx.AsyncClient(
            base_url=self.base_url, headers=headers, timeout=httpx.Timeout(15.0)
        ) as client:
            probe = await client.get("/rate_limit")
            if probe.status_code == 401:
                # Bad/expired token breaks even public repos — fall back to anonymous.
                logger.error(
                    "GITHUB_TOKEN rejected by GitHub (401). Falling back to anonymous "
                    "(60 req/hour). Replace the token in Backend/.env and recreate backend-api."
                )
                headers.pop("Authorization", None)
                self.headers = dict(headers)
                self.auth_mode = "anonymous_invalid_token"
                return headers

            if probe.status_code < 400:
                remaining, _, _ = await self._read_core_rate(client)
                logger.info(
                    "GitHub auth ok mode=authenticated remaining=%s",
                    remaining,
                )
                self.auth_mode = "authenticated"
                return headers

            logger.warning(
                "GitHub token probe status=%s; continuing with Authorization header",
                probe.status_code,
            )
            self.auth_mode = "authenticated"
            return headers

    def _is_rate_limited_response(self, response: httpx.Response) -> bool:
        if response.status_code != 403:
            return False
        if response.headers.get("x-ratelimit-remaining") == "0":
            return True
        body = (response.text or "").lower()
        return "rate limit" in body

    async def _get_with_rate_limit(
        self,
        client: httpx.AsyncClient,
        path: str,
    ) -> httpx.Response:
        response = await client.get(path)
        if not self._is_rate_limited_response(response):
            return response
        reset_at = self._format_reset(response.headers.get("x-ratelimit-reset"))
        seconds_left = 0
        reset_header = response.headers.get("x-ratelimit-reset")
        if reset_header:
            try:
                seconds_left = max(0, int(reset_header) - int(time.time()))
            except Exception:
                seconds_left = 60
        else:
            seconds_left = 60
        if seconds_left > self.max_wait_seconds:
            raise GithubRateLimitError(
                self._rate_limit_reason(reset_at)
                + f"; wait {seconds_left}s exceeds max {self.max_wait_seconds}s "
                f"(auth={self.auth_mode})",
                reset_at=reset_at,
            )
        logger.warning(
            "GitHub 403 rate limit on %s auth=%s; sleeping %ss until %s",
            path,
            self.auth_mode,
            seconds_left,
            reset_at,
        )
        await asyncio.sleep(seconds_left + 1)
        retry = await client.get(path)
        if self._is_rate_limited_response(retry):
            retry_reset = self._format_reset(retry.headers.get("x-ratelimit-reset"))
            raise GithubRateLimitError(
                self._rate_limit_reason(retry_reset) + f" after wait (auth={self.auth_mode})",
                reset_at=retry_reset,
            )
        return retry

    async def collect_many(self, repositories: list[str]) -> tuple[list[dict], list[dict[str, str]]]:
        accepted: list[dict] = []
        skipped: list[dict[str, str]] = []
        headers = await self._headers_for_requests()

        valid_count = sum(1 for url in repositories if self.normalize(url))
        needed = max(1, valid_count * REQUESTS_PER_REPO)

        async with httpx.AsyncClient(
            base_url=self.base_url, headers=headers, timeout=httpx.Timeout(25.0)
        ) as client:
            try:
                await self._wait_until_rate_available(client, needed=min(needed, REQUESTS_PER_REPO))
            except GithubRateLimitError as exc:
                reason = str(exc)
                return [], [{"url": repo_url, "reason": reason} for repo_url in repositories]

            for index, repo_url in enumerate(repositories):
                normalized = self.normalize(repo_url)
                if not normalized:
                    skipped.append({"url": repo_url, "reason": "Invalid repository URL"})
                    continue

                owner, repo, normalized_url = normalized
                try:
                    await self._wait_until_rate_available(client, needed=REQUESTS_PER_REPO)
                    repo_response = await self._get_with_rate_limit(client, f"/repos/{owner}/{repo}")
                except GithubRateLimitError as exc:
                    # Fail the rest of the batch with the same reason — caller must not
                    # partially wipe the portfolio.
                    reason = str(exc)
                    skipped.append({"url": repo_url, "reason": reason})
                    for pending in repositories[index + 1 :]:
                        if self.normalize(pending):
                            skipped.append({"url": pending, "reason": reason})
                        else:
                            skipped.append({"url": pending, "reason": "Invalid repository URL"})
                    break

                if repo_response.status_code >= 400:
                    skipped.append({"url": repo_url, "reason": "Repository is not accessible"})
                    continue
                repo_data = repo_response.json()

                readme = await self._json_or_none(client, f"/repos/{owner}/{repo}/readme")
                package_json = await self._json_or_none(
                    client, f"/repos/{owner}/{repo}/contents/package.json"
                )
                languages = await self._json_or_none(client, f"/repos/{owner}/{repo}/languages")

                readme_full = self._decode_b64(readme.get("content") if isinstance(readme, dict) else None)
                readme_text = readme_full[:8000]
                package_text = self._decode_b64(
                    package_json.get("content") if isinstance(package_json, dict) else None
                )[:8000]
                language_list = list(languages.keys()) if isinstance(languages, dict) else []
                default_branch = str(repo_data.get("default_branch") or "main")
                mockup = extract_first_readme_image(readme_full, owner, repo, default_branch)
                media = extract_readme_media(readme_full, owner, repo, default_branch)
                readme_title = extract_readme_title(readme_full)
                readme_demo_url = extract_readme_demo_url(readme_full)

                accepted.append(
                    {
                        "repo_url": normalized_url,
                        "owner": owner,
                        "repo": repo,
                        "is_private": bool(repo_data.get("private")),
                        "description": repo_data.get("description") or "",
                        "topics": repo_data.get("topics") or [],
                        "languages": language_list,
                        "readme": readme_text,
                        "package_json": package_text,
                        "readme_title": readme_title,
                        "readme_demo_url": readme_demo_url,
                        "mockup_url": mockup[0] if mockup else None,
                        "mockup_name": mockup[1] if mockup else None,
                        "screenshots": media.get("screenshots") or [],
                        "videos": media.get("videos") or [],
                    }
                )

        return accepted, skipped
