import { prisma } from "@/lib/db"
import type { GeneratedPortfolio } from "@/lib/modules/ai-generator/ai-generator.schema"
import { SKILL_CATEGORIES } from "@/lib/modules/skills/skill-categories"

type GeneratedSkills = GeneratedPortfolio["skills"]

export async function replaceSkills(skills: GeneratedSkills) {
  const rows = SKILL_CATEGORIES.flatMap((category) =>
    skills[category].map((name) => ({ category, name }))
  )

  await prisma.$transaction([
    prisma.skill.deleteMany({}),
    ...(rows.length
      ? [
          prisma.skill.createMany({
            data: rows,
            skipDuplicates: true,
          }),
        ]
      : []),
  ])
}

export async function getSkills() {
  return prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })
}
