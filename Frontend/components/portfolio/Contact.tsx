"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useI18n } from "./i18n"

function extractUsernameFromTmeUrl(url: string): string | null {
  const u = url.trim()
  if (!u) return null
  const m = u.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i)
  return m?.[1] ?? null
}

function resolveBotUsername(explicit: string, tmeUrl: string, fallback: string): string {
  const e = explicit.trim().replace(/^@/, "")
  if (e) return e
  const fromUrl = extractUsernameFromTmeUrl(tmeUrl)
  if (fromUrl) return fromUrl
  return fallback.replace(/^@/, "")
}

export default function Contact({
  telegramContactUrl = "",
  telegramBotUsername = "",
}: {
  telegramContactUrl?: string
  telegramBotUsername?: string
}) {
  const { locale, t } = useI18n()
  const botUsername = resolveBotUsername(telegramBotUsername, telegramContactUrl, t.contact.telegramUsername)
  const telegramAppHref = `tg://resolve?domain=${encodeURIComponent(botUsername)}`
  const telegramWebHref = `https://t.me/${encodeURIComponent(botUsername)}`
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement).value
    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim() || undefined
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value

    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      })
      const data = (await res.json()) as { success: boolean; error?: string }
      if (data.success) {
        toast.success(t.contact.success[locale])
        form.reset()
      } else {
        toast.error(data.error ?? t.contact.error[locale])
      }
    } catch {
      toast.error(t.contact.error[locale])
    } finally {
      setSending(false)
    }
  }

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
              <div className="contact-actions">
                <span className="contact-actions-label">{t.contact.quickConnectLabel[locale]}</span>
                <div className="contact-actions-buttons">
                  <a
                    href={telegramAppHref}
                    className="btn btn-outline btn-sm contact-action-btn"
                    aria-label={t.contact.telegram[locale]}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                    {t.contact.telegramButton[locale]}
                  </a>
                  <p className="contact-action-hint">{t.contact.telegramOpenAppHint[locale]}</p>
                  <a
                    href={telegramWebHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-action-web-link"
                  >
                    @{botUsername} · t.me
                  </a>
                </div>
              </div>
            </div>
          </div>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
            aria-label={t.contact.formAriaLabel[locale]}
          >
            <div className="form-group">
              <label htmlFor="name">{t.contact.nameLabel[locale]}</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder={t.contact.namePlaceholder[locale]}
                required
                autoComplete="name"
                disabled={sending}
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
                disabled={sending}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">{t.contact.phoneLabel[locale]}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder={t.contact.phonePlaceholder[locale]}
                autoComplete="tel"
                disabled={sending}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">{t.contact.messageLabel[locale]}</label>
              <textarea
                id="message"
                name="message"
                placeholder={t.contact.messagePlaceholder[locale]}
                required
                disabled={sending}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? t.contact.sending[locale] : t.contact.sendButton[locale]}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
