/**
 * THE BOARD — its shape, its lap and what each reason for being here finds on it (2026-11-05).
 *
 *   npm run lap
 *
 * Sam: "the user starts in one place, travels around the outside of the board until they
 * reach the next level and a new board … All content must be 'reason for visit' tailored."
 * And: "no dice. Voice progression needs to be optional." This fails if a board is the wrong
 * shape, if anything but laying rooms moves you, if voice can finish a level, if a postcard
 * names a card that does not exist, or if the board starts to borrow a famous game's names.
 */
import { readFileSync } from 'node:fs'
import { pathUnits } from '../content/path'
import { pathView, onHoliday } from '../components/path/progress'
import { boardSize, cellOf, cornerAt, lapOf } from '../components/path/lap'
import { CORNERS, HOLIDAY_DAYS, HOLIDAY_PRIZE, POSTCARDS } from '../content/board'
import { CHEATS } from '../content/cheats'
import { IDIOMS } from '../content/idioms'
import { GEMS, gemRotation } from '../content/gems'
import { CALENDAR } from '../content/calendar'
import type { Purpose } from '../content/situations'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const NOW = new Date('2026-11-05T10:00:00Z')
const gems = gemRotation(GEMS)
const rows = CALENDAR
const open = () => 'open' as const
const empty = { finished_cards: [] as string[], proof: [], evidence: [], mission_completed_at: {} }

console.log('\nthe shape')
for (const n of [1, 2, 4, 5, 6, 7, 8]) {
  const { w, h } = boardSize(n)
  ok(`${n} rooms → ${w}×${h}, one stop per room and four corners`, 2 * (w + h) - 4 === 4 + 2 * Math.max(2, n) && w <= h && w >= 3)
}
for (const [w, h] of [[4, 4], [4, 5], [5, 5], [6, 6]]) {
  const L = 2 * (w + h) - 4
  const cells = new Set(Array.from({ length: L }, (_, i) => cellOf(i, w, h).join()))
  const edge = [...cells].every((c) => {
    const [x, y] = c.split(',').map(Number)
    return x === 0 || y === 0 || x === w - 1 || y === h - 1
  })
  ok(`${w}×${h}: every square on the edge, none twice`, cells.size === L && edge)
  const c = cornerAt(w, h)
  ok(`${w}×${h}: Partida bottom left, Miradouro top left, Férias top right, A mesa bottom right`,
    cellOf(c.start, w, h).join() === `0,${h - 1}` && cellOf(c.miradouro, w, h).join() === '0,0' &&
    cellOf(c.ferias, w, h).join() === `${w - 1},0` && cellOf(c.mesa, w, h).join() === `${w - 1},${h - 1}`)
}

console.log('\nevery board, on every path')
for (const p of ['visiting', 'staying', 'moving'] as Purpose[]) {
  const units = pathUnits(undefined, NOW, p)
  const view = pathView(empty, units, open, NOW)
  units.forEach((u, i) => {
    const lap = lapOf(view, i, p, { gems, rows })
    const rooms = lap.squares.filter((s) => s.kind === 'room').length
    const stops = lap.squares.filter((s) => s.kind === 'postcard' || s.kind === 'venue' || s.kind === 'neighbour').length
    const corners = lap.squares.filter((s) => s.kind === 'corner').length
    const venues = lap.squares.flatMap((s) => (s.kind === 'venue' ? [s.gem.id] : []))
    ok(`${p} · ${u.id}: all ${u.rooms.length} rooms, ${stops} stops, 4 corners, no venue twice`,
      rooms === u.rooms.length && corners === 4 && stops >= rooms && new Set(venues).size === venues.length,
      `${lap.w}×${lap.h}`)
  })
}

console.log('\nno dice: rooms move you')
const units = pathUnits(undefined, NOW, 'visiting')
const u = 1 // the first board after the basics
const ids = units[u].rooms.map((r) => r.id)
const lapAt = (finished: string[], extra: Partial<typeof empty> = {}) =>
  lapOf(pathView({ ...empty, ...extra, finished_cards: finished }, units, open, NOW), u, 'visiting', { gems, rows })
