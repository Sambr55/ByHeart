import { DROPS, type Drop, type DropSource } from '@/content/drops'
import { bankImage } from '@/content/images'
import {
  DROP_TEMPLATES,
  dayEnglish,
  dayWord,
  fill,
  templateFor,
  type DropTemplate,
  type Slot,
} from '@/content/drop-templates'
import type { ChapterId } from '@/content/chapters'
import type { Situation } from '@/content/situations'

/**
 * Turning a real event into a drop.
 *
 * The middle of the pipeline: harvest finds candidates, this drafts them, a person reads
 * the draft, and only then does it go in the Club.
 *
 * Nothing here writes Portuguese. It takes an authored template and fills the holes with
 * facts a source vouched for — which is what makes the whole thing safe to run unattended,
 * and why the review that matters is of the TEMPLATE rather than of every drop.
 *
 * Deliberately pure and offline. Given the same candidate it produces the same drop, which
 * means it can be diffed, tested and reproduced — and the one hand-authored drop is the
 * test set: a template that cannot reproduce what somebody wrote by hand has lost something
 * in the abstraction.
 */

/** What a harvester produces. Facts only — no language, and everything attributed. */
export interface Candidate {
  /** Stable across runs, so re-harvesting does not duplicate. */
  id: string
  kind: DropTemplate['kind']
  chapter: ChapterId
  /** What is on. */
  event: string
  venue: { name: string; area: string }
  /** The nearest station somebody would actually use. */
  station: string
  /** ISO date. */
  on: string
  link?: { href: string; label: string }
  sources: DropSource[]
}

export type DraftResult =
  /**
   * `wants` is the pictures this drop would like and the bank does not have yet.
   *
   * Not an error. A missing photograph is a gap in the image brief, and a card without one
   * falls back to a designed ground rather than a blank — so refusing to draft the drop
   * would mean no drop at all on the night, which is a far worse outcome than a card that
   * is a shade less pretty. Reported so the brief stays honest.
   */
  | { ok: true; drop: Drop; wants: string[] }
  | { ok: false; why: string }

/**
 * A draft, or a reason there is not one.
 *
 * Returns a reason rather than throwing, because a harvest run will hand this fifty
 * candidates and forty of them will be missing something. A pipeline that dies on the first
 * incomplete row is a pipeline nobody runs twice.
 */
export function draftDrop(c: Candidate, now: Date = new Date()): DraftResult {
  const template = templateFor(c.kind)
  if (!template) return { ok: false, why: 'no template for a ' + c.kind }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.on)) return { ok: false, why: 'no usable date' }
  if (new Date(c.on + 'T00:00:00Z') < now) return { ok: false, why: 'already happened' }
  if (!c.venue?.name?.trim()) return { ok: false, why: 'no venue' }
  if (!c.station?.trim()) return { ok: false, why: 'no station, so nobody can be told how to get there' }
  if (!c.sources.length) return { ok: false, why: 'nothing vouches for any of it' }

  let values: Partial<Record<Slot, string>>
  try {
    values = {
      event: c.event,
      venue: c.venue.name,
      station: c.station,
      day: dayWord(c.on),
      day_en: dayEnglish(c.on),
    }
  } catch (e) {
    return { ok: false, why: e instanceof Error ? e.message : 'could not say the date' }
  }

  const missing = template.needs.filter((slot) => !values[slot])
  if (missing.length) return { ok: false, why: 'missing ' + missing.join(', ') }

  /*
    Reviewed until after the event, not until before it.

    A drop whose review date falls in the week before is one that hides itself on the night
    somebody needs it. A month afterwards is arbitrary and it is safely on the right side.
  */
  const reviewBy = new Date(c.on + 'T00:00:00Z')
  reviewBy.setUTCDate(reviewBy.getUTCDate() + 30)

  const wants: string[] = []
  let situations: Situation[]
  try {
    situations = template.rooms.map((room): Situation => {
      const image = bankImage(room.image)
      if (!image) wants.push(room.image)
      return {
        id: c.id + '_' + room.id,
        chapter: c.chapter,
        kind: room.kind,
        title: fill(room.title, values),
        why: fill(room.why, values),
        lines: room.lines.map((l) => ({
          pt: fill(l.pt, values),
          en: fill(l.en, values),
          when: fill(l.when, values),
        })),
        release: {
          ask: fill(room.release.ask, values),
          answer: fill(room.release.answer, values),
        },
        ...(image
          ? { image: { src: image.src, alt: image.alt, rights_status: image.rights_status } }
          : {}),
        rung: room.rung,
        // Only the ones with an address or a procedure need one, and the lint knows which.
        ...(room.kind === 'place' || room.kind === 'errand'
          ? { review_by: reviewBy.toISOString().slice(0, 10) }
          : {}),
      }
    })
  } catch (e) {
    return { ok: false, why: e instanceof Error ? e.message : 'could not build the rooms' }
  }

  return {
    ok: true,
    wants: [...new Set(wants)],
    drop: {
      id: c.id,
      chapter: c.chapter,
      event: c.event,
      place: c.venue,
      on: c.on,
      link: c.link,
      situations,
      sources: c.sources,
      review_by: reviewBy.toISOString().slice(0, 10),
    },
  }
}

/** Already in the Club, so a re-harvest does not offer it again. */
export function alreadyPublished(id: string): boolean {
  return DROPS.some((d) => d.id === id)
}

export { DROP_TEMPLATES }
