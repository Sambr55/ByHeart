import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import './globals.css'

const display = Archivo({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
})

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BY HEART — Top Gun / Portuguese',
  description: 'Learn a language through things you already know.',
}

export const viewport: Viewport = {
  themeColor: '#07090c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
