import type {
  GithubAnalyzeResult,
  GithubRepoData,
  NormalizedGithubRepo,
} from "./github-analyzer.types"

const GITHUB_API_BASE = "https://api.github.com"

function buildGithubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "portfolio-github-analyzer",
  }
  const token = process.env.GITHUB_TOKEN?.trim()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function normalizeGithubUrl(inputUrl: string): NormalizedGithubRepo | null {
  let url: URL
  try {
    url = new URL(inputUrl)
  } catch {
    return null
  }

  if (url.hostname !== "github.com") return null
  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length < 2) return null

  const owner = segments[0]
  const repo = segments[1].replace(/\.git$/i, "")
  if (!owner || !repo) return null

  return {
    originalUrl: inputUrl,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
  }
}

async function fetchGithubJson<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    method: "GET",
    headers: buildGithubHeaders(),
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`GitHub request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

function safeDecodeBase64(content: string): string {
  try {
    return Buffer.from(content, "base64").toString("utf8")
  } catch {
    return ""
  }
}

function getDependenciesFromPackageJson(packageJsonRaw: string): string[] {
  if (!packageJsonRaw) return []
  try {
    const parsed = JSON.parse(packageJsonRaw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = Object.keys(parsed.dependencies ?? {})
    const devDeps = Object.keys(parsed.devDependencies ?? {})
    return Array.from(new Set([...deps, ...devDeps])).slice(0, 30)
  } catch {
    return []
  }
}

function compactText(input: string, maxLength: number): string {
  const normalized = input.replace(/\s+/g, " ").trim()
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized
}

export async function analyzeGithubRepositories(urls: string[]): Promise<GithubAnalyzeResult> {
  const repositories: GithubRepoData[] = []
  const skipped: GithubAnalyzeResult["skipped"] = []

  for (const rawUrl of urls) {
    const normalized = normalizeGithubUrl(rawUrl)
    if (!normalized) {
      skipped.push({ url: rawUrl, reason: "Invalid GitHub repository URL" })
      continue
    }

    try {
      const repoData = await fetchGithubJson<{
        description: string | null
        default_branch: string | null
        topics?: string[]
      }>(`/repos/${normalized.owner}/${normalized.repo}`)

      const languagesData = await fetchGithubJson<Record<string, number>>(
        `/repos/${normalized.owner}/${normalized.repo}/languages`
      ).catch(() => ({}))

      const readmeData = await fetchGithubJson<{
        content: string
        encoding: string
      }>(`/repos/${normalized.owner}/${normalized.repo}/readme`).catch(() => null)

      const packageData = await fetchGithubJson<{
        content: string
        encoding: string
      }>(`/repos/${normalized.owner}/${normalized.repo}/contents/package.json`).catch(() => null)

      const readmeRaw =
        readmeData && readmeData.encoding === "base64"
          ? safeDecodeBase64(readmeData.content)
          : ""

      const packageJsonRaw =
        packageData && packageData.encoding === "base64"
          ? safeDecodeBase64(packageData.content)
          : ""

      const inferredStack = Array.from(
        new Set([
          ...Object.keys(languagesData).slice(0, 10),
          ...getDependenciesFromPackageJson(packageJsonRaw),
        ])
      ).slice(0, 20)

      repositories.push({
        originalUrl: rawUrl,
        repoUrl: normalized.normalizedUrl,
        owner: normalized.owner,
        repo: normalized.repo,
        description: repoData.description ?? "",
        defaultBranch: repoData.default_branch ?? "main",
        topics: repoData.topics ?? [],
        languages: Object.keys(languagesData),
        readme: compactText(readmeRaw, 8000),
        packageJson: compactText(packageJsonRaw, 8000),
        inferredStack,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown GitHub error"
      skipped.push({ url: rawUrl, reason })
    }
  }

  return { repositories, skipped }
}
