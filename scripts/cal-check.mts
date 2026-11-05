/**
 * Add to calendar, the sync, and your own calendar beside DUB's (2026-11-05).
 *
 *   npm run cal
 *
 * Sam: "Anytime there is an event on a board or anywhere you need to be able to add it to
 * calendar … Can't I see what's on MY calendar in the DUB calendar (if I allow it?)".
 * Fails if one event would read differently in the two ways it reaches a calendar, if a
 * Google link is malformed, or if somebody's own events land on the wrong days.
 */
import { readFileSync } from 'node:fs'
import { DROPS } from '../content/drops'
import { CALENDAR } from '../content/calendar'
import { eventOfDrop, eventOfRow, googleHref, icsHref, dayAfter } from '../content/cal-event'
import { icsFor, icsOne } from '../lib/ics'
import { daysOf } from '../engine/gcal'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const origin = 'https://app.thisisdub.club'
const now = new Date('2026-11-05T12:00:00Z')

console.log('\none event, the same everywhere')
const drop = DROPS[0]
const e = eventOfDrop(drop)
const one = icsOne(e, origin, now)
const feed = icsFor([drop], { origin, city: 'Lisbon', perWeek: 7, now })
const vevent = (s: string) => s.slice(s.indexOf('BEGIN:VEVENT'), s.indexOf('END:VEVENT'))
ok('a single Add to calendar and the sync write the same entry', vevent(one) === vevent(feed))
ok('the title is the event, not DUB', one.includes('SUMMARY:' + drop.event.replace(/[,;]/g, (c) => '\\' + c).slice(0, 20)))
ok('all day, ending the day after', one.includes('DTSTART;VALUE=DATE:' + drop.on.replace(/-/g, '')) && one.includes('DTEND;VALUE=DATE:' + dayAfter(drop.on).replace(/-/g, '')))
ok('a stable UID, so adding twice updates rather than duplicates', one.includes('UID:' + drop.id + '@thisisdub.club'))
ok('CRLF line endings (Google enforces them)', one.includes('\r\n') && !one.replace(/\r\n/g, '').includes('\n'))
ok('the link opens the Portuguese for it', one.includes(origin + '/club?drop=' + drop.id))

console.log('\nwhat is on, from the board')
const row = CALENDAR.find((r) => r.until && r.until !== r.on) ?? CALENDAR[0]
const re = eventOfRow(row)
ok('a run of days ends the day after its last', icsOne(re, origin, now).includes('DTEND;VALUE=DATE:' + dayAfter(re.until ?? re.on).replace(/-/g, '')), row.on + '–' + (row.until ?? ''))
ok('the .ics is looked up by id, never spelt out in the URL', icsHref(re) === '/api/calendar/event?row=' + encodeURIComponent(row.id))
const route = src('app/api/calendar/event/route.ts')
ok('and an unknown id is a 404, not an invitation', route.includes("status: 404"))

console.log('\nGoogle Calendar')
const g = new URL(googleHref(e, origin))
ok('opens Google’s own add page', g.host === 'calendar.google.com' && g.searchParams.get('action') === 'TEMPLATE')
ok('with the dates as an all-day range', g.searchParams.get('dates') === drop.on.replace(/-/g, '') + '/' + dayAfter(drop.on).replace(/-/g, ''))
ok('and the link back into DUB', (g.searchParams.get('details') ?? '').includes(origin + '/club?drop='))

console.log('\nyour own calendar, on the right days')
ok('an all-day event is its own day (end is exclusive)', daysOf({ date: '2026-11-10' }, { date: '2026-11-11' }).join() === '2026-11-10')
ok('a three-day trip covers three days', daysOf({ date: '2026-11-10' }, { date: '2026-11-13' }).length === 3)
ok('an evening is one day', daysOf({ dateTime: '2026-11-10T19:00:00' }, { dateTime: '2026-11-10T21:00:00' }).join() === '2026-11-10')
ok('ending at midnight does not spill into the next day', daysOf({ dateTime: '2026-11-10T20:00:00' }, { dateTime: '2026-11-11T00:00:00' }).join() === '2026-11-10')
ok('a late night that runs past midnight shows on both', daysOf({ dateTime: '2026-11-10T22:00:00' }, { dateTime: '2026-11-11T02:00:00' }).length === 2)
const gcal = src('engine/gcal.ts')
ok('read-only: the narrowest scope that can see events', gcal.includes("calendar.events.readonly") && !/auth\/calendar['"]/.test(gcal))
ok('nothing of it goes to our servers', !/fetch\(\s*['"]\/api/.test(gcal))
ok('and the option is hidden without a client id', gcal.includes("if (status === 'unavailable') return null") || src('components/Calendar.tsx').includes("if (status === 'unavailable') return null"))

console.log('\nAdd to calendar, everywhere there is an event')
for (const f of ['components/Calendar.tsx', 'components/path/Board.tsx', 'components/Errand.tsx', 'components/Drops.tsx']) ok(f, src(f).includes('<AddToCalendar'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nall good')
