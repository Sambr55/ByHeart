/**
 * SINTRA & CASCAIS — one city of two towns, from the boarding pass onwards (Sam, 2026-11-05).
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
import { WALKS, walkView, walksIn } from '../content/walks'
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
/* One chapter (Sam, 2026-11-05: "consolidate Cascais and Sintra into one 'City'"); two towns of bairros inside it. */
const CITY = 'sintra-cascais' as const
const TOWNS = ['cascais', 'sintra'] as const
const townOf = (id: string) => TOWNS.find((t) => id.startsWith(t + '-'))

console.log('\nthe boarding pass')
const booker = src('components/Booker.tsx')
{
  const c = chapterById(CITY)
  ok(`${c.pt} is one city (${c.code})`, c.id === CITY && CHAPTERS.some((x) => x.id === CITY))
  ok('the towns are not chapters of their own any more', !CHAPTERS.some((x) => (TOWNS as readonly string[]).includes(x.id)))
  ok(`${c.pt} is one line on the selector, boarding only when ready`, booker.includes(`code: '${c.code}', id: '${CITY}'`) && booker.includes(`open: true, town: '${CITY}'`) && /boarding\(place\)/.test(booker) && !/id: 'cascais'|id: 'sintra'/.test(booker))
  ok('anybody who booked a town is in the city now, not moved to Lisbon', chapterById('cascais').id === CITY && chapterById('sintra').id === CITY)
  ok('…in stored state too', /chapter: chapterIdOf\(parsed\.chapter\)/.test(src('engine/learner.ts')))
}
ok('booking sets the chosen city, not Lisbon', /setChapter\(chapter\)/.test(booker) && !/setChapter\(DEFAULT_CHAPTER\)/.test(booker))
ok('Settings can change city', /<CityChoice \/>/.test(src('components/Settings.tsx')))
ok('the boarding pass can be reopened (/trip), from the path header and Settings', existsSync(new URL('../app/trip/page.tsx', import.meta.url)) && /href="\/trip"/.test(src('components/path/PathHome.tsx')) && /href="\/trip"/.test(src('components/Theme.tsx')))
ok('reopening it never touches progress (it only books)', !/finished_cards|resetLearner\(/.test(src('components/Trip.tsx')))
ok('drafts can be turned on for one browser, never on the server', /typeof window === 'undefined'\) return false/.test(src('content/gems.ts')) && /drafts=on/.test(src('components/Theme.tsx')))

