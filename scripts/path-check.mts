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
import { readFileSync, existsSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CHEATS } from '../content/cheats'
import { Wall, keystoneLabel, BUILDING } from '../components/path/Wall'
import { roomSlipping, keystoneGlaze, SLIP_DAYS } from '../components/path/progress'
import { revisionFor, revisionTitle } from '../content/revision'
import { roomPieceIds } from '../content/roots'
import { parseBooking } from '../lib/booking'
import { SAVE_SENTENCE } from '../content/blocks/lisbon-save'

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

console.log('\nthe Wall — a course per unit, built from the bottom (2026-11-02)\n')
{
  /*
    Sam approved the Wall on 2026-11-02 after the review found the path "too Duolingo". It
    is rendered here for real — renderToStaticMarkup on plain records — so these are claims
    about the markup a phone receives, not about the source text.
  */
  const empty: PathRecord = { finished_cards: [], proof: [], evidence: [], mission_completed_at: {} }
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const us = pathUnits(undefined, undefined, purpose)
    const v = pathView(empty, us, () => 'open', now)
    const html = renderToStaticMarkup(
      createElement(Wall, { view: v, purpose, chapter: 'lisbon', inventory: {}, onLaid: () => {} }),
    )
    const courses = html.match(/data-course="[^"]+"/g) ?? []
    ok(purpose + ': the Wall renders a course per unit', courses.length === us.length, courses.length + ' of ' + us.length)
    ok(purpose + ': in path order in the DOM (drawn bottom-up by flex-col-reverse)', courses.map((c) => c.slice(13, -1)).join() === us.map((u) => u.id).join() && /flex-col-reverse/.test(html))
    ok(purpose + ': a tile per room', (html.match(/data-testid="tile"/g) ?? []).length === us.flatMap((u) => u.rooms).length)
    ok(purpose + ': a keystone per course', (html.match(/data-testid="keystone"/g) ?? []).length === us.length)
    ok(purpose + ': and it opens on the course you are on', /data-course="[^"]+" data-current="true"/.test(html) && html.indexOf('data-current="true"') === html.indexOf('data-course="' + us[0].id + '"') + ('data-course="' + us[0].id + '"').length + 1)
    ok(purpose + ': the building is named for why you are here', html.includes(BUILDING[purpose]('Lisboa')))
    ok(purpose + ': no stars, no START', !/>Start<|\bstars?\b|nudge-up/i.test(html))
    /* Every unit with a milestone has a keystone label — the pattern, by name. */
    ok(purpose + ': every keystone is labelled with its pattern', us.every((u) => keystoneLabel(u).length > 0 && html.includes(keystoneLabel(u).replace(/&/g, '&amp;'))), us.map(keystoneLabel).join(' · '))
  }
  ok('keystone glaze is 0–3 as material, not stars', [0, 1, 2, 3].map(keystoneGlaze).join() === 'outline,part,glazed,gold')
  const home = readFileSync('components/path/PathHome.tsx', 'utf8')
  ok('PathHome draws the Wall, not the winding path', /<Wall\b/.test(home) && !/WindingPath/.test(home) && !existsSync('components/path/WindingPath.tsx'))
  ok('no flame on the home screen', !/FlameIcon/.test(home))
  ok('the tally is honest about the microphone', /Said out loud, and heard/.test(home) && !/'Understood ' \+/.test(home))
  ok('no cheer claims "understood"', UNDERSTOOD_MILESTONES.every((m) => !/understood/i.test(understoodCheer(m))))
  /*
    AT EVERY WIDTH (Sam, 2026-11-02: "Yes, replace the old card rail with the Wall on
    desktop."). The Wall must not be hidden above md, and the rail must be gone with its
    stars and its hard-shadowed practice circle.
  */
  const wallMount = home.slice(home.lastIndexOf('<div', home.indexOf('<Wall')), home.indexOf('<Wall'))
  ok('the Wall renders at desktop widths too', !/md:hidden|hidden md:/.test(wallMount), wallMount.trim())
  ok('no CardRail anywhere', !/<CardRail|from '.\/CardRail'/.test(home) && !existsSync('components/path/CardRail.tsx') && !existsSync('components/path/Unit.tsx'))
  ok('no stars on the home screen', !/StarIcon|stars=\{/.test(home))
  ok('no hard bottom shadows on the home screen', !/shadow-\[0_\d+px_0_0/.test(home))
  ok('a laid tile opens the sheet', /<TileSheet\b/.test(home) && existsSync('components/path/TileSheet.tsx'))
  const wall = readFileSync('components/path/Wall.tsx', 'utf8')
  ok('no chunky hard bottom shadows on the Wall', !/shadow-\[0_\d+px_0_0/.test(wall))
}

console.log('\nworth another look — a crack, never a removal\n')
{
  const us = pathUnits(undefined, undefined, 'moving')
  const room = us[0].rooms.find((r) => roomPieceIds(r).length > 0)!
  const pid = roomPieceIds(room)[0]
  const day = 24 * 60 * 60 * 1000
  const item = (state: string, recall: string | null) => ({
    [pid]: { target_id: pid, acquired_source: null, reinforced_sources: [], latest_state: state, latest_recall_at: recall },
  })
  const base: PathRecord = { finished_cards: [room.id], proof: [], evidence: [], mission_completed_at: {} }
  const old = new Date(now.getTime() - (SLIP_DAYS + 1) * day).toISOString()
  const fresh = new Date(now.getTime() - 2 * day).toISOString()
  ok('flagged NEEDS ANOTHER LOOK is slipping', roomSlipping({ ...base, inventory: item('NEEDS ANOTHER LOOK', fresh) as never }, room, now))
  ok('recalled more than ' + SLIP_DAYS + ' days ago is slipping', roomSlipping({ ...base, inventory: item('YOURS', old) as never }, room, now))
  ok('recalled recently is not', !roomSlipping({ ...base, inventory: item('YOURS', fresh) as never }, room, now))
  ok('no timestamp anywhere is not — a crack is a claim', !roomSlipping({ ...base, inventory: item('NEW', null) as never }, room, now))
  ok('fresh evidence counts when latest_recall_at is null', !roomSlipping({ ...base, inventory: item('NEW', null) as never, evidence: [{ target_id: pid, timestamp: fresh } as never] }, room, now))
  ok('old evidence alone is slipping', roomSlipping({ ...base, inventory: item('NEW', null) as never, evidence: [{ target_id: pid, timestamp: old } as never] }, room, now))
  const v = pathView({ ...base, inventory: item('NEEDS ANOTHER LOOK', fresh) as never }, us, () => 'open', now)
  const node = v.units[0].nodes.find((n) => n.room.id === room.id)!
  ok('pathView marks it, and it stays laid', node.slipping && node.state === 'done')
  ok('an unlaid room never slips', v.units.flatMap((u) => u.nodes).filter((n) => n.state !== 'done').every((n) => !n.slipping))
  const html = renderToStaticMarkup(createElement(Wall, { view: v, purpose: 'moving', chapter: 'lisbon', inventory: item('NEEDS ANOTHER LOOK', fresh), onLaid: () => {} }))
  ok('the strip lists it, and the crack is drawn', /data-testid="worth-another-look"/.test(html) && /data-slipping="true"/.test(html) && html.includes('/revise?kind=room&amp;id=' + room.id))
  const none = renderToStaticMarkup(createElement(Wall, { view: pathView(base, us, () => 'open', now), purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {} }))
  ok('and with nothing slipping there is no strip', !/worth-another-look/.test(none))
  ok('the foundation counts words by shelf', /data-testid="foundation"/.test(html) && /1 word · 1 shelf/.test(html))
}

console.log('\nrevision knows a room\n')
{
  const room = situationById('lisbon_save')!
  const lines = revisionFor('room', 'lisbon_save', {})
  ok('kind=room asks the release first', lines[0]?.answer === room.release.answer && lines[0]?.context === room.title)
  ok('then the room’s words', lines.length === 1 + roomPieceIds(room).length, lines.map((l) => l.answer).join(' | '))
  ok('and every line knows which words it recalls', lines.every((l) => (l.pieces ?? []).length > 0))
  ok('a room is titled by its title', revisionTitle('room', 'lisbon_save') === room.title)
  ok('an unknown room asks nothing', revisionFor('room', 'nope', {}).length === 0)
  const revise = readFileSync('components/Revise.tsx', 'utf8')
  ok('/revise reads the wider kind and recalls the words', /as RevisionKind/.test(revise) && /recallPieces\(line\.pieces\)/.test(revise))
  const collection = readFileSync('content/collection.ts', 'utf8')
  ok('CardKind did not grow a room', !/CardKind = [^\n]*'room'/.test(collection))
}

console.log('\nthe save says percebi (Sam, 2026-11-02)\n')
{
  const room = situationById('lisbon_save')!
  ok('the release, the line and SAVE_SENTENCE all say não percebi', room.release.answer === SAVE_SENTENCE.m && /não percebi/.test(SAVE_SENTENCE.m) && /não percebi/.test(SAVE_SENTENCE.f) && room.lines[0].pt === 'Desculpe, não percebi.')
  ok('and still pending native review', room.qa_status === 'pending-native-review')
  ok('no "não percebo" left in the room', !JSON.stringify(room).includes('percebo'))
}

console.log('\nthe booking pass-through — /get?purpose=…&depart=…&ret=…\n')
{
  const q = (s: string) => parseBooking(new URLSearchParams(s), now)
  const m = q('purpose=moving&depart=2027-01-15&ret=2027-02-01')
  ok('moving → goal moving, with dates', m.purpose === 'moving' && m.goal === 'moving' && m.from === '2027-01-15' && m.to === '2027-02-01')
  ok('visiting → trip, staying → season', q('purpose=visiting').goal === 'trip' && q('purpose=staying').goal === 'season')
  ok('a purpose that is not one of three is dropped', q('purpose=<script>').purpose === null && q('purpose=VISITING').purpose === null)
  ok('a date that is not a day is dropped', q('purpose=moving&depart=2027-02-30').from === null && q('depart=tomorrow').from === null)
  ok('a return before the departure keeps only the departure', q('depart=2027-03-01&ret=2027-02-01').to === null && q('depart=2027-03-01&ret=2027-02-01').from === '2027-03-01')
  ok('a return without a departure is ignored', q('ret=2027-02-01').to === null)
  ok('absurd years are dropped', q('depart=1999-01-01').from === null && q('depart=2099-01-01').from === null)
  const get = readFileSync('components/Get.tsx', 'utf8')
  const setup = readFileSync('components/SetUp.tsx', 'utf8')
  ok('/get and set-up both apply it after mount', /applyBookingFromUrl\(\)/.test(get) && /applyBookingFromUrl\(\)/.test(setup))
  const booking = readFileSync('engine/booking.ts', 'utf8')
  ok('and never over an answer', /!me\.profile\?\.goal/.test(booking) && /!getLearner\(\)\.profile\?\.here_said/.test(booking))
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe path holds')
