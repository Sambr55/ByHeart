/**
 * CASCAIS AND SINTRA — from the boarding pass onwards (Sam, 2026-11-05).
 *
 *   npm run towns
 *
 * "In a while we are going to stand up Cascais and Sintra as an alternative to Lisbon" …
 * "lets do the cascais and sintra from airline selector onwards". This holds the line from
 * the selector to the venue: each town is a destination, its places are real, sourced and
 * in the town, its walks are its own, its boards walk it first, and nothing a person has not
 * checked reaches the live app.
 */
import { existsSync, readFileSync } from 'node:fs'
import { panelArt } from '../content/panel'
import { weeklyGem } from '../lib/push-plan'
import { situationById } from '../content/situations'
import { CHAPTERS, chapterById } from '../content/chapters'
import { BAIRROS, GEMS, bairrosIn, chapterOfBairro, cityCentre, distanceM, gemsIn } from '../content/gems'
import { WALKS, walksIn } from '../content/walks'
import { SITUATIONS } from '../content/situations'
import { boardWalks } from '../content/board'
import { rowsFor } from '../content/calendar'
import { pathUnits } from '../content/path'
import { pathView } from '../components/path/progress'
import { lapOf } from '../components/path/lap'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const TOWNS = ['cascais', 'sintra'] as const

console.log('\nthe boarding pass')
const booker = src('components/Booker.tsx')
for (const t of TOWNS) {
  const c = chapterById(t)
  ok(`${c.pt} is a city (${c.code})`, c.id === t && CHAPTERS.some((x) => x.id === t))
  ok(`${c.pt} is on the selector, boarding only when ready`, booker.includes(`code: '${c.code}', id: '${t}'`) && booker.includes(`open: cityReady('${t}')`))
}
ok('booking sets the chosen city, not Lisbon', /setChapter\(chapter\)/.test(booker) && !/setChapter\(DEFAULT_CHAPTER\)/.test(booker))
ok('Settings can change city', /<CityChoice \/>/.test(src('components/Settings.tsx')))

