import { NextResponse } from "next/server"
import { getSkills } from "@/lib/modules/skills/skill.repository"
import { emptySkillsGrouped, type SkillCategory } from "@/lib/modules/skills/skill-categories"

export async function GET() {
  try {
    const rows = await getSkills()
    const grouped = rows.reduce<Record<SkillCategory, string[]>>(
      (acc, row) => {
        if (row.category in acc) {
          acc[row.category as SkillCategory].push(row.name)
        }
        return acc
      },
      emptySkillsGrouped()
    )
    return NextResponse.json({ success: true, data: grouped }, { status: 200 })
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
