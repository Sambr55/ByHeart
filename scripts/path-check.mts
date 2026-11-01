/**
 * The Lisbon path, checked on plain objects.
 *
 *   npm run path
 *
 * The streak is a pure function of timestamps and the path is a pure function of which
 * rooms exist, so both can be proved here without a browser.
 */
import { PATH_UNITS, pathUnits } from '../content/path'
import { situationById } from '../content/situations'
import { dayStreak, pathView, milestoneStars, type PathRecord } from '../components/path/progress'
import { CHEATS } from '../content/cheats'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}

console.log('\nthe streak counts days, not events\n')
const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).toISOString()
const now = new Date(2026, 10, 1, 18)
ok('nothing done is zero', dayStreak([], now).days === 0)
ok('today alone is one', dayStreak([at(2026, 11, 1)], now).days === 1)
ok('five events in one day are still one', dayStreak([1, 2, 3, 4, 5].map((h) => at(2026, 11, 1, h)), now).days === 1)
ok('three days running is three', dayStreak([at(2026, 11, 1), at(2026, 10, 31), at(2026, 10, 30)], now).days === 3)
const notYet = dayStreak([at(2026, 10, 31), at(2026, 10, 30)], now)
ok('not done today yet still counts yesterday', notYet.days === 2 && !notYet.today)
ok('a missed day breaks it', dayStreak([at(2026, 11, 1), at(2026, 10, 30)], now).days === 1)
ok('two days ago is broken', dayStreak([at(2026, 10, 30)], now).days === 0)
ok('a month boundary is crossed', dayStreak([at(2026, 11, 1), at(2026, 10, 31), at(2026, 10, 30)], now).days === 3)
ok('junk timestamps are ignored', dayStreak(['nope', at(2026, 11, 1)], now).days === 1)

console.log('\nthe path is only what exists\n')
const units = pathUnits()
const ids = units.flatMap((u) => u.rooms.map((r) => r.id))
ok('every room on it resolves', ids.every((id) => Boolean(situationById(id))))
ok('no room appears twice', new Set(ids).size === ids.length)
ok('every listed id is either real or in the expected pending set', PATH_UNITS.flatMap((u) => u.rooms).every((id) =>
  Boolean(situationById(id)) || ['lisbon_aeroporto', 'lisbon_checkin', 'lisbon_cartao_sim', 'lisbon_supermercado', 'lisbon_praia', 'lisbon_casa_de_banho', 'lisbon_emergencia', 'lisbon_roubo'].includes(id)))
ok('every milestone is a real cheat', PATH_UNITS.every((u) => CHEATS.some((c) => c.id === u.milestone.cheat)))
const none = pathUnits(() => undefined)
ok('a path with no rooms has no units', none.length === 0)
console.log('  ' + units.length + ' units, ' + ids.length + ' rooms playable now')

console.log('\nprogress is read from the record, and order never locks\n')
const empty: PathRecord = { finished_cards: [], proof: [], evidence: [], mission_completed_at: {} }
const open = pathView(empty, units, () => 'open')
ok('the first room is next', open.next?.room.id === ids[0])
ok('exactly one room glows', open.units.flatMap((u) => u.nodes).filter((n) => n.state === 'next').length === 1)
ok('everything else is open, not locked', open.units.flatMap((u) => u.nodes).every((n) => n.state === 'next' || n.state === 'open'))
const first = units[0].rooms[0]
const did: PathRecord = {
  ...empty,
  finished_cards: [first.id],
  proof: [{ pt: first.release.answer, en: first.release.ask, source: 'room', clean: true, at: now.toISOString() }],
}
const after = pathView(did, units, () => 'open')
ok('a finished room is done, and said cold', after.units[0].nodes[0].state === 'done' && after.units[0].nodes[0].cold)
ok('next moves on', after.next?.room.id === ids[1])
const paid = pathView(empty, units, (id) => (id === ids[0] ? 'paid' : 'open'))
ok('a paid room is skipped by next, not blocking it', paid.units[0].nodes[0].state === 'paid' && paid.next?.room.id === ids[1])
const cheat = CHEATS.find((c) => c.id === 'quero_hack')!
ok('stars count clean cheat lines', milestoneStars({ ...empty, proof: cheat.says.slice(0, 2).map((l) => ({ pt: l.pt, en: l.en, source: 'release' as const, clean: true, at: '' })) }, 'quero_hack') === 2)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe path holds')
