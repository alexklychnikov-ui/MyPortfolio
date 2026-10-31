import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

import httpx

DEMO_PUBLIC_PREFIX = "/data/project-demos"
_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".svg"}
_VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v", ".ogg"}


def demo_slug(owner: str, repo: str) -> str:
    return re.sub(r"[^a-zA-Z0-9._-]+", "-", f"{owner}-{repo}").strip("-").lower()


def _strip_query(url: str) -> str:
    return url.split("?", 1)[0]


def _safe_stem(name: str, fallback: str) -> str:
    stem = Path(name).stem if name else fallback
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-._")
    return cleaned or fallback


def _ext_from_url(url: str, allowed: set[str], default: str) -> str:
    ext = Path(urlparse(_strip_query(url)).path).suffix.lower()
    return ext if ext in allowed else default


def _is_downloadable(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
    except Exception:
        return False
    return host in {"raw.githubusercontent.com", "media.githubusercontent.com", "github.com"}


def _remove_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)


def cleanup_orphan_project_demos(static_export_dir: str | None, keep_slugs: set[str]) -> None:
    if not static_export_dir:
        return
    demos_root = Path(static_export_dir) / "project-demos"
    if not demos_root.exists():
        return
    for child in demos_root.iterdir():
        if child.is_dir() and child.name not in keep_slugs:
            _remove_dir(child)


async def _download(client: httpx.AsyncClient, url: str, target: Path) -> bool:
    if not _is_downloadable(url):
        return False
    response = await client.get(_strip_query(url))
    if response.status_code >= 400:
        return False
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(response.content)
    return True


async def materialize_project_demos(
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
    demos_root = Path(static_export_dir) / "project-demos"
    demos_root.mkdir(parents=True, exist_ok=True)
    keep_slugs: set[str] = set()

    async with httpx.AsyncClient(
        headers=github_headers, timeout=httpx.Timeout(120.0), follow_redirects=True
    ) as client:
        for project in projects:
            if not isinstance(project, dict):
                continue

            tag = str(project.get("tag", "")).strip().lower()
            meta = repo_meta.get(tag)
            if not meta:
                project.pop("screenshots", None)
                project.pop("videos", None)
                continue

            owner = str(meta.get("owner", "repo"))
            repo_name = str(meta.get("repo", "project"))
            slug = demo_slug(owner, repo_name)
            keep_slugs.add(slug)

            remote_shots = list(meta.get("screenshots") or [])
            remote_videos = list(meta.get("videos") or [])
            project_dir = demos_root / slug

            if not remote_shots and not remote_videos:
                project.pop("screenshots", None)
                project.pop("videos", None)
                _remove_dir(project_dir)
                continue

            _remove_dir(project_dir)
            project_dir.mkdir(parents=True, exist_ok=True)

            local_shots: list[dict[str, str]] = []
            for index, item in enumerate(remote_shots, start=1):
                if not isinstance(item, dict):
                    continue
                url = str(item.get("url") or "").strip()
                label = str(item.get("label") or "").strip() or f"screenshot-{index}"
                if not url:
                    continue
                ext = _ext_from_url(url, _IMAGE_EXT, ".png")
                filename = f"{index:02d}_{_safe_stem(label, f'screenshot-{index}')}{ext}"
                target = project_dir / "screenshots" / filename
                if await _download(client, url, target):
                    local_shots.append(
                        {
                            "url": f"{DEMO_PUBLIC_PREFIX}/{slug}/screenshots/{filename}",
                            "label": label,
                        }
                    )

            local_videos: list[dict[str, str]] = []
            for index, item in enumerate(remote_videos, start=1):
                if not isinstance(item, dict):
                    continue
                url = str(item.get("url") or "").strip()
                label = str(item.get("label") or "").strip() or f"video-{index}"
                if not url:
                    continue
                if not _is_downloadable(url):
                    # YouTube/Loom etc. — оставляем внешней ссылкой, на VPS не копируем
                    local_videos.append({"url": url, "label": label})
                    continue
                ext = _ext_from_url(url, _VIDEO_EXT, ".mp4")
                filename = f"{index:02d}_{_safe_stem(label, f'video-{index}')}{ext}"
                target = project_dir / "videos" / filename
                if await _download(client, url, target):
                    local_videos.append(
                        {
                            "url": f"{DEMO_PUBLIC_PREFIX}/{slug}/videos/{filename}",
                            "label": label,
                        }
                    )

            if local_shots:
                project["screenshots"] = local_shots
            else:
                project.pop("screenshots", None)

            if local_videos:
                project["videos"] = local_videos
            else:
                project.pop("videos", None)

            if not local_shots and not local_videos:
                _remove_dir(project_dir)

    cleanup_orphan_project_demos(static_export_dir, keep_slugs)
    return generated
