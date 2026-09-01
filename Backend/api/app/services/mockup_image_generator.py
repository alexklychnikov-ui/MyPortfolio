import base64
from io import BytesIO
from pathlib import Path

import httpx
from PIL import Image

from app.core.config import settings

TARGET_WIDTH = 1280
TARGET_HEIGHT = 720
DALLE_LANDSCAPE_SIZE = "1792x1024"
GPT_IMAGE_LANDSCAPE_SIZE = "1536x1024"

DEFAULT_MOCKUP_STYLE = """Создай премиальный hero-баннер IT-продукта для портфолио (16:9, landscape).
Референс стиля: современный SaaS-баннер уровня NODEX — glassmorphism, энергия, глубина, выразительная типографика.

СТИЛЬ И КОМПОЗИЦИЯ:
- Glassmorphism: полупрозрачные стеклянные панели, мягкие тени, bloom-свечение
- Палитра: белый + синий (#3B82F6, #DBEAFE, #1D4ED8) + яркие акценты (оранжевый, жёлтый, бирюзовый) для стрелок, воронки, KPI
- Центр: ноутбук с CRM/UI дашбордом + смартфон с Telegram-чатом рядом
- Слева: 4 глянцевые 3D-иконки фич в скруглённых квадратах
- Справа сверху: 3 стеклянные KPI-карточки с крупными цифрами
- Опционально: 3D-воронка продаж/процесса, всплывающее окно «ИИ-рекомендации»

ДИНАМИКА (ОБЯЗАТЕЛЬНО):
- Крупные изогнутые светящиеся стрелки (градиент оранжевый→жёлтый и синий) обвивают ноутбук и связывают элементы
- Элементы «парят» в 3D-пространстве, не лежат плоско
- Световые лучи, частицы, линии потока данных между иконками, буллетами и экранами
- Ощущение движения и скорости: process flow, connectivity, digital energy
- Глубина резкости: передний план ярче, фон мягче

ТИПОГРАФИКА (ОБЯЗАТЕЛЬНО — РАЗНЫЕ ШРИФТЫ И ИЕРАРХИЯ):
- Название бренда/продукта: очень жирный широкий sans-serif, CAPS
- Главный заголовок: экстра-bold, крупный, доминирует в композиции
- Подзаголовок/слоган: medium или light weight, меньший кегль
- KPI-цифры: крупные bold numbers (например «45», «32%», «730 000 ₽»)
- Подписи кнопок и буллетов: чистый лёгкий sans-serif, хорошо читаемый
- Явный контраст весов: bold / semibold / regular / light в одном баннере
- ВСЕ тексты ТОЛЬКО на русском (кириллица), без английских слов

БУЛЛЕТЫ И WORKFLOW:
- 4–6 стеклянных карточек-буллетов с подписями шагов процесса на русском
- Между буллетами — изогнутые стрелки-коннекторы со свечением (шаг → шаг → результат)
- Буллеты связаны в единый визуальный поток со стрелками и линиями данных

БЕЗОПАСНАЯ ЗОНА КАДРА (КРИТИЧНО):
- Оставь поля минимум 10% со ВСЕХ сторон — ничего не касается краёв изображения
- Весь текст (особенно заголовок слева) полностью внутри кадра, каждая буква видна целиком
- Заголовок и подзаголовок — с явным отступом от левого края, не прижимать к border
- KPI-карточки и элементы справа — тоже с отступом от правого края
- Композиция сбалансирована по центру, safe area ~80% ширины и ~85% высоты
- ЗАПРЕЩЕНО обрезать текст или UI у краёв кадра

ФОН:
- НЕ однотонный: градиент + схемы плат/нейросети + узлы связей + цифровая сетка + bokeh
- Многослойность, объём, tech-атмосфера

ЗАПРЕТЫ:
- Без watermark и чужих логотипов
- Без англоязычных UI-лейблов
- Без статичной плоской композиции без движения
- Без одного одинакового шрифта на всём баннере

Качество: premium B2B SaaS marketing, яркий, современный, 3D-рендер высокого уровня."""


class MockupImageGenerator:
    def __init__(self) -> None:
        if settings.openai_api_key:
            self.base_url = "https://api.openai.com/v1"
            self.api_key = settings.openai_api_key
            self.model = settings.openai_image_model
            self.size = DALLE_LANDSCAPE_SIZE
            self.quality = "hd"
            self.use_b64_json = True
        elif settings.proxy_base_url and settings.proxy_api_key:
            self.base_url = settings.proxy_base_url.rstrip("/")
            self.api_key = settings.proxy_api_key
            self.model = "gpt-image-1"
            self.size = GPT_IMAGE_LANDSCAPE_SIZE
            self.quality = "high"
            self.use_b64_json = False
        else:
            raise RuntimeError("OPENAI_API_KEY or PROXY_BASE_URL+PROXY_API_KEY is required for image generation")

    def _read_style_prompt(self) -> str:
        path = Path(settings.prompt_mockup_path)
        if path.exists():
            return path.read_text(encoding="utf-8").strip()
        return DEFAULT_MOCKUP_STYLE

    def build_prompt(self, title: str, description: str, topics: list[str], languages: list[str]) -> str:
        style = self._read_style_prompt()
        topic_text = ", ".join(topics[:8]) if topics else "программный продукт"
        return (
            f"{style}\n\n"
            f"Название продукта (крупно на баннере): {title}\n"
            f"Описание: {description or title}\n"
            f"Тематика: {topic_text}\n"
            "Сгенерируй буллеты workflow и подписи UI строго на русском, под эту тематику.\n"
            "UI на экранах ноутбука и телефона — тоже только русский язык.\n"
            "Добавь динамику как в premium SaaS-баннере: изогнутые светящиеся стрелки, парящие элементы, KPI-карточки, контрастную типографику (bold/light).\n"
            "Важно: весь текст и UI строго внутри safe zone с полями 10% от краёв, заголовок не обрезать."
        )

    async def generate_png(self, prompt: str) -> bytes:
        payload: dict[str, str | int] = {
            "model": self.model,
            "prompt": prompt,
            "size": self.size,
            "quality": self.quality,
            "n": 1,
        }
        if self.use_b64_json:
            payload["response_format"] = "b64_json"
        async with httpx.AsyncClient(timeout=httpx.Timeout(180.0)) as client:
            response = await client.post(
                f"{self.base_url}/images/generations",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json=payload,
            )
            if response.status_code >= 400:
                raise RuntimeError(f"OpenAI image request failed: {response.status_code} {response.text}")
            data = response.json()
            item = data.get("data", [{}])[0]
            if item.get("b64_json"):
                raw = base64.b64decode(item["b64_json"])
            elif item.get("url"):
                image_response = await client.get(str(item["url"]))
                if image_response.status_code >= 400:
                    raise RuntimeError("Failed to download generated image")
                raw = image_response.content
            else:
                raise RuntimeError("OpenAI image response is empty")
        return self._resize_to_target(raw)

    @staticmethod
    def _resize_to_target(image_bytes: bytes) -> bytes:
        target_ratio = TARGET_WIDTH / TARGET_HEIGHT
        with Image.open(BytesIO(image_bytes)) as image:
            rgb = image.convert("RGB")
            width, height = rgb.size
            current_ratio = width / height

            if current_ratio > target_ratio:
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                rgb = rgb.crop((left, 0, left + new_width, height))
            elif current_ratio < target_ratio:
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                rgb = rgb.crop((0, top, width, top + new_height))

            resized = rgb.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
            out = BytesIO()
            resized.save(out, format="PNG", optimize=True)
            return out.getvalue()
