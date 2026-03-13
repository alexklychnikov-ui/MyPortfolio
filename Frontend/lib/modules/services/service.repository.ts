import { prisma } from "@/lib/db"
import type { GeneratedPortfolio } from "@/lib/modules/ai-generator/ai-generator.schema"

type GeneratedService = GeneratedPortfolio["services"][number]

export async function replaceServices(services: GeneratedService[]) {
  await prisma.$transaction([
    prisma.service.deleteMany({}),
    prisma.service.createMany({
      data: services.map((service) => ({
        externalId: service.id ?? null,
        title: service.title as object,
        description: service.description as object,
      })),
    }),
  ])
}

export async function getServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  })
}
