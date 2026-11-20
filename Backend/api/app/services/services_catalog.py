from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


CATALOG_PATH = Path(__file__).resolve().parent.parent / "config" / "services_catalog.json"


@lru_cache(maxsize=1)
def load_services_catalog() -> dict[str, Any]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def list_canonical_keys() -> list[str]:
    templates = load_services_catalog().get("templates") or {}
    return list(templates.keys())


def get_template(canonical_key: str) -> dict[str, Any] | None:
    templates = load_services_catalog().get("templates") or {}
    return templates.get(canonical_key)


def resolve_canonical_key(raw_key: str | None, title_ru: str = "", title_en: str = "", evidence: str = "") -> str | None:
    key = (raw_key or "").strip().lower().replace("_", "-")
    templates = load_services_catalog().get("templates") or {}
    if key in templates:
        return key
    if key.startswith("svc-"):
        stripped = key[4:]
        if stripped in templates:
            return stripped
    blob = f"{key} {title_ru} {title_en} {evidence}".lower()
    best: tuple[int, str] | None = None
    for cand, meta in templates.items():
        score = 0
        if cand.replace("-", " ") in blob or cand in blob:
            score += 5
        for kw in meta.get("keywords") or []:
            if str(kw).lower() in blob:
                score += 2
        if score and (best is None or score > best[0]):
            best = (score, cand)
    return best[1] if best else None


def format_price(amount_rub: int) -> dict[str, str]:
    spaced = f"{amount_rub:,}".replace(",", " ")
    return {"ru": f"от {spaced} ₽", "en": f"from ₽{spaced.replace(' ', ',')}"}


def format_timeline(days_min: int, days_max: int) -> dict[str, str]:
    ru_unit = "рабочих дня" if days_max < 5 else "рабочих дней"
    if days_min == days_max:
        return {
            "ru": f"{days_min} {ru_unit}",
            "en": f"{days_min} business days",
        }
    return {
        "ru": f"{days_min}–{days_max} {ru_unit}",
        "en": f"{days_min}–{days_max} business days",
    }


def apply_pricing(canonical_key: str) -> dict[str, Any] | None:
    template = get_template(canonical_key)
    if not template:
        return None
    price = int(template["price_from_rub"])
    dmin = int(template["days_min"])
    dmax = int(template["days_max"])
    return {
        "id": str(template["id"]),
        "price": format_price(price),
        "timeline": format_timeline(dmin, dmax),
        "price_from_rub": price,
        "days_min": dmin,
        "days_max": dmax,
        "scope_ru": str(template.get("scope_ru") or ""),
        "scope_en": str(template.get("scope_en") or ""),
        "title_hint_ru": str(template.get("title_hint_ru") or ""),
        "title_hint_en": str(template.get("title_hint_en") or ""),
    }
