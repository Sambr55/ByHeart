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
  /**
   * A chapter is a CITY, not a language.
   *
   * Lisbon and Faro both speak pt-PT, so the pair cannot be the chapter — and a city is
   * the right size for the thing the Club is actually for: the people, places and
   * references that make you belong somewhere. Those are Lisbon-specific. "Portugal" is
   * an abstraction; Lisbon is a street you can picture yourself on.
   *
   * And like the Hard Rock shirt it is named after, nobody buys the Tokyo one because
   * they live in Tokyo. This is for people who are GOING.
   */
  name: 'DUB CLUB — LISBON',
  city: 'Lisbon',
  /** Shown once, ever, the first time somebody arrives having finished a section. */
  /**
   * The door, for somebody still outside it.
   *
   * There was no door: /club rendered for anybody who typed the address, and the welcome
   * copy said the membership test was having "been all the way through once" — which is
   * attendance, in a product whose whole argument is that nothing is earned by turning
   * up. The code was stricter than the copy, which is its own kind of wrong.
   */
  door: {
    eyebrow: 'NOT YET',
    headline: 'Dub Club — Lisbon.',
    body: 'The way in is your Legend Card: seven questions a stranger will ask you, answered in Portuguese, out of language you own. It is the one thing you genuinely need on your first day there.',
    /** Said plainly, because a door you cannot see the far side of is just a wall. */
    inside: 'Inside is the part that is about Lisbon rather than about Portuguese — the people, the places, and what to say when a conversation goes wrong.',
    cta: 'BUILD MY CARD',
    /** When the card is done but the ladder is not. Different problem, different sentence. */
    speak: 'Your card is written. Now say some of it cold, with nothing on screen — that is the whole test, and it is the only thing DUB has ever counted.',
  },

  welcome: {
    eyebrow: 'YOU ARE IN',
    headline: 'Welcome to Dub Club — Lisbon.',
    body: 'You can introduce yourself in Portuguese without reading it off a screen. That is the whole membership test, and it is the thing most people never get to. This is your way in from now on — no front door, no pitch, no starting again.',
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
