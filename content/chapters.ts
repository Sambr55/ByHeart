/**
 * City chapters.
 *
 * A chapter is a CITY, not a language. Lisbon and Faro both speak pt-PT, so the pair
 * cannot be the chapter — and a city is the right size for what a Club is actually for:
 * the people, places and references that make you belong somewhere. Those are
 * Lisbon-specific. Portugal is an abstraction; Lisbon is a street.
 *
 * Three layers decide what a second chapter costs:
 *
 *   language — pt-PT, the ladder, the vibes.        Shared by every chapter here.
 *   country  — the NIF, the Junta, national figures. Shared by every chapter here.
 *   city     — places, local people, local moments.  One chapter only.
 *
 * That split is the whole reason Faro is cheap. If a chapter needed the language layer
 * rebuilt, chapters would not scale and there would only ever be one.
 */
import { DEFAULT_PAIR, pairId } from '@/content/pairs'

export type ChapterId = 'lisbon' | 'faro'

export interface Chapter {
  id: ChapterId
  /** What it is called, everywhere. */
  name: string
  city: string
  country: string
  /** The language its members are learning. Many chapters, one pair. */
  pair: string
  /** IANA zone, for anything time-pegged. */
  zone: string
  /**
   * Open chapters have members. A chapter that is not open is named honestly as not
   * open — never as "coming soon" with a form attached, which is the thing the language
   * picker already refuses to do.
   */
  open: boolean
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'lisbon',
    name: 'Dub Club — Lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    open: true,
  },
  {
    id: 'faro',
    name: 'Dub Club — Faro',
    city: 'Faro',
    country: 'Portugal',
    pair: pairId(DEFAULT_PAIR),
    zone: 'Europe/Lisbon',
    // Second on purpose, and second is the point: it is proof the layering works before
    // it is a growth move. A club with nobody in it is worse than one that is full.
    open: false,
  },
]

export const DEFAULT_CHAPTER: ChapterId = 'lisbon'

export function chapterById(id: ChapterId | null | undefined): Chapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0]
}

/** The chapters a learner on this pair could belong to. */
export function chaptersFor(pair: string): Chapter[] {
  return CHAPTERS.filter((c) => c.pair === pair)
}

export function openChapters(): Chapter[] {
  return CHAPTERS.filter((c) => c.open)
}