console.log('\nthe places')
const rooms = new Set(SITUATIONS.map((s) => s.id))
{
  const gems = gemsIn(CITY, GEMS)
  const bs = bairrosIn(CITY)
  ok('every bairro knows its city', bs.every((b) => b.chapter === CITY))
  for (const t of TOWNS) {
    const tb = bs.filter((b) => townOf(b.id) === t)
    const tg = gems.filter((g) => townOf(g.id) === t)
    ok(`${t}: has bairros and places`, tb.length >= 2 && tg.length >= 8, `${tb.length} bairros, ${tg.length} gems, ${tg.filter((g) => g.verified).length} checked`)
    ok(`${t}: a place's id names the town its bairro is in`, tg.every((g) => townOf(g.bairro) === t))
  }
  ok('every bairro and place names its town', bs.every((b) => townOf(b.id)) && gems.every((g) => townOf(g.id)))
  const far = gems.filter((g) => Math.min(...bs.map((b) => distanceM(b.centre, [g.lat, g.lng]))) > 15000)
  ok('every place is actually in or by the towns', far.length === 0, far.map((g) => g.id).join(','))
  const unsourced = gems.filter((g) => (g.sources ?? []).filter((u) => /^https?:\/\//.test(u)).length < 2)
  ok('every place has two sources', unsourced.length === 0, unsourced.map((g) => g.id).join(','))
  const badRoom = gems.filter((g) => !rooms.has(g.room))
  ok('every place trains in a real room', badRoom.length === 0, badRoom.map((g) => g.id + '→' + g.room).join(','))
  ok('every place has its line, in Portuguese and English', gems.every((g) => g.line?.pt && g.line?.en))
  const silent = gems.filter((g) => !g.verified && !g.unsure)
  ok('every place not yet checked says what is unsure', silent.length === 0, silent.map((g) => g.id).join(','))
  const live = gems.filter((g) => g.verified)
  ok('the live app has enough checked places to board (8+)', live.length >= 8, live.length + ' checked')
}
ok('no gem id twice across every city', new Set(GEMS.map((g) => g.id)).size === GEMS.length)
ok('no bairro id twice', new Set(BAIRROS.map((b) => b.id)).size === BAIRROS.length)

console.log('\nthe walks')
{
  const ws = walksIn(CITY)
  ok('walks in both towns', TOWNS.every((t) => ws.filter((w) => townOf(w.bairro) === t).length >= 2), ws.map((w) => w.id).join(', '))
  const strays = ws.flatMap((w) => w.stops.filter((s) => !GEMS.some((g) => g.id === s.gem && chapterOfBairro(g.bairro) === CITY)).map((s) => w.id + ':' + s.gem))
  ok('every stop is one of its own places', strays.length === 0, strays.join(','))
  const walkable = ws.filter((w) => walkView(w, GEMS.filter((g) => g.verified)))
  ok('at least one walk can be walked on the live app', walkable.length >= 1, walkable.map((w) => w.id).join(', '))
}
ok('no walk id twice', new Set(WALKS.map((w) => w.id)).size === WALKS.length)

console.log('\nthe boards')
{
  const own = walksIn(CITY).map((w) => w.id)
  const order = boardWalks(CITY, 'visiting', own)
  ok('its boards walk the city first, then the day trip to Lisbon', own.every((id, i) => order[i] === id) && order.length > own.length)
  const units = pathUnits(undefined, new Date('2026-11-05'), 'visiting')
  const view = pathView({ finished_cards: [], proof: [], evidence: [], mission_completed_at: {} } as never, units, () => 'open', new Date('2026-11-05'))
  const lap = lapOf(view, 0, 'visiting', { gems: GEMS, rows: [], walks: WALKS, chapter: CITY })
  const first = lap.squares.find((s) => s.kind === 'venue')
  ok('the first board’s first place is in the city', Boolean(first && first.kind === 'venue' && chapterOfBairro(first.gem.bairro) === CITY), first && first.kind === 'venue' ? first.gem.name : 'none')
}
ok('Lisbon’s boards are unchanged', lapOf(
  pathView({ finished_cards: [], proof: [], evidence: [], mission_completed_at: {} } as never, pathUnits(undefined, new Date('2026-11-05'), 'visiting'), () => 'open', new Date('2026-11-05')),
  0, 'visiting', { gems: GEMS, rows: [], walks: WALKS },
).walk?.id === 'graca-saturday')

console.log('\nwhat’s on')
const lis = rowsFor('lisbon', new Date('2026-11-05')).length
ok('Lisbon’s nights are the city’s too (forty minutes on the train)', rowsFor(CITY, new Date('2026-11-05')).length >= lis, `${lis} rows`)

console.log('\nits own paintings')
for (const p of ['visiting', 'staying', 'moving'] as const) {
  const a = panelArt(CITY, p)
  ok(`${p}: its own painting, on disk`, /\/panel\/(sintra|cascais)-/.test(a.src) && existsSync(new URL('../public' + a.src, import.meta.url)), a.src)
}

console.log('\nMonday’s place')
{
  const w = weeklyGem(new Date('2026-11-09T10:00:00Z'), null, CITY)
  ok('this week’s place is in the city', Boolean(w?.title.startsWith('This week in ' + chapterById(CITY).city + ': ')), w?.title)
  const old = weeklyGem(new Date('2026-11-09T10:00:00Z'), null, 'cascais')
  ok('…and for somebody still stored as a town', old?.title === w?.title)
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
console.log('\nboarding for Sintra & Cascais')
