/**
 * Can you get anywhere, and does anything sit under the bar?
 *
 *   npm run nav
 *
 * The burger was eleven destinations behind a tap, ordered by nothing, and it had become
 * where things went when nothing else claimed them — Dub Club and the feedback form as
 * peers in a flat list. Four tabs replace it, which is a claim about what matters rather
 * than a way of saving space.
 *
 * Two things a bottom bar gets wrong and both are invisible in a screenshot: it covers
 * the last row of whatever is behind it, and it turns up on screens that are meant to be
 * a held sequence.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

type R = { root_id: string; transfer_prompt: { answer: string; ask: string } }
const basics = ((ROOTS_BY_FAMILY as Record<string, R[]>)['the_basics'] ?? []).slice(0, 3)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, ids, pt, en]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify({
      version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z',
      proof: [{ pt, en, source: 'release', clean: false, at: '1' }],
      inventory: {}, roots_played: ids, sections_completed: ['the_basics'],
      legend: [], saved: [], liked: [], finished_cards: [],
      club_welcomed_at: '2026-08-20T00:00:00.000Z',
    }))
  },
  [KEY, DEFAULT_PAIR, basics.map((r) => r.root_id), basics[0].transfer_prompt.answer, basics[0].transfer_prompt.ask] as const,
)

/**
 * Nothing may be UNREACHABLE under the bar.
 *
 * Not "nothing overlaps": a fixed bar covers whatever is passing behind it mid-scroll and
 * that is what fixed means. The failure is content you cannot get to — the last row of a
 * page, permanently tucked under the nav with nowhere further to scroll. So this scrolls
 * to the bottom first and looks there.
 */
async function covered(p: Page) {
  await p.evaluate(() => {
    const scroller = document.scrollingElement || document.documentElement
    scroller.scrollTop = scroller.scrollHeight
    for (const el of Array.from(document.querySelectorAll('main *'))) {
      const s = getComputedStyle(el)
      // Leave snap scrollers alone. The club feed loops, so "the bottom" is not a place,
      // and dragging it off its snap point parks the viewport across two cards and makes
      // every half-visible thing look like a fault.
      if (s.scrollSnapType !== 'none') continue
      if (s.overflowY === 'auto' || s.overflowY === 'scroll') (el as HTMLElement).scrollTop = el.scrollHeight
    }
  })
  await p.waitForTimeout(500)
  return p.evaluate(() => {
    const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement | null
    if (!nav) return null
    const top = nav.getBoundingClientRect().top
    const out: string[] = []
    for (const el of Array.from(document.querySelectorAll('main p, main h1, main h2, main a, main button'))) {
      if (el.closest('[data-testid="bottom-nav"]')) continue
      const r = el.getBoundingClientRect()
      const text = (el.textContent ?? '').trim()
      if (!text || r.height === 0) continue
      // Only what is on screen — and on screen means both axes. A card's reveal pane sits
      // one swipe to the right, off the side of the phone, sharing the vertical band with
      // everything under the bar; judged on height alone it reads as buried when in fact
      // nobody can see it at all.
      if (r.top > window.innerHeight || r.bottom < 0) continue
      if (r.left > window.innerWidth || r.right < 0) continue
      /*
        Nor is it on screen if its own region has scrolled past it.

        The page used to be a tall document scrolled by the body, so a rectangle in the
        band above the bar was a rectangle somebody could see. It is a fixed frame with an
        internal scroller now — and getBoundingClientRect knows nothing about clipping, so
        the two vibe tiles below the fold reported rectangles down in the bar and were
        called buried. They are not buried, they are further down, and scrolling reaches
        them. Same mistake the scroll check made, for the same reason.
      */
      let visTop = r.top
      let visBottom = r.bottom
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ov = getComputedStyle(p).overflowY
        if (!/(auto|scroll|hidden)/.test(ov)) continue
        const box = p.getBoundingClientRect()
        visTop = Math.max(visTop, box.top)
        visBottom = Math.min(visBottom, box.bottom)
      }
      /*
        Clamped, not merely skipped when wholly outside.

        A tile sitting across the scroller's bottom edge has one rectangle straddling it:
        the top half is drawn, the bottom half is not, and testing the whole of it put the
        undrawn half in the bar and called the tile buried. Intersecting with every clipping
        ancestor first means the test is against the pixels a person can actually see, which
        are the only ones that can be hidden by anything.
      */
      if (visBottom - visTop <= 0.5) continue
      if (visBottom > top + 2 && visTop < top) out.push(text.slice(0, 40))
    }
    return out
  })
}

