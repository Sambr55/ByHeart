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
/*
  Three lanes: the language, the face, and away.

  Two was right while left meant "into this one". Left is reject now, so the language moved
  to the left of the face and an empty lane sits to its right for the card to be carried
  into. Exactly three — a fourth would mean a lane nobody named.
*/
ok('each card has exactly three lanes', pane.all === pane.w * 3, pane.all + ' / ' + pane.w * 3)

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

console.log('\nyours, on the profile\n')
/*
  The words came out of the feed because they read as the same kind of thing as a room —
  same shape, same rail, same full-bleed photograph — so the feed was two sorts of card
  competing to be understood. They are not lost; this is where they went.
*/
const prof = await browser.newPage({ viewport: { width: 390, height: 1200 } })
await prof.goto(BASE + '/profile')
await prof.evaluate(
  ([k, pair]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify({
      version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z', proof: [], inventory: {},
      roots_played: [], sections_completed: ['the_basics'],
      finished_cards: ['lisbon_farmacia'], saved: ['lisbon_cafe'], liked: [],
    }))
  },
  [KEY, DEFAULT_PAIR] as const,
)
await prof.goto(BASE + '/profile')
await prof.waitForTimeout(1200)

const feedText = await page.evaluate(() => (document.querySelector('main') as HTMLElement).innerText)
ok('no word cards in the feed', !/WORTH HAVING/.test(feedText))

const tiles = await prof.$$eval('[data-testid^="tile-"]', (els) =>
  els.map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.getAttribute('data-testid'), ratio: Number((r.width / r.height).toFixed(2)) }
  }),
)
console.log('  ' + tiles.length + ' tiles')
ok('the words are here instead', tiles.some((t) => t.id?.includes('vocab')))
ok('what you finished is here', tiles.some((t) => t.id === 'tile-lisbon_farmacia'))
ok('and what you saved', tiles.some((t) => t.id === 'tile-lisbon_cafe'))
ok('and the vibes you have been through', tiles.some((t) => t.id === 'tile-the_basics'))
ok(
  'every tile is three by four',
  tiles.every((t) => Math.abs(t.ratio - 0.75) < 0.02),
  [...new Set(tiles.map((t) => t.ratio))].join(', '),
)
/* Two across is the whole point of a grid: one across is a list wearing a grid's clothes. */
const cols = await prof.evaluate(() => {
  const g = document.querySelector('[data-testid^="tile-"]')?.parentElement as HTMLElement
  return getComputedStyle(g).gridTemplateColumns.split(' ').length
})
ok('two across', cols === 2, String(cols))

await prof.click('[data-testid="tile-lisbon_farmacia"]')
await prof.waitForTimeout(900)
const panes = await prof.evaluate(() => {
  const el = document.querySelector('[data-testid="card-panes"]') as HTMLElement
  return el ? { w: el.clientWidth, all: el.scrollWidth, at: el.scrollLeft } : null
})
/*
  THREE lanes now, and the card starts in the middle one.

  It was two — face then language — and swiping left was the reveal. Left is reject now, so
  the language moved to the left of the face and an away lane sits to the right of it. The
  starting position is the load-bearing part: a three-lane scroller opens at lane 0 unless
  told otherwise, which would show every card already answered.
*/
ok(
  'a card is three lanes wide',
  Boolean(panes && panes.all === panes.w * 3),
  panes ? panes.all + ' / ' + panes.w : 'no panes',
)
ok(
  'and opens on the middle one, the face',
  Boolean(panes && Math.abs(panes.at - panes.w) < 4),
  panes ? 'at ' + panes.at + ', face is ' + panes.w : '',
)
await prof.click('[data-testid="card-continue"]')
await prof.waitForTimeout(800)
const after = await prof.evaluate(() => (document.querySelector('[data-testid="card-panes"]') as HTMLElement).scrollLeft)
/*
  Entering goes LEFT now, toward lane 0. The old assertion was `after > 0`, which was true
  of the old direction and is true of the starting position too — it would pass on a button
  that did nothing at all.
*/
ok('and the button opens the language, which is now leftward', after === 0, 'scrolled to ' + after)
await prof.close()

