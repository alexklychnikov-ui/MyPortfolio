import { prisma } from "@/lib/db"
import type { GeneratedPortfolio } from "@/lib/modules/ai-generator/ai-generator.schema"

type GeneratedProject = GeneratedPortfolio["projects"][number]

export async function replaceProjects(projects: GeneratedProject[]) {
  await prisma.$transaction([
    prisma.project.deleteMany({}),
    prisma.project.createMany({
      data: projects.map((project) => ({
        title: project.title as object,
        description: project.description as object,
        stack: project.stack,
        tag: project.tag,
      })),
    }),
  ])
}

export async function getProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  })
}
