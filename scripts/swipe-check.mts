/**
 * The card follows the thumb.
 *
 *   npm run swipe
 *
 * Sam, with a Tinder screenshot: "you get a far more satisfying swipe left/right motion
 * where you see/feel a card being moved." Then, twice, on attempts that missed: "it's a
 * bit sluggish and gets stuck", and "there is no drag motion at all".
 *
 * WHAT THOSE TWO REPORTS WERE. The first two attempts tilted a lane INSIDE the horizontal
 * scroller. That lane is the thing the scroller translates, so a six-degree lean on
 * something already sliding 117px under a finger is invisible — measured, applied
 * correctly, and impossible to see. The card was never being dragged at all.
 *
 * The drag itself already existed, written for the five locked intro cards and gated off
 * everywhere else: `if (!locked) return` at the top of the pointer handlers. Ordinary
 * cards had no pointer handling, so the native scroller owned every gesture. Opening that
 * gate is the whole change.
 *
 * WHAT IS ASSERTED, and each is a way the feel could go without anything failing:
 *
 *   it moves with the finger.  The transform tracks the pointer one-to-one — not a
 *      threshold that snaps, which is what a scroller does and what this replaced.
 *   it leans.  Rotation proportional to distance, so a rectangle reads as a card.
 *   a short drag springs home.  The gesture stays cheap to start and abandon.
 *   a long drag throws it.  And the card is actually REJECTED, not merely animated —
 *      a version of this flew the card away without recording anything, because the
 *      existing done() keeps its reject inside `if (gate === 'away')` and gate is null
 *      off the intro cards.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
})
const page = await ctx.newPage()
await page.goto(BASE + '/')
await page.evaluate(
  ([k, pair]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(
      k as string,
      JSON.stringify({
        version: 1,
        deal_accepted_at: '2026-08-01T00:00:00.000Z',
        set_up_at: '2026-08-01T00:00:00.000Z',
        chapter: 'lisbon',
        purpose: 'visiting',
        profile: { goal: 'trip' },
        proof: [],
        inventory: {},
        roots_played: [],
        sections_completed: ['the_basics', 'top_gun'],
        club_welcomed_at: '2026-08-20T00:00:00.000Z',
      }),
    )
  },
  [KEY, DEFAULT_PAIR] as const,
)
await page.goto(BASE + '/club')
await page.waitForTimeout(2600)
for (let i = 0; i < 6; i++) {
  const cta = await page.$('[data-testid="club-welcome-cta"]')
  if (!cta) break
  await cta.click()
  await page.waitForTimeout(800)
}

/** The transform on whichever card is actually in view. */
const shown = async () =>
  (await page.evaluate(`(() => {
    const all = Array.from(document.querySelectorAll('[data-testid="card-panes"]'))
    const vis = all.find((e) => {
      const b = e.getBoundingClientRect()
      return b.top > -50 && b.top < 200
    })
    return vis ? vis.style.transform || '' : ''
  })()`)) as string

const px = (t: string) => {
  const m = t.match(/translate3d\((-?[\d.]+)px/)
  return m ? Number(m[1]) : 0
}
const deg = (t: string) => {
  const m = t.match(/rotate\((-?[\d.]+)deg\)/)
  return m ? Number(m[1]) : 0
}

console.log('\nat rest it carries nothing\n')
{
  /*
    Read once. Calling shown() twice — once for the condition, once for the detail —
    prints a second, later reading beside the first, so a passing line could show the
    detail of a state it did not test. Cosmetic until it is not.
  */
  const rest = await shown()
  ok('no transform', rest === '', rest === '' ? 'none' : rest)
}

console.log('\nit follows the finger\n')
{
  await page.mouse.move(320, 420)
  await page.mouse.down()
  await page.mouse.move(250, 424, { steps: 5 })
  await page.waitForTimeout(160)
  const near = await shown()
  await page.mouse.move(180, 428, { steps: 5 })
  await page.waitForTimeout(160)
  const far = await shown()

  ok('it moves at all', px(near) < -10, near || '(none)')
  /*
    ONE-TO-ONE, which is what separates a drag from a scroll. 70px of thumb is 70px of
    card, within a few pixels of pointer quantisation — a threshold that snapped would
    pass "it moves" and feel nothing like this.
  */
  ok('and by roughly what the thumb moved', Math.abs(px(near) + 70) < 12, String(px(near)))
  ok('further is further', px(far) < px(near), px(near) + ' → ' + px(far))
  ok('it leans as it goes', deg(near) < -1, near)
  ok('and leans further with it', deg(far) < deg(near), deg(near) + ' → ' + deg(far))
}

console.log('\na short drag springs home\n')
{
  await page.mouse.up()
  await page.waitForTimeout(700)
  const home = await shown()
  ok('the card comes back', home === '', home === '' ? 'cleared' : home)
}

console.log('\na long one throws it\n')
{
  const rejectedBefore = (await page.evaluate(`(() => {
    const k = Object.keys(localStorage).find((x) => x.indexOf('byheart.learner') === 0)
    return k ? (JSON.parse(localStorage.getItem(k)).rejected || []).length : 0
  })()`)) as number

  await page.mouse.move(340, 420)
  await page.mouse.down()
  await page.mouse.move(110, 426, { steps: 8 })
  await page.waitForTimeout(180)
  const held = await shown()
  ok('it is well out of place', px(held) < -180, held)
  await page.mouse.up()
  await page.waitForTimeout(1100)

  /*
    AND IT WAS ACTUALLY REJECTED. The animation is borrowed from done(), whose own reject
    is inside `if (gate === 'away')` — null off the intro cards — so a version of this
    flew the card away and recorded nothing. Animation without consequence is worse than
    neither, and nothing on screen would have said so.
  */
  const rejectedAfter = (await page.evaluate(`(() => {
    const k = Object.keys(localStorage).find((x) => x.indexOf('byheart.learner') === 0)
    return k ? (JSON.parse(localStorage.getItem(k)).rejected || []).length : 0
  })()`)) as number
  ok(
    'the card is sent to the back',
    rejectedAfter > rejectedBefore,
    rejectedBefore + ' → ' + rejectedAfter,
  )
  const after = await shown()
  ok('and the transform is cleared', after === '', after === '' ? 'cleared' : after)
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('the card follows the thumb, leans as it goes, and is thrown when you let go')
