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

function resolveTelegramHref(contactUrl: string, botUsername: string, fallbackUser: string): string {
  const fromUrl = contactUrl.trim()
  if (fromUrl) {
    if (fromUrl.startsWith("http") || fromUrl.startsWith("tg:")) return fromUrl
    const user = fromUrl.replace(/^@/, "")
    return `https://t.me/${user}`
  }
  const bot = botUsername.trim().replace(/^@/, "")
  if (bot) return `https://t.me/${bot}`
  const extracted = extractUsernameFromTmeUrl(contactUrl)
  const user = extracted || fallbackUser.replace(/^@/, "")
  return `https://t.me/${user}`
}

export default function TopUtilityBar({
  telegramContactUrl = "",
  telegramBotUsername = "",
}: {
  telegramContactUrl?: string
  telegramBotUsername?: string
}) {
  const { locale, t } = useI18n()
  const [copied, setCopied] = useState(false)
  const email = t.contact.email
  const telegramHref = resolveTelegramHref(
    telegramContactUrl,
    telegramBotUsername,
    t.contact.telegramUsername
  )

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      toast.success(t.utility.copied[locale])
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(t.utility.copyFailed[locale])
    }
  }

  return (
    <div className="top-utility-bar" role="region" aria-label={t.utility.ariaLabel[locale]}>
      <div className="top-utility-inner">
        <a
          href={telegramHref}
          className="top-utility-link"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.utility.telegram[locale]}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span>Telegram</span>
        </a>
        <a
          href={t.contact.maxUrl}
          className="top-utility-link top-utility-max"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.utility.max[locale]}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{t.utility.max[locale]}</span>
        </a>
        <a href={`mailto:${email}`} className="top-utility-link" aria-label={t.utility.email[locale]}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <span className="top-utility-email">{email}</span>
        </a>
        <button
          type="button"
          className="top-utility-copy"
          onClick={copyEmail}
          aria-label={t.utility.copyEmail[locale]}
        >
          {copied ? t.utility.copiedShort[locale] : t.utility.copy[locale]}
        </button>
      </div>
    </div>
  )
}
