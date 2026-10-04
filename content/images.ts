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
  /*
    THE NINE THE RECURRING DROPS ACTUALLY WANT, and the honest note about what they are
    using instead.

    content/recurring.ts authors eight drops for the things the Lisbon year does — Santo
    António, the Christmas lights, the chestnut carts, the 25th of April. Each room points
    at a picture from the existing bank chosen because its ALT TEXT is true of the picture
    that exists, not because it is the right picture: a queue outside a lit doorway standing
    in for a charcoal grill full of sardines is honest about what it shows and is not what
    that room is about.

    So these are the briefs. Until they are generated those rooms are visually generic
    rather than wrong, which is the correct way round — a card with a slightly off
    photograph reads as a card, while a card naming a slug the bank does not have renders
    with no ground at all. Nothing here is referenced by a room yet, which is why
    drop-check's "no pictures that already exist" assertion stays green.
  */
  {
    slug: 'santo-antonio-grill',
    brief:
      'A pavement charcoal grill crowded with sardines, smoke rising thickly, paper plates of bread beside it, a crowd pressing in behind. Night, Alfama, strings of coloured bulbs overhead.',
    used_by: 'recurring: Santo António — sardines, standing up',
  },
  {
    slug: 'santo-antonio-street',
    brief:
      'A narrow Lisbon street at night strung with bunting and paper lanterns, packed with people between the houses, smoke drifting across the lights.',
    used_by: 'recurring: Santo António — finding the party',
  },
  {
    slug: 'natal-rua-augusta',
    brief:
      'A wide pedestrian street at night under arches of white Christmas lights, crowded with people walking towards a lit archway at the end.',
    used_by: 'recurring: the Christmas lights — where the lights are',
  },
  {
    slug: 'castanhas-cart',
    brief:
      'A street cart with a drum of roasting chestnuts, smoke rising, paper cones stacked on the edge, a man in an apron turning them. Winter, dusk, a city corner.',
    used_by: 'recurring: São Martinho, and the Christmas lights',
  },
  {
    slug: 'praia-carcavelos',
    brief:
      'A wide Atlantic beach busy with towels and umbrellas, a railway line and low cliffs behind it, bright hard summer light.',
    used_by: 'recurring: the first hot Saturday — on the beach',
  },
  {
    slug: 'metro-closed-gates',
    brief:
      'Closed metal gates across a metro entrance with a printed notice taped to the glass, several people standing reading it.',
    used_by: 'recurring: when the metro is on strike — the gates are shut',
  },
  {
    slug: 'bus-stop-crowd',
    brief:
      'A crowded Lisbon bus stop, people waiting along the kerb, a yellow bus arriving. Morning, overcast.',
    used_by: 'recurring: when the metro is on strike — getting there anyway',
  },
  {
    slug: 'avenida-cravos',
    brief:
      'A crowd filling a wide tree-lined avenue, red carnations held up above people\u2019s heads, banners further back. Bright spring afternoon.',
    used_by: 'recurring: the 25th of April — the carnations',
  },
  {
    slug: 'fechado-ferias',
    brief:
      'A handwritten sign taped inside a shop door behind a half-pulled metal shutter, a quiet empty street outside in strong August light.',
    used_by: 'recurring: August — closed for the holidays',
  },
  /*
    THE THIRTY ROOMS THE CLUB ACTUALLY STANDS ON, and the count is the finding.

    Audited by walking the member feed at 390x844 and asking cardFace for an image: 113
    cards reachable, 30 of them with none — and all 30 are Situations, which is every room
    in all three blocks. Five standing rooms in content/situations.ts have photographs
    (the pharmacy, the Junta, the tram, the café counter, the bakery queue) and the thirty
    that arrived with lisbon-moving-1, lisbon-staying-1 and lisbon-visiting-1 have none at
    all: `image` is optional on a Situation, and none of the three blocks sets it.

    WHAT THAT LOOKS LIKE, which is the reason this is a brief rather than a note. A room
    with no image is not broken — cardFace returns undefined, the card takes the sand
    ground and dark ink, and it reads perfectly well. It is also three-quarters empty: the
    title and two lines sit at the bottom of a blank screen with nothing above them, while
    every drop beside them in the same feed is a full-bleed photograph. So the best content
    in the product is the part that looks least like it.

    THE MOVING BLOCK ALREADY PROMISED THESE. Its own docstring says "Ten briefs are in
    content/images.ts under WANTED, sharing one look so the block reads as a set" — and
    they are not here. The briefs were written, the gate caught them sitting in both lists
    at once, and the removal took the ten that had NOT been generated along with the ones
    that had. The promise is kept here, for all thirty rather than ten.

    ONE LOOK PER BLOCK, so a block reads as a set rather than as ten separate
    commissions — which is the whole reason situations.ts says a block is ten at a time:
    "ten is what one image session yields, which forces a block to be conceived as a set".

      MOVING    interiors, waiting, counters. Nobody's face, and the counter seen from the
                side a person stands on. These are rooms where you are the ninth person
                that morning and the picture should feel like the wait rather than the
                errand.
      STAYING   the street you walk down anyway — small shops, a stair, a doorway. Closer
                and warmer than the moving set, because the whole difference the staying
                block teaches is that these are places you go back to.
      VISITING  daylight and the city itself — a view, a table, a platform. The one block
                that is allowed to be beautiful, because the rooms in it are the ones
                somebody chose to be in.

    EVERY ONE IS THE MOMENT BEFORE THE SENTENCE, never an illustration of the answer —
    the rule the thirteen Legend frames are already built on. A picture of somebody being
    handed a NIF is a picture of the errand finished; the queue and the numbered counter is
    the thing the learner is standing in when they need the words. Nobody's face is the
    subject anywhere, which is also what keeps these honest about being generated.

    Nothing here is referenced by a room yet. drop-check accepts a room whose image is
    either in the bank or wanted here, and asserts that no slug is in both — so these can
    be generated and then moved across, which is the only order that keeps both lists
    true.
  */
  /* ---------------------------------------------------- moving: the first two months */
  {
    slug: 'room-financas-counter',
    brief:
      'A numbered counter in a tax office seen from the public side: a low partition, a screen turned away, an empty chair pulled back, and the edge of a queue of moulded seats out of focus behind.',
    used_by: 'lisbon_nif — Getting your NIF',
  },
  {
    slug: 'room-bank-chairs',
    brief:
      'Two chairs facing a bank desk from the customer side, a closed folder squared on the desk between them, daylight from a glass frontage behind.',
    used_by: 'lisbon_banco — Opening a bank account',
  },
  {
    slug: 'room-phone-counter',
    brief:
      'A phone shop counter from the customer side, a lit wall of handsets behind it slightly out of focus, a card reader and a coil of cable on the glass.',
    used_by: 'lisbon_telemovel — A phone number that is yours',
  },
  {
    slug: 'room-viewing-empty',
    brief:
      'An empty Lisbon flat mid-viewing: bare boards, shutters half open, a tall window onto tiled roofs, and one folding chair left in the middle of the room.',
    used_by: 'lisbon_visita — Seeing a flat',
  },
  {
    slug: 'room-lease-table',
    brief:
      'A kitchen table with a stapled contract open at the last page, a pen laid across it, two cups pushed to the edge, late afternoon light across the paper.',
    used_by: 'lisbon_contrato — Signing the lease',
  },
  {
    slug: 'room-meter-cupboard',
    brief:
      'An opened meter cupboard on a tiled landing, the dial and the wiring in shadow, a phone held up to it in one hand to photograph the reading.',
    used_by: 'lisbon_luz_agua — Getting the power on',
  },
  {
    slug: 'room-health-centre-wait',
    brief:
      'A health centre waiting corridor: a run of empty chairs against a pale tiled wall, a closed door at the end, hard overhead light.',
    used_by: 'lisbon_centro_saude — Registering at the health centre',
  },
  {
    slug: 'room-ticket-screen',
    brief:
      'A municipal waiting hall from the back of the room: rows of occupied seats seen from behind, a paper ticket held in a hand in the foreground, a number display high on the far wall.',
    used_by: 'lisbon_loja_cidadao — The Loja do Cidadão',
  },
  {
    slug: 'room-used-car',
    brief:
      'A second-hand car parked at an angle on a quiet street, the driver window down, keys and folded paperwork on the passenger seat, flat overcast daylight.',
    used_by: 'lisbon_carro — Buying a car',
  },
  {
    slug: 'room-school-gate',
    brief:
      'A school gate from the pavement outside: green railings, a yard and low buildings beyond, a bag of small coats on a hook just inside. Early morning.',
    used_by: 'lisbon_escola — Getting a place at school',
  },
  /* ------------------------------------------------ staying: the street you live on */
  {
    slug: 'room-stairwell',
    brief:
      'A Lisbon stairwell from a half-landing: a worn stone flight turning upward, a wooden handrail polished pale by hands, light from a window out of frame.',
    used_by: 'lisbon_vizinho — The neighbour on the stairs',
  },
  {
    slug: 'room-regular-cafe',
    brief:
      'The corner of a small neighbourhood café: a cup and saucer already waiting on the zinc, a folded newspaper, a stool with the seat worn through at one spot.',
    used_by: 'lisbon_costume — Becoming a regular',
  },
  {
    slug: 'room-navegante-desk',
    brief:
      'A small service window in a metro station seen from the queue: a glass hatch, a worn steel ledge, a card reader on the counter, tiled passage walls beyond.',
    used_by: 'lisbon_navegante — The Navegante card',
  },
  {
    slug: 'room-lavandaria',
    brief:
      'A row of front-loading machines in a small launderette, one drum turning, a plastic basket on the bench in front, strip light and a wet floor.',
    used_by: 'lisbon_lavandaria — The launderette',
  },
  {
    slug: 'room-barbers-chair',
    brief:
      'An empty barber chair facing a mirror in a small Lisbon shop, scissors and a comb laid on the ledge, the street visible in the reflection.',
    used_by: 'lisbon_cabeleireiro — A haircut',
  },
  {
    slug: 'room-gym-desk',
    brief:
      'The front desk of a small neighbourhood gym: a clipboard and a pen on the counter, a turnstile beyond it, equipment out of focus in the background.',
    used_by: 'lisbon_ginasio — Joining a gym for three months',
  },
  {
    slug: 'room-talho-counter',
    brief:
      'A butcher counter from the customer side: a chilled glass case, a set of scales with the dial facing out, a paper ticket in a hand at the edge of frame.',
    used_by: 'lisbon_talho — The counter, by weight',
  },
  {
    slug: 'room-pickup-point',
    brief:
      'A stack of parcels on a shelf behind a small shop counter, a newsagent’s racks beside them, a handwritten number on the top box turned away.',
    used_by: 'lisbon_encomenda — The parcel you missed',
  },
  {
    slug: 'room-repair-bench',
    brief:
      'A cobbler’s bench in a narrow shop: a shoe clamped mid-repair, tools laid in the order they are used, the door open onto the street behind.',
    used_by: 'lisbon_arranjar — Getting something mended',
  },
  {
    slug: 'room-classroom-evening',
    brief:
      'A small classroom at the end of the day: chairs pulled round a table, a blank whiteboard, a window onto a lit Lisbon street going dark.',
    used_by: 'lisbon_aulas — Signing up for classes',
  },
  /* ------------------------------------------------- visiting: the city you chose */
  {
    slug: 'room-table-for-two',
    brief:
      'A small table laid for two outside a Lisbon restaurant, two glasses and a folded menu, the doorway and the dark interior behind. Early evening.',
    used_by: 'lisbon_mesa — A table for two',
  },
  {
    slug: 'room-the-bill',
    brief:
      'The end of a meal on a Lisbon table: a saucer with a folded paper bill under a coin, an untouched dish of olives and a bread basket pushed to one side.',
    used_by: 'lisbon_conta — The bill, and the couvert',
  },
  {
    slug: 'room-two-queues',
    brief:
      'Two queues of people seen from behind at a monument entrance, a rope divider between them and a stone archway ahead. Bright hard daylight.',
    used_by: 'lisbon_bilhetes — Tickets, and which queue',
  },
  {
    slug: 'room-miradouro',
    brief:
      'A Lisbon miradouro at golden hour: a tiled parapet in the foreground, the river and the roofs below, a few people at the rail seen from behind.',
    used_by: 'lisbon_foto — Asking somebody to take the photo',
  },
  {
    slug: 'room-taxi-rank',
    brief:
      'The back seat of a waiting taxi from the open kerbside door, the meter unlit on the dashboard, a Lisbon street beyond the windscreen at dusk.',
    used_by: 'lisbon_taxi — Getting in a taxi',
  },
  {
    slug: 'room-street-corner',
    brief:
      'A junction of three narrow Lisbon streets climbing away in different directions, calçada underfoot, no signage legible. Flat midday light.',
    used_by: 'lisbon_perdido — Asking the way, and surviving the answer',
  },
  {
    slug: 'room-market-scales',
    brief:
      'A market stall from the customer side: crates of fruit and greens banked up, a hanging set of scales with an empty pan, a paper bag open on the edge.',
    used_by: 'lisbon_mercado — Buying by weight',
  },
  {
    slug: 'room-fado-house',
    brief:
      'The inside of a small casa de fado before it starts: a stool and a Portuguese guitar leaning against a chair, a bare wall, one low lamp, empty tables.',
    used_by: 'lisbon_fado — A fado house',
  },
  {
    slug: 'room-rossio-platform',
    brief:
      'A train platform under an iron and glass roof, a validating machine on a post in the foreground, a waiting train further down. Morning light through the glass.',
    used_by: 'lisbon_comboio — The train to Sintra',
  },
  {
    slug: 'room-kitchen-pass',
    brief:
      'A restaurant kitchen pass seen from the dining side: a plate waiting under a heat lamp, a docket clipped above it turned away, steam and movement out of focus behind.',
    used_by: 'lisbon_sem — What you cannot eat',
  },
  /*
    THE TWO THE SHARING CARDS WANT, and what they are standing on meanwhile.

    Both explainers in the Club that involve another person are using a photograph of
    nobody, because the bank holds no picture with two people in it. That is not a crisis —
    each is using an image whose alt text is TRUE of the image that exists, which is the
    rule — but it is the gap worth naming rather than quietly living with.

    bring_somebody described the picture it wished it had: its alt text claimed "two people
    at a café counter, mid-conversation" over an empty counter with one cup. Corrected, and
    recorded here instead, because a brief is where a wish for a photograph belongs.

    NOBODY'S FACE IS THE SUBJECT, which is this bank's standing rule — see the note on the
    Legend questions above. Two people from behind, or hands, or the space between them.
    The pictures have to work for a learner whose friend looks nothing like whoever is in
    frame.
  */
  {
    slug: 'showing_pair',
    brief:
      'Two people at a Lisbon café counter from behind, one leaning in to say something to the other, both phones face-down on the zinc. Shot from the doorway, late morning light, neither face visible.',
    used_by: 'explainer bring_somebody — Send somebody what you can say',
  },
  {
    slug: 'bring_a_friend',
    brief:
      'Two people arriving somewhere together in Lisbon — walking up a calçada towards a lit doorway, seen from behind, one half a step ahead and turning back to the other. Early evening, the city doing something in the background. No faces.',
    used_by: 'explainer bring_a_friend — Everybody you know here speaks English',
  },
]

/** Every slug in the bank, for the gate that checks a template does not name a hole. */
export function bankImage(slug: string): BankImage | undefined {
  return IMAGE_BANK[slug]
}
