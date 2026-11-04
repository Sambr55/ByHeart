import { NextResponse } from 'next/server'
import { gemById } from '@/content/gems'
import { gemPhoto } from '@/lib/places'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

/**
 * The photo for one gem, as a URL and a photographer's name — lib/places.ts.
 *
 * 404 means "draw the kind's mark instead": no key yet, no match on Google, or a place
 * with no photos. The card cannot tell those apart and does not need to.
 */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params
  const gem = gemById(id)
  if (!gem) return NextResponse.json({ none: 'unknown' }, { status: 404 })
  const w = Number(new URL(req.url).searchParams.get('w'))
  const width = w >= 600 ? 800 : 400
  const photo = await gemPhoto(gem, width)
  if (!photo) {
    return NextResponse.json({ none: true }, { status: 404, headers: { 'cache-control': 'public, s-maxage=3600' } })
  }
  return NextResponse.json(photo, { headers: { 'cache-control': 'public, max-age=3600, s-maxage=43200' } })
}
