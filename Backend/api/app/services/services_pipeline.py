from __future__ import annotations

import logging
import re
from typing import Any

from app.services.services_catalog import (
    apply_pricing,
    list_canonical_keys,
    load_services_catalog,
    resolve_canonical_key,
)

logger = logging.getLogger(__name__)

_ROADMAP_RE = re.compile(r"\b(roadmap|todo|coming soon|planned|запланирован|в планах|скоро)\b", re.I)
_STUB_RE = re.compile(r"\b(stub|mock|placeholder|not implemented|заглушк|не реализован)\b", re.I)


def _loc(value: Any, lang: str) -> str:
    if isinstance(value, dict):
        return str(value.get(lang) or "").strip()
    return str(value or "").strip()


def _skills_blob(skills: dict[str, Any] | None) -> str:
    if not isinstance(skills, dict):
        return ""
    parts: list[str] = []
    for values in skills.values():
        if isinstance(values, list):
            parts.extend(str(v) for v in values)
    return " ".join(parts).lower()


def _repo_name_set(accepted_repos: list[dict[str, Any]] | None) -> set[str]:
    names: set[str] = set()
    for item in accepted_repos or []:
        repo = str(item.get("repo") or "").strip().lower()
        url = str(item.get("repo_url") or "").strip().lower().rstrip("/")
        if repo:
            names.add(repo)
        if url:
            names.add(url)
            names.add(url.split("/")[-1])
    return names


def _sources_match(sources: list[Any], repo_names: set[str]) -> bool:
    if not sources or not repo_names:
        return False
    for raw in sources:
        token = str(raw or "").strip().lower().rstrip("/")
        if not token:
            continue
        if token in repo_names:
            return True
        short = token.split("/")[-1]
        if short in repo_names:
            return True
        for name in repo_names:
            if name and (name in token or token in name):
                return True
    return False


# Offers that may be proposed from declared skills alone (no project case study).
_DECLARED_SKILL_ONLY_KEYS = frozenset({"n8n-make", "vps-deployment"})

_SKILL_TOKENS = {
    "telegram-leads": ("telegram", "aiogram", "bot"),
    "telegram-ai": ("openai", "telegram", "aiogram", "prompt"),
    "expense-bot": ("telegram", "aiogram", "sqlite", "postgres"),
    "receipt-recognition": ("openai", "python"),
    "web-parser": ("python",),
    "news-digest": ("python", "telegram"),
    "content-autopost": ("telegram", "python", "fastapi"),
    "ai-content": ("openai", "prompt", "langchain"),
    "portfolio-website": ("javascript", "typescript", "next", "python"),
    "telegram-site-management": ("telegram", "fastapi", "python"),
    "api-integration": ("fastapi", "rest", "api", "python"),
    "n8n-make": ("n8n", "make"),
    "sales-dashboard": ("python", "streamlit", "postgres"),
    "sales-forecast": ("python", "openai"),
    "mini-crm": ("fastapi", "postgres", "python"),
    "personal-ai-assistant": ("openai", "telegram", "aiogram"),
    "rag-pilot": ("rag", "lightrag", "openai", "postgres"),
    "vps-deployment": ("docker", "linux", "vps"),
}


def _has_declared_skill_support(canonical_key: str, skills_blob: str) -> bool:
    need = _SKILL_TOKENS.get(canonical_key, ())
    return any(token in skills_blob for token in need)


def enrich_description(
    title_ru: str,
    title_en: str,
    desc_ru: str,
    desc_en: str,
    scope_ru: str,
    scope_en: str,
) -> tuple[str, str]:
    out_ru = desc_ru
    out_en = desc_en
    if scope_ru and scope_ru.split(",")[0].strip().lower() not in out_ru.lower():
        if out_ru and not out_ru.endswith("."):
            out_ru += "."
        out_ru = f"{out_ru} В базовую стоимость входят {scope_ru}.".strip()
    if scope_en and scope_en.split(",")[0].strip().lower() not in out_en.lower():
        if out_en and not out_en.endswith("."):
            out_en += "."
        out_en = f"{out_en} Includes {scope_en}.".strip()
    if not out_ru:
        out_ru = f"{title_ru}. В базовую стоимость входят {scope_ru}." if scope_ru else title_ru
    if not out_en:
        out_en = f"{title_en}. Includes {scope_en}." if scope_en else title_en
    return out_ru[:700], out_en[:700]


