from app.schemas.analyze import AnalyzeResponseData
from app.services.github_client import GithubClient
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

    def _normalize_project_tags(self, generated: dict, accepted: list[dict]) -> dict:
        projects = generated.get("projects")
        if not isinstance(projects, list):
            return generated

        fallback_urls = [item.get("repo_url", "").strip() for item in accepted if item.get("repo_url")]
        if not fallback_urls:
            return generated

        for idx, project in enumerate(projects):
            if not isinstance(project, dict):
                continue
            current_tag = project.get("tag")
            if self._is_http_url(current_tag):
                continue
            replacement = fallback_urls[idx] if idx < len(fallback_urls) else fallback_urls[0]
            project["tag"] = replacement

        return generated

    async def analyze_repositories(self, repositories: list[str]) -> tuple[AnalyzeResponseData, list[dict[str, str]]]:
        accepted, skipped = await self.github.collect_many(repositories)
        if not accepted:
            reasons = [item.get("reason", "") for item in skipped if item.get("reason")]
            top_reasons = ", ".join(sorted(set(reasons))[:2]) if reasons else "unknown reason"
            raise ValueError(f"No repositories were successfully analyzed: {top_reasons}")

        generated = await self.openai.generate(accepted)
        generated = self._normalize_project_tags(generated, accepted)
        payload = AnalyzeResponseData.model_validate(generated)
        return payload, skipped
