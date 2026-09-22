/**
 * The simulator tells the truth about the app.
 *
 *   npm run sim:truth
 *
 * engine/sim.ts exists so the learner journey can be mapped and audited in a second
 * instead of on a phone. That is only worth anything if it AGREES with the product — a
 * model that drifts is worse than no model, because it produces confident wrong answers
 * and this codebase has already shipped several of those.
 *
 * It delegates every decision to the real functions, so it cannot drift on logic. What it
 * CAN get wrong is the shape of a session, and it did on the first attempt: it assumed a
 * root counts as played when it is served. It does not — Journey.tsx records it at the
 * RELEASE beat, deliberately, so entering a vibe and leaving does not consume it. The
 * simulator said three roots played; the browser said none. This check is what found that.
 *
 * So one real session is walked in a real browser and compared against the prediction.
 * Slow, and worth it: it is the only thing standing between a useful tool and a confident
 * liar.
 */
import { chromium } from 'playwright'
/*
  THE SAME PORT EVERY OTHER BROWSER CHECK USES.

  This hardcoded 3210, which nothing in the repo serves — `npm run dev` takes 3111 and
  every sibling check reads BASE_URL with that default. So the one check standing between
  a useful simulator and a confident liar could not reach the app at all, and had never
  run. Same shape as the bug it exists to catch.
*/
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { newLearner, playSitting } from '../engine/sim'
import type { CultureFamily } from '../content/roots'
const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const sim = newLearner()
const s1 = playSitting(sim, 'the_basics' as CultureFamily)
console.log('SIM  roots:', s1.roots.map(r=>r.id).join(', '), '| pieces:', s1.after.pieces)

const b = await chromium.launch()
const p = await b.newPage({ viewport:{width:390,height:844} })
await p.goto(BASE + '/vibes',{waitUntil:'networkidle'})
await p.evaluate(()=>localStorage.clear())
await p.goto(BASE + '/vibes',{waitUntil:'networkidle'}); await p.waitForTimeout(1800)
if (await p.getByTestId('setup-why-curious').isVisible().catch(()=>false)) {
  await p.getByTestId('setup-why-curious').click(); await p.waitForTimeout(900)
  await p.getByTestId('setup-who').fill('Sam')
  await p.getByTestId('setup-commit').click(); await p.waitForTimeout(1800)
}
await p.getByTestId('vibe-the_basics').first().click(); await p.waitForTimeout(900)
await p.getByTestId('vibe-begin').click(); await p.waitForTimeout(1200)
/* Same loop shape the journey smoke test uses: wait for the control, then press it. */
for (let i=0;i<220;i++) {
  if (await p.getByTestId('im-done').isVisible().catch(()=>false)) break
  if (await p.getByTestId('tile-pool').isVisible().catch(()=>false)) {
    const ans = await p.getByTestId('tile-line').getAttribute('data-answer')
    for (const w of (ans??'').split(' ')) {
      const btn = p.getByTestId('tile-pool').getByRole('button',{name:w,exact:true}).first()
      if (await btn.isVisible().catch(()=>false)) await btn.click()
    }
    const c = p.getByRole('button',{name:'CHECK',exact:true})
    if (await c.isVisible().catch(()=>false)) await c.click()
    await p.waitForTimeout(500); continue
  }
  const cont = p.getByTestId('continue').first()
  if (await cont.isVisible({timeout:2500}).catch(()=>false)) { await cont.click(); await p.waitForTimeout(600); continue }
  for (const t of ['profile-m','profile-under25','profile-trip']) {
    const el = p.getByTestId(t)
    if (await el.isVisible().catch(()=>false)) { await el.click(); await p.waitForTimeout(600); break }
  }
}
const real = await p.evaluate((k)=>{const x=JSON.parse(localStorage.getItem(k)??'{}');return {roots:(x.roots_played??[]), pieces:Object.keys(x.inventory??{}).length}}, KEY)
console.log('REAL roots:', real.roots.join(', '), '| pieces:', real.pieces)
const sameRoots = JSON.stringify([...real.roots].sort()) === JSON.stringify(s1.roots.map((r) => r.id).sort())
const samePieces = real.pieces === s1.after.pieces
await b.close()

const problems: string[] = []
if (!sameRoots) {
  problems.push(
    'the simulator and the app disagree on what a first sitting serves — ' +
      `sim [${s1.roots.map((r) => r.id).join(', ')}] vs app [${real.roots.join(', ')}]`,
  )
}
if (!samePieces) {
  problems.push(`pieces after one sitting: sim ${s1.after.pieces}, app ${real.pieces}`)
}

if (problems.length) {
  for (const p of problems) console.log('  FAIL  ' + p)
  console.log(`\n${problems.length} error(s) — engine/sim.ts is lying about the product`)
  process.exit(1)
}
console.log('\nthe simulator agrees with the app')
