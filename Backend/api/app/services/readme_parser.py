import re
from pathlib import Path
from urllib.parse import urlparse

_README_TITLE_RE = re.compile(r"^#+\s*")
_README_IMG_MD_RE = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")
_README_IMG_HTML_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)


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
    for pattern in (_README_IMG_MD_RE, _README_IMG_HTML_RE):
        for match in pattern.finditer(readme):
            src = match.group(1)
            url = _resolve_readme_image_url(src, owner, repo, branch)
            if url:
                name = Path(urlparse(url).path).name or "readme-image.png"
                return url, name
    return None
