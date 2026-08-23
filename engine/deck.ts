'use client'

/**
 * Deck generation — spec §9.
 *
 *   4 anchor cards, always included after Top Gun + Bond
 *   3 weakest blocks, by wrong attempts, hints and response latency
 *   3 newest high-utility Bond blocks not already covered
 *   no weak items → the weak slots become generative combination cards
 *
 * Every card carries the reason it was chosen, because "why is this in my deck?"
 * is the question that separates this from a pile of flashcards.
 */

import type { BlockId } from '@/content/types'
import {
  ANCHOR_CARDS,
  BLOCK_CARDS,
  COMBINATION_CARDS,
  type DeckCardTemplate,
} from '@/content/deck'
import { getLearner, itemFor, ownedBlocks, weakestBlocks } from './learner'

/** The inventory is open-keyed now; only pieces with a card can enter the deck. */
const hasCard = (id: string): id is BlockId => id in BLOCK_CARDS

export type SelectionReason =
  | 'anchor'
  | 'needs another look'
  | 'newly acquired'
  | 'combination'

export interface DeckCard extends DeckCardTemplate {
  selection_reason: SelectionReason
  evidence: {
    learned: string | null
    reinforced: string[]
    state: string
  }
}

const DECK_SIZE = 10
const PROPERTY_LABEL: Record<string, string> = {
  top_gun: 'Top Gun',
  james_bond: 'Bond',
}

function evidenceFor(blocks: BlockId[]) {
  const primary = blocks[0]
  const item = itemFor(primary)
  return {
    learned: item?.acquired_source ? PROPERTY_LABEL[item.acquired_source] : null,
    reinforced: (item?.reinforced_sources ?? []).map((s) => PROPERTY_LABEL[s]),
    state: item?.latest_state ?? 'NEW',
  }
}

function decorate(t: DeckCardTemplate, reason: SelectionReason): DeckCard {
  return { ...t, selection_reason: reason, evidence: evidenceFor(t.block_ids) }
}

export function buildDeck(): DeckCard[] {
  const owned = new Set(ownedBlocks().filter(hasCard))
  const cards: DeckCard[] = []
  const usedBlocks = new Set<BlockId>()

  const take = (t: DeckCardTemplate, reason: SelectionReason) => {
    if (cards.some((c) => c.card_id === t.card_id)) return
    cards.push(decorate(t, reason))
    t.block_ids.forEach((b) => usedBlocks.add(b))
  }

  // 1. Anchors — but only ones whose blocks the learner has actually met, so a
  //    Mission-01-only tester is never handed a card for language they never saw.
  for (const anchor of ANCHOR_CARDS) {
    if (anchor.block_ids.every((b) => owned.has(b))) take(anchor, 'anchor')
  }

  // 2. Weakest three.
  const weak = weakestBlocks(6).filter(
    (b): b is BlockId => hasCard(b) && !usedBlocks.has(b as BlockId),
  )
  for (const b of weak.slice(0, 3)) take(BLOCK_CARDS[b], 'needs another look')

  // 3. Newest blocks not already covered.
  const newest = [...owned]
    .filter((b) => hasCard(b) && !usedBlocks.has(b))
    .sort((a, b) => {
      const ea = getLearner().evidence.findLast((e) => e.target_id === a)
      const eb = getLearner().evidence.findLast((e) => e.target_id === b)
      return Date.parse(eb?.timestamp ?? '0') - Date.parse(ea?.timestamp ?? '0')
    })
  for (const b of newest.slice(0, 3)) take(BLOCK_CARDS[b], 'newly acquired')

  // 4. Nothing weak to work on is a good outcome, not an empty deck: fill with
  //    combinations that show what the inventory can already do.
  for (const combo of COMBINATION_CARDS) {
    if (cards.length >= DECK_SIZE) break
    if (combo.block_ids.every((b) => owned.has(b))) take(combo, 'combination')
  }

  // 5. Top up from anything still owned rather than ship a short deck.
  for (const b of owned) {
    if (cards.length >= DECK_SIZE) break
    if (!usedBlocks.has(b)) take(BLOCK_CARDS[b], 'newly acquired')
  }

  return cards.slice(0, DECK_SIZE)
}

/** Prompts for the 24–72 hour recall: weak first, then a spread across both worlds. */
export function buildRecallSet(limit = 8): BlockId[] {
  const owned = ownedBlocks().filter(hasCard)
  const weak = weakestBlocks(limit, owned).filter(hasCard)
  const rest = owned.filter((b) => !weak.includes(b))
  return [...weak, ...rest].slice(0, limit)
}
