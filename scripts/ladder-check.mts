/**
 * The Club counts.
 *
 *   npm run ladder
 *
 * A learner could perform every errand in the Club and stay at stage 1 forever.
 * `rungReached` scored proof lines whose source is 'release' by matching the sentence
 * EXACTLY against a root's transfer answer, and room releases are a disjoint set of
 * strings — 45 rooms, zero matches. Everything done in the place the product calls home
 * was invisible to the thing that opens more of it, which is the whole of "I have yet to
 * see content getting more advanced".
 *
 * A room is not a root and should not be looked up as one. It declares its own rung and
 * now carries it on the line, under its own source.
 *
 * These assertions are about the SCORING, so they call it directly rather than driving a
 * browser. A first attempt drove the errand end to end and reported nothing banked — the
 * test re-seeded localStorage on every navigation, so it was measuring its own seed. The
 * scoring is a pure function and this is the honest way to hold it.
 */
import { rungReached, piecesIn, PIECES } from '../content/roots'
import { feedFor } from '../content/feed'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const rooms = feedFor('lisbon').filter((c) => c.kind === 'situation')
const asProof = rooms.map((c, i) => ({
  pt: c.kind === 'situation' ? c.situation.release.answer : '',
  en: 'x',
  source: 'room',
  clean: true,
  at: String(i + 1),
  rung: c.kind === 'situation' ? c.situation.rung : 1,
}))

console.log('\nthe Club moves the ladder\n')
ok('there are rooms to perform', rooms.length > 0, rooms.length + ' in the default feed')
ok(
  'performing them all raises the rung above 1',
  rungReached(asProof as never[]) > 1,
  'stage ' + rungReached(asProof as never[]) + ' after ' + asProof.length + ' rooms',
)
/*
  A single room, because "all of them" could pass on one lucky match. The rung a room is
  worth is its own, so one rung-3 room must reach stage 4 and nothing else.
*/
const one = asProof.find((l) => l.rung === 3)
if (one) {
  ok(
    'and one room is worth its own rung',
    rungReached([one] as never[]) === 4,
    'a rung-3 room → stage ' + rungReached([one] as never[]),
  )
}

console.log('\nand nothing is promoted that did not earn it\n')
/*
  Records written before rooms could count carry no rung. Treating a missing value as zero
  would be harmless; treating it as anything else would silently promote every learner on
  the next load, which is the kind of migration that cannot be undone.
*/
ok(
  'a room line with no rung is ignored',
  rungReached([{ pt: 'x', source: 'room', clean: true }] as never[]) === 1,
  'legacy records stay where they are',
)
ok('an empty record is stage 1', rungReached([] as never[]) === 1)

console.log('\nand the words in a room can be found\n')
/*
  piecesIn is what lets a cold claim reinforce the vocabulary the learner already owns. It
  is deliberately blunt, so what matters is that it finds something real and invents
  nothing: every id it returns must be a piece that exists.
*/
let withPieces = 0
const ghosts: string[] = []
for (const c of rooms) {
  if (c.kind !== 'situation') continue
  const found = piecesIn(c.situation.release.answer)
  if (found.length) withPieces++
  for (const id of found) if (!PIECES[id]) ghosts.push(id)
}
ok(
  'most rooms contain a taught word',
  withPieces > rooms.length / 2,
  withPieces + ' of ' + rooms.length,
)
ok('and every word it names is real', ghosts.length === 0, ghosts.slice(0, 4).join(', ') || 'no ghosts')

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat you do in the Club moves you up it\n')
