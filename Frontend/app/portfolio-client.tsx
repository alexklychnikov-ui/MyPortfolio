"use client"

import { I18nProvider, useI18n } from "@/components/portfolio/i18n"
import Image from "next/image"
import Navbar from "@/components/portfolio/Navbar"
import TopUtilityBar from "@/components/portfolio/TopUtilityBar"
import Hero from "@/components/portfolio/Hero"
import Skills from "@/components/portfolio/Skills"
import Projects from "@/components/portfolio/Projects"
import Services from "@/components/portfolio/Services"
import About from "@/components/portfolio/About"
import Testimonials from "@/components/portfolio/Testimonials"
import Contact from "@/components/portfolio/Contact"
import "./portfolio.css"

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

type Testimonial = {
  text: { ru: string; en: string }
  author: { ru: string; en: string }
  role: { ru: string; en: string }
  rating?: number
}

function SkipLink() {
  const { locale, t } = useI18n()
  return (
    <a href="#main-content" className="skip-link">
      {t.a11y.skipLink[locale]}
    </a>
  )
}

function Footer() {
  const { locale, t } = useI18n()
  return (
    <footer className="portfolio-footer">
      <div className="footer-content">
        <p>{`\u00A9 ${new Date().getFullYear()} ${t.footer.copyright[locale]}`}</p>
        <Image
          src="/assets/myLogotype.jpg"
          alt="NODEX — логотип портфолио"
          className="footer-logo"
          width={48}
          height={48}
          unoptimized
        />
        <p>{`\u2014 ${t.footer.text[locale]}`}</p>
      </div>
    </footer>
  )
}

export default function PortfolioClient({
  telegramContactUrl,
  telegramBotUsername,
  initialProjects,
  initialServices,
  initialSkills,
  initialTestimonials,
}: {
  telegramContactUrl: string
  telegramBotUsername: string
  initialProjects: Project[]
  initialServices: Service[]
  initialSkills: SkillsData
  initialTestimonials: Testimonial[]
}) {
  return (
    <I18nProvider>
      <div className="portfolio">
        <SkipLink />
        <TopUtilityBar
          telegramContactUrl={telegramContactUrl}
          telegramBotUsername={telegramBotUsername}
        />
        <Navbar />
        <main id="main-content">
          <Hero />
          <Services initialServices={initialServices} />
          <Projects initialProjects={initialProjects} />
          <Skills initialSkills={initialSkills} />
          <About />
          <Testimonials initialTestimonials={initialTestimonials} />
          <Contact
            telegramContactUrl={telegramContactUrl}
            telegramBotUsername={telegramBotUsername}
          />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
