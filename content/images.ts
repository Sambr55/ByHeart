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
  /*
    The intro sequence, generated 4 September and converted to JPEG to match the bank.

    Alt text says what is in the frame, not how it feels — somebody who cannot see it should
    be able to tell you what is there.
  */
  intro_arrival: {
    src: '/lisbon/intro-arrival.jpg',
    alt: 'A narrow Lisbon street at sunrise, wet calçada catching the light, tiled and painted façades on both sides, nobody in it.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  intro_away_card: {
    src: '/lisbon/intro-away.jpg',
    alt: 'A café table with an empty cup and a folded newspaper, a coat left over the back of a bentwood chair, the street beyond.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  intro_in_card: {
    src: '/lisbon/intro-in.jpg',
    alt: 'A heavy green door standing open in an azulejo-tiled wall, a warm lamplit hallway visible inside.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  intro_vibes_card: {
    src: '/lisbon/intro-vibes.jpg',
    alt: 'A dark living room lit by a television, the screen out of focus, a glass and a remote on the side table.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  intro_drops_card: {
    src: '/lisbon/intro-drops.jpg',
    alt: 'A crowd walking downhill through a Lisbon street at night, seen from behind, a lit bridge in the distance.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  intro_revision_card: {
    src: '/lisbon/intro-revision.jpg',
    alt: 'A zinc café counter in morning light with one cup of coffee and a folded newspaper, the street through the open front.',
    rights_status: 'generated',
    taken_at: '2026-09-04',
  },
  tram_distant: {
    src: '/lisbon/tram-distant.jpg',
    alt: 'A yellow Lisbon tram seen far down a narrow street, framed by buildings on both sides.',
    rights_status: 'generated',
  },
  /*
    THE MOVING BLOCK AND THE DROP TEMPLATES, generated 2026-09-08 and looked at one by one.

    The alt text is written from the picture rather than the brief, which is why this was
    never auto-filled: a brief describes what was asked for, and what came back is not
    always that. Two of these differ from what was ordered and the alt says what is there —
    the Finanças has two clerks visible behind the counter where the brief asked for nobody
    in frame, and the arena is Gare do Oriente rather than the venue itself, which is the
    better picture because it is the station you actually arrive at.

    Written as JPEG at 82. They arrived as 2.8MB PNGs — forty-seven megabytes for eighteen
    full-bleed phone cards, most of them read on a café's wifi. The bank's existing
    photographs are 290–820KB, so these match the shelf they sit on: two megabytes for the
    set, and no visible difference at the size a phone renders them.
  */
  moving_financas: {
    src: '/bank/moving-financas.jpg',
    alt: 'A municipal tax office: four numbered counters, two clerks behind them, and five people waiting in moulded chairs seen from behind. A queue number on a screen high on the wall.',
    rights_status: 'generated',
  },
  moving_bank_desk: {
    src: '/bank/moving-bank-desk.jpg',
    alt: 'A bank desk from the customer side, a monitor turned half away and an empty chair opposite.',
    rights_status: 'generated',
  },
  moving_phone_shop: {
    src: '/bank/moving-phone-shop.jpg',
    alt: 'A phone shop counter with handsets on a lit display behind it.',
    rights_status: 'generated',
  },
  moving_viewing: {
    src: '/bank/moving-viewing.jpg',
    alt: 'An empty Lisbon flat: bare boards, a folding chair, and a balcony door open onto tiled roofs.',
    rights_status: 'generated',
  },
  moving_signing: {
    src: '/bank/moving-signing.jpg',
    alt: 'A kitchen table with a stapled contract face down, two cups and a pen resting on the pages.',
    rights_status: 'generated',
  },
  moving_meter: {
    src: '/bank/moving-meter.jpg',
    alt: 'An electricity meter in an opened cupboard on a landing, a phone held up to photograph the dial.',
    rights_status: 'generated',
  },
  moving_health_centre: {
    src: '/bank/moving-health-centre.jpg',
    alt: 'A health-centre corridor: empty chairs against a pale tiled wall and a closed door at the end.',
    rights_status: 'generated',
  },
  moving_ticket_machine: {
    src: '/bank/moving-ticket-machine.jpg',
    alt: 'A ticket machine in a municipal waiting hall, a hand reaching for the paper slip.',
    rights_status: 'generated',
  },
  moving_used_car: {
    src: '/bank/moving-used-car.jpg',
    alt: 'A second-hand car on a forecourt, seen at an angle in flat daylight.',
    rights_status: 'generated',
  },
  moving_school_gate: {
    src: '/bank/moving-school-gate.jpg',
    alt: 'A school gate from the pavement, railings and a yard beyond in the early morning.',
    rights_status: 'generated',
  },
  arena_night: {
    src: '/bank/arena-night.jpg',
    alt: 'Gare do Oriente lit at night, its arched canopy above a plaza with people crossing towards the entrance.',
    rights_status: 'generated',
  },
  box_office: {
    src: '/bank/box-office.jpg',
    alt: 'A ticket window at night, a lit booth behind the glass and a metal grille at the counter.',
    rights_status: 'generated',
  },
  metro_platform: {
    src: '/bank/metro-platform.jpg',
    alt: 'A crowd walking away down a tiled metro passage towards the tunnel, all seen from behind.',
    rights_status: 'generated',
  },
  two_at_a_bar: {
    src: '/bank/two-at-a-bar.jpg',
    alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
    rights_status: 'generated',
  },
  queue_outside: {
    src: '/bank/queue-outside.jpg',
    alt: 'People queuing along a wall outside an entrance, seen from behind in the evening.',
    rights_status: 'generated',
  },
  ticket_in_hand: {
    src: '/bank/ticket-in-hand.jpg',
    alt: 'A ticket held in one hand, the rest of the frame dark and out of focus.',
    rights_status: 'generated',
  },
  museum_room: {
    src: '/bank/museum-room.jpg',
    alt: 'A quiet museum room, a bench in the middle and daylight from a high window.',
    rights_status: 'generated',
  },
  stadium_stand: {
    src: '/bank/stadium-stand.jpg',
    alt: 'Empty seats in a stadium stand, rows running away in the late afternoon.',
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
    EMPTY, AND THAT IS THE POINT OF IT.

    This list means "still needed", not "was commissioned" — drop-check asserts that no slug
    appears both here and in the bank, because a picture on both lists means the brief and
    the bank disagree about whether it exists, and the next person to read either one is
    misled. I left the eighteen here as a record after generating them and the gate caught
    it immediately, which is the check doing exactly its job.

    The record lives in the bank instead: every entry generated on 2026-09-08 carries
    `rights_status: 'generated'` and alt text written from the picture, and the briefs that
    produced them are in git history.

    Add to this list when a template asks for a picture the bank does not have. drop-check
    will accept a room whose image is EITHER in the bank or wanted here, so a drop can be
    written before its photographs exist — and will fail if it is in neither.
  */
]

/** Every slug in the bank, for the gate that checks a template does not name a hole. */
export function bankImage(slug: string): BankImage | undefined {
  return IMAGE_BANK[slug]
}
