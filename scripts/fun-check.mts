/**
 * JUST FOR FUN — the vibes dealt onto each level's board (content/surprises.ts): every one can actually be
 * opened from the path. Swearing sat at stage 6 for months while no room on any path
 * reached it — so it could never open, and nobody noticed until Sam asked where it went.
 */
import { CRATES, entryRung, isLive } from '../content/roots'
import { pathUnits } from '../content/path'
import { readFileSync } from 'node:fs'

let failed = 0
const vibes = CRATES.filter((c) => !c.drop && c.built && c.id !== 'the_basics' && isLive(c))
for (const p of ['visiting', 'staying', 'moving'] as const) {
  const top = Math.max(...pathUnits(undefined, undefined, p).flatMap((u) => u.rooms.map((r) => r.rung ?? 1)))
  /* Finishing a room at rung N opens stage N+1 (rungReached). */
  for (const c of vibes) {
    if (entryRung(c) > top + 1) {
      failed++
      console.log('✗ ' + c.id + ' opens at stage ' + entryRung(c) + ' but the ' + p + ' path tops out at ' + (top + 1))
    }
  }
}
const swear = vibes.find((c) => c.id === 'portuguese_swearing')
if (!swear || entryRung(swear) < 3) {
  failed++
  console.log('✗ swearing must exist and still wait until after the first levels')
}
/*
  A vibe from the path ends on the path (Sam, 2026-11-06: after swearing "it linked through to
  ola / Adeus and a load of other lessons"). Every way out of a /vibes sitting goes to /club.
*/
const src = (f: string) => readFileSync(new URL('../' + f, import.meta.url), 'utf8')
const engine = src('engine/journey.tsx')
const journey = src('components/Journey.tsx')
const ends = [
  ['the engine knows a sitting came from the path', /const fromPath = enter === 'vibes'/.test(engine)],
  ['its home button goes to the path', /if \(fromPath\) \{\s*window\.location\.assign\('\/club#fun'\)/.test(engine)],
  ['the end of the sitting says Back to your path, not the Basics', /\{fromPath \? \(\s*(?:\/\*[\s\S]*?\*\/\s*)?<Link\s+href="\/club"\s+data-testid="back-to-path"/.test(journey)],
  ['the retired shelf sends a returning sitting home', /if \(fromPath && state\.family\) router\.replace\('\/club#fun'\)/.test(journey)],
] as const
for (const [label, ok] of ends) {
  if (!ok) failed++
  console.log((ok ? '✓ ' : '✗ ') + label)
}
if (failed) process.exit(1)
console.log('✓ all ' + vibes.length + ' vibes can be opened from every path; swearing waits until stage ' + entryRung(swear!))
