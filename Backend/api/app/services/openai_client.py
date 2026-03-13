from pathlib import Path
import json

import httpx

from app.core.config import settings


OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["projects", "services", "skills"],
    "properties": {
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "description", "stack", "tag"],
                "properties": {
                    "title": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["ru", "en"],
                        "properties": {"ru": {"type": "string"}, "en": {"type": "string"}},
                    },
                    "description": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["ru", "en"],
                        "properties": {"ru": {"type": "string"}, "en": {"type": "string"}},
                    },
                    "stack": {"type": "string"},
                    "tag": {"type": "string", "format": "uri"},
                },
            },
        },
        "services": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "description"],
                "properties": {
                    "id": {"type": "string"},
                    "title": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["ru", "en"],
                        "properties": {"ru": {"type": "string"}, "en": {"type": "string"}},
                    },
                    "description": {
                        "type": "object",
                        "additionalProperties": False,
                        "required": ["ru", "en"],
                        "properties": {"ru": {"type": "string"}, "en": {"type": "string"}},
                    },
                },
            },
        },
        "skills": {
            "type": "object",
            "additionalProperties": False,
            "required": ["nocode", "ai", "automation"],
            "properties": {
                "nocode": {"type": "array", "items": {"type": "string"}},
                "ai": {"type": "array", "items": {"type": "string"}},
                "automation": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
}


class OpenAIClient:
    def __init__(self) -> None:
        use_proxy = bool(settings.proxy_base_url and settings.proxy_api_key)
        self.base_url = (
            settings.proxy_base_url.rstrip("/") if use_proxy and settings.proxy_base_url else "https://api.openai.com/v1"
        )
        self.api_key = settings.proxy_api_key if use_proxy else settings.openai_api_key
        if not self.api_key:
            raise RuntimeError("OpenAI credentials are missing")

    def _read_prompt(self, path: str) -> str:
        return Path(path).read_text(encoding="utf-8")

    def _system_prompt(self) -> str:
        blocks = [
            self._read_prompt(settings.prompt_projects_path).strip(),
            self._read_prompt(settings.prompt_services_path).strip(),
            self._read_prompt(settings.prompt_skills_path).strip(),
            "Return only valid JSON.",
        ]
        return "\n\n".join([part for part in blocks if part])

    def _user_prompt(self, repositories: list[dict]) -> str:
        chunks: list[str] = ["Input repositories:"]
        for idx, item in enumerate(repositories, start=1):
            chunks.append(
                "\n".join(
                    [
                        f"#{idx}",
                        f"url: {item['repo_url']}",
                        f"description: {item['description']}",
                        f"topics: {', '.join(item['topics'])}",
                        f"languages: {', '.join(item['languages'])}",
                        f"readme: {item['readme']}",
                    ]
                )
            )
        return "\n\n".join(chunks)

    async def generate(self, repositories: list[dict]) -> dict:
        payload = {
            "model": settings.openai_model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": self._user_prompt(repositories)},
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "portfolio_generation", "strict": True, "schema": OUTPUT_SCHEMA},
            },
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(90.0)) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code >= 400:
                raise RuntimeError(f"OpenAI request failed: {response.status_code} {response.text}")
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if not content:
                raise RuntimeError("OpenAI returned empty content")
            return json.loads(content)
