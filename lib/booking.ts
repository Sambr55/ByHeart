/**
 * THE BOOKING PASS-THROUGH — the marketing site's search, carried into the app (2026-11-02).
 *
 * The marketing site's header search asks why you are going (visiting | staying | moving)
 * and when (depart, ret), then sends you here:
 *
 *   /get?purpose=moving&depart=2027-01-15&ret=2027-02-01
 *
 * Asking those again at set-up would be the "asking twice for one answer is a form, not a
 * decision" fault SetUp.tsx's own header warns about. So the answers are written to the
 * learner before set-up runs, and set-up — which skips its WHY step once `profile.goal` is
 * set — never asks.
 *
 * PURE, AND STRICT. This file only parses: everything here comes from a URL anybody can
 * type, so a value that is not exactly one of the expected shapes is dropped rather than
 * guessed at. A bad date costs the dates, not the purpose; a bad purpose costs only itself.
 * Writing it to the learner is engine/booking.ts.
 *
 *   purpose   one of the three, exactly. Mapped to the goal set-up would have written:
 *             visiting → trip, moving → moving, staying → season (see Goal in
 *             content/profile.ts for why staying does not pretend to be "someone" or "work").
 *   depart    YYYY-MM-DD, a real calendar day, not absurdly far either side of today.
 *   ret       the same, and not before depart. Without a depart it is ignored: a trip is a
 *             range that starts somewhere, and here_to alone means nothing to the calendar.
 */
import type { Goal } from '@/content/profile'

export type BookingPurpose = 'visiting' | 'staying' | 'moving'

export interface Booking {
  purpose: BookingPurpose | null
  goal: Goal | null
  from: string | null
  to: string | null
}

const GOAL_OF: Record<BookingPurpose, Goal> = {
  visiting: 'trip',
  staying: 'season',
  moving: 'moving',
}

/** A real day, YYYY-MM-DD — 2027-02-30 is not one — within a year back and five ahead. */
export function validDay(v: string | null | undefined, now = new Date()): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d)
  const back = new Date(t)
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null
  const year = 365 * 24 * 60 * 60 * 1000
  if (t < now.getTime() - year || t > now.getTime() + 5 * year) return null
  return v
}

export function parseBooking(
  params: { get(name: string): string | null },
  now = new Date(),
): Booking {
  const raw = params.get('purpose')
  const purpose: BookingPurpose | null =
    raw === 'visiting' || raw === 'staying' || raw === 'moving' ? raw : null
  const from = validDay(params.get('depart'), now)
  let to = from ? validDay(params.get('ret'), now) : null
  /* ISO days compare as strings. A return before the departure is a typo; keep the start. */
  if (from && to && to < from) to = null
  return { purpose, goal: purpose ? GOAL_OF[purpose] : null, from, to }
}

/** Whether a URL carried anything worth writing. */
export function hasBooking(b: Booking): boolean {
  return Boolean(b.purpose || b.from)
}
