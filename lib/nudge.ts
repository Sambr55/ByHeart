/**
 * NUDGES — chivvying somebody back who has gone quiet (Sam, 2026-11-09: "where have we got
 * to on in-app/phone and email notifications to chivvy people along?" — 3 days for the
 * phone, 7 for email).
 *
 * Pure: no database, no sending. The hourly push job and the daily email job both ask
 * these, and scripts/nudge-check.mts runs them on plain values.
 *
 * THE RULES
 *
 *   Phone   after PUSH_DAYS away; again a week later while they stay away; never after
 *           STOP_PUSH_DAYS. It REPLACES that morning's Line rather than adding a second
 *           push, so somebody away is never sent more than they asked for — and it is a
 *           line from their own next room, which is what they said yes to. Somebody who
 *           turned the Line off ('off') gets no nudge either.
 *   Email   after EMAIL_DAYS away, only to people who ticked "email me if I go quiet"
 *           (a separate yes: the drops opt-in says "nothing else"), at most one a week,
 *           never after STOP_EMAIL_DAYS. Every one carries an unsubscribe link.
 *
 *   Coming back resets both: a nudge is due again only after they go quiet again.
 *
 * WHEN COUNTING STARTS. Until 2026-11-09 the app hardly ever told the server it had been
 * opened (see startAutoSync), so every record looked months stale. Absence is counted from
 * TRACKED_FROM at the earliest, or the first day would nudge everybody who was actually here.
 */
export const PUSH_DAYS = Number(process.env.NUDGE_PUSH_DAYS ?? 3)
export const EMAIL_DAYS = Number(process.env.NUDGE_EMAIL_DAYS ?? 7)
export const STOP_PUSH_DAYS = 30
export const STOP_EMAIL_DAYS = 60
/** Between two nudges to somebody still away. */
export const REPEAT_DAYS = 7
/** When the server started hearing about visits (PR #55). */
export const TRACKED_FROM = new Date('2026-11-10T00:00:00Z')

const DAY = 86_400_000

/** Days away, counted from the later of their last activity and TRACKED_FROM. */
export function daysAway(lastActive: Date | null, now: Date = new Date()): number {
  const from = Math.max(lastActive?.getTime() ?? 0, TRACKED_FROM.getTime())
  return Math.max(0, (now.getTime() - from) / DAY)
}

/** The shared rule: away long enough, not too long, and not nudged since they were last here (or a week ago). */
function due(lastActive: Date | null, nudgedAt: Date | null, now: Date, after: number, stop: number): boolean {
  const away = daysAway(lastActive, now)
  if (away < after || away > stop) return false
  if (!nudgedAt) return true
  if (lastActive && nudgedAt < lastActive) return true
  return now.getTime() - nudgedAt.getTime() >= REPEAT_DAYS * DAY
}

export function pushNudgeDue(o: { lastActive: Date | null; nudgedAt: Date | null; cadence: string | null }, now: Date = new Date()): boolean {
  if (o.cadence === 'off') return false
  return due(o.lastActive, o.nudgedAt, now, PUSH_DAYS, STOP_PUSH_DAYS)
}

export function emailNudgeDue(o: { lastActive: Date | null; emailedAt: Date | null; optedIn: boolean }, now: Date = new Date()): boolean {
  if (!o.optedIn) return false
  return due(o.lastActive, o.emailedAt, now, EMAIL_DAYS, STOP_EMAIL_DAYS)
}

/** The phone nudge: the path's next line, with the body saying it has been a while. */
export function nudgeBody(room: string, away: number): string {
  const d = Math.floor(away)
  return (d >= 7 ? 'A week away. ' : 'It’s been ' + d + ' days. ') + 'Your next room: ' + room + '.'
}
