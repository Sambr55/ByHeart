import { chromium, type Locator } from 'playwright'
const press = async (l: Locator) => {
  await l.waitFor({ state: 'visible' })
  await l.evaluate((el) => { el.scrollIntoView({ block: 'center' }); (el as HTMLElement).click() })
}
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await p.evaluate(() => localStorage.clear())
await p.reload({ waitUntil: 'networkidle' })

for (let i = 0; i < 80; i++) {
  const txt = await p.locator('body').innerText()
  if (/two ways to say it/i.test(txt)) break
  if (/select an area/i.test(txt)) {
    await press(p.getByRole('button', { name: /Bridget Jones/i }).first())
    await p.waitForTimeout(200)
    const go = p.getByTestId('continue').first()
    await press((await go.count()) ? go : p.locator('button:visible').last())
    await p.waitForTimeout(200); continue
  }
  const pool = p.locator('[data-answer]').first()
  if (await pool.count()) {
    const answer = (await pool.getAttribute('data-answer')) ?? ''
    for (const w of answer.split(' ')) {
      const t = p.getByRole('button', { name: w, exact: true }).first()
      if (await t.count()) await press(t)
    }
  }
  const check = p.getByRole('button', { name: 'CHECK', exact: true }).first()
  if (await check.count()) { await press(check); await p.waitForTimeout(250) }
  const opt = p.locator('button[aria-pressed]').first()
  if (await opt.count()) await press(opt)
  const cta = p.getByTestId('continue').first()
  if (await cta.count()) await press(cta)
  else {
    const last = p.locator('button:visible').last()
    if (await last.count()) await press(last)
  }
  await p.waitForTimeout(160)
}
const t = await p.locator('body').innerText()
if (!/two ways to say it/i.test(t)) { console.log('NOT REACHED:\n' + t.slice(0, 500)); await b.close(); process.exit(1) }
await p.screenshot({ path: '.screenshots/voice-ask.png', fullPage: true })
await press(p.locator('button[aria-pressed]').first())
await p.waitForTimeout(450)
await p.screenshot({ path: '.screenshots/voice-rule.png', fullPage: true })
console.log('captured')
await b.close()
