/**
 * THE SURPRISES ON EACH LEVEL — everything that is not a room, in the one flow (Sam, 2026-11-09).
 *
 * "Should we only see content in a flow (even if locked and advertising that it will open on
 * the next level, or a 'freebie' such as how to swear or any other surprise-and-delight
 * content)… I am coming at this from the point of view of declutter and making it as clear as
 * possible to the user how they move through." He asked me to decide the allocation.
 *
 * Before this, the same things lived in up to five places: a `fun_` room inside a level, a
 * postcard square on the board, a row of Hacks/Bluffs/Cheats under it, a row of Just for fun
 * vibes under that, and the library in Yours — each with its own lock rule. Now the level is
 * the only route: its rooms, its practice session, and these — dealt onto its board first,
 * with places and what's on filling the squares left (components/path/lap.ts). Panel and
 * Road list the same, from the same function. Everything opened lands in Yours.
 *
 * Curated, not counted: a level's size no longer decides how much fun it has. At most three
 * per level and never more than its board has squares (scripts/surprises-check.mts).
 *
 * VIBES SIT WHERE THEY CAN OPEN. A vibe sitting is gated by the ladder (entryRung); every
 * vibe here is on a level whose rooms can lift a learner to it — swearing (rung 4) is on
 * Level 2, the first level holding a rung-3 room, which is where it opened before. The
 * check holds that. The practice sessions (each level's milestone) are not repeated here.
 */
import type { Purpose } from '@/content/situations'

export type Surprise =
  | { kind: 'cheat'; id: string }
  | { kind: 'idiom'; id: string }
  | { kind: 'vibe'; id: string }

const c = (id: string): Surprise => ({ kind: 'cheat', id })
const i = (id: string): Surprise => ({ kind: 'idiom', id })
const v = (id: string): Surprise => ({ kind: 'vibe', id })

/* By level position, so the same promise holds on every path: swearing at 2, flirting at 3. */
const SIX: Surprise[][] = [
  /* 1 */ [c('cao_hack'), v('bobs_your_uncle'), v('world_of_wizardry')],
  /* 2 */ [v('portuguese_swearing'), c('bluff_time')],
  /* 3 */ [v('flirting_m2f'), v('flirting_f2m'), i('fingers_crossed')],
  /* 4 */ [v('duran_duran_lisboa'), c('bluff_react'), v('bridget_jones')],
  /* 5 */ [v('bowie_golden_years'), v('audrey_hepburn'), v('marcus_aurelius')],
  /* 6 */ [v('pulp_fiction'), v('top_gun'), v('james_bond')],
]

/* Moving has a seventh level, so the last stretch spreads out; Bond still goes last. */
const SEVEN: Surprise[][] = [
  ...SIX.slice(0, 4),
  /* 5 */ [v('bowie_golden_years'), v('audrey_hepburn'), i('the_penny_dropped')],
  /* 6 */ [v('marcus_aurelius'), v('pulp_fiction'), v('top_gun')],
  /* 7 */ [v('james_bond'), i('piece_of_cake'), c('mente_hack')],
]

const BY_PURPOSE: Record<Purpose, Surprise[][]> = { visiting: SIX, staying: SIX, moving: SEVEN }

/** The surprises dealt onto level `index` (0-based) of this purpose's path. */
export function surprisesFor(purpose: Purpose, index: number): Surprise[] {
  return BY_PURPOSE[purpose]?.[index] ?? []
}

/** Every surprise on a path, for the check script. */
export function allSurprises(purpose: Purpose): Surprise[][] {
  return BY_PURPOSE[purpose] ?? []
}
