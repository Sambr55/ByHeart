/**
 * THE PANEL'S PAINTINGS AND ITS WORDS — the one place the home screen's progress picture
 * comes from (Sam approved, 2026-11-02).
 *
 * Sam, on the Wall that came before it: "We are supposed to be building a wall of beauty
 * and tiles and progress. At the moment it looks like a badly laid out PowerPoint." He was
 * shown the Panel on the marketing site the same day ("you surpassed yourself there") and
 * chose it for the app.
 *
 * Lisbon's azulejos are not grids of separate tiles, they are PANELS: one blue-and-white
 * painting across dozens of squares. So each purpose path is ONE painting, and each room is
 * one square of it (components/path/Panel.tsx). Which painting is a fact about the city and
 * the reason you came, so it lives here, keyed CHAPTER first and PURPOSE second:
 *
 *   PANEL_ART[chapter][purpose] = { src, alt, title }
 *
 *   src     a square painting under public/panel/ — square, because the Panel crops it to
 *           however many courses the path needs (5 or 6 rows of 6) without stretching.
 *   alt     what the painting shows, said plainly. The same words as the website's
 *           (dub-site-v2/content/markets.ts panelArt), so the promise and the app match.
 *   title   the line under "Your panel:" — what finishing it means.
 *
 * ANOTHER CITY BRINGS ITS OWN TILE TRADITION, NOT A RECOLOURED LISBON. When the app teaches
 * a city that is not Portuguese, it adds a key here with paintings in that city's own
 * tiling, and nothing in the component changes:
 *
 *   Madrid    Talavera — the yellow-and-blue (and green) Castilian tiles of the street
 *             name plaques and the old tabernas.
 *   Paris     the Métro's white bevelled tiles, with the station name set into them.
 *   Berlin    the U-Bahn's tiled stations — each line its own colour, each station a hue.
 *   London    Victorian encaustic floors and the Tube's own tiling (the Leslie Green
 *             ox-blood fronts, the platform friezes).
 *
 * Cascais and Sintra have their own (2026-11-05). Porto and the Algarve are Portuguese and
 * azulejo too, so until somebody paints theirs they borrow Lisbon's — see panelArt below. That is a stand-in, not a claim; give them their own
 * when there is one.
 */
import type { ChapterId } from './chapters'
import type { Purpose, Situation } from './situations'

export interface PanelArt {
  src: string
  alt: string
  title: string
}

export const PANEL_ART: Partial<Record<ChapterId, Record<Purpose, PanelArt>>> = {
  lisbon: {
    visiting: {
      src: '/panel/trip.jpg',
      alt: 'A view over the rooftops to the river, the 28 tram climbing the hill',
      title: 'Finish the trip and the whole view is yours.',
    },
    staying: {
      src: '/panel/season.jpg',
      alt: 'A street of small shops: a café, a bakery, a grocer, washing on the balconies',
      title: 'Finish the season and the street knows your name.',
    },
    moving: {
      src: '/panel/moving.jpg',
      alt: 'A tiled townhouse, its front door open, a neighbour waving from the balcony',
      title: 'Finish the move and the door is open.',
    },
  },
  /*
    SINTRA & CASCAIS (2026-11-05): their own paintings, in the same blue-and-white panel as
    Lisbon's. One city of two towns, so one of each: the hills for the trip, the seafront
    for the season, and the Colares house between vines and cliff — both at once — for the move.
  */
  'sintra-cascais': {
    visiting: {
      src: '/panel/sintra-trip.jpg',
      alt: 'Sintra’s old town in the green hills, a cobbled street and a café, the Moorish castle on the ridge in the mist',
      title: 'Finish the trip and the hills are yours.',
    },
    staying: {
      src: '/panel/cascais-season.jpg',
      alt: 'The seafront path towards Estoril: a café terrace, people walking by the sea wall, a small cove below',
      title: 'Finish the season and the seafront knows your name.',
    },
    moving: {
      src: '/panel/sintra-moving.jpg',
      alt: 'A stone house among the Colares vines, its door open, Azenhas do Mar white on the cliff above the Atlantic',
      title: 'Finish the move and the door is open.',
    },
  },
}

/** The painting for this city and reason; a city without its own borrows Lisbon's. */
export function panelArt(chapter: ChapterId | null | undefined, purpose: Purpose): PanelArt {
  return (chapter && PANEL_ART[chapter]?.[purpose]) || PANEL_ART.lisbon![purpose]
}

/**
 * ONE WORD PER ROOM, shown on its tile under the pointer, on focus, or while a finger is
 * on it. Sam, 2026-11-02: "on the mouseover there needs to be a subtle one word indication
 * of what each panel is." Copied from the website's tileWords so the two never disagree.
 *
 * Keyed by room id, so another city simply adds its own rooms' ids. Rooms not listed fall
 * back to the last word of their title (tileWord) — which is why every room on every
 * Lisbon path IS listed (scripts/path-check.mts asserts it): a fallback is a safety net,
 * not a style.
 */
