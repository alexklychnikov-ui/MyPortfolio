import { prisma } from "@/lib/db"
import type { GeneratedPortfolio } from "@/lib/modules/ai-generator/ai-generator.schema"

type GeneratedProject = GeneratedPortfolio["projects"][number]

export async function replaceProjects(projects: GeneratedProject[]) {
  await prisma.$transaction([
    prisma.project.deleteMany({}),
    prisma.project.createMany({
      data: projects.map((project, index) => ({
        title: project.title as object,
        description: project.description as object,
        goal: project.goal ? (project.goal as object) : undefined,
        role: project.role ? (project.role as object) : undefined,
        result: project.result ? (project.result as object) : undefined,
        stack: project.stack,
        tag: project.tag,
        demoUrl: project.demoUrl ?? undefined,
        image: project.image ?? undefined,
        sortOrder: index,
      })),
    }),
  ])
}

export async function getProjects() {
  return prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
}
