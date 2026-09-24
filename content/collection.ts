/**
 * THE GRID: what somebody has completed, organised by the level they were at.
 *
 * Sam: "each of those has a grid as below. The 'game' is to fill the grid with completed
 * cards that the user can revisit, practise and share. We can do the same for Drops and
 * Cheat sheets. The idea is to organise their memory and learning."
 *
 * NOT NEW CONTENT. Everything here already exists and is scattered: a cheat sheet arrives
 * in the feed and goes into a list, a vibe is marked finished in another list, a Legend
 * frame is answered in a third. Nothing anywhere shows them as one collection, or says
 * that three of them belong to Getting around. The grid is a shelf for what is already
 * there.
 *
 * WHAT A CARD IS. Three kinds, because a level is made of three kinds and the whole point
 * is that they are one collection rather than three lists:
 *
 *   sheet   a closed set kept from the feed. It already knows how many of its members
 *           the learner owns, which is what makes it a card worth revisiting.
 *   vibe    a crate been through. The thing they chose, and the words came from it.
 *   frame   a Legend question answered. The sentences about themselves.
 *
 * WHAT FILLS A SLOT is not a new fact either — each kind already records its own
 * completion, and this only names them together: a sheet is KEPT, a vibe is FINISHED, a
 * frame is ANSWERED.
 *
 * WHICH LEVEL A CARD BELONGS TO is the one decision that had to be made, and it is made
 * the honest way: the level the learner was AT when they completed it. The alternative
 * was mapping the six rungs onto the five levels, and those are different axes — a rung
 * is what a sentence DOES (name it, ask for it, find it), a level is how far along
 * somebody is. Claiming one is the other would be inventing a fact about the content.
 *
 * Recording when rather than deriving it also means a card cannot move between levels
 * later because the learner kept going, which is what any derived answer would do.
 */
import { SETS, CRATES, type CultureFamily } from '@/content/roots'
import { LEGEND_FRAMES, STAGES, type Stage } from '@/content/legend'

export type CardKind = 'sheet' | 'vibe' | 'frame'

export interface CollectedCard {
  kind: CardKind
  /** The set id, crate id or frame id. */
  id: string
  /** What it is called on the grid. */
  label: string
  /** The level it was completed at — see the note above on why this is recorded. */
  level: Stage['id']
}

/**
 * How many slots a level shows.
 *
 * Nine, in a 3×3, which is what Sam drew. A fixed grid that fills up reads as a game and
 * an empty slot is the invitation; a grid that grows with the content reads as a library
 * and can never be finished. The product already refuses counters that only go up, and a
 * bottomless grid is one of those wearing a nicer shape.
 *
 * Overflow is not lost — see cardsFor, which returns everything and lets the grid show
 * the first nine. A level somebody has over-filled is a good problem and the extra is
 * still theirs in the list below it.
 */
export const SLOTS = 9

/** Every card this learner could ever collect, whether they have it or not. */
export function everyCard(): { kind: CardKind; id: string; label: string }[] {
  return [
    ...SETS.map((s) => ({ kind: 'sheet' as const, id: s.id, label: s.label })),
    /*
      Drops are deliberately not here. A drop expires — it is a gig on a date — so a grid
      slot for one would empty itself when the night passed, and a collection that loses
      cards is the opposite of the thing being built. Sam asked for drops too; what a drop
      leaves behind is the ROOM, which is a vibe, and that is the card.
    */
    ...CRATES.filter((c) => !c.drop).map((c) => ({
      kind: 'vibe' as const,
      id: c.id,
      label: c.title,
    })),
    ...LEGEND_FRAMES.map((f) => ({ kind: 'frame' as const, id: f.id, label: f.ask_en })),
  ]
}

/**
 * The cards this learner has completed, with the level each was completed at.
 *
 * `at` is the record of when, written by whatever marked the thing complete. A card with
 * no recorded level is put in the level the learner is in NOW rather than dropped: the
 * records predate the grid, and a learner who kept nine sheets last week should see nine
 * sheets rather than an empty shelf and a bug report.
 */
export function collected(me: {
  sheet_got?: string[]
  sections_completed?: string[]
  legend?: { frame_id: string; values: Record<string, string> }[]
  card_levels?: Record<string, Stage['id']>
  stageNow: Stage['id']
}): CollectedCard[] {
  const levelOf = (key: string) => me.card_levels?.[key] ?? me.stageNow
  const out: CollectedCard[] = []

  /*
    A SHEET IS KEPT, and `sheet_got` records the MEMBERS kept rather than the sets — so a
    set counts as collected once any of its words has been. That is the honest reading of
    "kept": the sheet went into their library, and the untaught members of a partial set
    are the shape of the thing rather than work outstanding.
  */
  const kept = new Set(me.sheet_got ?? [])
  for (const s of SETS) {
    if (!s.members.some((m) => kept.has(m))) continue
    out.push({ kind: 'sheet', id: s.id, label: s.label, level: levelOf('sheet:' + s.id) })
  }

  /* A VIBE IS FINISHED — sections_completed, which is written at the end of a sitting. */
  const through = new Set(me.sections_completed ?? [])
  for (const c of CRATES) {
    if (c.drop || !through.has(c.id as CultureFamily)) continue
    out.push({ kind: 'vibe', id: c.id, label: c.title, level: levelOf('vibe:' + c.id) })
  }

  /* A FRAME IS ANSWERED, which means it has values rather than merely existing. */
  for (const a of me.legend ?? []) {
    if (!Object.keys(a.values ?? {}).length) continue
    const f = LEGEND_FRAMES.find((x) => x.id === a.frame_id)
    if (!f) continue
    out.push({ kind: 'frame', id: f.id, label: f.ask_en, level: levelOf('frame:' + f.id) })
  }

  return out
}

/** One level's cards, in the order they were collected. */
export function cardsFor(all: CollectedCard[], level: Stage['id']): CollectedCard[] {
  return all.filter((c) => c.level === level)
}

/**
 * Every level, with what is in it — including the ones with nothing yet.
 *
 * An empty level renders as an empty grid rather than being hidden, because the empty
 * slots are the invitation and a level that appears only once it has something in it
 * cannot invite anybody into it.
 */
export function grid(all: CollectedCard[]): { stage: Stage; cards: CollectedCard[] }[] {
  return STAGES.map((stage) => ({ stage, cards: cardsFor(all, stage.id) }))
}
