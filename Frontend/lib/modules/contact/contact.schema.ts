import { z } from "zod"

const noHtml = (s: string) => !/<[a-z][\s\S]*>/i.test(s)

export const contactInputSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100)
    .refine(noHtml, "Invalid characters"),
  email: z.string().email("Invalid email").max(255),
  phone: z
    .string()
    .max(30)
    .refine((s) => !s || noHtml(s), "Invalid characters")
    .optional()
    .transform((s) => s?.trim() || undefined),
  message: z
    .string()
    .min(10, "Message too short")
    .max(5000)
    .refine(noHtml, "Invalid characters"),
})

export type ContactInput = z.infer<typeof contactInputSchema>
