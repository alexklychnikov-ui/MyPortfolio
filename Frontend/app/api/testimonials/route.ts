import { NextRequest, NextResponse } from "next/server"
import { createTestimonial, getApprovedTestimonials } from "@/lib/modules/testimonials/testimonials.service"
import { createTestimonialSchema } from "@/lib/modules/testimonials/testimonials.schema"
import { checkTestimonialRateLimit } from "@/lib/core/rate-limit"

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  )
}

export async function GET() {
  try {
    const list = await getApprovedTestimonials()
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = checkTestimonialRateLimit(ip)
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

  const parsed = createTestimonialSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message =
      first.text?.[0] ?? first.author?.[0] ?? first.role?.[0] ?? "Validation failed"
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }

  try {
    const { id } = await createTestimonial(parsed.data)
    return NextResponse.json({ success: true, id, message: "Thank you, your review is under moderation." }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