console.log('\nthe bar is on every screen\n')
/*
  Not just the four tabs. A bar that comes and goes is not a permanent navigation, it is a
  footer that some pages happen to have — and the pages it was missing from were exactly
  the ones somebody lands on from the profile and then has to find their way back out of.
*/
for (const route of ['/proof', '/vocab', '/drops', '/pro', '/account', '/legend', '/feedback', '/signin']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(900)
  ok(route + ' has the bar', Boolean(await page.$('[data-testid="bottom-nav"]')))
  const under = await covered(page)
  ok(route + ' has nothing hiding under it', !under?.length, (under ?? []).slice(0, 2).join(' / '))
}

console.log('\nthe four tabs\n')
for (const [route, tab] of [['/vibes', 'vibes'], ['/club', 'lisbon'], ['/line', 'today'], ['/profile', 'yours']] as const) {
  await page.goto(BASE + route)
  await page.waitForTimeout(1200)
  const nav = await page.$('[data-testid="bottom-nav"]')
  ok(route + ' has the bar', Boolean(nav))
  const here = await page.$('[data-testid="tab-' + tab + '"][aria-current="page"]')
  ok(route + ' knows which tab it is', Boolean(here))
  const under = await covered(page)
  ok(route + ' has nothing hiding under it', !under?.length, (under ?? []).slice(0, 2).join(' / '))
  const box = await page.$eval('[data-testid="tab-' + tab + '"]', (el) => {
    const r = el.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height) }
  })
  ok(route + ' tab is thumb-sized', box.h >= 44 && box.w >= 44, box.w + '×' + box.h)
}

console.log('\nwhite on blue, and the current tab is the whitest thing on it\n')
await page.goto(BASE + '/club')
await page.waitForTimeout(1500)
/*
  As a string, not a closure.

  tsx compiles with esbuild, which rewrites nested function declarations to reference a
  `__name` helper that does not exist inside the page. Any evaluate body with a helper
  function in it throws on the browser side, and the failure names the helper rather than
  the cause.
*/
const paint = (await page.evaluate(`(() => {
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  const here = nav.querySelector('[aria-current="page"]')
  const other = Array.from(nav.querySelectorAll('a')).find((a) => !a.getAttribute('aria-current'))
  /*
    Two computed forms, and reading one as the other is how this check first passed for
    the wrong reason. A plain colour computes to rgb(31, 93, 140) with 0-255 channels;
    color-mix() computes to color(srgb 1 1 1 / 0.8) with 0-1 channels — read on the 255
    scale that white reads as very nearly black, so "the inactive tab is dimmer" was true
    of a number that had nothing to do with the screen.
  */
  const parse = (c) => {
    const n = (c.match(/[\\d.]+/g) || ['0','0','0']).map(Number)
    const srgb = c.indexOf('color(') === 0
    const rgb = srgb ? n.slice(0, 3).map((v) => v * 255) : n.slice(0, 3)
    const alpha = n.length > 3 ? n[3] : 1
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
    return { lum: 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]), alpha }
  }
  const bg = getComputedStyle(nav).backgroundColor
  const h = parse(getComputedStyle(here).color)
  const o = parse(getComputedStyle(other).color)
  return {
    bg,
    bgLum: parse(bg).lum,
    hereLum: h.lum,
    hereAlpha: h.alpha,
    otherLum: o.lum,
    otherAlpha: o.alpha,
  }
})()`)) as {
  bg: string
  bgLum: number
  hereLum: number
  hereAlpha: number
  otherLum: number
  otherAlpha: number
}

// A bar the same colour as the page is a footer. It has to be its own ground.
ok('the bar is a solid ground, not the page', paint.bgLum < 0.3, paint.bg)
ok('the current tab is white', paint.hereLum > 0.9, paint.hereLum.toFixed(2))
ok(
  'and reads clearly on it',
  (1.05) / (paint.bgLum + 0.05) >= 4.5,
  ((1.05) / (paint.bgLum + 0.05)).toFixed(2) + ':1',
)
/*
  Both tabs are white — on a saturated ground, here and not-here separate by opacity and
  weight rather than by a second hue that would need keeping in step across two themes.
*/
ok('the others are white too', paint.otherLum > 0.9, paint.otherLum.toFixed(2))
ok(
  'but not as solid',
  paint.otherAlpha < paint.hereAlpha,
  paint.otherAlpha.toFixed(2) + ' vs ' + paint.hereAlpha.toFixed(2),
)

