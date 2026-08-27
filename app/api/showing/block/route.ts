import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { blockCounterparty, getShowing } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-sided, immediate, permanent.
 *
 * It takes effect without the other person being told, without either of them having to
 * agree, and there is no route that undoes it. A block you can be talked out of is not
 * one, and this is a small enough feature that "permanent" costs nothing to honour.
 */
export async function POST(request: Request) {
  let body: { showing_id?: unknown }
  try {
    body = (await request.json()) as { showing_id?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const id = typeof body.showing_id === 'string' ? body.showing_id.trim() : ''
  const row = id ? await getShowing(id) : null
  if (!row) return NextResponse.json({ ok: false, reason: 'gone' }, { status: 404 })

  const device = await ensureDevice()
  const user = await currentUser()
  await blockCounterparty(row, { userId: user?.id ?? null, deviceId: device })
  return NextResponse.json({ ok: true })
}
