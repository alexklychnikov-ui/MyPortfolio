import re
from pathlib import Path
from urllib.parse import urlparse

_README_TITLE_RE = re.compile(r"^#+\s*")
_README_IMG_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
_README_IMG_MD_FULL_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
_README_IMG_HTML_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
_README_IMG_HTML_FULL_RE = re.compile(r'<img[^>]+src=["\'][^"\']+["\'][^>]*>', re.I)
_README_LINK_MD_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
_IMAGE_EXT_RE = re.compile(r"\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:$|[?#])", re.I)
_VIDEO_EXT_RE = re.compile(r"\.(mp4|webm|mov|m4v|ogg)(?:$|[?#])", re.I)
_VIDEO_HOST_RE = re.compile(r"(?:youtube\.com|youtu\.be|loom\.com|vimeo\.com|rutube\.ru)", re.I)
_MOCKUP_PATH_RE = re.compile(r"(?:^|/)(?:docs/)?mockups?(?:/|$)", re.I)


def extract_readme_title(readme: str) -> str:
    for line in readme.splitlines():
        line = line.strip()
        if not line:
            continue
        return _README_TITLE_RE.sub("", line).strip()
    return ""


def _resolve_readme_asset_url(src: str, owner: str, repo: str, branch: str) -> str | None:
    src = src.strip()
    if not src or src.startswith(("data:", "#", "mailto:")):
        return None
    if src.startswith(("http://", "https://")):
        return src.split("?", 1)[0]
    if src.startswith("//"):
        return f"https:{src.split('?', 1)[0]}"
    path = src.lstrip("./").lstrip("/")
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"


def _asset_name(url: str) -> str:
    return Path(urlparse(url).path).name or "readme-asset"


def _is_image_url(url: str) -> bool:
    return bool(_IMAGE_EXT_RE.search(url))


def _is_video_url(url: str) -> bool:
    return bool(_VIDEO_EXT_RE.search(url) or _VIDEO_HOST_RE.search(url))


def _is_mockup_path(url: str) -> bool:
    try:
        return bool(_MOCKUP_PATH_RE.search(urlparse(url).path))
    except Exception:
        return bool(_MOCKUP_PATH_RE.search(url))


def _dedupe_media(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    result: list[dict[str, str]] = []
    for item in items:
        key = item["url"].strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def extract_first_readme_image(readme: str, owner: str, repo: str, branch: str) -> tuple[str, str] | None:
    for match in _README_IMG_MD_RE.finditer(readme):
        src = match.group(2)
        url = _resolve_readme_asset_url(src, owner, repo, branch)
        if url and _is_image_url(url):
            return url, _asset_name(url)
    for match in _README_IMG_HTML_RE.finditer(readme):
        src = match.group(1)
        url = _resolve_readme_asset_url(src, owner, repo, branch)
        if url and _is_image_url(url):
            return url, _asset_name(url)
    return None


def extract_readme_media(readme: str, owner: str, repo: str, branch: str) -> dict[str, list[dict[str, str]]]:
    screenshots: list[dict[str, str]] = []
    videos: list[dict[str, str]] = []

    def push(url: str | None, label: str = "") -> None:
        if not url:
            return
        name = label.strip() or _asset_name(url)
        if _is_video_url(url):
            videos.append({"url": url, "label": name})
        elif _is_image_url(url) and not _is_mockup_path(url):
            screenshots.append({"url": url, "label": name})

    for match in _README_IMG_MD_RE.finditer(readme):
        push(_resolve_readme_asset_url(match.group(2), owner, repo, branch), match.group(1) or "")

    for match in _README_IMG_HTML_RE.finditer(readme):
        push(_resolve_readme_asset_url(match.group(1), owner, repo, branch))

    for match in _README_LINK_MD_RE.finditer(readme):
        label = match.group(1) or ""
        src = match.group(2) or ""
        if src.startswith("!"):
            continue
        push(_resolve_readme_asset_url(src, owner, repo, branch), label)

    return {
        "screenshots": _dedupe_media(screenshots),
        "videos": _dedupe_media(videos),
    }


def extract_first_readme_image_src(readme: str) -> str | None:
    md_match = _README_IMG_MD_RE.search(readme)
    if md_match:
        return str(md_match.group(2)).strip().split("?", 1)[0]
    html_match = _README_IMG_HTML_RE.search(readme)
    if html_match:
        return str(html_match.group(1)).strip().split("?", 1)[0]
    return None


def upsert_first_readme_image(readme: str, image_path: str, alt: str = "Mockup") -> tuple[str, bool]:
    new_line = f"![{alt}]({image_path})"
    md_match = _README_IMG_MD_FULL_RE.search(readme)
    if md_match:
        return readme[: md_match.start()] + new_line + readme[md_match.end() :], True
    html_match = _README_IMG_HTML_FULL_RE.search(readme)
    if html_match:
        return readme[: html_match.start()] + new_line + readme[html_match.end() :], True

    lines = readme.splitlines(keepends=True)
    if not lines:
        return f"![{alt}]({image_path})\n", False

    insert_at = 0
    for idx, line in enumerate(lines):
        if line.strip():
            insert_at = idx + 1
            break

    while insert_at < len(lines) and not lines[insert_at].strip():
        insert_at += 1

    block = f"\n![{alt}]({image_path})\n\n"
    updated = "".join(lines[:insert_at]) + block + "".join(lines[insert_at:])
    return updated, False
