/**
 * WHAT A COLLECTED CARD ASKS YOU, WHICH IS NOT WHAT IT TAUGHT YOU.
 *
 * Sam: "clicking on a panel should be a revision of what has been learned, not the
 * original walk through cards."
 *
 * A panel used to link at the lesson — /vibes?open=top_gun — which replays the whole
 * sitting: the recognition, the bridge, the pieces, the build. That is right the first
 * time and wrong every time after it, because the thing being revisited is not the lesson
 * but what the lesson left behind. Somebody returning to a finished card wants to find
 * out whether they still have it.
 *
 * SO REVISION IS THE RELEASE, NOT THE ROOT. Every kind offers the same shape — a line in
 * English, the Portuguese it wants back, and nothing else on screen — because that is the
 * one beat in this product that measures rather than teaches, and it is what `cold` and
 * MiniBuild already do.
 *
 * WHAT EACH KIND OFFERS:
 *
 *   vibe   the release line of each root in it. The culture-free sentence the lesson
 *          ended on, which is the thing it was for.
 *   sheet  the words of the set, asked as words. A sheet is a reference rather than a
 *          sentence, so asking for a sentence would be inventing content.
 *   frame  the learner's OWN answer, filled with their own values. Revising "Sou
 *          escocesa. Sou de Glasgow." is revising the only sentence on the card that is
 *          true about them.
 *
 * NOTHING HERE IS SCORED. It reports clean or not for the proof card, exactly as a first
 * release does, and a wrong answer costs nothing — the card stays collected. Revision
 * that can take a card off your shelf would make the grid a thing to be afraid of.
 */
import { CRATES, ROOTS_BY_FAMILY, SETS, PIECES, type CultureFamily } from '@/content/roots'
import { LEGEND_FRAMES, fillFrame, fillEnglish } from '@/content/legend'
import type { CardKind } from '@/content/collection'

export interface RevisionLine {
  /** What they are asked for, in English. */
  ask: string
  /** What counts as having said it. */
  answer: string
  /** Words the build offers that the sentence does not teach — see MiniBuild. */
  helpers?: Record<string, string>
}

/**
 * The lines a collected card asks back.
 *
 * Empty is a real answer and the callers handle it: a set whose words are all glossed
 * rather than taught has nothing to ask, and inventing a question there would test
 * somebody on language this product has never shown them.
 */
export function revisionFor(
  kind: CardKind,
  id: string,
  me: { legend?: { frame_id: string; values: Record<string, string> }[]; gender?: 'm' | 'f' | null },
): RevisionLine[] {
  if (kind === 'vibe') {
    /*
      The release, which is the sentence the root was for — culture-free, and the one
      thing in a sitting that was produced rather than read. The root line itself is a
      film quote; asking for it back would be revising Top Gun.
    */
    return (ROOTS_BY_FAMILY[id as CultureFamily] ?? [])
      .filter((r) => r.transfer_prompt?.answer && r.transfer_prompt?.ask)
      .map((r) => ({
        ask: r.transfer_prompt.ask,
        answer: r.transfer_prompt.answer,
        helpers: r.helpers,
      }))
  }

  if (kind === 'sheet') {
    /*
      A set is a reference, so it is asked as words rather than as sentences — and only
      the members this product actually teaches. A partial set lists its untaught members
      on purpose, as the shape of the thing; asking for one would be a test on language
      nobody has been shown.
    */
    const set = SETS.find((s) => s.id === id)
    if (!set) return []
    const byTarget = new Map(Object.values(PIECES).map((p) => [p.target, p]))
    return set.members
      .map((m) => ({ m, piece: byTarget.get(m) }))
      .filter((x): x is { m: string; piece: NonNullable<typeof x.piece> } => Boolean(x.piece))
      .map(({ m, piece }) => ({ ask: piece.gloss, answer: m }))
  }

  /*
    A frame asks for the learner's OWN sentence, filled with their own values. An
    unanswered frame is not on the grid, so there is always something to fill it with —
    but the guard stays, because a record can be cleared between collecting and revising.
  */
  const frame = LEGEND_FRAMES.find((f) => f.id === id)
  const answer = (me.legend ?? []).find((a) => a.frame_id === id)
  if (!frame || !answer || !Object.keys(answer.values ?? {}).length) return []
  return [
    {
      ask: fillEnglish(frame, answer.values),
      answer: fillFrame(frame, answer.values, me.gender ?? null),
    },
  ]
}

/** What the screen is called, which is the card's own name. */
export function revisionTitle(kind: CardKind, id: string): string {
  /* A vibe is a crate and a sheet is a set. Looking a vibe up in SETS never matches. */
  if (kind === 'vibe') return CRATES.find((c) => c.id === id)?.title ?? id
  if (kind === 'sheet') return SETS.find((s) => s.id === id)?.label ?? id
  return LEGEND_FRAMES.find((f) => f.id === id)?.ask_en ?? id
}
