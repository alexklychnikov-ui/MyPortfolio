import { extractReadmeTitle } from "./readme-parser"
import type { GithubMediaItem } from "./github-analyzer.types"

export { extractFirstReadmeImage, extractReadmeMedia, extractReadmeTitle } from "./readme-parser"

function normalizeRepoUrl(inputUrl: string): string | null {
  try {
    const url = new URL(inputUrl)
    if (url.hostname !== "github.com") return null
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts.length < 2) return null
    return `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/i, "")}`.toLowerCase()
  } catch {
    return null
  }
}

export function orderProjectsByInput<T extends { tag: string }>(
  projects: T[],
  repositoryUrls: string[]
): T[] {
  const orderKeys = repositoryUrls
    .map((url) => normalizeRepoUrl(url))
    .filter((url): url is string => Boolean(url))

  return [...projects].sort((a, b) => {
    const ai = orderKeys.indexOf(a.tag.trim().toLowerCase())
    const bi = orderKeys.indexOf(b.tag.trim().toLowerCase())
    return (ai === -1 ? orderKeys.length + 1 : ai) - (bi === -1 ? orderKeys.length + 1 : bi)
  })
}

function mockupSlug(owner: string, repo: string): string {
  return `${owner}-${repo}`.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase()
}

export async function materializePrivateMockups<
  T extends { tag: string; image?: string },
  R extends {
    repoUrl: string
    mockupUrl?: string | null
    mockupName?: string | null
    owner: string
    repo: string
  }
>(projects: T[], repositories: R[], exportDir: string): Promise<T[]> {
  const repoMeta = new Map(repositories.map((repo) => [repo.repoUrl.trim().toLowerCase(), repo]))
  const mockupDir = `${exportDir}/project-mockups`
  const fs = await import("node:fs/promises")
  const path = await import("node:path")
  await fs.mkdir(mockupDir, { recursive: true })

  const token = process.env.GITHUB_TOKEN?.trim()
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-github-analyzer",
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const updated = [...projects]
  for (const project of updated) {
    const meta = repoMeta.get(project.tag.trim().toLowerCase())
    if (!meta?.mockupUrl) continue

    const ext = path.extname(meta.mockupName || "mockup.png") || ".png"
    const slug = mockupSlug(meta.owner, meta.repo)
    const filename = `${slug}${ext}`
    const target = path.join(mockupDir, filename)
    const response = await fetch(meta.mockupUrl.split("?")[0], { headers, cache: "no-store" })
    if (!response.ok) continue

    const existing = await fs.readdir(mockupDir).catch(() => [] as string[])
    await Promise.all(
      existing
        .filter((name) => name.startsWith(`${slug}.`))
        .map((name) => fs.unlink(path.join(mockupDir, name)).catch(() => undefined))
    )

    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(target, buffer)
    project.image = `/data/project-mockups/${filename}`
  }

  return updated
}

export function attachMockupsToProjects<
  T extends { tag: string; image?: string },
  R extends { repoUrl: string; mockupUrl?: string | null }
>(projects: T[], repositories: R[]): T[] {
  const mockupByRepo = new Map<string, string>()
  for (const repo of repositories) {
    if (repo.mockupUrl) mockupByRepo.set(repo.repoUrl.trim().toLowerCase(), repo.mockupUrl)
  }

  return projects.map((project) => {
    if (project.image) return project
    const mockup = mockupByRepo.get(project.tag.trim().toLowerCase())
    return mockup ? { ...project, image: mockup } : project
  })
}

const DEMO_PUBLIC_PREFIX = "/data/project-demos"
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".svg"])
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v", ".ogg"])

function isDownloadableGithubUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return (
      host === "raw.githubusercontent.com" ||
      host === "media.githubusercontent.com" ||
      host === "github.com"
    )
  } catch {
    return false
  }
}

function safeStem(name: string, fallback: string): string {
  const stem = name.replace(/\.[^.]+$/, "") || fallback
  const cleaned = stem.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-._]+|[-._]+$/g, "")
  return cleaned || fallback
}

function extFromUrl(url: string, allowed: Set<string>, fallback: string): string {
  try {
    const ext = new URL(url.split("?")[0]).pathname.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase()
    return ext && allowed.has(ext) ? ext : fallback
  } catch {
    return fallback
  }
}

