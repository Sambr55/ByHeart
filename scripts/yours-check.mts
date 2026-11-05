/**
 * Yours, and that nothing a learner has can quietly vanish (2026-11-04).
 *
 *   npm run yours
 *
 * Sam: "if we reverse some of it out how do we ensure we don't lose anything and it gets
 * logically surfaced elsewhere at the right moment?" This is the answer in code. It seeds a
 * learner with one of every kind of thing they can have and fails if any of it has nowhere
 * to show — on Yours once it exists, and an invitation somewhere else before it does.
 */
import { readFileSync } from 'node:fs'
import { pathUnits } from '../content/path'
import { collected, decks, type CardKind } from '../content/collection'
import { CHEATS } from '../content/cheats'
import { IDIOMS } from '../content/idioms'
import { DROPS } from '../content/drops'
import { CRATES, PIECES, SETS } from '../content/roots'
import { LEGEND_FRAMES } from '../content/legend'
import { HOMES, LIBRARY_ORDER, placeKeysToGems, whatYouCanSay } from '../content/yours'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

const rooms = pathUnits(undefined, new Date('2026-11-04'), 'moving').flatMap((u) => u.rooms)
const five = rooms.filter((r) => r.id !== 'lisbon_legend' && !r.id.startsWith('fun_')).slice(0, 5)
const firstLine = five[0].lines[0].pt

console.log('\nwhat you can say')
const can = whatYouCanSay({
  purpose: 'moving',
  finished_cards: [...five.map((r) => r.id), 'lisbon_legend', 'fun_x'],
  proof: [{ pt: firstLine }],
  profile: { gender: null },
})
ok('every finished room is there, by level', can.rooms === 5, can.rooms + ' rooms in ' + can.levels.length + ' levels')
ok('with every one of their lines', can.lines === five.reduce((n, r) => n + r.lines.length, 0), can.lines + ' lines')
ok('a line said out loud carries its mark', can.cold === 1)
ok('Who you are (a sample person) and fun tiles are not "what you can say"', !can.levels.some((l) => l.rooms.some((r) => r.id === 'lisbon_legend' || r.id.startsWith('fun_'))))
const other = whatYouCanSay({ purpose: 'visiting', finished_cards: ['lisbon_nif'] })
ok('a room finished on another path is kept, not dropped', other.rooms === 1, other.levels.map((l) => l.title).join(', '))
ok('nothing finished → nothing drawn', whatYouCanSay({ purpose: 'moving', finished_cards: [] }).rooms === 0)

console.log('\nthe library: one of everything')
const hack = CHEATS.find((c) => c.kind === 'hack')!
const bluff = CHEATS.find((c) => c.kind === 'bluff')!
const cheat = CHEATS.find((c) => c.kind === 'cheat')!
const vibe = CRATES.find((c) => !c.drop)!
const piece = Object.keys(PIECES)[0]
const all = collected({
  sheet_got: [SETS[0].members[0]],
  sections_completed: [vibe.id],
  legend: [{ frame_id: LEGEND_FRAMES[0].id, values: { x: 'y' } }],
  drops_done: [DROPS[0].id],
  cheats_used: [hack.id, bluff.id, cheat.id],
  idioms_got: [IDIOMS[0].id],
  asked: [{ pt: 'Posso pagar com cartão?', en: 'Can I pay by card?', note: '', at: '2026-11-04' }],
  inventory: { [piece]: { at: '2026-11-04' } },
  stageNow: 'basics',
})
const live = decks(all).filter((d) => d.cards.some((c) => c.done))
for (const id of LIBRARY_ORDER) {
  const d = live.find((x) => x.id === id)
  ok('shelf "' + id + '" appears once it holds something', Boolean(d), d ? d.cards.filter((c) => c.done).length + ' done' : 'missing')
}
const empty = decks(collected({ stageNow: 'basics' })).filter((d) => d.cards.some((c) => c.done))
ok('and an empty learner has no shelves at all (no empty promos)', empty.length === 0, empty.map((d) => d.id).join(',') || 'none')

console.log('\nevery kind has a home')
const kinds: CardKind[] = ['sheet', 'vibe', 'frame', 'drop', 'words', 'idiom', 'asked', 'cheat']
const homeOf: Record<CardKind, keyof typeof HOMES> = {
  sheet: 'sheet', vibe: 'vibe', frame: 'legend', drop: 'drop', words: 'words', idiom: 'idiom', asked: 'asked', cheat: 'cheat',
}
for (const k of kinds) ok('library kind "' + k + '" is in HOMES', Boolean(HOMES[homeOf[k]]))
for (const k of ['room', 'proof', 'table', 'place', 'friend', 'hack', 'bluff'] as const) ok('"' + k + '" is in HOMES', Boolean(HOMES[k]))

console.log('\nthe invitations moved, not lost')
const yoursOut = src('components/YoursOut.tsx')
ok('Yours no longer shows "Host one" to everybody', !/Host one →/.test(yoursOut))
ok('Yours no longer shows "Nowhere yet"', !/Nowhere yet\. Every line/.test(yoursOut))
ok('places marked on a venue card count on Yours', /placeKeysToGems/.test(yoursOut) && placeKeysToGems(['gem:a', 'walk:1']).join() === 'a')
const here = src('components/city/GemHere.tsx')
ok('venue card: "I said it here"', /gem-said-here/.test(here) && /markWalkStop\('gem:'/.test(here))
ok('venue card: "host a table" at places to sit', /gem-host-table/.test(here) && /table\/new\?gem=/.test(here))
ok('and the host screen starts on that place', /get\('gem'\)/.test(src('components/table/HostTable.tsx')))
const home = src('components/path/PathHome.tsx')
ok('Path: bring a friend under the Boa! cheer', /cheer-bring-friend/.test(home) && /profile#people/.test(home))
ok('Path: a table nudge after level 2', /path-table-nudge/.test(home) && /level\.level >= 3/.test(home))
ok('Your people has the anchor the Path points at', /id="people"/.test(src('components/Friends.tsx')))
for (const p of ['visiting', 'staying', 'moving'] as const) {
  ok('the Legend is still offered on the ' + p + ' path (Who you are)', pathUnits(undefined, new Date('2026-11-04'), p).some((u) => u.rooms.some((r) => r.id === 'lisbon_legend')))
}
ok('Hacks, Bluffs & Cheats and Just for fun are still on the Path', /Hacks, Bluffs &amp; Cheats|Hacks, Bluffs & Cheats/.test(src('components/path/Foundations.tsx')) && /FunShelf/.test(home))
ok('What’s on is still a tap from City', /WHAT|What’s on|What's on/i.test(src('components/city/City.tsx')))

console.log('\nthe order of Yours')
const profile = src('components/Profile.tsx')
/*
  BY LEVEL OR BY KIND (2026-11-05): what you can say and the library are the two halves of one
  switch now, with a search over both — components/yours/YoursViews.tsx.
*/
const order = ['<Identity />', '<AtRisk />', '<YoursViews', '<YoursOut />', '<Friends />'].map((t) => profile.indexOf(t))
ok('you, keep it safe, what you can say / library, your Lisbon, people', order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), order.join(' < '))
const views = src('components/yours/YoursViews.tsx')
ok('the switch holds both: by level and by kind', views.includes('<CanSay') && views.includes('<Collection />'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nnothing is lost')
