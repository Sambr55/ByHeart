/**
 * The rules a generated card must obey, checked against every card it can produce.
 *
 *   npm run derive
 *
 * Generation is where content rules rot silently. An authored card is read by a person
 * before it ships; a derived card is not read by anybody, ever, so the rules have to be
 * executable or they are decoration.
 *
 * The set is small enough to exhaust: every piece in the product, every card each one can
 * produce. So this is not sampling — it is every card any learner could ever be shown.
 */
import { PIECES, ROOTS_BY_FAMILY, CRATES } from '../content/roots'
import { PARADIGM } from '../content/paradigms'
import { derivedFor, vouched, type DerivedCard } from '../engine/derive'
import { DERIVED_PER_SESSION, derivedCards } from '../content/feed'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** Everything, owned by one impossible learner, so every card that exists gets made. */
const everything = Object.fromEntries(Object.keys(PIECES).map((id) => [id, 'strong']))
const all = derivedFor({ inventory: everything, finished: [] })

console.log('\n' + all.length + ' cards can be generated in total\n')

console.log('nothing is invented\n')
/*
  The rule the whole system hangs on. Every Portuguese word on a card already exists in
  the paradigm table, authored. An LLM asked for Portuguese produces Brazilian forms
  confidently and at scale, and this is the check that means one never reaches anybody.
*/
// Through the exported rule rather than a second copy of it: a near-miss card carries a
// phrase, one word of which is new and the rest carried from something already authored.
const invented = all.filter((c) => !vouched(c))
ok(
  'every Portuguese string comes out of the table',
  !invented.length,
  invented.map((c) => c.target).join(' '),
)

// And the English, which is authored on the paradigm rather than derived by rule — "he
// cans" and "he sayes" are what a rule produces.
const emptyEn = all.filter((c) => !c.en.trim())
ok('every card says what it means', !emptyEn.length, emptyEn.map((c) => c.target).join(' '))

console.log('\none new thing per card\n')
/*
  A card may extend the person or the tense, never both. Somebody who owns `quero` and is
  handed `querias` has been given a person and a tense at once, and will learn neither.
*/
/*
  Asserted structurally rather than by reading the note, which is how this check was wrong
  first time round: it matched any note containing a comma, and every one of them does.
  The real rule is that a next-person card lands in the PRESENT — extending `queria` to a
  second person would hand somebody a person and a tense at once.
*/
const notPresent = all.filter((c) => {
  if (c.kind !== 'next_person') return false
  const p = PARADIGM[c.id.split('_')[2]]
  if (!p || p.kind !== 'verb') return true
  return !Object.values(p.present).some((f) => f.toLowerCase() === c.target.toLowerCase())
})
ok(
  'a card extends the person or the tense, not both',
  !notPresent.length,
  notPresent.map((c) => c.target).join(' '),
)

const noProvenance = all.filter((c) => !c.because.trim() || !c.from.target.trim())
ok('every card says where it came from', !noProvenance.length)

/*
  Never a compliment and never a score. "You have mastered quero" is a claim about somebody
  the product cannot support, and the whole of DUB counts one thing: sentences said cold.
*/
const BOASTS = /\b(master(ed)?|nailed|perfect|expert|well done|great job|streak|score|level \d)\b/i
const boastful = all.filter((c) => BOASTS.test(c.note) || BOASTS.test(c.because))
ok('nothing congratulates anybody', !boastful.length, boastful.map((c) => c.id).join(' '))

const DIGITS = /\b\d+\s+(cards?|due|left|to go|remaining)\b/i
const counting = all.filter((c) => DIGITS.test(c.note) || DIGITS.test(c.because))
ok('nothing counts what is outstanding', !counting.length, 'a debt is what makes people stop')

