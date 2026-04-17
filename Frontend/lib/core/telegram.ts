const telegramLeadsBotToken =
  process.env.TELEGRAM_LEADS_BOT_TOKEN?.trim() ||
  process.env.TELEGRAM_BOT_TOKEN?.trim() ||
  ""
const telegramLeadsChatId =
  process.env.TELEGRAM_LEADS_CHAT_ID?.trim() ||
  process.env.TELEGRAM_CHAT_ID?.trim() ||
  ""
const telegramLeadsThreadId = process.env.TELEGRAM_LEADS_MESSAGE_THREAD_ID?.trim() || ""

export async function sendContactToTelegram(params: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!telegramLeadsBotToken || !telegramLeadsChatId) {
    return { ok: false, error: "Telegram not configured" }
  }
  try {
    const lines = [
      "Новое сообщение с портфолио",
      `Имя: ${params.name}`,
      `Email: ${params.email}`,
      ...(params.phone ? [`Телефон: ${params.phone}`] : []),
      "",
      params.message,
    ]
    const text = lines.join("\n")
    const payload: {
      chat_id: string
      text: string
      message_thread_id?: number
    } = {
      chat_id: telegramLeadsChatId,
      text: text.slice(0, 4096),
    }
    if (telegramLeadsThreadId) {
      const threadId = Number(telegramLeadsThreadId)
      if (Number.isFinite(threadId) && threadId > 0) {
        payload.message_thread_id = threadId
      }
    }
    const url = `https://api.telegram.org/bot${telegramLeadsBotToken}/sendMessage`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = (await res.json()) as { ok?: boolean; description?: string }
    if (!data.ok) return { ok: false, error: data.description ?? "Unknown error" }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed"
    return { ok: false, error: message }
  }
}
