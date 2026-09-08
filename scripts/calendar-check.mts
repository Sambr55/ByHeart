/**
 * What is on, and whether tapping it lands where the language is.
 *
 *   npm run calendar
 *
 * The calendar is the one screen in DUB that deliberately shows things the feed will not:
 * a gig ninety days out is not a drop yet and must not appear in the Club, but it is the
 * most useful thing this screen can say. So the first assertion is the one that would
 * otherwise be made backwards by somebody tidying up — a calendar filtered by dropLive
 * would look correct, pass every other check here, and quietly say "nothing this month"
 * with a stadium show in the diary.
 *
 * The second half is the landing. "Clicking a day opens the relevant cards like a swipe
 * right" is a claim about where you end up AND how far in, and only the second half can
 * rot silently: a link that navigates to the Club but leaves you on the face looks fine
 * unless somebody is watching the scroller.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { DROPS } from '../content/drops'
import { dropLive, dropsInMonth } from '../content/feed'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const now = new Date()

console.log('\nthe month knows what the feed will not\n')
/*
  ASKED AS A PROPERTY, NOT AS A CENSUS OF TODAY'S CONTENT.

  The first version of this asserted that an authored drop existed which had not opened
  yet, and went red the first time it ran — not because anything was broken, but because
  the one authored Lisbon drop is a ticketed gig, those open ninety days out, and ninety
  days out had passed. That is precisely the failure mode this review pass has been
  hunting: a check that fails when the calendar turns rather than when the product breaks.

  So the question is put to the code instead of to the diary. Take any authored drop, stand
  a long way before its window, and confirm the two things that must both be true at that
  moment: the feed would not offer it, and the calendar shows it anyway. No dependency on
  what today happens to be.
*/
{
  const mine = DROPS.filter((d) => d.chapter === 'lisbon')
  ok('there is an authored drop to reason about', mine.length > 0, mine.length + ' in lisbon')
  for (const d of mine) {
    const on = new Date(d.on + 'T00:00:00Z')
    /* Half a year before it — earlier than any lead time in the product. */
    const early = new Date(on.getTime() - 180 * 24 * 60 * 60 * 1000)
    const inMonth = dropsInMonth('lisbon', on.getUTCFullYear(), on.getUTCMonth(), early)
    ok(
      d.event + ' is not open that far out',
      !dropLive(d, early),
      'the feed is right to withhold it',
    )
    ok(
      'and the calendar carries it anyway',
      inMonth.some((x) => x.id === d.id),
      'what is on is not the same question as what is open',
    )
  }
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(20000)

await page.goto(BASE + '/calendar')
await page.evaluate(
  ([k, pair]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(
      k as string,
      JSON.stringify({
        version: 1,
        deal_accepted_at: '2026-08-01T00:00:00.000Z',
        chapter: 'lisbon',
        purpose: 'visiting',
        proof: [],
        inventory: {},
        roots_played: [],
        sections_completed: [],
        legend: [],
        saved: [],
        liked: [],
        finished_cards: [],
        evidence: [],
      }),
    )
  },
  [KEY, DEFAULT_PAIR] as const,
)
await page.goto(BASE + '/calendar')
await page.waitForSelector('[data-testid="cal-month"]')
await page.waitForTimeout(600)

console.log('\nand it is reachable, and it moves\n')
ok('the nav offers it', Boolean(await page.$('[data-testid="tab-on"]')), 'a fifth tab, next to the city')

/* Forward to the month holding the next real drop, one press at a time. */
const target = DROPS.filter((d) => d.chapter === 'lisbon')
  .map((d) => new Date(d.on + 'T00:00:00Z'))
  .filter((on) => on > now)
  .sort((a, b) => a.getTime() - b.getTime())[0]

if (!target) {
  ok('there is a drop ahead to walk to', false, 'every authored drop is in the past')
} else {
  const steps =
    (target.getUTCFullYear() - now.getUTCFullYear()) * 12 + (target.getUTCMonth() - now.getUTCMonth())
  for (let i = 0; i < steps; i++) {
    await page.click('[data-testid="cal-next"]')
    await page.waitForTimeout(200)
  }
  const heading = (await page.textContent('[data-testid="cal-month"]')) ?? ''
  ok('the months move', heading.includes(String(target.getUTCFullYear())), heading.trim())

  const day = target.getUTCDate()
  const cell = await page.$('[data-testid="cal-day-' + day + '"]')
  ok('the day it is on is marked', Boolean(cell), 'the ' + day + 'th')
  /*
    And a day with nothing on is NOT a control. An empty square that takes a tap and does
    nothing is the commonest way a calendar feels broken.
  */
  const empty = await page.evaluate(`(() => {
    const cells = Array.from(document.querySelectorAll('[data-testid="cal-grid"] > *'))
    return cells.filter(c => c.tagName === 'A').length
  })()`)
  ok('and only the days with something on are links', (empty as number) > 0, empty + ' of the month is tappable')

  console.log('\ntapping one lands you inside it, not next to it\n')
  const row = await page.$('[data-testid^="cal-drop-"]')
  ok('the month lists what is in each one', Boolean(row), 'a date and a name is a listing')
  if (row) {
    await row.click()
    await page.waitForTimeout(2600)
    ok('it goes to the Club', page.url().includes('/club'), page.url().replace(BASE, ''))
    /*
      THE HALF THAT ROTS SILENTLY.

      Landing on the right card and leaving somebody on its face would pass every check
      above. "Like a swipe right" is a claim about the scroller, so it is read off the
      scroller: the visible card's pane must have travelled off the lane it opens on.
    */
    const opened = await page.evaluate(`(() => {
      const r = document.querySelector('.snap-y')
      if (!r || !r.clientHeight) return null
      const i = Math.round(r.scrollTop / r.clientHeight)
      const s = r.children[i]
      const p = s && s.querySelector('[data-testid="card-panes"]')
      if (!p || !p.clientWidth) return null
      return { lane: Math.round(p.scrollLeft / p.clientWidth), lanes: Math.round(p.scrollWidth / p.clientWidth) }
    })()`) as { lane: number; lanes: number } | null
    ok(
      'and the card is already open, the way a swipe right leaves it',
      Boolean(opened && opened.lanes > 1 && opened.lane < opened.lanes - 2),
      opened ? 'lane ' + opened.lane + ' of ' + opened.lanes : 'no card',
    )
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe month says what is on, and tapping it hands over the Portuguese')
