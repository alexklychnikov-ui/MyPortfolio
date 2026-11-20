"use client"

import { useI18n } from "./i18n"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"

const principleIcons = [
  <svg key="eye" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>,
  <svg key="bolt" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>,
  <svg key="layers" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>,
  <svg key="target" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>,
]

export default function About() {
  const { locale, t } = useI18n()
  const revealRef = useScrollReveal<HTMLElement>()
  const a = t.about

  return (
    <section id="about" className="section about-section reveal-section" ref={revealRef}>
      <div className="section-container">
        <div className="section-header about-header">
          <span className="section-label">{a.label[locale]}</span>
          <h2 className="section-title about-title">
            <span className="about-title-strong">{a.titleStrong[locale]}</span>{" "}
            <span className="about-title-muted">{a.titleMuted[locale]}</span>
          </h2>
        </div>

        <div className="about-grid">
          <div className="about-photo-wrap">
            <img
              className="about-photo"
              src="/assets/profile.jpg"
              alt={a.photoAlt[locale]}
              width={420}
              height={520}
            />
          </div>

          <div className="about-content">
            {a.paragraphs[locale].map((p) => (
              <p key={p.slice(0, 32)} className="about-text">
                {p}
              </p>
            ))}

            <div className="about-principles">
              {a.principles[locale].map((item, idx) => (
                <article key={item.title} className="about-principle">
                  <div className="about-principle-icon">{principleIcons[idx] || principleIcons[0]}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
