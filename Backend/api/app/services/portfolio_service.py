from app.schemas.analyze import AnalyzeResponseData
from app.services.github_client import GithubClient
from app.services.openai_client import OpenAIClient


class PortfolioService:
    def __init__(self) -> None:
        self.github = GithubClient()
        self.openai = OpenAIClient()

    async def analyze_repositories(self, repositories: list[str]) -> tuple[AnalyzeResponseData, list[dict[str, str]]]:
        accepted, skipped = await self.github.collect_many(repositories)
        if not accepted:
            raise ValueError("No repositories were successfully analyzed")

        generated = await self.openai.generate(accepted)
        payload = AnalyzeResponseData.model_validate(generated)
        return payload, skipped
