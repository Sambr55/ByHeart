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

/**
 * The other kind of publish: a line the PRODUCT wrote, not one the learner earned.
 *
 * An invite minted from a room carries that room's own sentence — authored content that
 * shipped in the build, identical for everybody, and never touched by the learner record.
 * There is nothing personal in it to filter, so `showableLines` is not merely unnecessary
 * there, it is the wrong function: it takes proof lines, and handing it a room line would
 * be a type lie written to satisfy a check.
 *
 * But "this publisher is safe because you can read it and see" is exactly the reasoning
 * the note above rejects. So the claim is made in code instead: a publisher of authored
 * content says so by calling this, and the gate can then tell the two kinds of publisher
 * apart rather than trusting a reader to.
 *
 * It filters nothing because there is nothing to filter. That is the point of it.
 */
export function authoredLine(line: { pt: string; en: string }): { pt: string; en: string } {
  return { pt: line.pt, en: line.en }
}
