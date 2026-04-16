import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const siteUrl = 'https://portfolio.hayklyvibelexy.ru'
const siteTitle = 'Клычников Александр - AI, Telegram Bot и No-Code разработчик'
const siteDescription =
  'Клычников Александр - Senior No-Code и AI разработчик. Разработка MVP, Telegram-ботов, AI-интеграций, сайтов и автоматизаций для бизнеса.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: 'dev.folio',
  alternates: {
    canonical: '/',
    languages: {
      'ru-RU': '/',
      'en-US': '/?lang=en',
    },
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: 'dev.folio',
    locale: 'ru_RU',
    images: [
      {
        url: '/assets/myLogotype.svg',
        width: 512,
        height: 512,
        alt: 'Логотип портфолио Александра Клычникова',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
    images: ['/assets/myLogotype.svg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
