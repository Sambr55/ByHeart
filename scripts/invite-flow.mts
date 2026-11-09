import { chromium, type BrowserContext } from 'playwright'
import { pathUnits } from '../content/path'
import { DEFAULT_PAIR } from '../content/pairs'
import { learnerStorageKey } from '../engine/learner'
/**
 * AN INVITATION, END TO END, against a real database (2026-11-09).
 *
 *   npm run invite:flow          (needs a dev server with a DATABASE_URL — BASE_URL, default :3126)
 *
 * scripts/invite-check.mts reads the rules at the source; this runs them. Written after the
 * first run found three faults the source checks could not: a new phone given two device ids
 * (the friend accepted under one and synced under the other), the device grant refused by a
 * foreign key, and the invite marked paid before the grant failed. Two browsers, one inviter
 * and one friend: the link goes out, the friend takes it up, nothing is paid until they say a
 * room out loud, then both have full access — and a third phone cannot reuse the link.
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3126'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label)
}
const now = new Date().toISOString()
const u = pathUnits(undefined, new Date(), 'visiting')
const roomLine = { pt: u[0].rooms[0].release.answer, en: u[0].rooms[0].release.ask, source: 'room', clean: true, at: now }
const learner = (name: string, proof: unknown[]) => ({ version: 1, learner_id: name + '-' + Math.random().toString(36).slice(2, 8), purpose: 'visiting', chapter: 'lisbon', finished_cards: proof.length ? [u[0].rooms[0].id] : [], display_name: name, set_up_at: now, deal_accepted_at: now, club_welcomed_at: now, club_walked_at: now, proof })
async function seed(ctx: BrowserContext, v: unknown) {
  const p = await ctx.newPage()
  await p.goto(BASE + '/settings', { waitUntil: 'domcontentloaded' })
  await p.evaluate(([k, pair, s]) => { localStorage.clear(); localStorage.setItem('byheart.pair', JSON.stringify(pair)); localStorage.setItem(k as string, JSON.stringify(s)) }, [learnerStorageKey(DEFAULT_PAIR), DEFAULT_PAIR, v] as const)
  return p
}
const ent = (p: import('playwright').Page) => p.evaluate(async () => (await fetch('/api/entitlements')).json())
const b = await chromium.launch()

// A: the inviter, who has said a room cold
const A = await b.newContext()
await A.addInitScript(() => { (navigator as unknown as { share: (d: unknown) => Promise<void> }).share = async (d) => { (window as unknown as { __shared: unknown }).__shared = d } })
const pa = await seed(A, learner('Sam', [roomLine]))
await pa.goto(BASE + '/profile', { waitUntil: 'networkidle' }); await pa.waitForTimeout(3500)
ok('the inviter starts on the free plan', (await ent(pa)).comped === false)
await pa.locator('[data-testid=friends-bring]').scrollIntoViewIfNeeded()
await pa.click('[data-testid=friends-bring]'); await pa.waitForTimeout(1500)
const shared = await pa.evaluate(() => (window as unknown as { __shared?: { url?: string; text?: string } }).__shared)
ok('Bring somebody hands the share sheet a link and the ask', Boolean(shared?.url?.includes('/come/') && shared?.text))
const url = shared?.url
if (!url) { console.log('no link'); process.exit(1) }

// B: the friend, fresh
const B = await b.newContext()
const pb = await B.newPage()
await pb.goto(url.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'networkidle' }); await pb.waitForTimeout(1500)
ok('the friend lands on the invitation, not on "already taken"', (await pb.locator('[data-testid=come-spent]').count()) === 0 && (await pb.locator('[data-testid=come-start]').count()) === 1)
const after = (await pa.evaluate(async () => (await fetch('/api/invite')).json())).invites ?? []
ok('the inviter sees them take it up', after.length === 1 && Boolean(after[0].accepted_at) && !after[0].landed_at)
// B sets up, but has not said anything cold yet
await pb.evaluate(([k, pair, s]) => { localStorage.setItem('byheart.pair', JSON.stringify(pair)); localStorage.setItem(k as string, JSON.stringify(s)) }, [learnerStorageKey(DEFAULT_PAIR), DEFAULT_PAIR, learner('Ana', [])] as const)
await pb.goto(BASE + '/club', { waitUntil: 'networkidle' }); await pb.waitForTimeout(3500)
ok('nothing is paid while the friend has said nothing', !((await pa.evaluate(async () => (await fetch('/api/invite')).json())).invites?.[0]?.landed_at))
// B says the first room cold
await pb.evaluate(([k, s]) => { localStorage.setItem(k as string, JSON.stringify(s)) }, [learnerStorageKey(DEFAULT_PAIR), learner('Ana', [roomLine])] as const)
await pb.goto(BASE + '/club', { waitUntil: 'networkidle' }); await pb.waitForTimeout(3500)
ok('it lands when the friend says a room out loud', Boolean((await pa.evaluate(async () => (await fetch('/api/invite')).json())).invites?.[0]?.landed_at))
const ea = await ent(pa), eb = await ent(pb)
ok('the inviter has full access', ea.entitlements?.plan === 'pro' && ea.comped === true)
ok('and so does the friend', eb.entitlements?.plan === 'pro' && eb.comped === true)
// the same code again, from a third device
const C = await b.newContext(); const pc = await C.newPage()
await pc.goto(url.replace(/^https?:\/\/[^/]+/, BASE), { waitUntil: 'networkidle' }); await pc.waitForTimeout(1500)
ok('a third phone cannot reuse the link', (await pc.locator('[data-testid=come-spent]').count()) === 1)
await b.close()
if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)')
  process.exit(1)
}
console.log('\nan invitation pays both, once, when the friend can speak')
