/**
 * The same hunt, across every screen that can render a PIECE.
 *
 * The Club feed came back clean, so the white screen is somewhere a word is shown: the
 * library, the Line, the proof sheet, the profile. Every row is opened, every control on
 * an open row is pressed.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { PIECES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const browser = await chromium.launch()
const found: string[] = []

const rung6 = ROOTS.find((r) => r.rung === 6)!
const base = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  legend_prompt: 'accepted',
  chapter: 'lisbon',
  purpose: 'moving',
  proof: [{ pt: rung6.transfer_prompt.answer, en: rung6.transfer_prompt.ask, source: 'release', clean: true, at: '1' }],
  legend: LEGEND_CARD.map((f) => ({ frame_id: f.id, values: { x: 'y' }, said_cold: 0, at: '1' })),
  roots_played: ['fl_f_engracado'],
  sections_completed: [],
}

async function sweep(label: string, inventory: Record<string, unknown>, routes: string[]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(8000)
  const local: string[] = []
  page.on('pageerror', (e) => local.push('THREW: ' + e.message))
  await page.goto(BASE + '/club')
  await page.evaluate(([k, pair, l]) => {
    localStorage.clear()
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(l))
  }, [KEY, DEFAULT_PAIR, { ...base, inventory }] as const)

  for (const route of routes) {
    await page.goto(BASE + route)
    await page.waitForTimeout(1200)
    if ((await page.evaluate(() => document.body.innerText.trim().length)) < 20) local.push('BLANK on load: ' + route)
    // Press every button on the page, one at a time, re-reading the DOM each round.
    for (let round = 0; round < 30; round++) {
      const buttons = page.locator('button:visible')
      const n = await buttons.count()
      if (round >= n) break
      const b = buttons.nth(round)
      const name = (await b.getAttribute('data-testid')) ?? (await b.innerText().catch(() => '')).slice(0, 30)
      await b.click({ timeout: 2500 }).catch(() => {})
      await page.waitForTimeout(350)
      if ((await page.evaluate(() => document.body.innerText.trim().length)) < 20) local.push('BLANK after pressing "' + name + '" on ' + route)
      if (!page.url().includes(route.split('?')[0])) { await page.goto(BASE + route); await page.waitForTimeout(800) }
    }
  }
  if (local.length) { console.log('✗ ' + label); local.forEach((e) => console.log('   ' + e)); found.push(...local) }
  else console.log('✓ ' + label)
  await page.close()
}

const routes = ['/vocab', '/line', '/proof', '/profile', '/legend', '/drops', '/crates', '/vibes', '/ask', '/calendar', '/account']

await sweep('owns es only', { es: { latest_state: 'HOLDING' } }, routes)
await sweep('owns es, NEEDS ANOTHER LOOK', { es: { latest_state: 'NEEDS ANOTHER LOOK' } }, routes)
await sweep('owns everything', Object.fromEntries(Object.keys(PIECES).map((id) => [id, { latest_state: 'HOLDING' }])), routes)
await sweep('owns nothing', {}, routes)

await browser.close()
console.log(found.length ? '\n' + found.length + ' PROBLEMS' : '\nno crash')
