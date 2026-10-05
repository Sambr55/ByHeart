import 'server-only'
import webpush from 'web-push'
import { db } from '@/lib/db'

/**
 * Web push.
 *
 * VAPID keys identify us to the push services. Without them the whole feature is off
 * rather than broken — same rule as everything else here, so an unconfigured
 * deployment simply never offers to send anything.
 */

let ready: boolean | null = null

export function pushConfigured(): boolean {
  if (ready !== null) return ready
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return (ready = false)
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:hello@dub.study', pub, priv)
  return (ready = true)
}

export type SendResult = 'sent' | 'expired' | 'failed'

export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: unknown,
): Promise<SendResult> {
  if (!pushConfigured()) return 'failed'
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 },
    )
    return 'sent'
  } catch (err) {
    // 404 and 410 mean the subscription is dead — the browser was uninstalled or the
    // permission revoked. Anything else is worth retrying tomorrow.
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'expired'
    console.error('[push] ' + status, (err as Error).message)
    return 'failed'
  }
}

/**
 * TELLING EVERYBODY SOMETHING, WHICH IS THE ONE THING THIS COULD NOT DO.
 *
 * Sam: "We also need a method of pushing these updates to people who have already
 * downloaded the app."
 *
 * The machinery to send a push has been here since 002_push.sql and every piece of it
 * worked — what was missing is the simplest possible caller: one message, to everybody
 * who said yes. The Line sends a sentence a day on a schedule; this is for the handful of
 * times a year there is actually news, and it is deliberately not the same mechanism.
 *
 * A DEAD SUBSCRIPTION IS MARKED RATHER THAN RETRIED FOREVER. The push services answer 404
 * or 410 when somebody has uninstalled or revoked permission, and sendPush already reads
 * that — so a broadcast is also the thing that keeps the table honest, because a list that
 * only ever grows is a list that lies about how many people are reachable.
 *
 * NOBODY IS SENT ANYTHING TWICE. The caller supplies a `tag`, which is recorded against
 * every subscription it reached; sending the same tag again skips those rows. That is what
 * makes a broadcast safe to retry after a failure, which is the condition under which
 * somebody is most likely to press the button twice.
 */
export async function broadcast(opts: {
  title: string
  body: string
  /** Where tapping it goes. A path, so it opens the installed app rather than a browser. */
  url?: string
  /** Stable id for this announcement, so a retry does not send it twice. */
  tag: string
  /** Try it against one subscription first. The only safe way to test a broadcast. */
  dryRun?: boolean
}): Promise<{ sent: number; expired: number; failed: number; skipped: number }> {
  const sql = db()
  const out = { sent: 0, expired: 0, failed: 0, skipped: 0 }
  if (!sql || !pushConfigured()) return out

  const rows = await sql<
    { endpoint: string; p256dh: string; auth: string; sent: string[] }[]
  >`
    select endpoint, p256dh, auth, sent
      from push_subscriptions
     where expired_at is null
     order by created_at asc
     ${opts.dryRun ? sql`limit 1` : sql``}
  `

  for (const row of rows) {
    if (row.sent?.includes(opts.tag)) {
      out.skipped += 1
      continue
    }
    const result = await sendPush(row, {
      title: opts.title,
      body: opts.body,
      url: opts.url ?? '/',
      tag: opts.tag,
    })
    if (result === 'sent') {
      out.sent += 1
      await sql`
        update push_subscriptions
           set sent = array_append(sent, ${opts.tag}), last_line_at = now()
         where endpoint = ${row.endpoint}
      `.catch(() => {})
    } else if (result === 'expired') {
      out.expired += 1
      await sql`
        update push_subscriptions set expired_at = now() where endpoint = ${row.endpoint}
      `.catch(() => {})
    } else {
      out.failed += 1
    }
  }
  return out
}

/** How many phones could be reached right now. The honest number, for the screen. */
export async function reachable(): Promise<number> {
  const sql = db()
  if (!sql) return 0
  try {
    const [row] = await sql<{ n: number }[]>`
      select count(*)::int as n from push_subscriptions where expired_at is null
    `
    return row?.n ?? 0
  } catch {
    return 0
  }
}
