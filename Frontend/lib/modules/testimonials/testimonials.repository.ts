import { prisma } from "@/lib/db"

export type TestimonialCreate = {
  text: { ru: string; en: string }
  author: { ru: string; en: string }
  role: { ru: string; en: string } | null
  rating: number | null
}

export async function createTestimonial(data: TestimonialCreate) {
  return prisma.testimonial.create({
    data: {
      text: data.text as object,
      author: data.author as object,
      role: data.role as object | null,
      rating: data.rating,
    },
  })
}

export async function findApprovedTestimonials() {
  return prisma.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function findPendingTestimonials() {
  return prisma.testimonial.findMany({
    where: { approved: false },
    orderBy: { createdAt: "desc" },
  })
}

export async function updateApproved(id: string, approved: boolean) {
  return prisma.testimonial.update({
    where: { id },
    data: { approved },
  })
}
