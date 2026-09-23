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
import { dropLive, dropsInFortnight, dropsInMonth } from '../content/feed'

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
        /*
          Welcomed, because the calendar is behind the Club door now.

          /calendar rendered a month of a city to a device that had been reset four seconds
          earlier, so it is gated on the Legend with the Club and ASK. This file is about
          what the calendar SHOWS, not about who may see it — the door has its own check —
          so it seeds somebody who is through it. `club_welcomed_at` is the one clubOpen
          honours outright, which keeps this seed short and says plainly why it is here.
        */
        club_welcomed_at: '2026-08-20T00:00:00.000Z',
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
  /*
    IN FORTNIGHTS NOW, because the view is two weeks rather than a month.

    The grid is anchored to the Monday of the current fortnight — see the note in
    Calendar.tsx — so walking to a target is (days between the two Mondays) / 14 rather
    than a difference of months.
  */
  const mondayOf = (d: Date) => {
    const mid = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    return mid - ((new Date(mid).getUTCDay() + 6) % 7) * 86_400_000
  }
  const steps = Math.round((mondayOf(target) - mondayOf(now)) / (14 * 86_400_000))
  for (let i = 0; i < steps; i++) {
    await page.click('[data-testid="cal-next"]')
    await page.waitForTimeout(200)
  }
  const heading = (await page.textContent('[data-testid="cal-month"]')) ?? ''
  const day = target.getUTCDate()
  /*
    THE HEADING IS A RANGE, so the test is that the target falls inside it rather than that
    its day number appears in it. "8 Nov" is in the fortnight "2 Nov – 15 Nov" and the
    string "8" is not — which is what the first version of this asserted, and it failed on
    a view that was working.

    The cell is the real proof and it is asserted below; this only checks we walked to the
    right place.
  */
  ok(
    'the fortnights move',
    Boolean(await page.$('[data-testid="cal-day-' + day + '"]')),
    heading.trim(),
  )

  const cell = await page.$('[data-testid="cal-day-' + day + '"]')
  ok('the day it is on is marked', Boolean(cell), 'the ' + day + 'th')
  /*
    AND ONLY THOSE DAYS ARE LINKS — counted against the month, not merely "more than none".

    The first version asserted `anchors > 0`, which is the opposite claim: it cannot fail in
    the direction its own label names, and it was strictly dominated by the assertion nine
    lines above, which already proves one day is a link. A day with nothing on that takes a
    tap and does nothing is the commonest way a calendar feels broken, so the number is
    compared with the number of days the content actually has something on.
  */
  const expected = new Set(
    dropsInFortnight('lisbon', new Date(mondayOf(target)), now).map((d) => d.on),
  ).size
  const anchors = (await page.evaluate(`(() => {
    const cells = Array.from(document.querySelectorAll('[data-testid="cal-grid"] > *'))
    return cells.filter(c => c.tagName === 'A').length
  })()`)) as number
  ok(
    'and only the days with something on are links',
    anchors === expected,
    anchors + ' tappable of ' + expected + ' days with something on',
  )

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
      /*
        The face is where the card PARKS, which is not lane zero and not the last lane —
        a drop has its flow rooms to one side and the language lane to the other, so
        faceLane is (sides ? 1 : 0) + flow.length. Read from the DOM rather than computed
        here, so this cannot drift from components/Feed.tsx.
      */
      const face = s.querySelector('[data-face]')
      return {
        lane: Math.round(p.scrollLeft / p.clientWidth),
        lanes: Math.round(p.scrollWidth / p.clientWidth),
        face: face ? Number(face.getAttribute('data-face')) : null,
      }
    })()`) as { lane: number; lanes: number; face: number | null } | null
    /*
      THE CARD IS THERE AND NOT OPENED FOR YOU, which is the opposite of what this asserted.

      It required the pane to have travelled off the lane it opens on — the auto-swipe the
      arrival effect used to perform. Sam, on that behaviour: "when I click on an event drop
      screen from the calendar, it flashes up the opening card VERY quickly and then
      immediately swipes to the content. Needs to be a conscious swipe, not auto." The
      effect went; the check that demanded it did not, so it has been failing for the
      behaviour being right.

      What matters is still worth checking and is what the link actually promises: the rail
      lands on the drop you tapped, with its lanes intact and its own face showing. The
      swipe is the person's.
    */
    ok(
      'and the card is waiting on its own face, not opened for you',
      Boolean(opened && opened.lanes > 1 && opened.face !== null && opened.lane === opened.face),
      opened ? 'lane ' + opened.lane + ' of ' + opened.lanes + ', face is ' + opened.face : 'no card',
    )
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe fortnight says what is on, and tapping it hands over the Portuguese')
