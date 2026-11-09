import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { absoluteUrl } from '@/lib/auth'
import { sendNudgeEmail, sendable } from '@/lib/email'
import { emailNudgeDue } from '@/lib/nudge'
import { pathLine } from '@/lib/push-plan'
import { unsubscribeUrl } from '@/lib/unsubscribe'
import { billingConfigured, entitlementsForUser } from '@/lib/billing'
import { chapterById } from '@/content/chapters'
import { dropsInFortnight } from '@/content/feed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * THE WEEK-AWAY EMAIL, once a day (vercel.json), to people who asked for it (2026-11-09).
 *
 * Who: signed in, ticked "email me if I haven't been back for a week" (users.nudge_email),
 * away EMAIL_DAYS or more and not past STOP_EMAIL_DAYS, and not emailed since they were
 * last here or in the last week — lib/nudge.ts. Away is the latest of every device of
 * theirs syncing and every session of theirs being used.
 *
 * Off unless NUDGE_EMAIL=on. ?dry=1 returns who would be sent to, and sends nothing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== 'Bearer ' + secret) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const dry = new URL(request.url).searchParams.get('dry') === '1'
  /* A dry run lists email addresses, so it never answers without the secret — even where none is set. */
  if (dry && !secret) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  if (!dry && process.env.NUDGE_EMAIL !== 'on') return NextResponse.json({ ok: false, reason: 'NUDGE_EMAIL is not on' })
  const sql = db()
  if (!sql) return NextResponse.json({ ok: false, reason: 'no database' })
  if (!dry && !sendable()) return NextResponse.json({ ok: false, reason: 'email is not configured' })

  const rows = (await sql`
    select u.id, u.email, u.display_name, u.nudge_emailed_at,
           greatest(u.last_seen_at,
                    (select max(s.last_seen_at) from sessions s where s.user_id = u.id),
                    (select max(l.updated_at) from learners l where l.user_id = u.id)) as last_active,
           (select l.state from learners l where l.user_id = u.id order by l.updated_at desc limit 1) as state
      from users u
     where u.deleted_at is null
       and u.nudge_email
     limit 2000
  `) as unknown as {
    id: string
    email: string
    display_name: string | null
    nudge_emailed_at: Date | null
    last_active: Date | null
    state: (Parameters<typeof pathLine>[0] & { chapter?: string | null }) | null
  }[]

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const weekEnd = new Date(today.getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
  let sent = 0
  let skipped = 0
  const would: string[] = []

  for (const u of rows) {
    if (!emailNudgeDue({ lastActive: u.last_active, emailedAt: u.nudge_emailed_at, optedIn: true }, now)) {
      skipped++
      continue
    }
    const member = billingConfigured() ? (await entitlementsForUser(u.id)).plan === 'pro' : true
    const line = pathLine(u.state, [], member, now)
    if (!line?.room) {
      skipped++
      continue
    }
    const chapter = chapterById(u.state?.chapter ?? null)
    const on = dropsInFortnight(chapter.id, today, now)
      .filter((d) => d.on < weekEnd)
      .slice(0, 3)
      .map((d) => ({
        event: d.event,
        when: new Date(d.on + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        url: absoluteUrl('/club?drop=' + d.id),
      }))
    if (dry) {
      would.push(u.email + ' → ' + line.room)
      continue
    }
    const ok = await sendNudgeEmail({
      to: u.email,
      name: u.display_name,
      room: line.room,
      pt: line.title,
      en: line.body.split(' — ')[0],
      roomUrl: absoluteUrl(line.url.replace('n=line', 'n=email')),
      city: chapter.city,
      on,
      unsubscribeUrl: unsubscribeUrl(absoluteUrl(''), u.id),
    })
    if (ok) {
      await sql`update users set nudge_emailed_at = now() where id = ${u.id}`
      sent++
    } else skipped++
  }

  return NextResponse.json({ ok: true, considered: rows.length, sent, skipped, ...(dry ? { would } : {}) })
}
