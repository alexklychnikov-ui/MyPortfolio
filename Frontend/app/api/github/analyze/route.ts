import { NextRequest, NextResponse } from "next/server"
import { analyzeGithubRepositories } from "@/lib/modules/github-analyzer/github-analyzer.service"
import { githubAnalyzeInputSchema } from "@/lib/modules/github-analyzer/github-analyzer.schema"
import { generatePortfolioFromRepositories } from "@/lib/modules/ai-generator/ai-generator.service"
import { replaceProjects } from "@/lib/modules/projects/project.repository"
import { replaceServices } from "@/lib/modules/services/service.repository"
import { replaceSkills } from "@/lib/modules/skills/skill.repository"
import { checkGithubAnalyzeRateLimit } from "@/lib/core/rate-limit"

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  )
}

function getBotKey(req: NextRequest): string | null {
  return req.headers.get("x-telegram-bot-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null
}

export async function POST(req: NextRequest) {
  const expectedKey = process.env.TELEGRAM_BACKEND_API_KEY?.trim()
  const providedKey = getBotKey(req)
  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const ip = getClientIp(req)
  const limit = checkGithubAnalyzeRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: limit.retryAfter ? { "Retry-After": String(limit.retryAfter) } : undefined,
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = githubAnalyzeInputSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message = first.repositories?.[0] ?? "Validation failed"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  try {
    const githubResult = await analyzeGithubRepositories(parsed.data.repositories)
    if (githubResult.repositories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No repositories were successfully analyzed",
          skipped: githubResult.skipped,
        },
        { status: 422 }
      )
    }

    const generated = await generatePortfolioFromRepositories(githubResult.repositories)
    await Promise.all([
      replaceProjects(generated.projects),
      replaceServices(generated.services),
      replaceSkills(generated.skills),
    ])

    return NextResponse.json(
      {
        success: true,
        data: generated,
        skipped: githubResult.skipped,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
