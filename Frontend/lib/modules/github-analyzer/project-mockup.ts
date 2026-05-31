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

function pickLatestMockup(entries: GithubContentEntry[]): string | null {
  const images = entries.filter(
    (entry) => entry.type === "file" && entry.name && isImageFile(entry.name) && entry.download_url
  )
  if (images.length === 0) return null

  images.sort((a, b) => String(b.name).localeCompare(String(a.name)))
  return images[0].download_url ?? null
}

export async function fetchMockupUrl(
  owner: string,
  repo: string,
  fetchJson: (path: string) => Promise<unknown>
): Promise<string | null> {
  for (const dirPath of MOCKUP_DIR_PATHS) {
    try {
      const entries = await fetchJson(`/repos/${owner}/${repo}/contents/${dirPath}`)
      if (!Array.isArray(entries)) continue
      const url = pickLatestMockup(entries as GithubContentEntry[])
      if (url) return url
    } catch {
      continue
    }
  }
  return null
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
