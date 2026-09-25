/**
 * THE LIBRARY: everything finished, kept as a card, filed in a deck.
 *
 * Sam: "essentially I want everything to be cards and everything completed to be saved
 * into decks. Including drops, if they are marked done they don't expire but get saved
 * into a grid. The decks will need to be collapsible or there will be too many. Even
 * 'words' can be saved into cards that have natural groupings and each card added to over
 * time. The cards become your library where you can retry or remind."
 *
 * WHAT CHANGED, AND WHY IT HAD TO. The first version of this filed cards by the LEVEL the
 * learner was at when they finished them — five levels, nine slots each. That was the
 * right shape for the three kinds it had and it does not survive the two new ones:
 *
 *   - five levels × nine slots is forty-five, and the card universe is already forty-seven
 *     before a single new drop or root is authored. A grid that is full on the day it
 *     ships is not a game, it is a wall.
 *   - a WORD card is never finished. THINGS holds thirty-six words today and holds
 *     thirty-seven the moment somebody learns one, so "the level you completed it at" is a
 *     question it cannot answer.
 *   - a DROP marked done has a date on it, and its level is an accident of when the gig
 *     happened rather than anything about the learner.
 *
 * SO THE DECK IS THE KIND, and the level moves to being something a card SAYS rather than
 * the drawer it lives in. Five decks, each collapsible, each with its own count — which is
 * what Sam asked for directly, and which also fixes the capacity problem by construction:
 * a deck is as big as its content and does not pretend to a fixed size it cannot keep.
 *
 * THE FIVE DECKS:
 *
 *   legend   the questions about yourself, answered. Closed: thirteen of thirteen.
 *   vibes    rooms been through. Closed, and grows when rooms are authored.
 *   sheets   closed sets kept from the feed.
 *   drops    nights taken. OPEN-ENDED, and the only deck whose cards have a date.
 *   words    the nine shelves, each a living card that grows. Never full — see below.
 *
 * A LIVING CARD IS STILL A CARD. Sam chose that a word shelf is collected the moment it
 * has its first word and stays, showing what it holds rather than how near the end it is.
 * That is the honest shape: there is no end. What it offers is revision over everything on
 * it, which gets better as it grows rather than running out.
 *
 * WHAT IS NOT HERE. Nothing counts days, nothing ranks a deck against another, and no card
 * can leave once collected — including a drop, which is the entire point of marking one
 * done. A library you can be evicted from is not a library.
 */
import { SETS, CRATES, PIECES, SHELVES, type Shelf, type CultureFamily } from '@/content/roots'
import { LEGEND_FRAMES, STAGES, type Stage } from '@/content/legend'
import { DROPS } from '@/content/drops'

export type CardKind = 'sheet' | 'vibe' | 'frame' | 'drop' | 'words'

/** The five drawers, in the order they are shown. */
export type DeckId = 'legend' | 'vibes' | 'sheets' | 'drops' | 'words'

export interface CollectedCard {
  kind: CardKind
  /** The set id, crate id, frame id, drop id, or shelf id. */
  id: string
  /** What it is called on the grid. */
  label: string
  /**
   * The level the learner was at when they completed it, where that is a fact.
   *
   * Absent on a WORDS card, which is never completed, and on a DROP, whose date is a fact
   * about the gig rather than about the learner. Both were being asked a question they
   * cannot answer, and the old model had no way to say so.
   */
  level?: Stage['id']
  /**
   * What the card holds, for the cards that hold a growing number of things.
   *
   * Only WORDS cards carry this. It is what the face shows in place of a completion mark,
   * because "36 words" is true and "36 of ?" is not.
   */
  holds?: number
  /** When it happened. Only drops have one, and it is why they are ordered by it. */
  on?: string
}

export interface Deck {
  id: DeckId
  label: string
  /** One line on the drawer, said when it is shut. */
  holds: string
  cards: CollectedCard[]
  /**
   * How many cards this deck could ever hold, where that is a knowable number.
   *
   * Absent for DROPS, which is open-ended by nature — a deck of nights out has no
   * total, and inventing one ("1 of 1", because one drop is authored) would be a
   * promise about the content pipeline rather than about the learner.
   *
   * Absent for WORDS too, but for the opposite reason: the number of shelves IS known,
   * and a shelf with no words yet is not a card waiting to be collected — it is a shelf
   * with no words. Nine of nine would be reachable by learning nine words.
   */
  total?: number
}

/**
 * How many slots a deck shows when it is open and not yet filled.
 *
 * Still nine, and still a 3×3, because the empty slot is the invitation and Sam drew it
 * that way. What changed is that nine is now a MINIMUM rather than a ceiling: a deck with
 * thirteen cards draws thirteen, and a deck with two draws two and seven dashed outlines.
 * The old fixed nine had to drop the overflow into a footnote, which is what a shelf does
 * when it is pretending to be a game board.
 */
export const SLOTS = 9

/** Every card this learner could ever collect, whether they have it or not. */
export function everyCard(): { kind: CardKind; id: string; label: string }[] {
  return [
    ...SETS.map((s) => ({ kind: 'sheet' as const, id: s.id, label: s.label })),
    /*
      A drop-crate is not a vibe. The crate behind a drop is its language, shown inside
      the drop's own card — listing it twice would put the same night on the shelf in two
      drawers.
    */
    ...CRATES.filter((c) => !c.drop).map((c) => ({
      kind: 'vibe' as const,
      id: c.id,
      label: c.title,
    })),
    ...LEGEND_FRAMES.map((f) => ({ kind: 'frame' as const, id: f.id, label: f.ask_en })),
    ...DROPS.map((d) => ({ kind: 'drop' as const, id: d.id, label: d.event })),
    ...SHELVES.map((s) => ({ kind: 'words' as const, id: s.id, label: s.label })),
  ]
}

