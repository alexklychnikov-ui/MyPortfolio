import { readFile } from "node:fs/promises"
import path from "node:path"

import PortfolioClient from "./portfolio-client"
import {
  githubProfileUrl,
  ogImagePath,
  personNameEn,
  personNameEnAlt,
  personNameRu,
  personNameRuAlt,
  siteDescription,
  siteUrl,
} from "@/lib/seo"

export const revalidate = 3600

type Project = {
  id: string
  title: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
  goal?: {
    ru: string
    en: string
  }
  role?: {
    ru: string
    en: string
  }
  result?: {
    ru: string
    en: string
  }
  stack: string
  tag: string
  demoUrl?: string
  image?: string
}

type Service = {
  id: string
  title: {
    ru: string
    en: string
  }
  description: {
    ru: string
    en: string
  }
}

type SkillsData = Record<string, string[] | undefined>

type Testimonial = {
  text: { ru: string; en: string }
  author: { ru: string; en: string }
  role?: { ru: string; en: string }
  rating?: number
}

async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  try {
    const filePath = path.join(process.cwd(), "public", "data", fileName)
    const fileContents = await readFile(filePath, "utf-8")
    return JSON.parse(fileContents) as T
  } catch {
    return fallback
  }
}

function extractTelegramUsername(value: string): string | null {
  const normalized = value.trim()
  if (!normalized) return null
  if (normalized.startsWith("@")) return normalized.slice(1)
  const match = normalized.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i)
  return match?.[1] ?? null
}

export default async function Page() {
  const telegramContactUrl =
    process.env.TELEGRAM_LEADS_CONTACT_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_LEADS_CONTACT_URL?.trim() ||
    process.env.TELEGRAM_CONTACT_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_CONTACT_URL?.trim() ||
    ""
  const telegramBotUsername =
    process.env.TELEGRAM_LEADS_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_LEADS_BOT_USERNAME?.trim() ||
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
    ""
  const [initialProjects, initialServices, initialSkills, initialTestimonials] = await Promise.all([
    readJsonFile<Project[]>("projects.json", []),
    readJsonFile<Service[]>("services.json", []),
    readJsonFile<SkillsData>("skills.json", {}),
    readJsonFile<Testimonial[]>("testimonials.json", []),
  ])
  const telegramUsername =
    extractTelegramUsername(telegramContactUrl) ||
    extractTelegramUsername(telegramBotUsername) ||
    "Alex_Assistant_freelancing_bot"
  const telegramPublicUrl = telegramContactUrl || `https://t.me/${telegramUsername}`
  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: personNameRuAlt,
    givenName: "Александр",
    familyName: "Клычников",
    alternateName: [personNameRu, personNameEn, personNameEnAlt],
    url: siteUrl,
    image: `${siteUrl}${ogImagePath}`,
    jobTitle: "AI, Telegram Bot и No-Code разработчик",
    description: siteDescription,
    knowsAbout: [
      "Telegram Bots",
      "OpenAI",
      "AI integrations",
      "No-code",
      "MVP development",
      "Automation",
      "Next.js",
      "FastAPI",
    ],
    email: "alexandr_klychnikov@mail.ru",
    sameAs: [
      githubProfileUrl,
      telegramPublicUrl,
    ],
  }
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: `Портфолио ${personNameRu}`,
    url: siteUrl,
    inLanguage: "ru-RU",
    publisher: { "@id": `${siteUrl}/#person` },
    about: { "@id": `${siteUrl}/#person` },
  }
  const profilePageStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": siteUrl,
    url: siteUrl,
    name: personNameRu,
    description: siteDescription,
    inLanguage: "ru-RU",
    mainEntity: { "@id": `${siteUrl}/#person` },
    isPartOf: { "@id": `${siteUrl}/#website` },
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            personStructuredData,
            websiteStructuredData,
            profilePageStructuredData,
          ]),
        }}
      />
      <PortfolioClient
        telegramContactUrl={telegramContactUrl}
        telegramBotUsername={telegramBotUsername}
        initialProjects={initialProjects}
        initialServices={initialServices}
        initialSkills={initialSkills}
        initialTestimonials={initialTestimonials}
      />
    </>
  )
}
