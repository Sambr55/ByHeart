import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { redeem } from '@/lib/venues'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Staff type their PIN on the learner's phone; the voucher is spent. */
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 })
  let b: { id?: unknown; pin?: unknown }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (typeof b.id !== 'string') return NextResponse.json({ error: 'id' }, { status: 400 })
  const r = await redeem(user.id, b.id, b.pin)
  return NextResponse.json({ result: r }, { status: r === 'used' ? 200 : r === 'unavailable' ? 503 : 422 })
}
