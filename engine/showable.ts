import type { ProofLine } from '@/engine/learner'

/**
 * What may leave the device, in one place.
 *
 * The Legend is the only part of the proof card that contains a person's children by
 * name, their age and their marital status. Every other proof line came from a vibe and
 * is a sentence about coffee.
 *
 * This existed as an inline filter inside the proof card, which was fine while the proof
 * card was the only thing that could publish. Showing is a second publisher, and a rule
 * about what may never travel that is written twice is a rule that will be right in one
 * place and wrong in the other. So it is written once, here, and the gate checks that
 * nothing filters proof lines for publication anywhere else.
 */
export const SHOWABLE_CAP = 3

export function showableLines(proof: ProofLine[]): ProofLine[] {
  return [...proof].reverse().filter((p) => p.source !== 'legend').slice(0, SHOWABLE_CAP)
}
