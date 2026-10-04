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
    /*
      Sand and azulejo, not cockpit black.

      #07090c is the last colour left from the Top Gun palette, which was replaced
      everywhere else months ago — so an installed DUB opened on a near-black splash and
      then flashed into a warm sand app. The splash is the first frame of the product and
      it disagreed with every frame after it.

      background_color is the splash; theme_color is the system bar, which sits directly
      above the header — so it is the header's blue rather than the page's sand.
    */
    background_color: '#efe7d9',
    theme_color: '#1f5d8c',
    categories: ['education', 'entertainment'],
    icons: [
      { src: '/icon/small', sizes: '32x32', type: 'image/png' },
      /*
        TWO 512s, BECAUSE ANDROID AND IOS WANT DIFFERENT PICTURES.

        `tile` is the azulejo as drawn — frame, four corner motifs, mark. It is what shows
        anywhere the icon is used whole.

        `mask` is the maskable variant, and it exists because a launcher crops a maskable
        icon to its own shape and guarantees only the centre 80%. Measured against this
        art: the frame sits 46px in on a 512 canvas against a 51.2px safe margin, so
        declaring the TILE maskable would crop off the thing the icon is of. Without any
        maskable entry, Android letterboxes the tile into a white circle, which reads as a
        bookmark rather than an app. Neither is acceptable, hence a second drawing — the
        mark alone, larger, full-bleed azulejo, motifs pulled inside the safe zone. See
        app/icon.tsx.

        Order matters: a browser takes the first icon whose purpose it can use, so the
        plain one leads for everything that is not a launcher.
      */
      { src: '/icon/tile', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon/mask', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
