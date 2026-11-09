/**
 * The sign-in ask on the Path (2026-11-09).
 *
 *   npm run signin-ask
 *
 * Sam: "Too many anonymous visitors… a log in two steps in" — skippable. Fails if it asks
 * too early, asks the same thing twice, keeps asking after "Not now" without a new reason,
 * blocks anybody, or could show to somebody already signed in.
 */
import { readFileSync } from 'node:fs'
import { askNow, reached } from '../components/path/signin-ask'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

console.log('\nwhen it asks')
ok('not after one room', askNow(1, 1, []) === null)
ok('after the second room', askNow(2, 1, []) === 'r2')
ok('"Not now" puts it away', askNow(3, 1, reached(2, 1)) === null)
ok('and it asks again after the fourth room', askNow(4, 1, reached(2, 1)) === 'r4')
ok('and once more at Level 2', askNow(5, 2, reached(4, 1)) === 'l2')
ok('then never again unprompted', askNow(12, 3, reached(5, 2)) === null)
ok('somebody who arrives at room 4 having never seen it is asked once, not twice', askNow(4, 1, []) === 'r4' && askNow(4, 1, reached(4, 1)) === null)

console.log('\nwho sees it')
const card = src('components/path/KeepItAsk.tsx')
ok('only once the server has answered', card.includes('access.known'))
ok('never to somebody signed in', card.includes('!access.signedIn'))
ok('never where sign-in cannot work', card.includes('access.signInReady'))
ok('it can always be skipped', card.includes('Not now') && card.includes('keep-it-later'))
ok('and goes to sign-in and back to the Path', card.includes('/signin?next=%2Fclub'))
ok('nothing on the Path is locked behind it', !/disabled|locked|block/i.test(card.replace(/\/\*[\s\S]*?\*\//g, '')))
ok('it is on the Path', src('components/path/PathHome.tsx').includes('<KeepItAsk'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nall good')
