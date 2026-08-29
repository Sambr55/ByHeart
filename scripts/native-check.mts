/**
 * The small accommodations that make this an app rather than a page.
 *
 *   npm run native
 *
 * Seven separate things with one property in common: each is invisible when it works and
 * unmistakable when it does not, which is exactly the kind of thing that rots without a
 * check. None of them can be verified by looking at the source — an attribute that is
 * never set, a marker that never moves and a scroll that is never restored all look
 * perfectly correct in a diff.
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
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 4).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
  inventory: {},
  roots_played: [opener.root_id],
  sections_completed: CRATES.filter((c) => !c.drop).slice(0, 3).map((c) => c.id),
  legend: [], saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
}

async function seeded(page: Page, route = '/vibes') {
  await page.goto(BASE + '/vibes')
  await page.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seed] as const,
  )
  await page.goto(BASE + route)
  await hideDevChrome(page)
  await page.waitForTimeout(1500)
}

/**
 * Next's dev overlay, out of the way.
 *
 * Its floating button sits in the bottom-left corner, which in DUB is exactly where the
 * VIBES tab is — so every click on that tab was being intercepted by a control that does
 * not exist in production. Hidden rather than clicked around, because the tab's position
 * is the thing being tested.
 */
async function hideDevChrome(p: Page) {
  await p.addStyleTag({
    content: 'nextjs-portal,[data-nextjs-dev-overlay],[data-nextjs-toast]{display:none!important}',
  })
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

console.log('\nthe status bar agrees with the screen under it\n')
await seeded(page, '/club')
const barOnClub = await page.getAttribute('meta[name="theme-color"]:not([media])', 'content')
ok('a full-bleed card takes the dark', barOnClub === '#241f1a', String(barOnClub))
await page.goto(BASE + '/profile')
await page.waitForTimeout(1300)
const barOnProfile = await page.getAttribute('meta[name="theme-color"]:not([media])', 'content')
ok(
  'and leaving it puts the blue back',
  barOnProfile !== '#241f1a',
  String(barOnProfile) + ' — restored rather than left behind',
)

console.log('\nthe keyboard does not sit on the button\n')
/*
  visualViewport cannot be driven from a headless browser, so the wiring is exercised
  rather than the phone: the variable the layout reads is set, and the dock and the bar
  both respond to it. What cannot be faked is asserted as far as it goes and no further.
*/
await seeded(page, '/line')
const responds = (await page.evaluate(`(() => {
  const root = document.documentElement
  const dock = document.querySelector('.dock')
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  if (!dock || !nav) return null
  const before = getComputedStyle(dock).bottom
  root.style.setProperty('--keyboard', '300px')
  root.setAttribute('data-keyboard', 'on')
  const after = getComputedStyle(dock).bottom
  const navMoved = getComputedStyle(nav).transform
  root.style.removeProperty('--keyboard')
  root.removeAttribute('data-keyboard')
  return { before, after, navMoved }
})()`)) as { before: string; after: string; navMoved: string } | null
ok('there is a dock to lift', Boolean(responds))
if (responds) {
  ok(
    'it rises with the keyboard',
    parseFloat(responds.after) > parseFloat(responds.before),
    responds.before + ' → ' + responds.after,
  )
  ok(
    'and the tab bar gets out of the way',
    responds.navMoved !== 'none',
    'four controls under a keyboard are four controls nobody can reach',
  )
}

console.log('\nthe bar is one object, not four\n')
await seeded(page, '/profile')
const marker = await page.$('[data-testid="nav-marker"]')
ok('there is one marker', Boolean(marker))
const onProfile = await page.evaluate(`document.querySelector('[data-testid="nav-marker"]').getBoundingClientRect().x`)
await page.click('[data-testid="tab-vibes"]')
await page.waitForTimeout(900)
const onVibes = await page.evaluate(`document.querySelector('[data-testid="nav-marker"]').getBoundingClientRect().x`)
ok('and it moves between tabs', onProfile !== onVibes, Math.round(onProfile as number) + ' → ' + Math.round(onVibes as number))
ok(
  'rather than one appearing per tab',
  ((await page.$$('[data-testid="nav-marker"]')).length) === 1,
)

console.log('\nnothing guesses at what the learner has done\n')
ok(
  'the browser says when it has read the record',
  (await page.getAttribute('html', 'data-ready')) === 'on',
)
/*
  Read after the transition, not during it.

  The reveal is a 120ms fade, so an opacity read in the same tick as the attribute is read
  mid-fade — the first version of this asserted "visible" against 0 and failed on a
  correct reveal, which is the same mistake as measuring a screen before it has laid out.
*/
const off = (await page.evaluate(`(() => {
  const el = document.querySelector('.needs-learner')
  if (!el) return null
  document.documentElement.removeAttribute('data-ready')
  return getComputedStyle(el).opacity
})()`)) as string | null
ok('there is something that waits for it', off !== null)
ok('it is invisible until the answer exists', off === '0', String(off))
await page.evaluate(`document.documentElement.setAttribute('data-ready', 'on')`)
await page.waitForTimeout(400)
const on = (await page.evaluate(
  `getComputedStyle(document.querySelector('.needs-learner')).opacity`,
)) as string
ok('and visible once it does', on === '1', on)

console.log('\nyou come back to where you were\n')
await seeded(page, '/vocab')
await page.evaluate('window.scrollTo(0, 600)')
await page.waitForTimeout(700)
const went = (await page.evaluate('window.scrollY')) as number
ok('there is a page long enough to scroll', went > 200, Math.round(went) + 'px')
await page.click('[data-testid="tab-vibes"]')
await page.waitForTimeout(1200)
await page.goto(BASE + '/vocab')
await hideDevChrome(page)
await page.waitForTimeout(1800)
const back = (await page.evaluate('window.scrollY')) as number
ok('a tab remembers its place', back > 200, Math.round(back) + 'px down')

console.log('\nand a screen arrives rather than being swapped\n')
await seeded(page, '/vibes')
const anim = (await page.evaluate(`(() => {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules
    try { rules = Array.from(sheet.cssRules) } catch { continue }
    for (const rule of rules) {
      if (rule.name === 'screen-in') return true
    }
  }
  return false
})()`)) as boolean
ok('the arrival exists', anim)

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe small things behave the way an app behaves')
