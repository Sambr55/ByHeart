import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport:{width:390,height:844} })
await p.goto('http://localhost:3111/club-member'); await p.waitForTimeout(3000)
const cta = p.locator('[data-testid="club-welcome-cta"]'); if (await cta.count()) { await cta.click(); await p.waitForTimeout(1200) }
await p.goto('http://localhost:3111/profile'); await p.waitForTimeout(2500)
for (let i=0;i<8;i++){await p.locator('[data-testid="walk-next"]').click();await p.waitForTimeout(400)}
const btn = await p.evaluate(`(function(){
  var b = document.querySelector('[data-testid="walk-next"]');
  if (!b) return { err: 'no button' };
  var s = getComputedStyle(b);
  return { colour: s.color, bg: s.backgroundColor };
})()`)
console.log('raw result:', JSON.stringify(btn), 'typeof', typeof btn)
await b.close()
