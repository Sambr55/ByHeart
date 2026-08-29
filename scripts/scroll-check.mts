/**
 * Nothing scrolls behind the thing you press.
 *
 *   npm run scroll
 *
 * The dock used to be the last element in the content column, sticky, so a screen taller
 * than the phone scrolled its own words up behind it — on the session summary, the screen
 * with the most to read, three lines of what you had just done slid under an opaque button
 * and stayed there.
 *
 * Sticky, fixed and a deeper bottom padding all fail this the same way, because they are
 * all answers to "where does the button sit" and the question is "what is allowed to
 * scroll". So the assertion is about overlap rather than position: at every scroll offset
 * the region can reach, no text may share a pixel with the dock.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const opener = ROOTS.find((r) => r.rung === 1)!
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
  inventory: Object.fromEntries(ROOTS.flatMap((r) => r.extracts).map((e) => [e.id, {
    target_id: e.id, acquired_source: null, reinforced_sources: [], latest_state: 'strong', latest_recall_at: null,
  }])),
  roots_played: ROOTS.slice(0, 3).map((r) => r.root_id),
  sections_completed: CRATES.filter((c) => !c.drop).slice(0, 4).map((c) => c.id),
  legend: [], saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
}

/**
 * Anything readable sharing pixels with the dock, at every offset the page can reach.
 *
 * Driven from inside the browser so the scrolling and the measuring happen in the same
 * frame — stepping from Node would measure a position the page had already left.
 */
async function behind(p: Page) {
  return p.evaluate(`(async () => {
    const dock = document.querySelector('[data-testid="dock"]')
    if (!dock) return { none: true, hits: [] }

    // Whatever actually scrolls on this screen: the region, or the document.
    let scroller = dock.parentElement
    while (scroller && scroller !== document.body) {
      const s = getComputedStyle(scroller)
      if (/(auto|scroll)/.test(s.overflowY) && scroller.scrollHeight > scroller.clientHeight) break
      scroller = scroller.parentElement
    }
    const region = document.querySelector('.app-scroll')
    const target = (region && region.scrollHeight > region.clientHeight) ? region
      : (scroller && scroller !== document.body ? scroller : document.scrollingElement)

    const hits = []
    const room = target.scrollHeight - target.clientHeight
    const stops = room > 0 ? [0, room * 0.25, room * 0.5, room * 0.75, room] : [0]

    for (const at of stops) {
      target.scrollTop = at
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const d = dock.getBoundingClientRect()
      if (!d.height) continue
      /*
        What the scrolling region actually shows.

        getClientRects does not know about clipping: a line scrolled out of the bottom of an
        overflow:auto region still reports a rectangle down where it would have been, which
        is exactly where the dock is. So the first version of this check reported four
        overlaps on a screen whose dock sits BELOW its scroller and cannot be reached by
        anything — the layout was right and the measurement was describing invisible text.

        Anything inside the region is only real where the region is.
      */
      const clip = target === document.scrollingElement ? null : target.getBoundingClientRect()
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const text = (n.textContent || '').trim()
        if (!text) continue
        if (dock.contains(n)) continue
        // The bar below is chrome, and is allowed to be near it.
        if (n.parentElement && n.parentElement.closest('[data-testid="bottom-nav"]')) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        const clipped = clip && target.contains(n)
        for (const raw of Array.from(range.getClientRects())) {
          if (!raw.width || !raw.height) continue
          /*
            Clamped to what the region actually shows, not merely dropped if it is outside.

            A line sitting exactly on the region's bottom edge — half visible, half clipped
            — has one rectangle that straddles the boundary, and testing the whole of it
            reported an overlap with a dock that begins where the clipping ends. Which is
            to say: the pixels it complained about are not drawn. Intersecting first means
            the test is against what a person can see, which is the only thing that can be
            behind anything.
          */
          const r = clipped
            ? {
                top: Math.max(raw.top, clip.top),
                bottom: Math.min(raw.bottom, clip.bottom),
                left: raw.left,
                right: raw.right,
                get width() { return this.right - this.left },
                get height() { return this.bottom - this.top },
              }
            : raw
          if (r.height <= 0.5 || r.width <= 0) continue
          const over = r.bottom > d.top + 1 && r.top < d.bottom - 1 && r.right > d.left + 1 && r.left < d.right - 1
          if (over && hits.length < 4) {
            /*
              Say WHERE it came from, not just what it said.

              A bare list of overlapping words leaves you guessing whether the container
              scrolled, is fixed, is a second dock, or is simply taller than the room it
              was given — four different faults with four different fixes.
            */
            const host = n.parentElement
            const how = host ? getComputedStyle(host).position : '?'
            hits.push(text.slice(0, 20) + ' [' + how + ' in ' + (host?.closest('[data-testid]')?.getAttribute('data-testid') ?? host?.tagName?.toLowerCase() ?? '?') + '] @' + Math.round(at))
          }
        }
      }
    }
    target.scrollTop = 0
    return { none: false, hits, room: Math.round(room) }
  })()`) as Promise<{ none: boolean; hits: string[]; room?: number }>
}

