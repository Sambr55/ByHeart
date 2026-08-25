/**
 * Dub Club — the home for somebody who has already been through DUB once.
 *
 * The gap this fills is not cosmetic. Until now a returning learner re-entered through
 * the front door every time: the proposition, the Goose demo, the deal, the picker. So
 * the whole product read as a single session repeated, and there was nowhere that knew
 * you had been here before. That is the difference between a demo and something somebody
 * comes back to.
 *
 * Two rules the copy here follows.
 *
 * It never counts anything that can fall. No streak, no percentage, no "you have not
 * practised in four days" — the entire thesis of DUB is that turning up is not the
 * measure, and a home screen is exactly where a product usually betrays that.
 *
 * And every line is about something the learner did, not something they owe.
 */

export const CLUB = {
  name: 'DUB CLUB',
  /** Shown once, ever, the first time somebody arrives having finished a section. */
  welcome: {
    eyebrow: 'YOU ARE IN',
    headline: 'Welcome to Dub Club.',
    body: 'You have been all the way through once, which is the only membership test there is. This is your way in from now on — no front door, no pitch, no starting again.',
    body_two: 'Nothing here counts days or asks where you have been. It just shows you what you can say and what is worth doing next.',
    cta: 'GOOD',
  },
  /** The masthead line when a learner has a capability. The fallback is never empty. */
  greeting: 'Here is where you are.',
  nothing_new:
    'Nothing new is waiting. That is allowed — going through something again is how most of this sticks.',
  moves_label: 'WORTH DOING NEXT',
  footer: 'Find yourself in another language.',
} as const

/**
 * The moves, as copy.
 *
 * Three to five, never four tiles — a tile is a destination and a move is a reason. Each
 * one names what it is FOR, and the component fills in what makes it specific to this
 * learner today.
 */
export const MOVES = {
  /*
    The one number in DUB that is allowed to lead.

    Everything else in this product refuses to count — no streak, no XP, no percentage —
    and this is the exception, deliberately: it counts things you can say ABOUT YOURSELF.
    It cannot be inflated by opening the app, it goes up only when a crate has fed it, and
    unlike a streak it never goes down.
  */
  legend: { verb: 'Your Legend', why: 'The minute about yourself you can already do.' },
  legend_new: { verb: 'Two new Legend cards', why: 'Your last vibe opened them. Two minutes each.' },
  /*
    The rehearsal that actually matters, and the only move here with no preamble.

    One question, no warning, and a beat of silence before the answer is available. That
    silence is the exact half-second in a bar where you either have it or you do not, and
    it is the only way to practise the thing that actually goes wrong. Never scored — the
    moment a number is attached to being put on the spot, it becomes the anxiety it
    exists to remove.
  */
  cold: { verb: 'Cold open', why: 'One question, no warning. The half-second that decides it.' },
  drop: { verb: 'Catch the drop', why: 'It expires. Nothing else here does.' },
  line: { verb: 'Take today’s line', why: 'Twenty seconds, and it is different every morning.' },
  resume: { verb: 'Pick up where you stopped', why: 'There is more in this one your stage now reaches.' },
  open: { verb: 'Open a new vibe', why: 'Something else you already carry around with you.' },
  again: { verb: 'Go through one again', why: 'It stays yours, and the second pass is where it sets.' },
  proof: { verb: 'See what you can say', why: 'Only the sentences you produced with nothing to copy from.' },
  library: { verb: 'Look something up', why: 'Every word DUB teaches, and which of them are yours.' },
} as const
