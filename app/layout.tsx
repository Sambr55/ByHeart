import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, Newsreader } from 'next/font/google'
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

/**
 * The English meaning, and only that. One warm text face used for the whisper under the
 * Portuguese does more for warmth than any colour change, and it makes the hierarchy
 * structural: two voices, not one voice at two sizes.
 */
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
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
  // Matches the light ground, which is now the default. The dark entry lets the browser
  // chrome follow a learner who prefers dark rather than sitting in the wrong theme.
  // Follows the header bar, so the phone's own chrome agrees with the app under it.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1f5d8c' },
    { media: '(prefers-color-scheme: dark)', color: '#1f5d8c' },
  ],
  width: 'device-width',
  initialScale: 1,
  /**
   * No maximumScale. Blocking pinch-zoom is a WCAG 1.4.4 failure and it is actively
   * hostile to the older learners the age question exists to serve — and it is
   * self-defeating anyway, because it also stops somebody zooming back out after a
   * stray pan.
   */
  // Standalone on a notched phone: the app paints into the safe areas itself, which
  // it now actually does — the insets are used in globals.css.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
