import { NextRequest, NextResponse } from "next/server"
import { findPendingTestimonials } from "@/lib/modules/testimonials/testimonials.repository"

const MODERATION_API_KEY = process.env.MODERATION_API_KEY

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-moderation-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!MODERATION_API_KEY || key !== MODERATION_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rows = await findPendingTestimonials()
    const list = rows.map((r) => {
      const text = r.text as { ru?: string }
      const author = r.author as { ru?: string }
      const preview = (text?.ru ?? String(text)).slice(0, 150)
      return {
        id: r.id,
        author: author?.ru ?? "",
        textPreview: preview,
        createdAt: r.createdAt.toISOString(),
      }
    })
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
