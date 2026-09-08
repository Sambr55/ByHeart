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
import { PIECES, ROOTS_BY_FAMILY, linesFor, fold } from '../content/roots'
import type { CultureFamily } from '../content/roots'
import { capabilityEntries } from '../engine/journey'

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

console.log('\nthe examples come from crates you have opened\n')
/*
  THE SECOND HALF OF THE SAME COMPLAINT.

  "Apparently I have learned sair and amanhã — which I have not." The words were not on
  the shelf; they were in the EXAMPLE SENTENCES under a capability, which is a stronger
  claim than the shelf makes — the row says this is a thing you can now say.

  linesFor's third argument sorts lines from the learner's own crates first. The library
  passes it; the journey screen passed `undefined`. With nothing to sort by, `não` drew
  its two lines from tg_wingman_leave — Top Gun, rung 4 — so the basics alone produced
  "Não vou sair" and "Não vou amanhã".

  Asserted on the WORDS, not on the root the line comes from. My first attempt tested the
  crate and was wrong: "Um, dois, três" and "Boa noite" come from another crate and are
  made entirely of basics words, which makes them good examples — the sort exists precisely
  so a piece with few home-crate lines can still be shown something recognisable. What must
  not appear is a word DUB teaches somewhere the learner has not been, which is what sair
  and amanhã were.

  A word the graph never teaches (por, favor, muito) is left alone deliberately: this is
  about not claiming credit for vocabulary, not about restricting every function word to
  ones with their own card.
*/
const basicsOnly: CultureFamily[] = ['the_basics']
const acts = capabilityEntries([...owned])
ok('the basics give some capabilities', acts.length > 0, acts.length + ' acts')

/** Every taught word, by its surface form, so a line can be read against the graph. */
const taught = new Map<string, string>()
for (const [id, piece] of Object.entries(PIECES)) {
  const w = fold(String(piece.target).replace(/…/g, '').trim())
  if (w && !taught.has(w)) taught.set(w, id)
}

const strayed: string[] = []
for (const e of acts) {
  const lines = e.pieces.flatMap((piece) => linesFor(piece, 2, basicsOnly)).slice(0, 3)
  for (const line of lines) {
    for (const raw of String(line.target).split(/\s+/)) {
      const id = taught.get(fold(raw.replace(/[.,?!¿¡]/g, '')))
      if (id && !owned.has(id)) strayed.push(e.act + ': "' + line.target + '" teaches ' + id)
    }
  }
}
/*
  TWO FAULTS, AND ONLY ONE OF THEM IS CODE.

  The `undefined` argument was reaching four rungs into another crate — that is the bug,
  and it is fixed and asserted below. What remains is a handful of lines the BASICS
  THEMSELVES author out of words the basics do not teach: "Olá, bom dia", "Adeus, até
  logo", "Talvez amanhã". Those are a curriculum judgement, not a defect: a greeting
  probably should be shown whole, and 34 branches across the graph do the same thing.

  So this is measured and held at today's number rather than asserted to zero. It cannot
  grow without somebody deciding it should, and if the content is later changed the number
  comes down and the check says so. Asserting zero would either be a lie or would force a
  rewrite of the greetings on my own authority.
*/
const KNOWN_AHEAD = 5
const distinct = [...new Set(strayed.map((x) => x.split(': ')[1]))]
console.log('  · lines the basics author from words they do not teach: ' + distinct.length)
for (const d of distinct) console.log('    ' + d)
ok(
  'and no more of them than there were',
  distinct.length <= KNOWN_AHEAD,
  distinct.length + ' of at most ' + KNOWN_AHEAD + ' — all authored inside the basics',
)

/*
  And the call sites agree, for the same reason the Shelves ones do: this is a bug of
  omission, and a screen that shows example lines must say whose crates count.
*/
const lineCalls = [...journey.matchAll(/linesFor\([^)]*\)/g)].map((m) => m[0])
const blind = lineCalls.filter((c) => /undefined/.test(c))
ok(
  'no linesFor in the journey is left blind',
  blind.length === 0,
  blind.length ? blind.join(' | ') : lineCalls.length + ' call sites',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat a screen calls yours is yours\n')
