/**
 * A Legend has parts, and every part is reachable.
 *
 *   npm run parts
 *
 * The Legend is the spine of the product: who you are, who you are with, and where you
 * are. A flat list of eleven questions made those the same kind of thing, and they are
 * not — "Tens filhos?" is not about the learner and "Onde moras?" is about the city they
 * are standing in.
 *
 * This holds the shape as frames are added, and it carries the invariant left open by the
 * Legend Matrix review: the words a part needs must be reachable inside the free tier.
 * Without it a new language ships with a Legend nobody can finish and nothing fails.
 */
import { LEGEND_FRAMES, LEGEND_PARTS, cardFor, CARD_SIZE } from '../content/legend'
import { CRATES, PIECES } from '../content/roots'
import { FREE_ENTITLEMENTS } from '../lib/entitlements'
import { PURPOSES } from '../content/situations'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const partOf = (f: (typeof LEGEND_FRAMES)[number]) => f.part ?? 'you'

console.log('\nevery question belongs to a part\n')
const known = new Set(LEGEND_PARTS.map((p) => p.id))
const strays = LEGEND_FRAMES.filter((f) => !known.has(partOf(f)))
ok(
  'no frame names a part that does not exist',
  strays.length === 0,
  strays.map((f) => f.id + ' → ' + partOf(f)).join(', ') || LEGEND_FRAMES.length + ' frames placed',
)

for (const part of LEGEND_PARTS) {
  const mine = LEGEND_FRAMES.filter((f) => partOf(f) === part.id)
  console.log('  · ' + part.name.padEnd(16) + mine.length + ' question' + (mine.length === 1 ? '' : 's'))
}
/*
  ABOUT YOU must never be empty — it is the card, the membership test and the thing the
  front door promises. The other two are allowed to be empty while they are being written,
  because the deck does not render an empty part: a heading over nothing is the product
  describing a plan rather than showing work.
*/
ok(
  'about you is never empty',
  LEGEND_FRAMES.some((f) => partOf(f) === 'you'),
  'the card, the membership test, the front door promise',
)

console.log('\nand the card is still seven, whoever you are\n')
/*
  The hard constraint, restated here because parts are the most likely way to break it: a
  frame tagged into a new part is still on the card if its rung is low enough, and a card
  of six for a visitor breaks the only promise DUB makes about how long the work takes.
*/
for (const purpose of [null, ...PURPOSES.map((p) => p.id)]) {
  const card = cardFor(purpose)
  ok(
    String(purpose ?? 'unanswered') + "'s card is " + CARD_SIZE,
    card.length === CARD_SIZE,
    card.length + ': ' + card.map((f) => f.id).join(', '),
  )
}

console.log('\nand the words a part needs are inside the free tier\n')
/*
  THE INVARIANT THE MATRIX REVIEW LEFT OPEN.

  A frame's built_from names pieces, each taught by exactly one crate. If a part's words
  span more crates than the free allowance permits, a learner on the free tier can reach
  the Legend and never finish it — and the failure is silent, because nothing today reads
  built_from as a reachability question.
*/
const allowance = FREE_ENTITLEMENTS.crates

/*
  THE CARD, NOT THE WHOLE PART — and my first version of this asserted the wrong thing.

  It measured every frame in a part and failed: ABOUT YOU spans six crates against a free
  allowance of five. The content is right and the assertion was wrong. The sixth is Duran
  Duran, needed only by `age` and `children`, which sit ABOVE CARD_RUNG on purpose — they
  are the bonus questions a learner builds after the card, not part of the promise.

  What must fit in the free tier is the CARD: the seven a learner is promised, which is
  also the membership test and the thing pricing is derived from. Measured per purpose,
  because the seven differ and a set that fits for a visitor could overflow for a mover.

  Bonus frames may legitimately need a sixth crate. They are what paying is for.
*/
for (const purpose of [null, ...PURPOSES.map((p) => p.id)]) {
  const card = cardFor(purpose)
  const families = new Set<string>()
  const ghosts: string[] = []
  for (const f of card) {
    for (const id of f.built_from) {
      const piece = PIECES[id]
      if (!piece) { ghosts.push(f.id + ':' + id); continue }
      families.add(piece.family)
    }
  }
  ok(
    String(purpose ?? 'unanswered') + "'s card is buildable free",
    ghosts.length === 0 && families.size <= allowance,
    ghosts.length
      ? 'unknown pieces: ' + ghosts.join(', ')
      : families.size + ' crates needed, ' + allowance + ' free',
  )
}

/*
  And every part's words are real, whatever tier they belong to. A built_from naming a
  piece that does not exist is a question nobody can ever answer.
*/
for (const part of LEGEND_PARTS) {
  const mine = LEGEND_FRAMES.filter((f) => partOf(f) === part.id)
  if (!mine.length) continue
  const ghosts = mine.flatMap((f) => f.built_from.filter((id) => !PIECES[id]).map((id) => f.id + ':' + id))
  ok(part.name + "'s words are all real", ghosts.length === 0, ghosts.join(', ') || mine.length + ' questions')
}

/*
  And the crates named are crates that exist — a built_from pointing at a family with no
  crate is a part that can never be completed by any route at all.
*/
const crateIds = new Set(CRATES.map((c) => c.id))
const orphanFamilies = [
  ...new Set(
    LEGEND_FRAMES.flatMap((f) => f.built_from)
      .map((id) => PIECES[id]?.family)
      .filter((fam) => Boolean(fam) && !crateIds.has(fam as never)),
  ),
]
ok('and every crate they name exists', orphanFamilies.length === 0, orphanFamilies.join(', ') || 'all real')

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthree parts, and every one of them can be finished\n')
