/**
 * SIGN-IN BY CODE, THE FREE WEEK, EXISTING USERS FREE, AND THE PEOPLE PAGE (2026-11-05).
 *
 *   npm run accounts
 *
 * Sam: "yes build code sign in, I think we start with first week free then the full plan.
 * Let's set-up stripe. Existing users get free access. And btw I need an admin function to
 * see registrations, sign-ups and cancels etc." This holds each of those still.
 */
import { readFileSync } from 'node:fs'
import { billingMoments } from '../lib/billing-moments'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const src = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

console.log('\nsign in with a code')
const auth = src('lib/auth.ts')
ok('six digits, random', /randomInt\(0, 1_000_000\)/.test(auth) && /padStart\(6, '0'\)/.test(auth))
ok('stored hashed, never plain', /code_hash/.test(auth) && /codeHash\(email, code\)/.test(auth) && !/values \([^)]*\$\{code\}/.test(auth))
ok('five wrong guesses kill it', /CODE_TRIES = 5/.test(auth) && /attempts = attempts \+ 1/.test(auth))
ok('one email, one way in: the code spends the link too', /set used_at = now\(\) where token_hash = \$\{hit\.token_hash\}/.test(auth))
ok('the email leads with the code', /Your DUB code: /.test(src('lib/email.ts')) && /sendLoginLink\(email, link\.url, link\.code\)/.test(src('app/api/auth/request/route.ts')))
const codeRoute = src('app/api/auth/code/route.ts')
ok('the code route signs in on the device in hand (cookie on its own response)', /out\.cookies\.set\(session\.name/.test(codeRoute) && /claimDevice\(device, user\.id\)/.test(codeRoute))
ok('the screen asks for the code, with the phone’s autofill', /autoComplete="one-time-code"/.test(src('components/SignIn.tsx')))

console.log('\nthe first week free')
const billing = src('lib/billing.ts')
ok('a 7-day trial by default, set by BILLING_TRIAL_DAYS', /BILLING_TRIAL_DAYS \?\? 7/.test(billing) && /trial_period_days: trial/.test(billing))
ok('once per person', /had\?\.stripe_subscription_id \? 0 : trialDays\(\)/.test(billing))
ok('flexible billing mode, and a trial with no card cancels (the Stripe plan)', /billing_mode: \{ type: 'flexible' \}/.test(billing) && /missing_payment_method: 'cancel'/.test(billing))
ok('the card is taken up front, the address for receipts and tax', /payment_method_collection: 'always'/.test(billing) && /billing_address_collection: 'auto'/.test(billing))
ok('the founding offer closes at 500, never substituted', /FOUNDING_CAP = 500/.test(billing) && /the founding offer is full/.test(src('app/api/billing/checkout/route.ts')))
ok('the Pro page says so, with the way out', /Your first week is free\. Cancel any time in that week/.test(src('components/Pro.tsx')))
ok('the two free levels stay free (not removed)', /isFreeRoom/.test(src('lib/entitlements.ts')))

console.log('\nwhat a billing change is')
const m = (p: Parameters<typeof billingMoments>[0], n: Parameters<typeof billingMoments>[1]) => billingMoments(p, n).join(',')
ok('first sync of a trial: trial started', m(null, { status: 'trialing', cancel_at_period_end: false }) === 'trial_started')
ok('trial turns active: converted', m({ status: 'trialing', cancel_at_period_end: false }, { status: 'active', cancel_at_period_end: false }) === 'converted')
ok('straight to active: subscribed', m(null, { status: 'active', cancel_at_period_end: false }) === 'subscribed')
ok('cancel in the trial: cancel requested', m({ status: 'trialing', cancel_at_period_end: false }, { status: 'trialing', cancel_at_period_end: true }) === 'cancel_requested')
ok('changed their mind: cancel undone', m({ status: 'active', cancel_at_period_end: true }, { status: 'active', cancel_at_period_end: false }) === 'cancel_undone')
ok('the period runs out: ended', m({ status: 'active', cancel_at_period_end: true }, { status: 'canceled', cancel_at_period_end: true }) === 'ended')
ok('a renewal is not a moment', m({ status: 'active', cancel_at_period_end: false }, { status: 'active', cancel_at_period_end: false }) === '')
ok('payment failed', m({ status: 'active', cancel_at_period_end: false }, { status: 'past_due', cancel_at_period_end: false }) === 'payment_failed')

console.log('\nexisting users free')
const comp = src('lib/comp.ts')
ok('accounts and devices, both', /insert into subscriptions \(user_id, source, plan, status\)\s+select u\.id, 'comp'/.test(comp) && /insert into device_comps \(device_id, code, plan\)\s+select l\.device_id/.test(comp))
ok('never over anybody who pays (on conflict do nothing)', (comp.match(/on conflict \(user_id\) do nothing/g) ?? []).length >= 2)
ok('only people here before the moment it is pressed', /u\.created_at < \$\{before\}/.test(comp) && /l\.created_at < \$\{before\}/.test(comp))
ok('it follows them onto their account at sign-in, by link and by code', ['app/api/auth/verify/route.ts', 'app/api/auth/code/route.ts'].every((f) => /carryDeviceComp\(device, user\.id\)/.test(src(f))))
const admin = src('app/api/admin/people/route.ts')
ok('admin only, and typed confirmation to press it', /adminKeyValid/.test(admin) && /confirm !== 'FREE FOR EXISTING'/.test(admin))

console.log('\nthe people page')
const people = src('lib/people.ts')
for (const k of ['learners', 'accounts', 'trialing', 'paying', 'cancelling', 'ended', 'pastDue', 'compedAccounts', 'compedDevices']) ok('counts ' + k, people.includes(k + ':'))
ok('a month, day by day: learners, accounts, trials, conversions, subscriptions, cancels, ends', /generate_series/.test(people) && ['trial_started', 'converted', 'subscribed', 'cancel_requested', "'ended'"].every((k) => people.includes(k)))
ok('every billing change is logged as it happens', /insert into billing_events/.test(billing) && /billing_events/.test(src('db/migrations/017_billing_events.sql')))
ok('reachable from the admin home', /href="\/admin\/people"/.test(src('app/admin/page.tsx')))
ok('deleting an account deletes its billing moments', /on delete cascade/.test(src('db/migrations/017_billing_events.sql')))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\naccounts hold')