const browser = await chromium.launch()
/*
  A short phone, on purpose.

  On a tall screen most of these fit and nothing scrolls, so a check run there asserts
  "nothing went behind the button" about screens where nothing moved. 390x600 is roughly an
  SE with the text size turned up — a real device, and the one where the fault is visible.
*/
const page = await browser.newPage({ viewport: { width: 390, height: 600 } })
page.setDefaultTimeout(15000)
await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)

console.log('\nthe standing screens, at every offset they reach\n')
for (const route of ['/line', '/club', '/legend', '/reset', '/nothing-is-here', '/proof', '/feedback']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(1200)
  const r = await behind(page)
  if (r.none) {
    console.log('  · ' + route + ' has no dock')
    continue
  }
  ok(route, r.hits.length === 0, r.hits.join(', ') || r.room + 'px of scroll, nothing behind it')
  const inside = await outside(page)
  ok(route + ' keeps its dock out of the scroller', inside.length === 0, inside.join(', '))
}

/*
  The invariant, rather than one screen at a time.

  Several docks only exist once you are inside something — a card being answered, the door
  to a Club you are not in yet, a reset waiting for confirmation — and driving a browser
  into each of those states proves three screens while leaving the next one somebody adds
  unprotected. The property that actually guarantees the behaviour is structural: a dock
  must not be INSIDE the region that scrolls. Nothing can pass behind a control that is not
  over anything, on any screen, in any state, including ones not written yet.

  Checked everywhere a dock is found, alongside the overlap measurements above, because the
  two answer different questions — this one is "can this ever happen", those are "did it".
*/
async function outside(p: Page) {
  return p.evaluate(`(() => {
    const out = []
    for (const dock of Array.from(document.querySelectorAll('[data-testid="dock"]'))) {
      const scroller = dock.closest('.app-scroll')
      if (scroller) out.push((dock.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24))
    }
    return out
  })()`) as Promise<string[]>
}

console.log('\nand the summary, which is where this was found\n')
/*
  Re-seeded, because the screens above are not read-only.

  This walk shares a browser with the routes checked before it, and several of them write
  — a Legend card answered, a reset page visited. Starting a thirty-beat walk from whatever
  those left behind is how a check ends up measuring a screen nobody meant to test and
  reporting the result under the name of one they did.
*/
await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1400)
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-begin"]')
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(1800)
for (let i = 0; i < 90; i++) {
  const summary = await page.$('[data-testid="another-vibe"], [data-testid="im-done"]')
  if (summary) break
  const pool = await page.$('[data-testid="tile-pool"]')
  if (pool) {
    const answer = ((await page.getAttribute('[data-testid="tile-line"]', 'data-answer')) ?? '')
      .split(/\s+/).filter(Boolean)
    for (const word of answer) {
      const tile = await page.$('[data-testid="tile-pool"] button:has-text("' + word.replace(/"/g, '') + '")')
      if (tile) { await tile.click(); await page.waitForTimeout(80) }
    }
    await page.waitForTimeout(1000)
  }
  const next = await page.$('[data-testid="continue"]')
  if (next && (await next.isEnabled())) {
    await next.click()
    await page.waitForTimeout(900)
    continue
  }
  /*
    Not every beat's way forward is called continue.

    The walk used to stop at the first screen whose primary control had another name — the
    osmosis opener, the voice choice — and then report that the summary "was not reached",
    which reads as a broken product rather than a walk that gave up. The dock is where the
    way forward is, on every screen, so the first thing in it is the thing to press.
  */
  const anyDock = await page.$('[data-testid="dock"] button:not([disabled]), [data-testid="dock"] a')
  if (anyDock) {
    await anyDock.click()
    await page.waitForTimeout(900)
    continue
  }
  /*
    Some screens ask before they let you past.

    The one-question profile beat — "are you speaking as a man or a woman" — has no enabled
    way forward until something is chosen, so the walk sat on it and then reported that the
    summary "was not reached", which reads as a broken product rather than a walk that did
    not know how to answer. Picking the first option is enough: the question is not what is
    being tested here.
  */
  const choice = await page.$('main button:not([disabled])')
  if (!choice) break
  await choice.click()
  await page.waitForTimeout(900)
}
const onSummary = Boolean(await page.$('[data-testid="another-vibe"], [data-testid="im-done"]'))
ok('the summary was reached', onSummary)
if (onSummary) {
  // Named, so a failure says which screen was under the measurement.
  const where = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ').slice(0, 40)
  console.log('    measuring: ' + where)
  const inSummary = await outside(page)
  ok(
    'the summary keeps its dock out of the scroller',
    inSummary.length === 0,
    inSummary.join(', ') || 'structurally impossible for anything to be behind it',
  )
  const r = await behind(page)
  ok(
    'nothing from the summary goes behind its buttons',
    r.hits.length === 0,
    r.hits.join(', ') || (r.room ?? 0) + 'px of scroll, nothing behind it',
  )
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' screen(s) scrolling behind a control\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nnothing scrolls behind the thing you press')
