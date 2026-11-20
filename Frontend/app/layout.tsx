import React from "react"
import type { Metadata, Viewport } from 'next'
import { Manrope, Source_Sans_3 } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import {
  githubProfileUrl,
  jobTitleRu,
  ogImagePath,
  personNameRu,
  siteDescription,
  siteKeywords,
  siteTitle,
  siteUrl,
} from '@/lib/seo'

import './globals.css'

const displayFont = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap',
})

const bodyFont = Source_Sans_3({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-body-face',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${personNameRu}`,
  },
  description: siteDescription,
  applicationName: personNameRu,
  authors: [{ name: personNameRu, url: siteUrl }],
  creator: personNameRu,
  keywords: siteKeywords,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: personNameRu,
    locale: 'ru_RU',
    alternateLocale: ['en_US'],
    images: [
      {
        url: ogImagePath,
        width: 680,
        height: 680,
        alt: `${personNameRu} — ${jobTitleRu}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [ogImagePath],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
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
  verification: {
    yandex: '1d0c5c05e355fcf0',
    google: 'google8846ad12780bacbb',
    other: {
      'zen-verification':
        'RpIHkYFfo7q5CDdMJCpntrpunNryE6VIEeAraGqdLbTcBvF4MNTzBg8sGfB4V0Dq',
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#050812',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <head>
        <link rel="me" href={githubProfileUrl} />
        <link rel="author" type="text/plain" href="/humans.txt" />
      </head>
      <body className={`${bodyFont.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
