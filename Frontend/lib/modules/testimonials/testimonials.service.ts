import { sanitizeString } from "@/lib/core/sanitize"
import {
  createTestimonial as repoCreate,
  findApprovedTestimonials,
  updateApproved as repoUpdateApproved,
} from "./testimonials.repository"
import type { CreateTestimonialInput } from "./testimonials.schema"
import type { TestimonialPublic } from "./testimonials.schema"

function toPublic(record: { text: unknown; author: unknown; role: unknown; rating: number | null }): TestimonialPublic {
  const text = record.text as { ru?: string; en?: string }
  const author = record.author as { ru?: string; en?: string }
  const role = record.role as { ru?: string; en?: string } | null
  return {
    text: { ru: text?.ru ?? "", en: text?.en ?? "" },
    author: { ru: author?.ru ?? "", en: author?.en ?? "" },
    role: role ? { ru: role.ru ?? "", en: role.en ?? "" } : { ru: "", en: "" },
    ...(record.rating != null && { rating: record.rating }),
  }
}

export async function createTestimonial(input: CreateTestimonialInput) {
  const text = sanitizeString(input.text)
  const author = sanitizeString(input.author)
  const role = input.role ? sanitizeString(input.role) : null
  const rating = input.rating ?? null
  const row = await repoCreate({
    text: { ru: text, en: text },
    author: { ru: author, en: author },
    role: role ? { ru: role, en: role } : null,
    rating,
  })
  return { id: row.id }
}

export async function getApprovedTestimonials(): Promise<TestimonialPublic[]> {
  const rows = await findApprovedTestimonials()
  return rows.map(toPublic)
}

export async function approveTestimonial(id: string, approved: boolean) {
  await repoUpdateApproved(id, approved)
}
