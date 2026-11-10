import asyncio
import re
from typing import Any

import httpx
from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command, CommandStart
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
CREATE_PNG_PREFIX = re.compile(r"^/?createPng(?:@\w+)?(?:\s+|$)", re.IGNORECASE)

# One analyze at a time — spam retries were burning GitHub anonymous quota and timing out.
_analyze_lock = asyncio.Lock()
_create_png_lock = asyncio.Lock()


def extract_repositories(text: str) -> list[str]:
    return list(dict.fromkeys(REPO_URL_PATTERN.findall(text)))


def is_create_png_request(text: str) -> bool:
    return bool(CREATE_PNG_PREFIX.match(text.strip()))


def _format_api_error(status_code: int, detail: str) -> str:
    text = (detail or "").strip()
    if "rate limit" in text.lower():
        return (
            f"GitHub rate limit. Портфолио в БД не трогал.\n"
            f"Подожди reset / поставь рабочий GITHUB_TOKEN и повтори один раз.\n"
            f"Детали: {text[:900]}"
        )
    return f"Ошибка API: {status_code}\n{text[:1200]}"


@router.message(CommandStart())
async def start_handler(message: Message):
    await message.answer(
        "Команды:\n"
        "• Пришли список GitHub-ссылок — обновлю projects/services/skills\n"
        "• /createPng https://github.com/owner/repo — сгенерирую mockup 1280×720 "
        "и обновлю первую картинку в README"
    )


@router.message(Command("createPng"))
async def create_png_command(message: Message):
    await handle_create_png(message)


@router.message()
async def process_message(message: Message):
    text = message.text or ""
    if is_create_png_request(text):
        await handle_create_png(message)
        return

    repositories = extract_repositories(text)
    if not repositories:
        await message.answer(
            "Не вижу ссылок GitHub.\n"
            "Формат: https://github.com/owner/repo\n"
            "Или: /createPng https://github.com/owner/repo"
        )
        return

    if _analyze_lock.locked():
        await message.answer(
            "Уже идёт анализ предыдущего запроса. Дождись ответа — повтор сейчас только жжёт GitHub quota."
        )
        return

    async with _analyze_lock:
        await message.answer(f"Принял {len(repositories)} ссылок. Запускаю анализ.")
        payload = {"repositories": repositories}
        headers = {"x-internal-api-key": settings.api_internal_key}

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
                response = await client.post(
                    f"{settings.backend_api_url}/v1/github/analyze",
                    json=payload,
                    headers=headers,
                )
                if response.status_code >= 400:
                    detail = ""
                    try:
                        detail = str(response.json().get("detail", ""))
                    except Exception:
                        detail = response.text[:1200]
                    await message.answer(_format_api_error(response.status_code, detail))
                    return
                data: dict[str, Any] = response.json()
        except httpx.TimeoutException:
            await message.answer(
                "Backend не ответил за 300с (часто ffmpeg/OpenAI). Портфолио могло не обновиться — "
                "проверь логи backend-api и повтори один раз позже."
            )
            return
        except Exception as exc:
            await message.answer(f"Ошибка запроса к Backend API: {exc}")
            return

        skipped = data.get("skipped", [])
        projects = data.get("data", {}).get("projects", [])
        services = data.get("data", {}).get("services", [])
        skills = data.get("data", {}).get("skills", {})
        skill_categories = [
            "languageRuntime",
            "aiLlm",
            "backend",
            "botsIntegrations",
            "infrastructure",
            "automation",
            "devTools",
        ]
        skill_summary = ", ".join(
            f"{category}={len(skills.get(category, []))}" for category in skill_categories
        )

        lines = [
            (
                f"Завершил: обработано {len(repositories) - len(skipped)} из {len(repositories)}."
                " Обновлено в БД:"
            ),
            f"- Projects: {len(projects)}",
            f"- Services: {len(services)}",
            f"- Skills: {skill_summary}",
        ]
        if skipped:
            lines.append(f"- Skipped: {len(skipped)}")
            for item in skipped[:5]:
                reason = str(item.get("reason") or "")[:120]
                url = str(item.get("url") or "")
                lines.append(f"  • {url}: {reason}")
        await message.answer("\n".join(lines))


async def handle_create_png(message: Message):
    text = message.text or ""
    repositories = extract_repositories(text)
    if not repositories:
        await message.answer("Укажи репозиторий: /createPng https://github.com/owner/repo")
        return
    if len(repositories) > 1:
        await message.answer("createPng работает с одним репозиторием за раз.")
        return

    if _create_png_lock.locked():
        await message.answer("createPng уже выполняется. Дождись ответа.")
        return

    repository = repositories[0]
    async with _create_png_lock:
        await message.answer(f"Генерирую mockup 1280×720 для {repository}… Это может занять 1–2 минуты.")

        headers = {"x-internal-api-key": settings.api_internal_key}
        payload = {"repository": repository}
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(240.0)) as client:
                response = await client.post(
                    f"{settings.backend_api_url}/v1/github/create-png",
                    json=payload,
                    headers=headers,
                )
                if response.status_code >= 400:
                    detail = ""
                    try:
                        detail = str(response.json().get("detail", ""))
                    except Exception:
                        detail = response.text[:1200]
                    await message.answer(f"Ошибка createPng: {response.status_code}\n{detail[:1200]}")
                    return
                data = response.json().get("data", {})
        except Exception as exc:
            await message.answer(f"Ошибка запроса createPng: {exc}")
            return

        image_path = data.get("image_path", "")
        readme_path = data.get("readme_path", "README.md")
        replaced = "заменил" if data.get("replaced_existing_image") else "добавил"
        await message.answer(
            "\n".join(
                [
                    f"Готово для {repository}",
                    f"- README: {replaced} первую картинку в {readme_path}",
                    f"- Файл: {image_path}",
                    "Отправь ссылку на репо ещё раз, чтобы обновить портфолио.",
                ]
            )
        )


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
