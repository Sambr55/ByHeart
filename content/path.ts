/**
 * THE LISBON PATHS — one for each reason somebody gives at set-up, in the order it happens.
 *
 * Sam, 2026-11-02: "check the 'why' someone is moving here function. It seems it may have
 * got lost … paths would be very different in Moving here versus a trip." It had been lost:
 * the city-first rewrite gave everybody the visitor's five units, so a person who answered
 * "I'm moving there" was walked from the airport to the beach train while the NIF, the bank,
 * the lease and the health centre sat unreached in the feed. Set-up still asked why and
 * still stored it (learner.purpose); nothing on the path read it.
 *
 * So there are three paths, chosen by `purpose`, which set-up writes from the reason and
 * Settings lets you change:
 *
 *   visiting — "I've got a trip coming" (and "no reason, I just like it", which has no
 *              purpose and gets the trip: the most general and the cheapest to finish)
 *   staying  — "a season", "someone in my life speaks it", "it's for work": the same faces
 *              twice, where small talk starts doing real work
 *   moving   — "I'm moving there": the paperwork first, because nothing else works until
 *              you have a NIF, then a home, then a life
 *
 * They share rooms freely — a coffee is a coffee — but the ORDER is the argument, and the
 * order is different for each.
 *
 * EXCEPT THE FIRST ROOM, which is the same on all three (2026-11-02): lisbon_save, "When
 * you don't understand". Sam: "at the very least you can say 'I am sorry I don't
 * understand, I am English' in Portuguese." A trip, a season and a move all start with the
 * same risk — the reply comes back and you reach for English, or for saying it louder — so
 * every path opens with the four lines that keep you in the conversation. It sits inside
 * unit 1 rather than as a unit of its own: one room is not a unit, and the airport, the
 * check-in and the NIF are still where each path's argument begins. See
 * content/blocks/lisbon-save.ts.
 *
 * (The visitor's path, below, was the first and is described as it was written.)
 *
 * Owner: "make it more app like, like Duolingo or Simply Guitar." What those two have that
 * the Club feed does not is a SHAPE: one line through everything, with the next thing on
 * it obvious. So this is that line, for somebody here for a few days — land, eat, move,
 * look, and the afternoon it goes wrong.
 *
 * Built only from rooms (Situations). A unit is an ordered list of room ids; nothing here
 * teaches anything, it only says what order the existing rooms come in. Between units sits
 * a practice session — a cheat shape said cold through /revise — which is existing
 * practice, not a new mechanic.
 *
 * SOME IDS DO NOT EXIST YET, deliberately. lisbon_aeroporto, lisbon_checkin,
 * lisbon_cartao_sim, lisbon_supermercado, lisbon_praia, lisbon_casa_de_banho,
 * lisbon_emergencia and lisbon_roubo arrive with a block being written in parallel. They
 * are listed here so the path is already right the day they land, and `pathUnits()`
 * filters to what actually resolves — so before that merge, unit 1 is simply absent and
 * the path starts at coffee.
 *
 * NOT A GATE. Order is a suggestion: the next room glows, but any open room can be played
 * at any time. The only lock on the path is the paid one — see components/path/locks.ts.
 */
import { isCurrent, situationById, type Purpose, type Situation } from '@/content/situations'

export interface PathMilestone {
  /** A cheat id from content/cheats.ts, played through /revise?kind=cheat. */
  cheat: string
  title: string
  blurb: string
}

export interface PathUnit {
  id: string
  /** Shown as UNIT n. 1-based, and fixed: it does not renumber when a unit is filtered. */
  n: number
  title: string
  /** The same thing in Portuguese, set in the Portuguese type. */
  pt: string
  /** What you will be able to do. Three, always — the card has room for three. */
  learn: [string, string, string]
  rooms: string[]
  /** The practice session that closes the unit. */
  milestone: PathMilestone
}

