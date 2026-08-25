/**
 * The things people actually get stuck on, answered.
 *
 * A feedback form is a product asking for a favour. This one gives something back
 * before it asks — which is also how you get better feedback, because somebody who has
 * just been helped writes more than somebody who has just been interrogated.
 *
 * Answered in DUB's voice, which means honestly: progress DOES only live on this device
 * until you sign in, and saying so is worth more than a reassuring evasion that the next
 * screen contradicts.
 *
 * There is no entry about the synthetic voice. Recorded Portuguese is contracted and
 * lands before launch, so an answer explaining a robot would be answering a question
 * about a version of the product nobody outside this test will ever meet — and a support
 * page is not the place to keep a gap alive after it has been closed.
 */

export interface HelpItem {
  id: string
  q: string
  /** The short answer. Written to be true whatever state the learner is in. */
  a: string
  /** Where to go if they want to act on it. */
  link?: { href: string; label: string }
}

export const HELP: HelpItem[] = [
  {
    id: 'dimmed',
    q: 'Why is a vibe dimmed?',
    a: 'It opens at a stage you have not reached yet. You move up by saying something cold — with nothing on screen to copy from — never by turning up or by waiting. Every dimmed vibe says which stage opens it, and nothing is ever locked forever.',
    link: { href: '/vibes', label: 'See where you are' },
  },
  {
    id: 'three',
    q: 'Why can I only open three vibes?',
    a: 'Three vibes is the free tier, and the three you choose stay yours for good — we are never going to take one back. Every live drop is always open on top of that, whatever you are paying, because a drop can be lost by being busy and charging for it would be mean.',
    link: { href: '/pro', label: 'What DUB adds' },
  },
  {
    id: 'which-portuguese',
    q: 'Is this Portuguese or Brazilian?',
    a: 'European Portuguese, always. It says comboio rather than trem, telemóvel rather than celular, and estás rather than você está. That is the whole reason DUB exists: every big app teaches the Brazilian one, and you are going to Lisbon.',
  },
  {
    id: 'progress',
    q: 'Where has my progress gone?',
    a: 'Everything you learn lives on this device until you sign in. Clear your browser, or pick up a different phone, and it is not there — because it was never anywhere else. Signing in fixes it in one tap and moves everything across.',
    link: { href: '/signin', label: 'Sign in and keep it' },
  },
  {
    id: 'counts',
    q: 'What actually counts on the card?',
    a: 'Only sentences you produced with nothing on screen to copy from. Not lessons finished, not days in a row, not taps. That is why the number moves slowly, and it is also why it is worth showing somebody.',
    link: { href: '/proof', label: 'See your card' },
  },
]

export const FEEDBACK_COPY = {
  eyebrow: 'TELL US WHAT DID NOT LAND',
  // Deliberately not a number: the list changes, and copy that counts its own
  // contents goes stale silently the first time it does.
  headline: 'Most things have an answer. Here are the ones people ask for.',
  form_head: 'Still stuck, or something is wrong?',
  /** One box. A required six-question survey is a wall. */
  prompt: 'What did not land?',
  hint: 'Be as blunt as you like — the sharpest thing you say is the most useful.',
  where: 'Where did it happen?',
  feel: 'How did it feel?',
  email: 'Email, only if you want an answer',
  /**
   * A product that says "anonymous" and attaches a device id is lying. So this says
   * exactly what travels with the message, and it is shown rather than buried.
   */
  attached: 'Sent with this: your stage, the vibe you were in, how many pieces you have, and your device — so we can work out what happened without asking you to describe it.',
  send: 'SEND IT',
  /** Not "thanks for your feedback", which reads as a black hole. */
  sent_head: 'Got it.',
  sent_body: 'Sam reads all of these, usually the same day. If you left an email you will hear back.',
  sent_cta: 'BACK TO MY VIBES',
} as const

export const FEEDBACK_WHERE = [
  'The vibes screen',
  'Inside a vibe',
  'The word puzzles',
  'The vocab library',
  'The proof card',
  'Signing in',
  'Somewhere else',
] as const

export const FEEDBACK_FEEL = [
  'confusing',
  'boring',
  'too hard',
  'too easy',
  'wrong Portuguese',
] as const
