'use client'

import { PIECES } from '@/content/roots'
import type { LearnerState } from '@/engine/learner'
import { showableLines } from '@/engine/showable'

/**
 * Minting a showing, in one place, because there were about to be three of them.
 *
 * The two-step — /api/share to mint the card, then /api/showing to address it to one
 * person — was written out inside Proof and again inside Showing, and the feed's share
 * button was about to be the third. Three spellings of one act is how the cap ends up
 * different in one of them, or the Legend filter gets forgotten in the newest.
 *
 * WHY TWO STEPS AT ALL. /api/share is the only thing that mints a card, so the three-line
 * cap and the rule that the Legend never leaves the device live in exactly one place
 * rather than in every caller. Addressing it is a separate act with separate consent: a
 * card at /p/ is posted in public, a showing at /s/ is handed to one person and is the
 * only kind that can be shown back.
 */
export interface Minted {
  /** The path to hand over, or null when there was nothing worth sending. */
  path: string | null
  /** Why not, in words a person could read. */
  reason?: string
}

/** How many crates this learner has words from. The card's one honest number. */
function worldsIn(learner: LearnerState): number {
  const set = new Set<string>()
  for (const pieceId of Object.keys(learner.inventory ?? {})) {
    const family = PIECES[pieceId]?.family
    if (family) set.add(family)
  }
  return set.size || 1
}

/**
 * A card of what this learner can actually say, addressed to whoever they hand it to.
 *
 * Returns a reason rather than throwing, because every caller is a button somebody
 * pressed and every one of them needs to say something back.
 */
export async function mintShowing(learner: LearnerState): Promise<Minted> {
  const lines = showableLines(learner.proof ?? [])
  /*
    Nothing said cold yet, and that is not an error.

    The card is a claim about sentences somebody has produced with nothing on screen. A
    learner who has not done that has nothing to show, and minting an empty card would
    fail at the far end after the share sheet had already opened.
  */
  if (!lines.length) {
    return { path: null, reason: 'Say something cold first — there is nothing to show yet.' }
  }

  try {
    const minted = await fetch('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        count: (learner.proof ?? []).length,
        worlds: worldsIn(learner),
        lines: lines.map((l) => ({ pt: l.pt, en: l.en })),
      }),
    })
    const card = (await minted.json()) as { ok: boolean; id?: string; reason?: string }
    if (!card.ok || !card.id) return { path: null, reason: card.reason ?? 'Could not make a card.' }

    const res = await fetch('/api/showing', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ card_id: card.id }),
    })
    const body = (await res.json()) as { ok: boolean; path?: string; reason?: string }
    if (!body.ok || !body.path) return { path: null, reason: body.reason ?? 'Could not make a link.' }
    return { path: body.path }
  } catch {
    return { path: null, reason: 'Could not make a link.' }
  }
}
