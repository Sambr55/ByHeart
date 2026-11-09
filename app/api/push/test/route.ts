import { NextResponse } from 'next/server'
import { dayKey, notificationFor, pickLine } from '@/content/daily-line'
import { db } from '@/lib/db'
import { pushConfigured, sendPush } from '@/lib/push'
import { pathLine } from '@/lib/push-plan'
import { billingConfigured, entitlementsForUser } from '@/lib/billing'
import { entitlementsForDevice } from '@/lib/comp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SEND ME TOMORROW'S LINE NOW (Sam, 2026-11-09: "Can you send an 8am alert to my phone now?").
 *
 * The same push the 8am job would send this phone — the next line on its path, or the day's
 * line when there is no path — sent now, to this phone only. The phone names itself by its
 * push endpoint, an address only that browser holds, and nothing goes anywhere else.
 *
 * NOT RECORDED as sent and does not move last_line_at, so the real one still arrives at 8
 * tomorrow — it may be the same sentence, which is what "a preview" means.
 *
 * One a minute per phone (per server instance), so a tapped-twice button is one push.
 */
const recent = new Map<string, number>()

export async function POST(request: Request) {
  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string }
  if (!endpoint) return NextResponse.json({ ok: false, reason: 'no endpoint' }, { status: 400 })
  const sql = db()
  if (!sql || !pushConfigured()) return NextResponse.json({ ok: false, reason: 'push is not switched on' }, { status: 503 })
  if (Date.now() - (recent.get(endpoint) ?? 0) < 60_000) return NextResponse.json({ ok: false, reason: 'one a minute' }, { status: 429 })

  const [row] = (await sql`
    select s.endpoint, s.device_id, s.user_id, s.p256dh, s.auth, s.sent, l.state
      from push_subscriptions s
      left join learners l on l.device_id = s.device_id
     where s.endpoint = ${endpoint} and s.expired_at is null
  `) as unknown as {
    endpoint: string
    device_id: string | null
    user_id: string | null
    p256dh: string
    auth: string
    sent: string[] | null
    state: (Parameters<typeof pathLine>[0] & { inventory?: Record<string, unknown>; learner_id?: string; lines_seen?: string[] }) | null
  }[]
  if (!row) return NextResponse.json({ ok: false, reason: 'this phone is not subscribed' }, { status: 404 })
  recent.set(endpoint, Date.now())

  /* The 8am rule, exactly: full access decides which rooms are next (app/api/cron/line). */
  let member = true
  if (billingConfigured()) {
    const [u, d] = await Promise.all([entitlementsForUser(row.user_id), entitlementsForDevice(row.device_id)])
    member = u.plan === 'pro' || d?.plan === 'pro'
  }
  const fromPath = pathLine(row.state, row.sent ?? [], member)
  let push = fromPath
  if (!push) {
    const owned = Object.keys(row.state?.inventory ?? {})
    const salt = row.state?.learner_id ?? row.device_id ?? row.endpoint
    const seen = [...new Set([...(row.sent ?? []), ...(row.state?.lines_seen ?? [])])]
    const line = pickLine({ owned, seen, day: dayKey(), salt })
    if (line) push = { id: line.id, ...notificationFor(line), url: '/line?n=line', tag: 'dub-line' }
  }
  if (!push) return NextResponse.json({ ok: false, reason: 'nothing to send yet' }, { status: 404 })

  const result = await sendPush(row, { title: push.title, body: push.body, url: push.url.replace('n=line', 'n=test'), tag: push.tag })
  if (result === 'expired') await sql`update push_subscriptions set expired_at = now() where endpoint = ${row.endpoint}`
  return NextResponse.json({ ok: result === 'sent', result, title: push.title })
}
