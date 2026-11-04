import { BRAND } from '@/content/brand'

/**
 * THE OPENING LINE'S OWN MANIFEST (2026-11-04). iOS ignores manifest `shortcuts`, so on an
 * iPhone the card gets its own home-screen icon instead: Add to Home Screen from /opener
 * reads this file, and its start_url and id make that icon open straight onto the card as
 * an app of its own, rather than onto the Path. See HomeScreenHint in components/Opener.tsx.
 */
export const dynamic = 'force-static'

export function GET() {
  return Response.json(
    {
      id: '/opener',
      name: 'My opening line — ' + BRAND.name,
      short_name: 'My line',
      description: 'The first line for the next place you walk into, and the save if it goes wrong.',
      start_url: '/opener',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#efe7d9',
      theme_color: '#1f5d8c',
      icons: [
        { src: '/icon/tile', sizes: '512x512', type: 'image/png' },
        { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      ],
    },
    { headers: { 'content-type': 'application/manifest+json' } },
  )
}
