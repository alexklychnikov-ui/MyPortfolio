import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import {
  githubProfileUrl,
  ogImagePath,
  personNameRu,
  siteDescription,
  siteKeywords,
  siteTitle,
  siteUrl,
} from '@/lib/seo'

import './globals.css'

const _inter = Inter({ subsets: ['latin'] })

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
    images: [
      {
        url: ogImagePath,
        width: 680,
        height: 680,
        alt: `${personNameRu} — фото разработчика`,
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
  verification: {
    yandex: '1d0c5c05e355fcf0',
  },
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
      <head>
        <link rel="me" href={githubProfileUrl} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
