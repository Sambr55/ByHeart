import { NextResponse } from 'next/server'
import { deviceId, ensureDevice } from '@/lib/auth'
import { createTable, tablesFor } from '@/lib/hosted'
import { HOUSE_RULES, type HouseRule } from '@/content/table-night'
import { gemById } from '@/content/gems'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Your tables — hosting or sitting at — from yesterday on. */
export async function GET() {
  const device = await deviceId()
  if (!device) return NextResponse.json({ tables: [] })
  const rows = await tablesFor(device)
  return NextResponse.json({
    tables: rows.map((t) => ({ code: t.code, host: t.host_name, place: t.place, gem: t.gem, sitsAt: t.sits_at, rule: t.house_rule, hosting: t.hosting, count: t.count + 1 })),
  })
}

/** Put a table together. The answer carries the code, which is the invite. */
export async function POST(req: Request) {
  let b: { host?: unknown; gem?: unknown; place?: unknown; sitsAt?: unknown; rule?: unknown }
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const gem = typeof b.gem === 'string' ? gemById(b.gem) : undefined
  const place = gem ? gem.name : typeof b.place === 'string' ? b.place.trim() : ''
  const when = typeof b.sitsAt === 'string' ? new Date(b.sitsAt) : null
  const rule = HOUSE_RULES.some((r) => r.id === b.rule) ? (b.rule as HouseRule) : 'ten'
  const host = typeof b.host === 'string' ? b.host : ''
  if (!place || !when || Number.isNaN(when.getTime())) return NextResponse.json({ error: 'a place and a time' }, { status: 400 })
  if (when.getTime() < Date.now() - 3600000 || when.getTime() > Date.now() + 120 * 86400000) {
    return NextResponse.json({ error: 'pick a time in the next few months' }, { status: 400 })
  }
  const device = await ensureDevice()
  try {
    const t = await createTable({ device, hostName: host, gem: gem?.id ?? null, place, sitsAt: when, rule })
    if (t === 'unavailable') return NextResponse.json({ error: 'unavailable' }, { status: 503 })
    return NextResponse.json({ code: t.code })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
}
