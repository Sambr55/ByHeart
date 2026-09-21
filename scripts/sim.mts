/**
 * Map, audit and interrogate the learner journey — without a browser.
 *
 *   npm run sim                      the default path, sitting by sitting
 *   npm run sim -- --all-vibes       one sitting of every vibe (Sam's run)
 *   npm run sim -- --vibe james_bond just that one, to exhaustion
 *   npm run sim -- --audit           sweep every path and report the dead ends
 *   npm run sim -- --piece porque    who teaches a word, and what needs it
 *
 * Sam: "We are in architectural spaghetti. Suggest a way we can definitively map, audit
 * and edit this architecture."
 *
 * This is that. Fifteen files decide what a learner sees next and nothing could ask a
 * question spanning more than one of them — so every bug was found by a person on a phone,
 * one at a time. engine/sim.ts puts those decisions in one room by DELEGATING to them; this
 * is the way in.
 *
 * It is a reporting tool, not a gate: it prints and exits 0 unless --audit finds something
 * genuinely broken. The checks in the gate stay where they are.
 */
import {
  cardState,
  legendState,
  newLearner,
  playSitting,
  playVibe,
  taughtBy,
  type SimLearner,
} from '../engine/sim'
import { doorwayRoots, legendUnlocked, LEGEND_FRAMES } from '../content/legend'
import { NO_CUE_PROMPTS } from '../content/front-door'
import { CRATES, ROOTS, type CultureFamily } from '../content/roots'

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf('--' + name)
  return i < 0 ? null : (args[i + 1] ?? '')
}
const has = (name: string) => args.includes('--' + name)

const VIBES = CRATES.filter((c) => !c.drop).map((c) => c.id as CultureFamily)
const NO_CUE_TOTAL = NO_CUE_PROMPTS.length
const legendOpen = (l: SimLearner) =>
  legendUnlocked(l.roots_played, l.sections_completed ?? [])

const line = (s = '') => console.log(s)
const pad = (s: string, n: number) => String(s).padEnd(n)

/** One sitting, printed the way a learner would experience it. */
function show(l: SimLearner, vibe: CultureFamily, n: number) {
  const s = playSitting(l, vibe)
  if (!s.roots.length) {
    line(`  ${pad(String(n), 3)} ${pad(vibe, 21)} (nothing left)`)
    return s
  }
  const a = s.after
  line(
    `  ${pad(String(n), 3)} ${pad(vibe, 21)} ` +
      `rung ${a.rung} · ${pad(a.pieces + ' pieces', 12)} ` +
      `card ${a.card}/7 · ` +
      (a.legendOpen ? 'LEGEND OPEN' : `legend ${a.doorwayToGo} to go`),
  )
  for (const r of s.roots) line(`        · ${pad(r.type, 19)} ${r.display.slice(0, 44)}`)
  if (s.cold.length) line(`        cold: ${s.cold.join(' | ')}`)
  if (s.opened.length) line(`        ANNOUNCED: ${s.opened.join(', ')}`)
  return s
}

function report(l: SimLearner) {
  const card = cardState(l)
  line()
  line(`  card: ${card.ready.length}/7 answerable` + (card.shut.length ? ` · shut: ${card.shut.join(', ')}` : ''))
  const deeper = legendState(l).filter((f) => !cardState(l).ready.includes(f.id) && !card.shut.includes(f.id))
  const shutDeep = deeper.filter((f) => !f.ready)
  if (shutDeep.length) {
    line(`  deeper still shut:`)
    for (const f of shutDeep) {
      line(`     ${pad(f.id, 13)} needs ${f.needs.map((p) => p + ' (' + (taughtBy(p).join('/') || 'NOBODY') + ')').join(', ')}`)
    }
  }
}

/* ── --piece: who teaches a word, and what depends on it ───────────────────────── */
if (flag('piece') !== null) {
  const id = flag('piece')!
  line(`\n  ${id}`)
  const roots = ROOTS.filter((r) => r.extracts.some((e) => e.id === id))
  line(`  taught by ${roots.length} root(s):`)
  for (const r of roots) line(`     ${pad(r.culture_family, 21)} rung ${r.rung}  ${r.root_display.slice(0, 40)}`)
  const needed = LEGEND_FRAMES.filter((f) => f.built_from.includes(id))
  line(`  needed by ${needed.length} Legend question(s): ${needed.map((f) => f.id).join(', ') || '(none)'}`)
  /*
    THE SINGLE-SOURCE WARNING. A word taught by one root, needed by a question, is a single
    point of failure for the whole promise — this is what made `porque` able to strand a
    learner, and the class of thing that has to be visible when authoring.
  */
  if (roots.length === 1 && needed.length) {
    line(`\n  WARNING: one source for a word the Legend needs. If that root is unreachable,`)
    line(`  so is the question — measured once already with porque and tb_why.`)
  }
  line()
  process.exit(0)
}