console.log('\non the lesson beats too, anchored\n')
/*
  This used to assert the opposite, on the reasoning that a held sequence with three ways
  out is an invitation to leave. That argument is about a bar that comes and goes. Anchored
  and always present it is part of the device rather than an offer, and a bar that vanishes
  on the lesson tells somebody the app is holding them there.
*/
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1200)
// Tapping opens the picture; the swipe is what enters. Two steps now.
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-begin"]')
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(2400)
ok('a teaching beat has the bar', Boolean(await page.$('[data-testid="bottom-nav"]')))
const anchored = await page.evaluate(`(() => {
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  const r = nav.getBoundingClientRect()
  return { fixed: getComputedStyle(nav).position, gap: Math.round(window.innerHeight - r.bottom) }
})()`) as { fixed: string; gap: number }
ok('and it is anchored, not at the end of the page', anchored.fixed === 'fixed', anchored.fixed)
ok('flush with the bottom of the screen', Math.abs(anchored.gap) <= 1, String(anchored.gap))
const beatUnder = await covered(page)
ok('with the beat clear of it', !beatUnder?.length, (beatUnder ?? []).slice(0, 2).join(' / '))
/*
  And a real gap, not a hairline. The CTA and the bar are both the azulejo, so a button
  finishing two pixels above it reads as one blue mass with a line through the middle.
*/
const clearance = await page.evaluate(`(() => {
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  const cta = document.querySelector('[data-testid="continue"]')
  if (!cta) return null
  return Math.round(nav.getBoundingClientRect().top - cta.getBoundingClientRect().bottom)
})()`) as number | null
ok(
  'and a real band of ground under the CTA',
  clearance === null || clearance >= 16,
  clearance + 'px',
)

console.log('\nand the thing you press is the same colour everywhere\n')
/*
  The accent used to move with the stage: olive inside the basics, wine-red inside Bridget
  Jones, near-black on the release beat. Nobody learns "blue means go on" from a control
  that is a different colour on every screen.
*/
const AZULEJO = 'rgb(31, 93, 140)'
const beatCta = await page.evaluate(`(() => {
  const cta = document.querySelector('[data-testid="continue"]')
  const bar = document.querySelector('.bar')
  return {
    cta: cta ? getComputedStyle(cta).backgroundColor : null,
    bar: bar ? getComputedStyle(bar).backgroundColor : null,
    stage: (document.querySelector('[data-stage]') || {}).getAttribute
      ? document.querySelector('[data-stage]').getAttribute('data-stage')
      : null,
  }
})()`) as { cta: string | null; bar: string | null; stage: string | null }
ok('the lesson CTA is the azulejo', beatCta.cta === AZULEJO, beatCta.stage + ' → ' + beatCta.cta)
ok('and so is the header', beatCta.bar === AZULEJO, String(beatCta.bar))

console.log('\neverything the burger held is still reachable\n')
await page.goto(BASE + '/profile')
await page.waitForTimeout(1200)
const links = await page.$$eval('main a[href]', (els) => els.map((e) => e.getAttribute('href')))
for (const href of ['/proof', '/vocab', '/drops', '/pro', '/account', '/feedback', '/legend']) {
  ok(href + ' is on the profile', links.includes(href))
}

console.log('\nno room is a dead end\n')
/*
  The burger is gone, so every screen that is not one of the four tabs needs its own way
  out — and it has to be a real one. A page reachable from the profile with nothing but
  the browser's back button is a dead end on a phone opened from a home-screen icon.
*/
for (const route of ['/proof', '/vocab', '/drops', '/pro', '/account', '/legend', '/feedback']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(900)
  ok(route + ' has a way back', Boolean(await page.$('[data-testid="back"]')))
}

console.log('\nand the burger is really gone\n')
for (const route of ['/vibes', '/club', '/line', '/profile', '/proof', '/vocab', '/pro', '/account']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(900)
  ok(route + ' has no burger', !(await page.$('[data-testid="menu"]')))
}
// The theme switch lived in the burger and nowhere else, so retiring it silently took
// the dark theme offline.
await page.goto(BASE + '/profile')
await page.waitForTimeout(1200)
ok('the theme switch survived the burger', Boolean(await page.$('[data-testid="theme-dark"], [data-testid="theme"]')))

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nfour tabs, nothing underneath them, and nothing lost from the menu')
