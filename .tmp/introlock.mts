import { chromium } from 'playwright'
const BASE='http://localhost:3111'
const b=await chromium.launch()
const p=await b.newPage({viewport:{width:390,height:844}})
await p.goto(BASE+'/club',{waitUntil:'networkidle'})
await p.evaluate('localStorage.clear()')
await p.goto(BASE+'/club',{waitUntil:'networkidle'})
await p.waitForTimeout(800)
// Walk the intro to the setup card by swiping up repeatedly
const RAIL='[data-testid="card-rail"], .app-scroll'
for(let i=0;i<14;i++){
  const has=await p.evaluate(`!!document.querySelector('[data-testid="setup-go"], [data-testid="card-continue"]')`)
  const setup=await p.evaluate(`!!document.querySelector('[data-testid="choose-pair"], [data-testid="setup-go"]')`)
  if(setup) break
  await p.keyboard.press('PageDown').catch(()=>{})
  await p.waitForTimeout(250)
}
const state=await p.evaluate(`(()=>{
  const q=(s)=>document.querySelector(s);
  return {
    hasChoose: !!q('[data-testid="choose-pair"]'),
    hasContinue: !!q('[data-testid="card-continue"]'),
    hasSetupGo: !!q('[data-testid="setup-go"]'),
    bodyText: (document.body.innerText||'').slice(0,140)
  };
})()`)
console.log(JSON.stringify(state,null,1))
await b.close()
