/**
 * A LEVEL, LOOKED BACK ON (Sam, 2026-11-05).
 *
 * "When a user completes a level I want them to see a summary recap and have the ability to
 * retest themselves without explicitly going into Yours (although that is where the content
 * is resident) while also getting them used to the idea that Yours is where everything is
 * stored."
 *
 * So this file answers three questions about one level, without a screen:
 *
 *   levelRecap      what the level gave you: every line of its rooms (with the gold mark
 *                   when said cold), the words they banked, the practice shape, and the
 *                   postcards, places and what's-on its board turned over.
 *   levelRevision   ALL of it, asked back (Sam: "all content") — each room's release and
 *                   lines, then the words, then the shape's three sentences.
 *   completedBy     whether laying this room is what finished its level — the moment the
 *                   recap opens by itself.
 *
 * Nothing is stored here. The recap reads `finished_cards`, `proof`, `inventory` and
 * `board_met`, which already exist for other reasons; the only new record is which recaps
 * have been shown (`recaps_seen`), so one opens by itself once and is a link after that.
 */
import { pathUnits, type ResolvedUnit } from '@/content/path'
import type { Purpose, Situation } from '@/content/situations'
import { voiced } from '@/content/speaker'
import { PIECES, roomPieceIds } from '@/content/roots'
import { CHEATS } from '@/content/cheats'
import { IDIOMS } from '@/content/idioms'
import { CALENDAR } from '@/content/calendar'
import { gemById } from '@/content/gems'
import { whatYouCanSay, type SayRoom } from '@/content/yours'
import type { RevisionLine } from '@/content/revision'

/** A level's own key in the record: the same level on two paths is two levels. */
export function levelKey(purpose: Purpose | null | undefined, unitId: string): string {
  return (purpose ?? 'visiting') + ':' + unitId
}

/** The unit a room sits in on this learner's path, and its 1-based level number. */
export function unitOfRoom(
  roomId: string,
  purpose: Purpose | null,
  now: Date = new Date(),
): { unit: ResolvedUnit; level: number } | null {
  const units = pathUnits(undefined, now, purpose)
  const i = units.findIndex((u) => u.rooms.some((r) => r.id === roomId))
  return i === -1 ? null : { unit: units[i], level: i + 1 }
}

/** A unit and its level number, by id. */
export function unitById(
  unitId: string,
  purpose: Purpose | null,
  now: Date = new Date(),
): { unit: ResolvedUnit; level: number } | null {
  const units = pathUnits(undefined, now, purpose)
  const i = units.findIndex((u) => u.id === unitId)
  return i === -1 ? null : { unit: units[i], level: i + 1 }
}

/**
 * Every open room of the unit laid — the same rule as pathLevel and the Board's Partida.
 * A unit of nothing but paid rooms is not "complete": there is nothing of yours to recap.
 */
export function levelComplete(unit: ResolvedUnit, finished: string[], lock: (id: string) => 'open' | 'paid'): boolean {
  const open = unit.rooms.filter((r) => lock(r.id) === 'open')
  if (!open.length) return false
  const done = new Set(finished)
  return open.every((r) => done.has(r.id))
}

/**
 * Whether laying `roomId` is what finished its level: complete with it, and not without it.
 * Read after the room is banked, so `finished` already holds it.
 */
export function completedBy(
  roomId: string,
  me: { finished_cards?: string[]; purpose?: Purpose | null },
  lock: (id: string) => 'open' | 'paid',
  now: Date = new Date(),
): { unit: ResolvedUnit; level: number } | null {
  const at = unitOfRoom(roomId, me.purpose ?? null, now)
  if (!at) return null
  const finished = me.finished_cards ?? []
  const withIt = finished.includes(roomId) ? finished : [...finished, roomId]
  const without = withIt.filter((id) => id !== roomId)
  return levelComplete(at.unit, withIt, lock) && !levelComplete(at.unit, without, lock) ? at : null
}

export interface MetStop {
  kind: 'postcard' | 'venue' | 'neighbour'
  id: string
  title: string
  /** What it is, in a word: A postcard, A place, What's on. */
  what: string
  href: string
}

/** A board's lap key back into something to show: "<purpose>:<unit>:<kind>:<id>". */
export function metStop(key: string): MetStop | null {
  const [, , kind, ...rest] = key.split(':')
  const id = rest.join(':')
  if (kind === 'venue') {
    const g = gemById(id)
    return g ? { kind, id, title: g.name, what: 'A place', href: '/city?gem=' + g.id } : null
  }
  if (kind === 'neighbour') {
    const r = CALENDAR.find((x) => x.id === id)
    return r ? { kind, id, title: r.name, what: 'What’s on', href: '/calendar' } : null
  }
  if (kind === 'postcard') {
    const c = CHEATS.find((x) => x.id === id)
    if (c) return { kind, id, title: c.shape, what: 'A postcard', href: '/revise?kind=cheat&id=' + encodeURIComponent(id) }
    const i = IDIOMS.find((x) => x.id === id)
    if (i) return { kind, id, title: i.english, what: 'A postcard', href: '/revise?kind=idiom&id=' + encodeURIComponent(id) }
  }
  return null
}