def process_service_candidates(
    raw_services: list[Any] | None,
    *,
    accepted_repos: list[dict[str, Any]] | None = None,
    skills: dict[str, Any] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Validate AI service candidates and produce public services.json items."""
    catalog = load_services_catalog()
    target_min = int(catalog.get("target_services_min") or 8)
    target_max = int(catalog.get("target_services_max") or 18)
    skills_blob = _skills_blob(skills)
    repo_names = _repo_name_set(accepted_repos)

    diagnostics: dict[str, Any] = {
        "input_candidates": 0,
        "kept": 0,
        "dropped_duplicates": 0,
        "dropped_unconfirmed": 0,
        "dropped_roadmap_or_stub": 0,
        "dropped_unknown_key": 0,
        "canonical_keys": list_canonical_keys(),
        "target_min": target_min,
        "target_max": target_max,
        "reasons": [],
    }

    if not isinstance(raw_services, list):
        diagnostics["reasons"].append("services_not_a_list")
        return [], diagnostics

    diagnostics["input_candidates"] = len(raw_services)
    public: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    for item in raw_services:
        if not isinstance(item, dict):
            diagnostics["dropped_unconfirmed"] += 1
            continue

        title_ru = _loc(item.get("title"), "ru") or _loc(item.get("title"), "en")
        title_en = _loc(item.get("title"), "en") or title_ru
        desc_ru = _loc(item.get("description"), "ru")
        desc_en = _loc(item.get("description"), "en") or desc_ru
        evidence = str(item.get("evidence_summary") or "")
        evidence_type = str(item.get("evidence_type") or "project").strip().lower()
        status = str(item.get("implementation_status") or "ready").strip().lower()
        sources = item.get("source_repositories") or []
        if not isinstance(sources, list):
            sources = []

        blob = f"{title_ru} {title_en} {desc_ru} {desc_en} {evidence} {status}"
        if status in {"roadmap", "planned", "todo"} or (
            _ROADMAP_RE.search(blob) and status != "ready" and status != "partial"
        ):
            diagnostics["dropped_roadmap_or_stub"] += 1
            continue
        if status in {"stub", "mock"} or (
            _STUB_RE.search(evidence) and status not in {"ready", "partial"}
        ):
            diagnostics["dropped_roadmap_or_stub"] += 1
            continue
        # Explicit roadmap-only evidence without ready status
        if _ROADMAP_RE.search(evidence) and not _sources_match(sources, repo_names) and status != "ready":
            diagnostics["dropped_roadmap_or_stub"] += 1
            continue
        if "roadmap only" in evidence.lower() or "только roadmap" in evidence.lower():
            diagnostics["dropped_roadmap_or_stub"] += 1
            continue
        if "stub only" in evidence.lower() or "mock only" in evidence.lower():
            diagnostics["dropped_roadmap_or_stub"] += 1
            continue

        canonical = resolve_canonical_key(
            str(item.get("canonical_key") or item.get("id") or ""),
            title_ru=title_ru,
            title_en=title_en,
            evidence=f"{evidence} {' '.join(str(s) for s in sources)}",
        )
        if not canonical:
            diagnostics["dropped_unknown_key"] += 1
            continue
        if canonical in seen_keys:
            diagnostics["dropped_duplicates"] += 1
            continue

        priced = apply_pricing(canonical)
        if not priced:
            diagnostics["dropped_unknown_key"] += 1
            continue

        skill_ok = _has_declared_skill_support(canonical, skills_blob)
        project_ok = _sources_match(sources, repo_names)

        if evidence_type == "declared_skill":
            # Only a small whitelist may be sold from skills alone (no invented case study).
            if canonical not in _DECLARED_SKILL_ONLY_KEYS or not skill_ok:
                diagnostics["dropped_unconfirmed"] += 1
                continue
        elif evidence_type == "mixed":
            if not project_ok:
                diagnostics["dropped_unconfirmed"] += 1
                continue
            if not skill_ok:
                diagnostics["dropped_unconfirmed"] += 1
                continue
        else:
            # project
            if not project_ok:
                diagnostics["dropped_unconfirmed"] += 1
                continue

        desc_ru, desc_en = enrich_description(
            title_ru or priced["title_hint_ru"],
            title_en or priced["title_hint_en"],
            desc_ru,
            desc_en,
            priced["scope_ru"],
            priced["scope_en"],
        )
        public.append(
            {
                "id": priced["id"],
                "title": {
                    "ru": title_ru or priced["title_hint_ru"],
                    "en": title_en or priced["title_hint_en"],
                },
                "description": {"ru": desc_ru, "en": desc_en},
                "price": priced["price"],
                "timeline": priced["timeline"],
            }
        )
        seen_keys.add(canonical)
        if len(public) >= target_max:
            break

    diagnostics["kept"] = len(public)
    if len(public) < target_min:
        diagnostics["reasons"].append(
            f"below_target_min:{len(public)}<{target_min} (quality over fill; not inventing)"
        )

    logger.info(
        "services_pipeline candidates=%s kept=%s dup=%s unconfirmed=%s roadmap=%s unknown=%s",
        diagnostics["input_candidates"],
        diagnostics["kept"],
        diagnostics["dropped_duplicates"],
        diagnostics["dropped_unconfirmed"],
        diagnostics["dropped_roadmap_or_stub"],
        diagnostics["dropped_unknown_key"],
    )
    return public, diagnostics


def validate_public_services(services: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    if not services:
        errors.append("empty_services")
        return errors
    ids: set[str] = set()
    for idx, item in enumerate(services):
        sid = str(item.get("id") or "")
        if not sid:
            errors.append(f"[{idx}] missing_id")
        elif sid in ids:
            errors.append(f"[{idx}] duplicate_id:{sid}")
        ids.add(sid)
        for field in ("title", "description", "price", "timeline"):
            val = item.get(field)
            if not isinstance(val, dict) or not str(val.get("ru") or "").strip() or not str(val.get("en") or "").strip():
                errors.append(f"[{idx}] bad_{field}")
        price_ru = str((item.get("price") or {}).get("ru") or "")
        price_en = str((item.get("price") or {}).get("en") or "")
        digits_ru = re.sub(r"\D", "", price_ru)
        digits_en = re.sub(r"\D", "", price_en)
        if not digits_ru or digits_ru != digits_en:
            errors.append(f"[{idx}] price_mismatch_ru_en")
        if digits_ru and int(digits_ru) <= 0:
            errors.append(f"[{idx}] non_positive_price")
        timeline_ru = str((item.get("timeline") or {}).get("ru") or "")
        timeline_en = str((item.get("timeline") or {}).get("en") or "")
        days_ru = re.findall(r"\d+", timeline_ru)
        days_en = re.findall(r"\d+", timeline_en)
        if days_ru != days_en:
            errors.append(f"[{idx}] timeline_mismatch_ru_en")
    return errors
