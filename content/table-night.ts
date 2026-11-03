/**
 * YOUR TABLE — an evening a host puts together for their own friends (2026-11-03).
 *
 * Sam: "I want the table to be a place where a natural leader takes the initiative to gather
 * his/her friends and actually lean into the language and have fun doing so. So they will
 * only invite friends, not random people, and we will give them the tools to facilitate the
 * evening. Each of them using their app to help them converse and elevate their language.
 * There are plenty of meet-up apps we can reference, but ours is wrapped in real language,
 * linked to real places."
 *
 * WHAT CHANGED FROM THE OLD TABLE (content/table.ts). That one seated six strangers and DUB
 * matched them; this one is a host's evening and DUB is the kit. Nobody is matched, nobody
 * is ranked, and the only way in is a link from the host. The ten-minute rule survives as
 * the gentlest of three house rules the host picks.
 *
 * THE KIT IS FIVE ROUNDS, every phone at the table showing the same one — the host's phone
 * moves the table on. Each round is a handful of lines with a voice, a mic and a job:
 * arrive and order, introduce yourselves, draw a question, a game, and the toast. Lifelines
 * are on every round, and ASK (the translator) is one tap away on every phone.
 *
 * THE PORTUGUESE IS EUROPEAN and among friends, so it is `tu` throughout. DUB-authored and
 * awaiting a native read with the Basics lines — see docs/gems-review.md for the process.
 */

export interface Line {
  pt: string
  en: string
}

/** How much Portuguese, chosen by the host, said on the invite and at the top of every round. */
export type HouseRule = 'ten' | 'food' | 'all'

export const HOUSE_RULES: { id: HouseRule; name: string; rule: string; for: string }[] = [
  {
    id: 'ten',
    name: 'Ten minutes',
    rule: 'The first ten minutes are in Portuguese. Then English, with no shame.',
    for: 'A first table, or friends who have only just started.',
  },
  {
    id: 'food',
    name: 'Until the food',
    rule: 'Portuguese until the food arrives. Then whatever you like.',
    for: 'Friends a few weeks in who want a proper go.',
  },
  {
    id: 'all',
    name: 'All in',
    rule: 'Portuguese all night. Every word of English is a coin in the jar, and the jar buys the last round.',
    for: 'The brave. It is louder than it sounds.',
  },
]

export function houseRule(id: string | null | undefined) {
  return HOUSE_RULES.find((r) => r.id === id) ?? HOUSE_RULES[0]
}

/** The lines for when it goes wrong — on every round, because it will. */
export const LIFELINES: Line[] = [
  { pt: 'Como se diz … em português?', en: 'How do you say … in Portuguese?' },
  { pt: 'Podes repetir, mais devagar?', en: 'Can you say that again, more slowly?' },
  { pt: 'Não percebi.', en: 'I didn’t catch that.' },
  { pt: 'Esqueci-me da palavra!', en: 'I’ve forgotten the word!' },
]

export type RoundId = 'arrive' | 'intro' | 'questions' | 'game' | 'toast'

export interface Round {
  id: RoundId
  /** The round's name in Portuguese, big, then English small. */
  pt: string
  en: string
  /** What happens, in one or two sentences, for whoever reads it out. */
  how: string
  /** The lines for this round. The intro round adds each person's own Legend on their phone. */
  lines: Line[]
  /** Who goes first is picked from the table, the same name on every phone. */
  picksStarter?: boolean
}

