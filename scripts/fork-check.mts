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
 * This is the check that keeps one answer. Everything here is logic, so it needs no
 * browser — the routing decision is a function of saved state and nothing else.
 */
import { LEGEND_CARD, clubOpen } from '../content/legend'
import { ROOTS, rungReached } from '../content/roots'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

type Answer = { frame_id: string; values: Record<string, string> }
const answersFor = (n: number): Answer[] =>
  LEGEND_CARD.slice(0, n).map((f) => ({ frame_id: f.id, values: { x: 'y' } }))

/** The rung-2 proof the door also requires — said cold, twice. */
const rung2 = ROOTS.filter((r) => r.rung === 1)
  .slice(0, 2)
  .map((r) => ({ pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release' as const, clean: true, at: '1' }))

/** The same decision app/page.tsx makes, kept in step by this file existing. */
function member(answers: Answer[], proof: typeof rung2): boolean {
  return clubOpen({
    answeredFrameIds: answers.map((a) => a.frame_id),
    answers,
    rung: rungReached(proof),
    welcomedAt: null,
  })
}

console.log('\nthe fork\n')
ok('a brand new device is not a member', !member([], []))
ok('nor is somebody who has only played', !member([], rung2))

/*
  The exact case that used to break. Five answers was enough for the front door and not
  enough for the room, so this person bounced off a door they had been sent to.
*/
for (const n of [1, 3, 5, 6]) {
  ok(
    n + ' of ' + LEGEND_CARD.length + ' answered is not yet a member',
    !member(answersFor(n), rung2),
    n === 5 ? 'the one that used to be sent to a locked room' : '',
  )
}

ok(
  'the whole card plus rung 2 is a member',
  member(answersFor(LEGEND_CARD.length), rung2),
)
ok(
  'and the card alone is not — it has to have been said',
  !member(answersFor(LEGEND_CARD.length), []),
  'the ladder is what proves you can say it',
)

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
ok(
  'and app/page.tsx asks clubOpen',
  readFileSync('app/page.tsx', 'utf8').includes('clubOpen('),
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\none question, one answer, and nobody is sent to a door that will not open')
