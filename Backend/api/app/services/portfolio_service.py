import logging
import time
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponseData
from app.services.demo_storage import materialize_project_demos
from app.services.github_client import RATE_LIMIT_REASON_PREFIX, GithubClient
from app.services.mockup_storage import materialize_project_mockups
from app.services.openai_client import OpenAIClient
from app.services.services_pipeline import process_service_candidates, validate_public_services

logger = logging.getLogger(__name__)


class PortfolioService:
    def __init__(self) -> None:
        self.github = GithubClient()
        self.openai = OpenAIClient()

    @staticmethod
    def _rate_limit_skips(skipped: list[dict[str, str]]) -> list[dict[str, str]]:
        return [
            item
            for item in skipped
            if RATE_LIMIT_REASON_PREFIX in str(item.get("reason") or "")
        ]

    @staticmethod
    def _is_http_url(value: str | None) -> bool:
        if not value:
            return False
        parsed = urlparse(value.strip())
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)

    def _normalize_project_tags(self, generated: dict, repositories: list[str]) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        order_keys: list[str] = []
        for repo_url in repositories:
            normalized = self.github.normalize(repo_url)
            if normalized:
                order_keys.append(normalized[2].strip().lower())

        if not order_keys:
            return generated

        for idx, project in enumerate(projects):
            if not isinstance(project, dict):
                continue
            current_tag = project.get("tag")
            if self._is_http_url(current_tag):
                continue
            replacement = order_keys[idx] if idx < len(order_keys) else order_keys[-1]
            project["tag"] = replacement

        return generated

    @staticmethod
    def _sanitize_generated_projects(generated: dict) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        for project in projects:
            if not isinstance(project, dict):
                continue
            demo_url = project.get("demoUrl")
            if not demo_url or not str(demo_url).strip():
                project.pop("demoUrl", None)
            elif not PortfolioService._is_http_url(str(demo_url)):
                project.pop("demoUrl", None)
            project.pop("image", None)

        return generated

    @staticmethod
    def _apply_services_pipeline(
        generated: dict,
        accepted: list[dict],
    ) -> tuple[dict, dict]:
        skills = generated.get("skills") if isinstance(generated.get("skills"), dict) else {}
        public, diagnostics = process_service_candidates(
            generated.get("services"),
            accepted_repos=accepted,
            skills=skills,
        )
        errors = validate_public_services(public)
        diagnostics["validation_errors"] = errors
        if not errors:
            generated["services"] = public
        return generated, diagnostics

    def _order_projects_by_input(self, generated: dict, accepted: list[dict], repositories: list[str]) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        order_keys: list[str] = []
        for repo_url in repositories:
            normalized = self.github.normalize(repo_url)
            if normalized:
                order_keys.append(normalized[2].strip().lower())

        if not order_keys:
            order_keys = [str(item.get("repo_url", "")).strip().lower() for item in accepted if item.get("repo_url")]

        def sort_key(project: dict) -> int:
            tag = str(project.get("tag", "")).strip().lower()
            if tag in order_keys:
                return order_keys.index(tag)
            return len(order_keys) + 1

        projects.sort(key=sort_key)
        return generated

    @staticmethod
    def _apply_readme_titles(generated: dict, accepted: list[dict]) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        repo_by_tag = {
            str(item.get("repo_url", "")).strip().lower(): item for item in accepted if item.get("repo_url")
        }
        for project in projects:
            if not isinstance(project, dict):
                continue
            tag = str(project.get("tag", "")).strip().lower()
            meta = repo_by_tag.get(tag)
            if not meta:
                continue
            title = str(meta.get("readme_title") or "").strip()
            if title:
                project["title"] = {"ru": title, "en": title}

        return generated

    @staticmethod
    async def _url_is_reachable(url: str) -> bool:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(12.0), follow_redirects=True) as client:
                response = await client.head(url, headers={"User-Agent": "portfolio-demo-check"})
                if response.status_code < 400:
                    return True
                if response.status_code in {405, 501}:
                    response = await client.get(url, headers={"User-Agent": "portfolio-demo-check"})
                    return response.status_code < 400
                return False
        except Exception:
            return False

    async def _apply_readme_demo_urls(self, generated: dict, accepted: list[dict]) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        repo_by_tag = {
            str(item.get("repo_url", "")).strip().lower(): item for item in accepted if item.get("repo_url")
        }
        used_urls: set[str] = set()

        for project in projects:
            if not isinstance(project, dict):
                continue
            tag = str(project.get("tag", "")).strip().lower()
            meta = repo_by_tag.get(tag) or {}
            candidates: list[str] = []
            readme_demo = str(meta.get("readme_demo_url") or "").strip().strip("`").rstrip(".,;")
            ai_demo = str(project.get("demoUrl") or "").strip().strip("`").rstrip(".,;")
            if readme_demo:
                candidates.append(readme_demo)
            if ai_demo and ai_demo not in candidates:
                candidates.append(ai_demo)

            chosen = None
            for url in candidates:
                if not self._is_http_url(url):
                    continue
                key = url.rstrip("/").lower()
                if key in used_urls:
                    continue
                if await self._url_is_reachable(url):
                    chosen = url
                    used_urls.add(key)
                    break

            if chosen:
                project["demoUrl"] = chosen
            else:
                project.pop("demoUrl", None)

        return generated

    async def analyze_repositories(self, repositories: list[str]) -> tuple[AnalyzeResponseData, list[dict[str, str]]]:
        t0 = time.monotonic()
        accepted, skipped = await self.github.collect_many(repositories)
        rate_limited = self._rate_limit_skips(skipped)
        if rate_limited:
            # Never replace_all with a partial batch caused by rate limit — keeps old portfolio intact.
            sample = rate_limited[0].get("reason") or RATE_LIMIT_REASON_PREFIX
            auth = getattr(self.github, "auth_mode", "unknown")
            raise ValueError(
                f"{sample}. "
                f"Aborted before DB update to avoid wiping projects "
                f"(accepted={len(accepted)}, rate_limited={len(rate_limited)}, auth={auth}). "
                "If auth=anonymous_invalid_token — replace GITHUB_TOKEN in Backend/.env."
            )
        if not accepted:
            reasons = [item.get("reason", "") for item in skipped if item.get("reason")]
            top_reasons = ", ".join(sorted(set(reasons))[:2]) if reasons else "unknown reason"
            raise ValueError(f"No repositories were successfully analyzed: {top_reasons}")

        logger.info(
            "analyze_start input_repos=%s accepted=%s skipped=%s",
            len(repositories),
            len(accepted),
            len(skipped),
        )

        t_ai = time.monotonic()
        generated = await self.openai.generate(accepted)
        repair_attempts = 0
        generated = self._sanitize_generated_projects(generated)
        generated, services_diag = self._apply_services_pipeline(generated, accepted)

        if services_diag.get("validation_errors"):
            repair_attempts = 1
            logger.warning(
                "services_validation_failed errors=%s; attempting one repair",
                services_diag["validation_errors"],
            )
            repaired = await self.openai.generate(
                accepted,
                repair_errors=list(services_diag["validation_errors"]),
                previous_services=generated.get("services")
                if isinstance(generated.get("services"), list)
                else None,
            )
            # Keep projects/skills from first pass if repair returns them; prefer repair services.
            if isinstance(repaired.get("services"), list):
                generated["services"] = repaired["services"]
            if isinstance(repaired.get("skills"), dict) and repaired["skills"]:
                generated["skills"] = repaired["skills"]
            generated = self._sanitize_generated_projects(generated)
            generated, services_diag = self._apply_services_pipeline(generated, accepted)

        if services_diag.get("validation_errors"):
            raise ValueError(
                "Services generation failed validation after repair; previous portfolio preserved. "
                f"errors={services_diag['validation_errors']}; diag={ {k: services_diag[k] for k in ('kept', 'dropped_duplicates', 'dropped_unconfirmed', 'dropped_roadmap_or_stub', 'dropped_unknown_key') if k in services_diag} }"
            )

        logger.info(
            "services_stage ok kept=%s repair_attempts=%s ai_ms=%s",
            services_diag.get("kept"),
            repair_attempts,
            int((time.monotonic() - t_ai) * 1000),
        )

        generated = self._order_projects_by_input(generated, accepted, repositories)
        generated = self._normalize_project_tags(generated, repositories)
        generated = self._apply_readme_titles(generated, accepted)
        generated = await self._apply_readme_demo_urls(generated, accepted)
        generated = await materialize_project_mockups(
            generated,
            accepted,
            settings.static_export_dir,
            self.github.headers,
        )
        generated = await materialize_project_demos(
            generated,
            accepted,
            settings.static_export_dir,
            self.github.headers,
        )
        payload = AnalyzeResponseData.model_validate(generated)
        logger.info(
            "analyze_done total_ms=%s projects=%s services=%s",
            int((time.monotonic() - t0) * 1000),
            len(payload.projects),
            len(payload.services),
        )
        return payload, skipped