export const ROUNDS: Round[] = [
  {
    id: 'arrive',
    pt: 'Chegar e pedir',
    en: 'Arrive and order',
    how: 'The first round is ordered in Portuguese, by the person the app picks. Everybody else orders their own.',
    picksStarter: true,
    lines: [
      { pt: 'Para mim, uma imperial, por favor.', en: 'A draught beer for me, please.' },
      { pt: 'Um copo de vinho tinto da casa.', en: 'A glass of the house red.' },
      { pt: 'O que nos recomenda?', en: 'What would you recommend?' },
    ],
  },
  {
    id: 'intro',
    pt: 'Apresentações',
    en: 'Introductions',
    how: 'Round the table: your name, where you are from, why you are here. About a minute each — your own lines are on your phone.',
    picksStarter: true,
    lines: [
      { pt: 'Chamo-me …', en: 'My name is …' },
      { pt: 'Sou de …', en: 'I’m from …' },
      { pt: 'Vim para Lisboa porque …', en: 'I came to Lisbon because …' },
      { pt: 'Estou cá há … dias.', en: 'I’ve been here … days.' },
    ],
  },
  {
    id: 'questions',
    pt: 'Perguntas',
    en: 'Questions',
    how: 'Draw a card and ask the person on your left. They answer with the starter if they need it, then draw for the next person.',
    picksStarter: true,
    lines: [
      { pt: 'E tu?', en: 'And you?' },
      { pt: 'A sério?', en: 'Really?' },
      { pt: 'Que fixe!', en: 'How cool!' },
    ],
  },
  {
    id: 'game',
    pt: 'Duas verdades e uma mentira',
    en: 'Two truths and a lie',
    how: 'Say three things about yourself in Portuguese. Two are true. The table guesses the lie — in Portuguese.',
    picksStarter: true,
    lines: [
      { pt: 'Eu já vivi em …', en: 'I have lived in …' },
      { pt: 'Eu nunca comi …', en: 'I have never eaten …' },
      { pt: 'Eu sei tocar …', en: 'I can play …' },
      { pt: 'Acho que é mentira!', en: 'I think that’s the lie!' },
      { pt: 'É verdade!', en: 'It’s true!' },
    ],
  },
  {
    id: 'toast',
    pt: 'Brinde',
    en: 'The toast',
    how: 'Glasses up. Then the bill, in Portuguese, and tick off what you said tonight — it goes in Yours.',
    lines: [
      { pt: 'Saúde!', en: 'Cheers!' },
      { pt: 'À nossa!', en: 'To us!' },
      { pt: 'A conta, por favor.', en: 'The bill, please.' },
      { pt: 'Vamos dividir?', en: 'Shall we split it?' },
      { pt: 'Até à próxima!', en: 'Until next time!' },
    ],
  },
]

/** A conversation card: the question, and a way to start the answer. */
export interface Question extends Line {
  start: Line
  /** `stretch` asks for a tense somebody may not have yet — said on the card. */
  tier?: 'stretch'
}

