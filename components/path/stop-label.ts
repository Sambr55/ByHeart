/**
 * WHAT A BOARD SQUARE IS, SAID IN WORDS (Sam, 2026-11-09: "the Portuguese words mean nothing
 * to me and there is no excitement or sell as to what is on the board").
 *
 * Every stop says what it is — a mark, a kind in English, and its name — on the board's
 * square and on the Panel's and Road's chips alike, before it is reached as well as after
 * ("name them on the board", with how many rooms away). Rooms say their own word (tileWord)
 * and never borrow a stop's mark: a lesson drawn as a calendar read as an event.
 *
 * Pure, so the three views and the check script share one wording.
 */
import { CHEATS } from '@/content/cheats'
import { bairroById, KIND_LABEL } from '@/content/gems'
import { IDIOMS } from '@/content/idioms'
import { CRATES } from '@/content/roots'
import type { Lap, Square } from './lap'

export interface StopLabel {
  /** One glyph that tells the four kinds apart at a glance. */
  mark: string
  /** What sort of thing, in English: Just for fun, Hack, Bluff, Idiom, Bakery, Gig… */
  kind: string
  /** Its name. */
  title: string
}

const KIND_OF_CHEAT = { hack: 'Hack', bluff: 'Bluff', cheat: 'Cheat' } as const
const SHAPE_OF_EVENT: Record<string, string> = { concert: 'Gig', match: 'Match', exhibition: 'Exhibition' }

export function stopLabel(s: Square): StopLabel | null {
  if (s.kind === 'vibe') {
    const c = CRATES.find((x) => x.id === s.crate)
    return { mark: '✦', kind: 'Just for fun', title: c?.title ?? s.crate }
  }
  if (s.kind === 'postcard') {
    if (s.card.kind === 'cheat') {
      const c = CHEATS.find((x) => x.id === s.card.id)
      return c ? { mark: '✦', kind: KIND_OF_CHEAT[c.kind], title: c.shape } : null
    }
    const i = IDIOMS.find((x) => x.id === s.card.id)
    return i ? { mark: '✦', kind: 'Idiom', title: i.english } : null
  }
  if (s.kind === 'venue') return { mark: '📍', kind: KIND_LABEL[s.gem.kind], title: bairroById(s.gem.bairro).name }
  if (s.kind === 'neighbour') return { mark: '🎟', kind: SHAPE_OF_EVENT[s.event.shape ?? ''] ?? 'What’s on', title: s.event.name }
  return null
}

/** How many more rooms until this square turns over: 0 once it has. */
export function roomsAway(s: Square, lap: Lap): number {
  if (s.reached) return 0
  const before = lap.squares.filter((x) => x.kind === 'room' && x.at < s.at).length
  return Math.max(1, before - lap.done)
}

export function awayText(n: number): string {
  return n === 1 ? '1 room away' : n + ' rooms away'
}

/**
 * The board's headliners, for "On this board": its surprises, then a place and what's on —
 * each with its mark, shown in capitals like the squares, so the line reads in one voice.
 */
export function headliners(lap: Lap): string[] {
  const stops = lap.squares.filter((s) => s.kind === 'vibe' || s.kind === 'postcard')
  const out = stops
    .map((s) => {
      const l = stopLabel(s)
      return l ? l.mark + ' ' + (s.kind === 'vibe' ? l.title : l.kind + ': ' + l.title) : null
    })
    .filter((t): t is string => Boolean(t))
  const place = lap.squares.find((s) => s.kind === 'venue')
  if (place?.kind === 'venue') out.push('📍 ' + KIND_LABEL[place.gem.kind] + ' in ' + bairroById(place.gem.bairro).name)
  const on = lap.squares.find((s) => s.kind === 'neighbour')
  if (on?.kind === 'neighbour') out.push('🎟 ' + on.event.name)
  return out.slice(0, 4)
}
