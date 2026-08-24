import { chromium } from 'playwright'
const b = await chromium.launch()
const CASES: [string, any][] = [
  ['legacy record, only proof', { version: 1, learner_id: 'l_old', inventory: {}, proof: [{ pt: 'Sete euros.', en: 'Seven euros.', source: 'release', clean: true, at: '2026-08-24T12:00:00.000Z' }] }],
  ['almost empty record', { version: 1 }],
  ['hand-mangled types', { version: 1, proof: 'nope', evidence: null, voice_signals: 0, inventory: [], profile: 'x', affinity: null }],
]
for (const [label, rec] of CASES) {
  const p = await b.newPage({ viewport: { width: 420, height: 900 } })
  const errs: string[] = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto('http://localhost:3111/?tester=r2', { waitUntil: 'networkidle' })
  await p.evaluate((r) => localStorage.setItem('byheart.learner.v1', JSON.stringify(r)), rec)
  await p.reload({ waitUntil: 'networkidle' })
  for (let i = 0; i < 6; i++) { await p.getByTestId('continue').click().catch(() => {}); await p.waitForTimeout(240) }
  await p.getByRole('button', { name: 'TOP GUN', exact: false }).first().click().catch(() => {})
  await p.getByTestId('continue').click().catch(() => {})
  for (let i = 0; i < 18 && !errs.length; i++) {
    const c = p.getByTestId('continue')
    if (!(await c.isVisible().catch(() => false))) break
    await c.click().catch(() => {}); await p.waitForTimeout(220)
  }
  console.log((errs.length ? 'FAIL  ' : 'ok    ') + label + (errs.length ? ' → ' + errs[0] : ''))
  await p.close()
}
await b.close()