export const QUESTIONS: Question[] = [
  { pt: 'Qual é o teu sítio preferido em Lisboa?', en: 'What is your favourite place in Lisbon?', start: { pt: 'O meu sítio preferido é …', en: 'My favourite place is …' } },
  { pt: 'O que comeste hoje?', en: 'What did you eat today?', start: { pt: 'Hoje comi …', en: 'Today I ate …' } },
  { pt: 'Café ou chá?', en: 'Coffee or tea?', start: { pt: 'Prefiro …', en: 'I prefer …' } },
  { pt: 'Praia ou montanha?', en: 'Beach or mountains?', start: { pt: 'Prefiro …', en: 'I prefer …' } },
  { pt: 'Qual é a tua palavra portuguesa preferida?', en: 'What is your favourite Portuguese word?', start: { pt: 'A minha palavra preferida é …', en: 'My favourite word is …' } },
  { pt: 'O que fazes ao fim de semana?', en: 'What do you do at the weekend?', start: { pt: 'Ao fim de semana, eu …', en: 'At the weekend, I …' } },
  { pt: 'Que música estás a ouvir agora?', en: 'What music are you listening to at the moment?', start: { pt: 'Agora estou a ouvir …', en: 'At the moment I’m listening to …' } },
  { pt: 'Onde foste nas últimas férias?', en: 'Where did you go on your last holiday?', start: { pt: 'Fui a …', en: 'I went to …' } },
  { pt: 'Do que tens saudades?', en: 'What do you miss?', start: { pt: 'Tenho saudades de …', en: 'I miss …' } },
  { pt: 'Qual foi a melhor coisa desta semana?', en: 'What was the best thing this week?', start: { pt: 'A melhor coisa foi …', en: 'The best thing was …' } },
  { pt: 'Sabes cozinhar?', en: 'Can you cook?', start: { pt: 'Sei fazer …', en: 'I can make …' } },
  { pt: 'Tens animais?', en: 'Do you have any pets?', start: { pt: 'Tenho um … / Não tenho.', en: 'I have a … / I don’t.' } },
  { pt: 'Qual é o teu bairro preferido?', en: 'Which is your favourite neighbourhood?', start: { pt: 'Gosto muito de …', en: 'I really like …' } },
  { pt: 'O que querias aprender a fazer?', en: 'What would you like to learn to do?', start: { pt: 'Queria aprender a …', en: 'I’d like to learn to …' } },
  { pt: 'És uma pessoa da manhã ou da noite?', en: 'Are you a morning person or a night person?', start: { pt: 'Sou uma pessoa da …', en: 'I’m a … person.' } },
  { pt: 'Onde se come o melhor pastel de nata?', en: 'Where do you get the best pastel de nata?', start: { pt: 'Para mim, é …', en: 'For me, it’s …' } },
  { pt: 'Qual é o teu prato português preferido?', en: 'What is your favourite Portuguese dish?', start: { pt: 'Adoro …', en: 'I love …' } },
  { pt: 'Qual foi a primeira palavra que aprendeste em português?', en: 'What was the first word you learned in Portuguese?', start: { pt: 'A primeira foi …', en: 'The first one was …' } },
  { pt: 'Onde vais jantar amanhã?', en: 'Where are you having dinner tomorrow?', start: { pt: 'Amanhã vou jantar …', en: 'Tomorrow I’m having dinner …' } },
  { pt: 'Benfica, Sporting ou nenhum?', en: 'Benfica, Sporting or neither?', start: { pt: 'Sou do … / Não ligo a futebol.', en: 'I support … / I don’t care about football.' } },
  { pt: 'O que te fez rir esta semana?', en: 'What made you laugh this week?', start: { pt: 'Ri-me com …', en: 'I laughed at …' } },
  { pt: 'Qual é o teu plano para o resto da noite?', en: 'What is your plan for the rest of the night?', start: { pt: 'Depois daqui, vou …', en: 'After this, I’m going …' } },
  { pt: 'Se ganhasses a lotaria, o que fazias?', en: 'If you won the lottery, what would you do?', start: { pt: 'Comprava …', en: 'I’d buy …' }, tier: 'stretch' },
  { pt: 'Se pudesses viver noutro bairro, qual era?', en: 'If you could live in another neighbourhood, which would it be?', start: { pt: 'Vivia em …', en: 'I’d live in …' }, tier: 'stretch' },
]

/** The kinds of place a table can be at, from the City's gems. */
export const TABLE_KINDS = ['tasca', 'bar', 'cafe', 'venue', 'market'] as const

/**
 * The line for walking in, in the host's name and with the right greeting for the hour:
 * boa tarde until about seven, boa noite after.
 */
export function arriveLine(host: string, sitsAt: string | Date): Line {
  const h = new Date(sitsAt).getHours()
  const greet = h >= 19 || h < 5 ? { pt: 'Boa noite', en: 'Good evening' } : { pt: 'Boa tarde', en: 'Good afternoon' }
  const name = host.trim()
  return name
    ? { pt: `${greet.pt}! Temos uma mesa em nome de ${name}.`, en: `${greet.en}! We have a table under the name ${name}.` }
    : { pt: `${greet.pt}! Temos uma mesa reservada.`, en: `${greet.en}! We have a table booked.` }
}

/** Same number from the same string, on every phone — so the table agrees without a server round trip. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Who starts this round: the same name on every phone at the table. */
export function starterFor(code: string, round: number, names: string[]): string | null {
  if (!names.length) return null
  return names[hash(code + ':' + round) % names.length]
}

/** Draw a question: the deck is shuffled per table and per phone, so nobody draws the same run. */
export function questionAt(seed: string, n: number): Question {
  const order = QUESTIONS.map((q, i) => ({ q, k: hash(seed + ':' + i) })).sort((a, b) => a.k - b.k)
  return order[((n % order.length) + order.length) % order.length].q
}

/** The words that go out with the invite, in English with one line of Portuguese to set the tone. */
export function inviteText(o: { host: string; place: string; when: string; rule: HouseRule; url: string }): string {
  return (
    `${o.host} is putting a table together — ${o.place}, ${o.when}.\n` +
    `House rule: ${houseRule(o.rule).rule}\n` +
    `Vens? (Are you coming?) ${o.url}`
  )
}

/** Short, ambiguous-letter-free codes for the invite link. */
export const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const MAX_GUESTS = 11
