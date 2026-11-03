import { NextResponse } from 'next/server'
import { deviceId, ensureDevice } from '@/lib/auth'
import { getTable, hostSet, join, leave, publicView } from '@/lib/hosted'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ code: string }> }

/** One table, as this phone may see it. Polled every few seconds while the table is live. */
export async function GET(_req: Request, { params }: Ctx) {
  const { code } = await params
  const found = await getTable(code).catch(() => null)
  if (!found) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const device = await deviceId()
  return NextResponse.json(publicView(found.table, found.guests, device), { headers: { 'cache-control': 'no-store' } })
}

/**
 * join {name} · leave · round {round} (host) · off (host).
 * The host's moves are checked against the device that made the table.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { code } = await params
  let b: { action?: unknown; name?: unknown; round?: unknown }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const device = await ensureDevice()
  try {
    if (b.action === 'join') {
      const out = await join(code, device, typeof b.name === 'string' ? b.name : '')
      return NextResponse.json({ out }, { status: out === 'in' ? 200 : 409 })
    }
    if (b.action === 'leave') {
      await leave(code, device)
      return NextResponse.json({ out: 'left' })
    }
    if (b.action === 'round' && typeof b.round === 'number') {
      const ok = await hostSet(code, device, { round: b.round })
      return NextResponse.json({ ok }, { status: ok ? 200 : 403 })
    }
    if (b.action === 'off') {
      const ok = await hostSet(code, device, { state: 'off' })
      return NextResponse.json({ ok }, { status: ok ? 200 : 403 })
    }
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
