import { prisma } from "@/lib/db"

export type ContactMessageCreate = {
  name: string
  email: string
  phone?: string | null
  message: string
}

export async function createContactMessage(data: ContactMessageCreate) {
  return prisma.contactMessage.create({ data })
}
