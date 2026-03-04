import { NextRequest, NextResponse } from "next/server"
import { approveTestimonial } from "@/lib/modules/testimonials/testimonials.service"

const MODERATION_API_KEY = process.env.MODERATION_API_KEY

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-moderation-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!MODERATION_API_KEY || key !== MODERATION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const id = typeof body === "object" && body !== null && "id" in body ? (body as { id: unknown }).id : undefined
  const approved = typeof body === "object" && body !== null && "approved" in body ? (body as { approved: unknown }).approved : undefined

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }
  if (typeof approved !== "boolean") {
    return NextResponse.json({ error: "approved must be boolean" }, { status: 400 })
  }

  try {
    await approveTestimonial(id, approved)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}
