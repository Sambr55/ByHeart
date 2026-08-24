import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } } as any)
await p.goto('http://localhost:3111/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1200)
const r = await p.evaluate(`(function () {
  function probe(stage) {
    var d = document.createElement('div');
    if (stage) d.setAttribute('data-stage', stage);
    d.innerHTML = '<button class="bg-accent text-accent-ink">x</button>';
    document.body.appendChild(d);
    var cs = getComputedStyle(d);
    var btn = getComputedStyle(d.firstElementChild);
    var out = {
      stage: stage || '(none)',
      tone: cs.getPropertyValue('--tone').trim(),
      accent: cs.getPropertyValue('--accent').trim(),
      btnBg: btn.backgroundColor,
      btnColor: btn.color
    };
    document.body.removeChild(d);
    return out;
  }
  return [probe(null), probe('LANDING'), probe('DEMO'), probe('ROOT'), probe('CHOICE'), probe('REAL WORLD')];
})()`) as any
for (const x of r) console.log(String(x.stage).padEnd(12), '--tone:' + (x.tone||'∅').padEnd(18), '--accent:' + (x.accent||'∅').padEnd(18), 'button bg:' + x.btnBg, ' text:' + x.btnColor)
await b.close()
