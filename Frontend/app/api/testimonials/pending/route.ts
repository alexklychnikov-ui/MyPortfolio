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
      const text = r.text as { ru?: string; en?: string }
      const author = r.author as { ru?: string; en?: string }
      const role = r.role as { ru?: string; en?: string } | null
      const fullText = text?.ru ?? text?.en ?? String(text)
      return {
        id: r.id,
        author: author?.ru ?? author?.en ?? "",
        role: role?.ru ?? role?.en ?? "",
        text: fullText,
        rating: r.rating,
        createdAt: r.createdAt.toISOString(),
      }
    })
    return NextResponse.json(list)
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
