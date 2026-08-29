/**
 * Pressing something confirms it, and the browser's own guess is out of the way.
 *
 *   npm run tap
 *
 * Three claims, and none of them is "a sound played" — a headless browser has no speakers
 * and asserting on WebAudio internals would be testing the test. What can be measured is
 * whether the wiring is there and whether the things that make DUB feel like a web page
 * have actually been removed, which is the half that was silently wrong for months.
 */
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '\u2713' : '\u2717') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' \u2014 ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

console.log('\nthe browser is not doing the feedback for us\n')
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1500)

const style = (await page.evaluate(`(() => {
  const el = document.querySelector('.tap-target')
  if (!el) return null
  const s = getComputedStyle(el)
  return {
    highlight: s.webkitTapHighlightColor,
    callout: s.webkitTouchCallout,
    select: s.userSelect,
  }
})()`)) as { highlight: string; callout: string; select: string } | null

ok('there is something to press', Boolean(style))
if (style) {
  /*
    The grey box. Every mobile browser paints a translucent rectangle over whatever you
    tap, at its own timing and in nobody's palette, and it is the loudest "this is a
    website" signal there is.
  */
  ok(
    'no grey flash of the browser\u2019s own',
    /rgba\(0, 0, 0, 0\)|transparent/.test(style.highlight),
    style.highlight,
  )
  /*
    Read from the source, because no browser here can see it.

    Chromium does not implement -webkit-touch-callout and drops it at parse time, so it is
    absent from getComputedStyle AND from the CSSOM — two assertions failed on a rule that
    is present and correct before it was clear that the engine running the check simply
    cannot know about it. The property only does anything on WebKit, which is the engine
    DUB is installed on and the one engine this check will never run in.
    
    So it is asserted against the stylesheet on disk. A source check is weaker than a
    measurement and is worth having only when a measurement is impossible — it is here,
    and the alternative is dropping the claim entirely and letting somebody delete the line
    without anything noticing.
  */
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8')
  const block = css.slice(css.indexOf('.tap-target'), css.indexOf('.tap-target') + 400)
  ok(
    'holding a button does not offer to copy it',
    /-webkit-touch-callout:\s*none/.test(block),
    'declared on .tap-target; no engine here can compute it',
  )
  ok('and does not raise the selection loupe', /none/.test(style.select), style.select)
}

console.log('\nand the Portuguese is still selectable\n')
/*
  Deliberately NOT swept up in the above. The sentence is the one thing on screen somebody
  has a real reason to copy out, and a language app that will not let you take it with you
  is being tidy at the learner\u2019s expense.
*/
await page.goto(BASE + '/vocab')
await page.waitForTimeout(1400)
const pt = (await page.evaluate(`(() => {
  const el = document.querySelector('.pt')
  return el ? getComputedStyle(el).userSelect : null
})()`)) as string | null
ok('a learner can still copy a sentence', pt !== 'none', String(pt))

console.log('\nand the sound can be turned off\n')
await page.goto(BASE + '/profile')
await page.waitForTimeout(1500)
ok('the choice is on the screen that holds your things', Boolean(await page.$('[data-testid="sound-off"]')))
await page.click('[data-testid="sound-off"]')
await page.waitForTimeout(500)
const stored = (await page.evaluate(`localStorage.getItem('byheart.sound')`)) as string | null
ok('silent is remembered', stored === 'off', String(stored))
ok(
  'and the button says which it is',
  (await page.getAttribute('[data-testid="sound-off"]', 'aria-pressed')) === 'true',
)
await page.click('[data-testid="sound-on"]')
await page.waitForTimeout(400)
ok(
  'and it can be turned back on',
  ((await page.evaluate(`localStorage.getItem('byheart.sound')`)) as string) === 'on',
)

console.log('\nthe press itself\n')
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1400)
const pressed = (await page.evaluate(`(() => {
  const el = document.querySelector('.tap-target')
  if (!el) return null
  const before = getComputedStyle(el).transform
  return { before }
})()`)) as { before: string } | null
ok('a control has a press state to fall back on', Boolean(pressed))

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  \u2717 ' + p)
  process.exit(1)
}
console.log('\na press is confirmed by DUB, not by the browser')
