import { NextResponse } from 'next/server'
import { claim, claimFor } from '@/lib/venues'
import { gemById } from '@/content/gems'
import { drawOn } from '@/lib/venue-rules'
import type { SecondOffer } from '@/content/board'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** The venue's own sign-up, on the link the local partner hands over. No account needed: the link is the key. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const v = await claimFor(token)
  if (!v) return NextResponse.json({ error: 'gone' }, { status: 404 })
  const g = gemById(v.gem)
  return NextResponse.json({ gem: v.gem, name: g?.name ?? v.gem, address: g?.address ?? '', claimed: v.claimed, card: v.card, draw: drawOn() })
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const r = await claim(token, {
    contactName: typeof b.contactName === 'string' ? b.contactName : '',
    contact: typeof b.contact === 'string' ? b.contact : '',
    pin: b.pin,
    offerFirst: b.offerFirst !== false,
    offerSecond: (typeof b.offerSecond === 'string' ? b.offerSecond : 'none') as SecondOffer,
    item: typeof b.item === 'string' ? b.item : '',
    cap: typeof b.cap === 'number' ? b.cap : null,
    offerPair: b.offerPair === true,
    pairItem: typeof b.pairItem === 'string' ? b.pairItem : '',
  })
  return NextResponse.json({ result: r }, { status: r === 'ok' ? 200 : r === 'gone' ? 404 : r === 'unavailable' ? 503 : 422 })
}
