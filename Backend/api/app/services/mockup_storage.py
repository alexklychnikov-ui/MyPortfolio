import re
from pathlib import Path

import httpx

MOCKUP_PUBLIC_PREFIX = "/data/project-mockups"


def _safe_filename(owner: str, repo: str, mockup_name: str) -> str:
    ext = Path(mockup_name).suffix.lower() if mockup_name else ".png"
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        ext = ".png"
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", f"{owner}-{repo}").strip("-").lower()
    return f"{slug}{ext}"


def _strip_query(url: str) -> str:
    return url.split("?", 1)[0]


async def materialize_project_mockups(
    generated: dict,
    accepted: list[dict],
    static_export_dir: str | None,
    github_headers: dict[str, str],
) -> dict:
    projects = generated.get("projects")
    if not isinstance(projects, list) or not static_export_dir:
        return generated

    repo_meta = {
        str(item.get("repo_url", "")).strip().lower(): item for item in accepted if item.get("repo_url")
    }
    mockup_dir = Path(static_export_dir) / "project-mockups"
    mockup_dir.mkdir(parents=True, exist_ok=True)

    async with httpx.AsyncClient(headers=github_headers, timeout=httpx.Timeout(30.0), follow_redirects=True) as client:
        for project in projects:
            if not isinstance(project, dict):
                continue
            tag = str(project.get("tag", "")).strip().lower()
            meta = repo_meta.get(tag)
            if not meta or not meta.get("mockup_url"):
                continue

            mockup_url = str(meta["mockup_url"])
            mockup_name = str(meta.get("mockup_name") or "mockup.png")
            is_private = bool(meta.get("is_private"))

            filename = _safe_filename(str(meta.get("owner", "repo")), str(meta.get("repo", "project")), mockup_name)
            target = mockup_dir / filename
            download_url = _strip_query(mockup_url)

            if not target.exists() or target.stat().st_size == 0:
                response = await client.get(download_url)
                if response.status_code >= 400:
                    continue
                target.write_bytes(response.content)

            project["image"] = f"{MOCKUP_PUBLIC_PREFIX}/{filename}"

    return generated
