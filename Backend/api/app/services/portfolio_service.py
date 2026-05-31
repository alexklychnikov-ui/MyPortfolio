from app.core.config import settings
from app.schemas.analyze import AnalyzeResponseData
from app.services.github_client import GithubClient
from app.services.mockup_storage import materialize_project_mockups
from app.services.openai_client import OpenAIClient
from urllib.parse import urlparse


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
        generated = await materialize_project_mockups(
            generated,
            accepted,
            settings.static_export_dir,
            self.github.headers,
        )
        payload = AnalyzeResponseData.model_validate(generated)
        return payload, skipped
