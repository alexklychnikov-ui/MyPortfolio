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
                <><span>VibeCode</span>{" / No-Code Developer"}</>
              ) : (
                <><span>VibeCode</span>{" / No-Code \u0420\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A"}</>
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
