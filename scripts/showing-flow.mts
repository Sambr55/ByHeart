/**
 * Two people, one link, end to end.
 *
 *   npm run db:migrate && npm run showing:flow
 *
 * The unit checks are about the shape of the code. This one is about what actually
 * happens when two different phones open the same URL, which is where a pairing feature
 * really fails: the second person becomes the recipient, the third gets told it was
 * addressed to somebody else, and a blocked sender sees the same thing a stranger sees
 * rather than a message confirming they were blocked.
 *
 * Needs a database. Anything with Postgres will do — the whole schema is eight files.
 */
import { chromium, type BrowserContext, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** A learner with something worth showing, and a Legend line that must never travel. */
function seed(name: string, said: string) {
  return {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    display_name: name,
    proof: [
      { pt: said, en: 'a thing they can say', source: 'release', clean: true, at: '1' },
      { pt: 'Os meus filhos chamam-se Oscar e Tilly.', en: 'my children', source: 'legend', clean: true, at: '2' },
    ],
    inventory: {},
    roots_played: [],
    sections_completed: ['the_basics'],
    legend: [],
    saved: [],
    liked: [],
    finished_cards: [],
  }
}

async function open(browser: Awaited<ReturnType<typeof chromium.launch>>, who: string, said: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  await page.goto(BASE + '/vibes')
  await page.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seed(who, said)] as const,
  )
  return { context, page }
}

const browser = await chromium.launch()

console.log('\none person shows another\n')
const alice = await open(browser, 'Alice', 'Um café, se faz favor.')
await alice.page.goto(BASE + '/proof')
await alice.page.waitForSelector('[data-testid="show-somebody"]')

const minted = alice.page.waitForResponse((r) => r.url().includes('/api/showing') && r.request().method() === 'POST')
await alice.page.click('[data-testid="show-somebody"]')
const body = (await (await minted).json()) as { ok: boolean; path?: string; reason?: string }
ok('a showing is minted', body.ok === true, body.reason ?? '')
const path = body.path ?? ''
ok('and it is not a public card url', path.startsWith('/s/'), path)

console.log('\nthe person it was sent to\n')
const bob = await open(browser, 'Bob', 'Onde é a casa de banho?')
await bob.page.goto(BASE + path)
await bob.page.waitForSelector('[data-testid="show-back"]')
const seenByBob = (await bob.page.textContent('main')) ?? ''
ok('sees what she can say', seenByBob.includes('Um café, se faz favor.'))
ok('and never her Legend', !seenByBob.includes('Oscar'), 'this is the one that must never fail')
ok('and nothing else about her', !seenByBob.includes('Alice'), 'no name is claimed here; nothing was verified')

await bob.page.click('[data-testid="show-back"]')
await bob.page.waitForTimeout(3000)
const afterBob = (await bob.page.textContent('main')) ?? ''
ok('showing back pairs them', afterBob.includes('Onde é a casa de banho?') && afterBob.includes('Um café'))

console.log('\nand back at her end\n')
await alice.page.goto(BASE + path)
await alice.page.waitForTimeout(1500)
const afterAlice = (await alice.page.textContent('main')) ?? ''
ok('she sees his', afterAlice.includes('Onde é a casa de banho?'))
ok('and her own', afterAlice.includes('Um café, se faz favor.'))
ok('and his Legend did not travel either', !afterAlice.includes('Oscar'))

console.log('\naddressed to one person\n')
const carol = await open(browser, 'Carol', 'Bom dia.')
await carol.page.goto(BASE + path)
await carol.page.waitForTimeout(1500)
const seenByCarol = (await carol.page.textContent('main')) ?? ''
ok('a third person is turned away', /already answered/i.test(seenByCarol))
ok('and shown nothing', !seenByCarol.includes('Um café, se faz favor.'), 'not even the card')

console.log('\nblocking\n')
await bob.page.goto(BASE + path)
await bob.page.waitForSelector('[data-testid="safety"]')
await bob.page.click('[data-testid="safety"]')
await bob.page.click('[data-testid="report-offensive"]')
await bob.page.waitForTimeout(800)
ok('a report is taken', /Reported/i.test((await bob.page.textContent('main')) ?? ''))
await bob.page.click('[data-testid="block"]')
await bob.page.waitForTimeout(1200)
ok('and the block lands', /Blocked/i.test((await bob.page.textContent('main')) ?? ''))

await alice.page.goto(BASE + path)
await alice.page.waitForTimeout(1500)
const blockedView = (await alice.page.textContent('main')) ?? ''
ok('the blocked side sees the link is gone', /has gone/i.test(blockedView))
ok(
  'and is not told they were blocked',
  !/blocked/i.test(blockedView),
  'telling somebody they were blocked is a message from the person who blocked them',
)
ok('and can no longer see his card', !blockedView.includes('Onde é a casa de banho?'))

for (const c of [alice, bob, carol]) await (c.context as BrowserContext).close()
await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\ntwo people, one link, and nothing leaked')
