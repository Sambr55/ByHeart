/**
 * BOARD ORDER, SET BY HAND (Sam, 2026-11-10, from the board map: "a spider diagram … where I
 * can edit, reorder, change the completion rule … every element on each board").
 *
 * A board is dealt by lap.ts: corners at fixed places, then lesson, stop, lesson, stop. Where
 * a board is listed here, its squares are laid out in exactly this order instead, round the
 * lap from Partida. Each entry is "<kind>:<id>" (kind: corner, room, postcard, vibe, venue,
 * neighbour). A place or what's on that the city has rotated away is filled by whichever one
 * of the same kind the board was dealt today; anything dealt but not named keeps its place
 * after the named ones, before So far.
 *
 * Exported from the map as the board's "order"; scripts/lap-check.mts holds the app to it.
 */
import type { Purpose } from '@/content/situations'

export const BOARD_ORDER: Partial<Record<Purpose, Record<string, string[]>>> = {
  visiting: {
    /* Sam's map, 2026-11-10: the first two lessons back to back, and Bob after Who you are. */
    basics: [
      'corner:start',
      'room:lisbon_ola',
      'room:lisbon_numeros',
      'postcard:cao_hack',
      'venue:micro-padaria-graca',
      'room:lisbon_save',
      'corner:mesa',
      'room:lisbon_legend',
      'vibe:bobs_your_uncle',
      'neighbour:lisbon_misty_fest',
      'vibe:world_of_wizardry',
      'corner:trip',
    ],
  },
}

export function boardOrder(purpose: Purpose, unitId: string): string[] | null {
  return BOARD_ORDER[purpose]?.[unitId] ?? null
}