console.log('\nreject sinks a card, and rewind brings it back\n')
/*
  The new verb, and the promise attached to it.

  Left used to open a card; it carries it away now. The thing worth asserting is not that
  the gesture fires — it is that NOTHING IS LOST when it does. The feed is thirty-five rooms
  and a reject that removed a card would let a bored thumb permanently shrink somebody's
  Club, so a rejected card sinks behind the others and comes back.

  Driven by scrolling the lane rather than by calling the handler, because settling on the
  away lane IS the gesture — a half-swipe that springs back must do nothing, and only a real
  scroll can prove that.
*/
{
  const titles = async () =>
    (await page.evaluate(
      `Array.from(document.querySelectorAll('.snap-y > section')).slice(1, -1)
        .map(s => (s.innerText || '').split(String.fromCharCode(10)).filter(Boolean)[1] || '')`,
    )) as string[]

  /*
    MEASURED ON THE RECORD AND THE COUNT, not on a title.

    The first version tracked a card by its heading and asked where it moved to. The Duran
    Duran drop contributes four cards that all carry the same header line, so indexOf found
    a different one and reported "0 → 0" on a reject that had worked perfectly.

    The two claims are simpler than a position anyway: the reject is RECORDED, and the feed
    is still the same length afterwards. Nothing lost is the promise; the ordering is
    covered by the code that builds it.
  */
  const rejects = async () =>
    (await page.evaluate(
      `(() => {
        try {
          const k = Object.keys(localStorage).find(k => k.startsWith('byheart.learner.v1'))
          return k ? (JSON.parse(localStorage.getItem(k) || '{}').rejected ?? []) : []
        } catch { return [] }
      })()`,
    )) as string[]

  const before = await titles()
  const wasRejected = await rejects()

  // A half-swipe: out toward away, then back. Nothing may happen.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    r.scrollTop = r.clientHeight * 2
  })()`)
  await page.waitForTimeout(700)
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    const s = r.children[2]
    const p = s.querySelector('[data-testid="card-panes"]')
    p.scrollLeft = p.clientWidth * 1.2
  })()`)
  await page.waitForTimeout(600)
  ok(
    'a half-swipe toward away does nothing',
    (await rejects()).length === wasRejected.length,
    'a gesture you can abandon is what makes it cheap',
  )

  // And all the way.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    const s = r.children[2]
    const p = s.querySelector('[data-testid="card-panes"]')
    p.scrollLeft = p.clientWidth * 2
  })()`)
  await page.waitForTimeout(1400)
  const now = await rejects()
  ok('settling on away rejects the card', now.length === wasRejected.length + 1, now.join(', '))
  const after = await titles()
  ok(
    'and nothing left the feed',
    after.length === before.length,
    after.length + ' cards, was ' + before.length + ' — reject sinks, it does not destroy',
  )

  const rewind = await page.$('[data-testid="feed-rewind"]')
  ok('rewind appears once there is something to bring back', Boolean(rewind))
  if (rewind) {
    await rewind.click()
    await page.waitForTimeout(1400)
    ok(
      'and it undoes the last one',
      (await rejects()).length === wasRejected.length,
      'one step, which is the one somebody wants',
    )
  }
}

console.log('\nthe loop comes round under a real swipe\n')
/*
  Under a programmatic instant scroll there is no snap animation to fight, which is how the
  old 90ms debounce passed a check while failing on a phone: it set scrollTop while the
  browser was still animating to the snap point, and the snap overruled it. Driven with the
  wheel here so the animation is real.
*/
{
  await page.goto(BASE + '/club')
  await page.waitForTimeout(2500)
  const n = await page.evaluate(`document.querySelectorAll('[data-testid="feed"] > section').length`) as number
  const seen: number[] = []
  for (let i = 0; i < n + 3; i++) {
    await page.mouse.move(195, 400)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(700)
    seen.push(
      (await page.evaluate(
        `(() => { const el = document.querySelector('[data-testid="feed"]'); return Math.round(el.scrollTop / el.clientHeight) })()`,
      )) as number,
    )
  }
  const stuck = seen.slice(-3).every((v) => v === seen[seen.length - 1])
  ok(
    'it wraps rather than stopping at the last card',
    !stuck,
    'indices: ' + seen.join(' '),
  )
}

console.log('\na card with no photograph still has a ground\n')
/*
  Drop rooms are authored the week they matter and will not always have a picture ready.
  An empty near-black rectangle reads as a broken image, which is worse than no image.
*/
{
  await page.goto(BASE + '/club?preview=drops')
  await page.waitForTimeout(2500)
  const painted = await page.evaluate(`(() => {
    /*
      Index 1, not 0. The loop renders [last, ...cards, first] so the two clones make the
      wrap seamless — which means the first element in the DOM is the LAST card.
    */
    const first = document.querySelectorAll('[data-testid="feed"] > section')[1]
    if (!first) return null
    return {
      photo: Boolean(first.querySelector('img')),
      pattern: Boolean(first.querySelector('.card-ground')),
      says: (first.textContent || '').trim().slice(0, 24),
    }
  })()`) as { photo: boolean; pattern: boolean; says: string } | null
  ok('the drop is first in the feed', painted?.says.startsWith('A DROP') === true, painted?.says ?? '')
  ok(
    'and it has something behind it',
    Boolean(painted && (painted.photo || painted.pattern)),
    painted?.photo ? 'a photograph' : 'the pattern',
  )
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nit loops, it reveals sideways, and it does not keep score')