/** The stops this level's board turned over, in the order they were met. */
export function metOn(level: string, board_met: string[] | undefined): MetStop[] {
  const prefix = level + ':'
  return (board_met ?? [])
    .filter((k) => k.startsWith(prefix))
    .map(metStop)
    .filter((x): x is MetStop => Boolean(x))
}

export interface LevelRecap {
  key: string
  unitId: string
  level: number
  title: string
  pt: string
  rooms: SayRoom[]
  lines: number
  cold: number
  words: { id: string; pt: string; en: string }[]
  shape: { id: string; shape: string; says: { pt: string; en: string }[] } | null
  met: MetStop[]
}

export function levelRecap(
  unitId: string,
  me: {
    finished_cards?: string[]
    proof?: { pt: string; clean?: boolean }[]
    purpose?: Purpose | null
    profile?: { gender?: 'm' | 'f' | null } | null
    inventory?: Record<string, unknown>
    board_met?: string[]
  },
  now: Date = new Date(),
): LevelRecap | null {
  const purpose = me.purpose ?? null
  const at = unitById(unitId, purpose, now)
  if (!at) return null
  const { unit, level } = at
  const can = whatYouCanSay(
    { finished_cards: me.finished_cards, proof: me.proof, purpose, profile: me.profile },
    now,
  )
  const rooms = can.levels.find((l) => l.id === unitId)?.rooms ?? []
  const all = rooms.flatMap((r) => r.lines)
  const owned = new Set(Object.keys(me.inventory ?? {}))
  const words = wordsOf(unit.rooms.filter((r) => rooms.some((x) => x.id === r.id)))
    .filter((w) => owned.has(w.id))
  const cheat = CHEATS.find((c) => c.id === unit.milestone.cheat)
  const key = levelKey(purpose, unitId)
  return {
    key,
    unitId,
    level,
    title: unit.title,
    pt: unit.pt,
    rooms,
    lines: all.length,
    cold: all.filter((l) => l.cold).length,
    words,
    shape: cheat ? { id: cheat.id, shape: cheat.shape, says: cheat.says.map((l) => ({ pt: l.pt, en: l.en })) } : null,
    met: metOn(key, me.board_met),
  }
}

/** The words the rooms hand over, once each, in room order. */
function wordsOf(rooms: Situation[]): { id: string; pt: string; en: string }[] {
  const seen = new Set<string>()
  const out: { id: string; pt: string; en: string }[] = []
  for (const r of rooms)
    for (const id of roomPieceIds(r)) {
      const p = PIECES[id]
      if (!p?.target || !p.gloss || seen.has(id)) continue
      seen.add(id)
      out.push({ id, pt: p.target, en: p.gloss })
    }
  return out
}

/**
 * THE WHOLE LEVEL, ASKED BACK — "all content" (Sam, 2026-11-05).
 *
 * Per finished room: its release (the sentence the room said you must have), then its
 * other lines. Then the level's words, then the practice shape's three sentences with
 * its rule. Each Portuguese answer is asked once, however many places it appears.
 * Only finished rooms: a test on a room nobody has played is a test on nothing taught.
 */
export function levelRevision(
  unitId: string,
  me: { finished_cards?: string[]; purpose?: Purpose | null; gender?: 'm' | 'f' | null },
  now: Date = new Date(),
): RevisionLine[] {
  const at = unitById(unitId, me.purpose ?? null, now)
  if (!at) return []
  const done = new Set(me.finished_cards ?? [])
  const g = me.gender ?? null
  /* Not Who you are: it speaks as a sample person ("Chamo-me Ana"), and your own answers are your Legend. */
  const rooms = at.unit.rooms.filter((r) => done.has(r.id) && r.id !== 'lisbon_legend').map((r) => voiced(r, g))
  if (!rooms.length) return []
  const asked = new Set<string>()
  const out: RevisionLine[] = []
  const push = (l: RevisionLine) => {
    const k = l.answer.trim().toLowerCase()
    if (!l.answer || !l.ask || asked.has(k)) return
    asked.add(k)
    out.push(l)
  }
  for (const room of rooms) {
    push({ ask: room.release.ask, answer: room.release.answer, context: room.why || room.title, lead: 'How do you say:', pieces: roomPieceIds(room) })
    for (const l of room.lines ?? []) push({ ask: l.en, answer: l.pt, context: room.title, lead: 'How do you say:' })
  }
  for (const w of wordsOf(rooms)) push({ ask: w.en, answer: w.pt, lead: 'And the word for:', pieces: [w.id] })
  const cheat = CHEATS.find((c) => c.id === at.unit.milestone.cheat)
  if (cheat) {
    const rule = cheat.note ? cheat.does + ' ' + cheat.note : cheat.does
    for (const l of cheat.says) push({ ask: l.en, answer: l.pt, context: rule })
  }
  return out
}
