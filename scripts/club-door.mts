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
import {
  LEGEND_CARD,
  LEGEND_FRAMES,
  cardDone,
  cardToGo,
  clubOpen,
  fillFrame,
  frameApplies,
  isAnswered,
} from '../content/legend'
import { say } from '../content/numbers'

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

console.log('\nthe card fits a life that is not mine\n')
/*
  Four faults, one cause: somebody else's life written into the frames.

  "E o que fazem?" assumed children, and more than one, and one of them at university.
  "Tenho {n}. Chamam-se {names}." assumed you had them at all. And two cards had no
  slots — a fixed sentence put in the learner's mouth — which also made them impossible
  to answer, so the Club told somebody who had finished everything that two questions
  were left.
*/
const F = (id: string) => LEGEND_FRAMES.find((f) => f.id === id)!
const ans = (id: string, values: Record<string, string>) => ({ frame_id: id, values })

ok('no card is a fixed sentence with nothing to choose', LEGEND_FRAMES.every((f) => f.slots.length))
ok(
  'childless is an answer, not an empty field',
  isAnswered(F('children'), { count: 'nenhum' }),
  fillFrame(F('children'), { count: 'nenhum' }, 'm'),
)
ok(
  'one child is a different sentence from three',
  fillFrame(F('children'), { count: 'um filho', name: 'Tom' }, 'm') !==
    fillFrame(F('children'), { count: 'três filhos' }, 'm'),
  fillFrame(F('children'), { count: 'um filho', name: 'Tom' }, 'm'),
)
ok(
  'nobody childless is asked what their children do',
  !frameApplies(F('children_doing'), [ans('children', { count: 'nenhum' })]),
)
ok(
  'and somebody with children is',
  frameApplies(F('children_doing'), [ans('children', { count: 'três filhos' })]),
)

console.log('\nthe count the Club shows\n')
const cardIds = LEGEND_CARD.map((f) => f.id)
ok(
  'answering every card leaves nothing outstanding',
  cardToGo(cardIds, cardIds.map((id) => ans(id, {}))) === 0,
  String(cardToGo(cardIds, cardIds.map((id) => ans(id, {})))),
)

console.log('\nnumbers are words\n')
ok('an age reads as Portuguese, not digits', fillFrame(F('age'), { n: '56' }, 'm').includes('cinquenta e seis'),
  fillFrame(F('age'), { n: '56' }, 'm'))
ok('and it is the European sixteen', say(16) === 'dezasseis', say(16))
ok('twenty-one composes with e', say(21) === 'vinte e um', say(21))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe way in is the card, and the ladder is what proves you can say it')