console.log('\nno card is ever shown twice\n')
const ids = all.map((c) => c.id)
ok('every id is unique', new Set(ids).size === ids.length)
// Finished cards are excluded by id, so the exclusion has to actually work.
const half = all.slice(0, Math.floor(all.length / 2)).map((c) => c.id)
const after = derivedFor({ inventory: everything, finished: half })
ok(
  'a card that has been done never comes back',
  after.every((c) => !half.includes(c.id)),
  all.length + ' → ' + after.length + ' once ' + half.length + ' are done',
)

console.log('\nnothing is offered that the learner already has\n')
/*
  The single most Duolingo-ish failure available here: being handed a form you have been
  using for a month. Checked per vibe rather than globally, because what somebody owns is
  what their vibes taught them.
*/
const families = CRATES.filter((c) => !c.drop).map((c) => c.id)
let redundant = 0
for (const family of families) {
  const inv: Record<string, string> = {}
  for (const root of (ROOTS_BY_FAMILY as Record<string, { extracts: { id: string }[] }[]>)[family] ?? []) {
    for (const e of root.extracts) inv[e.id] = 'strong'
  }
  const owned = new Set(Object.keys(inv))
  for (const card of derivedFor({ inventory: inv, finished: [] })) {
    const already = [...owned].some(
      (id) => PIECES[id]?.target.trim().toLowerCase() === card.target.toLowerCase(),
    )
    if (already) {
      redundant++
      console.log('      ' + family + ' is offered ' + card.target + ', which it already teaches')
    }
  }
}
ok('no card offers a form the learner already owns', redundant === 0)

console.log('\nand supply grows with what somebody knows\n')
/*
  The property that makes this the right shape rather than merely infinite: two vibes in
  you get a handful, eight vibes in there is more than you can get through.
*/
function ownedAfter(fams: string[]) {
  const inv: Record<string, string> = {}
  for (const f of fams) {
    for (const root of (ROOTS_BY_FAMILY as Record<string, { extracts: { id: string }[] }[]>)[f] ?? []) {
      for (const e of root.extracts) inv[e.id] = 'strong'
    }
  }
  return inv
}
const one = derivedFor({ inventory: ownedAfter(['the_basics']), finished: [] }).length
const three = derivedFor({
  inventory: ownedAfter(['the_basics', 'pulp_fiction', 'james_bond']),
  finished: [],
}).length
const many = derivedFor({ inventory: everything, finished: [] }).length
console.log('  1 vibe → ' + one + '   3 vibes → ' + three + '   everything → ' + many)
ok('more learned means more to practise', one <= three && three <= many)

console.log('\na session is a mix, not three of a kind\n')
/*
  Sorting put near misses first, correctly, and then the ration took the first three — so a
  learner with three outstanding near misses never saw a collision, which are the best cards
  here. The ordering meant to help was crowding out the thing it was ordering for.
*/
{
  const inv: Record<string, string> = {}
  for (const f of ['the_basics', 'pulp_fiction', 'james_bond', 'bridget_jones', 'audrey_hepburn']) {
    for (const root of (ROOTS_BY_FAMILY as Record<string, { extracts: { id: string }[] }[]>)[f] ?? []) {
      for (const e of root.extracts) inv[e.id] = 'strong'
    }
  }
  const available = derivedFor({ inventory: inv, finished: [] })
  const shown = derivedCards(available)
  const kinds = new Set(
    shown.map((c) => (c.kind === 'derived' ? c.card.kind : c.kind)),
  )
  console.log(
    '  ' + available.length + ' available, ' + shown.length + ' shown: ' + [...kinds].join(', '),
  )
  ok('at most three a session', shown.length <= DERIVED_PER_SESSION, String(shown.length))
  // Every kind that has something to offer gets a slot before any kind gets a second.
  const offered = new Set(available.map((c) => c.kind))
  ok(
    'every kind with something to say is heard',
    [...offered].every((k) => kinds.has(k)),
    [...offered].filter((k) => !kinds.has(k)).join(' ') || 'all of them',
  )
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nnothing invented, nothing repeated, nothing counted')
