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
        NOT DECLARED MASKABLE, deliberately, and it is worth knowing why.

        Android letterboxes a non-maskable icon into a white circle, which reads as a
        bookmark rather than an app — so `purpose: 'maskable'` looks like a one-word fix.
        It is not. A maskable icon is cropped to the centre 80%, and this tile is a
        full-bleed azulejo whose whole subject is the frame and the four corner motifs.
        Declaring it maskable would crop off the thing the icon is OF.

        The fix is a second 512 variant drawn inside the safe zone — the DUB mark alone on
        the azulejo blue, no frame — served at its own id and listed here beside this one.
        That is a design job rather than a config change, so it is named here rather than
        bodged. See app/icon.tsx for how the two sizes already diverge.
      */
      { src: '/icon/tile', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
