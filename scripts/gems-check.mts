/**
 * THE GEMS HOLD THEIR SHAPE (2026-11-03) — content/gems.ts.
 *
 * Every gem is a real place with a line, a person and a room behind it, or it is a listing,
 * and DUB does not do listings. This holds each one to that, and to the city: inside
 * Lisbon, inside its bairro, linked to a room that exists.
 */
import { BAIRROS, GEMS, distanceM, gemsNear, visibleGems } from '../content/gems'
import { situationById } from '../content/situations'

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

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe gems hold')
