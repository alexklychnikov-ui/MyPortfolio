import { NextResponse } from "next/server"
import { getSkills } from "@/lib/modules/skills/skill.repository"

type SkillsResponse = {
  nocode: string[]
  ai: string[]
  automation: string[]
  [key: string]: string[]
}

export async function GET() {
  try {
    const rows = await getSkills()
    const grouped = rows.reduce<SkillsResponse>(
      (acc, row) => {
        if (!acc[row.category]) acc[row.category] = []
        acc[row.category].push(row.name)
        return acc
      },
      { nocode: [], ai: [], automation: [] }
    )
    return NextResponse.json({ success: true, data: grouped }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
