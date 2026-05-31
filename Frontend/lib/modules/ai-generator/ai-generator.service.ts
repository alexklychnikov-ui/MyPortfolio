import { generatedPortfolioSchema, type GeneratedPortfolio } from "./ai-generator.schema"
import { buildUnifiedSystemPrompt, buildUserPrompt, readSystemPrompt } from "./ai-generator.prompt"
import type { GithubRepoData } from "@/lib/modules/github-analyzer/github-analyzer.types"
import { materializePrivateMockups, orderProjectsByInput } from "@/lib/modules/github-analyzer/project-mockup"
import path from "node:path"
import { SKILL_CATEGORIES } from "@/lib/modules/skills/skill-categories"

const skillsOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: [...SKILL_CATEGORIES],
  properties: Object.fromEntries(
    SKILL_CATEGORIES.map((category) => [category, { type: "array", items: { type: "string" } }])
  ),
} as const

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["projects", "services", "skills"],
  properties: {
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "goal", "role", "result", "stack", "tag", "demoUrl"],
        properties: {
          title: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          description: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          goal: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          role: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          result: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          stack: { type: "string" },
          tag: { type: "string", format: "uri" },
          demoUrl: { type: "string" },
        },
      },
    },
    services: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description"],
        properties: {
          title: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
          description: {
            type: "object",
            additionalProperties: false,
            required: ["ru", "en"],
            properties: { ru: { type: "string" }, en: { type: "string" } },
          },
        },
      },
    },
    skills: skillsOutputSchema,
  },
} as const

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export async function generatePortfolioFromRepositories(
  repositories: GithubRepoData[]
): Promise<GeneratedPortfolio> {
  const proxyBaseUrl = process.env.PROXY_BASE_URL?.trim()
  const proxyApiKey = process.env.PROXY_API_KEY?.trim()
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim()

  const useProxy = Boolean(proxyBaseUrl && proxyApiKey)
  const apiBaseUrl = useProxy ? proxyBaseUrl!.replace(/\/+$/, "") : "https://api.openai.com/v1"
  const apiKey = useProxy ? proxyApiKey : openAiApiKey
  if (!apiKey) {
    throw new Error(
      useProxy
        ? "PROXY_API_KEY is missing"
        : "OPENAI_API_KEY is missing (or set PROXY_BASE_URL + PROXY_API_KEY for local proxy mode)"
    )
  }

  const [projectsPrompt, servicesPrompt, skillsPrompt] = await Promise.all([
    readSystemPrompt("projects"),
    readSystemPrompt("services"),
    readSystemPrompt("skills"),
  ])

  const systemPrompt = buildUnifiedSystemPrompt({
    projects: projectsPrompt,
    services: servicesPrompt,
    skills: skillsPrompt,
  })
  const userPrompt = buildUserPrompt(repositories)

  const res = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "portfolio_generation",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`OpenAI request failed: ${res.status} ${errorBody}`)
  }

  const data = (await res.json()) as ChatCompletionResponse
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error("OpenAI returned empty content")

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(content)
  } catch {
    throw new Error("OpenAI returned invalid JSON")
  }

  const parsed = generatedPortfolioSchema.safeParse(parsedJson)
  if (!parsed.success) throw new Error("OpenAI JSON does not match schema")

  const normalized = parsed.data
  const repositoryUrls = repositories.map((repo) => repo.originalUrl)
  const ordered = orderProjectsByInput(normalized.projects, repositoryUrls)
  const exportDir = path.join(process.cwd(), "public", "data")
  const withMockups = await materializePrivateMockups(ordered, repositories, exportDir)
  const projects = dedupeByTag(withMockups)
  return {
    ...normalized,
    projects,
  }
}

function dedupeByTag<T extends { tag: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.tag.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
