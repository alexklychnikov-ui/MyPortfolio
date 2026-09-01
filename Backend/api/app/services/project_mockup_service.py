import base64
from datetime import UTC, datetime
from pathlib import PurePosixPath

import httpx

from app.core.config import settings
from app.services.github_client import GithubClient
from app.services.mockup_image_generator import MockupImageGenerator
from app.services.readme_parser import extract_readme_title, upsert_first_readme_image

MOCKUP_DIR_CANDIDATES = ("docs/mockups", "Docs/mockups")
README_CANDIDATES = ("README.md", "readme.md", "Readme.md")


class ProjectMockupService:
    def __init__(self) -> None:
        self.github = GithubClient()
        self.generator = MockupImageGenerator()

    async def create_png_for_repository(self, repository_url: str) -> dict:
        normalized = self.github.normalize(repository_url)
        if not normalized:
            raise ValueError("Invalid repository URL")

        owner, repo, _ = normalized
        if not settings.github_token:
            raise RuntimeError("GITHUB_TOKEN is required to update README in repository")

        async with httpx.AsyncClient(
            base_url=self.github.base_url,
            headers=self.github.headers,
            timeout=httpx.Timeout(60.0),
        ) as client:
            repo_response = await client.get(f"/repos/{owner}/{repo}")
            if repo_response.status_code >= 400:
                raise ValueError("Repository is not accessible")
            repo_data = repo_response.json()
            default_branch = str(repo_data.get("default_branch") or "main")
            description = str(repo_data.get("description") or "")
            topics = list(repo_data.get("topics") or [])
            languages_response = await client.get(f"/repos/{owner}/{repo}/languages")
            languages = list(languages_response.json().keys()) if languages_response.status_code < 400 else []

            readme_name, readme_meta = await self._fetch_readme(client, owner, repo)
            readme_text = self._decode_readme(readme_meta)
            title = extract_readme_title(readme_text) or repo

            prompt = self.generator.build_prompt(title, description, topics, languages)
            png_bytes = await self.generator.generate_png(prompt)

            mockup_dir = await self._resolve_mockup_dir(client, owner, repo, readme_text)
            timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
            image_path = f"{mockup_dir}/mockup-{timestamp}.png"

            await self._put_file(
                client,
                owner,
                repo,
                image_path,
                png_bytes,
                default_branch,
                f"chore(mockup): add portfolio hero image for {repo}",
            )

            updated_readme, replaced = upsert_first_readme_image(readme_text, image_path)
            await self._put_file(
                client,
                owner,
                repo,
                readme_name,
                updated_readme.encode("utf-8"),
                default_branch,
                f"docs(readme): update first mockup image for {repo}",
                sha=str(readme_meta.get("sha", "")),
            )

            return {
                "repository": f"https://github.com/{owner}/{repo}",
                "branch": default_branch,
                "image_path": image_path,
                "readme_path": readme_name,
                "replaced_existing_image": replaced,
                "title": title,
            }

    async def _fetch_readme(self, client: httpx.AsyncClient, owner: str, repo: str) -> tuple[str, dict]:
        for readme_name in README_CANDIDATES:
            response = await client.get(f"/repos/{owner}/{repo}/contents/{readme_name}")
            if response.status_code < 400:
                payload = response.json()
                if isinstance(payload, dict):
                    return readme_name, payload
        raise ValueError("README.md not found in repository")

    @staticmethod
    def _decode_readme(readme_meta: dict) -> str:
        content = readme_meta.get("content")
        if not isinstance(content, str):
            return ""
        return base64.b64decode(content).decode("utf-8", errors="ignore")

    async def _resolve_mockup_dir(self, client: httpx.AsyncClient, owner: str, repo: str, readme_text: str) -> str:
        from app.services.readme_parser import extract_first_readme_image_src

        existing_src = extract_first_readme_image_src(readme_text)
        if existing_src and not existing_src.startswith(("http://", "https://", "//")):
            parent = str(PurePosixPath(existing_src).parent)
            if parent and parent != ".":
                return parent

        for candidate in MOCKUP_DIR_CANDIDATES:
            response = await client.get(f"/repos/{owner}/{repo}/contents/{candidate}")
            if response.status_code < 400:
                return candidate
        return MOCKUP_DIR_CANDIDATES[0]

    async def _put_file(
        self,
        client: httpx.AsyncClient,
        owner: str,
        repo: str,
        path: str,
        content: bytes,
        branch: str,
        message: str,
        sha: str | None = None,
    ) -> None:
        payload: dict[str, str] = {
            "message": message,
            "content": base64.b64encode(content).decode("ascii"),
            "branch": branch,
        }
        if sha:
            payload["sha"] = sha
        response = await client.put(f"/repos/{owner}/{repo}/contents/{path}", json=payload)
        if response.status_code >= 400:
            raise RuntimeError(f"GitHub write failed for {path}: {response.status_code} {response.text}")
