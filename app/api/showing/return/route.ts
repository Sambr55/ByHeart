import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { returnShowing } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Show them yours back — which is also how you accept.
 *
 * The card has already been minted by /api/share by the time this is called, so what
 * arrives here is consent attached to an artefact that exists. There is no separate
 * accept: agreeing costs you a card of your own, and that cost is the whole design.
 */
const SAID: Record<string, string> = {
  gone: 'That link has gone.',
  taken: 'Somebody has already answered this one. It was addressed to one person.',
  expired: 'That invitation has expired.',
  blocked: 'That link has gone.',
}

export async function POST(request: Request) {
  let body: { showing_id?: unknown; card_id?: unknown }
  try {
    body = (await request.json()) as { showing_id?: unknown; card_id?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const showing = typeof body.showing_id === 'string' ? body.showing_id.trim() : ''
  const card = typeof body.card_id === 'string' ? body.card_id.trim() : ''
  if (!showing || !card) {
    return NextResponse.json({ ok: false, reason: 'missing' }, { status: 400 })
  }

  const device = await ensureDevice()
  const user = await currentUser()
  const result = await returnShowing(showing, card, { userId: user?.id ?? null, deviceId: device })
  if (result !== 'ok') {
    return NextResponse.json({ ok: false, reason: SAID[result] ?? SAID.gone }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
