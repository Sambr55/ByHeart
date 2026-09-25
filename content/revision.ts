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
 *   drop   the release of each situation in the night. A drop is a cluster of errands
 *          ending in an invitation, and the invitation is the sentence worth having back.
 *   words  the words on that shelf that this learner actually owns. The one kind whose
 *          revision GROWS: a shelf asked at thirty words asks more than it did at ten,
 *          which is what a living card is for.
 *   idiom  the English, asked from the literal Portuguese. Deliberately the way round the
 *          card teaches it — the riddle is the face and the answer is what you had.
 *   asked  the sentence you asked for, asked back from your own English. The only content
 *          in the product the learner wrote the brief for.
 *   cheat  the three sentences that ARE the shape. Revising a mechanism means producing
 *          it again, which is the same act that collected it in the first place.
 *
 * NOTHING HERE IS SCORED. It reports clean or not for the proof card, exactly as a first
 * release does, and a wrong answer costs nothing — the card stays collected. Revision
 * that can take a card off your shelf would make the grid a thing to be afraid of.
 */
import {
  CRATES,
  ROOTS_BY_FAMILY,
  SETS,
  SHELVES,
  PIECES,
  type CultureFamily,
  type Shelf,
} from '@/content/roots'
import { LEGEND_FRAMES, fillFrame, fillEnglish } from '@/content/legend'
import { DROPS } from '@/content/drops'
import { IDIOMS } from '@/content/idioms'
import { CHEATS } from '@/content/cheats'
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
  me: {
    legend?: { frame_id: string; values: Record<string, string> }[]
    gender?: 'm' | 'f' | null
    /** Needed by the words branch, which asks only for what this learner owns. */
    inventory?: Record<string, unknown>
    /** The asked branch's only source — this content lives nowhere else. */
    asked?: { pt: string; en: string; note: string; at: string }[]
  },
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

  if (kind === 'drop') {
    /*
      A NIGHT IS REVISED BY WHAT YOU HAD TO SAY TO GET THROUGH IT.

      Each situation in a drop ends in a release — the thing you must be able to say cold
      — and the last one is the invitation, which is the point of the whole cluster. So
      the night asks back exactly what it taught, in the order it taught it, and the
      sentence somebody said to another person about an evening comes last.
    */
    const drop = DROPS.find((d) => d.id === id)
    if (!drop) return []
    return drop.situations
      .filter((sit) => sit.release?.ask && sit.release?.answer)
      .map((sit) => ({ ask: sit.release.ask, answer: sit.release.answer }))
  }

  if (kind === 'cheat') {
    /*
      All three, because a shape is not one sentence — it is the thing those three have in
      common. Asking for one would be revising a sentence; asking for all three is
      revising the pattern, which is what the card is for.
    */
    const cheat = CHEATS.find((c) => c.id === id)
    if (!cheat) return []
    return cheat.says.map((l) => ({ ask: l.en, answer: l.pt }))
  }

  if (kind === 'idiom') {
    /*
      ASKED THE WAY THE CARD ASKS IT: the nonsense Portuguese is the prompt and the English
      is the answer, because that is the direction the joke runs. Reversing it — English in,
      Portuguese out — would be testing somebody's memory of a translation this product
      openly calls wrong.
    */
    const idiom = IDIOMS.find((i) => i.id === id)
    if (!idiom) return []
    return [{ ask: idiom.literal, answer: idiom.english }]
  }

  if (kind === 'words') {
    /*
      A SHELF ASKS FOR THE WORDS ON IT THAT ARE YOURS.

      Only the ones owned. A shelf is a grouping of everything this product teaches, and
      asking for a word nobody has met is a test on language that has never been shown —
      the same rule the sheet branch above follows, for the same reason.

      This is the revision that gets better rather than running out: the card is never
      finished, so the thing it asks grows every time a word lands on it.
    */
    if (!SHELVES.some((sh) => sh.id === id)) return []
    const owned = new Set(Object.keys(me.inventory ?? {}))
    return Object.entries(PIECES)
      .filter(([pieceId, piece]) => piece.shelf === (id as Shelf) && owned.has(pieceId))
      .map(([, piece]) => ({ ask: piece.gloss, answer: piece.target }))
  }

  if (kind === 'asked') {
    /*
      THE SENTENCE THEY WANTED, asked back from their own English.

      Matched on the slug rather than looked up in a table, because there is no table:
      this content was written by the learner and lives only on their record. The slug is
      built the same way collected() and askedCards() build it, so the three agree.
    */
    const slug = (pt: string) =>
      pt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const ask = (me.asked ?? []).find((a) => a?.pt && slug(a.pt) === id)
    if (!ask) return []
    return [{ ask: ask.en || ask.pt, answer: ask.pt }]
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
  /* A night is called what happened, and a shelf what it holds. */
  if (kind === 'drop') return DROPS.find((d) => d.id === id)?.event ?? id
  if (kind === 'words') return SHELVES.find((sh) => sh.id === id)?.label ?? id
  /* An idiom is called by its answer; an asked sentence has no name but itself. */
  if (kind === 'idiom') return IDIOMS.find((i) => i.id === id)?.english ?? id
  /* A shape is called by its shape — NÃO + VERB is the name and the lesson. */
  if (kind === 'cheat') return CHEATS.find((c) => c.id === id)?.shape ?? id
  if (kind === 'asked') return 'A sentence you asked for'
  return LEGEND_FRAMES.find((f) => f.id === id)?.ask_en ?? id
}
