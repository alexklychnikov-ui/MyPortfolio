import { sanitizeString } from "@/lib/core/sanitize"
import { sendContactEmail } from "@/lib/core/email"
import { sendContactToTelegram } from "@/lib/core/telegram"
import { createContactMessage } from "./contact.repository"
import type { ContactInput } from "./contact.schema"

export async function submitContact(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = sanitizeString(input.name)
  const email = sanitizeString(input.email).toLowerCase()
  const phone = input.phone ? sanitizeString(input.phone) : undefined
  const message = sanitizeString(input.message)

  await createContactMessage({ name, email, phone: phone || null, message })

  const payload = { name, email, phone: phone ?? "", message }
  const [emailResult, telegramResult] = await Promise.all([
    sendContactEmail(payload),
    sendContactToTelegram(payload),
  ])

  if (!emailResult.ok && !telegramResult.ok) {
    return { ok: false, error: emailResult.error ?? telegramResult.error ?? "Delivery failed" }
  }
  return { ok: true }
}
