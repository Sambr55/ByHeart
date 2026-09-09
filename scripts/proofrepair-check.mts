/**
 * The Legend's proof rows say what the learner actually said.
 *
 *   npm run proof:repair
 *
 * recordProof was banking `frame.en` — the raw template — so the proof card and the share
 * image showed "My name is {name}." under "Chamo-me Sam.", and a learner with two
 * daughters had a sentence about them stored against "I do not have children."
 *
 * The forward fix is one variable. This covers the rows already on phones, which do not
 * heal on their own: recordProof dedupes on `pt` and only ever upgrades `clean`.
 *
 * The repair must be conservative in a specific way — it rewrites one field, only where
 * the recomputed Portuguese matches the Portuguese already stored, and only when the
 * result is not itself a template. Everything below is a way of failing if it stops being.
 */
import { LEGEND_FRAMES, fillEnglish, fillFrame } from '../content/legend'
import { repairLegendEnglish, type LegendAnswer } from '../engine/learner'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** A phone as it was before the fix: answers on file, proof banked with the template. */
const answers: LegendAnswer[] = [
  { frame_id: 'name', values: { name: 'Sam' }, said_cold: 0, at: '1' },
  { frame_id: 'work', values: { thing: 'computadores' }, said_cold: 0, at: '1' },
  { frame_id: 'age', values: { n: '56' }, said_cold: 0, at: '1' },
]
const damaged = answers.map((a) => {
  const f = LEGEND_FRAMES.find((x) => x.id === a.frame_id)!
  return { pt: fillFrame(f, a.values, 'm'), en: f.en, source: 'legend' as const, clean: true, at: '1' }
})

/* Two rows that must come out untouched: a release line, and a legend line already right. */
const innocent = [
  { pt: 'Uma bica, se faz favor.', en: 'An espresso, please.', source: 'release' as const, clean: true, at: '2' },
  {
    pt: fillFrame(LEGEND_FRAMES.find((f) => f.id === 'name')!, { name: 'Ana' }, 'f'),
    en: fillEnglish(LEGEND_FRAMES.find((f) => f.id === 'name')!, { name: 'Ana' }),
    source: 'legend' as const, clean: false, at: '3',
  },
]

const after = repairLegendEnglish([...damaged, ...innocent], answers)

console.log('\nwhat the learner said, and what is stored under it\n')
for (const line of after) console.log('  ' + line.pt.padEnd(38) + line.en)

console.log('\nthe repair\n')
ok('no row is lost', after.length === damaged.length + innocent.length, after.length + ' rows')
ok(
  'no Legend row is left holding a template',
  !after.some((l) => l.source === 'legend' && /[{}]/.test(l.en)),
  after.filter((l) => /[{}]/.test(l.en)).map((l) => l.en).join(', ') || 'none',
)
/*
  The values, not merely the absence of braces. A repair that produced grammatical English
  about somebody else would pass a brace check and be worse than the bug.
*/
const named = after.find((l) => l.pt === 'Chamo-me Sam.')
ok('the name is the learner’s own', named?.en === 'My name is Sam.', named?.en ?? '(missing)')
const aged = after.find((l) => /cinquenta e seis/.test(l.pt))
ok('the age is the one they gave', aged?.en === 'I am 56 years old.', aged?.en ?? '(missing)')

console.log('\nand nothing else is touched\n')
const rel = after.find((l) => l.source === 'release')
ok('a release line is untouched', rel?.en === 'An espresso, please.', rel?.en ?? '(missing)')
const already = after.find((l) => l.at === '3')
ok('a Legend line already right is untouched', already?.en === 'My name is Ana.', already?.en ?? '(missing)')
ok(
  'clean and at survive the rewrite',
  after.every((l) => l.at) && named?.clean === true && already?.clean === false,
  'a rewrite that dropped these would silently downgrade proof',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const x of problems) console.log('  ✗ ' + x)
  process.exit(1)
}
console.log('\nwhat is on the proof card is what they said\n')
