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
  /*
    Lisbon · moving · block 1 — ten, and they have to look like ten of one thing.

    One session of an image model produces ten, which is why a block is ten. The constraint
    is a gift: commissioned separately these would be ten unrelated stock photographs, and
    a feed of those reads as a directory. Commissioned together they read as a set, and a
    set is what makes a block feel like a chapter of a city rather than a list of errands.

    The shared look, held across all ten: INTERIORS AND THRESHOLDS, not landmarks. Waiting
    rooms, counters, doorways, desks. Daylight through a window rather than golden hour.
    Nobody's face — backs, hands, an empty chair — because the person in the picture is
    meant to be the learner. No signage that names a real institution, no logos, no
    readable documents: these are rooms of a kind, not photographs of a specific office,
    and a legible letterhead turns a mood into a factual claim.

    Sand and blue-grey range, matching the Club's existing photographs so a moving card and
    a pharmacy card sit on the same shelf without one of them looking imported.
  */
  {
    slug: 'moving_financas',
    brief:
      'The inside of a plain municipal tax office: a row of numbered counters, a waiting area with moulded chairs, a screen showing a queue number high on the wall. Two or three people waiting, seen from behind. Daylight from a tall window on the left. No readable signage, no logos.',
    used_by: 'Getting your NIF',
  },
  {
    slug: 'moving_bank_desk',
    brief:
      'A bank desk from the customer side: a monitor turned half away, a keyboard, a pen on a folded form, an empty chair opposite. Nobody in frame. Soft daylight. The feeling is that you are about to sit down for an hour.',
    used_by: 'Opening a bank account',
  },
  {
    slug: 'moving_phone_shop',
    brief:
      'A phone shop counter with handsets on a lit display behind it, seen slightly from the side. A shop assistant\'s hands on a tablet, no face. Bright, ordinary, low-stakes — the easiest room on the list.',
    used_by: 'A phone number that is yours',
  },
  {
    slug: 'moving_viewing',
    brief:
      'An empty Lisbon flat mid-viewing: bare boards, a tall shuttered window half open, one folding chair, dust in the light. A set of keys on the sill. Nobody in frame. It should feel like twenty minutes you have to make count.',
    used_by: 'Seeing a flat',
  },
  {
    slug: 'moving_signing',
    brief:
      'A kitchen table with a stapled contract face down, two coffee cups, a pen resting on the pages, one chair pushed back. Warm interior daylight. The document is closed and unreadable on purpose.',
    used_by: 'Signing the lease',
  },
  {
    slug: 'moving_meter',
    brief:
      'A small utility cupboard opened on a landing: an electricity meter with a dial, wires, a scrap of paper with numbers written by hand, a mobile phone held up to photograph it. Hands only. Dim hallway light.',
    used_by: 'Getting the power on',
  },
  {
    slug: 'moving_health_centre',
    brief:
      'A health-centre waiting corridor: a run of empty chairs against a pale tiled wall, a closed door at the end, a hand sanitiser stand. Clean, quiet, slightly institutional. One coat over a chair back suggests somebody is here.',
    used_by: 'Registering at the health centre',
  },
  {
    slug: 'moving_ticket_machine',
    brief:
      'A queue-ticket machine in a large public service hall, a printed paper tab hanging from its slot, a blurred crowd of people seated beyond it. Shot close on the machine so the hall reads as depth rather than detail.',
    used_by: 'The Loja do Cidadão',
  },
  {
    slug: 'moving_used_car',
    brief:
      'A small second-hand car parked on a Lisbon side street in flat afternoon light, bonnet open, a person standing beside it seen from behind. Ordinary, slightly worn, nothing aspirational. No number plate legible.',
    used_by: 'Buying a car',
  },
  {
    slug: 'moving_school_gate',
    brief:
      'A primary school entrance from the pavement: a painted gate, a low wall, a hopscotch grid faded on the ground, bags hanging on hooks just visible inside. Empty of children. Morning light.',
    used_by: 'Getting a place at school',
  },

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
