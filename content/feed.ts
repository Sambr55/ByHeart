import { CHAPTERS, DEFAULT_CHAPTER, type ChapterId } from '@/content/chapters'
import { SITUATIONS, isCurrent, type Situation } from '@/content/situations'
import { PIECES, displayForm, type Piece } from '@/content/roots'

/**
 * The Club, as a feed.
 *
 * One card fills the screen, you swipe up for the next, and left for the language. That
 * shape is borrowed on purpose: it is the only interaction pattern a phone user does not
 * have to be taught, and the Club is where somebody arrives already tired of being
 * taught things.
 *
 * IT LOOPS RATHER THAN SCROLLS. An infinite scroll has no bottom because there is always
 * more to serve; this one has no bottom because it comes back round. The difference is
 * whether the product benefits from you staying — DUB does not, and it has spent every
 * other screen saying so. A loop cannot reward turning up any more than the ladder can.
 */
export type FeedCard =
  | { kind: 'situation'; id: string; situation: Situation }
  | {
      kind: 'vocab'
      id: string
      /** The word, and where it came from. */
      piece: Piece
      /** The situation this word is useful IN — the reason it is in this feed at all. */
      because: string
      image: { src: string; alt: string }
    }

/**
 * A vocab card is not a flashcard.
 *
 * It earns its place by being pinned to a moment: "quanto" is not "how much", it is the
 * word you need at the counter with your hand already in your pocket. Divorced from that
 * it is a dictionary entry, and the product has a vocab library for those.
 */
const VOCAB: { piece: string; because: string; from: string }[] = [
  { piece: 'quanto', because: 'The counter, with your hand already in your pocket.', from: 'cafe-counter' },
  { piece: 'onde', because: 'Lost, and it is getting dark.', from: 'calcada' },
  { piece: 'ajuda', because: 'The one word that turns a stranger into somebody helping you.', from: 'wall' },
  { piece: 'por_favor', because: 'On the end of everything. It is not optional here.', from: 'azulejo' },
]

const TEXTURE: Record<string, { src: string; alt: string }> = {
  'cafe-counter': {
    src: '/lisbon/cafe-counter.jpg',
    alt: 'A zinc café counter in Lisbon with an empty espresso cup and a folded newspaper.',
  },
  calcada: {
    src: '/lisbon/calcada.jpg',
    alt: 'Lisbon calçada pavement in black and white limestone, worn smooth and wet from rain.',
  },
  wall: {
    src: '/lisbon/wall.jpg',
    alt: 'A Lisbon façade in faded ochre, the paint peeling back in layers to pink underneath.',
  },
  azulejo: {
    src: '/lisbon/azulejo.jpg',
    alt: 'A weathered blue and white azulejo tile panel, one tile cracked across the middle.',
  },
}

/**
 * The cards, interleaved.
 *
 * A situation, a situation, then a word — rather than all the rooms and then all the
 * vocabulary. The mix is the point: it is what stops the feed feeling like a menu with a
 * glossary bolted on the end.
 */
export function feedFor(chapter: ChapterId = DEFAULT_CHAPTER): FeedCard[] {
  /*
    Rooms only.

    The words were interleaved here and they read as the same kind of thing as a room —
    same shape, same rail, same full-bleed photograph — so the feed became two sorts of
    card competing to be understood. They are not lost: they live on the profile, which
    is where somebody goes looking for what is theirs rather than what is next.
  */
  return roomsFor(chapter)
}

export function roomsFor(chapter: ChapterId = DEFAULT_CHAPTER): FeedCard[] {
  return SITUATIONS.filter((s) => s.chapter === chapter && isCurrent(s))
    .sort((a, b) => a.rung - b.rung)
    .map((s): FeedCard => ({ kind: 'situation', id: s.id, situation: s }))
}

/** The words, for the profile. Same card shape, different place to meet it. */
export function wordCards(): FeedCard[] {
  return VOCAB.flatMap((v): FeedCard[] => {
    const piece = PIECES[v.piece]
    const image = TEXTURE[v.from]
    if (!piece || !image) return []
    return [{ kind: 'vocab', id: 'vocab_' + v.piece, piece, because: v.because, image }]
  })
}

/** Every card that exists, so a saved id can be looked up wherever it came from. */
export function cardById(id: string): FeedCard | undefined {
  return [...roomsFor(), ...wordCards()].find((c) => c.id === id)
}

export function chapterName(chapter: ChapterId = DEFAULT_CHAPTER): string {
  return CHAPTERS.find((c) => c.id === chapter)?.name ?? 'Dub Club'
}

/** The word as a learner reads it, gender article included where it has one. */
export function vocabWord(piece: Piece): string {
  return displayForm(piece)
}

/**
 * What the feed says out loud.
 *
 * A save used to fill in a bookmark and say nothing, so the only way to learn whether it
 * had worked was to go and look — at a screen most people have not found yet.
 */
export const FEED_COPY = {
  saved: 'Kept. It is on your profile.',
  saved_cta: 'SEE IT',
  unsaved: 'Taken off your profile.',
} as const
