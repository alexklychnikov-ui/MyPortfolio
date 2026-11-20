import json
import logging
import os
from pathlib import Path
from typing import Any

from app.core.skill_categories import empty_skills_grouped
from app.db.models import Project, Service, Skill
from app.services.services_catalog import apply_pricing, resolve_canonical_key

logger = logging.getLogger(__name__)


def _dump_json_atomic(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def _attach_service_pricing(external_id: str | None, title: dict | None = None) -> dict[str, Any]:
    key = resolve_canonical_key(
        external_id or "",
        title_ru=str((title or {}).get("ru") or ""),
        title_en=str((title or {}).get("en") or ""),
    )
    if not key:
        return {}
    priced = apply_pricing(key)
    if not priced:
        return {}
    return {"price": priced["price"], "timeline": priced["timeline"]}


def export_public_data(
    project_rows: list[Project],
    service_rows: list[Service],
    skill_rows: list[Skill],
    target_dir: str,
    *,
    allow_empty_services: bool = False,
) -> dict[str, Any]:
    """Export JSON files atomically. Returns diagnostics; raises on fatal export policy errors."""
    target = Path(target_dir)

    projects_payload = []
    for row in project_rows:
        item: dict = {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "stack": row.stack,
            "tag": row.tag,
        }
        if row.goal:
            item["goal"] = row.goal
        if row.role:
            item["role"] = row.role
        if row.result:
            item["result"] = row.result
        if row.demo_url:
            item["demoUrl"] = row.demo_url
        if row.image:
            item["image"] = row.image
        if row.screenshots:
            item["screenshots"] = row.screenshots
        if row.videos:
            item["videos"] = row.videos
        projects_payload.append(item)

    services_payload: list[dict] = []
    for row in service_rows:
        sid = row.external_id or row.id
        item: dict = {
            "id": sid,
            "title": row.title,
            "description": row.description,
        }
        item.update(_attach_service_pricing(sid, row.title if isinstance(row.title, dict) else None))
        services_payload.append(item)

    skills_payload = empty_skills_grouped()
    for row in skill_rows:
        if row.category in skills_payload:
            skills_payload[row.category].append(row.name)

    services_path = target / "services.json"
    if not services_payload and not allow_empty_services:
        if services_path.exists():
            logger.error(
                "Refusing to overwrite services.json with empty payload; previous file preserved"
            )
            raise ValueError(
                "export_refused_empty_services: previous services.json preserved"
            )
        raise ValueError("export_refused_empty_services: no previous file to keep")

    _dump_json_atomic(target / "projects.json", projects_payload)
    _dump_json_atomic(services_path, services_payload)
    _dump_json_atomic(target / "skills.json", skills_payload)

    meta = {
        "ok": True,
        "projects_count": len(projects_payload),
        "services_count": len(services_payload),
        "skills_categories": len(skills_payload),
    }
    logger.info(
        "static_export ok projects=%s services=%s skills_categories=%s dir=%s",
        meta["projects_count"],
        meta["services_count"],
        meta["skills_categories"],
        target_dir,
    )
    return meta
