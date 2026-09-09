/**
 * Does the Legend keep the promise the session screen makes?
 *
 *   npm run legend
 *
 * A learner was told "two Legend cards just opened", tapped through, and found nothing
 * available. Both screens were internally correct and they were running different models.
 *
 * The Legend used to unlock card by card, on owning the specific words a card is built
 * from. That was deliberately deleted — every one of the eighteen words was taught in
 * exactly one vibe, so "unlock your Legend" quietly meant "play these eight particular
 * vibes", and two cards hung on a word that only exists inside a drop. It counts VIBES
 * now, and every card opens at once.
 *
 * The session screen was never told. It still computes framesUnlockedBy(owned, answered)
 * — the dead model — and announces cards the Legend has no concept of.
 *
 * Both now call legendStatus(), and the word-based functions are deleted rather than
 * deprecated — a model nobody can call cannot come back. This checks the invariant that
 * made the bug possible: the session screen may never promise something the Legend will
 * not honour, and it must count the vibe being finished right now.
 */
import { CRATES } from '../content/roots'
import { LEGEND_FRAMES, cratesToGo, frameForPurpose, legendStatus, legendUnlocked } from '../content/legend'
import type { Purpose } from '../content/situations'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const spending = CRATES.filter((c) => !c.drop && c.built !== false).map((c) => c.id)

/** What /legend will actually do with this many vibes finished. */
/**
 * How many cards a learner is actually offered — WHICH IS NOT THE SIZE OF THE TABLE.
 *
 * This returned LEGEND_FRAMES.length, so it asserted 11 against a deck that shows a
 * purpose-scoped subset. It passed while the Club displayed "8 of 11 answered" with three
 * questions nobody could action, and while `age` was rendered to everybody and openable by
 * nobody. A gate written to catch one screen disagreeing with another was blind to the live
 * instance of exactly that, because it never called the filter the deck is built from.
 *
 * Per purpose now, through frameForPurpose — the same predicate the deck, the Club counter
 * and cardFor all use.
 */
function legendOffers(done: string[], purpose: Purpose | null): number {
  if (!legendUnlocked(done)) return 0
  return LEGEND_FRAMES.filter((f) => frameForPurpose(f, purpose)).length
}

console.log('\nwhat the Legend does, per vibe finished\n')
/*
  Null last, because it is the odd one: a learner who has not answered set-up sees every
  frame, and the three purposes each lose the two that are not theirs.
*/
const WHO: (Purpose | null)[] = ['visiting', 'staying', 'moving', null]
for (const purpose of WHO) {
  const full = legendOffers(spending, purpose)
  for (let n = 0; n <= 6; n++) {
    const done = spending.slice(0, n)
    const offers = legendOffers(done, purpose)
    if (purpose === 'visiting') {
      console.log(
        '  ' + String(n).padStart(2) + ' vibes → ' +
          String(offers).padStart(2) + ' cards openable, ' + cratesToGo(done) + ' to go',
      )
    }
    // The only two states there are. Anything between them is the old model leaking.
    ok(
      String(purpose) + ' · ' + n + ' vibes offers all or nothing',
      offers === 0 || offers === full,
      String(offers) + ' of ' + full,
    )
  }
}

console.log('\nand every card the deck shows can be opened\n')
/*
  THE ASSERTION THAT WAS MISSING, and the one that would have caught `age`.

  A frame excluded from every purpose renders on the deck greyed, captioned NOT YET, and
  can never be opened by anybody — the product naming a price no payment settles. It is
  invisible to a count, because the count was of the table rather than of what a learner
  can reach.
*/
for (const purpose of WHO) {
  const shown = LEGEND_FRAMES.filter((f) => frameForPurpose(f, purpose))
  ok(
    String(purpose) + ' can reach every frame on their deck',
    shown.length > 0,
    shown.length + ' frames',
  )
}
/*
  REAL PURPOSES ONLY, and the first version of this got it wrong.

  frameForPurpose is `!f.purposes || !purpose || f.purposes.includes(purpose)`. The middle
  clause means a NULL purpose passes every frame — including one excluded from all three —
  so an assertion that included null in its sweep could never find an orphan. It passed
  against the exact bug it was written for.

  A learner who has answered set-up has one of the three. That is who this is about.
*/
const REAL: Purpose[] = ['visiting', 'staying', 'moving']
const orphans = LEGEND_FRAMES.filter((f) => !REAL.some((p) => frameForPurpose(f, p)))
ok(
  'no frame is excluded from every purpose',
  orphans.length === 0,
  orphans.length ? orphans.map((f) => f.id + ' (purposes: ' + JSON.stringify(f.purposes) + ')').join(', ') : 'every frame belongs to somebody',
)

