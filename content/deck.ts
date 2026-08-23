import type { BlockId } from './types'

/**
 * The DECK — the first object that survives the lesson (spec §9).
 *
 * A card fronts an English intent with a tiny context and no Portuguese, so the
 * learner retrieves rather than recognises. The evidence line is the point of
 * difference from ordinary flashcards: it says where the memory started and what
 * the learner has since done with it.
 */
export interface DeckCardTemplate {
  card_id: string
  title: string
  /** English intent + tiny context. Never contains Portuguese. */
  front: string
  reveal: { pt: string; en: string }[]
  block_ids: BlockId[]
  kind: 'anchor' | 'block' | 'combination'
}

/** Always included after Top Gun + Bond. */
export const ANCHOR_CARDS: DeckCardTemplate[] = [
  {
    card_id: 'anchor_with_me',
    title: 'WITH ME',
    front: 'You’re leaving, and you want someone to come. Say: “Come with me.”',
    reveal: [{ pt: 'Vem comigo.', en: 'Come with me.' }],
    block_ids: ['comigo'],
    kind: 'anchor',
  },
  {
    card_id: 'anchor_can_you_can_i',
    title: 'CAN YOU / CAN I',
    front: 'Two questions, two people. Ask them to repeat. Then ask to pay.',
    reveal: [
      { pt: 'Podes repetir?', en: 'Can you repeat?' },
      { pt: 'Posso pagar?', en: 'Can I pay?' },
    ],
    block_ids: ['podes', 'posso'],
    kind: 'anchor',
  },
  {
    card_id: 'anchor_when_tomorrow',
    title: 'WHEN / TOMORROW',
    front: 'Ask when you’re going. Then answer it.',
    reveal: [
      { pt: 'Quando vamos?', en: 'When are we going?' },
      { pt: 'Amanhã.', en: 'Tomorrow.' },
    ],
    block_ids: ['quando', 'amanha'],
    kind: 'anchor',
  },
  {
    card_id: 'anchor_of_course_why_not',
    title: 'OF COURSE / WHY NOT',
    front: 'Someone offers you another coffee. Two tiny replies.',
    reveal: [
      { pt: 'Claro.', en: 'Of course.' },
      { pt: 'Porque não?', en: 'Why not?' },
    ],
    block_ids: ['claro', 'porque_nao'],
    kind: 'anchor',
  },
]