const VISITING_UNITS: PathUnit[] = [
  {
    id: 'arrive',
    n: 1,
    title: 'Arrive',
    pt: 'Chegar',
    learn: [
      'Get through the airport and into town',
      'Check in without switching to English',
      'Get a SIM and a signal',
    ],
    rooms: ['lisbon_save', 'lisbon_aeroporto', 'lisbon_checkin', 'lisbon_cartao_sim'],
    milestone: {
      cheat: 'posso_hack',
      title: 'Posso …?',
      blurb: 'Turn any verb into “can I?” — said cold.',
    },
  },
  {
    id: 'food',
    n: 2,
    title: 'Coffee & food',
    pt: 'Comer e beber',
    learn: [
      'Order at the counter like everybody else',
      'Get a table, and get the bill',
      'Shop for the picnic',
    ],
    rooms: ['lisbon_cafe', 'lisbon_padaria', 'lisbon_mesa', 'lisbon_tasca', 'lisbon_conta', 'lisbon_multibanco', 'lisbon_supermercado'],
    milestone: {
      cheat: 'quero_hack',
      title: 'Quero …',
      blurb: 'One opening, most of a holiday — said cold.',
    },
  },
  {
    id: 'move',
    n: 3,
    title: 'Get about',
    pt: 'Andar por aí',
    learn: [
      'Get on the 28 and off at the right stop',
      'Ask the way, and follow the answer',
      'Take the train out to Sintra or the beach',
    ],
    rooms: ['lisbon_electrico', 'lisbon_taxi', 'lisbon_perdido', 'lisbon_comboio', 'lisbon_praia'],
    milestone: {
      cheat: 'pode_hack',
      title: 'Pode …?',
      blurb: 'The polite request, for anybody you stop — said cold.',
    },
  },
  {
    id: 'see',
    n: 4,
    title: 'See the city',
    pt: 'Ver a cidade',
    learn: [
      'Buy tickets and pick the right queue',
      'Ask a stranger for the photo',
      'Buy at the market, and sit through fado',
    ],
    rooms: ['lisbon_bilhetes', 'lisbon_foto', 'lisbon_mercado', 'lisbon_fado'],
    milestone: {
      cheat: 'isto_hack',
      title: 'Isto',
      blurb: 'Do not know the word? Point at it — said cold.',
    },
  },
  {
    id: 'wrong',
    n: 5,
    title: 'When it goes wrong',
    pt: 'Quando corre mal',
    learn: [
      'Get help at the pharmacy',
      'Say what you cannot eat',
      'Find a toilet, call for help, report a theft',
    ],
    rooms: [
      'lisbon_farmacia',
      'lisbon_sem',
      'lisbon_casa_de_banho',
      'lisbon_emergencia',
      'lisbon_roubo',
    ],
    milestone: {
      cheat: 'rescue_hack',
      title: 'Como se diz …?',
      blurb: 'The sentence that turns any gap into a lesson — said cold.',
    },
  },
]

/**
 * A SEASON — and work, and the partner's family. Here long enough to see the same faces
 * twice, not long enough (or not yet) for the paperwork. Settle in, find your rounds, then
 * the small talk that turns a shop into "the usual", then going out, and the bad day.
 */
const STAYING_UNITS: PathUnit[] = [
  {
    id: 'settle',
    n: 1,
    title: 'Settling in',
    pt: 'Instalar-me',
    learn: ['Check in and get a local number', 'Get a travel pass for the weeks ahead', 'Order the coffee you will order every day'],
    rooms: ['lisbon_save', 'lisbon_checkin', 'lisbon_telemovel', 'lisbon_navegante', 'lisbon_cafe', 'lisbon_costume'],
    milestone: { cheat: 'posso_hack', title: 'Posso …?', blurb: 'Can I …? — the sentence that opens most of a new week.' },
  },
  {
    id: 'rounds',
    n: 2,
    title: 'The daily round',
    pt: 'A rotina',
    learn: ['Bread, market and the butcher’s counter', 'The supermarket till and the cash machine', 'The launderette and the parcel you missed'],
    rooms: ['lisbon_padaria', 'lisbon_mercado', 'lisbon_talho', 'lisbon_supermercado', 'lisbon_multibanco', 'lisbon_lavandaria', 'lisbon_encomenda'],
    milestone: { cheat: 'quero_hack', title: 'Quero …', blurb: 'I want … — and how to make it polite at a counter.' },
  },
  {
    id: 'faces',
    n: 3,
    title: 'The same faces',
    pt: 'As mesmas caras',
    learn: ['Say more than boa tarde to the neighbour', 'Book a haircut, join a gym, sign up for classes', 'Get something mended'],
    rooms: ['lisbon_vizinho', 'lisbon_cabeleireiro', 'lisbon_ginasio', 'lisbon_aulas', 'lisbon_arranjar'],
    milestone: { cheat: 'estar_a', title: 'Estou a …', blurb: 'What you are doing right now — which is most of small talk.' },
  },
  {
    id: 'out',
    n: 4,
    title: 'Out and about',
    pt: 'Sair',
    learn: ['A table, a tasca, and the bill', 'Trams and trains, out to the beach', 'A night of fado'],
    rooms: ['lisbon_mesa', 'lisbon_tasca', 'lisbon_conta', 'lisbon_electrico', 'lisbon_comboio', 'lisbon_praia', 'lisbon_fado'],
    milestone: { cheat: 'pode_hack', title: 'Pode …?', blurb: 'Could you …? — asking a stranger for anything.' },
  },
  {
    id: 'wrong',
    n: 5,
    title: 'When it goes wrong',
    pt: 'Quando corre mal',
    learn: ['The pharmacy and the health centre', 'Say what you cannot eat', 'Call for help, report a theft'],
    rooms: ['lisbon_farmacia', 'lisbon_centro_saude', 'lisbon_sem', 'lisbon_emergencia', 'lisbon_roubo'],
    milestone: { cheat: 'rescue_hack', title: 'Como se diz …?', blurb: 'The sentence that turns any gap into a lesson — said cold.' },
  },
]

