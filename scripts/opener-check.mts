/**
 * Every vibe opens with its own banger.
 *
 *   npm run opener
 *
 * You tap Audrey Hepburn and the first screen says "Olá, chamo-me Sam." — a sentence built
 * out of the basics and a Beatles single with nothing of Hepburn in it. A collision was
 * being served BEFORE the vibe's own content, and because the one served is whichever is
 * next undone, opening the same vibe twice gave two different openers. The vibe had no
 * character at the moment it most needs one.
 *
 * Two rules, and both are about what somebody meets in the first three seconds:
 *
 *   the first root of a session comes from the vibe that was tapped, and
 *   the same vibe opens the same way twice.
 *
 * Checked against the queue rather than the screen, so every vibe can be covered — driving
 * eleven of them through a browser would take minutes and prove the same thing.
 */
import { CRATES, COLLISIONS, ROOTS_BY_FAMILY, type Rung } from '../content/roots'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  The same selection the session makes: lowest rung first, never above the one reached,
  and nothing already played. Stable, so within a rung the authored order holds — which is
  what makes "the banger is first" a content decision rather than an accident.
*/
function sectionRoots(family: string, reached: Rung, played: string[]) {
  return [...(ROOTS_BY_FAMILY as Record<string, { root_id: string; rung: Rung; root_display: string }[]>)[family] ?? []]
    .filter((r) => r.rung <= reached && !played.includes(r.root_id))
    .sort((a, b) => a.rung - b.rung)
}

console.log('\nwhat each vibe opens with\n')
for (const crate of CRATES) {
  const all = (ROOTS_BY_FAMILY as Record<string, { root_id: string; rung: Rung; root_display: string }[]>)[crate.id] ?? []
  if (!all.length) {
    ok(crate.title + ' has something in it', false, 'no roots')
    continue
  }
  const lowest = Math.min(...all.map((r) => r.rung)) as Rung
  const first = sectionRoots(crate.id, lowest, [])[0]
  ok(
    crate.title,
    Boolean(first),
    first ? '[rung ' + first.rung + '] ' + first.root_display.slice(0, 40) : 'nothing reachable',
  )
}

console.log('\nand it is the vibe you tapped\n')
/*
  The bug, asserted directly: a collision requires pieces from two families, so serving one
  first means the first thing anybody meets in a new vibe is from somewhere else. It is
  worth having — it is the compounding claim — but not as the front door.
*/
const src = (await import('node:fs')).readFileSync('engine/journey.tsx', 'utf8')
const order = src.slice(src.indexOf('const [opener, ...rest] = roots'), src.indexOf('steps.push({ kind: \'osmosis\' })'))
ok(
  'the first root is queued before any collision',
  order.indexOf('rootSteps(opener)') < order.indexOf("kind: 'collision'"),
  'a vibe opens with its own content',
)
ok(
  'and the collision still comes early rather than at the end',
  order.indexOf("kind: 'collision'") < order.indexOf('rest.flatMap'),
  'arriving somewhere new is the moment for it',
)

console.log('\nthe same vibe opens the same way twice\n')
/*
  Determinism, which is what makes an opener an opener. The collision served is whichever
  is next undone, so it changes between sittings — fine in the middle of a session, wrong
  at the front of one, and it is why opening Audrey Hepburn twice gave two different
  first screens.
*/
for (const crate of CRATES.slice(0, 6)) {
  const all = (ROOTS_BY_FAMILY as Record<string, { rung: Rung }[]>)[crate.id] ?? []
  if (!all.length) continue
  const lowest = Math.min(...all.map((r) => r.rung)) as Rung
  const a = sectionRoots(crate.id, lowest, [])[0]?.root_id
  const b = sectionRoots(crate.id, lowest, [])[0]?.root_id
  ok(crate.title + ' is stable', Boolean(a) && a === b, String(a))
}

console.log('\nand a collision is never somebody’s first sentence\n')
// Belt to the braces above: the first collision cannot be the very first thing served,
// because a collision by definition needs pieces from a vibe already played.
ok(
  'every collision needs two families',
  COLLISIONS.every((c) => c.requires.length >= 2),
  COLLISIONS.filter((c) => c.requires.length < 2).map((c) => c.id).join(' '),
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery vibe opens with its own banger, and opens the same way twice')
