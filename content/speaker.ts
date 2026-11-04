import { situationById, type Situation, type SituationLine } from '@/content/situations'

/**
 * THE LEARNER'S OWN ENDING (2026-11-03).
 *
 * Sam: "Do number 3 with full force" — number 3 being that every room in Lisbon taught a
 * woman to say obrigado, Sou inglês and sou o novo vizinho. Portuguese agrees words about
 * the SPEAKER with the speaker: a woman says obrigada, inglesa, estrangeira, a nova
 * vizinha. The product already knew this — the Legend frames build feminine forms, the
 * rescue card picks inglês or inglesa (saveSentence) — but a room's line was one pt
 * string, so the rooms, the feed, revision, walks, gems and know-how all taught the
 * masculine to everybody. For a product whose biggest audience may well be women on a
 * season of their own, that is the line they say most often, said wrong, every day.
 *
 * So a line that changes with the speaker carries its feminine as `f` (and a release its
 * `answer_f`), and this file is the one place that turns the house's line into the
 * learner's. `gender` is grammatical — which endings you use — and it is the profile's.
 *
 * UNKNOWN IS NOT MASCULINE. When nobody has said, the room shows the masculine as the
 * line and the feminine beside it ("a woman says obrigada"), and asks once — in the room,
 * at the moment it matters (components/SpeakerAsk.tsx). The house default stays the
 * masculine only because one form has to be the headline; the other is never hidden.
 *
 * scripts/speaker-check.mts fails the build on a speaker-gendered line without its `f`.
 */
export type Speaker = 'm' | 'f' | null

type Gendered = { pt: string; f?: string }

/** One line, in this speaker's ending. */
export function said<T extends Gendered>(line: T, g: Speaker): T {
  return g === 'f' && line.f ? { ...line, pt: line.f } : line
}

/** The other ending, when there is one and the speaker is not known. */
export function otherEnding(line: Gendered, g: Speaker): string | null {
  return g === null && line.f && line.f !== line.pt ? line.f : null
}

const cache = new WeakMap<Situation, Situation>()

/**
 * A whole room, in this speaker's endings: every line and the release. The same object
 * back when nothing changes (a man, or a room with nothing gendered), so memoised
 * components do not re-render for nothing.
 */
export function voiced(s: Situation, g: Speaker): Situation
export function voiced(s: Situation | undefined, g: Speaker): Situation | undefined
export function voiced(s: Situation | undefined, g: Speaker): Situation | undefined {
  if (!s || g !== 'f') return s
  const hit = cache.get(s)
  if (hit) return hit
  const gendered = s.lines.some((l) => l.f) || Boolean(s.release.answer_f)
  const out: Situation = gendered
    ? {
        ...s,
        lines: s.lines.map((l: SituationLine) => said(l, 'f')),
        release: s.release.answer_f ? { ...s.release, answer: s.release.answer_f } : s.release,
      }
    : s
  cache.set(s, out)
  return out
}

/** Whether a room has anything that changes with the speaker. */
export function hasEndings(s: Situation): boolean {
  return s.lines.some((l) => Boolean(l.f)) || Boolean(s.release.answer_f)
}

/**
 * Whether a sentence somebody banked is this room's release — in EITHER ending.
 *
 * Path progress reads the proof record by exact sentence ("said cold" = a clean proof of
 * the release). A woman's proof now says "Boa tarde. Obrigada.", and a learner who said it
 * as a man before answering the question has "Obrigado." on the record: both are the room
 * done. Read against the house room by id, so a room already voiced for a woman still
 * recognises the masculine proof she banked last week.
 */
export function isRelease(pt: string, room: Situation): boolean {
  const house = situationById(room.id) ?? room
  return pt === house.release.answer || pt === house.release.answer_f || pt === room.release.answer
}