async function removeDir(fs: typeof import("node:fs/promises"), dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
}

export async function materializeProjectDemos<
  T extends { tag: string; screenshots?: GithubMediaItem[]; videos?: GithubMediaItem[] },
  R extends {
    repoUrl: string
    owner: string
    repo: string
    screenshots?: GithubMediaItem[]
    videos?: GithubMediaItem[]
  }
>(projects: T[], repositories: R[], exportDir: string): Promise<T[]> {
  const fs = await import("node:fs/promises")
  const path = await import("node:path")
  const repoMeta = new Map(repositories.map((repo) => [repo.repoUrl.trim().toLowerCase(), repo]))
  const demosRoot = path.join(exportDir, "project-demos")
  await fs.mkdir(demosRoot, { recursive: true })

  const token = process.env.GITHUB_TOKEN?.trim()
  const headers: HeadersInit = {
    Accept: "*/*",
    "User-Agent": "portfolio-github-analyzer",
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const keepSlugs = new Set<string>()
  const updated = [...projects]

  for (const project of updated) {
    const meta = repoMeta.get(project.tag.trim().toLowerCase())
    if (!meta) {
      delete project.screenshots
      delete project.videos
      continue
    }

    const slug = mockupSlug(meta.owner, meta.repo)
    keepSlugs.add(slug)
    const projectDir = path.join(demosRoot, slug)
    const remoteShots = meta.screenshots ?? []
    const remoteVideos = meta.videos ?? []

    if (remoteShots.length === 0 && remoteVideos.length === 0) {
      delete project.screenshots
      delete project.videos
      await removeDir(fs, projectDir)
      continue
    }

    await removeDir(fs, projectDir)
    await fs.mkdir(projectDir, { recursive: true })

    const localShots: GithubMediaItem[] = []
    for (let index = 0; index < remoteShots.length; index += 1) {
      const item = remoteShots[index]
      if (!item?.url || !isDownloadableGithubUrl(item.url)) continue
      const label = item.label || `screenshot-${index + 1}`
      const ext = extFromUrl(item.url, IMAGE_EXT, ".png")
      const filename = `${String(index + 1).padStart(2, "0")}_${safeStem(label, `screenshot-${index + 1}`)}${ext}`
      const target = path.join(projectDir, "screenshots", filename)
      const response = await fetch(item.url.split("?")[0], { headers, cache: "no-store" })
      if (!response.ok) continue
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, Buffer.from(await response.arrayBuffer()))
      localShots.push({
        url: `${DEMO_PUBLIC_PREFIX}/${slug}/screenshots/${filename}`,
        label,
      })
    }

    const localVideos: GithubMediaItem[] = []
    for (let index = 0; index < remoteVideos.length; index += 1) {
      const item = remoteVideos[index]
      if (!item?.url) continue
      const label = item.label || `video-${index + 1}`
      if (!isDownloadableGithubUrl(item.url)) {
        localVideos.push({ url: item.url, label })
        continue
      }
      const ext = extFromUrl(item.url, VIDEO_EXT, ".mp4")
      const filename = `${String(index + 1).padStart(2, "0")}_${safeStem(label, `video-${index + 1}`)}${ext}`
      const target = path.join(projectDir, "videos", filename)
      const response = await fetch(item.url.split("?")[0], { headers, cache: "no-store" })
      if (!response.ok) continue
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, Buffer.from(await response.arrayBuffer()))
      localVideos.push({
        url: `${DEMO_PUBLIC_PREFIX}/${slug}/videos/${filename}`,
        label,
      })
    }

    if (localShots.length > 0) project.screenshots = localShots
    else delete project.screenshots
    if (localVideos.length > 0) project.videos = localVideos
    else delete project.videos
    if (localShots.length === 0 && localVideos.length === 0) {
      await removeDir(fs, projectDir)
    }
  }

  const existing = await fs.readdir(demosRoot).catch(() => [] as string[])
  await Promise.all(
    existing
      .filter((name) => !keepSlugs.has(name))
      .map((name) => removeDir(fs, path.join(demosRoot, name)))
  )

  return updated
}
