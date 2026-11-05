import { NextResponse } from 'next/server'
import { absoluteUrl, adminKeyValid } from '@/lib/auth'
import { adminVenues, makeClaim, setPaused } from '@/lib/venues'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Every venue with its count — the local partner's pitch sheet. */
export async function GET(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const rows = await adminVenues()
  return NextResponse.json({ venues: (rows ?? []).map((r) => ({ ...r, cardUrl: r.card ? absoluteUrl('/v/' + r.card) : null })) })
}

/** { gem } → a fresh claim link (the old one stops working); { gem, paused } → pause or resume. */
export async function POST(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { gem?: unknown; paused?: unknown }
  if (typeof b.gem !== 'string') return NextResponse.json({ error: 'gem' }, { status: 400 })
  if (typeof b.paused === 'boolean') return NextResponse.json({ ok: await setPaused(b.gem, b.paused) })
  const r = await makeClaim(b.gem)
  if (r === 'gem') return NextResponse.json({ error: 'gem' }, { status: 404 })
  if (r === 'unavailable') return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  return NextResponse.json({ claimUrl: absoluteUrl('/venue/' + r.token), cardUrl: absoluteUrl('/v/' + r.card), card: r.card })
}
