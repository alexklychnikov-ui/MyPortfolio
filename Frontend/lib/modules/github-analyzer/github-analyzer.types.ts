export type NormalizedGithubRepo = {
  originalUrl: string
  normalizedUrl: string
  owner: string
  repo: string
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
}

export type GithubSkippedRepo = {
  url: string
  reason: string
}

export type GithubAnalyzeResult = {
  repositories: GithubRepoData[]
  skipped: GithubSkippedRepo[]
}
