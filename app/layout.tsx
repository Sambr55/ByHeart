import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { BRAND } from '@/content/brand'
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
  title: BRAND.title,
  description: BRAND.description,
  applicationName: BRAND.name,
  // Installed on a phone, DUB should look like an app rather than a saved page.
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: BRAND.title,
    description: BRAND.description,
  },
  twitter: { card: 'summary_large_image', title: BRAND.title, description: BRAND.description },
}

export const viewport: Viewport = {
  themeColor: '#07090c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Standalone on a notched phone: the app paints into the safe areas itself.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
