/**
 * One flow: every level's surprises, and the three views drawing the same thing (2026-11-09).
 *
 *   npm run surprises
 *
 * Sam: "should we only see content in a flow … declutter and making it as clear as possible
 * to the user how they move through." Fails if a level counts a joke as a room again, if a
 * level is dealt more surprises than it has squares, if a vibe sits where it cannot open, if
 * swearing or Bond move, if a surprise repeats a level's practice session, if the side rows
 * come back, or if the Panel or the Road stop drawing what the Board deals.
 */
import { readFileSync } from 'node:fs'
import { PATHS, pathUnits } from '../content/path'
import { CHEATS } from '../content/cheats'
import { IDIOMS } from '../content/idioms'
import { CRATES, entryRung } from '../content/roots'
import { allSurprises } from '../content/surprises'
import { lapOf } from '../components/path/lap'
import { pathView } from '../components/path/progress'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const NOW = new Date('2026-11-09T12:00:00Z')
const empty = { finished_cards: [], proof: [], evidence: [], mission_completed_at: null } as never

for (const purpose of ['visiting', 'staying', 'moving'] as const) {
  console.log('\n' + purpose)
  const units = pathUnits(undefined, NOW, purpose)
  const lists = allSurprises(purpose)
  ok('a level is its rooms: no fun tiles inside a level', PATHS[purpose].every((u) => u.rooms.every((r) => !r.startsWith('fun_'))))
  ok('one list of surprises per level', lists.length === PATHS[purpose].length, lists.length + ' lists, ' + PATHS[purpose].length + ' levels')

  const view = pathView(empty, units, () => 'open', NOW)
  units.forEach((u, i) => {
    const list = lists[i] ?? []
    const lap = lapOf(view, i, purpose, { gems: [], rows: [] })
    const dealt = lap.squares.filter((s) => s.kind === 'vibe' || s.kind === 'postcard')
    ok(`level ${u.n} (${u.id}): at most three, and all on its board`, list.length <= 3 && dealt.length >= list.length, `${list.length} curated · ${lap.squares.length - 4 - u.rooms.length} stops`)
    for (const x of list) {
      const real = x.kind === 'vibe' ? CRATES.some((c) => c.id === x.id) : x.kind === 'cheat' ? CHEATS.some((c) => c.id === x.id) : IDIOMS.some((d) => d.id === x.id)
      if (!real) ok(`level ${u.n}: ${x.kind} ${x.id} exists`, false)
      if (x.kind === 'cheat' && units.some((v) => v.milestone.cheat === x.id)) ok(`level ${u.n}: ${x.id} is not also a practice session`, false)
      if (x.kind === 'vibe') {
        const crate = CRATES.find((c) => c.id === x.id)!
        const at = entryRung(crate)
        /* The same rule the fun row used: the first level holding a room that lifts you to it. */
        const earliest = units.findIndex((v) => v.rooms.some((r) => (r.rung ?? 1) >= at - 1))
        ok(`level ${u.n}: ${x.id} sits where it can open`, earliest !== -1 && i >= earliest, `earliest is level ${earliest + 1}`)
      }
    }
  })
  const flat = lists.flat()
  ok('nothing is dealt twice on one path', new Set(flat.map((x) => x.kind + x.id)).size === flat.length)
  ok('how to swear is a Level 2 surprise', (lists[1] ?? []).some((x) => x.id === 'portuguese_swearing'))
  ok('flirting, both ways, is on the board at Level 3', ['flirting_m2f', 'flirting_f2m'].every((id) => (lists[2] ?? []).some((x) => x.id === id)))
  ok('Bond goes last', (lists[lists.length - 1] ?? []).some((x) => x.id === 'james_bond'))
  const vibes = CRATES.filter((c) => !c.drop && c.built && c.id !== 'the_basics').map((c) => c.id)
  ok('every vibe the fun row offered is on a board', vibes.every((id) => flat.some((x) => x.id === id)), vibes.filter((id) => !flat.some((x) => x.id === id)).join(', ') || 'all ' + vibes.length)
}

console.log('\none flow, three views')
const home = src('components/path/PathHome.tsx')
ok('no side rows under the path', !/<Foundations|<FunShelf/.test(home))
ok('the Panel draws the same stops the Board deals', /<LevelStops/.test(src('components/path/Panel.tsx')))
ok('and so does the Road', /<LevelStops/.test(src('components/path/Road.tsx')))
ok('which are the board’s own lap, not a copy', /lapOf\(/.test(src('components/path/LevelStops.tsx')))
ok('practice is offered any time on the Board too, as on the keystones', /board-practice-early/.test(src('components/path/Board.tsx')))

console.log('\nthe first lap, and one tap back')
const board = src('components/path/Board.tsx')
ok('the warm-up lap explains its corners instead of offering them', /WARM_UP/.test(board) && /lap\.index === 0/.test(board))
ok('sheets close to the board, by name', /‹ Board/.test(board) && /‹ Board/.test(src('components/path/TileSheet.tsx')))
ok('leaving the path marks the way back', /markFromBoard/.test(home))
ok('and every screen offers it until the path is open again', /<BackToBoard/.test(src('app/layout.tsx')))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\none flow')
