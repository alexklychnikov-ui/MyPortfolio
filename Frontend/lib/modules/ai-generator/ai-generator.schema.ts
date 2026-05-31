import { z } from "zod"

const localizedTextSchema = z.object({
  ru: z.string().min(1),
  en: z.string().min(1),
})

export const generatedProjectSchema = z.object({
  title: localizedTextSchema,
  description: localizedTextSchema,
  goal: localizedTextSchema,
  role: localizedTextSchema,
  result: localizedTextSchema,
  stack: z.string().min(1),
  tag: z.string().url(),
  demoUrl: z
    .string()
    .transform((value) => value.trim())
    .transform((value) => (value && /^https?:\/\//i.test(value) ? value : undefined))
    .optional(),
})

export const generatedServiceSchema = z.object({
  id: z.string().min(1).optional(),
  title: localizedTextSchema,
  description: localizedTextSchema,
})

export const generatedSkillsSchema = z.object({
  languageRuntime: z.array(z.string()),
  aiLlm: z.array(z.string()),
  backend: z.array(z.string()),
  botsIntegrations: z.array(z.string()),
  infrastructure: z.array(z.string()),
  automation: z.array(z.string()),
  devTools: z.array(z.string()),
})

export const generatedPortfolioSchema = z.object({
  projects: z.array(generatedProjectSchema),
  services: z.array(generatedServiceSchema),
  skills: generatedSkillsSchema,
})

export type GeneratedPortfolio = z.infer<typeof generatedPortfolioSchema>
