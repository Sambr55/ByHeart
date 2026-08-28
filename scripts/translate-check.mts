/**
 * The translator is there when it should be, and nowhere else.
 *
 *   npm run translate
 *
 * Two things are worth measuring and neither of them is the translation itself.
 *
 * WHO SEES IT. The button is gated twice — on the learner being in the Club, and on the
 * server having an API key. Both gates fail open in the dangerous direction if they are
 * wrong: a button that renders without a key opens a panel that can only apologise, and a
 * button that renders before the Club puts a metered API in front of every stranger who
 * finds the site.
 *
 * WHETHER IT SURVIVES THE PANEL. Everything after the ask — the answer, its audio, KEEP,
 * asking another — is driven against a stubbed endpoint. Real calls cost money and return
 * something different every time, which is the wrong basis for a gate; the shape of the
 * answer is DUB's contract, and that can be pinned exactly.
 *
 * The upstream itself is checked separately and only when a key is present, because a
 * check that cannot run without a paid credential is a check that is off.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_FRAMES } from '../content/legend'
import { ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const opener = ROOTS.find((r) => r.rung === 1)!
const proof = ROOTS.filter((r) => r.rung <= 2)
  .slice(0, 6)
  .map((r, i) => ({
    pt: r.transfer_prompt.answer,
    en: r.transfer_prompt.ask,
    source: 'release',
    clean: true,
    at: String(i + 1),
  }))

/** A learner the Club is open to, and one it is not. */
function seed(member: boolean) {
  return {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    proof: member ? proof : [{ ...proof[0] }],
    inventory: {},
    roots_played: [],
    sections_completed: [],
    legend: member
      ? LEGEND_FRAMES.map((f) => ({ frame_id: f.id, values: { seeded: 'yes' } }))
      : [],
    saved: [],
    liked: [],
    finished_cards: [],
    asked: [],
    evidence: [],
    // The Club's own shortcut: welcomed once means in, forever.
    club_welcomed_at: member ? '2026-08-20T00:00:00.000Z' : null,
  }
}

const ANSWER = {
  pt: 'Queria pagar com cartão.',
  en: "I'd like to pay by card",
  note: 'queria, not quero — softer, and what you actually hear at a counter.',
  id: 1,
  left: 59,
}

/** Stub the endpoint. `on` decides what the button-visibility call reports. */
async function stub(page: Page, on: boolean) {
  await page.route('**/api/translate', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ on }) })
    }
    const body = JSON.parse(route.request().postData() ?? '{}') as { keep?: number }
    if (typeof body.keep === 'number') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ kept: true }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) })
  })
}

async function open(browser: Awaited<ReturnType<typeof chromium.launch>>, member: boolean, on: boolean) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await stub(page, on)
  await page.goto(BASE + '/vibes')
  await page.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seed(member)] as const,
  )
  await page.goto(BASE + '/vibes')
  await page.waitForTimeout(1600)
  return { context, page }
}

const browser = await chromium.launch()

console.log('\nwho gets the button\n')
{
  const { context, page } = await open(browser, false, true)
  ok(
    'not before the Club',
    !(await page.$('[data-testid="translator-open"]')),
    'a metered API is not for every stranger who finds the site',
  )
  await context.close()
}
{
  const { context, page } = await open(browser, true, false)
  ok(
    'not without a key',
    !(await page.$('[data-testid="translator-open"]')),
    'a button that can only apologise costs a tap and teaches that DUB is broken',
  )
  await context.close()
}

const { context, page } = await open(browser, true, true)
ok('a member with a key gets it', Boolean(await page.$('[data-testid="translator-open"]')))

/*
  It is on every screen, including the ones a conversation actually starts on.

  Mounted at the root rather than per-shell, so this is a claim about the layout and not
  about four components remembering to include it.
*/
console.log('\nand it is everywhere\n')
for (const route of ['/vibes', '/club', '/line', '/profile', '/proof', '/vocab']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(1100)
  ok('on ' + route, Boolean(await page.$('[data-testid="translator-open"]')))
}

console.log('\nasking for something\n')
await page.goto(BASE + '/club')
await page.waitForTimeout(1300)
await page.click('[data-testid="translator-open"]')
await page.waitForSelector('[data-testid="translator"]')
ok('the panel opens', Boolean(await page.$('[data-testid="translator-input"]')))

const askDisabled = await page.evaluate(
  `document.querySelector('[data-testid="translator-ask"]').disabled`,
) as boolean
ok('and will not ask for nothing', askDisabled, 'an empty box costs a call')

await page.fill('[data-testid="translator-input"]', "I'd like to pay by card")
await page.click('[data-testid="translator-ask"]')
await page.waitForSelector('[data-testid="translator-result"]')
const shown = ((await page.textContent('[data-testid="translator-result"]')) ?? '').replace(/\s+/g, ' ')
ok('the Portuguese comes back', shown.includes(ANSWER.pt), shown.slice(0, 46))
ok('the note comes with it', shown.includes('queria, not quero'))
ok(
  'and it can be heard',
  Boolean(await page.$('[data-testid="translator-result"] [data-testid="audio"]')),
  'every answer in DUB carries its audio',
)

console.log('\nkeeping it\n')
await page.click('[data-testid="translator-keep"]')
await page.waitForTimeout(700)
const kept = await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').asked || []) } catch { return [] } })()`,
) as { pt: string }[]
ok('it lands on the learner', kept.length === 1 && kept[0].pt === ANSWER.pt, kept.length + ' kept')
ok(
  'and the button says so',
  ((await page.textContent('[data-testid="translator-keep"]')) ?? '').includes('KEPT'),
)

await page.click('[data-testid="translator-keep"]').catch(() => {})
await page.waitForTimeout(400)
const twice = await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').asked || []).length } catch { return 0 } })()`,
) as number
ok('keeping twice keeps one', twice === 1, twice + ' on the learner')

await page.click('[data-testid="translator-again"]')
await page.waitForTimeout(500)
ok(
  'ASK ANOTHER clears the box',
  (await page.inputValue('[data-testid="translator-input"]')) === '',
)

await page.click('[data-testid="translator-close"]')
await page.waitForTimeout(400)
ok('and it closes', !(await page.$('[data-testid="translator"]')))

await context.close()
await browser.close()

/*
  The upstream, only when there is a key to reach it with.

  Guarded rather than skipped silently — a run that cannot make the call says so, because
  "all green" on a suite that never tested the API is the kind of green that costs a
  release.
*/
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('\nno ANTHROPIC_API_KEY here, so the upstream itself was not called\n')
} else {
  console.log('\nand the real thing\n')
  const { translate } = await import('../lib/translate')
  try {
    const real = await translate({ text: 'I would like to pay by card', register: 'tu' })
    ok('it answers', Boolean(real.pt), real.pt)
    /*
      The one thing that would make this product wrong rather than merely worse.

      Brazilian Portuguese is what every general-purpose engine returns by default, and a
      handful of words give it away immediately.
    */
    const brazilian = /\b(ônibus|celular|trem|banheiro|você está fazendo|a gente vai)\b/i
    ok('in Portuguese from Portugal', !brazilian.test(real.pt), real.pt)
  } catch (e) {
    ok('it answers', false, (e as Error).message)
  }
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe translator is there for members, and nowhere else')