console.log('\nthe promise\n')
/*
  The lag is gone rather than compensated for.

  This used to pass the vibe in progress, because sections_completed did not include it
  until the learner tapped through — so the session screen predicted the future while
  /legend read the present, and they disagreed for exactly one screen. SectionComplete
  records the section on mount now, so by the time anything on it speaks the section is
  real and every screen reads the same number.
*/
const payoffSaysOpen = (sectionsCompleted: string[]) =>
  legendStatus({ sectionsCompleted }).open

ok(
  'the fifth recorded vibe opens it',
  payoffSaysOpen(spending.slice(0, 5)),
  'recorded on mount, so this is the present rather than a prediction',
)
ok('four does not', !payoffSaysOpen(spending.slice(0, 4)))
ok(
  'and /legend reads the identical number',
  /*
    Against the visitor's own count, not the table's. The two screens agreeing is the
    subject; which number they agree on is a property of the learner.
  */
  legendOffers(spending.slice(0, 5), 'visiting') ===
    LEGEND_FRAMES.filter((f) => frameForPurpose(f, 'visiting')).length,
)

for (let n = 0; n <= 6; n++) {
  const done = spending.slice(0, n)
  const promised = payoffSaysOpen(done)
  const honoured = legendOffers(done, 'visiting') > 0
  ok(
    n + ' vibes: the session screen and the Legend agree',
    promised === honoured,
    promised && !honoured ? 'PROMISED AND NOT HONOURED' : '',
  )
}

console.log('\nwhere each screen sends you\n')
/*
  The same fault twice: a screen naming an action its destination cannot honour.

  First the session screen announced Legend cards the Legend had no concept of. Then the
  Club door said BUILD MY CARD and sent everybody to /legend, which is itself locked
  until five vibes — so a learner three short tapped the way in and hit a wall.

  Both were correct on their own screen. So this checks the join: for every number of
  vibes, where the door sends somebody must be somewhere they can act.
*/
const doorSends = (done: string[]) => (legendStatus({ sectionsCompleted: done }).open ? '/legend' : '/vibes')

for (let n = 0; n <= 6; n++) {
  const done = spending.slice(0, n)
  const target = doorSends(done)
  const legendUsable = legendStatus({ sectionsCompleted: done }).open
  console.log('  ' + String(n).padStart(2) + ' vibes → the door sends you to ' + target)
  ok(
    n + ' vibes: the door does not send you to a locked page',
    target !== '/legend' || legendUsable,
    target === '/legend' && !legendUsable ? 'BUILD MY CARD into a wall' : '',
  )
}

console.log('\nevery screen asks the same question\n')
/*
  The gap this file existed to close, reopened by the fix for it.

  legendStatus took a `currentFamily` so the session screen could count the vibe being
  finished — and /legend called legendUnlocked directly, without it. At four recorded
  plus the one in progress, the session screen said "your Legend is open, fill them in"
  and the Legend, one tap later, showed ten dashed cards.

  Checking that legendStatus agrees with itself proved nothing, because the two screens
  were not both calling it. So this reads the source: every screen that decides whether
  the Legend is open must go through the one function, and none may pass an argument
  that makes its answer differ from anybody else's.
*/
import { readFileSync } from 'node:fs'
const SCREENS = ['components/Legend.tsx', 'components/Journey.tsx', 'components/Club.tsx']
for (const file of SCREENS) {
  const src = readFileSync(file, 'utf8')
  const direct = /legendUnlocked\s*\(/.test(src)
  ok(
    file.replace('components/', '') + ' asks through legendStatus',
    !direct,
    direct ? 'calls legendUnlocked directly, so it can disagree with the others' : '',
  )
}
ok(
  'legendStatus takes no argument that could make screens differ',
  !/currentFamily/.test(readFileSync('content/legend.ts', 'utf8')),
  'a per-caller flag is how the two disagreed in the first place',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nnothing is announced that the Legend will not honour')
