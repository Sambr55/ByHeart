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

/**
 * The deal — §02B.
 *
 * Placed after the demo rather than before it, because showing beats telling: by the
 * time a person reads this they have already had the trick done to them once and are
 * asking "what is this, actually?". This screen answers that question and no other.
 *
 * The negative block is not a joke. It is the product's whole position, and stating it
 * out loud on the way in is what stops a learner measuring DUB by the thing DUB has
 * deliberately refused to build.
 */
export const DEAL = {
  eyebrow: 'BEFORE YOU START',
  headline: 'Here’s the deal.',
  how: {
    label: 'HOW IT WORKS',
    steps: [
      'Start with something you already know by heart.',
      'We pull out the useful language hiding inside it.',
      'Then we take the film away and find out whether it stuck.',
    ],
  },
  ask: {
    label: 'WHAT WE ASK OF YOU',
    lines: [
      'Ten minutes, on the days you feel like it. Not every day — we won’t ask.',
      'Say it out loud. Reading it is not the same thing.',
      'Tell us when something doesn’t land. That is the most useful thing you can do.',
    ],
  },
  get: {
    label: 'WHAT YOU GET',
    lines: [
      'Sentences you can say cold, to a real person, without rehearsing first.',
      'Counted honestly — the number only moves when there are no clues on screen.',
      'And the grammar underneath, without ever sitting through a grammar lesson.',
    ],
  },
  not: {
    label: 'WHAT THIS IS NOT',
    line:
      'No streaks. No points. No lives. Nothing here will ever congratulate you for opening the app — a thousand-day streak has never once helped anybody order a coffee.',
  },
  cta: 'I’M IN',
} as const

/** §08 / §09 — the first meaningful learner choice, and it comes after the demo. */
export const PICKER = {
  headline: 'Pick a crate to get going with, and start building your useful vocabulary bank.',
  // The word has to be taught the first time it is used, or it is just jargon. One
  // clause does it, and it also says what a crate is *for*.
  sub: 'A crate is a pile of something you already know by heart. Take whichever one you carry around in your head — there is no wrong answer, and no order.',
  /**
   * Shown only when a drop is actually live. The distinction is worth one sentence and
   * not a paragraph — and the last clause is the promise that stops a drop feeling like
   * a trick played on people who were busy that week.
   */
  drop_note:
    'The one with a date is a drop. It is pegged to something really happening and it disappears the morning after — but whatever you learn inside it is yours to keep.',
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