const zero = lapAt([])
ok('nothing laid → on Partida, nothing past it reached', zero.token === 0 && zero.squares.filter((s) => s.reached).length === 1)
const one = lapAt([ids[2]])
const firstRoom = one.squares.find((s) => s.kind === 'room')!
ok('one room laid, whichever → on the square after the first room (order is a suggestion)', one.token === firstRoom.at + 1)
ok('and the surprise straight after it is turned over at once', one.squares[firstRoom.at + 1].reached && one.squares[firstRoom.at + 1].kind !== 'room')
const two = lapAt(ids.slice(0, 2))
ok('the stop between two laid rooms is turned over', two.squares.some((s) => s.kind !== 'room' && s.kind !== 'corner' && s.reached))
const all = lapAt(ids)
ok('every room laid → home on Partida, the lap complete, everything reached', all.complete && all.token === 0 && all.squares.every((s) => s.reached))
const code = (src('components/path/lap.ts') + src('components/path/Board.tsx')).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
ok('there is no dice anywhere', !/Math\.random|dice|roll\(/i.test(code))

console.log('\nonly rooms move you')
const coldRoom = units[u].rooms[0]
const proof = [{ pt: coldRoom.release.answer, clean: true, at: NOW.toISOString() }]
ok('saying a room cold does not move you a square further — the gold edge rewards it', lapAt([ids[0]], { proof } as never).token === firstRoom.at + 1)
ok('and there is no voice switch on the board any more', !/board-voice|dub\.board\.voice/.test(src('components/path/Board.tsx')))

console.log('\nthe holiday')
const rec = { holidays: ['visiting:arrive@' + NOW.toISOString()] }
ok(`a week off: on holiday for ${HOLIDAY_DAYS} days, then not`,
  onHoliday(rec, new Date(NOW.getTime() + 6 * 864e5)) !== null && onHoliday(rec, new Date(NOW.getTime() + 8 * 864e5)) === null)
ok('nothing drifts in any view while away (pathView reads it)', /!away && roomSlipping/.test(src('components/path/progress.ts')))
ok('holidays sync between devices', /holidays: setUnion/.test(src('lib/merge.ts')))
ok('one holiday per board', /startsWith\(board \+ '@'\)/.test(src('engine/learner.ts')))
ok('the real prize stays off until there is a sponsor and approved terms', HOLIDAY_PRIZE === null)

console.log('\ntailored to the reason for being here')
for (const p of ['visiting', 'staying', 'moving'] as Purpose[]) {
  const bad = POSTCARDS[p].filter((c) => (c.kind === 'cheat' ? !CHEATS.some((x) => x.id === c.id) : !IDIOMS.some((x) => x.id === c.id)))
  ok(`${p}: every postcard is a real card`, bad.length === 0, bad.map((b) => b.id).join(','))
  const blue = POSTCARDS[p].filter((c) => c.kind === 'idiom' && IDIOMS.find((x) => x.id === c.id)?.blue)
  ok(`${p}: no blue idiom turns up unasked on a postcard`, blue.length === 0)
}
ok('three reasons, three different orders of postcards', new Set(Object.values(POSTCARDS).map((l) => l.map((c) => c.id).join())).size === 3)
ok('the corners speak to each reason', CORNERS.visiting.mesa.title !== CORNERS.moving.mesa.title && CORNERS.visiting.ferias.title !== CORNERS.moving.ferias.title)
const food = lapOf(pathView(empty, units, open, NOW), units.findIndex((x) => x.id === 'food'), 'visiting', { gems, rows })
const trains = food.squares.filter((s) => s.kind === 'venue' && units.find((x) => x.id === 'food')!.rooms.some((r) => r.id === s.gem.room))
ok('venues are the places these rooms train for, when there are any', trains.length > 0, trains.length + ' on Coffee & food')

console.log('\nnot a famous board game')
const words = src('components/path/Board.tsx') + JSON.stringify(CORNERS)
const banned = ['Free Parking', 'Go to Jail', 'Community Chest', 'Chance', 'Monopoly', 'Sorte', 'Caixa da Comunidade', 'rent', 'hotel', 'Pass Go']
const found = banned.filter((b) => new RegExp('\\b' + b + '\\b', 'i').test(words.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')))
ok('none of its names in what is drawn', found.length === 0, found.join(', '))

console.log('\nthe third view')
const home = src('components/path/PathHome.tsx')
ok('PathHome: Board | Panel | Road, remembered per device, Board by default',
  /<Board\b/.test(home) && /'panel' \| 'road' \| 'board'/.test(home) && /useState<PathMode>\('board'\)/.test(home) && home.indexOf('data-mode="board"') < home.indexOf('data-mode="panel"'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nround the board')
