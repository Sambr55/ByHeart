/**
 * The promises in docs/promises.md, measured.
 *
 *   npm run promises
 *
 * Sam: "Unless we sort this out once and for all we are never going to ship as we will
 * keep going around coding loops."
 *
 * The loop is this: ten spec documents describe DUB in prose, nothing measures any of
 * them, so the product drifts from all ten and the drift is only ever found by a person on
 * a phone — one screenshot at a time, each fix blind to the next.
 *
 * THE DIVISION OF LABOUR. docs/promises.md is Sam's; this file is the machine's. He writes
 * what should be true in plain English, this proves whether it is. Claude does not add
 * promises — a contract written by the party being held to it is not a contract, and my
 * reading of the product is exactly what produced the drift.
 *
 * EVERY ASSERTION REPORTS WHAT IT MEASURED, not just pass or fail. A promise enforced as
 * something narrower than it was written is the failure mode that makes a green check
 * worthless, and it is invisible unless the numbers are on screen. If the measurement does
 * not look like the promise, the enforcement is wrong and the printout says so.
 *
 * A BROKEN PROMISE IS NOT A BUILD FAILURE. P2 and P3 are broken today, deliberately and
 * knowingly — they are the next work. This reports them and exits 0. It exits 1 only when
 * something marked HOLDS stops holding, because that is a regression rather than a backlog.
 */
import { cardState, newLearner, playSitting, playVibe } from '../engine/sim'
import { doorwayRoots, doorwayToGo, legendUnlocked } from '../content/legend'
import { NO_CUE_PROMPTS } from '../content/front-door'
import { CRATES, ROOTS_BY_FAMILY, type CultureFamily } from '../content/roots'

type Status = 'HOLDS' | 'BROKEN' | 'NOT YET ENFORCED'

const regressions: string[] = []
const VIBES = CRATES.filter((c) => !c.drop).map((c) => c.id as CultureFamily)

/**
 * One promise, with the measurement that decides it.
 *
 * `declared` is the status written in docs/promises.md. When the measurement disagrees
 * with it in the direction of breakage, that is a regression and the run fails; when it
 * disagrees the other way, the promise has been FIXED and the file needs updating, which
 * is worth saying out loud rather than silently passing.
 */
function promise(
  id: string,
  text: string,
  declared: Status,
  measure: () => { holds: boolean; saw: string[] },
) {
  const { holds, saw } = declared === 'NOT YET ENFORCED' ? { holds: true, saw: [] } : measure()
  const now: Status = declared === 'NOT YET ENFORCED' ? declared : holds ? 'HOLDS' : 'BROKEN'

  console.log(`\n  ${id}  ${text}`)
  console.log(`      ${now}${now !== declared ? '   (docs/promises.md says ' + declared + ')' : ''}`)
  for (const s of saw) console.log(`      measured: ${s}`)

  if (declared === 'HOLDS' && !holds) {
    regressions.push(`${id} was holding and is now broken — ${text}`)
  }
  if (declared === 'BROKEN' && holds) {
    console.log(`      ^ this promise is now KEPT. Update docs/promises.md.`)
  }
}

console.log('\n  THE PROMISES, measured\n  ' + '─'.repeat(60))

promise(
  'P1',
  'The doorway plus three chosen vibes opens the Legend',
  'HOLDS',
  () => {
    const l = newLearner()
    const sits = playVibe(l, 'the_basics' as CultureFamily)
    /*
      And the three chosen vibes, played the same way.

      The promise has two halves now and both have to be measured, or this reports on a
      learner who does not exist: one who finished the basics and nothing else, which the
      door no longer opens for.
    */
    for (const v of ['top_gun', 'james_bond', 'bridget_jones'] as CultureFamily[]) {
      playVibe(l, v)
    }
    const card = cardState(l)
    const open = legendUnlocked(l.roots_played, l.sections_completed ?? [])
    return {
      holds: open && card.shut.length === 0,
      saw: [
        `${l.roots_played.length} roots over ${sits.length}+ sittings`,
        `card ${card.ready.length}/7, Legend ${open ? 'open' : 'shut'}`,
      ],
    }
  },
)

