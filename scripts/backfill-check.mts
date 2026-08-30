/**
 * A derived card can be read, and finished.
 *
 *   npm run backfill
 *
 * Three faults on one screen, found on a phone and none of them visible in a diff.
 *
 * The reveal pane started 64px down to clear a header that floats over it — a header that
 * grew by a notch when the safe-area work landed, so on a real phone the wordmark sat on
 * top of the pane's first line and the eyebrow read as struck through.
 *
 * A collision's provenance was flattened into one line, in the Portuguese face, mixing two
 * languages and two vibes: "sim — The basics, in songs you know · três — The world of
 * wizardry". The best claim the product makes, rendered as though it had confused a song
 * with a wizard.
 *
 * And the pane had no action at all. You swiped left to see the answer and the only move
 * left was to swipe back, so a card could be read and never finished — it stayed in the
 * feed, and the feed stopped being something you could get to the end of.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const TOP = 47
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
  inventory: Object.fromEntries(ROOTS.flatMap((r) => r.extracts).map((e) => [e.id, {
    target_id: e.id, acquired_source: null, reinforced_sources: [], latest_state: 'strong', latest_recall_at: null,
  }])),
  roots_played: [], sections_completed: CRATES.filter((c) => !c.drop).slice(0, 4).map((c) => c.id),
  legend: [], saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)
await page.goto(BASE + '/club')
/* A notch, because the overlap only exists on a phone that has one. */
await page.addStyleTag({ content: ':root{--safe-top:' + TOP + 'px;--safe-bottom:34px}' })
await page.waitForTimeout(2000)

/** Scroll the feed until the visible card's face carries one of these eyebrows. */
async function findCard(p: Page, wanted: RegExp): Promise<boolean> {
  for (let i = 0; i < 14; i++) {
    const here = (await p.evaluate(`(() => {
      const rail = document.querySelector('.snap-y')
      if (!rail) return ''
      const mid = rail.scrollTop + rail.clientHeight / 2
      for (const sec of Array.from(rail.children)) {
        if (sec.offsetTop <= mid && sec.offsetTop + sec.offsetHeight > mid) return sec.innerText
      }
      return ''
    })()`)) as string
    if (wanted.test(here)) return true
    await p.evaluate(`(() => {
      const rail = document.querySelector('.snap-y')
      if (rail) rail.scrollTop += rail.clientHeight
    })()`)
    await p.waitForTimeout(700)
  }
  return false
}

console.log('\na collision, opened\n')
const found = await findCard(page, /YOU CAN SAY/)
ok('the feed has a collision in it', found)

if (found) {
  const swipe = await page.$('section:has-text("YOU CAN SAY") [data-testid="card-continue"]')
  if (swipe) {
    await swipe.click()
    await page.waitForTimeout(1400)
  }

  /*
    The pane's first line, measured against the chrome floating over it.

    Not "is there padding" — a padding can exist and be too small, which is exactly what
    happened. The question is whether the wordmark is on top of the words.
  */
  /*
    The pane on screen, not the first one in the list.

    Every card in the feed renders its own pane, so querySelector('.card-pane') returns the
    pane belonging to a card six screens up — which is how a gap came back as -5904px, a
    number that is not wrong so much as about something else entirely.
  */
  await page.evaluate(`
    window.__visiblePane = function () {
      for (const el of Array.from(document.querySelectorAll('.card-pane'))) {
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight - 40 && r.bottom > 40 && r.left < window.innerWidth - 40 && r.right > 40) return el
      }
      return null
    }
  `)

  const overlap = (await page.evaluate(`(() => {
    const pane = window.__visiblePane()
    if (!pane) return null
    const eyebrow = pane.querySelector('.eyebrow')
    const mark = document.querySelector('header svg, header a')
    if (!eyebrow || !mark) return null
    const e = eyebrow.getBoundingClientRect()
    const m = mark.getBoundingClientRect()
    return { gap: Math.round(e.top - m.bottom), eyebrowTop: Math.round(e.top), markBottom: Math.round(m.bottom) }
  })()`)) as { gap: number; eyebrowTop: number; markBottom: number } | null

  ok('the reveal pane is on screen', Boolean(overlap))
  if (overlap) {
    /*
      A real gap, not merely a positive number.

      Clearing the logo by four pixels satisfies "do these overlap" and still looks like a
      collision that stopped just in time. 12px is the smallest distance that reads as two
      unrelated things rather than one broken one.
    */
    ok(
      'the wordmark is not sitting on the first line',
      overlap.gap >= 12,
      overlap.gap + 'px between them',
    )
  }

  const rows = (await page.evaluate(`(() => {
    const pane = window.__visiblePane()
    const list = pane && pane.querySelector('ul')
    if (!list) return null
    return Array.from(list.children).map((li) => (li.innerText || '').replace(/\\s+/g, ' ').trim())
  })()`)) as string[] | null
  ok('the pieces are one row each', Boolean(rows && rows.length >= 2), (rows ?? []).join(' / '))
  ok(
    'and neither row is two languages run together',
    !(rows ?? []).some((r) => r.includes('—')),
    'an em-dash here means the old flattened line is back',
  )

  ok(
    'the answer can be heard',
    (await page.evaluate(`(() => {
      const pane = window.__visiblePane()
      return Boolean(pane && pane.querySelector('[data-testid="audio"]'))
    })()`)) as boolean,
  )

  const doneVisible = (await page.evaluate(`(() => {
    const pane = window.__visiblePane()
    return Boolean(pane && pane.querySelector('[data-testid="derived-done"]'))
  })()`)) as boolean
  ok('there is a way to finish it', doneVisible, 'a card you cannot finish never leaves the feed')
  if (doneVisible) {
    await page.evaluate(`window.__visiblePane().querySelector('[data-testid="derived-done"]').click()`)
    await page.waitForTimeout(800)
    const kept = (await page.evaluate(
      `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').finished_cards || []).length } catch { return 0 } })()`,
    )) as number
    ok('and finishing it marks the card spent', kept > 0, kept + ' finished')
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na derived card can be read, heard and finished')
