import { readFile } from "node:fs/promises"
import path from "node:path"

import PortfolioClient from "./portfolio-client"

export const dynamic = "force-dynamic"

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
  stack: string
  tag: string
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

type SkillsData = {
  nocode?: string[]
  ai?: string[]
  automation?: string[]
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

export default async function Page() {
  const siteUrl = "https://portfolio.hayklyvibelexy.ru"
  const telegramContactUrl =
    process.env.TELEGRAM_CONTACT_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_CONTACT_URL?.trim() ||
    ""
  const telegramBotUsername =
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
    ""
  const [initialProjects, initialServices, initialSkills] = await Promise.all([
    readJsonFile<Project[]>("projects.json", []),
    readJsonFile<Service[]>("services.json", []),
    readJsonFile<SkillsData>("skills.json", {}),
  ])
  const telegramUsername = telegramBotUsername || "Alex_Assistant_freelancing_bot"
  const personStructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Александр Клычников",
    alternateName: ["Alexander Klychnikov", "Клычников Александр"],
    url: siteUrl,
    image: `${siteUrl}/assets/myLogotype.svg`,
    jobTitle: "AI, Telegram Bot и No-Code разработчик",
    description:
      "Клычников Александр - разработчик Telegram-ботов, AI-интеграций, сайтов, MVP и бизнес-автоматизаций.",
    knowsAbout: [
      "Telegram Bots",
      "OpenAI",
      "AI integrations",
      "No-code",
      "MVP development",
      "Automation",
      "Next.js",
    ],
    email: "alexandr_klychnikov@mail.ru",
    sameAs: [
      `https://t.me/${telegramUsername}`,
      `tg://resolve?domain=${telegramUsername}`,
    ],
  }
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Портфолио Александра Клычникова",
    alternateName: "dev.folio",
    url: siteUrl,
    inLanguage: ["ru-RU", "en-US"],
    about: {
      "@type": "Person",
      name: "Александр Клычников",
    },
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([personStructuredData, websiteStructuredData]),
        }}
      />
      <PortfolioClient
        telegramContactUrl={telegramContactUrl}
        telegramBotUsername={telegramBotUsername}
        initialProjects={initialProjects}
        initialServices={initialServices}
        initialSkills={initialSkills}
      />
    </>
  )
}
