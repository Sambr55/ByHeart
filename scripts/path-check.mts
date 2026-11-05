/**
 * The Lisbon path, checked on plain objects.
 *
 *   npm run path
 *
 * The streak is a pure function of timestamps and the path is a pure function of which
 * rooms exist, so both can be proved here without a browser.
 */
import { PATH_UNITS, PATHS, pathUnits } from '../content/path'
import { FREE_BY_PURPOSE, isFreeRoom } from '../lib/entitlements'
import { situationById } from '../content/situations'
import {
  dayStreak,
  pathLevel,
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
import { Panel, keystoneLabel, driftOf } from '../components/path/Panel'
import { Road } from '../components/path/Road'
import { RoomSteps } from '../components/RoomSteps'
import { PANEL_ART, TILE_WORDS, panelArt, tileWord } from '../content/panel'
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
    ok(purpose + ': the very first room is free', isFreeRoom(rids[0], purpose), rids[0])
    ok(purpose + ': every free room is on this path', free.every((id) => rids.includes(id)), free.filter((id) => !rids.includes(id)).join(', '))
    ok(purpose + ': the emergency room is free', free.includes('lisbon_emergencia'))
    /* 2026-11-04: the paywall falls after Level 2 — both levels whole, nothing past them but fun tiles and the emergency room. */
    const firstTwo = list.slice(0, 2).flatMap((u) => u.rooms)
    ok(purpose + ': Levels 1 and 2 are free, whole', firstTwo.every((id) => isFreeRoom(id, purpose)), firstTwo.filter((id) => !isFreeRoom(id, purpose)).join(', '))
    const later = list.slice(2).flatMap((u) => u.rooms).filter((id) => isFreeRoom(id, purpose) && !id.startsWith('fun_') && id !== 'lisbon_emergencia')
    ok(purpose + ': nothing after Level 2 is free but fun tiles and the emergency room', later.length === 0, later.join(', '))
    console.log('    ' + resolved.length + ' units, ' + rids.length + ' rooms')
  }
  ok('no purpose gets the trip', pathUnits(undefined, undefined, null)[0].id === PATHS.visiting[0].id)
  /*
    THE SAVE COMES FIRST, ON EVERY PATH (Sam, 2026-11-02): "at the very least you can say
    'I am sorry I don't understand, I am English' in Portuguese." The argument each path
    makes still starts straight after it — the NIF, the airport — so both are asserted.
  */
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    /* 2026-11-03: Basics first — hello, counting, the save, who you are, a hack — on every path. */
    const b = PATHS[purpose][0]
    ok(purpose + ': Basics is the first level, and hello is its first room', b.id === 'basics' && b.rooms[0] === 'lisbon_ola', b.rooms[0])
    ok(purpose + ': the save is in Basics, and Who you are with it', b.rooms.includes('lisbon_save') && b.rooms.includes('lisbon_legend'))
    ok(purpose + ': every room in Basics is free', b.rooms.every((id) => isFreeRoom(id, purpose)), b.rooms.filter((id) => !isFreeRoom(id, purpose)).join(', '))
    ok(purpose + ': every later level ends on a free fun tile', PATHS[purpose].slice(1).every((u) => u.rooms[u.rooms.length - 1].startsWith('fun_') && isFreeRoom(u.rooms[u.rooms.length - 1], purpose)))
    ok(purpose + ': the save appears once', PATHS[purpose].flatMap((u) => u.rooms).filter((id) => id === 'lisbon_save').length === 1)
  }
  ok('moving starts with the paperwork, straight after Basics', PATHS.moving[1].rooms[0] === 'lisbon_nif')
  ok('the trip starts at the airport, straight after Basics', PATHS.visiting[1].rooms[0] === 'lisbon_aeroporto')
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
  /* 2026-11-03, one ladder: the streak left the home screen; the level took the header. */
  ok('the streak is off the home screen, the level is on it', !/data-testid="streak"/.test(home) && /data-testid="level-chip"/.test(home) && /<LevelBar /.test(home))
  ok('the home screen opens the rescue card', /href="\/opener"/.test(home))
  const manifest = readFileSync('app/manifest.ts', 'utf8')
  ok('and the manifest has it as a shortcut', /shortcuts:[\s\S]*url: '\/opener'/.test(manifest))
}

