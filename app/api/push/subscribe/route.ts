import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushConfigured } from '@/lib/push'
import { isCadence, TOPICS, type Topic } from '@/lib/push-plan'

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

/*
  WHAT THIS PHONE WANTS (2026-11-04): how often the morning line comes, and whether
  Monday's place and table news are on. Keyed on the endpoint, which only this browser
  knows — the same identity the rest of this route uses.
*/
export async function GET(request: Request) {
  const sql = db()
  const endpoint = new URL(request.url).searchParams.get('endpoint')
  if (!sql || !endpoint) return NextResponse.json({ found: false })
  const [row] = await sql<{ cadence: string; topics: string[] }[]>`
    select cadence, topics from push_subscriptions where endpoint = ${endpoint} and expired_at is null
  `
  return NextResponse.json(row ? { found: true, cadence: row.cadence, topics: row.topics } : { found: false })
}

export async function PATCH(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ ok: false }, { status: 503 })
  let body: { endpoint?: unknown; cadence?: unknown; topics?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (typeof body.endpoint !== 'string') return NextResponse.json({ error: 'no endpoint' }, { status: 400 })
  const cadence = isCadence(body.cadence) ? body.cadence : null
  const topics = Array.isArray(body.topics)
    ? body.topics.filter((t): t is Topic => typeof t === 'string' && (TOPICS as string[]).includes(t))
    : null
  const rows = await sql`
    update push_subscriptions
       set cadence = coalesce(${cadence}, cadence),
           topics = coalesce(${topics ? sql.array(topics) : null}::text[], topics)
     where endpoint = ${body.endpoint}
    returning cadence, topics
  `
  if (!rows.length) return NextResponse.json({ ok: false }, { status: 404 })
  return NextResponse.json({ ok: true, cadence: rows[0].cadence, topics: rows[0].topics })
}
