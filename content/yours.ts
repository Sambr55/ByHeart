/**
 * WHAT YOURS SHOWS, decided without a screen (Sam, 2026-11-04).
 *
 * The review: Yours was still drawn for the old loop — Legend, Vibes, Cheats, Drops — while
 * the eight rooms somebody had actually finished appeared nowhere on it. Sam: "Is the logic
 * now right as to what appears there and how. And if we reverse some of it out how do we
 * ensure we don't lose anything and it gets logically surfaced elsewhere at the right
 * moment?"
 *
 * So Yours is now, in order: you (name, settings, and what is on this phone only); WHAT YOU
 * CAN SAY, which is every line of every room you have finished, by level, with the ones
 * you have said out loud marked; YOUR LISBON, your tables and the places you have said it,
 * only when there are any; and the library, every part of which appears only once it holds
 * something.
 *
 * NOTHING IS DELETED. This file changes what is DRAWN, never what is stored. And so that
 * nothing can quietly vanish, HOMES below names, for every kind of thing a learner can
 * have, where it shows in Yours and where the invitation to start it lives instead —
 * scripts/yours-check.mts seeds one of each and fails if any has no home.
 */
import { pathUnits } from '@/content/path'
import { situationById, type Purpose, type Situation } from '@/content/situations'
import { said } from '@/content/speaker'
import type { DeckId } from '@/content/collection'

export interface SayLine {
  pt: string
  en: string
  /** Said out loud with nothing on screen — it is in the learner's proof. */
  cold: boolean
}
export interface SayRoom {
  id: string
  title: string
  lines: SayLine[]
}
export interface SayLevel {
  id: string
  title: string
  rooms: SayRoom[]
}

/*
  Not here: Who you are speaks as a sample person ("Chamo-me Ana") — the learner's own
  answers are their Legend — and the fun tiles are hacks and bluffs, which have their own
  shelf in the library.
*/
const NOT_SAYABLE = (id: string) => id === 'lisbon_legend' || id.startsWith('fun_')

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Every line from every finished room, grouped by the level it belongs to on this
 * learner's path. Rooms finished on another path (somebody who changed why they are here)
 * are kept, under "Elsewhere in Lisbon" — finished is finished.
 */
export function whatYouCanSay(
  me: {
    finished_cards?: string[]
    proof?: { pt: string }[]
    purpose?: Purpose | null
    profile?: { gender?: 'm' | 'f' | null } | null
  },
  now: Date = new Date(),
): { levels: SayLevel[]; lines: number; rooms: number; cold: number } {
  const done = new Set((me.finished_cards ?? []).filter((id) => !NOT_SAYABLE(id)))
  const coldSet = new Set((me.proof ?? []).map((p) => norm(p.pt)))
  const gender = me.profile?.gender ?? null
  const toRoom = (s: Situation): SayRoom => ({
    id: s.id,
    title: s.title,
    lines: s.lines.map((l) => {
      const x = said(l, gender)
      return { pt: x.pt, en: x.en, cold: coldSet.has(norm(x.pt)) || coldSet.has(norm(l.pt)) }
    }),
  })
  const placed = new Set<string>()
  const levels: SayLevel[] = []
  for (const u of pathUnits(undefined, now, me.purpose ?? null)) {
    const rooms = u.rooms.filter((r) => done.has(r.id)).map((r) => (placed.add(r.id), toRoom(r)))
    if (rooms.length) levels.push({ id: u.id, title: u.title, rooms })
  }
  const elsewhere = [...done]
    .filter((id) => !placed.has(id))
    .map((id) => situationById(id))
    .filter((s): s is Situation => Boolean(s && s.lines?.length))
    .map(toRoom)
  if (elsewhere.length) levels.push({ id: 'elsewhere', title: 'Elsewhere in Lisbon', rooms: elsewhere })
  const all = levels.flatMap((l) => l.rooms.flatMap((r) => r.lines))
  return {
    levels,
    lines: all.length,
    rooms: levels.reduce((n, l) => n + l.rooms.length, 0),
    cold: all.filter((l) => l.cold).length,
  }
}

/** The library's shelves, your own material first: what you asked for, the tricks, then the rest. */
export const LIBRARY_ORDER: DeckId[] = ['asked', 'hacks', 'bluffs', 'cheats', 'idioms', 'legend', 'vibes', 'drops', 'words', 'sheets']

/** Places you have said it: walk stops, and gems marked from their own card (`gem:<id>`). */
export function placeKeysToGems(keys: string[]): string[] {
  return keys.filter((k) => k.startsWith('gem:')).map((k) => k.slice(4))
}

/**
 * EVERY KIND OF THING A LEARNER CAN HAVE, AND WHERE IT LIVES.
 *
 * `yours`: where it is drawn on Yours once there is one. `start`: where the invitation to
 * begin it lives now that Yours no longer carries empty promos — the moment it makes sense,
 * not a heading over nothing. Checked by scripts/yours-check.mts.
 */
export const HOMES = {
  room: { yours: 'What you can say', start: 'Path · Up next' },
  proof: { yours: 'What you can say (gold mark) · On this phone only', start: 'Every room: say it out loud' },
  asked: { yours: 'Library · You asked for', start: 'Translate tab' },
  hack: { yours: 'Library · Hacks', start: 'Path · Hacks, Bluffs & Cheats' },
  bluff: { yours: 'Library · Bluffs', start: 'Path · Hacks, Bluffs & Cheats' },
  cheat: { yours: 'Library · Cheats', start: 'Path · Hacks, Bluffs & Cheats' },
  idiom: { yours: 'Library · Lost in translation', start: 'Path · Just for fun' },
  sheet: { yours: 'Library · Cheat sheets', start: 'Path · Just for fun' },
  words: { yours: 'Library · Words', start: 'Every room banks its words' },
  legend: { yours: 'Library · Your Legend', start: 'Path · Who you are (optional room)' },
  vibe: { yours: 'Library · Vibes', start: 'Path · Just for fun' },
  drop: { yours: 'Library · Drops', start: 'City · What’s on' },
  table: { yours: 'Your Lisbon · Your table', start: 'City · venue card “Host a table here” · Path after level 2' },
  place: { yours: 'Your Lisbon · Where you’ve said it', start: 'City · venue card “Said it here” · walks' },
  friend: { yours: 'Your people', start: 'Path · under the Boa! cheer' },
} as const
export type HomeKind = keyof typeof HOMES
