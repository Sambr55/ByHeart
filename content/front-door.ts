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
    // Language-neutral on purpose: the brand layer describes the method, and the
    // method is not about Portuguese. The personal experience becomes specific the
    // moment a pair is chosen, one screen later.
    'Learn a language through the films, music, books, TV, sport and culture already in your head.',
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

/**
 * Choosing a language, after the demo rather than before it.
 *
 * A selector at the front asks for a commitment before the learner has been shown what
 * they would be committing to. The Goose moment IS the argument, so it goes first —
 * and having it go first is what earns the transition line, which turns setup admin
 * into the second beat of the story rather than a form.
 */
export const PAIR_STEP = {
  eyebrow: 'ONE DECISION',
  headline: 'That was Portuguese. Where do you want DUB to take you?',
  sub: 'One is built. The others are honest about not being — nothing here will take your email and promise to let you know.',
  soon: 'COMING SOON',
  source_label: 'Learning from',
  source_change: 'Change',
  /**
   * Revealed under the source line rather than asked as a screen of its own: a
   * mandatory second question with exactly one available answer is a tax, not a choice.
   */
  source_note:
    'Which crates you get depends on the culture you already carry, not the language you speak — Top Gun and Bridget Jones work because of shared anglophone media. Other cultures need their own crate libraries, and those are not built yet.',
  cta: 'LET’S GO',
  after: 'Let’s find your Portuguese.',
} as const

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
      'Start with something already in your head.',
      'We pull out the useful language hiding inside it, and you keep it.',
      'Then we take it all away and find out whether it stuck.',
    ],
  },
  /**
   * The stages were being shown as a number on a screen before anything had explained
   * what they were — "you are at 5" means nothing to somebody who has never been told
   * there are six of them or what they lead to. This block is that explanation, and it
   * is deliberately the most visual thing on the page.
   */
  stages: {
    label: 'THE SIX STAGES',
    intro:
      'Not levels, and nothing to grind. Each stage is a thing you can walk into a café and actually do, and they are in this order because language is — you cannot ask where the water is before you have the word for water.',
    start: 'YOU START HERE',
    move:
      'You move up by saying something cold, with nothing on screen to copy from — never by turning up. It cannot go down, and nothing expires if you disappear for a month.',
  },
  collect: {
    label: 'WHAT YOU COLLECT',
    lines: [
      'Every line hands you a piece or two, and they are yours from then on.',
      'Pieces from different crates combine — a word out of a Bond title finishing a sentence that started in Bridget Jones.',
      'That bank is the whole score. Not days attended.',
    ],
    /** Real pieces the graph teaches, shown as the chips they appear as in the app. */
    examples: ['comigo', 'onde', 'quanto', 'ajuda', 'ele', 'segunda-feira'],
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
  sub: 'A crate is a pile of something already in your head. Take whichever one you carry around with you — there is no wrong answer, and no order.',
  /**
   * Shown only when a drop is actually live. The distinction is worth one sentence and
   * not a paragraph — and the last clause is the promise that stops a drop feeling like
   * a trick played on people who were busy that week.
   */
  drop_note:
    'The one with a date is a drop. It is pegged to something really happening and it disappears the morning after — but whatever you learn inside it is yours to keep.',
  /** Shown under the list whenever something is still dimmed. */
  locked_note:
    'The dimmed ones are not gone. Each says what opens it — and it opens by saying something cold, with nothing on screen to copy from, not by turning up.',
  /** The affordance on the stage band, which used to be a number with no explanation. */
  stages_toggle: 'all six',
  /**
   * Said once, quietly, under the list. Not a banner and not a countdown — the three
   * crates are a real product, and somebody a fortnight in has not run out of anything.
   */
  plan_note: 'Three crates are yours for good, and every drop is always open.',
  plan_cta: 'What DUB adds',
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
  /**
   * Back into the product, not out to a form about it. The end of a good session is the
   * worst possible moment to hand somebody a survey — feedback is a standing menu item
   * and one quiet line here, never the only exit.
   */
  sub: 'That is yours now. Take another crate whenever you want one.',
  cta: 'BACK TO MY CRATES',
  feedback: 'Something not land? Tell us.',
} as const
