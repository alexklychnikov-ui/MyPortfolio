"use client"

import { I18nProvider, useI18n } from "@/components/portfolio/i18n"
import Navbar from "@/components/portfolio/Navbar"
import Hero from "@/components/portfolio/Hero"
import Skills from "@/components/portfolio/Skills"
import Projects from "@/components/portfolio/Projects"
import Services from "@/components/portfolio/Services"
import Testimonials from "@/components/portfolio/Testimonials"
import Contact from "@/components/portfolio/Contact"
import "./portfolio.css"

function Footer() {
  const { locale, t } = useI18n()
  return (
    <footer className="portfolio-footer">
      <p>{`\u00A9 ${new Date().getFullYear()} dev.folio \u2014 ${t.footer.text[locale]}`}</p>
    </footer>
  )
}

export default function Page() {
  return (
    <I18nProvider>
      <div className="portfolio">
        <Navbar />
        <main>
          <Hero />
          <Skills />
          <Projects />
          <Services />
          <Testimonials />
          <Contact />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
