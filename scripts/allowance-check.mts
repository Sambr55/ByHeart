/**
 * The free allowance says one number, everywhere.
 *
 *   npm run allowance
 *
 * FREE_CRATES has been 5 since the Legend door and the free tier were deliberately
 * decoupled — the door became "the basics plus three vibes you chose" and the allowance
 * did not move with it. None of the copy followed. So /pro offered "three vibes", the
 * help page answered "why can I only open three", /account said "the free three", and the
 * gateway fired at five underneath all of it.
 *
 * Sam has never once seen the paywall, and this is half of why: he was watching for the
 * third vibe. The other half is that finished vibes release their slot, so somebody who
 * finishes what they start is never at the cap at all.
 *
 * THE TWO THREES ARE DIFFERENT AND BOTH ARE REAL. VIBES_FOR_LEGEND is three — the door is
 * the basics plus three vibes you chose — and sentences about the DOOR may say three for
 * ever. What this refuses is a sentence about the ALLOWANCE naming a number that is not
 * FREE_CRATES, which is why it matches on the phrasing rather than on the digit.
 */
import { readFileSync } from 'node:fs'
import { FREE_CRATES } from '../content/legend'

const problems: string[] = []
const ok = (name: string, pass: boolean, detail = '') => {
  console.log('  ' + (pass ? '✓' : '✗') + ' ' + name + (detail ? '   ' + detail : ''))
  if (!pass) problems.push(name + (detail ? ' — ' + detail : ''))
}

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const right = WORDS[FREE_CRATES] ?? String(FREE_CRATES)

/*
  Sentences that are ABOUT the allowance, by the shape of the claim rather than the number.
  Each is a phrasing that can only mean "how many vibes you get free".
*/
const NUM = '(one|two|three|four|five|six|seven|eight|nine|ten|\\d+)'
const ALLOWANCE = [
  new RegExp('the free ' + NUM + '\\b', 'gi'),
  new RegExp('only open ' + NUM + ' vibes', 'gi'),
  new RegExp(NUM + ' vibes is the free tier', 'gi'),
  new RegExp(NUM + ' vibes, chosen by you', 'gi'),
  new RegExp('free ' + NUM + ' are gone', 'gi'),
]

const FILES = [
  'content/help.ts',
  'content/front-door.ts',
  'content/club.ts',
  'lib/entitlements.ts',
  'components/Pro.tsx',
  'components/Path.tsx',
  'components/Account.tsx',
]

console.log('\nthe free allowance, said the same everywhere\n')
console.log('  FREE_CRATES is ' + FREE_CRATES + ' — copy about the allowance must say "' + right + '"\n')

for (const file of FILES) {
  let src = ''
  try {
    src = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  /* Comments explain history and are allowed to name old numbers. */
  const live = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
  for (const pattern of ALLOWANCE) {
    for (const m of live.matchAll(pattern)) {
      const said = (m[1] ?? '').toLowerCase()
      if (!said || said === right) continue
      ok(file + ' says "' + m[0].trim() + '"', false, 'the allowance is ' + right)
    }
  }
}

if (!problems.length) ok('no copy names a different allowance', true, FILES.length + ' files read')

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  process.exit(1)
}
console.log('\none allowance, one number, wherever it is said')
