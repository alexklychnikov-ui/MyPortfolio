import { NextRequest, NextResponse } from "next/server"
import { contactInputSchema } from "@/lib/modules/contact/contact.schema"
import { submitContact } from "@/lib/modules/contact/contact.service"
import { checkRateLimit } from "@/lib/core/rate-limit"

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      {
        status: 429,
        headers: limit.retryAfter
          ? { "Retry-After": String(limit.retryAfter) }
          : undefined,
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    )
  }

  const parsed = contactInputSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message =
      first.name?.[0] ?? first.email?.[0] ?? first.message?.[0] ?? "Validation failed"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  try {
    const result = await submitContact(parsed.data)
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 }
      )
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    )
  }
}
