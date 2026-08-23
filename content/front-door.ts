/**
 * The two fixed beats. Everything after these belongs to the learner (§20.13).
 *
 * The copy below is verbatim from §02A. It is the one place in the product where the
 * wording is not ours to improve: the landing proposition and the Goose demonstration
 * are specified word for word, and the demo exists to show the mechanic before anyone
 * is asked to imagine it.
 */

export const LANDING = {
  wordmark: 'DUB',
  line: 'Find yourself in another language.',
  lines: [
    'Start with something you already know.',
    'Learn Portuguese through the films, music, TV, sport and culture already in your head.',
    'Understand the moment.\nDiscover the language inside it.\nRemix it. Use it. Make it yours.',
    'You already know more than you think.',
  ],
  cta: 'SHOW ME HOW',
} as const

export interface DemoBeat {
  key: 'recognise' | 'build'
  /** The big thing on screen. */
  display: string
  /** The quiet line under it. */
  gloss?: string
  /** Staged in on the same screen, after the recognition has landed. */
  translation?: { pt: string; en: string }
  /** Staged in last: the piece the line just handed over. */
  takeaway?: { display: string; gloss: string }
  /** The explosion. */
  branches?: { pt: string; en: string }[]
  /** Shown under the branches on the final beat. */
  close?: string
  cta: string
}

/**
 * Beats 3 and 4 are reveals, not exercises. The branch phrases are the payoff of the
 * demonstration — showing them as wrong answers in a quiz, which is what the old
 * Mission 01 did, inverts the whole point of the beat.
 */
/**
 * Two screens, not five.
 *
 * Recognition, translation and extraction are one thought, so they belong on one screen
 * with the translation animating in and the takeaway arriving after it — splitting them
 * across three taps made the learner work for a reveal that should feel like a magic
 * trick. The culture-free release has moved out of the demo entirely: every root ends
 * with one, so proving it here as well only delayed the learner's own choice.
 */
export const DEMO_BEATS: DemoBeat[] = [
  {
    key: 'recognise',
    display: 'TALK TO ME, GOOSE.',
    gloss: 'You already know what Maverick means.',
    translation: { pt: 'FALA COMIGO, GOOSE.', en: 'Talk to me, Goose.' },
    takeaway: {
      display: 'COMIGO = WITH ME',
      gloss: 'That one familiar line just gave you something useful.',
    },
    cta: 'SHOW ME WHAT THAT UNLOCKS',
  },
  {
    key: 'build',
    display: 'One line. Three things you can say.',
    branches: [
      { pt: 'Vem comigo.', en: 'Come with me.' },
      { pt: 'Fica comigo.', en: 'Stay with me.' },
      { pt: 'Podes vir comigo?', en: 'Can you come with me?' },
    ],
    close:
      'That’s DUB. Start with something you already know. Find the useful language inside it. Make it yours.',
    cta: 'MY TURN',
  },
]

export const DEMO_CLOSE =
  'That’s DUB. Start with something you already know. Find the useful language inside it. Make it yours.'

/** §08 / §09 — the first meaningful learner choice, and it comes after the demo. */
export const PICKER = {
  headline: 'Select an area to get going with, and start building your useful vocabulary bank.',
  sub: 'Whichever one you already carry around in your head. There is no wrong answer, and no order.',
  cta: 'START HERE',
} as const

/** §09 (7:30–8:35) — no cue, no styling, no culture. The absence is the point. */
export const NO_CUE_PROMPTS = [
  {
    context: 'A café. Someone is about to walk out.',
    ask: 'Come with me.',
    answer: 'Vem comigo.',
    requires: 'comigo',
  },
  {
    context: 'You didn’t catch what they said.',
    ask: 'Can you say it again?',
    answer: 'Podes dizer outra vez?',
    requires: 'outra_vez',
  },
  {
    context: 'You arrive, and you are late.',
    ask: 'Sorry I’m late.',
    answer: 'Desculpa o atraso.',
    requires: 'desculpa',
  },
  {
    context: 'You need to get somewhere.',
    ask: 'I need a taxi.',
    answer: 'Preciso de um táxi.',
    requires: 'preciso_de',
  },
  {
    context: 'Someone asks whether today works.',
    ask: 'Tomorrow.',
    answer: 'Amanhã.',
    requires: 'amanha',
  },
  {
    context: 'You meet someone new.',
    ask: 'My name is Sam.',
    answer: 'Chamo-me Sam.',
    requires: 'chamo_me',
  },
  {
    context: 'A friend is panicking.',
    ask: 'Easy.',
    answer: 'Calma.',
    requires: 'calma',
  },
  {
    context: 'Someone asks if you can talk.',
    ask: 'Not now.',
    answer: 'Agora não.',
    requires: 'agora',
  },
]

export const CLOSE = {
  eyebrow: 'YOU ALREADY KNOW MORE THAN YOU THINK.',
  cta: 'FIVE QUESTIONS, THEN YOU’RE DONE',
} as const
