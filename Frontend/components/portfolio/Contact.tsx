"use client"

import { useI18n } from "./i18n"

export default function Contact() {
  const { locale, t } = useI18n()

  return (
    <section id="contact" className="section contact-section">
      <div className="section-container">
        <div className="section-header">
          <span className="section-label">{t.contact.label[locale]}</span>
          <h2 className="section-title">{t.contact.title[locale]}</h2>
          <p className="section-subtitle">{t.contact.subtitle[locale]}</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h3>{t.contact.infoTitle[locale]}</h3>
            <p>{t.contact.infoText[locale]}</p>
            <div className="contact-details">
              <div className="contact-detail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {t.contact.email}
              </div>
              <div className="contact-detail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {t.contact.location[locale]}
              </div>
              <div className="contact-detail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                {t.contact.responseTime[locale]}
              </div>
              <div className="contact-detail">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
                <a href={`https://t.me/${t.contact.telegramUsername}`} target="_blank" rel="noopener noreferrer">
                  {t.contact.telegram[locale]}
                </a>
              </div>
            </div>
          </div>

          <form className="contact-form" method="POST" action="#" aria-label={t.contact.formAriaLabel[locale]}>
            <div className="form-group">
              <label htmlFor="name">{t.contact.nameLabel[locale]}</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder={t.contact.namePlaceholder[locale]}
                required
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t.contact.emailLabel[locale]}</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder={t.contact.emailPlaceholder[locale]}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">{t.contact.messageLabel[locale]}</label>
              <textarea
                id="message"
                name="message"
                placeholder={t.contact.messagePlaceholder[locale]}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {t.contact.sendButton[locale]}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
