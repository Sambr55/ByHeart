/**
 * The Lisbon path, checked on plain objects.
 *
 *   npm run path
 *
 * The streak is a pure function of timestamps and the path is a pure function of which
 * rooms exist, so both can be proved here without a browser.
 */
import { PATH_UNITS, PATHS, pathUnits } from '../content/path'
import { FREE_BY_PURPOSE } from '../lib/entitlements'
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

console.log('\nthe path follows the reason given at set-up\n')
{
  /*
    Sam, 2026-11-02: moving here and a trip are different paths. Each one must resolve in
    full, open with a free room, and be different from the others where it matters.
  */
  for (const [purpose, list] of Object.entries(PATHS) as [keyof typeof PATHS, typeof PATH_UNITS][]) {
    const resolved = pathUnits(undefined, undefined, purpose)
    const rids = resolved.flatMap((u) => u.rooms.map((r) => r.id))
    const listed = list.flatMap((u) => u.rooms)
    ok(purpose + ': every listed room exists', listed.every((id) => Boolean(situationById(id))), listed.filter((id) => !situationById(id)).join(', '))
    ok(purpose + ': no room twice', new Set(rids).size === rids.length)
    ok(purpose + ': every milestone is a real cheat', list.every((u) => CHEATS.some((c) => c.id === u.milestone.cheat)))
    const free = FREE_BY_PURPOSE[purpose]
    ok(purpose + ': the very first room is free', free.includes(rids[0]), rids[0])
    ok(purpose + ': every free room is on this path', free.every((id) => rids.includes(id)), free.filter((id) => !rids.includes(id)).join(', '))
    ok(purpose + ': the emergency room is free', free.includes('lisbon_emergencia'))
    console.log('    ' + resolved.length + ' units, ' + rids.length + ' rooms')
  }
  ok('no purpose gets the trip', pathUnits(undefined, undefined, null)[0].id === PATHS.visiting[0].id)
  ok('moving starts with the paperwork', PATHS.moving[0].rooms[0] === 'lisbon_nif')
  ok('the trip starts at the airport', PATHS.visiting[0].rooms[0] === 'lisbon_aeroporto')
}

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
