import { extractReadmeTitle } from "./readme-parser"

export { extractFirstReadmeImage, extractReadmeTitle } from "./readme-parser"

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
