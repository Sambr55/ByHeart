import 'server-only'
import webpush from 'web-push'

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