console.log('\nthe Panel — one painting per path, one tile per room (2026-11-02)\n')
{
  /*
    Sam replaced the Wall with the Panel on 2026-11-02: the Wall "looks like a badly laid
    out PowerPoint"; the Panel he was shown on the website — "you surpassed yourself there".
    It is rendered here for real — renderToStaticMarkup on plain records — so these are
    claims about the markup a phone receives, not about the source text.
  */
  const empty: PathRecord = { finished_cards: [], proof: [], evidence: [], mission_completed_at: {} }
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const us = pathUnits(undefined, undefined, purpose)
    const rooms = us.flatMap((u) => u.rooms)
    const v = pathView(empty, us, () => 'open', now)
    const html = renderToStaticMarkup(
      createElement(Panel, { view: v, purpose, chapter: 'lisbon', inventory: {}, onLaid: () => {} }),
    )
    const tiles = (html.match(/data-testid="tile"/g) ?? []).length
    const frieze = (html.match(/data-testid="frieze"/g) ?? []).length
    ok(purpose + ': a tile per room', tiles === rooms.length, tiles + ' of ' + rooms.length)
    ok(purpose + ': frieze fills the top course to a full 6-wide grid', (tiles + frieze) % 6 === 0 && frieze < 6, tiles + ' tiles + ' + frieze + ' frieze')
    /* Laid from the bottom-left: the first room is the first cell of the LAST row in the DOM. */
    const order = [...html.matchAll(/data-testid="(tile|frieze)"(?:[^>]*?data-room="([^"]+)")?/g)].map((m) => m[2] ?? '·')
    const lastRow = order.slice(-6)
    ok(purpose + ': laid from the bottom-left, in path order', lastRow[0] === rooms[0].id && lastRow.slice(1).join() === rooms.slice(1, 6).map((r) => r.id).join(), lastRow.join())
    const art = PANEL_ART.lisbon![purpose]
    ok(purpose + ': its painting exists in public/', existsSync('public' + art.src), art.src)
    ok(purpose + ': the caption names the painting and counts tiles', html.includes('Your panel: ' + art.title) && html.includes('0 of ' + rooms.length + ' tiles laid'))
    ok(purpose + ': every room has its own tile word', rooms.every((r) => Boolean(TILE_WORDS[r.id])), rooms.filter((r) => !TILE_WORDS[r.id]).map((r) => r.id).join(', '))
    ok(purpose + ': and the words are on the tiles', rooms.every((r) => html.includes('>' + tileWord(r).replace(/&/g, '&amp;') + '<')))
    ok(purpose + ': one tile breathes', (html.match(/panel-next/g) ?? []).length === 1)
    ok(purpose + ': a keystone per unit', (html.match(/data-testid="keystone"/g) ?? []).length === us.length)
    ok(purpose + ': every keystone is labelled with its pattern', us.every((u) => keystoneLabel(u).length > 0 && html.includes(keystoneLabel(u).replace(/&/g, '&amp;'))), us.map(keystoneLabel).join(' · '))
    ok(purpose + ': no stars, no START, no Wall', !/>Start<|\bstars?\b|nudge-up|data-testid="wall"|data-course=/i.test(html))
  }
  ok('another city borrows Lisbon’s painting until it has its own', panelArt('porto', 'moving').src === PANEL_ART.lisbon!.moving.src)
  ok('a room with no listed word falls back to its title', tileWord({ id: 'x', title: 'Asking the way.' }) === 'way')
  ok('keystone glaze is 0–3 as material, not stars', [0, 1, 2, 3].map(keystoneGlaze).join() === 'outline,part,glazed,gold')
  {
    const us = pathUnits(undefined, undefined, 'moving')
    const rec: PathRecord = { finished_cards: [us[0].rooms[0].id], proof: [], evidence: [], mission_completed_at: {} }
    const html = renderToStaticMarkup(createElement(Panel, { view: pathView(rec, us, () => 'open', now), purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {} }))
    ok('a done room is laid; the rest are ghosts', (html.match(/panel-tile[^"]*is-laid/g) ?? []).length === 1 && (html.match(/panel-ghost/g) ?? []).length === us.flatMap((u) => u.rooms).length)
    const paid = renderToStaticMarkup(createElement(Panel, { view: pathView(rec, us, (id) => (id === us[0].rooms[2].id ? 'paid' : 'open'), now), purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {} }))
    ok('a paid tile goes to /pro, with a lock', /data-state="paid"[^>]*>|href="\/pro"[^>]*data-state="paid"/.test(paid) && paid.includes('locked, unlock with membership'))
  }
  const home = readFileSync('components/path/PathHome.tsx', 'utf8')
  ok('PathHome draws the Panel, and the Wall is gone', /<Panel\b/.test(home) && !/<Wall\b|from '.\/Wall'/.test(home) && !existsSync('components/path/Wall.tsx') && !/WindingPath/.test(home) && !existsSync('components/path/WindingPath.tsx'))
  ok('no flame on the home screen', !/FlameIcon/.test(home))
  ok('the tally is honest about the microphone', /Said out loud, and heard/.test(home) && !/'Understood ' \+/.test(home))
  ok('no cheer claims "understood"', UNDERSTOOD_MILESTONES.every((m) => !/understood/i.test(understoodCheer(m))))
  /* AT EVERY WIDTH (Sam, 2026-11-02, of the Wall: "Yes, replace the old card rail … on desktop."). */
  const mount = home.slice(home.lastIndexOf('<div', home.indexOf('<Panel')), home.indexOf('<Panel'))
  ok('the Panel renders at desktop widths too', !/md:hidden|hidden md:/.test(mount), mount.trim())
  ok('no CardRail anywhere', !/<CardRail|from '.\/CardRail'/.test(home) && !existsSync('components/path/CardRail.tsx') && !existsSync('components/path/Unit.tsx'))
  ok('no stars on the home screen', !/StarIcon|stars=\{/.test(home))
  ok('no hard bottom shadows on the home screen', !/shadow-\[0_\d+px_0_0/.test(home))
  ok('a laid tile opens the sheet', /<TileSheet\b/.test(home) && existsSync('components/path/TileSheet.tsx'))
  const panel = readFileSync('components/path/Panel.tsx', 'utf8')
  ok('no chunky hard bottom shadows on the Panel', !/shadow-\[0_\d+px_0_0/.test(panel))
  const css = readFileSync('app/globals.css', 'utf8')
  ok('the panel stands still under reduced motion', /prefers-reduced-motion[^{]*\{[^}]*\.panel-tile \{[^}]*transform: none/.test(css) && /\.panel-next \{ animation: none/.test(css) && /\.panel-sheen::after \{ animation: none/.test(css))
}

console.log('\nput it back — a drift, never a removal\n')
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
  /* 2026-11-03: the first room of the first run came home already drifted. A day's grace. */
  ok('but a word flagged within the day does not drift its tile yet', !roomSlipping({ ...base, inventory: item('NEEDS ANOTHER LOOK', now.toISOString()) as never }, room, now))
  ok('recalled more than ' + SLIP_DAYS + ' days ago is slipping', roomSlipping({ ...base, inventory: item('YOURS', old) as never }, room, now))
  ok('recalled recently is not', !roomSlipping({ ...base, inventory: item('YOURS', fresh) as never }, room, now))
  ok('no timestamp anywhere is not — a drift is a claim', !roomSlipping({ ...base, inventory: item('NEW', null) as never }, room, now))
  ok('fresh evidence counts when latest_recall_at is null', !roomSlipping({ ...base, inventory: item('NEW', null) as never, evidence: [{ target_id: pid, timestamp: fresh } as never] }, room, now))
  ok('old evidence alone is slipping', roomSlipping({ ...base, inventory: item('NEW', null) as never, evidence: [{ target_id: pid, timestamp: old } as never] }, room, now))
  const v = pathView({ ...base, inventory: item('NEEDS ANOTHER LOOK', fresh) as never }, us, () => 'open', now)
  const node = v.units[0].nodes.find((n) => n.room.id === room.id)!
  ok('pathView marks it, and it stays laid', node.slipping && node.state === 'done')
  ok('an unlaid room never slips', v.units.flatMap((u) => u.nodes).filter((n) => n.state !== 'done').every((n) => !n.slipping))
  const html = renderToStaticMarkup(createElement(Panel, { view: v, purpose: 'moving', chapter: 'lisbon', inventory: item('NEEDS ANOTHER LOOK', fresh), onLaid: () => {} }))
  const d = driftOf(room.id)
  const rooms0 = us.flatMap((u) => u.rooms)
  /* Sam, of the website's first tilts: "aren't crooked enough to see". 8–13°, like the site. */
  ok('the drift is 8–13° — crooked enough to see — and the same every time', Math.abs(d.rot) >= 8 && Math.abs(d.rot) <= 13 && JSON.stringify(driftOf(room.id)) === JSON.stringify(d))
  ok('and leans both ways across rooms', new Set(rooms0.map((r) => Math.sign(driftOf(r.id).rot))).size === 2)
  ok('the drifted tile is drawn rotated, still laid', /data-slipping="true"/.test(html) && new RegExp('is-laid is-drifted" style="[^"]*--rot:' + d.rot + 'deg').test(html))
  ok('never red, never cracked', !/crack|text-wrong|bg-wrong|#c0392b|red/i.test(html))
  ok('the strip says "Put these back" and links the revision', /data-testid="put-back"/.test(html) && html.includes('Put these back') && html.includes('/revise?kind=room&amp;id=' + room.id) && !/Worth another look/.test(html))
  const opened = renderToStaticMarkup(createElement(Panel, { view: v, purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {}, openId: room.id }))
  ok('with its sheet open, that tile alone is marked and named', /panel-open/.test(opened) && (opened.match(/is-open/g) ?? []).length === 1 && new RegExp('is-open"[^>]*data-room="' + room.id + '"|data-room="' + room.id + '"[^>]*is-open').test(opened))
  const none = renderToStaticMarkup(createElement(Panel, { view: pathView(base, us, () => 'open', now), purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {} }))
  ok('and with nothing drifted there is no strip, and nothing rotated', !/put-back/.test(none) && !/is-drifted/.test(none))
  ok('the foundation counts words by shelf', /data-testid="foundation"/.test(html) && /1 word · 1 shelf/.test(html))
  const sheet = readFileSync('components/path/TileSheet.tsx', 'utf8')
  ok('a drifted tile’s sheet leads with "Put it back"', /slipping \? \(\s*<div[^>]*data-testid="sheet-put-back"/.test(sheet) && sheet.indexOf('Put it back') < sheet.indexOf('sheet-remind'))
}

console.log('\nthe Road — the winding path, back as a second view (2026-11-02)\n')
{
  /*
    Sam: "could we have a 'winding road' map view and a tile view and a toggle. And we
    gamify the winding road view the same — when something drifts etc?" Same pathView,
    same states, none of the Duolingo tells.
  */
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const us = pathUnits(undefined, undefined, purpose)
    const html = renderToStaticMarkup(createElement(Road, { view: pathView(empty, us, () => 'open', now), inventory: {}, onLaid: () => {} }))
    ok(purpose + ': the Road renders a stop per room', (html.match(/data-testid="stop"/g) ?? []).length === us.flatMap((u) => u.rooms).length)
    ok(purpose + ': and a keystone per unit', (html.match(/data-testid="keystone"/g) ?? []).length === us.length)
    ok(purpose + ': no stars, no START, no bounce', !/>Start<|\bstars?\b|nudge-up|StarIcon/i.test(html))
  }
  const us = pathUnits(undefined, undefined, 'moving')
  const room = us[0].rooms.find((r) => roomPieceIds(r).length > 0)!
  const pid = roomPieceIds(room)[0]
  const inv = { [pid]: { target_id: pid, acquired_source: null, reinforced_sources: [], latest_state: 'NEEDS ANOTHER LOOK', latest_recall_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() } }
  const v = pathView({ finished_cards: [room.id], proof: [], evidence: [], mission_completed_at: {}, inventory: inv as never }, us, () => 'open', now)
  const road = renderToStaticMarkup(createElement(Road, { view: v, inventory: inv, onLaid: () => {} }))
  ok('a drifted stop is knocked off the road, with its gap on the line', /data-slipping="true"/.test(road) && /road-gap/.test(road) && new RegExp('--rot:' + driftOf(room.id).rot + 'deg').test(road))
  ok('and the same "Put these back" strip as the Panel', /data-testid="put-back"/.test(road) && road.includes('/revise?kind=room&amp;id=' + room.id))
  const roadSrc = readFileSync('components/path/Road.tsx', 'utf8')
  ok('the Road forks no logic: it reads pathView nodes and the Panel’s drift', !/roomSlipping|roomDone|finished_cards/.test(roadSrc) && /driftOf/.test(roadSrc))
  ok('no hard bottom shadows on the Road', !/shadow-\[0_\d+px_0_0/.test(roadSrc))
  const home = readFileSync('components/path/PathHome.tsx', 'utf8')
  ok('PathHome toggles Board | Panel | Road, remembered per device, Board by default (2026-11-05)', /<Road\b/.test(home) && /<Panel\b/.test(home) && /PATH_MODE_KEY = 'dub.path.view'/.test(home) && /useState<PathMode>\('board'\)/.test(home) && /localStorage\.setItem\(PATH_MODE_KEY/.test(home))
}

console.log('\nevery put-back is a win (2026-11-02)\n')
{
  const us = pathUnits(undefined, undefined, 'moving')
  const room = us[0].rooms[0]
  const v = pathView({ finished_cards: [room.id], proof: [], evidence: [], mission_completed_at: {} }, us, () => 'open', now)
  const homing = new Set([room.id])
  const panel = renderToStaticMarkup(createElement(Panel, { view: v, purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {}, homing }))
  const road = renderToStaticMarkup(createElement(Road, { view: v, inventory: {}, onLaid: () => {}, homing }))
  ok('a tile just put back comes home on the Panel, with its burst', /is-home/.test(panel) && /data-testid="home-burst"/.test(panel))
  ok('and nothing left loose sweeps the finale', /panel-finale/.test(panel))
  ok('and on the Road', /is-home/.test(road) && /data-testid="home-burst"/.test(road))
  const quiet = renderToStaticMarkup(createElement(Panel, { view: v, purpose: 'moving', chapter: 'lisbon', inventory: {}, onLaid: () => {} }))
  ok('without one, nothing flies', !/home-burst|panel-finale|is-home/.test(quiet))
  const revise = readFileSync('components/Revise.tsx', 'utf8')
  ok('/revise cheers a clean room release and hands the tile home', /data-testid="put-back-win"/.test(revise) && /if \(wasLoose\) markHomecoming\(room\.id\)/.test(revise) && /put back/.test(revise))
  const css = readFileSync('app/globals.css', 'utf8')
  ok('and it all stands still under reduced motion', /prefers-reduced-motion[^{]*\{[^}]*\.panel-tile\.is-laid\.is-home[^}]*animation: none/.test(css) && /\.home-burst, \.panel-finale::after \{ display: none/.test(css))
}

console.log('\na room, app-style (2026-11-02)\n')
{
  /*
    Sam: "click through to the content and it's still pretty 'posh HTML'." The room's read
    stage is one sentence a card now, rendered here for real.
  */
  const room = situationById('lisbon_cafe')!
  const html = renderToStaticMarkup(createElement(RoomSteps, { situation: room, gender: null, top: null, onGo: () => {} }))
  ok('one card on screen, not a list of every line', (html.match(/data-testid="room-card"/g) ?? []).length === 1 && html.includes(room.lines[0].pt) && !html.includes(room.lines[1].pt))
  ok('a dot per line, and one for your turn', (html.match(/class="room-dot/g) ?? []).length === room.lines.length + 1)
  ok('the English waits for a tap', /room-en text-lg[^"]*"[^>]*aria-hidden="true"/.test(html) && html.includes('Tap for the English'))
  ok('the why is a line under the title on the photo', html.includes(room.why) && /room-why line-clamp-2/.test(html))
  ok('the save is one tap away', /data-testid="room-save"/.test(html))
  ok('hear and on are in the thumb dock', /room-dock sticky bottom-0/.test(html) && /data-testid="room-next"/.test(html))
  const errand = readFileSync('components/Errand.tsx', 'utf8')
  ok('Errand reads through RoomSteps and still banks the same way', /<RoomSteps\b/.test(errand) && /const bank = \(clean: boolean\)/.test(errand) && /acquireRoomPieces\(/.test(errand) && /rememberFinishedCard\(situation\.id\)/.test(errand) && /<SayButton want=\{situation\.release\.answer\}/.test(errand))
  ok('and its end state lays the tile it earned', /data-testid="room-laid"/.test(errand) && /panelSliceFor\(/.test(errand))
}

console.log('\nrevision knows a room\n')
{
  const room = situationById('lisbon_save')!
  const lines = revisionFor('room', 'lisbon_save', {})
  ok('kind=room asks the release first', lines[0]?.answer === room.release.answer)
  /* Sam, 2026-11-02, on a bare recall: "there is no context whatsoever… what is the right answer?" */
  ok('with the situation as context and "How do you say:" as the question', lines[0]?.context === room.why && lines[0]?.lead === 'How do you say:' && !/first line/i.test(JSON.stringify(lines)))
  ok('/revise shows the lead between the context and the card', /data-testid="revise-lead"/.test(readFileSync('components/Revise.tsx', 'utf8')))
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

console.log('\none ladder — the level (2026-11-03)\n')
{
  /* Sam: "I have no idea how to walk through it, level up, anything." */
  const us = pathUnits(undefined, undefined, 'visiting')
  const none = { finished_cards: [], proof: [], evidence: [], mission_completed_at: {} }
  const l0 = pathLevel(pathView(none, us, () => 'open', now))
  ok('a new learner is on Level 1, the first unit', l0.level === 1 && l0.unit?.id === us[0].id && l0.laid === 0 && l0.toNext === us[0].rooms.length)
  const first = us[0].rooms.map((r) => r.id)
  const l1 = pathLevel(pathView({ ...none, finished_cards: first }, us, () => 'open', now))
  ok('laying every room of a unit climbs one level', l1.level === 2 && l1.unit?.id === us[1].id)
  const paidAll = pathLevel(pathView(none, us, (id) => (first.includes(id) ? 'paid' : 'open'), now))
  ok('a unit of nothing but paid rooms is stepped over, not a wall', paidAll.level === 2)
  const all = pathLevel(pathView({ ...none, finished_cards: us.flatMap((u) => u.rooms.map((r) => r.id)) }, us, () => 'open', now))
  ok('every room laid is complete', all.complete && all.toNext === 0)
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe path holds')
