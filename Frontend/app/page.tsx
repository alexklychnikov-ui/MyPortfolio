import PortfolioClient from "./portfolio-client"

export const dynamic = "force-dynamic"

export default function Page() {
  const telegramContactUrl =
    process.env.TELEGRAM_CONTACT_URL?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_CONTACT_URL?.trim() ||
    ""
  const telegramBotUsername =
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
    ""
  return (
    <PortfolioClient
      telegramContactUrl={telegramContactUrl}
      telegramBotUsername={telegramBotUsername}
    />
  )
}
