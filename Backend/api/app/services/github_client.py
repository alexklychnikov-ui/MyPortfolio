import base64
from urllib.parse import urlparse

import httpx

from app.core.config import settings


class GithubClient:
    base_url = "https://api.github.com"

    def __init__(self) -> None:
        headers: dict[str, str] = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "portfolio-backend-api",
        }
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        self.headers = headers

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

    def _decode_b64(self, value: str | None) -> str:
        if not value:
            return ""
        try:
            return base64.b64decode(value).decode("utf-8", errors="ignore")
        except Exception:
            return ""

    async def collect_many(self, repositories: list[str]) -> tuple[list[dict], list[dict[str, str]]]:
        accepted: list[dict] = []
        skipped: list[dict[str, str]] = []

        async with httpx.AsyncClient(
            base_url=self.base_url, headers=self.headers, timeout=httpx.Timeout(25.0)
        ) as client:
            for repo_url in repositories:
                normalized = self.normalize(repo_url)
                if not normalized:
                    skipped.append({"url": repo_url, "reason": "Invalid repository URL"})
                    continue

                owner, repo, normalized_url = normalized
                repo_data = await self._json_or_none(client, f"/repos/{owner}/{repo}")
                if not repo_data:
                    skipped.append({"url": repo_url, "reason": "Repository is not accessible"})
                    continue

                readme = await self._json_or_none(client, f"/repos/{owner}/{repo}/readme")
                package_json = await self._json_or_none(client, f"/repos/{owner}/{repo}/contents/package.json")
                languages = await self._json_or_none(client, f"/repos/{owner}/{repo}/languages")

                readme_text = self._decode_b64(readme.get("content") if isinstance(readme, dict) else None)[:8000]
                package_text = self._decode_b64(package_json.get("content") if isinstance(package_json, dict) else None)[
                    :8000
                ]
                language_list = list(languages.keys()) if isinstance(languages, dict) else []

                accepted.append(
                    {
                        "repo_url": normalized_url,
                        "description": repo_data.get("description") or "",
                        "topics": repo_data.get("topics") or [],
                        "languages": language_list,
                        "readme": readme_text,
                        "package_json": package_text,
                    }
                )

        return accepted, skipped
