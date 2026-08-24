import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 420, height: 900 } })
const errs: string[] = []
p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:3111/?tester=repro', { waitUntil: 'networkidle' })
// Exactly the shape a tester who started before voice_signals existed would carry:
// right version, so no reset, but missing fields added since.
await p.evaluate(() => {
  localStorage.setItem('byheart.learner.v1', JSON.stringify({
    version: 1, learner_id: 'l_old', inventory: {},
    proof: [{ pt: 'Sete euros.', en: 'Seven euros.', source: 'release', clean: true, at: '2026-08-24T12:00:00.000Z' }],
  }))
})
await p.reload({ waitUntil: 'networkidle' })
for (let i = 0; i < 6; i++) { await p.getByTestId('continue').click().catch(() => {}); await p.waitForTimeout(260) }
await p.getByRole('button', { name: 'TOP GUN', exact: false }).first().click().catch(() => {})
await p.getByTestId('continue').click().catch(() => {})
for (let i = 0; i < 16 && !errs.length; i++) {
  const c = p.getByTestId('continue')
  if (!(await c.isVisible().catch(() => false))) break
  await c.click().catch(() => {}); await p.waitForTimeout(240)
}
console.log(errs.length ? 'REPRODUCED: ' + errs[0] : 'no error seen')
await b.close()
