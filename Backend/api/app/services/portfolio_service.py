from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.schemas.analyze import AnalyzeResponseData
from app.services.demo_storage import materialize_project_demos
from app.services.github_client import GithubClient
from app.services.mockup_storage import materialize_project_mockups
from app.services.openai_client import OpenAIClient


class PortfolioService:
    def __init__(self) -> None:
        self.github = GithubClient()
        self.openai = OpenAIClient()

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
        accepted, skipped = await self.github.collect_many(repositories)
        if not accepted:
            reasons = [item.get("reason", "") for item in skipped if item.get("reason")]
            top_reasons = ", ".join(sorted(set(reasons))[:2]) if reasons else "unknown reason"
            raise ValueError(f"No repositories were successfully analyzed: {top_reasons}")

        generated = await self.openai.generate(accepted)
        generated = self._sanitize_generated_projects(generated)
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
        return payload, skipped
