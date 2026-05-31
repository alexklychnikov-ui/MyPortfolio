const MOCKUP_DIR_PATHS = ["Docs/mockups", "docs/mockups"] as const

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"] as const

type GithubContentEntry = {
  type?: string
  name?: string
  download_url?: string
}

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase()
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function pickLatestMockup(entries: GithubContentEntry[]): { url: string; name: string } | null {
  const images = entries.filter(
    (entry) => entry.type === "file" && entry.name && isImageFile(entry.name) && entry.download_url
  )
  if (images.length === 0) return null

  images.sort((a, b) => String(b.name).localeCompare(String(a.name)))
  return { url: images[0].download_url!, name: String(images[0].name) }
}

export async function fetchMockupUrl(
  owner: string,
  repo: string,
  fetchJson: (path: string) => Promise<unknown>
): Promise<{ url: string; name: string } | null> {
  for (const dirPath of MOCKUP_DIR_PATHS) {
    try {
      const entries = await fetchJson(`/repos/${owner}/${repo}/contents/${dirPath}`)
      if (!Array.isArray(entries)) continue
      const picked = pickLatestMockup(entries as GithubContentEntry[])
      if (picked) return picked
    } catch {
      continue
    }
  }
  return null
}

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

export async function materializePrivateMockups<
  T extends { tag: string; image?: string },
  R extends {
    repoUrl: string
    mockupUrl?: string | null
    mockupName?: string | null
    isPrivate?: boolean
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

    if (!meta.isPrivate) {
      project.image = meta.mockupUrl.split("?")[0]
      continue
    }

    const ext = path.extname(meta.mockupName || "mockup.png") || ".png"
    const filename = `${meta.owner}-${meta.repo}`.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase() + ext
    const target = path.join(mockupDir, filename)
    const response = await fetch(meta.mockupUrl.split("?")[0], { headers, cache: "no-store" })
    if (!response.ok) continue
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
