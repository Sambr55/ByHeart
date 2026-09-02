/**
 * The way in, walked — and it is a feed now, not a corridor.
 *
 *   npm run intro
 *
 * This used to walk five screens in a fixed order: welcome, how you get in, the demo, the
 * branches, where it goes, the language. Those screens are gone on purpose — see
 * docs/spec-club-first-run.md. They were an argument delivered to somebody who had not seen
 * a word of Portuguese and could not skip any of it.
 *
 * What has to survive the change is not the route, it is the CLAIMS. So this checks that
 * every promise the corridor used to make is still made somewhere a stranger will meet it,
 * and that the screens which remain — the ones that were never pitch, the deal and the
 * language pair — still put their button under the words that earned it.
 *
 * The reason it is still a separate check from firstrun: that one is about the shape of the
 * feed, this one is about the sentences. A restructure that keeps the shape and loses the
 * argument would pass firstrun and should not pass this.
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
const first = await page.$('[data-testid="landing-cta"]')
ok('the door opens', Boolean(first))
if (first) await first.click()
await page.waitForTimeout(2500)
ok(
  'and it opens the Club',
  new URL(page.url()).pathname === '/club',
  new URL(page.url()).pathname,
)

/*
  Every claim the corridor used to make, and where it lives now.

  A claim that has quietly stopped being made is the failure this exists to catch — it is
  the easiest thing in the world to lose while moving five screens into four cards, and the
  hardest to notice, because nothing breaks.
*/
console.log('\nthe claims, still made\n')
const feed = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
const CLAIMS: { name: string; says: RegExp }[] = [
  { name: 'you understand more than you can say', says: /already understand more than you can say/i },
  { name: 'the Legend is the way in', says: /Seven questions a stranger will ask you/i },
  { name: 'Lisbon is happening now', says: /as it is actually happening/i },
  { name: 'ask for anything', says: /sentence we have not taught you yet/i },
]
for (const c of CLAIMS) ok(c.name, c.says.test(feed), c.says.test(feed) ? '' : 'not said anywhere')

/*
  And the screens that were never pitch. The deal and the language pair are commitment, they
  survive the restructure, and they are now reached at the moment somebody has decided —
  which is where the button rule still has to hold.
*/
console.log('\nand the screens that remain\n')
await page.goto(BASE + '/vibes')
await page.waitForTimeout(2000)
for (let i = 0; i < 4; i++) {
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  if (!text) break
  await page.evaluate(
    `(() => { const s = document.scrollingElement || document.documentElement; s.scrollTop = s.scrollHeight })()`,
  )
  await page.waitForTimeout(350)
  const under = await gap(page)
  ok(
    'a button sits under the words   ' + text.slice(0, 30),
    under === null || under <= 96,
    under === null ? 'no button' : under + 'px below the last line',
  )
  const clear = await clearsNav(page)
  ok(
    '  and clears the bar',
    clear === null || clear >= 8,
    clear === null ? 'no bar' : clear + 'px',
  )

  /*
    On to whatever the CTA leads to next, so the deal and the pair are both measured rather
    than only the first of them.
  */
  const onward = await page.$('[data-testid="continue"]')
  if (!onward || !(await onward.isEnabled())) break
  await onward.click()
  await page.waitForTimeout(1200)
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery claim the corridor made is still made, and the screens that remain still put the button under the words')
