import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const contactEmail = process.env.CONTACT_EMAIL

export async function sendContactEmail(params: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resendApiKey || !contactEmail) {
    return { ok: false, error: "Email not configured" }
  }
  try {
    const body = [
      `Имя: ${params.name}`,
      `Email: ${params.email}`,
      ...(params.phone ? [`Телефон: ${params.phone}`] : []),
      "",
      "Сообщение:",
      params.message,
    ].join("\n")
    const resend = new Resend(resendApiKey)
    const { error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: contactEmail,
      replyTo: params.email,
      subject: "Новое сообщение с портфолио",
      text: body,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed"
    return { ok: false, error: message }
  }
}
