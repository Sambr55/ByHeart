import { chromium } from 'playwright'
const SHOTS = '/private/tmp/claude-501/-Users-admin-Projects-ByHeart/f38f3764-20a5-4c4a-947b-e7760b50eb80/scratchpad/shots/'
const b = await chromium.launch()

// 1. reduced motion, full completion
const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, reducedMotion:'reduce' })
const p = await ctx.newPage()
await p.goto('http://localhost:3111/club-member'); await p.waitForTimeout(3000)
const cta = p.locator('[data-testid="club-welcome-cta"]'); if (await cta.count()) { await cta.click(); await p.waitForTimeout(1200) }
await p.goto('http://localhost:3111/profile'); await p.waitForTimeout(2500)
let n = 0
while (await p.locator('[data-testid="walk-next"]').count()) {
  n++
  if (n === 1 || n === 5) await p.screenshot({ path: SHOTS + 'rm' + n + '.png' })
  const hole = await p.evaluate(`(function(){var c=document.querySelector('circle[data-testid="walk-hole"]');return c?Math.round(c.getAttribute('cx'))+','+Math.round(c.getAttribute('cy')):'none';})()`)
  console.log('reduced-motion step', n, hole)
  await p.locator('[data-testid="walk-next"]').click(); await p.waitForTimeout(400)
  if (n > 12) break
}
console.log('reduced-motion completed', n, 'steps; url', p.url())

// 2. once ever: go back to profile, walk must not reappear
await p.goto('http://localhost:3111/profile'); await p.waitForTimeout(2000)
console.log('walk on second visit:', await p.locator('[data-testid="walkthrough"]').count(), '(expect 0)')
const stamp = await p.evaluate(`(function(){for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('byheart.learner')===0){return JSON.parse(localStorage.getItem(k)).club_walked_at;}}return 'no record';})()`)
console.log('club_walked_at:', stamp)

// 3. deliberate route
await p.goto('http://localhost:3111/walkthrough'); await p.waitForTimeout(2500)
console.log('after /walkthrough url:', p.url(), 'walk present:', await p.locator('[data-testid="walkthrough"]').count(), '(expect 1)')
await p.screenshot({ path: SHOTS + 'route.png' })
await b.close()
