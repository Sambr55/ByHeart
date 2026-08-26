/**
 * Two signals, two jobs.
 *
 *   npm run ladder
 *
 * `clean` means right on the first submission with no helper. It was doing two jobs at
 * once: counting the sentences somebody can say cold, and deciding which vibes are open.
 *
 * The first is right and must stay strict — that count is the one number this product
 * asks to be judged on. The second was punishing. A real run through the basics produces
 * three releases and, quite normally, zero clean ones, because getting the word order
 * wrong once is what learning looks like. One tile puzzle decided whether five of eleven
 * vibes were open or ten, and the shelf greyed out six of them saying "opens at stage 2"
 * with nothing connecting that to anything the learner had done.
 *
 * They are separate now, and this is what stops them being quietly re-merged: the ladder
 * moves on a release, the proof card counts only what was said cold, and neither may
 * start doing the other's job.
 */
import { ROOTS, ROOTS_BY_FAMILY, rungReached, type Root } from '../content/roots'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const line = (r: Root, clean: boolean) => ({
  pt: r.transfer_prompt.answer,
  en: r.transfer_prompt.ask,
  source: 'release',
  clean,
})
const basics = (ROOTS_BY_FAMILY['the_basics' as never] ?? []) as Root[]
/** The proof card's own rule, imported in spirit: it counts clean lines and nothing else. */
const proofCount = (proof: { clean: boolean }[]) => proof.filter((p) => p.clean).length

console.log('\nthe ladder moves on a release\n')
ok('nothing done is rung 1', rungReached([]) === 1)
ok(
  'a fumbled release still moves it',
  rungReached(basics.slice(0, 3).map((r) => line(r, false))) === 2,
  'this is the whole change',
)
ok(
  'a clean release moves it the same amount',
  rungReached(basics.slice(0, 3).map((r) => line(r, true))) ===
    rungReached(basics.slice(0, 3).map((r) => line(r, false))),
  'first-time-perfect is not worth extra rungs',
)

console.log('\nthe proof card does not\n')
const fumbled = basics.slice(0, 3).map((r) => line(r, false))
ok('a fumbled release counts for nothing on the card', proofCount(fumbled) === 0)
ok('a clean one counts', proofCount(basics.slice(0, 3).map((r) => line(r, true))) === 3)
ok(
  'so the two can disagree, which is the point',
  rungReached(fumbled) > 1 && proofCount(fumbled) === 0,
  'rung ' + rungReached(fumbled) + ', card ' + proofCount(fumbled),
)

console.log('\nnothing else sneaks a rung\n')
for (const source of ['collision', 'nocue', 'legend']) {
  const proof = basics.slice(0, 3).map((r) => ({ ...line(r, true), source }))
  ok(
    'a ' + source + ' line does not move the ladder',
    rungReached(proof) === 1,
    'only a release means it was taken away first',
  )
}

console.log('\nthe ladder still tops out\n')
const everything = ROOTS.map((r) => line(r, false))
ok('six is the ceiling', rungReached(everything) === 6, String(rungReached(everything)))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe ladder counts work; the card counts cold. Neither does the other job')
