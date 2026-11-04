import { NextResponse } from 'next/server'
import { dayKey, notificationFor, pickLine } from '@/content/daily-line'
import { db } from '@/lib/db'
import { pushConfigured, sendPush } from '@/lib/push'
import { dueToday, local, pathLine, tableSoon, weeklyGem, type Push } from '@/lib/push-plan'
import { billingConfigured, entitlementsForUser } from '@/lib/billing'
import { entitlementsForDevice } from '@/lib/comp'

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
/** Monday's place goes out mid-morning, after the line rather than on top of it. */
const WEEK_HOUR = 10
/** How long before a table sits its reminder goes, in hours. */
const TABLE_LEAD = 3
const on = (k: string) => process.env[k] === 'on'

interface Row {
  endpoint: string
  device_id: string | null
  user_id: string | null
  cadence: string | null
  topics: string[] | null
  p256dh: string
  auth: string
  time_zone: string
  last_line_at: Date | null
  sent: string[]
  state: {
    inventory?: Record<string, unknown>
    /** Salting on this rather than the endpoint keeps one person to one line a day. */
    learner_id?: string
    /** What the app has already shown them, so a notification never repeats it. */
    lines_seen?: string[]
    purpose?: 'visiting' | 'staying' | 'moving' | null
    profile?: { gender?: 'm' | 'f' | null } | null
  } | null
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
    select s.endpoint, s.device_id, s.user_id, s.cadence, s.topics, s.p256dh, s.auth, s.time_zone, s.last_line_at, s.sent,
           l.state
      from push_subscriptions s
      left join learners l on l.device_id = s.device_id
     where s.expired_at is null
     limit 5000
  `) as unknown as Row[]

  let sent = 0
  let skipped = 0
  let expired = 0

  /*
    Full access decides which rooms are "next": before billing exists everything is open,
    and after it a free learner's line comes from the rooms they can actually open — a
    sentence from a room behind the paywall is an advert, not a lesson.
  */
  const memberOf = async (row: Row): Promise<boolean> => {
    if (!billingConfigured()) return true
    const [u, d] = await Promise.all([entitlementsForUser(row.user_id), entitlementsForDevice(row.device_id)])
    return u.plan === 'pro' || d?.plan === 'pro'
  }

  /** Send one, record it, and mark the subscription dead if the phone has gone. */
  const deliver = async (row: { endpoint: string; p256dh: string; auth: string }, push: Push, morning = false) => {
    const result = await sendPush(row, { title: push.title, body: push.body, url: push.url, tag: push.tag })
    if (result === 'expired') {
      await sql`update push_subscriptions set expired_at = now() where endpoint = ${row.endpoint}`
      expired++
    } else if (result === 'sent') {
      await (morning
        ? sql`update push_subscriptions set last_line_at = now(), sent = array_append(sent, ${push.id}) where endpoint = ${row.endpoint}`
        : sql`update push_subscriptions set sent = array_append(sent, ${push.id}) where endpoint = ${row.endpoint}`)
      sent++
    } else skipped++
    return result
  }

  let week = 0
  for (const row of rows) {
    const { hour, day, weekday } = local(row.time_zone)
    const topics = row.topics ?? ['week', 'table']

    /*
      MONDAY'S PLACE, if it is switched on for everybody and this phone has not said no.
      Checked before the line so the two never fight over the same hour — they are two
      hours apart anyway.
    */
    if (on('PUSH_WEEKLY') && topics.includes('week') && weekday === 1 && hour === WEEK_HOUR) {
      const push = weeklyGem(new Date(), row.state?.profile?.gender ?? null)
      if (push && !(row.sent ?? []).includes(push.id)) {
        if ((await deliver(row, push)) === 'sent') week++
      }
      continue
    }

    if (!force && hour !== SEND_HOUR) {
      skipped++
      continue
    }
    // How often is theirs: every day, three a week, or never.
    if (!force && !dueToday(row.cadence, weekday)) {
      skipped++
      continue
    }
    // Already had one today — compared in their day, not ours.
    if (!force && row.last_line_at && local(row.time_zone, row.last_line_at).day === day) {
      skipped++
      continue
    }

    /*
      FROM THE PATH FIRST (2026-11-04): the next sentence they will need, and a tap opens
      its room. See lib/push-plan.ts.
    */
    const fromPath = pathLine(
      row.state as Parameters<typeof pathLine>[0],
      row.sent ?? [],
      await memberOf(row),
    )
    if (fromPath) {
      await deliver(row, fromPath, true)
      continue
    }

    /*
      THE OLD LINE, for somebody with no path yet or a path with nothing left to send.

      The same three inputs the /line page uses, or the lock screen and the page show
      different sentences — which they did. salt: the learner's own id, so one person on
      two phones gets one line. day: the language's day, not the subscriber's. seen: what
      this phone has been sent and what the app has already shown them.
    */
    const owned = Object.keys(row.state?.inventory ?? {})
    const salt = row.state?.learner_id ?? row.device_id ?? row.endpoint
    const seen = [...new Set([...(row.sent ?? []), ...(row.state?.lines_seen ?? [])])]
    const line = pickLine({ owned, seen, day: dayKey(), salt })
    if (!line) {
      skipped++
      continue
    }
    await deliver(row, { id: line.id, ...notificationFor(line), url: '/line?n=line', tag: 'dub-line' }, true)
  }

  /*
    TABLES, a few hours before they sit: the host and every guest who has said yes to
    table news. The window is one hour wide because this runs every hour, and the sent
    list makes a second firing harmless anyway.
  */
  let tables = 0
  if (on('PUSH_TABLES')) {
    const due = (await sql`
      select t.code, t.place, t.sits_at, t.host_device,
             array_remove(array_agg(g.device), null) as guests
        from hosted_tables t
        left join hosted_guests g on g.code = t.code
       where t.state = 'on'
         and t.sits_at >  now() + make_interval(hours => ${TABLE_LEAD - 1})
         and t.sits_at <= now() + make_interval(hours => ${TABLE_LEAD})
       group by t.code
    `.catch(() => [])) as unknown as { code: string; place: string; sits_at: Date; host_device: string; guests: string[] }[]
    for (const t of due) {
      const devices = [t.host_device, ...(t.guests ?? [])]
      const subs = (await sql`
        select endpoint, device_id, p256dh, auth, time_zone, sent
          from push_subscriptions
         where expired_at is null and device_id = any(${devices}) and 'table' = any(topics)
      `) as unknown as { endpoint: string; device_id: string; p256dh: string; auth: string; time_zone: string; sent: string[] }[]
      for (const s of subs) {
        const push = tableSoon(
          { code: t.code, place: t.place, sits_at: new Date(t.sits_at).toISOString(), hosting: s.device_id === t.host_device },
          s.time_zone,
        )
        if ((s.sent ?? []).includes(push.id)) continue
        if ((await deliver(s, push)) === 'sent') tables++
      }
    }
  }

  return NextResponse.json({ ok: true, considered: rows.length, sent, skipped, expired, week, tables })
}
