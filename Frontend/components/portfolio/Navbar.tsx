"use client"

import { useEffect, useState } from "react"
import { useI18n } from "./i18n"

export default function Navbar() {
  const { locale, setLocale, t } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`portfolio-nav${scrolled ? " scrolled" : ""}`}
      role="navigation"
      aria-label={t.langSwitch.navAriaLabel[locale]}
    >
      <div className="nav-container">
        <a href="#" className="nav-logo">
          dev<span>.</span>folio
        </a>
        <ul className={`nav-links${menuOpen ? " open" : ""}`}>
          <li><a href="#skills" onClick={() => setMenuOpen(false)}>{t.nav.skills[locale]}</a></li>
          <li><a href="#projects" onClick={() => setMenuOpen(false)}>{t.nav.projects[locale]}</a></li>
          <li><a href="#services" onClick={() => setMenuOpen(false)}>{t.nav.services[locale]}</a></li>
          <li><a href="#testimonials" onClick={() => setMenuOpen(false)}>{t.nav.testimonials[locale]}</a></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>{t.nav.contact[locale]}</a></li>
        </ul>
        <div className="nav-right">
          <div className="lang-switch" role="radiogroup" aria-label="Language">
            <button
              className={`lang-btn${locale === "ru" ? " active" : ""}`}
              onClick={() => setLocale("ru")}
              aria-checked={locale === "ru"}
              role="radio"
            >
              RU
            </button>
            <button
              className={`lang-btn${locale === "en" ? " active" : ""}`}
              onClick={() => setLocale("en")}
              aria-checked={locale === "en"}
              role="radio"
            >
              EN
            </button>
          </div>
          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.langSwitch.menuAriaLabel[locale]}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  )
}