/**
 * MOVING HERE. The paperwork first, because it is the order the country makes you do it
 * in: without a NIF there is no bank account, without both there is no lease, and the
 * Loja do Cidadão is where a morning goes. Then a home, then the everyday, then getting
 * about, then the health centre and the school, then the part where you become a regular.
 */
const MOVING_UNITS: PathUnit[] = [
  {
    id: 'papers',
    n: 1,
    title: 'The paperwork',
    pt: 'Os papéis',
    learn: ['Get your NIF, the number everything needs', 'Open a bank account and get a Portuguese number', 'Survive the Loja do Cidadão and the Junta'],
    rooms: ['lisbon_save', 'lisbon_nif', 'lisbon_telemovel', 'lisbon_banco', 'lisbon_loja_cidadao', 'lisbon_junta'],
    milestone: { cheat: 'tenho_de', title: 'Tenho de …', blurb: 'I have to … — the shape every counter conversation runs on.' },
  },
  {
    id: 'home',
    n: 2,
    title: 'A place to live',
    pt: 'Uma casa',
    learn: ['View a flat and ask the right questions', 'Read the lease before you sign it', 'Get the power on and meet the neighbour'],
    rooms: ['lisbon_visita', 'lisbon_contrato', 'lisbon_luz_agua', 'lisbon_vizinho', 'lisbon_encomenda'],
    milestone: { cheat: 'question_hack', title: 'The six questions', blurb: 'Who, what, where, when, how much, how — enough for any viewing.' },
  },
  {
    id: 'daily',
    n: 3,
    title: 'Everyday life',
    pt: 'O dia a dia',
    learn: ['The café, the bakery and becoming a regular', 'The butcher, the supermarket, the cash machine', 'The launderette'],
    rooms: ['lisbon_cafe', 'lisbon_padaria', 'lisbon_costume', 'lisbon_talho', 'lisbon_supermercado', 'lisbon_multibanco', 'lisbon_lavandaria'],
    milestone: { cheat: 'quero_hack', title: 'Quero …', blurb: 'I want … — and how to make it polite at a counter.' },
  },
  {
    id: 'about',
    n: 4,
    title: 'Getting about',
    pt: 'Andar por aí',
    learn: ['Get a Navegante pass', 'Trams, trains and taxis', 'Buy a car without being had'],
    rooms: ['lisbon_navegante', 'lisbon_electrico', 'lisbon_perdido', 'lisbon_comboio', 'lisbon_taxi', 'lisbon_carro'],
    milestone: { cheat: 'pode_hack', title: 'Pode …?', blurb: 'Could you …? — asking a stranger for anything.' },
  },
  {
    id: 'care',
    n: 5,
    title: 'Health & family',
    pt: 'Saúde e família',
    learn: ['Register at the health centre', 'Get a place at school', 'The pharmacy, allergies, and an emergency'],
    rooms: ['lisbon_centro_saude', 'lisbon_farmacia', 'lisbon_escola', 'lisbon_sem', 'lisbon_emergencia'],
    milestone: { cheat: 'rescue_hack', title: 'Como se diz …?', blurb: 'The sentence that turns any gap into a lesson — said cold.' },
  },
  {
    id: 'local',
    n: 6,
    title: 'Becoming local',
    pt: 'Ser daqui',
    learn: ['Portuguese classes, a gym, a haircut', 'Get something mended', 'A table, a tasca, a night of fado'],
    rooms: ['lisbon_aulas', 'lisbon_ginasio', 'lisbon_cabeleireiro', 'lisbon_arranjar', 'lisbon_mesa', 'lisbon_tasca', 'lisbon_fado'],
    milestone: { cheat: 'repair_hack', title: 'Keep it going', blurb: 'The lines that keep a conversation in Portuguese when it wobbles.' },
  },
]

