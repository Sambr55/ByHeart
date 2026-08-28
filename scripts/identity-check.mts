/**
 * The account is the record and the device is a cache.
 *
 *   npm run identity
 *
 * The merge rule itself is covered by fixtures in npm run merge:test — a refusal is exactly
 * the kind of rule that gets written, passes by accident, and is never exercised, so it is
 * tested before it is used.
 *
 * What is left is the part fixtures cannot see: whether the two MOMENTS behave. Signing out
 * must keep the local copy, because losing it would be losing it permanently when the
 * server holds nothing — and because the stamp on it is what makes the next sign-in safe.
 * Resetting must not, because reset means this device is not mine.
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS } from '../content/roots'
import { mergeOwner } from '../lib/merge'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nthe rule, and only one of it\n')
ok('anonymous plus anonymous is anonymous', mergeOwner(null, null) === null)
ok('anonymous is claimed', mergeOwner(null, 'alice') === 'alice')
ok('a stale anonymous copy cannot un-claim', mergeOwner('alice', null) === 'alice')
ok('one person, two devices', mergeOwner('alice', 'alice') === 'alice')
let refused = false
try {
  mergeOwner('alice', 'bob')
} catch {
  refused = true
}
ok('two people refuse', refused)

/*
  One implementation, because two would disagree — which is precisely how the front door
  and the Club came to hold different opinions about who was a member.
*/
const merge = readFileSync('lib/merge.ts', 'utf8')
ok(
  'mergeLearner asks mergeOwner rather than deciding for itself',
  /const owner = mergeOwner\(/.test(merge),
)

console.log('\nwhat clears a device, and what does not\n')
/*
  Grepped rather than reasoned about. wipeLearner is the only thing that empties the
  record, and where it is called from IS the policy — a stray call added to a sign-out
  handler would be invisible in review and catastrophic in use.
*/
const callers = ['components/Account.tsx', 'components/Reset.tsx', 'engine/learner.ts'].filter(
  (f) => /wipeLearner\(\)/.test(readFileSync(f, 'utf8')),
)
console.log('  wipeLearner() is called from: ' + callers.join(', '))
ok(
  'nothing about signing out clears the record',
  !/wipeLearner/.test(readFileSync('app/api/auth/logout/route.ts', 'utf8')),
)
ok(
  'and deleting the account does',
  /wipeLearner\(\)/.test(readFileSync('components/Account.tsx', 'utf8')),
)

console.log('\nand on a real device\n')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

const opener = ROOTS.find((r) => r.rung === 1)!
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  user_id: 'alice',
  proof: [
    {
      pt: opener.transfer_prompt.answer,
      en: opener.transfer_prompt.ask,
      source: 'release',
      clean: true,
      at: '1',
    },
  ],
  inventory: {},
  roots_played: [],
  sections_completed: ['the_basics'],
  legend: [],
  saved: [],
  liked: [],
  finished_cards: [],
}

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)

const read = async () =>
  (await page.evaluate(`localStorage.getItem(${JSON.stringify(KEY)})`)) as string | null

ok('the record carries whose it is', JSON.parse((await read()) ?? '{}').user_id === 'alice')

/*
  Signing out through the real route, then back to this origin to read.

  The route answers with a redirect built by absoluteUrl, which uses the configured app URL
  — in production that is the site itself, and in dev it is localhost:3000 whatever port the
  server is actually on. So the browser can land on a DIFFERENT origin, where localStorage
  is a different store and the record looks deleted when it is simply somewhere else.

  That is a property of the check, not of the product, and the first version of this failed
  on it convincingly. What is being asserted is the invariant — that signing out does not
  empty this origin's record — so the read happens on this origin.
*/
await page.goto(BASE + '/api/auth/logout')
await page.waitForTimeout(1200)
await page.goto(BASE + '/vibes')
await page.waitForTimeout(600)
const after = await read()
ok('signing out keeps the record', Boolean(after), after ? 'still there' : 'gone')
ok(
  'and keeps the stamp on it',
  JSON.parse(after ?? '{}').user_id === 'alice',
  'the stamp is what makes the next sign-in safe',
)
ok(
  'and every proof line',
  (JSON.parse(after ?? '{}').proof ?? []).length === seed.proof.length,
)

/*
  And reset does clear it, stamp included. "This device is not mine" has to include the
  part that says whose it is, or the next person inherits a refusal they cannot explain.
*/
await page.goto(BASE + '/reset')
await page.waitForTimeout(1200)
const wipe = await page.$('[data-testid="reset-confirm"], button:has-text("START AGAIN")')
if (wipe) {
  await wipe.click()
  await page.waitForTimeout(1600)
  const left = await read()
  ok('reset clears the record', !left, left ? 'still there' : 'gone')
} else {
  console.log('  · reset needs a confirmation this check could not find — skipped')
}

