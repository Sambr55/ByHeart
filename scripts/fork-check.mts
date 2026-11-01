/**
 * Where the front door sends you, and whether it sends you somewhere that will take you.
 *
 *   npm run fork
 *
 * There were two answers to "is this person a member" and they disagreed: app/page.tsx
 * said five or more Legend answers, and clubOpen — which the Club itself uses — says every
 * applicable card plus rung 2. So somebody with five or six was sent to the Club by the
 * front door and shown the closed door by the Club, one tap later. The person most likely
 * to hit it was somebody halfway through building their Legend, which is exactly who the
 * fork exists for.
 *
 * The door has since moved to set-up (see clubOpen); the property is unchanged — one
 * answer, asked in one place.
 *
 * This is the check that keeps one answer. Everything here is logic, so it needs no
 * browser — the routing decision is a function of saved state and nothing else.
 */
import { LEGEND_CARD, clubOpen, clubOpenFor } from '../content/legend'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  THE DOOR IS SET-UP NOW, not the card — see clubOpen. So the fork's question is the same
  one in the same place, and what it is asked about is the record's two door fields. The
  Legend answers are carried in each fixture to prove they no longer decide anything.
*/
type Answer = { frame_id: string; values: Record<string, string> }
const answersFor = (n: number): Answer[] =>
  LEGEND_CARD.slice(0, n).map((f) => ({ frame_id: f.id, values: { x: 'y' } }))

/** The same decision app/view.tsx makes, kept in step by this file existing. */
function member(s: { legend: Answer[]; set_up_at?: string | null; club_welcomed_at?: string | null }): boolean {
  return clubOpenFor(s)
}

console.log('\nthe fork\n')
ok('a brand new device is not a member', !member({ legend: [] }))
for (const n of [1, 5, LEGEND_CARD.length]) {
  ok(
    n + ' of ' + LEGEND_CARD.length + ' answered and no set-up is not a member',
    !member({ legend: answersFor(n) }),
    'the card does not open the door',
  )
}
ok('set-up with nothing answered is a member', member({ legend: [], set_up_at: '2026-11-01' }))
ok('welcomed with nothing else is a member', member({ legend: [], club_welcomed_at: '2026-08-01' }))
ok('and clubOpen agrees', clubOpen({ setUpAt: '2026-11-01' }) && !clubOpen({}))

console.log('\nand it is asked in one place\n')
/*
  A second implementation of this question is how the two came to disagree, so the check is
  that there is not one. Anything deciding membership from a count of Legend answers is the
  bug coming back.
*/
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(path)) out.push(path)
  }
  return out
}
const files = ['app', 'components', 'engine'].flatMap((d) => walk(d))
const rolled = files.filter((f) => {
  const src = readFileSync(f, 'utf8')
  /*
    A count of Legend answers, in a file that ALSO decides where somebody goes.

    Counting them is fine and common — the Line offers a cold question once there are two
    to draw on, and the profile's rolled-up row says how many are done. Both report; neither
    gates. What must not exist again is a file that counts them and routes on the answer,
    which is precisely what app/page.tsx was doing with five.
  */
  const counts = /\.legend\s*\?\?\s*\[\]\)[\s\S]{0,120}\.length\s*>=/.test(src)
  const routes = /router\.(replace|push)\(.{0,40}\/club/.test(src)
  return counts && routes
})
ok('nothing routes on a count of Legend answers', !rolled.length, rolled.join(' '))
/*
  THE FRONT DOOR'S LOGIC MOVED TO app/view.tsx, and this check found it missing the moment
  it did — which is the check doing its job rather than a path to patch and forget.

  app/page.tsx is a server component now, carrying `export const dynamic = 'force-dynamic'`
  so Vercel's edge stops serving a stale copy of the install start_url. A client page
  cannot export route config, so the component had to move. The decision it makes is
  unchanged and is still the thing asserted here.

  Both files are read, so this keeps holding wherever the logic sits.
*/
ok(
  'and the front door asks clubOpen',
  ['app/page.tsx', 'app/view.tsx'].some((f) => {
    try {
      return /clubOpen(For)?\(/.test(readFileSync(f, 'utf8'))
    } catch {
      return false
    }
  }),
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\none question, one answer, and nobody is sent to a door that will not open')
