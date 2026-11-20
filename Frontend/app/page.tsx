import { readFile } from "node:fs/promises"
import path from "node:path"

import { getDisplayTestimonials } from "@/lib/modules/testimonials/testimonials.service"
import type { TestimonialPublic } from "@/lib/modules/testimonials/testimonials.schema"

import PortfolioClient from "./portfolio-client"
import {
  githubProfileUrl,
  jobTitleRu,
  ogImagePath,
  personNameEn,
  personNameEnAlt,
  personNameRu,
  personNameRuAlt,
  siteDescription,
  siteTitle,
  siteUrl,
} from "@/lib/seo"

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
  screenshots?: { url: string; label: string }[]
  videos?: { url: string; label: string }[]
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
  price?: {
    ru: string
    en: string
  }
  timeline?: {
    ru: string
    en: string
  }
}

type SkillsData = Record<string, string[] | undefined>

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
    getDisplayTestimonials().catch(() => [] as TestimonialPublic[]),
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
    jobTitle: jobTitleRu,
    description: siteDescription,
    knowsAbout: [
      "Telegram Bots",
      "OpenAI",
      "RAG",
      "LightRAG",
      "FastAPI",
      "PostgreSQL",
      "Docker",
      "Business process automation",
      "API integrations",
    ],
    email: "mailto:alexandr_klychnikov@mail.ru",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Irkutsk",
      addressCountry: "RU",
    },
    homeLocation: {
      "@type": "Place",
      name: "Irkutsk",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Irkutsk",
        addressCountry: "RU",
      },
    },
    sameAs: [
      githubProfileUrl,
      telegramPublicUrl,
      "https://max.ru/u/f9LHodD0cOJ6AYFaTXrO_W8Q740SO7vjkK0Gs8qmVPG8sUkLSN-QJwnwG1o",
    ],
  }
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteTitle,
    url: siteUrl,
    inLanguage: ["ru-RU", "en-US"],
    publisher: { "@id": `${siteUrl}/#person` },
    about: { "@id": `${siteUrl}/#person` },
  }
  const profilePageStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteUrl}/#profilepage`,
    url: siteUrl,
    name: siteTitle,
    description: siteDescription,
    inLanguage: ["ru-RU", "en-US"],
    mainEntity: { "@id": `${siteUrl}/#person` },
    isPartOf: { "@id": `${siteUrl}/#website` },
  }
  const offerCatalogStructuredData = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    "@id": `${siteUrl}/#services`,
    name: "Услуги",
    url: `${siteUrl}/#services`,
    itemListElement: initialServices.map((service, index) => ({
      "@type": "Offer",
      position: index + 1,
      name: service.title.ru,
      description: service.description.ru,
      priceCurrency: "RUB",
      price:
        service.price?.ru?.replace(/[^\d]/g, "") || undefined,
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/#contact`,
      seller: { "@id": `${siteUrl}/#person` },
    })),
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
            offerCatalogStructuredData,
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
