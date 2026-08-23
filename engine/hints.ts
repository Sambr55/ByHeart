/**
 * Hint ladder — spec §11.
 *
 *   attempt 1        no hint
 *   after error 1    semantic cue: what the wrong answer meant, or which block applies
 *   after error 2    scaffolded hint: highlight the relevant inventory chip
 *   after error 3    reveal, play audio, mark "with help", continue — never trap the user
 *
 * Level 1 is diagnostic feedback rather than assistance, so it does not count towards
 * `hints`; an item solved after level-1 feedback alone is "self-corrected". Only the
 * level-2 scaffold counts as a hint in the reported metrics.
 */

import type { BlockId, TilesScreen } from '@/content/types'

export type HintLevel = 0 | 1 | 2 | 3

export interface Verdict {
  correct: boolean
  /** Diagnostic copy for this specific wrong answer. */
  message?: string
}

export const MAX_ATTEMPTS = 3

export function nextHintLevel(errors: number): HintLevel {
  if (errors <= 0) return 0
  if (errors === 1) return 1
  if (errors === 2) return 2
  return 3
}

export function countsAsHint(level: HintLevel): boolean {
  return level >= 2
}

export function outcomeFor(
  attempts: number,
  hintLevel: HintLevel,
): 'first-try' | 'self-corrected' | 'with-hint' | 'revealed' {
  if (hintLevel >= 3) return 'revealed'
  if (attempts === 1) return 'first-try'
  if (hintLevel >= 2) return 'with-hint'
  return 'self-corrected'
}

/** Ordered tile construction. Distractor tiles left unused are not errors. */
export function evaluateTiles(screen: TilesScreen, selected: string[]): Verdict {
  const answer = screen.answer
  const correct =
    selected.length === answer.length && selected.every((id, i) => id === answer[i])
  if (correct) return { correct: true }

  for (const rule of screen.rules ?? []) {
    switch (rule.when) {
      case 'uses':
        if (selected.includes(rule.tile)) return { correct: false, message: rule.message }
        break
      case 'omits':
        if (answer.includes(rule.tile) && !selected.includes(rule.tile))
          return { correct: false, message: rule.message }
        break
      case 'not-first':
        if (selected[0] !== rule.tile) return { correct: false, message: rule.message }
        break
      case 'order':
        if (sameSet(selected, answer)) return { correct: false, message: rule.message }
        break
    }
  }
  return { correct: false, message: screen.hint1 }
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

/** Level-2 scaffold. Falls back to a generic nudge when the screen names no chip. */
export function scaffoldFor(chipHint: BlockId | undefined, label?: string): string {
  return chipHint && label
    ? 'Look at ' + label + ' in Your Portuguese. That is the piece you need.'
    : 'Check the pieces you have already banked.'
}
