/**
 * Who gets into Dub Club — Lisbon?
 *
 *   npm run club
 *
 * The Club was the most important threshold in the product and it had no door: /club
 * rendered for anybody who typed the address. The welcome CEREMONY was gated; the room
 * behind it was not. And the welcome copy said the test was having "been all the way
 * through once" — attendance — in a product whose entire argument is that nothing is
 * earned by turning up.
 *
 * Now membership is something you can be outside of, so it is something that can be
 * wrongly granted or wrongly refused. Both are checked here, against the predicate the
 * app itself uses rather than a copy of its logic.
 */
import { LEGEND_CARD, LEGEND_FRAMES, cardDone, cardToGo, clubOpen } from '../content/legend'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const all = LEGEND_CARD.map((f) => f.id)
const harder = LEGEND_FRAMES.filter((f) => f.rung > 2).map((f) => f.id)

console.log('\nthe card\n')
ok('is the seven questions a stranger asks', LEGEND_CARD.length === 7, String(LEGEND_CARD.length))
ok('is entirely rung 1–2', LEGEND_CARD.every((f) => f.rung <= 2))
ok('leaves the harder three for inside', harder.length === 3, harder.join(', '))

console.log('\nthe door\n')
ok('a brand new learner is outside', !clubOpen({ answeredFrameIds: [], rung: 1 }))
ok('most of a card is still outside', !clubOpen({ answeredFrameIds: all.slice(0, 6), rung: 2 }))
ok(
  'a finished card with no cold speech is still outside',
  !clubOpen({ answeredFrameIds: all, rung: 1 }),
  'the ladder is what measures speaking',
)
ok('a finished card plus rung 2 is in', clubOpen({ answeredFrameIds: all, rung: 2 }))
ok(
  'answering the HARD three does not sneak you in',
  !clubOpen({ answeredFrameIds: harder, rung: 6 }),
  'those are what you build inside',
)

console.log('\nnobody already inside is put back out\n')
ok(
  'an existing member with nothing on their card stays in',
  clubOpen({ answeredFrameIds: [], rung: 1, welcomedAt: '2026-08-01T00:00:00.000Z' }),
  'grandfathered',
)

console.log('\ncounting down\n')
ok('an empty card has seven to go', cardToGo([]) === 7, String(cardToGo([])))
ok('a full card has none to go', cardToGo(all) === 0)
ok('cardDone agrees with cardToGo', cardDone(all) && !cardDone(all.slice(0, 6)))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe way in is the card, and the ladder is what proves you can say it')
