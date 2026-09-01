import re
from pathlib import Path
from urllib.parse import urlparse

_README_TITLE_RE = re.compile(r"^#+\s*")
_README_IMG_MD_RE = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")
_README_IMG_MD_FULL_RE = re.compile(r"!\[[^\]]*\]\([^)]+\)")
_README_IMG_HTML_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
_README_IMG_HTML_FULL_RE = re.compile(r'<img[^>]+src=["\'][^"\']+["\'][^>]*>', re.I)


def extract_readme_title(readme: str) -> str:
    for line in readme.splitlines():
        line = line.strip()
        if not line:
            continue
        return _README_TITLE_RE.sub("", line).strip()
    return ""


def _resolve_readme_image_url(src: str, owner: str, repo: str, branch: str) -> str | None:
    src = src.strip()
    if not src or src.startswith("data:"):
        return None
    if src.startswith(("http://", "https://")):
        return src.split("?", 1)[0]
    if src.startswith("//"):
        return f"https:{src.split('?', 1)[0]}"
    path = src.lstrip("./")
    return f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"


def extract_first_readme_image(readme: str, owner: str, repo: str, branch: str) -> tuple[str, str] | None:
    for match in _README_IMG_MD_RE.finditer(readme):
        src = match.group(2)
        url = _resolve_readme_image_url(src, owner, repo, branch)
        if url:
            name = Path(urlparse(url).path).name or "readme-image.png"
            return url, name
    for match in _README_IMG_HTML_RE.finditer(readme):
        src = match.group(1)
        url = _resolve_readme_image_url(src, owner, repo, branch)
        if url:
            name = Path(urlparse(url).path).name or "readme-image.png"
            return url, name
    return None


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
