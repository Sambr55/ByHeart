/**
 * The way in, walked.
 *
 *   npm run intro
 *
 * The intro is four screens and a demo before anybody has state, which is exactly why the
 * other gates miss it: every one of them seeds a learner with the deal already accepted so
 * it can get at the thing it is really testing. So the first thing a new person sees was
 * the least checked part of the product.
 *
 * It checks the route, and it checks the rule that a button sits under the last thing said
 * rather than at the foot of the screen — which is where the demo's CTA was hiding, three
 * hundred pixels below the last card and hard against the bottom bar.
 */
import { chromium, type Page } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** How far the button floats below the last line of text on the screen. */
async function gap(p: Page): Promise<number | null> {
  return p.evaluate(`(() => {
    const cta = document.querySelector('[data-testid="continue"]')
    if (!cta) return null
    /*
      Measured from everything BEFORE the button in its own column, not from the last
      sentence — because the demo deliberately reserves an empty 9rem box for the
      translation that is about to animate in. Without the reserve the line would jump when
      it appears; with it, a text-only measurement reads the reserve as float.

      What this still catches is a button that has been pushed away from its content by a
      spacer or a justify-center, which is the actual fault.
    */
    const siblings = Array.from(cta.parentElement ? cta.parentElement.children : [])
    let last = null
    for (const el of siblings) {
      if (el === cta || el.contains(cta)) break
      const r = el.getBoundingClientRect()
      if (!r.height) continue
      if (last === null || r.bottom > last) last = r.bottom
    }
    if (last === null) return null
    return Math.round(cta.getBoundingClientRect().top - last)
  })()`) as Promise<number | null>
}

/** Does the button end up under the bar? Two blues touching is the visible version. */
async function clearsNav(p: Page): Promise<number | null> {
  return p.evaluate(`(() => {
    const cta = document.querySelector('[data-testid="continue"]')
    const nav = document.querySelector('[data-testid="bottom-nav"]')
    if (!cta || !nav) return null
    return Math.round(nav.getBoundingClientRect().top - cta.getBoundingClientRect().bottom)
  })()`) as Promise<number | null>
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

await page.goto(BASE + '/')
await page.waitForTimeout(2200)

console.log('\nthe way in\n')
const first = await page.$('main a, main button')
ok('the door opens', Boolean(first))
if (first) await first.click()
await page.waitForTimeout(1500)

/*
  Named in the order they come, so a reordering shows up here as a wrong name rather than
  as a silent pass. Each entry is a phrase that must be on that screen and nowhere else.
*/
const ROUTE: { name: string; says: RegExp }[] = [
  { name: 'welcome', says: /Welcome to the Dub Club/i },
  { name: 'how you get in', says: /get through the door/i },
  { name: 'the demo', says: /already understand more than you can say/i },
  { name: 'the branches', says: /One line\. Three things you can say/i },
  { name: 'where it goes', says: /then your Legend, then the door/i },
  { name: 'the language', says: /Where do you want DUB to take you/i },
]

for (const step of ROUTE) {
  // The demo reveals in place, so walk forward until the screen says what it should.
  let text = ''
  for (let i = 0; i < 4; i++) {
    text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
    if (step.says.test(text)) break
    const next = await page.$('[data-testid="continue"]')
    if (!next || !(await next.isEnabled())) break
    await next.click()
    await page.waitForTimeout(1100)
  }
  ok(step.name, step.says.test(text), text.slice(0, 46))

  /*
    Scrolled to first, because a tall screen scrolls and a button below the fold is not
    overlapping anything — it is waiting. What `nav-clear` promises is that once you HAVE
    scrolled to it, the bar is not sitting on top of it, and that is what gets measured.
  */
  // To the bottom of the document, not scrollIntoView — which aligns to the viewport edge
  // and therefore parks the button under the bar by exactly the bar's height, every time.
  await page.evaluate(
    `(() => { const s = document.scrollingElement || document.documentElement; s.scrollTop = s.scrollHeight })()`,
  )
  await page.waitForTimeout(350)

  const under = await gap(page)
  ok(
    '  its button sits under the words',
    under === null || under <= 96,
    under === null ? 'no button' : under + 'px below the last line',
  )
  const clear = await clearsNav(page)
  ok(
    '  and clears the bar',
    clear === null || clear >= 8,
    clear === null ? 'no bar' : clear + 'px',
  )

  const next = await page.$('[data-testid="continue"]')
  // The language screen keeps its button disabled until something is picked, which is
  // right and is not this check's business — it is the last screen either way.
  if (next && (await next.isEnabled())) {
    await next.click()
    await page.waitForTimeout(1200)
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nfour screens and a demo, each with its button under the words')