/** One card per block, drawn on for the weak and new slots. */
export const BLOCK_CARDS: Record<BlockId, DeckCardTemplate> = {
  comigo: {
    card_id: 'card_comigo',
    title: 'WITH ME',
    front: 'You stand up in a café. Tell a friend to come.',
    reveal: [{ pt: 'Vem comigo.', en: 'Come with me.' }],
    block_ids: ['comigo'],
    kind: 'block',
  },
  podes: {
    card_id: 'card_podes',
    title: 'CAN YOU',
    front: 'You missed what the waiter said.',
    reveal: [{ pt: 'Podes repetir?', en: 'Can you repeat?' }],
    block_ids: ['podes'],
    kind: 'block',
  },
  preciso_de: {
    card_id: 'card_preciso_de',
    title: 'I NEED',
    front: 'You sit down for lunch and you’re thirsty.',
    reveal: [{ pt: 'Preciso de água.', en: 'I need water.' }],
    block_ids: ['preciso_de'],
    kind: 'block',
  },
  nao_consigo: {
    card_id: 'card_nao_consigo',
    title: 'I CAN’T',
    front: 'Someone is speaking much too quickly.',
    reveal: [{ pt: 'Não consigo perceber.', en: 'I can’t understand.' }],
    block_ids: ['nao_consigo'],
    kind: 'block',
  },
  perdi: {
    card_id: 'card_perdi',
    title: 'I LOST',
    front: 'You pat every pocket.',
    reveal: [{ pt: 'Perdi as chaves.', en: 'I lost my keys.' }],
    block_ids: ['perdi'],
    kind: 'block',
  },
  nao_vou: {
    card_id: 'card_nao_vou',
    title: 'I’M NOT GOING TO',
    front: 'Your friend orders shots. You’re done.',
    reveal: [{ pt: 'Não vou beber.', en: 'I’m not going to drink.' }],
    block_ids: ['nao_vou'],
    kind: 'block',
  },
  o_que_estas_a: {
    card_id: 'card_o_que_estas_a',
    title: 'WHAT ARE YOU …ING',
    front: 'A friend arrives with a bright green drink.',
    reveal: [{ pt: 'O que estás a beber?', en: 'What are you drinking?' }],
    block_ids: ['o_que_estas_a'],
    kind: 'block',
  },
  quando: {
    card_id: 'card_quando',
    title: 'WHEN',
    front: 'You’re making plans for later.',
    reveal: [{ pt: 'Quando vais?', en: 'When are you going?' }],
    block_ids: ['quando'],
    kind: 'block',
  },
  claro: {
    card_id: 'card_claro',
    title: 'OF COURSE',
    front: 'You agree, without hesitating.',
    reveal: [{ pt: 'Claro.', en: 'Of course.' }],
    block_ids: ['claro'],
    kind: 'block',
  },
  porque_nao: {
    card_id: 'card_porque_nao',
    title: 'WHY NOT',
    front: 'You’re persuadable.',
    reveal: [{ pt: 'Porque não?', en: 'Why not?' }],
    block_ids: ['porque_nao'],
    kind: 'block',
  },
  chamo_me: {
    card_id: 'card_chamo_me',
    title: 'INTRODUCE YOURSELF',
    front: 'You meet someone new. Say your name.',
    reveal: [{ pt: 'Chamo-me Ana.', en: 'My name is Ana.' }],
    block_ids: ['chamo_me'],
    kind: 'block',
  },
  queria: {
    card_id: 'card_queria',
    title: 'I’D LIKE',
    front: 'At the counter. Ask politely.',
    reveal: [{ pt: 'Queria água.', en: 'I’d like water.' }],
    block_ids: ['queria'],
    kind: 'block',
  },
  posso: {
    card_id: 'card_posso',
    title: 'CAN I',
    front: 'The door is closed.',
    reveal: [{ pt: 'Posso entrar?', en: 'Can I come in?' }],
    block_ids: ['posso'],
    kind: 'block',
  },
  onde_fica: {
    card_id: 'card_onde_fica',
    title: 'WHERE IS',
    front: 'You’re lost near the centre.',
    reveal: [{ pt: 'Onde fica a estação?', en: 'Where is the station?' }],
    block_ids: ['onde_fica'],
    kind: 'block',
  },
  amanha: {
    card_id: 'card_amanha',
    title: 'TOMORROW',
    front: 'They ask when. Give a day.',
    reveal: [{ pt: 'Amanhã.', en: 'Tomorrow.' }],
    block_ids: ['amanha'],
    kind: 'block',
  },
  outra_vez: {
    card_id: 'card_outra_vez',
    title: 'AGAIN',
    front: 'Someone speaks too fast. Ask, politely.',
    reveal: [{ pt: 'Outra vez, por favor.', en: 'Again, please.' }],
    block_ids: ['outra_vez'],
    kind: 'block',
  },
}

/** Used when a learner has no weak blocks — reward capability, not repetition. */
export const COMBINATION_CARDS: DeckCardTemplate[] = [
  {
    card_id: 'combo_need_where',
    title: 'I NEED + WHERE',
    front: 'At the station. Say what you need, then ask where to go.',
    reveal: [
      { pt: 'Preciso de um bilhete.', en: 'I need a ticket.' },
      { pt: 'Onde fica a saída?', en: 'Where is the exit?' },
    ],
    block_ids: ['preciso_de', 'onde_fica'],
    kind: 'combination',
  },
  {
    card_id: 'combo_again',
    title: 'ASK AGAIN',
    front: 'You want them to come with you one more time.',
    reveal: [{ pt: 'Podes vir comigo outra vez?', en: 'Can you come with me again?' }],
    block_ids: ['podes', 'comigo', 'outra_vez'],
    kind: 'combination',
  },
  {
    card_id: 'combo_arrive',
    title: 'ARRIVING',
    front: 'A town you don’t know. Name, order, directions.',
    reveal: [
      { pt: 'Chamo-me Sofia.', en: 'My name is Sofia.' },
      { pt: 'Queria um chá.', en: 'I’d like a tea.' },
      { pt: 'Onde fica o hotel?', en: 'Where is the hotel?' },
    ],
    block_ids: ['chamo_me', 'queria', 'onde_fica'],
    kind: 'combination',
  },
]
