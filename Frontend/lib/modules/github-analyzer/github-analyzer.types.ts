export type NormalizedGithubRepo = {
  originalUrl: string
  normalizedUrl: string
  owner: string
  repo: string
}

export type GithubMediaItem = {
  url: string
  label: string
}

export type GithubRepoData = {
  originalUrl: string
  repoUrl: string
  owner: string
  repo: string
  description: string
  defaultBranch: string
  topics: string[]
  languages: string[]
  readme: string
  packageJson: string
  inferredStack: string[]
  readmeTitle?: string
  mockupUrl?: string | null
  mockupName?: string | null
  screenshots?: GithubMediaItem[]
  videos?: GithubMediaItem[]
  isPrivate?: boolean
}

export type GithubSkippedRepo = {
  url: string
  reason: string
}

export type GithubAnalyzeResult = {
  repositories: GithubRepoData[]
  skipped: GithubSkippedRepo[]
}
