/**
 * Does every screen still render at all?
 *
 *   npm run alive
 *
 * WHY THIS EXISTS. /club white-screened for an afternoon on a `ReferenceError` — a const
 * read by a useMemo declared 176 lines below it, which is a temporal dead zone the moment
 * the memo's first dependency changes. It passed `tsc`, which does not flag
 * use-before-declaration across a closure. It passed `next build`, because the server
 * render took an early return and never reached the read. And the browser checks went red
 * on a MISSING SELECTOR, because a check looking for `[data-testid="feed"]` cannot tell a
 * renamed element from a page that never rendered.
 *
 * That last part is the real cost. Roughly six hundred assertions in this repo describe
 * what should be on a screen and not one of them asked whether there was a screen — so the
 * gate's answer to a crash was a handful of confusing failures about selectors, which is
 * indistinguishable from the noise a rename makes. A check that cannot tell a crash from a
 * rename teaches you that red does not mean broken, and that is how a gate stops working.
 *
 * So this runs FIRST and asks the cheapest possible question of every route: did anything
 * throw, and is there anything on the screen. It knows nothing about DUB, which is the
 * point — it cannot go stale as the product changes.
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

/*
  Every route reachable from the bar or from a card, plus the front door. A route that
  nobody can reach is a different problem and showing-reach.mts owns it.
*/
const ROUTES = [
  '/',
  '/club',
  '/vibes',
  '/calendar',
  '/legend',
  '/profile',
  '/drops',
  '/line',
  '/vocab',
  '/crates',
  '/pro',
  '/account',
]

const browser = await chromium.launch()

/*
  A learner who has done enough to see the loaded versions of these screens.

  An empty device renders the thinnest possible branch of every page, which is exactly the
  branch a crash in the loaded one hides behind. The seed is deliberately mid-journey:
  set-up answered, a purpose, roots played, something saved and something rejected.
*/
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  chapter: 'lisbon',
  purpose: 'visiting',
  profile: { gender: 'm', age_band: '40to59', goal: 'trip', skipped: [] },
  display_name: 'Sam',
  proof: [],
  inventory: {},
  roots_played: ['tb_hello_goodbye', 'tb_yes_no'],
  sections_completed: ['the_basics'],
  legend: [],
  saved: [],
  liked: [],
  finished_cards: [],
  asked: [],
  rejected: [],
  evidence: [],
}

console.log('\nevery screen renders, and nothing throws\n')

for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.setDefaultTimeout(20000)

  /*
    Collected rather than asserted per-event, so one route reports every fault it has
    rather than the first. A React error boundary swallows the render error and shows its
    own fallback, so `pageerror` alone is not enough — the console carries it too.
  */
  const thrown: string[] = []
  page.on('pageerror', (e) => thrown.push(String(e.message).slice(0, 120)))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    // Next's dev overlay narrates its own presence; the underlying throw is what matters.
    if (/Failed to load resource|favicon|Download the React DevTools/.test(t)) return
    thrown.push(t.slice(0, 120))
  })

  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([k, pair, blob]) => {
        localStorage.setItem('byheart.pair', JSON.stringify(pair))
        localStorage.setItem(k as string, JSON.stringify(blob))
      },
      [KEY, DEFAULT_PAIR, seed] as const,
    )
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' })
    /*
      Long enough for the mount effects to run, because that is where this class of fault
      lives: the first render is usually the one that works.
    */
    await page.waitForTimeout(2600)

    const body = ((await page.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
    const painted = (await page.evaluate(
      `(() => {
        const m = document.querySelector('main')
        if (!m) return 0
        return (m.innerText || '').trim().length
      })()`,
    )) as number

    ok(
      route + ' threw nothing',
      thrown.length === 0,
      thrown.length ? thrown[0] : 'clean',
    )
    /*
      And something is actually on it. A route that renders an empty <main> is not
      obviously broken to a selector check, and it is completely broken to a person.
    */
    ok(route + ' painted something', painted > 20, painted + ' characters in <main>')
    /*
      Next's error overlay is a rendered page and would satisfy both checks above, so it
      is named directly. The words are the overlay's, not ours.
    */
    ok(
      route + ' is the app and not an error screen',
      !/Unhandled Runtime Error|Cannot access .* before initialization|Application error/i.test(body),
      'no error boundary',
    )
  } catch (e) {
    ok(route + ' loaded', false, String((e as Error).message).slice(0, 100))
  }

  await page.close()
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery screen is a screen')
