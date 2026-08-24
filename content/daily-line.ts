import { DEFAULT_PAIR } from './pairs'
import { PIECES, ROOTS, rootById, type Root } from './roots'

/**
 * The Line — one sentence a day.
 *
 * Two constraints shape all of this:
 *
 *   1. **It has to work on the lock screen.** The notification *is* the lesson, not a
 *      pointer at one. Someone who reads it and never opens the app has still learned
 *      something, and the product has still done its job. So a line is a sentence, a
 *      translation and one short note — nothing that needs a screen.
 *   2. **It has to run on the server.** Push is sent by a cron job from the learner
 *      state we already store, so nothing here may touch the browser. Pure functions,
 *      deterministic output, no imports from engine/.
 *
 * Deterministic on (device, date) so the same day always yields the same line: the
 * notification and the screen behind it must agree, and a person who opens the app
 * twice should not find the lesson has changed underneath them.
 */

export interface DailyLine {
  /** Stable id, so a line is never served twice to the same person. */
  id: string
  pt: string
  en: string
  /** The one thing worth saying about it. Short enough for a notification body. */
  note: string
  root_id: string
  /** owned = built from pieces they have. reach = one step past, on purpose. */
  kind: 'owned' | 'reach' | 'starter'
}

/** FNV-1a. Small, stable across platforms, and not a security boundary. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Today in Lisbon, as a YYYY-MM-DD key. The product's language lives on that clock. */
/**
 * Which day it is where the language is spoken.
 *
 * The zone comes off the pair rather than being hard-coded, because whose morning
 * "today" means is a property of the target locale — a learner of French should get
 * their line on Paris time, not Lisbon's. Defaulted rather than required so the cron,
 * which has no browser and no chosen pair, keeps working unchanged.
 */
export function dayKey(now: Date = new Date(), zone: string = DEFAULT_PAIR.day_zone): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

const strip = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/**
 * The note is the reason the line is worth reading rather than just seeing.
 *
 * The subtlety: everything the content already says — literal_note, voice_rule,
 * subtext — is written about the *root*, and most lines are branches off it. A note
 * about a different sentence is worse than no note, so a candidate is only used if it
 * actually mentions a word from the line in front of the reader. Nothing qualifying,
 * and we fall back to the one thing that is always true: what the piece means.
 */
function noteFor(root: Root, pt: string): string {
  const words = new Set(
    strip(pt)
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3),
  )
  const mentions = (s: string) =>
    strip(s)
      .replace(/[^a-z\s-]/g, ' ')
      .split(/\s+/)
      .some((w) => words.has(w))

  for (const raw of [root.literal_note, root.voice_rule, root.subtext, root.semantic_bridge]) {
    if (!raw) continue
    const first = raw.split(/(?<=\.)\s+/)[0] ?? raw
    if (!mentions(first)) continue
    return first.length > 180 ? first.slice(0, 177).trimEnd() + '…' : first
  }

  // The piece itself, when it is visibly in the line.
  const extract = root.extracts.find((e) => mentions(e.pt))
  if (extract) return '“' + extract.pt + '” is ' + extract.gloss + ' — the piece this is built on.'

  // Nothing in the line matches by spelling, which is usually the most interesting
  // case: ligo-te and ligas-me are the same verb with the ending moved. Give the
  // sentence it came out of rather than a note about a word that is not there.
  return 'From “' + root.pt_natural + '” — ' + root.meaning_en
}

interface Candidate {
  id: string
  pt: string
  en: string
  root: Root
  /** Pieces the line leans on, used to decide owned vs reach. */
  needs: string[]
}

/** Every sentence in the graph a person could plausibly be sent, with its dependencies. */
function candidates(): Candidate[] {
  const out: Candidate[] = []
  for (const root of ROOTS) {
    const needs = root.extracts.map((e) => e.id)
    root.branches.forEach((b, i) => {
      out.push({ id: root.root_id + ':b' + i, pt: b.pt, en: b.en, root, needs })
    })
    out.push({
      id: root.root_id + ':t',
      pt: root.transfer_prompt.answer,
      en: root.transfer_prompt.ask,
      root,
      needs,
    })
  }
  return out
}

const ALL = candidates()

/**
 * Pick today's line.
 *
 * Owned lines are preferred — the whole point is compounding on what they already
 * have — but one day in four is deliberately a reach: a sentence built from a piece
 * they have not met, chosen from a root that shares a family with something they own.
 * A feed that only ever confirms is a feed nobody learns from.
 */
export function pickLine(opts: {
  owned: string[]
  seen?: string[]
  day?: string
  /** Anything stable per person, so two learners do not get identical days. */
  salt?: string
}): DailyLine | null {
  const owned = new Set(opts.owned)
  const seen = new Set(opts.seen ?? [])
  const day = opts.day ?? dayKey()
  const seed = hash(day + '|' + (opts.salt ?? ''))

  const fresh = ALL.filter((c) => !seen.has(c.id))
  if (!fresh.length) return null

  const known = fresh.filter((c) => c.needs.every((n) => owned.has(n)))
  const families = new Set([...owned].map((p) => PIECES[p]?.family).filter(Boolean))
  const reach = fresh.filter(
    (c) => !c.needs.every((n) => owned.has(n)) && families.has(c.root.culture_family),
  )

  // No inventory yet: a freebie root, which is what those exist for.
  if (!owned.size) {
    const starters = fresh.filter((c) => c.root.freebie_flag)
    const pool = starters.length ? starters : fresh
    const c = pool[seed % pool.length]
    return { id: c.id, pt: c.pt, en: c.en, note: noteFor(c.root, c.pt), root_id: c.root.root_id, kind: 'starter' }
  }

  const wantReach = seed % 4 === 0 && reach.length > 0
  const pool = wantReach ? reach : known.length ? known : reach.length ? reach : fresh
  const c = pool[seed % pool.length]
  return {
    id: c.id,
    pt: c.pt,
    en: c.en,
    note: noteFor(c.root, c.pt),
    root_id: c.root.root_id,
    kind: wantReach ? 'reach' : known.length ? 'owned' : 'reach',
  }
}

/** What the notification says. Kept here so the cron and the screen cannot disagree. */
export function notificationFor(line: DailyLine): { title: string; body: string } {
  return {
    title: line.pt,
    body: line.en + ' — ' + line.note,
  }
}

/** The crate a line came out of, for the screen's eyebrow. */
export function rootFor(line: DailyLine): Root | undefined {
  return rootById(line.root_id)
}
