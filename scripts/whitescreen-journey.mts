/**
 * The hunt, inside a vibe.
 *
 * The Club feed and every piece screen came back clean, so the remaining place a CTA can
 * blow up is the vibe player — which is where "a word from Bond" actually lives. This
 * opens every crate and taps its way through every beat, watching for a throw and for the
 * screen going empty.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { CRATES, ROOTS, ROOTS_BY_FAMILY, entryRung } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const browser = await chromium.launch()
const found: string[] = []

const rung6 = ROOTS.find((r) => r.rung === 6)!
const learner = (extra: Record<string, unknown> = {}) => ({
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  legend_prompt: 'accepted',
  chapter: 'lisbon',
  purpose: 'moving',
  // A rung 6 learner, so nothing is locked.
  proof: [{ pt: rung6.transfer_prompt.answer, en: rung6.transfer_prompt.ask, source: 'release', clean: true, at: '1' }],
  legend: LEGEND_CARD.map((f) => ({ frame_id: f.id, values: { x: 'y' }, said_cold: 0, at: '1' })),
  inventory: {},
  roots_played: [],
  sections_completed: [],
  ...extra,
})

async function walk(crateId: string) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(6000)
  const local: string[] = []
  page.on('pageerror', (e) => local.push('THREW: ' + e.message))
  await page.goto(BASE + '/vibes')
  await page.evaluate(([k, pair, l]) => {
    localStorage.clear()
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(l))
  }, [KEY, DEFAULT_PAIR, learner()] as const)
  await page.goto(BASE + '/vibes?open=' + crateId)
  await page.waitForTimeout(1400)

  let lastText = ''
  for (let step = 0; step < 130; step++) {
    const text = await page.evaluate(() => document.body.innerText.trim())
    if (text.length < 20) { local.push('BLANK at step ' + step + ' (previous screen: ' + lastText.slice(0, 90).replace(/\n/g, ' / ') + ')'); break }
    lastText = text

    // Solve any tile build on screen so the CONTINUE appears.
    const tiles = page.locator('[data-testid^=tile-], [data-testid=build] button')
    // Press the primary call to action.
    const cta = page.locator('[data-testid=cta], button:has-text("CONTINUE"), button:has-text("WHAT DOES"), button:has-text("NOW THE OTHER"), button:has-text("PUT THEM BACK"), button:has-text("YOUR TURN")').first()
    if (await cta.count() && await cta.isVisible().catch(() => false)) {
      await cta.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(320)
      continue
    }
    // A build blocks the way: press every tile until it solves or we give up.
    const n = await tiles.count()
    if (n) { for (let t = 0; t < n; t++) await tiles.nth(t).click({ timeout: 1200 }).catch(() => {}); await page.waitForTimeout(350); continue }
    // Nothing obvious — press the first visible button that is not Back.
    const any = page.locator('button:visible').first()
    if (await any.count()) { await any.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300); continue }
    break
  }
  if (local.length) { console.log('✗ ' + crateId); local.forEach((e) => console.log('    ' + e)); found.push(crateId + ': ' + local.join(' | ')) }
  else console.log('✓ ' + crateId)
  await page.close()
}

for (const c of CRATES) {
  if (!(ROOTS_BY_FAMILY[c.id] ?? []).length) { console.log('- ' + c.id + ' (no roots)'); continue }
  await walk(c.id)
}

await browser.close()
console.log(found.length ? '\n' + found.length + ' PROBLEMS' : '\nno crash in any vibe')
