export const SKILL_CATEGORIES = [
  "languageRuntime",
  "aiLlm",
  "backend",
  "botsIntegrations",
  "infrastructure",
  "automation",
  "devTools",
] as const

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]

export function emptySkillsGrouped(): Record<SkillCategory, string[]> {
  return Object.fromEntries(SKILL_CATEGORIES.map((category) => [category, []])) as Record<
    SkillCategory,
    string[]
  >
}
