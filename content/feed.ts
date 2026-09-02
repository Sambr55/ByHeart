import { CHAPTERS, DEFAULT_CHAPTER, type ChapterId } from '@/content/chapters'
import { DROP_WINDOW_DAYS } from '@/content/roots'
import { SITUATIONS, isCurrent, type Purpose, type Situation } from '@/content/situations'
import { DROPS, type Drop } from '@/content/drops'
import { explainersFor, type Explainer } from '@/content/explainers'
import { VIBE_IMAGES } from '@/content/vibe-images'
import {
  CRATES,
  PIECES,
  ROOTS_BY_FAMILY,
  displayForm,
  type Crate,
  type CultureFamily,
  type Piece,
} from '@/content/roots'
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
  /*
    A room, standing or dropped.

    `drop` is present when this situation belongs to something happening on a date — the
    card then carries the event and the countdown, because a room that expires and a room
    that does not are different offers and must not look the same.
  */
  | { kind: 'situation'; id: string; situation: Situation; drop?: Drop }
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
  /*
    A sentence the learner asked the translator for and kept.

    The only card in the feed DUB did not choose. Everything else here is content somebody
    authored or a form the paradigm table could vouch for; this is a thing a person wanted
    to say badly enough to look it up and then decided they would need again. That makes it
    the most reliable signal in the product about what this particular learner is doing
    with Portuguese, and it would be strange to know that and keep teaching around it.

    KEEP promises the sentence comes back around. This is where it comes back.
  */
  | {
      kind: 'asked'
      id: string
      ask: { pt: string; en: string; note: string; at: string }
      image: { src: string; alt: string }
    }
  /*
    A card that explains the product, sitting among the ones that are the product.

    The four of them replace the linear intro. Kept as a feed card rather than a screen
    because that is the entire point: somebody arriving should be able to swipe past an
    explanation they do not want, which a corridor never let them do.
  */
  | { kind: 'explainer'; id: string; explainer: Explainer; image: { src: string; alt: string } }
  /*
    A taste of a vibe, for the showcase.

    The Club is half the product and the other half is the vibes — language arriving out of
    something you already love rather than out of a syllabus. A feed of Lisbon rooms alone
    argues for a phrasebook with photographs, so the shop window has to carry one of each:
    something obviously useful, and something that is obviously fun and turns out to be
    useful. See feedFor's pinned opening.
  */
  /*
    Set-up, in the feed, because the process has to be visible in the thing that IS the
    process. It gates an action, never the scroll — see components/SetUp.tsx.
  */
  | { kind: 'setup'; id: string; image: { src: string; alt: string } }
  | {
      kind: 'vibe'
      id: string
      crate: Crate
      /** One real line out of it, which is the whole argument in four words. */
      taste: { pt: string; en: string; why: string }
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
export function feedFor(
  chapter: ChapterId = DEFAULT_CHAPTER,
  preview = false,
  /*
    What they said they were here for, and it ORDERS rather than filters.

    This is the change that makes the who/where/why questions worth asking, and the shape
    of it is a content fact rather than a preference. Of fifteen Situations, `moving`
    matches all fifteen, `staying` six and `visiting` four — so switching the filter on
    would hand a visitor a four-card Club, and the first thing purpose ever did would be
    making the product emptier. That is why roomsFor's filter has been documented as off
    since it was written, and the reason has not gone away.

    Ordering gets the benefit without the cost: what somebody is here for leads, everything
    else follows, and nothing is hidden from anybody. When there are blocks of ten for
    visiting and staying the same call can become a filter by passing purpose through to
    roomsFor instead — the wiring is identical, only the strictness changes.
  */
  purpose: Purpose | null = null,
): FeedCard[] {
  /*
    Rooms only.

    The words were interleaved here and they read as the same kind of thing as a room —
    same shape, same rail, same full-bleed photograph — so the feed became two sorts of
    card competing to be understood. They are not lost: they live on the profile, which
    is where somebody goes looking for what is theirs rather than what is next.
  */
  // Drops first: they expire and nothing else on the screen does.
  const rooms = roomsFor(chapter)
  const mine = (c: FeedCard) => c.kind === 'situation' && forPurpose(c.situation, purpose)
  return [
    ...dropsFor(chapter, new Date(), preview),
    ...rooms.filter(mine),
    ...rooms.filter((c) => !mine(c)),
  ]
}

/**
 * Live drops, soonest first.
 *
 * They come before the standing rooms in the feed and the ranking is one of URGENCY rather
 * than quality: the pharmacy will still be there next month and the gig will not. Nothing
 * about engagement, nothing learned about the viewer — just what expires.
 */
export function dropsFor(
  chapter: ChapterId = DEFAULT_CHAPTER,
  now: Date = new Date(),
  /*
    Ignore the window.

    A drop opens three weeks before the thing it is about, which is right — urgency spent
    months early is urgency spent — and it means the person building DUB cannot look at a
    drop unless one happens to be within three weeks. Turned on by ?preview=drops, which
    shows real content early and hides nothing, so it is safe to leave in.
  */
  preview = false,
): FeedCard[] {
  return DROPS.filter((d) => d.chapter === chapter && (preview || dropLive(d, now)))
    .sort((a, b) => a.on.localeCompare(b.on))
    .flatMap((d): FeedCard[] =>
      d.situations.map((s) => ({ kind: 'situation', id: s.id, situation: s, drop: d })),
    )
}

/** Open once its window has, gone the morning after the thing it is pegged to. */
export function dropLive(d: Drop, now: Date = new Date()): boolean {
  const gone = new Date(d.on + 'T00:00:00Z')
  gone.setUTCDate(gone.getUTCDate() + 1)
  if (now >= gone) return false
  const opens = d.from
    ? new Date(d.from + 'T00:00:00Z')
    : (() => {
        const o = new Date(d.on + 'T00:00:00Z')
        o.setUTCDate(o.getUTCDate() - DROP_WINDOW_DAYS)
        return o
      })()
  return now >= opens
}

/** Whole days left, for the countdown. */
export function dropDaysLeft(d: Drop, now: Date = new Date()): number {
  const gone = new Date(d.on + 'T00:00:00Z')
  gone.setUTCDate(gone.getUTCDate() + 1)
  return Math.max(0, Math.ceil((gone.getTime() - now.getTime()) / 86_400_000))
}

/**
 * Whether a Situation is for this learner.
 *
 * Untagged means everybody, which is most of Lisbon — a pharmacy does not care why you
 * are in the country. Tagging is for the ones where the answer genuinely differs, and an
 * unanswered purpose sees everything rather than nothing: a Club that empties itself
 * until a question is answered is a Club with a form in front of it.
 */
export function forPurpose(s: Situation, purpose: Purpose | null): boolean {
  if (!s.purposes || !purpose) return true
  return s.purposes.includes(purpose)
}

export function roomsFor(
  chapter: ChapterId = DEFAULT_CHAPTER,
  /*
    Off until there is something to filter to.

    Five Situations divided by three purposes is one or two each, so turning this on before
    a block of ten exists would make the first thing purpose does be making the Club emptier
    — the exact problem it is meant to solve. The parameter is here so the wiring is real
    and tested; the caller passes null until spec-purpose-and-depth §04 step 3 lands.
  */
  purpose: Purpose | null = null,
): FeedCard[] {
  return SITUATIONS.filter((s) => s.chapter === chapter && isCurrent(s) && forPurpose(s, purpose))
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

/**
 * Kept sentences, as cards.
 *
 * Newest first, because the thing somebody looked up on the way here is the thing they are
 * in the middle of needing — and rationed the same way derived cards are, so a learner who
 * has kept thirty sentences does not get a feed made entirely of their own homework.
 *
 * Uses the calçada image rather than a vibe still: these came from the street, not from a
 * film, and dressing one up in somebody else's photograph would say it did.
 */
export function askedCards(
  asked: { pt: string; en: string; note: string; at: string }[],
  finished: string[],
): FeedCard[] {
  const done = new Set(finished ?? [])
  return [...(asked ?? [])]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((ask) => ({
      kind: 'asked' as const,
      // Stable, and derived from the sentence, so a card done once is done for good.
      id: 'asked:' + ask.pt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      ask,
      image: REGISTER.next_person,
    }))
    .filter((c) => !done.has(c.id))
    .slice(0, DERIVED_PER_SESSION)
}

/**
 * One vibe, as a card, with a real line out of it.
 *
 * Not a promotion for the vibes tab — the line on the back is a genuine root from the crate
 * and it is the argument in four words: you knew this already, and here is the Portuguese
 * you just got for free.
 */
export function vibeCard(family: CultureFamily): FeedCard | null {
  const crate = CRATES.find((c) => c.id === family)
  const image = VIBE_IMAGES[family]
  const root = (ROOTS_BY_FAMILY[family] ?? []).find((r) => r.extracts.length > 0)
  if (!crate || !image || !root) return null
  const piece = root.extracts[0]
  return {
    kind: 'vibe',
    id: 'vibe_' + family,
    crate,
    taste: {
      pt: root.target,
      en: root.root_display,
      why: piece.target.replace('…', '').trim() + ' — ' + piece.gloss,
    },
    image: { src: image.src, alt: image.alt },
  }
}

/**
 * The set-up card, for anybody who has not been through it.
 *
 * Retired the moment the deal is accepted, like every explainer: a card telling somebody to
 * do a thing they have already done is an advert for their own past.
 */
export function setUpCard(dealAccepted: boolean): FeedCard | null {
  if (dealAccepted) return null
  return {
    kind: 'setup',
    id: 'setup',
    image: {
      src: '/lisbon/junta-doorway.jpg',
      alt: 'Three people waiting at the plain stone doorway of a Portuguese municipal office.',
    },
  }
}

/**
 * The explainers this learner still has a reason to see, as cards.
 *
 * Interleaved rather than stacked — see the caller. Four explanations in a row is a
 * corridor with swipes instead of taps, which is the thing this replaces.
 */
export function explainerCards(state: {
  playedAVibe: boolean
  legendWritten: boolean
  isMember: boolean
  usedTranslator: boolean
}): FeedCard[] {
  return explainersFor(state).map((e) => ({
    kind: 'explainer' as const,
    id: 'explainer_' + e.id,
    explainer: e,
    image: e.image,
  }))
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
  return [...dropsFor(), ...roomsFor(), ...wordCards()].find((c) => c.id === id)
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
      // A drop says so, because a room that expires is a different offer.
      eyebrow: card.drop ? 'A DROP' : 'IN LISBON',
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
  if (card.kind === 'setup') {
    return {
      eyebrow: 'ONE DECISION',
      title: 'Then you start.',
      blurb: 'Which language, and what DUB asks of you. It takes one tap and it is the last thing between you and your first three vibes.',
      image: card.image,
    }
  }
  if (card.kind === 'vibe') {
    return {
      eyebrow: 'A VIBE',
      title: card.crate.title,
      blurb: card.crate.blurb,
      image: card.image,
    }
  }
  if (card.kind === 'explainer') {
    return {
      eyebrow: card.explainer.eyebrow,
      title: card.explainer.title,
      blurb: card.explainer.blurb,
      image: card.image,
    }
  }
  if (card.kind === 'asked') {
    /*
      "YOU ASKED" rather than "YOU LEARNED", because it is not the same claim and the
      difference is the point — nobody taught this one, it was wanted.
    */
    return {
      eyebrow: 'YOU ASKED',
      title: card.ask.pt,
      blurb: card.ask.note || card.ask.en,
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
