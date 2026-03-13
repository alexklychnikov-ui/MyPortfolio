import { NextResponse } from "next/server"
import { getProjects } from "@/lib/modules/projects/project.repository"

export async function GET() {
  try {
    const rows = await getProjects()
    const data = rows.map((row) => ({
      id: row.id,
      title: row.title as { ru: string; en: string },
      description: row.description as { ru: string; en: string },
      stack: row.stack,
      tag: row.tag,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
