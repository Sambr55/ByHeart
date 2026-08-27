import { NextResponse } from 'next/server'
import { currentUser, deviceId, ensureDevice } from '@/lib/auth'
import { createShowing, showingsFor, type Party } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mint a showing for a card that already exists.
 *
 * Deliberately takes a card id rather than a snapshot. /api/share already mints the
 * artefact and already applies the cap and the Legend filter; a second route that built
 * its own card from a request body would be a second place for that rule to be wrong.
 */
export async function POST(request: Request) {
  let body: { card_id?: unknown }
  try {
    body = (await request.json()) as { card_id?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const cardId = typeof body.card_id === 'string' ? body.card_id.trim() : ''
  if (!cardId) return NextResponse.json({ ok: false, reason: 'no card' }, { status: 400 })

  const device = await ensureDevice()
  const user = await currentUser()
  const id = await createShowing(cardId, { userId: user?.id ?? null, deviceId: device })
  if (!id) {
    return NextResponse.json(
      { ok: false, reason: 'Showing is not switched on in this environment yet.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ ok: true, id, path: '/s/' + id })
}

/** The ones this person is part of. A list, never a total. */
export async function GET() {
  const user = await currentUser()
  const party: Party = { userId: user?.id ?? null, deviceId: await deviceId() }
  return NextResponse.json({ ok: true, showings: await showingsFor(party) })
}
