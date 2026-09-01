const README_TITLE_RE = /^#+\s*/
const README_IMG_MD_RE = /!\[[^\]]*\]\(([^)]+)\)/g
const README_IMG_HTML_RE = /<img[^>]+src=["']([^"']+)["']/gi

export function extractReadmeTitle(readme: string): string {
  for (const line of readme.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    return trimmed.replace(README_TITLE_RE, "").trim()
  }
  return ""
}

function resolveReadmeImageUrl(src: string, owner: string, repo: string, branch: string): string | null {
  const value = src.trim()
  if (!value || value.startsWith("data:")) return null
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.split("?", 1)[0]
  }
  if (value.startsWith("//")) {
    return `https:${value.split("?", 1)[0]}`
  }
  const path = value.replace(/^\.\//, "")
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}

function imageNameFromUrl(url: string): string {
  try {
    const name = new URL(url).pathname.split("/").pop()
    return name || "readme-image.png"
  } catch {
    return "readme-image.png"
  }
}

export function extractFirstReadmeImage(
  readme: string,
  owner: string,
  repo: string,
  branch: string
): { url: string; name: string } | null {
  for (const pattern of [README_IMG_MD_RE, README_IMG_HTML_RE]) {
    for (const match of readme.matchAll(pattern)) {
      const src = match[1]
      if (!src) continue
      const url = resolveReadmeImageUrl(src, owner, repo, branch)
      if (url) {
        return { url, name: imageNameFromUrl(url) }
      }
    }
  }
  return null
}
