/**
 * THE GEMS HOLD THEIR SHAPE (2026-11-03) — content/gems.ts.
 *
 * Every gem is a real place with a line, a person and a room behind it, or it is a listing,
 * and DUB does not do listings. This holds each one to that, and to the city: inside
 * Lisbon, inside its bairro, linked to a room that exists.
 */
import { BAIRROS, GEMS, distanceM, gemsNear, visibleGems } from '../content/gems'
import { situationById } from '../content/situations'
import { WALKS, walkView, walkProgress } from '../content/walks'
import { KNOWHOW, knowHowNow } from '../content/knowhow'
import { gemOfTheWeek, gemRotation } from '../content/gems'
import { inboxFor } from '../content/inbox'

const problems: string[] = []
const ok = (name: string, pass: boolean, detail = '') => {
  console.log((pass ? '  ✓ ' : '  ✗ ') + name + (pass ? '' : '   ' + detail))
  if (!pass) problems.push(name)
}

console.log('\nevery gem is a place, a line, a person and a room\n')
ok('ids are unique', new Set(GEMS.map((g) => g.id)).size === GEMS.length)
for (const g of GEMS) {
  const b = BAIRROS.find((x) => x.id === g.bairro)
  ok(g.id + ': in a known bairro', Boolean(b), g.bairro)
  ok(g.id + ': inside Lisbon', g.lat > 38.68 && g.lat < 38.8 && g.lng > -9.24 && g.lng < -9.08, g.lat + ',' + g.lng)
  ok(g.id + ': near its bairro (under 2.5 km from its centre)', !b || distanceM(b.centre, [g.lat, g.lng]) < 2500, b ? Math.round(distanceM(b.centre, [g.lat, g.lng])) + ' m' : '')
  ok(g.id + ': trains in a room that exists', Boolean(situationById(g.room)), g.room)
  ok(g.id + ': has a line, both languages', Boolean(g.line.pt.trim() && g.line.en.trim()))
  ok(g.id + ': names who you will meet, and a tip', Boolean(g.meet.trim() && g.tip.trim() && g.why.trim()))
  ok(g.id + ': cites where it was checked', g.sources.length > 0)
  ok(g.id + ': no Brazilian giveaways in the line', !/\b(ônibus|café da manhã|banheiro|trem|você está)\b/i.test(g.line.pt), g.line.pt)
}

console.log('\nnear you\n')
const draftsShown = visibleGems(GEMS).length === GEMS.length
ok('off production, drafts are visible for review', draftsShown)
if (GEMS.length) {
  const g = GEMS[0]
  ok('a gem is near itself', gemsNear([g.lat, g.lng], 1, 50, GEMS)[0]?.id === g.id)
}

console.log('\nlanguage walks\n')
ok('walk ids are unique', new Set(WALKS.map((w) => w.id)).size === WALKS.length)
for (const w of WALKS) {
  ok(w.id + ': every stop names a gem that exists', w.stops.every((s) => GEMS.some((g) => g.id === s.gem)), w.stops.filter((s) => !GEMS.some((g) => g.id === s.gem)).map((s) => s.gem).join(', '))
  ok(w.id + ': every stop is in the walk’s own bairro', w.stops.every((s) => GEMS.find((g) => g.id === s.gem)?.bairro === w.bairro))
  ok(w.id + ': no stop twice', new Set(w.stops.map((s) => s.gem)).size === w.stops.length)
  const v = walkView(w, GEMS.filter((g) => g.verified))
  ok(w.id + ': walkable on verified gems alone (3+ stops)', Boolean(v), String(v?.stops.length ?? 0))
  if (v) {
    ok(w.id + ': under 4 km stop to stop', v.metres < 4000, Math.round(v.metres) + ' m')
    ok(w.id + ': progress counts said stops', walkProgress(v, [v.stops[0].key]).done === 1 && !walkProgress(v, []).complete)
  }
}

console.log('\nlocal know-how and the gem of the week\n')
ok('know-how ids are unique', new Set(KNOWHOW.map((k) => k.id)).size === KNOWHOW.length)
for (const k of KNOWHOW) {
  ok(k.id + ': has a line, both languages', Boolean(k.line.pt.trim() && k.line.en.trim()))
  ok(k.id + ': its room exists', !k.room || Boolean(situationById(k.room)), k.room ?? '')
  ok(k.id + ': months are real months', !k.months || k.months.every((m) => m >= 1 && m <= 12))
}
ok('seasonal cards come and go: chestnuts in November, not in June', knowHowNow(new Date(2026, 10, 15)).some((k) => k.id === 'castanhas') && !knowHowNow(new Date(2026, 5, 15)).some((k) => k.id === 'castanhas'))
const verified = GEMS.filter((g) => g.verified)
const rot = gemRotation(verified)
ok('the rotation holds every verified gem once', rot.length === verified.length && new Set(rot.map((g) => g.id)).size === rot.length)
ok('two weeks running are never the same bairro', rot.every((g, i) => i === 0 || g.bairro !== rot[i - 1].bairro || new Set(rot.map((x) => x.bairro)).size === 1))
const mon = new Date(2026, 10, 2), sun = new Date(2026, 10, 8), next = new Date(2026, 10, 9)
ok('the same gem all week, a new one on Monday', gemOfTheWeek(mon, verified)?.id === gemOfTheWeek(sun, verified)?.id && gemOfTheWeek(next, verified)?.id !== gemOfTheWeek(mon, verified)?.id)
ok('the inbox leads with the gem of the week', inboxFor('lisbon', mon)[0]?.kind === 'gem')

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe gems hold')
