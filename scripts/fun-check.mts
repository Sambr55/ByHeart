/**
 * JUST FOR FUN (components/path/FunShelf.tsx): every vibe on the shelf can actually be
 * opened from the path. Swearing sat at stage 6 for months while no room on any path
 * reached it — so it could never open, and nobody noticed until Sam asked where it went.
 */
import { CRATES, entryRung, isLive } from '../content/roots'
import { pathUnits } from '../content/path'

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
if (failed) process.exit(1)
console.log('✓ all ' + vibes.length + ' vibes can be opened from every path; swearing waits until stage ' + entryRung(swear!))
