#!/usr/bin/env python3
"""Fetch Docs/mockups images from GitHub and update projects.json."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import httpx

MOCKUP_DIR_PATHS = ("Docs/mockups", "docs/mockups")
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")
PROJECTS_JSON = Path(__file__).resolve().parents[1] / "public" / "data" / "projects.json"


def github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "portfolio-mockup-enricher",
    }
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def parse_repo_url(tag: str) -> tuple[str, str] | None:
    parsed = urlparse(tag.strip())
    if parsed.netloc != "github.com":
        return None
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        return None
    return parts[0], parts[1].replace(".git", "")


def pick_mockup_url(entries: list) -> str | None:
    images = [
        entry
        for entry in entries
        if isinstance(entry, dict)
        and entry.get("type") == "file"
        and isinstance(entry.get("name"), str)
        and any(str(entry["name"]).lower().endswith(ext) for ext in IMAGE_EXTENSIONS)
        and isinstance(entry.get("download_url"), str)
    ]
    if not images:
        return None
    images.sort(key=lambda item: str(item.get("name", "")), reverse=True)
    return str(images[0]["download_url"])


def fetch_mockup_url(client: httpx.Client, owner: str, repo: str) -> str | None:
    for dir_path in MOCKUP_DIR_PATHS:
        response = client.get(f"/repos/{owner}/{repo}/contents/{dir_path}")
        if response.status_code >= 400:
            continue
        entries = response.json()
        if not isinstance(entries, list):
            continue
        mockup_url = pick_mockup_url(entries)
        if mockup_url:
            return mockup_url
    return None


def main() -> int:
    if not PROJECTS_JSON.exists():
        print(f"Missing {PROJECTS_JSON}", file=sys.stderr)
        return 1

    projects = json.loads(PROJECTS_JSON.read_text(encoding="utf-8"))
    if not isinstance(projects, list):
        print("projects.json must be an array", file=sys.stderr)
        return 1

    updated = 0
    with httpx.Client(base_url="https://api.github.com", headers=github_headers(), timeout=25.0) as client:
        for project in projects:
            if not isinstance(project, dict):
                continue
            tag = str(project.get("tag", "")).strip()
            parsed = parse_repo_url(tag)
            if not parsed:
                continue
            owner, repo = parsed
            mockup_url = fetch_mockup_url(client, owner, repo)
            if not mockup_url:
                continue
            if project.get("image") != mockup_url:
                project["image"] = mockup_url
                updated += 1
                print(f"OK {owner}/{repo} -> {mockup_url}")

    PROJECTS_JSON.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {updated} project(s) in {PROJECTS_JSON}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
