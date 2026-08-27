/**
 * Does the Club feed behave?
 *
 *   npm run feed
 *
 * Three things a feed has to get right and one it has to refuse.
 *
 * It must LOOP rather than end: swiping past the last card comes back to the first, and
 * the seam has to be invisible. It must reveal the language sideways without navigating
 * away. Every card must fill the screen. And it must never show a count on a like —
 * a product that has spent every other screen refusing to reward turning up cannot grow
 * a score on this one.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { ROOTS } from '../content/roots'
import { feedFor } from '../content/feed'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

const opener = ROOTS.find((r) => r.rung === 2) ?? ROOTS[0]
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, frames, pt, en]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify({
      version: 1,
      deal_accepted_at: '2026-08-01T00:00:00.000Z',
      proof: [{ pt, en, source: 'release', clean: true, at: '1' }],
      inventory: {}, roots_played: [], sections_completed: ['the_basics'],
      legend: (frames as string[]).map((id) => ({ frame_id: id, values: { x: 'y' }, said_cold: 0, at: '1' })),
      legend_prompt: 'accepted',
      club_welcomed_at: '2026-08-20T00:00:00.000Z',
    }))
  },
  [KEY, DEFAULT_PAIR, LEGEND_CARD.map((f) => f.id), opener.transfer_prompt.answer, opener.transfer_prompt.ask] as const,
)
await page.goto(BASE + '/club')
await page.waitForTimeout(1800)

const real = feedFor().length
const feed = await page.$('[data-testid="feed"]')
ok('the feed is there', Boolean(feed))

const metrics = async (p: Page) =>
  p.evaluate(() => {
    const el = document.querySelector('[data-testid="feed"]') as HTMLElement
    return { top: el.scrollTop, h: el.clientHeight, all: el.scrollHeight, kids: el.children.length }
  })

const m = await metrics(page)
console.log('\n  ' + real + ' cards, ' + m.kids + ' rendered, viewport ' + m.h + 'px\n')
ok('every card fills the screen', m.all === m.kids * m.h, m.all + ' / ' + m.kids * m.h)
ok(
  'the list is cloned at both ends so it can loop',
  m.kids === real + 2,
  m.kids + ' rendered for ' + real + ' cards',
)
ok('it opens on the first real card, not a clone', m.top === m.h, String(m.top))

/*
  The loop, exercised rather than inspected. Scroll to the trailing clone and check the
  position is silently moved back to the real first card — that swap IS the loop.
*/
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="feed"]') as HTMLElement
  el.scrollTop = el.scrollHeight - el.clientHeight
})
await page.waitForTimeout(500)
const looped = await metrics(page)
ok(
  'swiping past the end comes back to the beginning',
  looped.top === looped.h,
  'landed at ' + looped.top + ', expected ' + looped.h,
)

// And backwards, which is the half people forget.
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="feed"]') as HTMLElement
  el.scrollTop = 0
})
await page.waitForTimeout(500)
const back = await metrics(page)
ok(
  'and swiping back off the front reaches the end',
  back.top === real * back.h,
  'landed at ' + back.top + ', expected ' + real * back.h,
)

console.log('\n  sideways\n')
const pane = await page.evaluate(() => {
  const card = document.querySelector('[data-testid="feed"] section') as HTMLElement
  const scroller = card.querySelector('div') as HTMLElement
  return { w: scroller.clientWidth, all: scroller.scrollWidth }
})
ok('each card has exactly two panes', pane.all === pane.w * 2, pane.all + ' / ' + pane.w * 2)

console.log('\n  the rail\n')
for (const t of ['feed-like', 'feed-save', 'feed-share', 'feed-comment']) {
  const el = await page.$('[data-testid="' + t + '"]')
  const box = el ? await el.boundingBox() : null
  ok(t.replace('feed-', '') + ' is there and thumb-sized', Boolean(box && box.height >= 44 && box.width >= 44),
    box ? Math.round(box.width) + '×' + Math.round(box.height) : 'missing')
}

const text = await page.evaluate(() => (document.querySelector('main') as HTMLElement).innerText)
ok(
  'nothing on a card is counted',
  !/\b\d+\s*(likes?|saves?|shares?)\b/i.test(text),
  'a number next to a like turns the feed into something that wants feeding',
)

// A like is remembered, because a save that forgets is worse than no save.
await page.click('[data-testid="feed-like"]')
await page.waitForTimeout(400)
const liked = await page.evaluate((k) => {
  const s = JSON.parse(localStorage.getItem(k as string) || '{}')
  return (s.liked ?? []).length
}, KEY)
ok('a like is written down', liked === 1, String(liked))

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nit loops, it reveals sideways, and it does not keep score')
