'use client'

import { DEFAULT_PAIR, PAIRS, pairId, type Pair } from '@/content/pairs'

/**
 * The chosen pair, stored on its own.
 *
 * Separate from the learner record on purpose, and this is the load-order argument
 * rather than a tidiness one: you have to know the pair before you can decide WHICH
 * learner record to read. Keeping it inside the learner would be circular.
 */
const PAIR_KEY = 'byheart.pair'

let cached: Pair | null = null

function fromStorage(): Pair | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PAIR_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Pair>
    // Trust the list, not the record: a stored pair naming a locale we no longer ship
    // should fall back rather than send the rest of the app looking for a graph that
    // does not exist.
    const known = PAIRS.find(
      (p) => p.source_culture === parsed.source_culture && p.target_locale === parsed.target_locale,
    )
    if (!known) return null
    return {
      source_culture: known.source_culture,
      target_language: known.target_language,
      target_locale: known.target_locale,
      day_zone: known.day_zone,
    }
  } catch {
    return null
  }
}

/** Null until a learner has actually chosen. The selection step branches on this. */
export function chosenPair(): Pair | null {
  if (cached) return cached
  cached = fromStorage()
  return cached
}

/** What everything downstream should key off: the choice, or the default. */
export function currentPair(): Pair {
  return chosenPair() ?? DEFAULT_PAIR
}

export function setPair(pair: Pair) {
  cached = pair
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PAIR_KEY, JSON.stringify(pair))
  } catch {
    // Private mode or a full quota. The in-memory copy still drives this session.
  }
}

/** For tests and for starting over. */
export function clearPair() {
  cached = null
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PAIR_KEY)
  } catch {
    // Nothing to do — the in-memory copy is already gone.
  }
}

export function currentPairId(): string {
  return pairId(currentPair())
}
