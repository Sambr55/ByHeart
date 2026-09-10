/**
 * Drive the Club looking for the white screen.
 *
 *   npx tsx scripts/whitescreen-drive.mts
 *
 * Seeds a learner, opens /club, and presses every call to action on every card while
 * listening for an uncaught page error. A white screen in Next is a render that threw,
 * so `pageerror` plus "did the root go empty" is the whole detector.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { PIECES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)

const browser = await chromium.launch()
const errors: string[] = []

async function seed(page: Page, learner: Record<string, unknown>) {
  await page.goto(BASE + '/club')
  await page.evaluate(
    ([k, pair, l]) => {
      localStorage.clear()
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(l))
    },
    [KEY, DEFAULT_PAIR, learner] as const,
  )
}

/** Is the page blank? A white screen has nothing rendered under the root. */
async function blank(page: Page): Promise<boolean> {
  return page.evaluate(() => (document.body.innerText ?? '').trim().length < 20)
}

async function run(label: string, learner: Record<string, unknown>, url = '/club') {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(8000)
  const local: string[] = []
  page.on('pageerror', (e) => local.push(e.message))
  await seed(page, learner)
  await page.goto(BASE + url)
  await page.waitForTimeout(1500)

  // Walk the rail. On each card press every button and link that is on screen.
  for (let i = 0; i < 28; i++) {
    const before = local.length
    // Press the card's own call to action, if it has one.
    for (const sel of ['[data-testid=card-continue]', '[data-testid=card-cold]', '[data-testid=card-got]', '[data-testid=derived-done]', '[data-testid=legend-add]']) {
      const el = page.locator(sel).first()
      if (await el.count() && await el.isVisible().catch(() => false)) {
        await el.click({ timeout: 3000 }).catch(() => {})
        await page.waitForTimeout(450)
        if (await blank(page)) local.push('BLANK PAGE after clicking ' + sel + ' at card ' + i)
        // Come back to the club if the click navigated away.
        if (!page.url().includes('/club')) { await page.goto(BASE + url); await page.waitForTimeout(900) }
      }
    }
    if (local.length > before) console.log('  card ' + i + ': ' + local.slice(before).join(' | '))
    // Swipe up for the next card.
    await page.evaluate(() => {
      const rail = document.querySelector('[data-testid=feed]') ?? document.scrollingElement
      if (rail) (rail as HTMLElement).scrollBy({ top: (rail as HTMLElement).clientHeight, behavior: 'auto' })
    })
    await page.waitForTimeout(400)
  }

  if (local.length) { console.log('✗ ' + label); local.forEach((e) => console.log('    ' + e)); errors.push(...local.map((e) => label + ': ' + e)) }
  else console.log('✓ ' + label)
  await page.close()
}

const base = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  legend_prompt: 'accepted',
  chapter: 'lisbon',
  purpose: 'moving',
}
const rung6Root = ROOTS.find((r) => r.rung === 6)!
const releaseProof = (r = rung6Root) => [{ pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: '1' }]
const legendDone = LEGEND_CARD.map((f) => ({ frame_id: f.id, values: { x: 'y' }, said_cold: 0, at: '1' }))

// 1. The exact shape Sam described: a member who owns `es`.
await run('member owning es (rung 6)', {
  ...base,
  proof: releaseProof(),
  inventory: { es: { latest_state: 'HOLDING' }, engracado: { latest_state: 'HOLDING' } },
  roots_played: ['fl_f_engracado'],
  sections_completed: ['flirting_f2m'],
  legend: legendDone,
})

// 2. A brand new learner — the intro sequence.
await run('brand new learner', { ...base, proof: [], inventory: {}, roots_played: [], sections_completed: [], legend: [] })

// 3. A learner with the whole inventory.
await run('full inventory', {
  ...base,
  proof: releaseProof(),
  inventory: Object.fromEntries(Object.keys(PIECES).map((id) => [id, { latest_state: 'HOLDING' }])),
  roots_played: ROOTS.map((r) => r.root_id),
  sections_completed: [],
  legend: legendDone,
})

// 4. A learner mid-Legend, owning es.
await run('mid-legend owning es', {
  ...base,
  proof: releaseProof(),
  inventory: { es: { latest_state: 'HOLDING' } },
  roots_played: ['fl_f_engracado'],
  sections_completed: [],
  legend: [],
})

await browser.close()
console.log(errors.length ? '\n' + errors.length + ' PROBLEMS' : '\nno crash reproduced')
