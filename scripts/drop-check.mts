/**
 * Drops — what they are now, and where they turn up.
 *
 *   npm run drops
 *
 * A drop used to be a vibe with an expiry: six Duran Duran song titles, gone the morning
 * after the gig. Fun idea about a band, no use to somebody who wants to go — because what
 * you need that week is where the arena is, whether there are tickets left, which line goes
 * there, and how to ask somebody to come with you.
 *
 * These check the shape of the replacement and, most of all, the ranking: a drop expires
 * and nothing else in the Club does, so it goes first. That is a rule about urgency rather
 * than about quality, and it needs no engagement signal to work.
 */
import { DROPS } from '../content/drops'
import { CRATES } from '../content/roots'
import { dropDaysLeft, dropLive, dropsFor, feedFor } from '../content/feed'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nwhat a drop is\n')
ok('there is at least one', DROPS.length > 0, DROPS.length + ' authored')
for (const d of DROPS) {
  ok(
    d.id + ' is a cluster, not a single room',
    d.situations.length >= 3,
    d.situations.map((s) => s.title).join(' · '),
  )
  // Getting there, getting in, and asking somebody — the three things an evening needs.
  ok(
    d.id + ' ends on the invitation',
    /\?$/.test(d.situations[d.situations.length - 1].release.answer.trim()),
    d.situations[d.situations.length - 1].release.answer,
  )
}

console.log('\nthe song titles stayed on the shelf\n')
/*
  The vibe is a vibe again. It is about a band, and a band does not expire — putting the
  gig's clock on six song titles meant somebody who liked Duran Duran could only learn them
  in a three-week window once a year.
*/
ok(
  'no vibe expires any more',
  !CRATES.some((c) => c.drop),
  CRATES.filter((c) => c.drop).map((c) => c.id).join(' '),
)
ok(
  'and Duran Duran is still there',
  CRATES.some((c) => c.id === 'duran_duran_lisboa'),
)

console.log('\nwhen it is live\n')
const d = DROPS[0]
const day = (iso: string) => new Date(iso + 'T12:00:00Z')
const event = new Date(d.on + 'T12:00:00Z')
const before = new Date(event)
before.setUTCDate(before.getUTCDate() - 60)
const inside = new Date(event)
inside.setUTCDate(inside.getUTCDate() - 5)
const after = new Date(event)
after.setUTCDate(after.getUTCDate() + 2)

ok('not two months out', !dropLive(d, before), 'urgency spent early is urgency spent')
ok('live in the week before', dropLive(d, inside), dropDaysLeft(d, inside) + ' days left')
ok('live on the day', dropLive(d, day(d.on)))
ok('gone the morning after', !dropLive(d, after))

console.log('\nand where it turns up\n')
ok('nothing when it is not live', dropsFor('lisbon', before).length === 0)
ok(
  'every room of it when it is',
  dropsFor('lisbon', inside).length === d.situations.length,
  String(dropsFor('lisbon', inside).length),
)
/*
  Ahead of the standing rooms, and this is the whole ranking. The pharmacy will be there
  next month; the gig will not.
*/
const feed = feedFor('lisbon')
const previewed = dropsFor('lisbon', before, true)
ok('a preview can open it early', previewed.length === d.situations.length)
const withDrop = [...previewed, ...feed.filter((c) => !(c.kind === 'situation' && c.drop))]
ok(
  'and it sits ahead of the standing rooms',
  withDrop[0].kind === 'situation' && Boolean(withDrop[0].drop),
  withDrop.slice(0, 2).map((c) => c.id).join(' → '),
)

console.log('\nand it says it is one\n')
for (const card of previewed) {
  ok(
    card.id + ' carries its event',
    card.kind === 'situation' && card.drop?.event === d.event,
  )
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na cluster, pegged to a night, ahead of everything that is not going anywhere')
