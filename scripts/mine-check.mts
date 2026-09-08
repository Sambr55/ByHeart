/**
 * Does a screen that says YOURS show only what is yours?
 *
 *   npm run mine
 *
 * Written for a bug that looked like a content error and was a missing argument.
 *
 * After a reset and the basics alone, the end-of-journey screen showed THINGS 30, DOING
 * 32, DESCRIBING 14, ASKING 9 — under a heading reading YOUR PORTUGUESE. Those are the
 * product-wide totals: every piece in DUB, presented to a learner who owned a handful as
 * their own. Reported as "completely wrong", which it was.
 *
 * The cause is that `Shelves` takes `pool` as its only filter. `owned` decides how a word
 * is DRAWN — full colour or dimmed — not whether it appears at all, and the prop is
 * documented "omit to shelve the whole bank". One of the two call sites passed a pool and
 * the other did not, so the same component told the truth on one screen and not the other.
 *
 * This asserts the property rather than the fix: a possessive heading may not be over a
 * count larger than the learner's inventory. That holds however Shelves is later changed,
 * and it fails on a screen that has not been written yet as readily as on this one.
 */
import { buildEntries } from '../components/Shelves'
import { PIECES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const TOTAL = Object.keys(PIECES).length

/** What a learner owns after one crate: the pieces its roots actually extract. */
const basics = (ROOTS_BY_FAMILY['the_basics'] ?? []).flatMap((r) => r.extracts).map((e) => e.id)
const owned = new Set(basics)

console.log('\nafter the basics, and nothing else\n')
ok('the crate teaches something', owned.size > 0, owned.size + ' pieces')
ok(
  'and it is a small part of the product',
  owned.size < TOTAL / 2,
  owned.size + ' of ' + TOTAL,
)

console.log('\nthe shelves under a possessive heading\n')
const pooled = buildEntries(owned, owned)
const whole = buildEntries(owned)
const count = (list: { shelf: string }[]) => {
  const m: Record<string, number> = {}
  for (const e of list) m[e.shelf] = (m[e.shelf] ?? 0) + 1
  return m
}
console.log('  pooled: ' + JSON.stringify(count(pooled)))
console.log('  whole bank: ' + JSON.stringify(count(whole)))

/*
  The heading says YOUR PORTUGUESE. Every row under it must be a word the learner has.
  Asserted per row rather than on the total: a total can be right while the wrong rows
  are in it, and the complaint was about seeing words they had never met.
*/
const strangers = pooled.filter((e) => !e.forms.some((f) => owned.has(f.id)))
ok(
  'every row on the shelf is owned',
  strangers.length === 0,
  strangers.length ? strangers.slice(0, 4).map((e) => e.key).join(', ') : String(pooled.length) + ' rows',
)
ok(
  'and there are fewer rows than there are pieces in the product',
  pooled.length < TOTAL,
  pooled.length + ' of ' + TOTAL,
)

/*
  The regression itself, stated as the difference between the two calls. If these ever
  match again, the pool has been dropped and the bug is back.
*/
ok(
  'pooling is what makes it theirs',
  pooled.length < whole.length,
  pooled.length + ' pooled vs ' + whole.length + ' unpooled',
)

console.log('\nand the call sites agree\n')
/*
  Read from the source, because this is a bug of omission and omission is invisible to a
  runtime check that only ever renders one of the two screens. Every Shelves under a
  possessive heading must pass a pool.
*/
import { readFileSync } from 'node:fs'
const journey = readFileSync('components/Journey.tsx', 'utf8')
const calls = [...journey.matchAll(/<Shelves[\s\S]*?\/>/g)].map((m) => m[0])
ok('both shelves are still there', calls.length >= 2, calls.length + ' call sites')
const unpooled = calls.filter((c) => !/pool=/.test(c))
ok(
  'no Shelves in the journey shelves the whole bank',
  unpooled.length === 0,
  unpooled.length ? unpooled.map((c) => c.replace(/\s+/g, ' ')).join(' | ') : 'every call pools',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat a screen calls yours is yours\n')
