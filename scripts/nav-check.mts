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
      if (r.bottom > top + 2 && r.top < top) out.push(text.slice(0, 40))
    }
    return out
  })
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

console.log('\nand not on a lesson\n')
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1000)
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForTimeout(1400)
ok(
  'a teaching beat has no bar',
  !(await page.$('[data-testid="bottom-nav"]')),
  'a held sequence must not offer three ways out',
)

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
