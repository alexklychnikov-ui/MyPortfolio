import { z } from "zod"

const githubRepoUrlSchema = z
  .string()
  .url("Repository URL is invalid")
  .refine((url) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(url), "Repository must match https://github.com/:owner/:repo")

export const githubAnalyzeInputSchema = z.object({
  repositories: z.array(githubRepoUrlSchema).min(1, "At least one repository is required").max(10, "Maximum 10 repositories"),
})

export type GithubAnalyzeInput = z.infer<typeof githubAnalyzeInputSchema>
