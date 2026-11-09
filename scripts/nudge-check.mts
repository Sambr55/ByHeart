/**
 * Nudges for people who have gone quiet (2026-11-09).
 *
 *   npm run nudge
 *
 * Sam: "chivvy people along" — 3 days for the phone, 7 for email. Fails if a nudge would go
 * too early, too often, to somebody who said no, or after they have long gone; if coming
 * back does not reset it; if counting starts before the server could see visits; or if an
 * email could go without its way to stop.
 */
import { readFileSync } from 'node:fs'
import { EMAIL_DAYS, PUSH_DAYS, REPEAT_DAYS, STOP_EMAIL_DAYS, STOP_PUSH_DAYS, TRACKED_FROM, daysAway, emailNudgeDue, nudgeBody, pushNudgeDue } from '../lib/nudge'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const DAY = 86_400_000
const now = new Date('2027-03-01T09:00:00Z')
const ago = (d: number) => new Date(now.getTime() - d * DAY)

console.log('\nthe phone, after ' + PUSH_DAYS + ' days')
ok('not before', !pushNudgeDue({ lastActive: ago(PUSH_DAYS - 0.5), nudgedAt: null, cadence: 'daily' }, now))
ok('on the day', pushNudgeDue({ lastActive: ago(PUSH_DAYS), nudgedAt: null, cadence: 'daily' }, now))
ok('once, then not the next day', !pushNudgeDue({ lastActive: ago(PUSH_DAYS + 1), nudgedAt: ago(1), cadence: 'daily' }, now))
ok('again a week later if still away', pushNudgeDue({ lastActive: ago(PUSH_DAYS + REPEAT_DAYS), nudgedAt: ago(REPEAT_DAYS), cadence: 'daily' }, now))
ok('never after ' + STOP_PUSH_DAYS + ' days away', !pushNudgeDue({ lastActive: ago(STOP_PUSH_DAYS + 1), nudgedAt: null, cadence: 'daily' }, now))
ok('not to somebody who turned the Line off', !pushNudgeDue({ lastActive: ago(5), nudgedAt: null, cadence: 'off' }, now))
ok('three-a-week still hears on the day', pushNudgeDue({ lastActive: ago(4), nudgedAt: null, cadence: 'three' }, now))
ok('coming back resets it: due again after the next quiet spell', pushNudgeDue({ lastActive: ago(PUSH_DAYS), nudgedAt: ago(PUSH_DAYS + 2), cadence: 'daily' }, now))

console.log('\nemail, after ' + EMAIL_DAYS + ' days, only if asked')
ok('not without the separate yes', !emailNudgeDue({ lastActive: ago(10), emailedAt: null, optedIn: false }, now))
ok('not before ' + EMAIL_DAYS + ' days', !emailNudgeDue({ lastActive: ago(EMAIL_DAYS - 1), emailedAt: null, optedIn: true }, now))
ok('on the day', emailNudgeDue({ lastActive: ago(EMAIL_DAYS), emailedAt: null, optedIn: true }, now))
ok('at most one a week', !emailNudgeDue({ lastActive: ago(12), emailedAt: ago(5), optedIn: true }, now))
ok('never after ' + STOP_EMAIL_DAYS + ' days away', !emailNudgeDue({ lastActive: ago(STOP_EMAIL_DAYS + 1), emailedAt: null, optedIn: true }, now))

console.log('\nwhen counting starts')
const early = new Date(TRACKED_FROM.getTime() + 2 * DAY)
ok('a record stale from before the server could see visits is not "away"', daysAway(new Date('2026-10-01'), early) < PUSH_DAYS)
ok('so the first days after shipping nudge nobody', !pushNudgeDue({ lastActive: new Date('2026-10-01'), nudgedAt: null, cadence: 'daily' }, early))

console.log('\nwhat it says')
ok('names the room and how long', /4 days/.test(nudgeBody('At the bank', 4.2)) && /At the bank/.test(nudgeBody('At the bank', 4.2)))

console.log('\nwiring')
const line = src('app/api/cron/line/route.ts')
ok('the phone nudge replaces the morning Line, never adds to it', /PUSH_NUDGE[\s\S]*?last_line_at[\s\S]*?pushNudgeDue[\s\S]*?continue/.test(line))
ok('and is off until PUSH_NUDGE=on', line.includes("on('PUSH_NUDGE')"))
const cron = src('app/api/cron/nudge/route.ts')
ok('email is off until NUDGE_EMAIL=on', cron.includes("process.env.NUDGE_EMAIL !== 'on'"))
ok('only to people who said yes', /and u\.nudge_email/.test(cron))
ok('a dry run never answers without the secret', /dry && !secret/.test(cron))
const mail = src('lib/email.ts')
ok('every email has a way to stop, in the body and as a one-click header', mail.includes('Stop these emails') && mail.includes("'List-Unsubscribe-Post'"))
const unsub = src('app/api/email/unsubscribe/route.ts')
ok('the unsubscribe link is signed, and does one thing', unsub.includes('unsubscribeValid') && /set nudge_email = false/.test(unsub) && (unsub.match(/update /g) ?? []).length === 1)
const acct = src('components/Account.tsx')
ok('the email yes is its own box, not the drops one', acct.includes('account-nudge-email') && acct.includes('nudge_email: nudge'))
ok('deleting an account switches it off', src('lib/store.ts').includes('nudge_email = false'))
ok('the daily email job is scheduled', src('vercel.json').includes('/api/cron/nudge'))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nall good')
