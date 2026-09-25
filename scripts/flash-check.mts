/**
 * The first screen does not flash when it is swiped.
 *
 *   npm run flash
 *
 * Sam: "fix the flash that happens on both safari and pwa when the very first screen
 * (home) is swiped."
 *
 * WHAT THE FLASH WAS. The landing is exactly one viewport tall and carries `.on-dark`, so
 * html paints --ground-dark behind it. Nothing scrolls — but a page that cannot scroll can
 * still RUBBER-BAND, and pulling it revealed that flat dark tone under the photograph
 * before it snapped back. A dark band appearing and vanishing, on both surfaces.
 *
 * WHY IT SURVIVED A RULE THAT LOOKED LIKE THE FIX. `body { overscroll-behavior-y: none }`
 * had been in globals.css for a long time, and the viewport's scrolling element is
 * `documentElement`, not body — so the declaration sat on an element that never scrolls
 * the page while html's own value stayed `auto`. It read as covered and was not, which is
 * the whole reason this file exists: a rule on the wrong element is invisible in review
 * and obvious on a phone.
 *
 * SO BOTH HALVES ARE ASSERTED, because either one alone lets the band back:
 *
 *   the bounce is off ON THE SCROLLING ELEMENT — asked of whichever element that actually
 *      is, rather than of html by name, so this still holds if the app ever moves its
 *      scroller to body.
 *   the photograph covers the whole glass at every chrome height — installed (no chrome),
 *      Safari with the toolbar up, and Safari with it retracted. The hero hangs below the
 *      fold on purpose; if that ever stops reaching, the band comes back without the
 *      bounce having anything to do with it.
 */
import { chromium } from 'playwright'
import { ROOTS } from '../content/roots'
import { beatsFor } from '../engine/journey'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  The three heights this product is actually used at, measured on the devices rather than
  guessed — see the note in components/Journey.tsx:

    installed app   window 390x797 · no chrome, so svh = lvh = dvh
    Safari          window 390x699 with the toolbar up, 739 once it retracts
*/
const SURFACES: [string, number][] = [
  ['installed', 797],
  ['safari, toolbar up', 699],
  ['safari, toolbar away', 739],
]

/*
  AND THE OTHER THING A SWIPE MUST NOT DO, which is take the screen down.

  Sam's crash — "/VIBES · last press: continue · PUT THEM BACK TOGETHER" — was a step
  index outliving the root it was built from: beatsFor() walks root.extracts when a
  sitting starts, the beat looks the root up again on every render, and a deploy between
  those two moments left an index pointing past the end.

  Asserted as the PROPERTY that made it crash rather than by replaying it: every beat a
  root can produce must address a piece that root actually has. That holds today by
  construction and would stop holding the moment anything builds a queue from one root and
  renders it against another — which is the fault, stated in a form that can be checked.
*/
console.log('\nevery beat addresses a piece that exists\n')
{
  let checked = 0
  const bad: string[] = []
  for (const root of ROOTS) {
    for (const step of beatsFor(root)) {
      if (step.pieceIndex === undefined) continue
      checked += 1
      if (!root.extracts[step.pieceIndex]) {
        bad.push(root.root_id + ' ' + step.beat + ':' + step.pieceIndex)
      }
    }
  }
  ok('no beat points past its root', bad.length === 0, checked + ' checked' + (bad.length ? ' — ' + bad.slice(0, 3).join(', ') : ''))
}

const browser = await chromium.launch()

console.log('\nthe bounce is off where it counts\n')
{
  const page = await browser.newPage({ viewport: { width: 390, height: 699 } })
  /* ?door=1 so a record on the machine cannot redirect this away from the door. */
  await page.goto(BASE + '/?door=1')
  await page.waitForTimeout(2200)

  const m = (await page.evaluate(`(() => {
    const se = document.scrollingElement || document.documentElement
    return JSON.stringify({
      which: se === document.documentElement ? 'html' : 'body',
      onScroller: getComputedStyle(se).overscrollBehaviorY,
      onHtml: getComputedStyle(document.documentElement).overscrollBehaviorY,
      onBody: getComputedStyle(document.body).overscrollBehaviorY,
    })
  })()`)) as string
  const v = JSON.parse(m)

  /*
    ASKED OF THE SCROLLING ELEMENT, not of html by name. The bug was a correct-looking
    declaration on the element that does not scroll, so naming an element here would
    reproduce the original mistake inside its own check.
  */
  ok(
    'the scrolling element refuses to bounce',
    v.onScroller === 'none',
    v.which + ' is ' + v.onScroller,
  )
  /* And both, so it keeps holding whichever one the browser picks. */
  ok('html says none', v.onHtml === 'none', v.onHtml)
  ok('body says none', v.onBody === 'none', v.onBody)
  await page.close()
}

console.log('\nand there is nothing under the photograph to reveal\n')
for (const [label, height] of SURFACES) {
  const page = await browser.newPage({ viewport: { width: 390, height } })
  await page.goto(BASE + '/?door=1')
  await page.waitForTimeout(2000)

  const m = (await page.evaluate(`(() => {
    const img = document.querySelector('main img')
    const r = img ? img.getBoundingClientRect() : null
    return JSON.stringify({
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      top: r ? Math.round(r.top) : null,
      bottom: r ? Math.round(r.bottom) : null,
    })
  })()`)) as string
  const v = JSON.parse(m)

  ok(
    label + ': the hero covers the glass',
    v.top !== null && v.top <= 0 && v.bottom >= v.innerHeight,
    'image ' + v.top + '→' + v.bottom + ' for a ' + v.innerHeight + ' window',
  )
  /*
    AND THE DOOR IS ONE SCREEN. If it ever grows taller than the viewport this check's
    second half stops meaning anything — a page that genuinely scrolls reveals what is
    below it by scrolling, and no amount of overscroll-behavior helps.
  */
  ok(
    label + ': and the door does not scroll',
    v.scrollHeight <= v.innerHeight + 1,
    v.scrollHeight + ' vs ' + v.innerHeight,
  )
  await page.close()
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('the front door does not bounce, and no beat points past its root')
