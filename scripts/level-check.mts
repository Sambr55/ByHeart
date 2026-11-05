/**
 * The level recap, its test, and searching Yours (2026-11-05).
 *
 *   npm run level
 *
 * Sam: "When a user completes a level I want them to see a summary recap and have the
 * ability to retest themselves … add a search facility." Seeds a learner through one level
 * and fails if the recap misses anything the level gave, if the test does not ask all of
 * it, if the recap would open on the wrong room, or if search cannot find it again.
 */
import { pathUnits } from '../content/path'
import { CHEATS } from '../content/cheats'
import { PIECES, roomPieceIds } from '../content/roots'
import { completedBy, levelComplete, levelKey, levelRecap, levelRevision, metOn } from '../content/level'
import { revisionFor, revisionTitle } from '../content/revision'
import { searchYours, yoursIndex } from '../content/yours-search'
import { mergeLearner } from '../lib/merge'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}

const now = new Date('2026-11-05')
const purpose = 'visiting' as const
const units = pathUnits(undefined, now, purpose)
const unit = units.find((u) => u.rooms.length >= 2)!
const ids = unit.rooms.map((r) => r.id)
const open = () => 'open' as const
const owned = Object.fromEntries(unit.rooms.flatMap((r) => roomPieceIds(r)).map((id) => [id, { strength: 1 }]))

console.log('\nwhen the last room is laid')
const allButLast = ids.slice(0, -1)
const last = ids[ids.length - 1]
ok('laying the last room finishes the level', completedBy(last, { finished_cards: allButLast, purpose }, open, now)?.unit.id === unit.id)
ok('laying any other room does not', completedBy(ids[0], { finished_cards: ids.slice(1, -1), purpose }, open, now) === null)
ok('a level of only paid rooms is never "complete"', !levelComplete(unit, [], () => 'paid'))
ok('a paid room does not hold the level back', levelComplete(unit, allButLast, (id) => (id === last ? 'paid' : 'open')))

console.log('\nthe recap')
const key = levelKey(purpose, unit.id)
const met = [key + ':venue:' + 'nope', key + ':postcard:' + CHEATS[0].id, 'staying:' + unit.id + ':postcard:' + CHEATS[0].id]
const me = { finished_cards: ids, purpose, proof: [{ pt: unit.rooms[0].lines[0].pt, clean: true }], inventory: owned, board_met: met, profile: { gender: null } }
const recap = levelRecap(unit.id, me, now)!
/* Who you are and the fun tiles are not "what you can say" — see content/yours.ts. */
const sayable = unit.rooms.filter((r) => r.id !== 'lisbon_legend' && !r.id.startsWith('fun_'))
const lines = sayable.reduce((n, r) => n + r.lines.length, 0)
ok('every room of the level is in it', recap.rooms.length === sayable.length, recap.rooms.length + ' rooms')
ok('with every line', recap.lines === lines, recap.lines + ' lines')
ok('a line said cold keeps its gold mark', recap.cold >= 1)
ok('the words the rooms banked', recap.words.length > 0 && recap.words.every((w) => PIECES[w.id]), recap.words.length + ' words')
ok('the practice shape', recap.shape?.id === unit.milestone.cheat)
ok('what this board showed, and only this path’s board', recap.met.length === 1 && metOn(key, met).length === 1)
ok('nothing laid → no rooms to recap', levelRecap(unit.id, { finished_cards: [], purpose }, now)!.rooms.length === 0)

console.log('\ntest yourself on this level — all of it')
const asks = levelRevision(unit.id, { finished_cards: ids, purpose }, now)
const answers = new Set(asks.map((a) => a.answer.toLowerCase()))
ok('every room’s release', sayable.every((r) => answers.has(r.release.answer.toLowerCase())))
ok('every line', sayable.every((r) => r.lines.every((l) => answers.has(l.pt.toLowerCase()))))
const cheat = CHEATS.find((c) => c.id === unit.milestone.cheat)
ok('the practice shape’s three sentences', !cheat || cheat.says.every((l) => answers.has(l.pt.toLowerCase())))
ok('not the sample person from Who you are', !unit.rooms.some((r) => r.id === 'lisbon_legend') || !asks.some((a) => /Chamo-me/.test(a.answer)))
ok('nothing asked twice', answers.size === asks.length, asks.length + ' asks')
ok('only rooms laid', levelRevision(unit.id, { finished_cards: [ids[0]], purpose }, now).every((a) => !unit.rooms.slice(1).some((r) => r.release.answer === a.answer && !unit.rooms[0].lines.some((l) => l.pt === a.answer))))
const fem = levelRevision(unit.id, { finished_cards: ids, purpose, gender: 'f' }, now)
const gendered = unit.rooms.flatMap((r) => r.lines).find((l) => l.f && l.f !== l.pt)
ok('a woman is asked in her own endings', !gendered || fem.some((a) => a.answer === gendered.f))
ok('/revise?kind=level asks the same', revisionFor('level', unit.id, { finished_cards: ids, purpose }).length === asks.length)
ok('and is titled by its level', revisionTitle('level', unit.id, purpose).startsWith('Level '))

console.log('\nsearching Yours')
const index = yoursIndex(me as unknown as Parameters<typeof yoursIndex>[0], now)
const line = unit.rooms[0].lines[0]
const plain = line.pt.normalize('NFD').replace(/[̀-ͯ]/g, '')
ok('finds a line by its Portuguese, accents optional', searchYours(index, plain.slice(0, 12)).some((f) => f.pt === line.pt))
ok('finds a line by its English', searchYours(index, line.en.slice(0, 10)).some((f) => f.en === line.en))
ok('says which level it lives in', searchYours(index, line.en.slice(0, 10)).some((f) => f.where.startsWith('Level ')))
const w = recap.words[0]
ok('finds a word', searchYours(index, w.pt).some((f) => f.where === 'Words'))
ok('a nonsense query finds nothing (and goes to the translator)', searchYours(index, 'zzqxj').length === 0)
ok('one letter is not a search', searchYours(index, 'a').length === 0)

console.log('\nthe new record survives a sync')
const m = mergeLearner({ board_met: ['a'], recaps_seen: ['x'] } as never, { board_met: ['b'], recaps_seen: ['y'] } as never) as { board_met: string[]; recaps_seen: string[] }
ok('board_met is a union', m.board_met?.length === 2)
ok('recaps_seen is a union', m.recaps_seen?.length === 2)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nall good')
