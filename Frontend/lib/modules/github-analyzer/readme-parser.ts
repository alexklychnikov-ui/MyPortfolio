const README_TITLE_RE = /^#+\s*/
const README_IMG_MD_RE = /!\[[^\]]*\]\(([^)]+)\)/g
const README_IMG_HTML_RE = /<img[^>]+src=["']([^"']+)["']/gi
const README_LINK_MD_RE = /\[([^\]]*)\]\(([^)]+)\)/g

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:$|[?#])/i
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg)(?:$|[?#])/i
const VIDEO_HOST_RE = /(?:youtube\.com|youtu\.be|loom\.com|vimeo\.com|rutube\.ru)/i
const MOCKUP_PATH_RE = /(?:^|\/)(?:docs\/)?mockups?(?:\/|$)/i

export type ReadmeMediaItem = {
  url: string
  label: string
}

export type ReadmeMedia = {
  screenshots: ReadmeMediaItem[]
  videos: ReadmeMediaItem[]
}

export function extractReadmeTitle(readme: string): string {
  for (const line of readme.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    return trimmed.replace(README_TITLE_RE, "").trim()
  }
  return ""
}

function resolveReadmeAssetUrl(src: string, owner: string, repo: string, branch: string): string | null {
  const value = src.trim()
  if (!value || value.startsWith("data:") || value.startsWith("#") || value.startsWith("mailto:")) {
    return null
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.split("?", 1)[0]
  }
  if (value.startsWith("//")) {
    return `https:${value.split("?", 1)[0]}`
  }
  const path = value.replace(/^\.\//, "").replace(/^\//, "")
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

function isImageUrl(url: string): boolean {
  return IMAGE_EXT_RE.test(url)
}

function isVideoUrl(url: string): boolean {
  return VIDEO_EXT_RE.test(url) || VIDEO_HOST_RE.test(url)
}

function isMockupPath(url: string): boolean {
  try {
    return MOCKUP_PATH_RE.test(new URL(url).pathname)
  } catch {
    return MOCKUP_PATH_RE.test(url)
  }
}

function dedupeMedia(items: ReadmeMediaItem[]): ReadmeMediaItem[] {
  const seen = new Set<string>()
  const result: ReadmeMediaItem[] = []
  for (const item of items) {
    const key = item.url.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
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
      const url = resolveReadmeAssetUrl(src, owner, repo, branch)
      if (url && isImageUrl(url)) {
        return { url, name: imageNameFromUrl(url) }
      }
    }
  }
  return null
}

export function extractReadmeMedia(
  readme: string,
  owner: string,
  repo: string,
  branch: string
): ReadmeMedia {
  const screenshots: ReadmeMediaItem[] = []
  const videos: ReadmeMediaItem[] = []

  for (const match of readme.matchAll(README_IMG_MD_RE)) {
    const src = match[1]
    if (!src) continue
    const url = resolveReadmeAssetUrl(src, owner, repo, branch)
    if (!url) continue
    if (isVideoUrl(url)) {
      videos.push({ url, label: imageNameFromUrl(url) })
    } else if (isImageUrl(url) && !isMockupPath(url)) {
      screenshots.push({ url, label: imageNameFromUrl(url) })
    }
  }

  for (const match of readme.matchAll(README_IMG_HTML_RE)) {
    const src = match[1]
    if (!src) continue
    const url = resolveReadmeAssetUrl(src, owner, repo, branch)
    if (!url) continue
    if (isVideoUrl(url)) {
      videos.push({ url, label: imageNameFromUrl(url) })
    } else if (isImageUrl(url) && !isMockupPath(url)) {
      screenshots.push({ url, label: imageNameFromUrl(url) })
    }
  }

  for (const match of readme.matchAll(README_LINK_MD_RE)) {
    const label = (match[1] || "").trim()
    const src = match[2]
    if (!src) continue
    if (src.startsWith("!")) continue
    const url = resolveReadmeAssetUrl(src, owner, repo, branch)
    if (!url) continue
    if (isVideoUrl(url)) {
      videos.push({ url, label: label || imageNameFromUrl(url) })
    } else if (isImageUrl(url) && !isMockupPath(url)) {
      screenshots.push({ url, label: label || imageNameFromUrl(url) })
    }
  }

  return {
    screenshots: dedupeMedia(screenshots),
    videos: dedupeMedia(videos),
  }
}