promise(
  'P2',
  'The road in is impossible to miss',
  'BROKEN',
  () => {
    /*
      Enforced as the measurable half: a learner following the product's own affordances —
      one sitting of each vibe, which is what the shelf invites — must not end without a
      Legend. Whether a SCREEN says so is not visible from here; scripts/journey-smoke.ts
      is where that half belongs. Narrower than the promise, and saying so is the point.
    */
    const l = newLearner()
    for (const v of VIBES) playSitting(l, v)
    const open = legendUnlocked(l.roots_played, l.sections_completed ?? [])
    const short = doorwayRoots().filter((r) => !l.roots_played.includes(r.root_id))
    return {
      holds: open,
      saw: [
        `one sitting of all ${VIBES.length} vibes: ${l.roots_played.length} roots, card ${cardState(l).ready.length}/7`,
        `Legend ${open ? 'open' : `shut, ${doorwayToGo(l.roots_played)} doorway roots short`}`,
        ...(short.length ? [`never reached: ${short.map((r) => r.root_id).join(', ')}`] : []),
        'NOTE: only measures the outcome. Whether a screen says what to do next is not tested here.',
      ],
    }
  },
)

promise(
  'P3',
  'A vibe ends on its own lines',
  'BROKEN',
  () => {
    const l = newLearner()
    const shared = new Map<string, number>()
    for (const v of VIBES) {
      for (const p of playSitting(l, v).cold) shared.set(p, (shared.get(p) ?? 0) + 1)
    }
    const worst = [...shared.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])
    return {
      holds: worst.length === 0,
      saw: [
        `${NO_CUE_PROMPTS.length} prompts in the pool for ${VIBES.length} vibes × 3 per sitting`,
        ...worst.slice(0, 3).map(([p, n]) => `"${p}" closes ${n} different vibes`),
      ],
    }
  },
)

promise(
  'P4',
  'A vibe opens on what it is famous for',
  'HOLDS',
  () => {
    const off: string[] = []
    for (const c of VIBES) {
      const all = ROOTS_BY_FAMILY[c] ?? []
      if (!all.length) continue
      /*
        READ THE DECLARED SIGNATURE, the same way scripts/signature-check.mts does.

        This measured the dominant root_type instead, which is what that check used to do
        and is wrong for the same two reasons. It is circular — content that drifts drags
        the expectation with it — and it has no way to tell a crate named for its SOURCE
        from the one named for what it TEACHES. the_basics is 60% `title` because counting
        and the days of the week hang off song lines, so this reported it off-signature for
        opening on the learner's name and age, which is precisely what it promises.

        A crate with no signature promises no source and is skipped. See Crate.signature.
      */
      const crate = CRATES.find((x) => x.id === c)
      if (!crate?.signature) continue
      const kind = crate.signature
      const l = newLearner()
      const rest = playSitting(l, c).roots.filter((r) => {
        const root = all.find((x) => x.root_id === r.id)
        return !root?.freebie_flag
      })
      if (rest.length && !rest.some((r) => r.type === kind)) off.push(c)
    }
    return {
      holds: off.length === 0,
      saw: [off.length ? `off-signature: ${off.join(', ')}` : `all ${VIBES.length} vibes open in character`],
    }
  },
)

promise('P5', 'No path strands a learner', 'NOT YET ENFORCED', () => ({ holds: true, saw: [] }))

console.log('\n  ' + '─'.repeat(60))
if (regressions.length) {
  for (const r of regressions) console.log('  REGRESSION  ' + r)
  console.log(`\n  ${regressions.length} promise(s) stopped holding\n`)
  process.exit(1)
}
/*
  Broken promises are the backlog, not a build failure — P2 and P3 are known and are the
  next work. Failing on them would mean the gate is red for as long as there is anything
  left to do, which teaches everybody to ignore it.
*/
console.log('  no promise that was holding has stopped\n')
