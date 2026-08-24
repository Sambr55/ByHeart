import { NextResponse } from 'next/server'
import { dayKey, notificationFor, pickLine } from '@/content/daily-line'
import { db } from '@/lib/db'
import { pushConfigured, sendPush } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Send The Line.
 *
 * Runs hourly and sends to the people for whom it is currently the right hour, so a
 * learner in Lisbon and one in Los Angeles both get it at breakfast rather than one of
 * them getting it at midnight. A person is sent at most one line per local day, and
 * never the same sentence twice.
 *
 * Everything is derived from the learner state we already store, so this works for
 * anonymous devices as well as accounts — which matters, because most people will
 * never sign in.
 */

const SEND_HOUR = Number(process.env.LINE_SEND_HOUR ?? 8)

interface Row {
  endpoint: string
  device_id: string | null
  p256dh: string
  auth: string
  time_zone: string
  last_line_at: Date | null
  sent: string[]
  state: { inventory?: Record<string, unknown> } | null
}

/** The local hour and local date for a subscriber, in their own time zone. */
function local(tz: string, when: Date = new Date()): { hour: number; day: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(when)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
    return { hour: Number(get('hour')), day: get('year') + '-' + get('month') + '-' + get('day') }
  } catch {
    return { hour: when.getUTCHours(), day: dayKey(when) }
  }
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const sql = db()
  if (!sql || !pushConfigured()) {
    return NextResponse.json({ ok: false, reason: 'push is not switched on' })
  }

  // `force` is for testing the whole chain without waiting until eight in the morning.
  const force = new URL(request.url).searchParams.get('force') === '1'

  const rows = (await sql`
    select s.endpoint, s.device_id, s.p256dh, s.auth, s.time_zone, s.last_line_at, s.sent,
           l.state
      from push_subscriptions s
      left join learners l on l.device_id = s.device_id
     where s.expired_at is null
     limit 5000
  `) as unknown as Row[]

  let sent = 0
  let skipped = 0
  let expired = 0

  for (const row of rows) {
    const { hour, day } = local(row.time_zone)
    if (!force && hour !== SEND_HOUR) {
      skipped++
      continue
    }
    // Already had one today — compared in their day, not ours.
    if (!force && row.last_line_at && local(row.time_zone, row.last_line_at).day === day) {
      skipped++
      continue
    }

    const owned = Object.keys(row.state?.inventory ?? {})
    const line = pickLine({ owned, seen: row.sent, day, salt: row.device_id ?? row.endpoint })
    if (!line) {
      skipped++
      continue
    }

    const result = await sendPush(row, { ...notificationFor(line), url: '/line' })
    if (result === 'expired') {
      await sql`update push_subscriptions set expired_at = now() where endpoint = ${row.endpoint}`
      expired++
      continue
    }
    if (result === 'failed') {
      skipped++
      continue
    }

    await sql`
      update push_subscriptions
         set last_line_at = now(), sent = array_append(sent, ${line.id})
       where endpoint = ${row.endpoint}
    `
    sent++
  }

  return NextResponse.json({ ok: true, considered: rows.length, sent, skipped, expired })
}
