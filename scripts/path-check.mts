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
import {
  dayStreak,
  pathView,
  milestoneStars,
  understoodMilestone,
  understoodCheer,
  UNDERSTOOD_MILESTONES,
  type PathRecord,
} from '../components/path/progress'
import { readFileSync } from 'node:fs'
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
  /*
    THE SAVE COMES FIRST, ON EVERY PATH (Sam, 2026-11-02): "at the very least you can say
    'I am sorry I don't understand, I am English' in Portuguese." The argument each path
    makes still starts straight after it — the NIF, the airport — so both are asserted.
  */
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    ok(purpose + ': the save is the first room of the first unit', PATHS[purpose][0].rooms[0] === 'lisbon_save', PATHS[purpose][0].rooms[0])
    ok(purpose + ': and it is free', FREE_BY_PURPOSE[purpose].includes('lisbon_save'))
  }
  ok('moving starts with the paperwork, straight after the save', PATHS.moving[0].rooms[1] === 'lisbon_nif')
  ok('the trip starts at the airport, straight after the save', PATHS.visiting[0].rooms[1] === 'lisbon_aeroporto')
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

console.log('\nthe understood tally — little wins, never pressure\n')
{
  /*
    Sam, 2026-11-02: "Count the times you were understood, not your streak … the little
    wins of being understood are phenomenal and confidence boosting." The count lives on the
    learner and only SayButton raises it; the moments are pure and checked here.
  */
  ok('nothing said, nothing to celebrate', understoodMilestone(0, 0) === null)
  ok('the first one is celebrated', understoodMilestone(1, 0) === 1)
  ok('and only once', understoodMilestone(1, 1) === null && understoodMilestone(3, 1) === null)
  ok('five, ten, twenty-five, fifty, a hundred', [5, 10, 25, 50, 100].every((m) => understoodMilestone(m, m === 5 ? 1 : m === 10 ? 5 : m === 25 ? 10 : m === 50 ? 25 : 50) === m))
  ok('jumping past two celebrates the higher one, once', understoodMilestone(12, 1) === 10)
  ok('every milestone has its own words', new Set(UNDERSTOOD_MILESTONES.map(understoodCheer)).size === UNDERSTOOD_MILESTONES.length)
  ok('no cheer counts down to the next one', UNDERSTOOD_MILESTONES.every((m) => !/\b(next|left|to go|until|more)\b/i.test(understoodCheer(m))))
  const say = readFileSync('components/SayButton.tsx', 'utf8')
  ok('SayButton counts a close result, once', (say.match(/recordUnderstood\(\)/g) ?? []).length === 1 && /if \(h\.close\) recordUnderstood\(\)/.test(say))
  const home = readFileSync('components/path/PathHome.tsx', 'utf8')
  ok('the tally has the header spot', /<UnderstoodChip count=\{understood\} \/>/.test(home))
  ok('the streak is demoted, not deleted', /data-testid="streak"/.test(home) && !/<Streak /.test(home))
  ok('the home screen opens the rescue card', /href="\/opener"/.test(home))
  const manifest = readFileSync('app/manifest.ts', 'utf8')
  ok('and the manifest has it as a shortcut', /shortcuts:[\s\S]*url: '\/opener'/.test(manifest))
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe path holds')
