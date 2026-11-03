/**
 * LOCAL KNOW-HOW — the things nobody tells you until you have got them wrong (2026-11-03).
 *
 * Each card is one piece of local knowledge with the line that goes with it and, where
 * there is one, the room on the path that trains it. They are general city knowledge rather
 * than claims about a business, so they carry no sources; anything that changes with time
 * (prices, rules) is left out on purpose — a card must still be true next year.
 *
 * SEASONAL CARDS (`months`) appear only in their months, so the City tab has something new
 * to say as the year turns: chestnuts in the autumn, sardines and basil in June.
 */
export type KnowHowTopic = 'eating' | 'money' | 'getting-about' | 'health' | 'manners' | 'season'

export interface KnowHow {
  id: string
  topic: KnowHowTopic
  title: string
  /** The knowledge, in two or three sentences. */
  body: string
  /** `f`: as a woman says it, when it changes with the speaker (content/speaker.ts). */
  line: { pt: string; f?: string; en: string }
  room?: string
  /** 1–12. Absent: all year. */
  months?: number[]
}

export const TOPIC_LABEL: Record<KnowHowTopic, string> = {
  eating: 'Eating out',
  money: 'Money',
  'getting-about': 'Getting about',
  health: 'If you are unwell',
  manners: 'Manners',
  season: 'In season',
}

