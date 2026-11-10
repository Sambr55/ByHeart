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
import { pathLevel, pathView, recapWaiting } from '../components/path/progress'
import { boardSize, cellOf, cornerAt, lapOf } from '../components/path/lap'
import { CORNERS, POSTCARDS } from '../content/board'
import { BOARD_ORDER } from '../content/board-order'
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
  ok(`${n} rooms → ${w}×${h}, a stop after every room and three corners`, 2 * (w + h) - 4 === 4 + 2 * Math.max(2, n) && w <= h && w >= 3)
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
  ok(`${w}×${h}: Partida bottom left, A mesa top right, Até agora the last square before home`,
    cellOf(c.start, w, h).join() === `0,${h - 1}` && cellOf(c.mesa, w, h).join() === `${w - 1},0` &&
    c.trip === L - 1 && cellOf(c.trip, w, h).join() === `1,${h - 1}`)
}

console.log('\nevery board, on every path')
for (const p of ['visiting', 'staying', 'moving'] as Purpose[]) {
  const units = pathUnits(undefined, NOW, p)
  const view = pathView(empty, units, open, NOW)
  units.forEach((u, i) => {
    const lap = lapOf(view, i, p, { gems, rows })
    const rooms = lap.squares.filter((s) => s.kind === 'room').length
    const stops = lap.squares.filter((s) => s.kind === 'postcard' || s.kind === 'venue' || s.kind === 'neighbour' || s.kind === 'vibe').length
    const corners = lap.squares.filter((s) => s.kind === 'corner').length
    const venues = lap.squares.flatMap((s) => (s.kind === 'venue' ? [s.gem.id] : []))
    ok(`${p} · ${u.id}: all ${u.rooms.length} rooms, ${stops} stops, 3 corners, no venue twice`,
      rooms === u.rooms.length && corners === 3 && stops > rooms && new Set(venues).size === venues.length,
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
const waiting = lapOf(pathView({ ...empty, finished_cards: ids }, units, open, NOW), u, 'visiting', { gems, rows, recapSeen: false })
ok('…but until the recap is seen the token waits on Até agora, the last square', waiting.complete && waiting.token === waiting.squares.length - 1 && waiting.squares[waiting.token].kind === 'corner')
const rooms = all.squares.filter((s) => s.kind === 'room')
ok('and every room comes before it', rooms.every((s) => s.at < all.squares.length - 1))

console.log('\nboards in the order set by hand (content/board-order.ts, from Sam\'s board map)')
for (const [p, boards] of Object.entries(BOARD_ORDER) as [Purpose, Record<string, string[]>][]) {
  const us = pathUnits(undefined, NOW, p)
  for (const [unitId, order] of Object.entries(boards)) {
    const i = us.findIndex((x) => x.id === unitId)
    ok(`${p} · ${unitId}: is a board on that path`, i !== -1)
    if (i === -1) continue
    const lap = lapOf(pathView(empty, us, open, NOW), i, p, { gems, rows })
    const got = lap.squares.map((s) => s.key.split(':').slice(2, 3)[0] + ':' + s.key.split(':').slice(3).join(':'))
    /* Places and what's on rotate with the city: the slot's kind is what must hold. */
    const same = order.length === got.length && order.every((e, k) => (e.startsWith('venue:') || e.startsWith('neighbour:') ? got[k].split(':')[0] === e.split(':')[0] : got[k] === e))
    ok(`${p} · ${unitId}: laid out exactly as the map says`, same, same ? '' : got.join(' '))
  }
}

console.log('\nevery square (Sam, 2026-11-10: "board two is closing before I have completed it")')
{
  const v = pathView({ ...empty, finished_cards: ids }, units, open, NOW)
  const bare = lapOf(v, u, 'visiting', { gems, rows, recapSeen: false, opened: [] })
  const stops = bare.squares.filter((s) => s.kind !== 'room' && s.kind !== 'corner')
  ok('lessons laid, nothing opened → not complete', bare.roomsLaid && !bare.complete && bare.toOpen.length === stops.length)
  ok('…every stop is face up to open, but So far is not', stops.every((s) => s.reached) && !bare.squares[bare.squares.length - 1].reached)
  ok('…and the token stands on the first square still to open', bare.token === stops[0].at)
  const most = lapOf(v, u, 'visiting', { gems, rows, recapSeen: false, opened: stops.slice(1).map((s) => s.key) })
  ok('one left → still not complete, token on it', !most.complete && most.toOpen.length === 1 && most.token === stops[0].at)
  const all = lapOf(v, u, 'visiting', { gems, rows, recapSeen: false, opened: stops.map((s) => s.key) })
  ok('every square opened → complete, token on So far', all.complete && all.token === all.squares.length - 1)
  const lvl = (seen: string[], finished: string[]) =>
    pathLevel(pathView({ ...empty, finished_cards: finished }, units, open, NOW), (id) => seen.includes(id)).level
  const twoLaid = [...units[0].rooms, ...units[1].rooms].map((r) => r.id)
  ok('a board with its lessons laid is still the level you are on until its So far is seen', lvl([units[0].id], twoLaid) === 2)
  ok('…and passed once it is', lvl([units[0].id, units[1].id], twoLaid) === 3)
  ok('somebody already laying rooms further on is not pulled back', lvl([], [...twoLaid, units[2].rooms[0].id]) === 3)
  ok('opening is synced between devices', /board_opened: setUnion/.test(src('lib/merge.ts')))
  ok('the Panel and the Road count a chip as opening', /markBoardOpened/.test(src('components/path/LevelStops.tsx')))
  ok('the trip so far is only seen once the board is complete', /opened: learner\.board_opened/.test(src('components/LevelRecap.tsx')))
}

console.log('\nso far, in order, and never on a paid board (review, 2026-11-10)')
{
  const paidFrom2 = (id: string) => (units.findIndex((x) => x.rooms.some((r) => r.id === id)) >= 2 ? ('paid' as const) : ('open' as const))
  const laid = [...units[0].rooms, ...units[1].rooms].map((r) => r.id)
  const v = pathView({ ...empty, finished_cards: laid }, units, paidFrom2, NOW)
  const paidLap = lapOf(v, 2, 'visiting', { gems, rows, recapSeen: false })
  ok('a board of only paid rooms is not complete, and its token stays home', !paidLap.complete && paidLap.token === 0)
  ok('the first unseen summary waits, not the last level finished', recapWaiting(v, () => false) === 0)
  ok('then the next one', recapWaiting(v, (id) => id === units[0].id) === 1)
  ok('and none once both are seen', recapWaiting(v, () => true) === -1)
  const early = pathView({ ...empty, finished_cards: units[1].rooms.map((r) => r.id) }, units, open, NOW)
  ok('a later board finished first still waits for its summary', recapWaiting(early, () => false) === 1)
  ok('a recap opened halfway round is not marked seen', /!whole\) return/.test(src('components/LevelRecap.tsx')))
}
const code = (src('components/path/lap.ts') + src('components/path/Board.tsx')).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
ok('there is no dice anywhere', !/Math\.random|dice|roll\(/i.test(code))

console.log('\nonly rooms move you')
const coldRoom = units[u].rooms[0]
const proof = [{ pt: coldRoom.release.answer, clean: true, at: NOW.toISOString() }]
ok('saying a room cold does not move you a square further — the gold edge rewards it', lapAt([ids[0]], { proof } as never).token === firstRoom.at + 1)
ok('and there is no voice switch on the board any more', !/board-voice|dub\.board\.voice/.test(src('components/path/Board.tsx')))

console.log('\nno week off (Sam, 2026-11-10: "it doesn\'t add anything")')
ok('no Férias corner, and nothing on the board to take one', !/ferias|takeHoliday|board-away/.test(src('components/path/Board.tsx') + src('components/path/lap.ts') + src('content/board.ts').replace(/\/\*[\s\S]*?\*\//g, '')))

console.log('\ntailored to the reason for being here')
for (const p of ['visiting', 'staying', 'moving'] as Purpose[]) {
  const bad = POSTCARDS[p].filter((c) => (c.kind === 'cheat' ? !CHEATS.some((x) => x.id === c.id) : !IDIOMS.some((x) => x.id === c.id)))
  ok(`${p}: every postcard is a real card`, bad.length === 0, bad.map((b) => b.id).join(','))
  const blue = POSTCARDS[p].filter((c) => c.kind === 'idiom' && IDIOMS.find((x) => x.id === c.id)?.blue)
  ok(`${p}: no blue idiom turns up unasked on a postcard`, blue.length === 0)
}
/* Bob's your uncle teaches these twelve as a vibe: a postcard of the same idiom meets it twice (review, 2026-11-10). */
const BOB_IDIOMS = ['bobs_your_uncle', 'hold_your_horses', 'better_late_than_never', 'so_far_so_good', 'storm_in_a_teacup', 'here_we_go_again', 'once_in_a_blue_moon', 'youre_having_a_laugh', 'it_is_what_it_is', 'god_knows', 'the_last_straw', 'speak_of_the_devil']
const twice = Object.values(POSTCARDS).flat().filter((c) => c.kind === 'idiom' && BOB_IDIOMS.includes(c.id))
ok('no postcard repeats an idiom the Bob vibe teaches', twice.length === 0, twice.map((c) => c.id).join(', '))
ok('three reasons, three different orders of postcards', new Set(Object.values(POSTCARDS).map((l) => l.map((c) => c.id).join())).size === 3)
ok('the corners speak to each reason', CORNERS.visiting.mesa.title !== CORNERS.moving.mesa.title && CORNERS.visiting.trip.title !== CORNERS.moving.trip.title)
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
