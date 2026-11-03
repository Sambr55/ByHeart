/**
 * LANGUAGE WALKS — a bairro, a few hours, one sentence at every stop (Sam, 2026-11-03:
 * "Proceed with language walks").
 *
 * A walk strings a neighbourhood's verified gems into the order you would actually walk
 * them, with the time of day that suits each. At every stop there is one thing to do and
 * the one line to say there (the gem's own), and the learner marks it said — in the street,
 * to a person. That is the whole product in one afternoon: the path teaches the room, the
 * walk takes you into it.
 *
 * Stops are gem ids, so a walk can never show a place that is not verified: a stop whose
 * gem is hidden (visibleGems) is simply skipped. The `do` lines are written here; every
 * fact about a place comes from its gem.
 */
import { distanceM, visibleGems, type BairroId, type Gem } from '@/content/gems'

export interface WalkStop {
  gem: string
  /** What to do here, in a sentence. */
  do: string
}

export interface Walk {
  id: string
  bairro: BairroId
  title: string
  /** The same in Portuguese, set in the Portuguese type. */
  pt: string
  when: string
  intro: string
  stops: WalkStop[]
  /** The last line on the finish screen. */
  finish: string
}

export const WALKS: Walk[] = [
  {
    id: 'graca-saturday',
    bairro: 'graca',
    title: 'A Saturday in Graça',
    pt: 'Um sábado na Graça',
    when: 'Saturday, from late morning into the evening',
    intro: 'Bread, a long lunch on the square, cake with the best view nobody queues for, an afternoon of fado sung by neighbours, and a gig in an old bakery.',
    stops: [
      { gem: 'micro-padaria-graca', do: 'Start at the tiny bakery before the good loaves go. Ask what today’s bread is.' },
      { gem: 'piteu-da-graca', do: 'Lunch on the square. Ask for a table before you sit down.' },
      { gem: 'jardim-cerca-da-graca', do: 'Walk off lunch in the garden and ask the kiosk what the cake is today.' },
      { gem: 'tasca-do-jaime-graca', do: 'From about four, order at the counter and stay for the singers.' },
      { gem: 'damas-graca', do: 'End at the old bakery turned gig room. Ask when the music starts.' },
    ],
    finish: 'Five rooms in one hill, and every one of them in Portuguese.',
  },
  {
    id: 'mouraria-down',
    bairro: 'mouraria',
    title: 'Down through Mouraria',
    pt: 'A descer a Mouraria',
    when: 'Late morning to dinner',
    intro: 'From the Intendente down the old streets where fado was born: a shop of Portuguese things, a grill with shared tables, Mozambican cooking, and the neighbourhood’s own fado house.',
    stops: [
      { gem: 'a-vida-portuguesa-intendente', do: 'Start on the Largo do Intendente. Buy something small and ask for it to be wrapped.' },
      { gem: 'maria-da-mouraria', do: 'Walk down to the Largo da Severa and ask what time the fado starts tonight — then book.' },
      { gem: 'ze-dos-cornos', do: 'Lunch at the foot of the hill: ask to share a table.' },
      { gem: 'cantinho-do-aziz', do: 'Come back hungry later, or instead: ask what they recommend today.' },
    ],
    finish: 'Mouraria has always been where people arrive. Today that included you.',
  },
  {
    id: 'alfama-back-steps',
    bairro: 'alfama',
    title: 'Alfama’s back steps',
    pt: 'As escadinhas de Alfama',
    when: 'Late afternoon into the night',
    intro: 'Away from the castle queue: a viewpoint you find by asking, sardines in a courtyard, the club where Alfama sings, and fado vadio over dinner.',
    stops: [
      { gem: 'miradouro-santo-estevao', do: 'Get a little lost on purpose, then ask somebody the way to the viewpoint.' },
      { gem: 'pateo-13', do: 'Just below: order sardines before seven, when the tables fill.' },
      { gem: 'grupo-sportivo-adicense', do: 'Ask at the club bar whether there is fado — today, or when.' },
      { gem: 'a-baiuca', do: 'Booked ahead, hungry, quiet during each song: ask if there is still room for two.' },
    ],
    finish: 'You asked the way, ordered, asked about the fado and found a seat — in Alfama, in Portuguese.',
  },
  {
    id: 'campo-de-ourique-village',
    bairro: 'campo-de-ourique',
    title: 'A village morning in Campo de Ourique',
    pt: 'Uma manhã em Campo de Ourique',
    when: 'A weekday morning',
    intro: 'The neighbourhood that feels like a village: a nata at a counter, the market when the stalls are full, a poet’s house, and a bottle for dinner chosen out loud.',
    stops: [
      { gem: 'pastelaria-aloma', do: 'Start standing at the counter. Order two, and say yes to the canela.' },
      { gem: 'mercado-campo-de-ourique', do: 'Across to the market while the fresh stalls are open. Ask the price of a kilo.' },
      { gem: 'casa-fernando-pessoa', do: 'Two minutes away: buy a ticket — and ask about a discount.' },
      { gem: 'garrafeira-campo-de-ourique', do: 'Finish by choosing tonight’s wine: give a budget and let them pick.' },
    ],
    finish: 'A morning of counters, prices and a poet — and the numbers came out without counting.',
  },
  {
    id: 'anjos-people',
    bairro: 'arroios',
    title: 'Anjos, by its people',
    pt: 'Os Anjos, pelas pessoas',
    when: 'A weekday, morning to evening',
    intro: 'The most mixed neighbourhood in Portugal, met through the people who have kept it going: a barber of sixty years, potters, the market and a family adega.',
    stops: [
      { gem: 'salao-pais', do: 'Walk in on a weekday morning for a trim, and talk while you wait.' },
      { gem: 'tijolo-ceramica', do: 'A few doors along: ask about a beginners’ class this week.' },
      { gem: 'mercado-de-arroios', do: 'Up to the market. Ask the butcher to cut something the way you want it.' },
      { gem: 'adega-do-domingos', do: 'Dinner with the regulars. Ask if one portion will do for two.' },
    ],
    finish: 'A haircut, a class, a counter and a table — four conversations, all yours.',
  },
  {
    id: 'marvila-east',
    bairro: 'marvila',
    title: 'Marvila, warehouse to warehouse',
    pt: 'Marvila, de armazém em armazém',
    when: 'Afternoon into the night',
    intro: 'Lisbon’s east, still being found: a library in the estates, craft beer from the tanks, murals and an urban-art gallery, snails by the railway, and a factory turned culture house.',
    stops: [
      { gem: 'biblioteca-de-marvila', do: 'Start by asking somebody the way to the library — then look at what is on.' },
      { gem: 'dois-corvos-taproom', do: 'A tasting tray at the taproom, and ask for the bill in Portuguese.' },
      { gem: 'galeria-underdogs', do: 'Into the gallery: ask before you photograph the work.' },
      { gem: 'varanda-do-vale-formoso', do: 'In the warm months, a plate of snails and a draught beer at the counter.' },
      { gem: 'fabrica-braco-de-prata', do: 'End the night at the old factory: ask what entry is tonight.' },
    ],
    finish: 'From a library to a factory floor, the east of the city in five sentences.',
  },
]

