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

DEFAULT_MOCKUP_STYLE = """Create a premium SaaS product hero banner mockup for a software portfolio.

Visual style (strict):
- Glassmorphism UI, arctic white and electric blue palette (#3B82F6, #DBEAFE, #EFF6FF)
- Luminous gradient background with subtle circuit lines and soft glow
- Center: modern laptop with realistic dashboard UI matching the product domain
- Secondary device: smartphone with messenger or mobile UI when relevant
- Floating 3D glossy rounded-square feature icons
- Frosted-glass KPI cards with abstract numbers (no readable fine print)
- Clean corporate tech marketing look, high-end 3D render

Constraints:
- Exact 16:9 composition, landscape
- No watermark, no logo text unless it is the product name
- Avoid garbled or unreadable UI text; prefer abstract UI blocks
- Professional, bright, trustworthy B2B/SaaS aesthetic"""


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
        topic_text = ", ".join(topics[:8]) if topics else "software product"
        stack_text = ", ".join(languages[:6]) if languages else "modern web stack"
        return (
            f"{style}\n\n"
            f"Product title: {title}\n"
            f"Product summary: {description or title}\n"
            f"Domain keywords: {topic_text}\n"
            f"Tech hints: {stack_text}\n"
            "Show a dashboard that visually matches this product category."
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
        with Image.open(BytesIO(image_bytes)) as image:
            resized = image.convert("RGB").resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
            out = BytesIO()
            resized.save(out, format="PNG", optimize=True)
            return out.getvalue()
