import { readFile } from "node:fs/promises"
import path from "node:path"
import type { GithubRepoData } from "@/lib/modules/github-analyzer/github-analyzer.types"

type PromptKind = "projects" | "services" | "skills"

const PROMPT_FILE_BY_KIND: Record<PromptKind, string> = {
  projects: "projects.system.prompt.txt",
  services: "services.system.prompt.txt",
  skills: "skills.system.prompt.txt",
}

export async function readSystemPrompt(kind: PromptKind): Promise<string> {
  const fileName = PROMPT_FILE_BY_KIND[kind]
  const filePath = path.join(process.cwd(), "prompts", "ai-generator", fileName)
  return readFile(filePath, "utf8")
}

export function buildUnifiedSystemPrompt(parts: {
  projects: string
  services: string
  skills: string
}): string {
  return [parts.projects.trim(), parts.services.trim(), parts.skills.trim(), "Return only valid JSON."]
    .filter(Boolean)
    .join("\n\n")
}

export function buildUserPrompt(repositories: GithubRepoData[]): string {
  const lines: string[] = [
    "Input repositories:",
    ...repositories.map((repo, index) =>
      [
        `#${index + 1}`,
        `url: ${repo.repoUrl}`,
        `description: ${repo.description}`,
        `topics: ${repo.topics.join(", ")}`,
        `languages: ${repo.languages.join(", ")}`,
        `inferredStack: ${repo.inferredStack.join(", ")}`,
        `readme: ${repo.readme}`,
      ].join("\n")
    ),
  ]

  return lines.join("\n\n")
}
