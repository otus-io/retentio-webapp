import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { APP_DESC, APP_NAME } from '@/config'
import { getLocale } from '@/lib/locale.server'

import '@/app/globals.css'
import { AppProvider } from '@/provider/AppProvider'


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - ${APP_DESC}`,
    template: `%s | ${APP_NAME}`, // 子页面用：页面名 | Retentio
  },
  description: 'Retentio helps you remember more for longer using spaced repetition and smart review systems.',
  keywords: ['spaced repetition', 'memory', 'learning', 'flashcards', 'retention'],
  authors: [{ name: 'Retentio Team' }],

  // Open Graph（社交媒体分享预览）
  openGraph: {
    title: `${APP_NAME} - ${APP_DESC}`,
    description: 'Remember more, for longer.',
    url: 'https://retentio.vercel.app',
    siteName: APP_NAME,
    images: [{ url: '/logo.svg', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - ${APP_DESC}`,
    description: 'Remember more, for longer.',
    images: ['/logo.svg'],
  },

  // 告诉 Google 如何索引
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  // 规范链接（防重复内容）
  alternates: {
    canonical: 'https://retentio.vercel.app',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()


  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <NextIntlClientProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