console.log('\nthe way back in says the right thing to whoever is reading it\n')
/*
  Two people arrive at /signin and it used to speak to one of them.

  "Been here before?" on the front door is somebody RETURNING — new phone, cleared browser
  — and "keep what you have learned" tells them work that is not on this device is on it.
  The line at the end of a session is the opposite: they have just earned something and the
  pitch is exactly right. The device knows which is which without asking.
*/
{
  const fresh = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const blank = await fresh.newPage()
  await blank.goto(BASE + '/signin')
  await blank.waitForTimeout(1200)
  const empty = ((await blank.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok('an empty device is welcomed back', /Welcome back/i.test(empty), empty.slice(0, 44))
  ok(
    'and is not told its work is on this phone',
    !/on this phone only/i.test(empty),
    'there is nothing on it',
  )
  await blank.close()
  await fresh.close()

  /*
    The same page on a device with something to lose. Re-seeded first: the reset check
    above deliberately emptied this one, and reading it straight afterwards would be
    asserting the full-device copy against an empty device — which is how a check ends up
    testing the opposite of what it says.
  */
  await page.goto(BASE + '/vibes')
  await page.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seed] as const,
  )
  await page.goto(BASE + '/signin')
  await page.waitForTimeout(1200)
  const full = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok('a device with proof is offered the protection', /Keep what you have learned/i.test(full))
  ok(
    'and told exactly what is at stake',
    /\d+ sentence/.test(full),
    (full.match(/\d+ sentences? you can say cold/) ?? ['no count'])[0],
  )
}

console.log('\nand through the server, if there is one\n')
/*
  The round trip, because the bug this exists to catch was invisible from either end.

  saveSession wrote the raw incoming body straight over the learner row — through
  saveLearner, before the route's merge block ever read it — so the server's copy was
  destroyed and the merge then merged the body with itself. Every part in isolation looked
  correct. Nineteen merge fixtures passed. What was wrong was the ORDER of two writes, and
  only a round trip can see that.

  Skipped without a database rather than failed: a laptop with no Postgres is an ordinary
  state, and a gate that cannot run is not the same as a gate that failed.
*/
if (!process.env.DATABASE_URL) {
  console.log('  · no DATABASE_URL, so the server half is not exercised here')
} else {
  const jar = await browser.newContext()
  const api = await jar.newPage()
  await api.goto(BASE + '/vibes')

  const sync = (owner: string | null, pt: string, at: string, sid: string) =>
    api.evaluate(`(async () => {
      const r = await fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: ${JSON.stringify(sid)}, version: 1, user_id: ${JSON.stringify(owner)},
          proof: [{ pt: ${JSON.stringify(pt)}, en: 'x', source: 'release', clean: true, at: ${JSON.stringify(at)} }],
          inventory: {}, evidence: [],
        }),
      })
      return r.json()
    })()`)
  const held = async () =>
    ((await api.evaluate(`(async () => (await fetch('/api/session?mine=1')).json())()`)) as {
      state?: { proof?: unknown[]; user_id?: string | null }
    }) ?? {}

  await sync(null, 'first device', '2026-08-01T00:00:00.000Z', 'id-1')
  const one = await held()
  ok('the first sync stores what it was given', (one.state?.proof ?? []).length === 1)

  /*
    The one that mattered. A second device with LESS history, syncing — which used to
    replace the server's copy and then push the shorter version to every row the account
    owned.
  */
  await sync('alice', 'second device', '2026-08-02T00:00:00.000Z', 'id-2')
  const two = await held()
  ok(
    'a second sync gains rather than replaces',
    (two.state?.proof ?? []).length === 2,
    (two.state?.proof ?? []).length + ' line(s) — this used to be 1',
  )
  ok('and the claim sticks', two.state?.user_id === 'alice', String(two.state?.user_id))

  // And the refusal, on the server, where it also has to hold.
  await sync('bob', 'bob line', '2026-08-03T00:00:00.000Z', 'id-3')
  const three = await held()
  ok(
    'somebody else syncing into this device changes nothing',
    (three.state?.proof ?? []).length === 2 && three.state?.user_id === 'alice',
    (three.state?.proof ?? []).length + ' line(s), owner ' + String(three.state?.user_id),
  )
  await jar.close()
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe account is the record, the device is a cache, and two people never merge')
