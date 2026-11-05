import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { checkIn, type Proof } from '@/lib/venues'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * I'm here. Signed in only (Sam, 2026-11-05: accounts for check-ins and rewards). Either
 * the venue's DUB card code, or where the phone is — never both trusted from one tap.
 */
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 })
  let b: { gem?: unknown; card?: unknown; lat?: unknown; lng?: unknown; accuracy?: unknown }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const proof: Proof | null =
    typeof b.card === 'string' && /^[A-Za-z0-9]{6,12}$/.test(b.card)
      ? { card: b.card }
      : typeof b.lat === 'number' && typeof b.lng === 'number' && typeof b.accuracy === 'number'
        ? { lat: b.lat, lng: b.lng, accuracy: b.accuracy }
        : null
  if (!proof) return NextResponse.json({ error: 'proof' }, { status: 400 })
  const r = await checkIn(user.id, typeof b.gem === 'string' ? b.gem : null, proof)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.error === 'unavailable' ? 503 : 422 })
  return NextResponse.json(r)
}
