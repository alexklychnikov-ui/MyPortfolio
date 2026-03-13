import { z } from "zod"

const localizedTextSchema = z.object({
  ru: z.string().min(1),
  en: z.string().min(1),
})

export const generatedProjectSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  stack: z.string().min(1),
  tag: z.string().url(),
})

export const generatedServiceSchema = z.object({
  id: z.string().min(1).optional(),
  title: localizedTextSchema,
  description: localizedTextSchema,
})

export const generatedSkillsSchema = z.object({
  nocode: z.array(z.string()),
  ai: z.array(z.string()),
  automation: z.array(z.string()),
})

export const generatedPortfolioSchema = z.object({
  projects: z.array(generatedProjectSchema),
  services: z.array(generatedServiceSchema),
  skills: generatedSkillsSchema,
})

export type GeneratedPortfolio = z.infer<typeof generatedPortfolioSchema>