export const KNOWHOW: KnowHow[] = [
  {
    id: 'couvert',
    topic: 'eating',
    title: 'The bread you did not order',
    body: 'Bread, butter, olives or cheese arrive at the table before you ask. They are the couvert, and if you eat them they are on the bill. Saying no is normal and nobody minds.',
    line: { pt: 'Não, obrigado. Pode levar o couvert.', f: 'Não, obrigada. Pode levar o couvert.', en: 'No thanks — you can take the couvert away.' },
    room: 'lisbon_conta',
  },
  {
    id: 'balcao',
    topic: 'eating',
    title: 'The counter is cheaper than the table',
    body: 'A coffee drunk standing at the balcão usually costs less than the same coffee at a table, and less again than on a terrace. Locals stand, drink it in three sips and go.',
    line: { pt: 'Uma bica, por favor. É para beber aqui.', en: 'An espresso, please. To drink here.' },
    room: 'lisbon_cafe',
  },
  {
    id: 'cafe-names',
    topic: 'eating',
    title: 'Ordering coffee like Lisbon does',
    body: 'In Lisbon an espresso is a bica. A galão is a tall milky coffee in a glass, a meia de leite is half milk in a cup, and a pingado is an espresso with a drop of milk.',
    line: { pt: 'Um galão e um pingado, por favor.', en: 'A milky coffee and an espresso with a drop of milk, please.' },
    room: 'lisbon_cafe',
  },
  {
    id: 'prato-do-dia',
    topic: 'eating',
    title: 'Lunch is the meal to eat out',
    body: 'Most kitchens serve lunch from about half past twelve to three and dinner from around eight. At lunch, the prato do dia is what the kitchen made today — usually the best value in the room.',
    line: { pt: 'Qual é o prato do dia?', en: 'What is the dish of the day?' },
    room: 'lisbon_tasca',
  },
  {
    id: 'agua-torneira',
    topic: 'eating',
    title: 'Tap water is fine',
    body: 'Lisbon tap water is safe to drink. Ask for a jug if you do not want a bottle — some places will bring bottled anyway, so ask plainly.',
    line: { pt: 'Pode ser água da torneira, por favor?', en: 'Could we have tap water, please?' },
    room: 'lisbon_mesa',
  },
  {
    id: 'troco',
    topic: 'money',
    title: 'Tipping is small',
    body: 'Service is not added to the bill and tipping is modest: round up, or leave a few coins for good service. Nobody expects a percentage.',
    line: { pt: 'Está bem assim, pode ficar com o troco.', en: 'That’s fine — keep the change.' },
    room: 'lisbon_conta',
  },
  {
    id: 'multibanco',
    topic: 'money',
    title: 'Cash comes from a Multibanco',
    body: 'Bank cash machines are called Multibanco and are everywhere. Standalone machines from other networks often add fees or poor rates, so look for the MB sign.',
    line: { pt: 'Desculpe, onde há um Multibanco?', en: 'Excuse me, where is there a cash machine?' },
    room: 'lisbon_multibanco',
  },
  {
    id: 'carregar',
    topic: 'getting-about',
    title: 'Load the card, not single tickets',
    body: 'Metro, buses and trams use a rechargeable card. Putting credit on it is cheaper than buying single tickets on board, and the same card works across the city.',
    line: { pt: 'Queria carregar o cartão, por favor.', en: 'I’d like to top up the card, please.' },
    room: 'lisbon_navegante',
  },
  {
    id: 'farmacia-servico',
    topic: 'health',
    title: 'The pharmacy that is open tonight',
    body: 'At night and at weekends one pharmacy in each area stays open: the farmácia de serviço. Every pharmacy posts on its door which one is on duty, and pharmacists here advise on minor things before you need a doctor.',
    line: { pt: 'Qual é a farmácia de serviço hoje?', en: 'Which pharmacy is on duty today?' },
    room: 'lisbon_farmacia',
  },
  {
    id: 'bom-dia-a-entrar',
    topic: 'manners',
    title: 'Say bom dia when you walk in',
    body: 'Walking into a small shop or café and going straight to what you want reads as brusque. A bom dia (or boa tarde after lunch) on the way in, and obrigado on the way out, changes how the whole exchange goes.',
    line: { pt: 'Bom dia! Obrigado, até logo.', f: 'Bom dia! Obrigada, até logo.', en: 'Good morning! Thank you, see you later.' },
    room: 'lisbon_ola',
  },
  {
    id: 'o-senhor',
    topic: 'manners',
    title: 'O senhor, a senhora',
    body: 'With a stranger who is older, or anyone in a shop or office, people talk to them as o senhor or a senhora rather than saying “you”. It sounds formal in English and simply polite in Portuguese.',
    line: { pt: 'A senhora sabe onde fica a paragem?', en: 'Do you know where the stop is? (to a woman, politely)' },
    room: 'lisbon_perdido',
  },
  {
    id: 'senha',
    topic: 'manners',
    title: 'Take a number',
    body: 'At counters with a queue — the post office, many pharmacies, some bakeries and every public office — you take a senha, a paper number, and wait for it on the screen.',
    line: { pt: 'Desculpe, onde se tira a senha?', en: 'Excuse me, where do you take a number?' },
    room: 'lisbon_loja_cidadao',
  },
  {
    id: 'castanhas',
    topic: 'season',
    title: 'Hot chestnuts on the corner',
    body: 'From autumn into winter, chestnut sellers roast castanhas on smoking carts on street corners and sell them in paper cones. Eat them walking.',
    line: { pt: 'Uma dúzia de castanhas, por favor.', en: 'A dozen chestnuts, please.' },
    room: 'lisbon_mercado',
    months: [10, 11, 12, 1],
  },
  {
    id: 'santos-populares',
    topic: 'season',
    title: 'June is the city’s party',
    body: 'Through June the old neighbourhoods hang streamers, grill sardines in the street and dance at arraiais; the biggest night is the eve of Santo António, 12–13 June. People give each other little pots of basil, manjericos, with a paper flower and a verse.',
    line: { pt: 'Duas sardinhas no pão e uma imperial, por favor.', en: 'Two sardines on bread and a draught beer, please.' },
    room: 'lisbon_tasca',
    months: [6],
  },
  {
    id: 'praia-agosto',
    topic: 'season',
    title: 'August empties the city',
    body: 'In August many locals go on holiday and some small restaurants and shops close for weeks — a sign on the door says férias. The beaches by train fill instead.',
    line: { pt: 'Estão fechados para férias até quando?', en: 'Until when are you closed for the holidays?' },
    room: 'lisbon_praia',
    months: [7, 8],
  },
]

/** The cards for this month: every all-year card, and the seasonal ones now in season. */
export function knowHowNow(now: Date = new Date(), all: KnowHow[] = KNOWHOW): KnowHow[] {
  const m = now.getMonth() + 1
  const inSeason = all.filter((k) => k.months?.includes(m))
  const always = all.filter((k) => !k.months)
  return [...inSeason, ...always]
}

/** The card a room's place brings to mind — the first that trains in the same room. */
export function knowHowForRoom(room: string, now: Date = new Date()): KnowHow | undefined {
  return knowHowNow(now).find((k) => k.room === room)
}
