import json
from pathlib import Path
from typing import Any

from app.db.models import Project, Service, Skill


def _dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def export_public_data(
    project_rows: list[Project], service_rows: list[Service], skill_rows: list[Skill], target_dir: str
) -> None:
    target = Path(target_dir)

    projects_payload = [
        {
            "id": row.id,
            "title": row.title,
            "description": row.description,
            "stack": row.stack,
            "tag": row.tag,
        }
        for row in project_rows
    ]

    services_payload = [
        {
            "id": row.external_id or row.id,
            "title": row.title,
            "description": row.description,
        }
        for row in service_rows
    ]

    skills_payload: dict[str, list[str]] = {"nocode": [], "ai": [], "automation": []}
    for row in skill_rows:
        skills_payload.setdefault(row.category, []).append(row.name)

    _dump_json(target / "projects.json", projects_payload)
    _dump_json(target / "services.json", services_payload)
    _dump_json(target / "skills.json", skills_payload)
