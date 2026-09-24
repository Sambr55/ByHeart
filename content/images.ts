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
  /*
    THE QUEUE, for the CHEATS card.

    Already in the product — situations.ts and feed.ts both point a card at it — and never
    registered in the bank, which is what an intro card reads from. A pastelaria queue is
    the right ground for "the words nobody teaches you first": it is the most ordinary
    transaction in Lisbon and the one where not having the plain words is most obvious.
  */
  intro_cheats_card: {
    src: '/lisbon/bakery-queue.jpg',
    alt: 'A queue at a pastelaria counter in the morning, seen from behind, trays of pastries under glass.',
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
    IN THE REPO AND NOT IN THE BANK, which is a picture that may as well not exist.

    pharmacy.jpg has been in public/lisbon since the first set and was never given an entry
    here, so nothing could reference it: the bank is a declared list precisely so a slug
    cannot point at a hole, and the same rule means a file with no slug is unreachable.
    Registered now because the ASK card needed a ground and the sequence's rule is to spend
    what is already in the repo before asking for new art.

    It earns that card rather than merely filling it. A pharmacy is the place somebody has
    a sentence they were never taught and needs it immediately — which is the whole of what
    ASK is for, and the Feed's own comment already names the pharmacy as the destination of
    that argument.

    Alt from the picture, as the block below insists: what is in the frame, not the mood.
  */
  pharmacy: {
    src: '/lisbon/pharmacy.jpg',
    alt: 'The inside of an old Lisbon pharmacy: floor-to-ceiling dark wood shelves stacked with medicine boxes, a marble-topped counter, and a pharmacist in a white coat with her back to the room.',
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
  /*
    THE THIRTEEN LEGEND QUESTIONS, generated 2026-09-24 for the collection grid.

    Sam, with a screenshot of Basics as seven identical blue rectangles: "let's add the
    images." Each is the MOMENT the question gets asked rather than an illustration of the
    answer — a portrait of somebody married would be a stranger's face, and the picture
    has to work for a learner whose answer is the opposite of whatever is in frame.

    Converted to jpeg at 1024 wide on the way in: the model returns PNGs at ~2.6MB and the
    rest of this bank averages 300KB, so thirteen of them would have been 42MB of the
    product's weight for a grid of thumbnails. Same conversion the idiom images needed,
    for the same reason.
  */
  /*
    Bob's Your Uncle — the idioms vibe, which had been wanted since the crate was written
    and pointed at the basics' photograph in the meantime. Generated in the same batch.
  */
  'vibe-bobs-your-uncle': {
    src: '/bank/vibe-bobs-your-uncle.jpg',
    alt: 'A chipped white enamel mug of tea on a blue and white azulejo windowsill, a pastel facade out of focus beyond.',
    rights_status: 'generated',
  },
  'frame-name': {
    src: '/bank/frame-name.jpg',
    alt: 'Two hands meeting in a handshake at a café table in Lisbon, faces out of frame.',
    rights_status: 'generated',
  },
  'frame-origin': {
    src: '/bank/frame-origin.jpg',
    alt: 'A departures board in an airport hall, city names blurred beyond reading.',
    rights_status: 'generated',
  },
  'frame-age': {
    src: '/bank/frame-age.jpg',
    alt: 'A row of lit candles on a tiled windowsill, a Lisbon street out of focus beyond.',
    rights_status: 'generated',
  },
  'frame-married': {
    src: '/bank/frame-married.jpg',
    alt: 'Two coffee cups on a café table in Lisbon, a hand resting beside each.',
    rights_status: 'generated',
  },
  'frame-into': {
    src: '/bank/frame-into.jpg',
    alt: 'A kiosk in a Lisbon square from behind, its racks turned away from the camera.',
    rights_status: 'generated',
  },
  'frame-children': {
    src: '/bank/frame-children.jpg',
    alt: 'A small pair of shoes left by a doorway on a tiled Lisbon landing.',
    rights_status: 'generated',
  },
  'frame-who-with': {
    src: '/bank/frame-who-with.jpg',
    alt: 'Two chairs at a small table outside a Lisbon café, one pushed back, both empty.',
    rights_status: 'generated',
  },
  'frame-work': {
    src: '/bank/frame-work.jpg',
    alt: 'A worn workbench in a Lisbon workshop, tools laid down mid-job, the door open onto the street.',
    rights_status: 'generated',
  },
  'frame-why-here': {
    src: '/bank/frame-why-here.jpg',
    alt: 'A Lisbon street climbing away from the Tagus at golden hour, the river bright at the foot of it.',
    rights_status: 'generated',
  },
  'frame-staying-for': {
    src: '/bank/frame-staying-for.jpg',
    alt: 'A packed suitcase open on a bed in a rented Lisbon room, shutters half closed.',
    rights_status: 'generated',
  },
  'frame-first-time': {
    src: '/bank/frame-first-time.jpg',
    alt: 'A tram stop sign in Lisbon seen from below against a pale sky.',
    rights_status: 'generated',
  },
  'frame-moved-when': {
    src: '/bank/frame-moved-when.jpg',
    alt: 'A row of brass letterboxes in a Lisbon hallway, one card newer than the rest.',
    rights_status: 'generated',
  },
  'frame-portuguese': {
    src: '/bank/frame-portuguese.jpg',
    alt: 'A chalk menu board outside a Lisbon tasca, half rubbed out, nobody reading it.',
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
  /*
    THE THIRTEEN LEGEND QUESTIONS, for the grid.

    Sam, with a screenshot of a level made entirely of blue panels: "let's add the
    images." A Legend frame had no photograph and I gave it the accent slab, reasoning
    that the learner's own sentence should look like the product's answer to that
    everywhere else. That is fine for one card among nine and wrong for seven in a row —
    the whole of Basics rendered as identical blue rectangles, which is a wall rather than
    a shelf.

    EACH ONE IS THE MOMENT THE QUESTION GETS ASKED, not an illustration of the answer. A
    portrait of somebody married would be a stock photograph of a stranger; the doorway
    where you are asked is a place in Lisbon, which is what every other picture in this
    bank is. Nobody's face is the subject and no answer is depicted — the pictures must
    work for a learner whose answer is the opposite of whatever is in frame.
  */
]

/** Every slug in the bank, for the gate that checks a template does not name a hole. */
export function bankImage(slug: string): BankImage | undefined {
  return IMAGE_BANK[slug]
}
