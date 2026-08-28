import { THEME_SCRIPT } from '@/components/Theme'
import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { BRAND } from '@/content/brand'
import './globals.css'
import { Translator } from '@/components/Translator'

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
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <head>
        {/*
          The theme, applied before the first paint.

          Read after hydration instead and a dark-preferring person watches a white page
          for a frame on every navigation. It only sets a data attribute on the root, so
          there is nothing for React to disagree with when it hydrates.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        {children}
        {/*
          Mounted at the root, because "anywhere" has to mean anywhere.

          Putting it in each shell would be four copies with four chances to disagree, and
          it would still be missing from the full-bleed screens — which are exactly the
          ones somebody is on when a real conversation starts. It renders nothing at all
          until the learner is in the Club and the server says a key is configured.
        */}
        <Translator />
      </body>
    </html>
  )
}