console.log('\nthe places')
const rooms = new Set(SITUATIONS.map((s) => s.id))
for (const t of TOWNS) {
  const gems = gemsIn(t, GEMS)
  const bs = bairrosIn(t)
  const name = chapterById(t).pt
  ok(`${name}: has bairros and places`, bs.length >= 2 && gems.length >= 8, `${bs.length} bairros, ${gems.length} gems`)
  ok(`${name}: ids carry the town`, bs.every((b) => b.id.startsWith(t + '-')) && gems.every((g) => g.id.startsWith(t + '-')))
  ok(`${name}: every bairro knows its town`, bs.every((b) => b.chapter === t))
  const far = gems.filter((g) => distanceM(cityCentre(t), [g.lat, g.lng]) > 15000)
  ok(`${name}: every place is actually in or by the town`, far.length === 0, far.map((g) => g.id).join(','))
  const unsourced = gems.filter((g) => (g.sources ?? []).filter((u) => /^https?:\/\//.test(u)).length < 2)
  ok(`${name}: every place has two sources`, unsourced.length === 0, unsourced.map((g) => g.id).join(','))
  const badRoom = gems.filter((g) => !rooms.has(g.room))
  ok(`${name}: every place trains in a real room`, badRoom.length === 0, badRoom.map((g) => g.id + '→' + g.room).join(','))
  ok(`${name}: every place has its line, in Portuguese and English`, gems.every((g) => g.line?.pt && g.line?.en))
  ok(`${name}: nothing is marked verified by a script`, gems.every((g) => g.verified === false))
}
ok('no gem id twice across every city', new Set(GEMS.map((g) => g.id)).size === GEMS.length)
ok('no bairro id twice', new Set(BAIRROS.map((b) => b.id)).size === BAIRROS.length)

console.log('\nthe walks')
for (const t of TOWNS) {
  const ws = walksIn(t)
  const name = chapterById(t).pt
  ok(`${name}: two walks`, ws.length >= 2, ws.map((w) => w.id).join(', '))
  const strays = ws.flatMap((w) => w.stops.filter((s) => !GEMS.some((g) => g.id === s.gem && chapterOfBairro(g.bairro) === t)).map((s) => w.id + ':' + s.gem))
  ok(`${name}: every stop is one of its own places`, strays.length === 0, strays.join(','))
}
ok('no walk id twice', new Set(WALKS.map((w) => w.id)).size === WALKS.length)

console.log('\nthe boards')
for (const t of TOWNS) {
  const own = walksIn(t).map((w) => w.id)
  const order = boardWalks(t, 'visiting', own)
  ok(`${chapterById(t).pt}: its boards walk the town first, then the day trip to Lisbon`, own.every((id, i) => order[i] === id) && order.length > own.length)
  const units = pathUnits(undefined, new Date('2026-11-05'), 'visiting')
  const view = pathView({ finished_cards: [], proof: [], evidence: [], mission_completed_at: {} } as never, units, () => 'open', new Date('2026-11-05'))
  const lap = lapOf(view, 0, 'visiting', { gems: GEMS, rows: [], walks: WALKS, chapter: t })
  const first = lap.squares.find((s) => s.kind === 'venue')
  ok(`${chapterById(t).pt}: the first board's first place is in the town`, Boolean(first && first.kind === 'venue' && chapterOfBairro(first.gem.bairro) === t), first && first.kind === 'venue' ? first.gem.name : 'none')
}
ok('Lisbon’s boards are unchanged', lapOf(
  pathView({ finished_cards: [], proof: [], evidence: [], mission_completed_at: {} } as never, pathUnits(undefined, new Date('2026-11-05'), 'visiting'), () => 'open', new Date('2026-11-05')),
  0, 'visiting', { gems: GEMS, rows: [], walks: WALKS },
).walk?.id === 'graca-saturday')

console.log('\nwhat’s on')
const lis = rowsFor('lisbon', new Date('2026-11-05')).length
ok('Lisbon’s nights are the towns’ too (forty minutes on the train)', TOWNS.every((t) => rowsFor(t, new Date('2026-11-05')).length >= lis), `${lis} rows`)

console.log('\ntheir own paintings')
for (const t of TOWNS) {
  for (const p of ['visiting', 'staying', 'moving'] as const) {
    const a = panelArt(t, p)
    ok(`${chapterById(t).pt} · ${p}: its own painting, on disk`, a.src.includes(t) && existsSync(new URL('../public' + a.src, import.meta.url)), a.src)
  }
}

console.log('\nMonday’s place')
for (const t of TOWNS) {
  const w = weeklyGem(new Date('2026-11-09T10:00:00Z'), null, t)
  ok(`${chapterById(t).pt}: this week’s place is in the town`, Boolean(w?.title.startsWith('This week in ' + chapterById(t).city + ': ')), w?.title)
}
ok('the cron passes the learner’s town', /weeklyGem\(new Date\(\), [^)]*row\.state\?\.chapter/.test(src('app/api/cron/line/route.ts')))
ok('the inbox’s place is the learner’s town', /gemOfTheWeekIn\(chapter, now\)/.test(src('content/inbox.ts')))

console.log('\nthe lessons are everybody’s')
/*
  Path rooms are shared by Lisbon, Cascais and Sintra, so none may say Lisbon unless it is
  true from all three. One is, on purpose: "the last train to Lisbon" — both towns' lines run in.
*/
const ALLOWED = new Set(['A que horas é o último comboio para Lisboa?', 'What time is the last train to Lisbon?'])
const ids = new Set<string>()
for (const p of ['visiting', 'staying', 'moving'] as const) for (const u of pathUnits(undefined, new Date('2026-11-05'), p)) for (const r of u.rooms) ids.add(r.id)
const said: string[] = []
const SKIP = /^(id|image|src|slug|audio|chapter|sources?|unsure|blocks|pieces)$/
const scan = (o: unknown, where: string) => {
  if (typeof o === 'string') { if (/Lisbo[an]/.test(o) && !ALLOWED.has(o) && !/^\/|https?:/.test(o)) said.push(where) }
  else if (Array.isArray(o)) o.forEach((x, i) => scan(x, where + '[' + i + ']'))
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (!SKIP.test(k)) scan(v, where + '.' + k)
}
for (const id of ids) scan(situationById(id), id)
ok('no path room says Lisbon where a town learner would read it', said.length === 0, said.join(', '))
ok('a room’s header names the learner’s town', /chapterById\(me\.chapter \?\? situation\.chapter\)/.test(src('components/Errand.tsx')))

console.log('\nthe screens say the town')
for (const f of ['components/path/PathHome.tsx', 'components/city/City.tsx', 'components/path/RoomGate.tsx']) {
  ok(f + ': no fixed "Lisboa" label', !/>Lisboa</.test(src(f)))
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nboarding for Cascais and Sintra')
