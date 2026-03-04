import { z } from "zod"

const noHtml = (s: string) => !/<[a-z][\s\S]*>/i.test(s)

export const createTestimonialSchema = z.object({
  text: z
    .string()
    .min(20, "Text 20–2000 chars")
    .max(2000)
    .refine(noHtml, "Invalid characters"),
  author: z
    .string()
    .min(1, "Author required")
    .max(100)
    .refine(noHtml, "Invalid characters"),
  role: z
    .string()
    .max(100)
    .refine((s) => !s || noHtml(s), "Invalid characters")
    .optional()
    .transform((s) => s?.trim() || undefined),
  rating: z.number().int().min(1).max(5).optional(),
})

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>

export type TestimonialPublic = {
  text: { ru: string; en: string }
  author: { ru: string; en: string }
  role: { ru: string; en: string }
  rating?: number
}