export const TILE_WORDS: Record<string, string> = {
  /* Basics and the fun tiles (2026-11-03). */
  lisbon_ola: 'Hello',
  lisbon_numeros: '1–20',
  lisbon_legend: 'You',
  fun_cao_hack: '-ção',
  fun_bluff_time: 'Buy time',
  fun_bluff_react: 'React',
  fun_piece_of_cake: 'Cake',
  fun_hold_your_horses: 'Horses',
  fun_bobs_your_uncle: 'Bob',
  fun_the_penny_dropped: 'Penny',
  fun_fl_m_posso_oferecer: 'A drink?',
  fun_dd_wolf: 'Wolf',
  lisbon_aeroporto: 'Airport',
  lisbon_checkin: 'Check-in',
  lisbon_cartao_sim: 'SIM',
  lisbon_cafe: 'Coffee',
  lisbon_padaria: 'Bakery',
  lisbon_mesa: 'Table',
  lisbon_tasca: 'Tasca',
  lisbon_conta: 'Bill',
  lisbon_multibanco: 'Cash',
  lisbon_supermercado: 'Supermarket',
  lisbon_electrico: 'Tram',
  lisbon_taxi: 'Taxi',
  lisbon_perdido: 'Directions',
  lisbon_comboio: 'Sintra',
  lisbon_praia: 'Beach',
  lisbon_bilhetes: 'Tickets',
  lisbon_foto: 'Photo',
  lisbon_mercado: 'Market',
  lisbon_fado: 'Fado',
  lisbon_farmacia: 'Pharmacy',
  lisbon_sem: 'Allergies',
  lisbon_casa_de_banho: 'Toilet',
  lisbon_emergencia: 'Emergency',
  lisbon_roubo: 'Theft',
  lisbon_telemovel: 'Phone',
  lisbon_navegante: 'Navegante',
  lisbon_costume: 'Regular',
  lisbon_talho: 'Butcher',
  lisbon_lavandaria: 'Laundry',
  lisbon_encomenda: 'Parcel',
  lisbon_vizinho: 'Neighbour',
  lisbon_cabeleireiro: 'Haircut',
  lisbon_ginasio: 'Gym',
  lisbon_aulas: 'Classes',
  lisbon_arranjar: 'Repairs',
  lisbon_centro_saude: 'Doctor',
  lisbon_nif: 'NIF',
  lisbon_banco: 'Bank',
  lisbon_loja_cidadao: 'Citizen shop',
  lisbon_junta: 'Junta',
  lisbon_visita: 'Viewing',
  lisbon_contrato: 'Lease',
  lisbon_luz_agua: 'Utilities',
  lisbon_carro: 'Car',
  lisbon_escola: 'School',
  lisbon_save: 'The save',
}

/*
  WHAT YOU DO IN THE ROOM, OVER ITS WORD (Sam, 2026-11-09: "quite inconsistent in
  capitalisation… could we say HELLO, count 1–20, place GRAÇA"). Every board square reads the
  same way: a small lower-case line saying what you do or what kind of thing it is, then the
  name in capitals. A room's line is its verb — by its kind, or one of these where the kind's
  verb would read oddly.
*/
const VERB_OF_KIND: Record<string, string> = { moment: 'say', errand: 'sort out', place: 'at the', person: 'talk to' }
const ROOM_VERB: Record<string, string> = {
  lisbon_numeros: 'count',
  lisbon_save: 'when you’re lost',
  lisbon_legend: 'say who you are',
  lisbon_checkin: 'hotel',
  lisbon_cartao_sim: 'get a',
  lisbon_padaria: 'at the',
  lisbon_cafe: 'order a',
  lisbon_mesa: 'book a',
  lisbon_conta: 'ask for the',
  lisbon_multibanco: 'get',
  lisbon_taxi: 'take a',
  lisbon_perdido: 'ask for',
  lisbon_comboio: 'train to',
  lisbon_bilhetes: 'buy',
  lisbon_foto: 'ask for a',
  lisbon_fado: 'a night of',
  lisbon_sem: 'explain',
  lisbon_casa_de_banho: 'find the',
  lisbon_emergencia: 'when it’s an',
  lisbon_roubo: 'report a',
  lisbon_telemovel: 'get a',
  lisbon_navegante: 'get the',
  lisbon_costume: 'become a',
  lisbon_vizinho: 'meet the',
  lisbon_cabeleireiro: 'get a',
  lisbon_ginasio: 'join the',
  lisbon_aulas: 'sign up for',
  lisbon_arranjar: 'get',
  lisbon_centro_saude: 'register at the',
  lisbon_nif: 'get your',
  lisbon_banco: 'open a',
  lisbon_loja_cidadao: 'at the',
  lisbon_junta: 'at the',
  lisbon_visita: 'flat',
  lisbon_contrato: 'sign the',
  lisbon_luz_agua: 'turn on the',
  lisbon_carro: 'buy a',
  lisbon_escola: 'a place at',
}

/** The small line over a room's word: what you do there. */
export function tileVerb(room: Pick<Situation, 'id' | 'kind'>): string {
  return ROOM_VERB[room.id] ?? VERB_OF_KIND[room.kind] ?? ''
}

/** The tile's word: the listed one, or the last word of the room's title. */
export function tileWord(room: Pick<Situation, 'id' | 'title'>): string {
  return TILE_WORDS[room.id] ?? room.title.replace(/[.,?!…]/g, '').split(' ').filter(Boolean).pop() ?? ''
}
