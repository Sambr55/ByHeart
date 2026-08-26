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
import { LEGEND_FRAMES, cratesToGo, legendStatus, legendUnlocked } from '../content/legend'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const spending = CRATES.filter((c) => !c.drop && c.built !== false).map((c) => c.id)

/** What /legend will actually do with this many vibes finished. */
function legendOffers(done: string[]): number {
  return legendUnlocked(done) ? LEGEND_FRAMES.length : 0
}

console.log('\nwhat the Legend does, per vibe finished\n')
for (let n = 0; n <= 6; n++) {
  const done = spending.slice(0, n)
  const offers = legendOffers(done)
  const toGo = cratesToGo(done)
  console.log(
    '  ' + String(n).padStart(2) + ' vibes → ' +
      String(offers).padStart(2) + ' cards openable, ' + toGo + ' to go',
  )
  // The only two states there are. Anything between them is the old model leaking.
  ok(
    n + ' vibes offers all or nothing',
    offers === 0 || offers === LEGEND_FRAMES.length,
    String(offers),
  )
}

console.log('\nthe promise\n')
/**
 * The real thing both screens call. Not a copy of their logic — the same function, so a
 * test passing here means the product agrees with itself rather than with this file.
 */
const payoffSaysOpen = (sectionsCompleted: string[], currentFamily: string | null) =>
  legendStatus({ sectionsCompleted, currentFamily }).open

const four = spending.slice(0, 4)
ok(
  'finishing the fifth vibe says the Legend is open',
  payoffSaysOpen(four, spending[4]),
  'sections_completed lags by one at this screen',
)
ok('finishing the fourth does not', !payoffSaysOpen(spending.slice(0, 3), spending[3]))
ok(
  'and the Legend agrees once it is recorded',
  legendOffers([...four, spending[4]]) === LEGEND_FRAMES.length,
)

for (let n = 0; n <= 6; n++) {
  const done = spending.slice(0, n)
  const promised = payoffSaysOpen(done, null)
  const honoured = legendOffers(done) > 0
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

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nnothing is announced that the Legend will not honour')