/**
 * BASICS FIRST, AND ONE FUN TILE IN EVERY LEVEL (Sam, 2026-11-03: "basics first, 1–20,
 * Hello, Goodbye and thank you, then arrive etc. … build your legend near the top … it
 * should all be one flow … every section should have a fun section thrown in").
 *
 * Basics is the same first level on all three paths: hello and thank you, counting, the
 * save (moved here from each path's first unit, so it is still on every path and still
 * near the very start) and "Who you are", the door to the Legend — then a hack that hands
 * over hundreds of words for free. Every later level gains one fun tile at its end:
 * content/blocks/lisbon-fun.ts. Unit numbers move up by one, so Arrive is Level 2.
 */
export const BASICS_UNIT: PathUnit = {
  id: 'basics',
  n: 1,
  title: 'Basics',
  pt: 'O básico',
  learn: ['Say hello, thank you and goodbye', 'Count to twenty', 'Say who you are'],
  rooms: ['lisbon_ola', 'lisbon_numeros', 'lisbon_save', 'lisbon_legend', 'fun_cao_hack'],
  milestone: {
    cheat: 'nao_verb',
    title: 'Não + verb',
    blurb: 'Any sentence you can say, you can now un-say — said cold.',
  },
}

function withBasics(units: PathUnit[], fun: string[]): PathUnit[] {
  return [
    BASICS_UNIT,
    ...units.map((u, i) => ({
      ...u,
      n: u.n + 1,
      rooms: [...u.rooms.filter((r) => r !== 'lisbon_save'), ...(fun[i] ? [fun[i]] : [])],
    })),
  ]
}

/** Every path, by the purpose that chooses it. */
export const PATHS: Record<Purpose, PathUnit[]> = {
  visiting: withBasics(VISITING_UNITS, ['fun_bluff_time', 'fun_fl_m_posso_oferecer', 'fun_hold_your_horses', 'fun_dd_wolf', 'fun_bluff_react']),
  staying: withBasics(STAYING_UNITS, ['fun_bluff_time', 'fun_piece_of_cake', 'fun_fl_m_posso_oferecer', 'fun_the_penny_dropped', 'fun_bluff_react']),
  moving: withBasics(MOVING_UNITS, ['fun_bluff_time', 'fun_bobs_your_uncle', 'fun_dd_wolf', 'fun_hold_your_horses', 'fun_bluff_react', 'fun_fl_m_posso_oferecer']),
}


/** What each path is called where the learner can see it. */
export const PATH_NAMES: Record<Purpose, { title: string; short: string; pt: string; done: string }> = {
  visiting: { title: 'Your trip', short: 'Trip', pt: 'A viagem', done: 'The whole trip, done' },
  staying: { title: 'Your season', short: 'Season', pt: 'A temporada', done: 'The whole season, done' },
  moving: { title: 'Moving here', short: 'Moving', pt: 'Mudar-me', done: 'The whole move, done' },
}

/**
 * No purpose — "no reason, I just like it", or somebody who skipped set-up — gets the
 * trip: the most general path and the quickest to feel finished.
 */
export function pathPurpose(purpose: Purpose | null | undefined): Purpose {
  return purpose ?? 'visiting'
}

/** The visitor's path, kept under its old name for the scripts that predate the others. */
export const PATH_UNITS: PathUnit[] = VISITING_UNITS

export interface ResolvedUnit extends Omit<PathUnit, 'rooms'> {
  rooms: Situation[]
}

/**
 * The path as it can actually be played today: rooms that resolve and are current, and
 * units with at least one of them.
 *
 * `find` is injectable so the check script can prove the filtering without the content.
 */
export function pathUnits(
  find: (id: string) => Situation | undefined = situationById,
  now = new Date(),
  purpose: Purpose | null = null,
): ResolvedUnit[] {
  return PATHS[pathPurpose(purpose)].map((u) => ({
    ...u,
    rooms: u.rooms
      .map((id) => find(id))
      .filter((s): s is Situation => Boolean(s && isCurrent(s, now))),
  })).filter((u) => u.rooms.length > 0)
}

/** Every room id on the playable path, in order. */
export function pathRoomIds(units: ResolvedUnit[] = pathUnits()): string[] {
  return units.flatMap((u) => u.rooms.map((r) => r.id))
}