/* ── --audit: sweep paths and report what strands a learner ─────────────────────── */
if (has('audit')) {
  line('\n  AUDIT — every plausible path, measured\n')
  const problems: string[] = []

  /* 1. The path Sam took: one sitting of everything. */
  {
    const l = newLearner()
    for (const v of VIBES) playSitting(l, v)
    const c = cardState(l)
    line(`  one sitting of all ${VIBES.length} vibes -> ${l.roots_played.length} roots, card ${c.ready.length}/7, legend ${legendOpen(l) ? 'OPEN' : 'SHUT'}`)
    if (!legendOpen(l)) {
      problems.push(
        `a learner who plays one sitting of EVERY vibe still has no Legend — ` +
          `${doorwayRoots().filter((r) => !l.roots_played.includes(r.root_id)).length} doorway roots unreached`,
      )
    }
  }

  /* 2. The doorway alone, which is the intended path. */
  {
    const l = newLearner()
    const sits = playVibe(l, 'the_basics' as CultureFamily)
    line(`  the basics to exhaustion       -> ${sits.length} sittings, card ${cardState(l).ready.length}/7, legend ${legendOpen(l) ? 'OPEN' : 'SHUT'}`)
    if (!legendOpen(l)) problems.push('finishing the doorway vibe does not open the Legend')
  }

  /* 3. Every vibe as a FIRST vibe — does any of them strand somebody? */
  for (const v of VIBES) {
    const l = newLearner()
    playVibe(l, v)
    if (v !== 'the_basics' && legendOpen(l)) {
      problems.push(`${v} alone opens the Legend — the doorway is meant to be the doorway`)
    }
  }

  /*
    4. THE COLD PROMPTS. Every vibe ends on three, and there are only twenty in the pool —
    so vibes fall through to the same leftovers. Reported because it is what a learner
    experiences as "every vibe has a random coffee question".
  */
  {
    const l = newLearner()
    const endings: string[][] = []
    for (const v of VIBES) endings.push(playSitting(l, v).cold)
    const counts = new Map<string, number>()
    for (const e of endings) for (const p of e) counts.set(p, (counts.get(p) ?? 0) + 1)
    const repeated = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])
    line(`\n  cold prompts: ${NO_CUE_TOTAL} in the pool for ${VIBES.length} vibes × 3 per sitting`)
    for (const [p, n] of repeated.slice(0, 5)) line(`     ${pad(String(n) + '×', 5)} ${p}`)
    if (repeated.length) {
      problems.push(
        `${repeated.length} cold prompt(s) appear in three or more vibes — ` +
          'the pool cannot cover the vibes and they share leftovers',
      )
    }
  }

  line()
  if (problems.length) {
    for (const p of problems) line('  PROBLEM  ' + p)
    line(`\n  ${problems.length} thing(s) a learner would actually hit`)
    process.exit(1)
  }
  line('  no dead ends found')
  process.exit(0)
}

/* ── default: walk a path and print it ──────────────────────────────────────────── */
const l = newLearner()
let n = 0

if (flag('vibe') !== null) {
  const v = flag('vibe') as CultureFamily
  line(`\n  ${v}, to exhaustion\n`)
  for (let i = 0; i < 20; i++) {
    const s = show(l, v, ++n)
    if (!s.roots.length) break
  }
} else if (has('all-vibes')) {
  line('\n  one sitting of every vibe — the path Sam took\n')
  for (const v of VIBES) show(l, v, ++n)
} else {
  line('\n  the default path: the basics, then whatever is open\n')
  for (let i = 0; i < 8; i++) {
    const s = show(l, 'the_basics' as CultureFamily, ++n)
    if (!s.roots.length) break
    if (legendOpen(l)) break
  }
}

report(l)
line()
