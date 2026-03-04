const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
const telegramChatId = process.env.TELEGRAM_CHAT_ID

export async function sendContactToTelegram(params: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!telegramBotToken || !telegramChatId) {
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
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: text.slice(0, 4096),
      }),
    })
    const data = (await res.json()) as { ok?: boolean; description?: string }
    if (!data.ok) return { ok: false, error: data.description ?? "Unknown error" }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed"
    return { ok: false, error: message }
  }
}
