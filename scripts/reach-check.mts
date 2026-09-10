/**
 * Every card the Club serves can be acted on.
 *
 *   npm run reach
 *
 * A room's only call to action is SAY IT COLD, which goes to /errand/<id>. That route
 * resolved ids against SITUATIONS alone, and drop rooms do not live there — they hang off
 * `Drop.situations`. Drops sort first, so the top three cards of the default Lisbon feed
 * were all unresolvable: open the Club, read the Portuguese, press the one button, and get
 * "NOT HERE — This page does not exist."
 *
 * The shortest path through the product ended on a 404, and nothing failed. Every check in
 * this repo asserted things ABOUT cards; none asked whether the place a card points at
 * exists. That is the gap this closes.
 *
 * Asserted over every chapter and every purpose, because the feed differs by both and a
 * room reachable only to a mover is exactly the kind that goes unnoticed.
 */
import { CHAPTERS } from '../content/chapters'
import { feedFor, roomById } from '../content/feed'
import { PURPOSES } from '../content/situations'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nevery room the Club can serve resolves to a page\n')

const seen = new Set<string>()
let checked = 0
const dead: string[] = []

for (const chapter of CHAPTERS.filter((c) => c.open)) {
  for (const purpose of [null, ...PURPOSES.map((p) => p.id)]) {
    for (const card of feedFor(chapter.id, undefined, purpose)) {
      if (card.kind !== 'situation') continue
      const id = card.situation.id
      if (seen.has(id)) continue
      seen.add(id)
      checked++
      if (!roomById(id, chapter.id)) dead.push(chapter.id + '/' + id)
    }
  }
}

console.log('  ' + checked + ' distinct rooms across ' + CHAPTERS.filter((c) => c.open).length + ' open chapter(s) and every purpose')
ok(
  'no room points at a page that does not exist',
  dead.length === 0,
  dead.length ? dead.slice(0, 5).join(', ') : 'every SAY IT COLD lands',
)

/*
  The first card specifically, because that is the one everybody meets. A dead room
  anywhere is a bug; a dead room at the top of the default feed is the product's first
  impression.
*/
const first = feedFor('lisbon').find((c) => c.kind === 'situation')
ok(
  'and the first room in the default feed is one of them',
  Boolean(first && roomById(first.situation.id, 'lisbon')),
  first ? first.situation.id : 'no room in the feed at all',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat the Club offers, the product can honour\n')
