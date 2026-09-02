/**
 * Calendar rows becoming Drops — the join that turns a diary into something teachable.
 *
 * The two halves existed and nothing connected them. `CALENDAR` held verified rows that
 * nothing read: `rowsFor` had no callers at all, so a row could be gathered, checked
 * against the venue's own agenda and marked verified, and still reach nobody. Meanwhile
 * `draftDrop` could demonstrably rebuild a hand-written Drop from a candidate — that is
 * what drop-check's "every line comes back the same, 20 lines" proves — but the only
 * candidate it was ever given came from a fixture file.
 *
 * This is the missing middle. A verified row becomes a candidate, a candidate becomes a
 * draft, and a draft joins the feed. It is what "real events turning into real learning"
 * actually means in code.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT REFUSES TO PUBLISH, which is most of the point.
 *
 * A generated Drop puts Portuguese in somebody's mouth in front of a stranger. Four
 * separate things have to be true before one ships, and every one of them is a refusal
 * rather than a warning:
 *
 *   1. The ROW is verified. An unverified row makes no Drop, ever. Already enforced by
 *      rowsFor, restated here because it is the load-bearing one.
 *   2. The row has a SHAPE. A holiday is not an evening you go to; "things are shut" has
 *      no venue, no ticket and no metro stop.
 *   3. A TEMPLATE exists for that shape. Today that is `concert` and nothing else, so the
 *      two football rows draft nothing until somebody writes a match template.
 *   4. The template has been READ BY SOMEBODY WHO SPEAKS PORTUGUESE. This is the one that
 *      stops everything today, deliberately. `review: 'needs-review'` means the sentences
 *      are mine, and mine are not good enough to be said out loud to a stranger.
 *
 * So `generatedDrops` currently returns NOTHING, and that is the correct answer rather
 * than a bug. `generationReport` says exactly what is waiting and on what — because a
 * blocker nobody can see is a blocker nobody clears.
 * ---------------------------------------------------------------------------
 */
import { CALENDAR, rowsFor, type CalendarRow } from '@/content/calendar'
import type { ChapterId } from '@/content/chapters'
import type { Drop } from '@/content/drops'
import { templateFor } from '@/content/drop-templates'
import { type Candidate, draftDrop } from '@/lib/draft'

/**
 * A row, as something that could be drafted from.
 *
 * Null where the row cannot become one — and the reason is returned rather than swallowed,
 * because "nine concerts are ready and two matches have no template" is a work list, while
 * an empty array is a mystery.
 */
export function candidateFor(row: CalendarRow): Candidate | { no: string } {
  if (!row.verified) return { no: 'not verified' }
  if (!row.shape) return { no: 'no shape — a ' + row.kind + ' is not an evening you go to' }
  if (!row.where?.name) return { no: 'no venue' }
  /*
    A missing station is a refusal, not a gap to paper over.

    draftDrop asks for one because the concert template teaches somebody how to GET there,
    and a metro line invented to fill a slot is the single worst thing this pipeline could
    produce. LAV in Alcântara has no metro, so that row correctly drafts nothing until a
    human writes down how people actually get to it.
  */
  if (!row.where.station) return { no: 'no station, so nobody can be told how to get there' }
  return {
    id: row.id,
    kind: row.shape,
    chapter: row.chapter,
    event: row.name,
    venue: { name: row.where.name, area: row.where.area ?? '' },
    station: row.where.station,
    on: row.on,
    sources: row.sources.map((href) => ({
      /*
        The row's own claim, carried across as the fact it vouches for.

        A Drop's sources say what each URL is EVIDENCE FOR, not merely that it was read.
        Flattening them to bare links would lose the half that makes a wrong row traceable
        rather than arguable.
      */
      fact: row.name + ' — ' + row.on,
      where: href,
      checked: '2026-09-02',
    })),
  }
}

/** One line per row: what it would become, or what is stopping it. */
export interface GenerationNote {
  id: string
  on: string
  name: string
  /** 'ready' only when it drafted AND a speaker has read the template it used. */
  status: 'ready' | 'unreviewed' | 'blocked'
  why: string
}

/**
 * What the calendar would produce, and what is in the way.
 *
 * Written to be read by a person deciding what to do next, which is why `unreviewed` is
 * its own status rather than lumped in with `blocked`: those rows are finished work
 * waiting on one reading, and they are the shortest path to the product having live
 * events in it.
 */
export function generationReport(chapter: ChapterId, now: Date = new Date()): GenerationNote[] {
  return CALENDAR.filter((r) => r.chapter === chapter).map((row): GenerationNote => {
    const line = { id: row.id, on: row.on, name: row.name }
    const c = candidateFor(row)
    if ('no' in c) return { ...line, status: 'blocked', why: c.no }
    const template = templateFor(c.kind)
    if (!template) return { ...line, status: 'blocked', why: 'no ' + c.kind + ' template exists yet' }
    const draft = draftDrop(c, now)
    if (!draft.ok) return { ...line, status: 'blocked', why: draft.why }
    if (template.review !== 'reviewed') {
      return { ...line, status: 'unreviewed', why: 'the ' + c.kind + ' template has not been read by a pt-PT speaker' }
    }
    return { ...line, status: 'ready', why: draft.drop.situations.length + ' rooms' }
  })
}

/**
 * Drops the calendar can honestly publish today.
 *
 * Everything above, applied. The gate is `review === 'reviewed'` and nothing else gets to
 * override it — not a flag, not an environment variable, not a preview mode. A drop that
 * says the wrong thing sends somebody to the wrong place on the wrong night, and that is
 * worse than no drop.
 */
export function generatedDrops(chapter: ChapterId, now: Date = new Date()): Drop[] {
  const out: Drop[] = []
  for (const row of rowsFor(chapter, now)) {
    const c = candidateFor(row)
    if ('no' in c) continue
    const template = templateFor(c.kind)
    if (!template || template.review !== 'reviewed') continue
    const draft = draftDrop(c, now)
    if (draft.ok) out.push(draft.drop)
  }
  return out
}
