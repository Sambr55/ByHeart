/**
 * THE LISBON PATH — a visitor's trip, in the order it happens.
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
import { isCurrent, situationById, type Situation } from '@/content/situations'

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

export const PATH_UNITS: PathUnit[] = [
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
    rooms: ['lisbon_aeroporto', 'lisbon_checkin', 'lisbon_cartao_sim'],
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
    rooms: ['lisbon_cafe', 'lisbon_padaria', 'lisbon_mesa', 'lisbon_conta', 'lisbon_supermercado'],
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
): ResolvedUnit[] {
  return PATH_UNITS.map((u) => ({
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
