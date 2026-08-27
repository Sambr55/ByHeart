/**
 * The image bank — pictures that belong to a KIND of moment, not to one drop.
 *
 * The problem this solves: a drop is authored the week it matters, and nobody is going to
 * generate four new photographs every time a gig comes up. Commissioning per drop does not
 * scale past about one drop.
 *
 * But the pictures a concert drop needs are not about the concert. "Finding the arena" is a
 * big lit building at night seen from a station exit; "a ticket, on the night" is a box
 * office window; "getting to Oriente" is a metro platform with a crowd on it. Those are the
 * same four pictures for Duran Duran in November and for whoever is on in March, and three
 * of the four work just as well for a football match.
 *
 * So: one bank, keyed by what the picture IS, referenced by the drop templates. A fixed set
 * of about sixteen covers every drop DUB will make for a year, and each one only has to be
 * made once.
 *
 * Rights and alt text live here rather than at the call site, which means a picture cannot
 * be used somewhere without them — the same rule the Club's own photographs follow.
 */
export interface BankImage {
  src: string
  /** The information, not the mood. Somebody who cannot see it should know what is there. */
  alt: string
  rights_status: 'generated' | 'owned' | 'licensed' | 'cc-by' | 'permission-given'
  /** Places rot, and a photograph has an age. */
  taken_at?: string
}

/**
 * What each slug is for, so the brief writes itself.
 *
 * `have` is what exists today. Everything else is a hole, and a template referring to a hole
 * fails the gate rather than rendering a blank card — which is the whole reason the bank is
 * a declared list rather than a folder somebody remembers to fill.
 */
export const IMAGE_BANK: Record<string, BankImage> = {
  // ---------------------------------------------------------------- already in the repo
  azulejo: {
    src: '/lisbon/azulejo.jpg',
    alt: 'A weathered blue and white azulejo tile panel, one tile cracked across the middle.',
    rights_status: 'generated',
  },
  calcada: {
    src: '/lisbon/calcada.jpg',
    alt: 'Lisbon calçada pavement in black and white limestone, worn smooth and wet from rain.',
    rights_status: 'generated',
  },
  wall: {
    src: '/lisbon/wall.jpg',
    alt: 'A Lisbon façade in faded ochre, the paint peeling back in layers to pink underneath.',
    rights_status: 'generated',
  },
  cafe_counter: {
    src: '/lisbon/cafe-counter.jpg',
    alt: 'A zinc café counter in Lisbon with an empty espresso cup on a saucer and a folded newspaper beside it.',
    rights_status: 'generated',
  },
  tram_distant: {
    src: '/lisbon/tram-distant.jpg',
    alt: 'A yellow Lisbon tram seen far down a narrow street, framed by buildings on both sides.',
    rights_status: 'generated',
  },
}

/**
 * The pictures a drop needs and does not have.
 *
 * Declared rather than discovered, so the brief is a list somebody can act on instead of a
 * bug found on the night. Every entry says what the picture is FOR, because a picture made
 * from a mood board and a picture made from a use are different pictures.
 */
export const WANTED: { slug: string; brief: string; used_by: string }[] = [
  {
    slug: 'arena_night',
    brief:
      'A large modern venue at night, lit, seen from a distance across an open plaza — the way it looks when you come out of a station and are trying to work out which way to walk. People small in the frame, no faces, no logos.',
    used_by: 'Finding the venue — every concert and match drop',
  },
  {
    slug: 'box_office',
    brief:
      'A ticket window at night, lit from inside, glass with a small gap at the bottom. Nobody at it. The point is that it is open and you have to say something through it.',
    used_by: 'Getting a ticket on the night — concerts, matches, exhibitions',
  },
  {
    slug: 'metro_platform',
    brief:
      'A Lisbon metro platform with a crowd waiting, seen from behind so no faces. Tiled walls. The feeling is that everybody is going to the same place and you could ask any of them.',
    used_by: 'Getting there — every drop that involves a journey',
  },
  {
    /*
      The most valuable picture in the product, and worth saying why.

      Every other card in a drop is about getting somewhere. This one is the invitation —
      a sentence you say to another person about an evening that has not happened yet — and
      it is the reason to learn the other three. It wants to look like the moment just
      before you ask, not like a stock photograph of friendship.
    */
    slug: 'two_at_a_bar',
    brief:
      'Two people at a bar or an outdoor table, mid-conversation, seen from the side or behind — no faces, no posing. Two glasses. Evening light. It should look like the moment just before somebody asks somebody else to come to a thing.',
    used_by: 'The invitation — the last card of every drop',
  },
  {
    slug: 'queue_outside',
    brief:
      'A queue outside a door at night, seen from the back of it. Nobody identifiable. For the moment where the thing has started and you are not in yet.',
    used_by: 'Doors and entrances',
  },
  {
    slug: 'ticket_in_hand',
    brief:
      'A paper or phone ticket held in one hand, close, everything else out of focus. No readable text on the ticket.',
    used_by: 'Having got in — the payoff card',
  },
  {
    slug: 'museum_room',
    brief:
      'A quiet gallery or museum room, one bench, nobody in it. For exhibition and castle drops.',
    used_by: 'Exhibitions, castles, anything with an opening time',
  },
  {
    slug: 'stadium_stand',
    brief:
      'A football stand from inside, seats and floodlights, before it fills. No crowd, no branding.',
    used_by: 'Match drops',
  },
]

/** Every slug in the bank, for the gate that checks a template does not name a hole. */
export function bankImage(slug: string): BankImage | undefined {
  return IMAGE_BANK[slug]
}
