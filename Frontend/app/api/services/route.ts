import { NextResponse } from "next/server"
import { getServices } from "@/lib/modules/services/service.repository"

export async function GET() {
  try {
    const rows = await getServices()
    const data = rows.map((row) => ({
      id: row.id,
      externalId: row.externalId,
      title: row.title as { ru: string; en: string },
      description: row.description as { ru: string; en: string },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }))
    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
