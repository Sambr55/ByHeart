/**
 * Every step on the road in earns its place, and the road arrives.
 *
 *   npm run road
 *
 * The road is an authored list (content/road.ts) rather than a computation, which removes
 * the class of fault that produced a bar reading 10 of 10 above a sentence saying one more
 * session. What an authored list cannot do is notice that the content moved underneath it,
 * so that is this file's job.
 *
 * It asserts the admission test the road claims for itself — every step teaches a card
 * word or asks something about the learner — and then that walking the whole road actually
 * leaves somebody able to build their card. A road that arrives is the only promise worth
 * making here.
 */
import { ROOTS, ROOTS_BY_FAMILY, type Root } from '../content/roots'
import { ROAD, WARM_UP, roadFor, roadProgress } from '../content/road'
import { cardFor, frameReady, LEGEND_FRAMES } from '../content/legend'
import type { Purpose } from '../content/situations'

const fail: string[] = []
const ok = (what: string, good: boolean, saw = '') => {
  console.log((good ? '  ✓ ' : '  ✗ ') + what + (good || !saw ? '' : '   ' + saw))
  if (!good) fail.push(what)
}

const byId = new Map<string, Root>(ROOTS.map((r) => [r.root_id, r]))
const PURPOSES: Purpose[] = ['visiting', 'staying', 'moving']

/* Every word any card is built from, which is what a step may claim to teach. */
const cardWords = new Set(PURPOSES.flatMap((p) => cardFor(p).flatMap((f) => f.built_from)))
/* And the deeper questions, which a step may also legitimately serve. */
const deeperWords = new Set(
  LEGEND_FRAMES.filter((f) => f.depth === 'deeper').flatMap((f) => f.built_from),
)

/* 1. Every step exists, and is in the crate it says it is. */
for (const step of ROAD) {
  const root = byId.get(step.root)
  if (!root) { ok('step ' + step.root + ' exists', false); continue }
  ok(
    'step ' + step.root + ' is in ' + step.family,
    root.culture_family === step.family,
    'it is in ' + root.culture_family,
  )
}

/*
  2. THE ADMISSION TEST. Every step teaches a card word or asks something.

  This is the road's own claim about itself — "a person on it is always either learning
  their card or being asked about themselves" — and it is the reason a learner can be
  asked to walk it without being told why. A step that stops satisfying it is a detour,
  and a detour on the road in is exactly what was removed to get here: four counting roots
  that taught nothing the card needs.
*/
for (const step of ROAD) {
  const root = byId.get(step.root)
  if (!root) continue
  const teaches = root.extracts.filter((e) => cardWords.has(e.id) || deeperWords.has(e.id))
  const earns = teaches.length > 0 || Boolean(root.asks)
  if (step.not_for_the_card) {
    /*
      The declared exception, checked in the other direction: a step excused from the test
      must actually need excusing. Otherwise the flag becomes a way of turning the rule off
      and the road fills up with detours nobody has to argue for.
    */
    ok(
      step.root + ' genuinely needs its exception',
      !earns,
      'it teaches ' + teaches.map((e) => e.id).join(',') + ' — drop not_for_the_card',
    )
    continue
  }
  ok(
    step.root + ' teaches a Legend word or asks something',
    earns,
    'teaches ' + root.extracts.map((e) => e.id).join(',') + ' and asks nothing',
  )
}
/* And only one step may be excused. */
ok(
  'the road has one declared exception',
  ROAD.filter((s) => s.not_for_the_card).length === 1,
  ROAD.filter((s) => s.not_for_the_card).map((s) => s.root).join(' '),
)

/*
  3. EVERY QUESTION THE CARD NEEDS IS ASKED ON THE ROAD.

  A first version of this asserted that every asking root is on the road, which is a
  stronger claim than the road makes and the wrong one: it conflates "asked at all" with
  "asked before the door". tb_into fills a depth 'deeper' frame and tb_email is not a
  frame at all, so asking either before the Legend opens is the road doing the Club's
  work — and it was the difference between three sittings and four.

  What must be true is narrower and is the actual promise: a question the SEVEN-CARD
  Legend depends on cannot be left off, which is how tb_age once came to arrive three
  sittings past the open door.
*/
const cardFrameWords = new Set(
  PURPOSES.flatMap((p) => cardFor(p).flatMap((f) => f.built_from)),
)
for (const root of ROOTS_BY_FAMILY.the_basics) {
  if (!root.asks) continue
  const feedsCard = root.extracts.some((e) => cardFrameWords.has(e.id))
  if (!feedsCard) continue
  ok(
    'the road asks ' + root.asks,
    ROAD.some((s) => s.root === root.root_id),
    root.root_id + ' asks ' + root.asks + ', feeds the card, and is not on the road',
  )
}

/*
  4. THE ROAD ARRIVES. Walk every step for each purpose and the card must be buildable.

  The one promise. Everything else here is about the road being honest; this is about it
  being worth walking.
*/
for (const purpose of PURPOSES) {
  const steps = roadFor(purpose)
  const owned = new Set<string>()
  for (const step of steps) {
    const root = byId.get(step.root)
    for (const e of root?.extracts ?? []) owned.add(e.id)
  }
  const card = cardFor(purpose)
  const short = card.filter((f) => !frameReady(f, owned))
  ok(
    'walking the road builds the whole ' + purpose + ' card',
    short.length === 0,
    short.map((f) => f.id + ' still needs ' + f.built_from.join(',')).join('; '),
  )

  /* And the number the bar shows is the number the door reads. */
  const played = steps.map((s) => s.root)
  const mid = roadProgress({ rootsPlayed: played.slice(0, 2), sectionsCompleted: [WARM_UP[0]], purpose })
  const end = roadProgress({ rootsPlayed: played, sectionsCompleted: [WARM_UP[0]], purpose })
  ok(purpose + ': the road is shut part-way', !mid.open, 'open at ' + mid.done + ' of ' + mid.total)
  ok(purpose + ': the road opens at the end', end.open, 'still ' + end.done + ' of ' + end.total)
  /* And not before the warm-up, whatever else has been played. */
  const noWarm = roadProgress({ rootsPlayed: played, sectionsCompleted: [], purpose })
  ok(purpose + ': the warm-up is required', !noWarm.open, 'open without it')
  console.log('    ' + purpose.padEnd(9) + end.total + ' steps: warm-up + ' + steps.length)
}

/* 5. The warm-up offers something real. */
for (const v of WARM_UP) {
  ok('warm-up ' + v + ' has roots', (ROOTS_BY_FAMILY[v] ?? []).length > 0)
}

if (fail.length) { console.log('\n' + fail.length + ' error(s)'); process.exit(1) }
console.log('\nevery step earns its place, and the road arrives')
