/**
 * What a phone is sent, checked on plain objects (lib/push-plan.ts).
 *
 *   npm run push
 *
 * The morning line must come from the learner's path, in their own ending, never twice,
 * and never from a room they cannot open. How often is theirs. Every URL is countable.
 */
import { emptyLearner } from '../engine/learner'
import { pathUnits } from '../content/path'
import { isFreeRoom } from '../lib/entitlements'
import { dueToday, local, pathLine, tableJoined, tableSoon, weeklyGem } from '../lib/push-plan'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}

const now = new Date('2026-11-04T08:00:00Z')
const rooms = pathUnits(undefined, now, 'moving').flatMap((u) => u.rooms)
const skip = (id: string) => id === 'lisbon_save' || id === 'lisbon_legend' || id.startsWith('fun_')
const learner = (finished: string[], gender: 'm' | 'f' | null = null) => {
  const l = emptyLearner()
  return { ...l, purpose: 'moving' as const, finished_cards: finished, profile: { ...l.profile, gender } }
}

console.log('\nthe morning line')
const fresh = pathLine(learner([]), [], true, now)
const worth = (pt: string) => pt.trim().split(/\s+/).length >= 3 && (pt.match(/,/g) ?? []).length < 3
const firstRoom = rooms.find((r) => !skip(r.id) && r.lines.some((l) => worth(l.pt)))!
const firstLine = firstRoom.lines.findIndex((l) => worth(l.pt))
ok('a new learner gets the first real sentence of their first room', fresh?.title === firstRoom.lines[firstLine].pt, fresh?.title)
ok('never a one- or two-word line', !!fresh && worth(fresh.title))
ok('and the tap opens that room, counted', fresh?.url === '/errand/' + firstRoom.id + '?n=line', fresh?.url)
ok('the body names the room', !!fresh?.body.includes(firstRoom.title), fresh?.body)

const second = pathLine(learner([]), [fresh!.id], true, now)
ok('the next morning, a different line', !!second && second.id !== fresh!.id, second?.title)

const done = rooms.slice(0, 6).map((r) => r.id)
const later = pathLine(learner(done), [], true, now)
const nextRoom = rooms.find((r) => !done.includes(r.id) && !skip(r.id) && r.lines.some((l) => worth(l.pt)))!
ok('finished rooms are passed over', later?.id.startsWith('room:' + nextRoom.id + ':') ?? false, later?.id)

const withF = rooms.find((r) => !skip(r.id) && r.lines.some((l) => (l as { f?: string }).f && worth(l.pt)))
if (withF) {
  const i = withF.lines.findIndex((l) => (l as { f?: string }).f && worth(l.pt))
  const before = rooms.slice(0, rooms.indexOf(withF)).map((r) => r.id)
  const sentBefore = rooms.flatMap((r) => r.lines.map((_, k) => 'room:' + r.id + ':' + k)).filter((id) => id.startsWith('room:' + withF.id + ':') && Number(id.split(':')[2]) < i)
  const f = pathLine(learner(before, 'f'), sentBefore, true, now)
  ok('a woman gets her own ending', f?.title === (withF.lines[i] as { f?: string }).f, f?.title)
}

const all = rooms.flatMap((r) => r.lines.map((_, i) => 'room:' + r.id + ':' + i))
ok('nothing left to send → null, so the old line takes over', pathLine(learner([]), all, true, now) === null)
ok('no purpose → null', pathLine({ ...emptyLearner(), purpose: null }, [], true, now) === null)

const free = pathLine(learner(rooms.filter((r) => isFreeRoom(r.id, 'moving')).map((r) => r.id)), [], false, now)
ok('a free learner past the free rooms is never sent a locked room', !free || isFreeRoom(free.id.split(':')[1], 'moving'), free?.id ?? 'null')

const seen = new Set<string>()
let sent: string[] = []
for (let d = 0; d < 20; d++) {
  const p = pathLine(learner([]), sent, true, now)
  if (!p) break
  seen.add(p.id)
  sent = [...sent, p.id]
}
ok('twenty mornings, twenty different sentences', seen.size === sent.length && sent.length === 20, sent.length + ' sent')

console.log('\nhow often')
ok('daily sends every day', [0, 1, 2, 3, 4, 5, 6].every((d) => dueToday('daily', d)))
ok('three a week is Mon, Wed, Fri', [0, 1, 2, 3, 4, 5, 6].filter((d) => dueToday('three', d)).join() === '1,3,5')
ok('off is off', [0, 1, 2, 3, 4, 5, 6].every((d) => !dueToday('off', d)))
ok('an old row with no cadence is daily', dueToday(null, 2))
ok('local time: 8am in Lisbon in November is 08 UTC', local('Europe/Lisbon', now).hour === 8)
ok('local weekday is theirs', local('Pacific/Auckland', new Date('2026-11-04T20:00:00Z')).weekday === 4)

console.log('\nthe rest')
const wk = weeklyGem(new Date('2026-11-02T10:00:00Z'))
ok("Monday's place names a gem and links to it", !!wk && wk.title.startsWith('This week in Lisbon: ') && wk.url.includes('&n=week'), wk?.title)
ok('one per week', wk?.id === weeklyGem(new Date('2026-11-06T10:00:00Z'))?.id)
const j = tableJoined({ code: 'abc', guest: 'Ana', place: 'Tasca do Chico', sits_at: '2026-11-05T19:00:00Z' }, 'Europe/Lisbon')
ok('the host hears who is coming', j.title === 'Ana is coming to your table' && j.body === 'Tasca do Chico · Thu 7pm', j.body)
const s = tableSoon({ code: 'abc', place: 'Tasca do Chico', sits_at: '2026-11-05T19:00:00Z', hosting: false }, 'Europe/Lisbon')
ok('a guest gets a reminder that opens the table', s.url === '/t/abc?n=table' && s.tag === 'dub-table-abc', s.title)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nthe pushes hold')