/** What a word shelf holds right now, from the inventory rather than from a list. */
export function wordsOnShelf(inventory: Record<string, unknown>): Record<Shelf, number> {
  const out = {} as Record<Shelf, number>
  for (const s of SHELVES) out[s.id] = 0
  for (const id of Object.keys(inventory ?? {})) {
    const piece = PIECES[id]
    if (piece && out[piece.shelf] !== undefined) out[piece.shelf] += 1
  }
  return out
}

/**
 * The cards this learner has collected.
 *
 * `card_levels` is the record of WHEN, written by whatever marked the thing complete. A
 * card with no recorded level is put in the level the learner is in now rather than
 * dropped: the records predate the grid, and a learner who kept nine sheets last week
 * should see nine sheets rather than an empty shelf and a bug report.
 */
export function collected(me: {
  sheet_got?: string[]
  sections_completed?: string[]
  legend?: { frame_id: string; values: Record<string, string> }[]
  drops_done?: string[]
  inventory?: Record<string, unknown>
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

  /*
    A DROP IS MARKED DONE, and then it stops expiring. Sam: "if they are marked done they
    don't expire but get saved into a grid."

    This is the only kind whose collection is a DECISION rather than a by-product — the
    other four are marked complete by finishing them, and a night out is finished whether
    or not anybody went. So it needs its own record, and `drops_done` is it.

    Read from DROPS by id, so a drop that is later un-authored disappears from the deck
    rather than rendering as a card with no content behind it. That is the right failure:
    the language for a gig that no longer exists cannot be revised.

    No level. A drop's date is a fact about the gig, not about the learner, and stamping
    one here would put a card in a drawer for a reason that has nothing to do with them.
  */
  const done = new Set(me.drops_done ?? [])
  for (const d of DROPS) {
    if (!done.has(d.id)) continue
    out.push({ kind: 'drop', id: d.id, label: d.event, on: d.on })
  }

  /*
    A WORD SHELF IS COLLECTED THE MOMENT IT HAS A WORD, and then it grows forever.

    Sam chose this shape over tiers: "each card added to over time". So there is no
    threshold, no bronze-silver-gold, and no completion — the card appears with its first
    word and reports what it holds from then on.

    Which means `holds` is the whole of its state, and it is derived from the inventory on
    every read rather than stored. A stored count is a second number for a fact that
    already has one, and this codebase has paid for that mistake more than once.
  */
  const counts = wordsOnShelf(me.inventory ?? {})
  for (const s of SHELVES) {
    if (!counts[s.id]) continue
    out.push({ kind: 'words', id: s.id, label: s.label, holds: counts[s.id] })
  }

  return out
}

/** The deck a kind belongs to. One drawer per kind, which is the whole model. */
const DECK_OF: Record<CardKind, DeckId> = {
  frame: 'legend',
  vibe: 'vibes',
  sheet: 'sheets',
  drop: 'drops',
  words: 'words',
}

const DECKS: { id: DeckId; label: string; holds: string }[] = [
  { id: 'legend', label: 'YOUR LEGEND', holds: 'The things you can say about yourself.' },
  { id: 'vibes', label: 'ROOMS', holds: 'Sittings you have been through.' },
  { id: 'sheets', label: 'CHEAT SHEETS', holds: 'Closed sets, kept for when you need them.' },
  { id: 'drops', label: 'NIGHTS', holds: 'What you went to, and the language for it.' },
  { id: 'words', label: 'WORDS', holds: 'Everything you own, by what sort of word it is.' },
]

/**
 * Every deck, with what is in it — including the empty ones.
 *
 * An empty deck renders shut with "0 of 13" rather than being hidden, because the count is
 * the invitation and a drawer that appears only once it has something in it cannot invite
 * anybody to fill it.
 */
export function decks(all: CollectedCard[]): Deck[] {
  const totals: Partial<Record<DeckId, number>> = {
    legend: LEGEND_FRAMES.length,
    vibes: CRATES.filter((c) => !c.drop).length,
    sheets: SETS.length,
    /* drops and words have no total — see the note on Deck.total. */
  }
  return DECKS.map((d) => {
    const cards = all.filter((c) => DECK_OF[c.kind] === d.id)
    /*
      Nights in date order, newest first, because a night out is remembered by when it
      was. Everything else keeps collection order, which is the order they were finished
      in and the only order the learner had any part in choosing.
    */
    if (d.id === 'drops') cards.sort((a, b) => (b.on ?? '').localeCompare(a.on ?? ''))
    return { ...d, cards, total: totals[d.id] }
  })
}

/**
 * Which deck should be open when the library is first drawn.
 *
 * The one with something in it and the most room left, which is the one where the next
 * card is most likely to land — and never an empty deck, because opening a drawer with
 * nothing in it to greet somebody is the worst reading of "collapsible".
 *
 * Falls back to the first deck holding anything, and then to legend, so this always names
 * a real deck.
 */
export function openAtFirst(all: CollectedCard[]): DeckId {
  const ds = decks(all).filter((d) => d.cards.length > 0)
  if (!ds.length) return 'legend'
  const withRoom = ds.filter((d) => d.total !== undefined && d.cards.length < d.total)
  const pick = withRoom.length ? withRoom : ds
  return pick[0].id
}

/** What a level is called, for the line a card carries about when it was finished. */
export function levelLabel(id: Stage['id'] | undefined): string | null {
  if (!id) return null
  return STAGES.find((s) => s.id === id)?.name ?? null
}
