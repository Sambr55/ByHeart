/**
 * THE TABLE, AND THE TEN MINUTES THAT MAKE IT WORTH SITTING AT.
 *
 * Sam: "The problem with ex-pats is they hang out together and never feel a pressing need
 * to learn the new language. Take a look at timeleft.com — why cant we do that?"
 *
 * WE CAN, AND THE FORMAT IS THE DIFFERENCE. Timeleft seats six strangers for dinner and
 * language is a dropdown on the booking form; in Lisbon alone that is 20,000 members and
 * a hundred tables a week, every one of them self-declared. Sitting an expat at a table
 * where English is one of two options is sitting them at a table where English wins,
 * which is Sam's diagnosis exactly.
 *
 * SO THE FIRST TEN MINUTES ARE IN PORTUGUESE, AND THEN THEY ARE NOT. That is the whole
 * mechanic and every word of it matters:
 *
 *   TEN MINUTES, not the evening. An evening in a language you half-have is an endurance
 *   test, and the people who most need this are the ones who would not book it. Ten
 *   minutes is a thing somebody can picture themselves surviving.
 *
 *   IT HAS A DEFINED END. The relief is the point: after it, English with no shame. A
 *   resolution to "try to speak Portuguese tonight" is broken by nine o'clock and feels
 *   like a personal failure; a ritual that finishes on time cannot be failed.
 *
 *   EVERYBODY AT THE TABLE HAS ALREADY DONE IT. This is the part no other app can offer.
 *   Nobody is wondering whether they are the worst one there, because the seat was earned
 *   by saying these exact sentences out loud to a microphone. The social pressure runs
 *   towards Portuguese for the first time instead of away from it.
 *
 *   IT IS THE LEGEND, WHICH THEY HAVE ALREADY SAID. Not a topic, not an icebreaker: name,
 *   where you are from, why you came. The thing DUB taught first, performed for the first
 *   time to people rather than to a phone. That is the product's whole promise arriving.
 *
 * DUB MATCHES, IT DOES NOT HOST. Sam: "match the people, not run the dinners." No venue
 * is booked, no money changes hands, nobody is chased for a no-show. A table names a
 * place somebody else already chose and a time, and what happens there is between the
 * people who turn up.
 */

export const TABLE = {
  /** What it is called, in the product. Never "event", never "meet-up". */
  name: 'A table',
  /** The one line that explains it, on the card that offers one. */
  what: 'Six people who can already say the same things, and one evening.',
  /**
   * THE RULE, AND IT IS THE PRODUCT. Said in full wherever a seat is offered, because
   * somebody deciding whether to come is deciding about this sentence and nothing else.
   */
  rule: 'The first ten minutes are in Portuguese. Then English, with no shame.',
  /** Why that is survivable, for the person whose stomach just dropped. */
  reassurance:
    'Everybody at the table has already said these sentences out loud. That is how they got a seat.',
  /** What the ten minutes actually consists of, so nobody has to wonder. */
  howItGoes: [
    'You say your name, where you are from, and why you came.',
    'So does everybody else. It takes about a minute each.',
    'Then somebody orders a drink in English and the evening carries on.',
  ],
  /** What DUB does and does not do, said plainly on the page rather than in a FAQ. */
  weDo: 'We put the table together and tell you where and when.',
  weDont: 'We do not book it, pay for it, or come with you.',
  /** The bar for a seat, in the learner's own terms. See COLD_FLOOR in lib/tables.ts. */
  bar: 'You need to be able to say three things about yourself out loud, cold.',
  /** When somebody has not earned a seat yet. Never "you are not good enough". */
  notYet:
    'Not yet — say three of your Legend out loud with the screen off and the next table is yours.',
} as const

/**
 * ASKING FOR NOTIFICATIONS AT THE ONE MOMENT SOMEBODY WANTS THEM.
 *
 * Sam: "how do we get people to turn notifications on?"
 *
 * THE OLD ASK WAS IN THE WRONG PLACE AND FOR THE WRONG THING. It lives in the inbox and
 * on The Line — rooms a new learner has no reason to open — and what it offers is "send me
 * one every morning", which is a daily habit. This product's whole position is that there
 * are no streaks and nothing to keep up, so the one thing it asks permission for is the
 * one thing it promises not to do. Unsurprisingly almost nobody says yes.
 *
 * A TABLE IS A REASON. "We will tell you when there is a table" is a thing a person
 * actually wants, because a table is six seats and they go; somebody who finds out on
 * Thursday that Tuesday happened has lost something real. That is the difference between
 * permission asked for a feature and permission asked for a consequence.
 *
 * AND IT IS ASKED ONCE, AFTER A SEAT. The browser prompt is one-shot and permanent — a
 * person who taps "don't allow" while unconvinced can never be asked again by anybody —
 * so the ask has to arrive when the answer is obviously yes. Taking a seat is that moment:
 * they have committed to an evening and the only thing left to want is to be told if it
 * changes.
 */
export const TABLE_PUSH = {
  /** On the button. What it will do, not what it is. */
  cta: 'TELL ME WHEN THERE IS A TABLE',
  /** Once it is on. The promise, kept narrow so it is keepable. */
  on: 'You will hear when a table goes up. Nothing else.',
  /** Where DUB has to be before a phone can be told anything. See PushToggle. */
  install: 'Put DUB on your home screen and we can tell you when a table goes up.',
} as const

/**
 * HOW MUCH SOMEBODY CAN SAY, AS A BAND RATHER THAN A FIGURE.
 *
 * The seat stores a count and this is the only thing allowed to render it. A number beside
 * a name is a leaderboard, and a leaderboard at a dinner table is the sorting-into-grades
 * that the matching rule deliberately refuses — see lib/tables.ts. Three bands, none of
 * them a judgement, and the top one deliberately does not say "fluent" because nobody at
 * this table is and claiming it would be the one lie that ruins an evening.
 */
export function band(saidCold: number): string {
  if (saidCold >= 25) return 'Can hold a conversation'
  if (saidCold >= 10) return 'Past the basics'
  return 'Can introduce themselves'
}

/*
  THE RULES THEMSELVES, HERE RATHER THAN IN lib/tables.ts.

  That file imports the database and is server-only, so nothing else can read it — not a
  check script, not a client component deciding whether to enable a button. These three
  are the whole of the matching rule and they are pure, so they live where anybody can
  ask them and there is one answer rather than a copy on each side.
*/
/** Six. Four is a conversation nobody can leave; eight is two conversations. */
export const SEATS = 6

/**
 * The floor: a learner who can introduce themselves out loud.
 *
 * Counted from proof lines marked `clean` — said with nothing on screen — against the
 * Legend sources, which is the same evidence clubOpen uses to open the Club. Three is the
 * floor rather than all seven, because the first ten minutes is name, where you are from
 * and why you came; demanding the full card would seat nobody and demanding one would
 * seat somebody who can say their name and then stop.
 */
export const COLD_FLOOR = 3

/**
 * WHETHER SOMEBODY CAN TAKE A SEAT, from their own record.
 *
 * Takes the proof rather than a user id, so this is pure and the caller decides whose
 * record it is — which also means the rule can be shown on screen before anybody has an
 * account, as the honest "here is what a seat asks of you".
 */
export function canSit(proof: { source: string; clean: boolean }[] | undefined): boolean {
  return saidCold(proof) >= COLD_FLOOR
}

/** How many sentences they have produced cold. The one number this feature reads. */
export function saidCold(proof: { source: string; clean: boolean }[] | undefined): number {
  return (proof ?? []).filter((p) => p.clean).length
}
