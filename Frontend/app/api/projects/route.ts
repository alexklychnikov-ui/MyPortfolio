import { NextResponse } from "next/server"
import { getProjects } from "@/lib/modules/projects/project.repository"

export async function GET() {
  try {
    const rows = await getProjects()
    const data = rows.map((row) => ({
      id: row.id,
      title: row.title as { ru: string; en: string },
      description: row.description as { ru: string; en: string },
      goal: row.goal as { ru: string; en: string } | null,
      role: row.role as { ru: string; en: string } | null,
      result: row.result as { ru: string; en: string } | null,
      stack: row.stack,
      tag: row.tag,
      demoUrl: row.demoUrl,
      image: row.image,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
