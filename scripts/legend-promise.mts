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
import { ROOTS_BY_FAMILY } from '../content/roots'
import { DOORWAY, LEGEND_FRAMES, doorwayToGo, frameForPurpose, legendStatus, legendUnlocked } from '../content/legend'
import type { Purpose } from '../content/situations'
import { roadFor } from '../content/road'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  THE DOORWAY, ROOT BY ROOT — the axis this whole file is swept along.

  It was a list of vibe ids, because the door used to be "five vibes finished". It is the
  basics finished now, so the axis is that vibe's roots: index n means "n lines of the
  basics played". Every assertion below is unchanged in meaning — only the unit moved.
*/
const doorway = (ROOTS_BY_FAMILY[DOORWAY] ?? []).map((r) => r.root_id)
const STEPS = doorway.length

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
/*
  THE THREE CHOSEN VIBES, granted throughout this file.

  The door is the basics plus three finished vibes now. Every assertion here is about
  SCREENS AGREEING WITH EACH OTHER — the session screen promising what /legend honours,
  the door sending somebody somewhere they can act — and none of them is about the
  threshold itself. Holding the second half constant keeps each of those questions
  answerable; varying it would test two things at once and tell you neither.

  The threshold has its own assertions at the bottom.
*/
const VIBES_DONE = ['top_gun', 'james_bond', 'bridget_jones']

function legendOffers(played: string[], purpose: Purpose | null): number {
  if (!legendUnlocked(played, VIBES_DONE)) return 0
  return LEGEND_FRAMES.filter((f) => frameForPurpose(f, purpose)).length
}

console.log('\nwhat the Legend does, per line of the basics played\n')
/*
  Null last, because it is the odd one: a learner who has not answered set-up sees every
  frame, and the three purposes each lose the two that are not theirs.
*/
const WHO: (Purpose | null)[] = ['visiting', 'staying', 'moving', null]
for (const purpose of WHO) {
  const full = legendOffers(doorway, purpose)
  for (let n = 0; n <= STEPS; n++) {
    const done = doorway.slice(0, n)
    const offers = legendOffers(done, purpose)
    if (purpose === 'visiting') {
      console.log(
        '  ' + String(n).padStart(2) + ' lines → ' +
          String(offers).padStart(2) + ' cards openable, ' + doorwayToGo(done) + ' to go',
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
const payoffSaysOpen = (rootsPlayed: string[]) =>
  legendStatus({ rootsPlayed, sectionsCompleted: VIBES_DONE }).open

ok(
  'the last line of the basics opens it, once three vibes are finished',
  payoffSaysOpen(doorway),
  'recorded on mount, so this is the present rather than a prediction',
)
ok('one line short does not', !payoffSaysOpen(doorway.slice(0, STEPS - 1)))
/*
  THE WARM-UP IS REQUIRED, AND NOTHING ELSE IS — which is the change this file now pins.

  Three assertions here used to defend the vibe toll: the basics alone must not open the
  door, two chosen vibes must not, and the basics must not count as one of three. All
  three described a door that no longer exists, and were failing for the right reason —
  the toll is gone. The basics teach the whole card, so requiring three chosen vibes first
  was asking for payment in a currency the card does not accept.

  What replaces them is the road's own promise: walking every step opens the Legend, and
  skipping the warm-up does not. See content/road.ts.
*/
ok(
  'the road without its warm-up does not open it',
  !legendStatus({ rootsPlayed: doorway, sectionsCompleted: [], purpose: 'visiting' }).open,
)
ok(
  'the warm-up alone does not open it',
  !legendStatus({ rootsPlayed: [], sectionsCompleted: ['top_gun'], purpose: 'visiting' }).open,
)
ok(
  'the whole road does',
  legendStatus({
    rootsPlayed: roadFor('visiting').map((s) => s.root),
    sectionsCompleted: ['top_gun'],
    purpose: 'visiting',
  }).open,
)
ok(
  'and /legend reads the identical number',
  /*
    Against the visitor's own count, not the table's. The two screens agreeing is the
    subject; which number they agree on is a property of the learner.
  */
  legendOffers(doorway, 'visiting') ===
    LEGEND_FRAMES.filter((f) => frameForPurpose(f, 'visiting')).length,
)

for (let n = 0; n <= STEPS; n++) {
  const done = doorway.slice(0, n)
  const promised = payoffSaysOpen(done)
  const honoured = legendOffers(done, 'visiting') > 0
  ok(
    n + ' lines: the session screen and the Legend agree',
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
const doorSends = (done: string[]) =>
  legendStatus({ rootsPlayed: done, sectionsCompleted: VIBES_DONE }).open ? '/legend' : '/vibes'

for (let n = 0; n <= STEPS; n++) {
  const done = doorway.slice(0, n)
  const target = doorSends(done)
  const legendUsable = legendStatus({ rootsPlayed: done, sectionsCompleted: VIBES_DONE }).open
  console.log('  ' + String(n).padStart(2) + ' lines → the door sends you to ' + target)
  ok(
    n + ' lines: the door does not send you to a locked page',
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
