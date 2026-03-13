import { prisma } from "@/lib/db"
import type { GeneratedPortfolio } from "@/lib/modules/ai-generator/ai-generator.schema"

type GeneratedSkills = GeneratedPortfolio["skills"]

export async function replaceSkills(skills: GeneratedSkills) {
  const rows = [
    ...skills.nocode.map((name) => ({ category: "nocode", name })),
    ...skills.ai.map((name) => ({ category: "ai", name })),
    ...skills.automation.map((name) => ({ category: "automation", name })),
  ]

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
