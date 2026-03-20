import re
from typing import Any

import httpx
from aiogram import Bot, Dispatcher, Router
from aiogram.filters import CommandStart
from aiogram.types import Message, Update
from fastapi import FastAPI, Header, HTTPException
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    telegram_bot_token: str = Field(alias="TELEGRAM_BOT_TOKEN")
    telegram_webhook_secret: str = Field(alias="TELEGRAM_WEBHOOK_SECRET")
    backend_api_url: str = Field(default="http://backend-api:8000", alias="BACKEND_API_URL")
    api_internal_key: str = Field(alias="API_INTERNAL_KEY")


settings = Settings()
app = FastAPI(title="Portfolio Telegram Bot", version="1.0.0")
bot = Bot(token=settings.telegram_bot_token)
dp = Dispatcher()
router = Router()
dp.include_router(router)

REPO_URL_PATTERN = re.compile(r"https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?")


def extract_repositories(text: str) -> list[str]:
    return list(dict.fromkeys(REPO_URL_PATTERN.findall(text)))


@router.message(CommandStart())
async def start_handler(message: Message):
    await message.answer(
        "Пришли список ссылок на GitHub-репозитории одним сообщением. "
        "Я соберу projects/services/skills и обновлю данные портфолио."
    )


@router.message()
async def process_message(message: Message):
    text = message.text or ""
    repositories = extract_repositories(text)
    if not repositories:
        await message.answer("Не вижу ссылок GitHub. Формат: https://github.com/owner/repo")
        return

    await message.answer(f"Принял {len(repositories)} ссылок. Запускаю анализ.")
    payload = {"repositories": repositories}
    headers = {"x-internal-api-key": settings.api_internal_key}

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            response = await client.post(f"{settings.backend_api_url}/v1/github/analyze", json=payload, headers=headers)
            if response.status_code >= 400:
                detail = ""
                try:
                    detail = response.json().get("detail", "")
                except Exception:
                    detail = response.text[:1200]
                await message.answer(f"Ошибка API: {response.status_code}\n{detail[:1200]}")
                return
            data: dict[str, Any] = response.json()
    except Exception as exc:
        await message.answer(f"Ошибка запроса к Backend API: {exc}")
        return

    skipped = data.get("skipped", [])
    projects = data.get("data", {}).get("projects", [])
    services = data.get("data", {}).get("services", [])
    skills = data.get("data", {}).get("skills", {})

    lines = [
        (
            f"Завершил: обработано {len(repositories) - len(skipped)} из {len(repositories)}."
            " Обновлено в БД:"
        ),
        f"- Projects: {len(projects)}",
        f"- Services: {len(services)}",
        f"- Skills: nocode={len(skills.get('nocode', []))}, ai={len(skills.get('ai', []))}, automation={len(skills.get('automation', []))}",
    ]
    if skipped:
        lines.append(f"- Skipped: {len(skipped)}")
    await message.answer("\n".join(lines))


@app.post("/webhook/telegram")
async def telegram_webhook(
    update: dict[str, Any],
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    if x_telegram_bot_api_secret_token != settings.telegram_webhook_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")
    telegram_update = Update.model_validate(update, context={"bot": bot})
    await dp.feed_update(bot, telegram_update)
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok"}
