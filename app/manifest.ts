import type { MetadataRoute } from 'next'
import { BRAND } from '@/content/brand'

/**
 * Installable from the browser today; the same manifest is what a Capacitor or
 * Trusted Web Activity wrapper reads when this goes to the stores.
 *
 * `display: standalone` is the one that matters — it removes the browser chrome, and
 * without it an installed DUB looks like a bookmark rather than an app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.title,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#07090c',
    theme_color: '#07090c',
    categories: ['education', 'entertainment'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
