import { CHAPTERS, DEFAULT_CHAPTER, type ChapterId } from '@/content/chapters'
import { SITUATIONS, isCurrent, type Situation } from '@/content/situations'
import { PIECES, displayForm, type Piece } from '@/content/roots'
import type { DerivedCard } from '@/engine/derive'

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
  /*
    A card assembled from something they already own.

    It carries the photograph of the vibe the piece came from, which is not decoration:
    "because you learned quero in Pulp Fiction" over the Pulp Fiction still says the
    provenance before a word of it is read. A derived card that looked like a flashcard
    would be a flashcard.
  */
  | { kind: 'derived'; id: string; card: DerivedCard; image: { src: string; alt: string } }
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

/**
 * Derived cards, as feed cards.
 *
 * Rationed here rather than in the generator, and deliberately: spec-derived-cards §06 is
 * clear that a bottomless supply of these is the Duolingo treadmill rebuilt out of better
 * parts. A few, under the authored material, arriving as the app noticing something about
 * you — never the bulk of a session.
 */
export const DERIVED_PER_SESSION = 3

/**
 * The texture register — a third one, and neither of the other two.
 *
 * These carried the photograph of the vibe the piece came from, which read well as
 * provenance and badly as a feed: the same eleven stills came round again under a different
 * eyebrow, so the Club looked like the shelf. A derived card is not about a place, which is
 * what the Club's photographs are for, and it is not about a vibe, which is what the shelf's
 * are. It is about language, so it gets the surfaces language is written on here.
 *
 * By KIND rather than by vibe, and the pairing is not arbitrary: azulejo is a picture made
 * of separate tiles, which is what a collision is.
 */
const REGISTER: Record<string, { src: string; alt: string }> = {
  collision: {
    src: '/lisbon/azulejo.jpg',
    alt: 'A weathered blue and white azulejo panel, separate tiles making one picture.',
  },
  next_person: {
    src: '/lisbon/calcada.jpg',
    alt: 'Lisbon calçada pavement in black and white limestone, worn smooth and wet from rain.',
  },
  near_miss: {
    src: '/lisbon/wall.jpg',
    alt: 'A Lisbon façade in faded ochre, the paint peeling back in layers to pink underneath.',
  },
}

export function derivedCards(cards: DerivedCard[]): FeedCard[] {
  /*
    One of each kind before a second of any, rather than the top three of a sorted list.

    Sorting put near misses first — correctly, since they fix something somebody is getting
    wrong today — and then the ration took the first three, so a learner with three
    outstanding near misses never saw a collision at all. Collisions are the best cards
    here and the entire compounding claim made visible, and they were being crowded out by
    the ordering that was meant to be helping.

    Round-robin keeps the ranking's intent — a near miss still comes first — while making
    sure a session is a mix rather than three of a kind.
  */
  const byKind = new Map<string, DerivedCard[]>()
  for (const c of cards) byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c])
  const queues = [...byKind.values()]
  const picked: DerivedCard[] = []
  while (picked.length < DERIVED_PER_SESSION && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (picked.length >= DERIVED_PER_SESSION) break
      const next = q.shift()
      if (next) picked.push(next)
    }
  }

  return picked.flatMap((card): FeedCard[] => {
    const image = REGISTER[card.kind]
    if (!image) return []
    return [{ kind: 'derived', id: card.id, card, image }]
  })
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
  /* Said rather than congratulated. It went somewhere, and here is where. */
  done: 'Done. It is on your profile.',
  /*
    An empty Club, said honestly.

    Not "come back tomorrow" — nothing is scheduled to arrive tomorrow, and a product that
    invents a reason to return is doing the thing this one exists to avoid. It says what is
    true: you have been through what is here, more comes from learning more, and the two
    places your work went are one tap away.
  */
  empty_eyebrow: 'NOTHING LEFT',
  empty_head: 'You have been through everything here.',
  empty_body:
    'Rooms leave the Club when you have said them cold — they are on your profile, and they come back round in the Line. More opens as you learn more: every vibe you go through gives the Club something new to say to you.',
  empty_cta: 'OPEN ANOTHER VIBE',
  empty_alt: 'SEE WHAT IS YOURS',
  saved: 'Kept. It is on your profile.',
  saved_cta: 'SEE IT',
  unsaved: 'Taken off your profile.',
} as const


/**
 * The front of a card, whatever kind it is.
 *
 * Three kinds now, and the alternative is a conditional at every call site that touches a
 * card — the eyebrow, the share sheet, the profile tile — each of which would have to be
 * found again the next time a kind is added. This is the one that gets found.
 */
export function cardFace(card: FeedCard): {
  eyebrow: string
  title: string
  blurb: string
  image?: { src: string; alt: string }
} {
  if (card.kind === 'situation') {
    return {
      eyebrow: 'IN LISBON',
      title: card.situation.title,
      blurb: card.situation.why,
      image: card.situation.image,
    }
  }
  if (card.kind === 'derived') {
    /*
      Two different claims, so two different eyebrows.

      A collision is not "here is a new form" — it is a sentence the learner can already
      say, made out of two vibes that have nothing to do with each other, and the whole
      point is that nobody taught them the combination. "You learned" would undersell it.

      Both inside the fourteen characters an eyebrow gets, which "BECAUSE YOU LEARNED" was
      not — it slipped through because the vocabulary gate reads JSX and this is a string.
    */
    return {
      eyebrow: card.card.kind === 'collision' ? 'YOU CAN SAY' : 'YOU LEARNED',
      title: card.card.target,
      blurb: card.card.note,
      image: card.image,
    }
  }
  return {
    eyebrow: 'WORTH HAVING',
    title: displayForm(card.piece),
    blurb: card.because,
    image: card.image,
  }
}
