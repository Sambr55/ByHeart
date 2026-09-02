/**
 * What is happening in a city this month — the thing Drops are built from.
 *
 * A Drop pegged to a date has a brutal property: it is worthless the morning after, and it
 * costs the same to author as a Situation that lasts forever. The one hand-written Drop in
 * this product took real work and will be live for 22 days, once, and then be dead content
 * in the repository for good. That economics only works if the rows are cheap to produce
 * and the language on top of them is templated — which is what this file and
 * content/drop-templates.ts are between them.
 *
 * A row is a FACT ABOUT THE CITY, not a lesson. It carries no Portuguese at all. The
 * language comes from a template, so a hundred rows cost a hundred lines rather than a
 * hundred sets of sentences, and the sentences stay reviewed even when the facts are new.
 */
import type { ChapterId } from '@/content/chapters'
import { LISBON_2026_10 } from '@/content/calendar/lisbon-2026-10'
import type { Purpose } from '@/content/situations'

/**
 * What kind of thing it is, which is what decides who it is for.
 *
 * Kept deliberately small. A taxonomy with twenty entries is a taxonomy nobody fills in
 * consistently, and the only distinction that has to be right is whether a row produces
 * language about getting somewhere and enjoying it, or language about a form and a queue.
 */
export type CalendarKind =
  /** Music, a match, a festival. Somewhere to get to and be at. */
  | 'event'
  /** A public holiday or a saint's day: things shut, or the city fills up. */
  | 'holiday'
  /** A date the state expects something from you. Tax, renewal, registration. */
  | 'deadline'
  /** A strike, roadworks, a closure. The city not working the way it usually does. */
  | 'disruption'

export interface CalendarRow {
  id: string
  chapter: ChapterId
  kind: CalendarKind
  /** The day it happens, ISO. A range uses `on` for the first day and `until` for the last. */
  on: string
  until?: string
  /**
   * What sort of evening it is, which decides which template can teach it.
   *
   * `kind` says what the row IS to a diary — an event, a holiday, a deadline. This says
   * what it is to a LEARNER, because a gig and a match are both events and need completely
   * different sentences: one is about tickets and a support act, the other about a stand,
   * a queue and a result. Absent means nothing drafts from it, which is right for a holiday
   * — "things are shut" is not an evening you go to.
   */
  shape?: 'concert' | 'match' | 'exhibition'
  /** In English, as a person would say it. Not a headline. */
  name: string
  /** Where, if anywhere. Feeds the template's venue and station slots. */
  where?: { name: string; area?: string; station?: string }
  /**
   * Who this is for.
   *
   * The heart of the whole idea: same calendar, three products. A tourist never sees a
   * property-tax deadline; somebody who has just moved sees it and it is the most useful
   * thing DUB has ever shown them. An empty array would mean nobody, so it is required and
   * the lint says so — a row that has not decided who it is for is a row that will end up
   * in front of everybody.
   */
  purposes: Purpose[]
  /**
   * Where this came from, so a wrong row can be traced rather than argued about.
   *
   * Written by the harvester from what it actually read. Hand-added rows carry the page a
   * person checked. Either way an unsourced row is a claim nobody can check, and this
   * product puts its claims in a learner's mouth in front of a stranger.
   */
  sources: string[]
  /**
   * Whether a human has looked at it.
   *
   * FALSE BY DEFAULT, AND A FALSE ROW MAKES NO DROP. The failure mode being guarded is not
   * a missing gig, it is confidently teaching somebody to ask about a concert that was
   * cancelled, at a venue on the wrong side of the river — said out loud, to a stranger,
   * by somebody who trusted us. A model with web search is very good at finding what is on
   * and perfectly capable of being a month out on a date.
   *
   * The cost of the lock is one keystroke per row per month. See scripts/calendar.mts.
   */
  verified: boolean
  /** Past this the row is ignored even if nobody has tidied it up. Silence beats a lie. */
  review_by?: string
}

/**
 * Every month that has been gathered.
 *
 * Files land in content/calendar/ as `<city>-<year>-<month>.ts` and are imported here by
 * hand. A directory scan would be tidier and would also mean a file could join the product
 * without anybody deciding it should, which is exactly the property this content must not
 * have.
 */
export const CALENDAR: CalendarRow[] = [...LISBON_2026_10]

/** Rows that are live for a date: verified, in window, and not past their review date. */
export function rowsFor(chapter: ChapterId, now: Date = new Date()): CalendarRow[] {
  const today = now.toISOString().slice(0, 10)
  return CALENDAR.filter(
    (r) =>
      r.chapter === chapter &&
      r.verified &&
      (r.until ?? r.on) >= today &&
      (!r.review_by || r.review_by >= today),
  ).sort((a, b) => a.on.localeCompare(b.on))
}