export interface WalkView {
  walk: Walk
  /** The stops whose gem is visible, with the gem attached. */
  stops: (WalkStop & { g: Gem; key: string })[]
  /** Walking distance stop to stop, metres. */
  metres: number
  /** Rough minutes on foot (hills included), not counting the time at each stop. */
  minutes: number
}

/** A walk as it can be walked today: verified stops only. Null if fewer than three remain. */
export function walkView(walk: Walk, gems: Gem[] = visibleGems()): WalkView | null {
  const stops = walk.stops.flatMap((s, i) => {
    const g = gems.find((x) => x.id === s.gem)
    return g ? [{ ...s, g, key: walk.id + ':' + i }] : []
  })
  if (stops.length < 3) return null
  let metres = 0
  for (let i = 1; i < stops.length; i++) metres += distanceM([stops[i - 1].g.lat, stops[i - 1].g.lng], [stops[i].g.lat, stops[i].g.lng])
  return { walk, stops, metres, minutes: Math.max(10, Math.round((metres * 1.3) / 70)) }
}

export function visibleWalks(gems: Gem[] = visibleGems()): WalkView[] {
  return WALKS.flatMap((w) => {
    const v = walkView(w, gems)
    return v ? [v] : []
  })
}

export function walkById(id: string): Walk | undefined {
  return WALKS.find((w) => w.id === id)
}

/** How many of a walk's stops this learner has said. */
export function walkProgress(v: WalkView, said: string[] = []): { done: number; total: number; complete: boolean } {
  const done = v.stops.filter((s) => said.includes(s.key)).length
  return { done, total: v.stops.length, complete: done === v.stops.length }
}
