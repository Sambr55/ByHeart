import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushConfigured } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Register this browser for The Line. Idempotent — the endpoint is the identity. */
export async function POST(request: Request) {
  const sql = db()
  if (!sql || !pushConfigured()) {
    return NextResponse.json({ ok: false, reason: 'push is not switched on' }, { status: 503 })
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string }; time_zone?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    return NextResponse.json({ error: 'incomplete subscription' }, { status: 400 })
  }

  const device = await ensureDevice()
  const user = await currentUser()
  const tz = typeof body.time_zone === 'string' ? body.time_zone.slice(0, 60) : 'Europe/Lisbon'

  await sql`
    insert into push_subscriptions (endpoint, device_id, user_id, p256dh, auth, time_zone)
    values (${endpoint}, ${device}, ${user?.id ?? null}, ${keys.p256dh}, ${keys.auth}, ${tz})
    on conflict (endpoint) do update set
      device_id = excluded.device_id,
      user_id = coalesce(excluded.user_id, push_subscriptions.user_id),
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      time_zone = excluded.time_zone,
      expired_at = null
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ ok: true })
  const endpoint = new URL(request.url).searchParams.get('endpoint')
  if (endpoint) await sql`delete from push_subscriptions where endpoint = ${endpoint}`
  return NextResponse.json({ ok: true })
}
