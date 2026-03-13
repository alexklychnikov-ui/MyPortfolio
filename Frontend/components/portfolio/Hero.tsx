"use client"

import { useI18n } from "./i18n"

export default function Hero() {
  const { locale, t } = useI18n()

  return (
    <section className="hero section">
      <div className="section-container">
        <div className="hero-grid">
          <div className="hero-content">
            <h1>
              {locale === "en" ? (
                <>
                  <span className="hero-title">Vibecode developer</span>
                  <span className="hero-tagline">
                    Telegram bots & AI integrations for business
                  </span>
                </>
              ) : (
                <>
                  <span className="hero-title">Vibecode разработчик</span>
                  <span className="hero-tagline">
                    Telegram-боты и AI-интеграции для бизнеса
                  </span>
                </>
              )}
            </h1>
            <p className="hero-subtitle">{t.hero.subtitle[locale]}</p>
            <ul className="hero-list">
              {t.hero.benefits[locale].map((item) => (
                <li key={item}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="hero-buttons">
              <a href="#projects" className="btn btn-primary">
                {t.hero.cta.primary[locale]}
              </a>
              <a href="#contact" className="btn btn-outline">
                {t.hero.cta.secondary[locale]}
              </a>
            </div>
          </div>
          <div className="hero-photo-wrapper">
            <img
              className="hero-photo"
              src="/assets/profile.jpg"
              alt={t.hero.photoAlt[locale]}
              width={340}
              height={340}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
