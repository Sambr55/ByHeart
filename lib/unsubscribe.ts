import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A link that stops nudge emails, and nothing else (2026-11-09).
 *
 * Signed rather than looked up, so it works from any mail client with no sign-in and cannot
 * be guessed for somebody else: the token is an HMAC of their user id. What it can do is
 * deliberately tiny — switch users.nudge_email off — so a forwarded email at worst stops
 * somebody's reminders, which they can switch back on in Account.
 */
function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.FEEDBACK_ADMIN_KEY || ''
}

export function unsubscribeToken(userId: string): string {
  return createHmac('sha256', secret()).update('nudge:' + userId).digest('base64url').slice(0, 32)
}

export function unsubscribeValid(userId: string, token: string): boolean {
  if (!secret() || !userId || !token) return false
  const a = Buffer.from(unsubscribeToken(userId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function unsubscribeUrl(origin: string, userId: string): string {
  return origin + '/api/email/unsubscribe?u=' + encodeURIComponent(userId) + '&t=' + unsubscribeToken(userId)
}
