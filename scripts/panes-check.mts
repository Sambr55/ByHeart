/**
 * A card with nothing behind it has no behind.
 *
 *   npm run panes
 *
 * Reported from the INSTALLED app rather than Safari, which is the whole point: "you can
 * push left and right on the home page". A browser's own overscroll absorbs a horizontal
 * drag at the edge of a page; a standalone PWA has no chrome to absorb it, so a lane that
 * should not exist becomes a panel somebody can drag onto.
 *
 * The cause was that the language lane rendered for every unlocked card. For an intro card
 * `IntroPane` shows the eyebrow, headline and body the FACE is already showing — so the
 * far side was a verbatim copy of the front, captioned "Keep swiping". Four of the eleven
 * intro cards did it; three are gesture-locked at the time and hide their lanes, which is
 * why `intro_how` — the only unlocked one — is the one a tester meets.
 *
 * Every other card kind was fine, and this asserts that too: a room's side is WHAT TO SAY,
 * an explainer's is its detail, a vocab card's is the forms. Those are all more than the
 * face, which is the test.
 */
import { INTRO_CARDS } from '../content/intro'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

/*
  The rule Feed.tsx applies, restated — and tied to the source below, because a copy that
  drifts from what it guards is a green check that means nothing.
*/
const hasPane = (c: (typeof INTRO_CARDS)[number]) =>
  Boolean(c.examples?.length) || c.asks === 'where'

const withPane = INTRO_CARDS.filter(hasPane)
const without = INTRO_CARDS.filter((c) => !hasPane(c))

note(`${INTRO_CARDS.length} intro cards · ${withPane.length} have a side worth revealing`)
note(`  no lanes: ${without.length} of them`)
/*
  TEN OF ELEVEN, AND THAT IS RIGHT — it looked wrong at first and is worth writing down.

  Six intro cards carry a `shows` specimen, which reads like a reason for a side pane. It
  is not: Specimen renders ON THE FACE (Feed.tsx, the intro branch), so those cards already
  show their extra content up front and a lane behind them would still be a copy. No intro
  card uses `examples` at all today, so only the city question — whose pane is a real form,
  Destination — has anything of its own.

  If an intro card is ever authored WITH examples, IntroPane starts showing something the
  face does not, and it gets its lanes back automatically.
*/

/*
  THE INVARIANT. An intro card without examples renders IntroPane, which is eyebrow +
  headline + body — exactly the three fields its face shows. So it must not get lanes.
*/
if (!without.length) {
  fail.push('every intro card now claims a side pane — the duplicate-face guard is untested')
}
/*
  NO INTRO CARD HAS A SIDE PANE NOW, and that is the eight-screen order rather than dead
  logic.

  This failed the moment the destination card went. `hasPane` is examples-or-asks-where,
  no intro card has ever used `examples`, and WHERE TO — whose pane was a real form rather
  than a copy of its own face — is not one of the eight screens: the city is asked inside
  set-up. So the one card that legitimately had a side no longer exists.

  Failing on that would be asserting that the product must keep a screen in order to keep a
  test honest. What this file is FOR is the opposite invariant — that a card with nothing
  behind it has no behind — and that is checked by `without.length` above and by the four
  source-level guards below, none of which depend on any card actually having a lane.

  So the condition is inverted into a note. If an intro card is ever authored with examples
  the lane logic wakes up on its own, and the guards below already prove Feed.tsx is still
  the thing deciding.
*/
if (!withPane.length) {
  note('  none have one today — the lane logic is guarded at source below rather than by a live card')
}

/*
  AND THE COMPONENT MUST STILL ASK. If the `sides` guard disappears from Feed.tsx, the
  lanes come back and this file keeps passing its own arithmetic.
*/
import { readFileSync } from 'node:fs'
const feed = readFileSync('components/Feed.tsx', 'utf8')
if (!/const sides = card\.kind !== 'intro' \|\| introHasPane\(card\)/.test(feed)) {
  fail.push('Feed.tsx no longer decides its lanes with introHasPane — this check tests only itself')
}
/*
  Both lanes, and faceLane, have to read it. faceLane especially: the face's index is
  1 + flow.length only while a lane sits to its LEFT, and computing that separately is the
  hard-coded lane arithmetic the component's own note warns about.
*/
for (const [what, re] of [
  ['the language lane', /hidden=\{locked \|\| !sides\}[\s\S]{0,220}order-1/],
  ['the away lane', /hidden=\{locked \|\| !sides\}[\s\S]{0,120}card-away/],
  ['faceLane', /const faceLane = \(sides \? 1 : 0\) \+ flow\.length/],
] as const) {
  if (!re.test(feed)) fail.push(`${what} no longer follows the sides guard`)
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('no card can be dragged onto a copy of itself')
