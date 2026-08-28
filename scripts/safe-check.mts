/**
 * Nothing DUB draws sits under the phone's own furniture.
 *
 *   npm run safe
 *
 * Installed to the home screen, DUB asks for a translucent status bar and viewport-fit:
 * cover. That is deliberate — it is what makes the blue header run edge to edge instead of
 * starting below a white strip, and it is most of the difference between an app and a page
 * with a shortcut. The other half of the bargain is that the app must keep its own content
 * out from under the clock, the signal bars and the home indicator, and for a long time it
 * only did the bottom half: every header was padded from the very top of the screen, so
 * the eyebrow and the back arrow sat behind the time.
 *
 * The reason it survived every check: env(safe-area-inset-top) resolves to 0px in a
 * desktop browser, so a headless run cannot tell a screen that respects the notch from one
 * that ignores it. Every viewport in every gate was a phone with no furniture on it.
 *
 * So the insets are variables now, and this fakes them. 47px and 34px are a modern iPhone
 * held upright. What is asserted is not "a padding exists" — a padding can exist and be on
 * the wrong element — but that no text and no control lands inside either band.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const TOP = 47
const BOTTOM = 34

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/**
 * Everything a person can read or press, and whether the phone is sitting on it.
 *
 * Backgrounds are allowed up there and are the whole point — the bar's colour SHOULD run
 * behind the clock. So this looks at text and at controls, never at the boxes they sit in:
 * a container reaching the top edge is correct, its label doing so is not.
 *
 * Measured at the two scroll positions where the answer means something, because the first
 * version measured the instantaneous viewport and was wrong in the expensive direction: on
 * any page long enough to scroll, SOMETHING is under the home bar at some scroll offset,
 * and a check that cries about correct screens is one you learn to skim.
 *
 * At the top of the page nothing may be under the clock — that is the first frame somebody
 * sees. At the bottom of the page nothing may be under the home indicator — that is where
 * the last line of a page lives, and it is the single most common way a bottom bar goes
 * wrong. In between, content passing under either is what scrolling IS.
 */
async function buried(p: Page) {
  const scan = (band: 'top' | 'bottom') => `(() => {
    const top = ${TOP}
    const bottom = window.innerHeight - ${BOTTOM}
    const band = ${JSON.stringify('BAND')}
    const out = []
    const note = (what, why) => { if (out.length < 5) out.push(what + ' (' + why + ')') }
    /*
      Reachable is not buried.

      The feed's second pane scrolls inside itself, so a line four screens down that pane
      was being measured against the home bar and reported as trapped under it. It is not
      trapped, it is further down — the window scroll this check drives does not move an
      inner pane at all. So anything with a scrollable ancestor that has not reached its
      end in the direction being tested is skipped: the phone is not sitting on it, and
      calling that a fault trains somebody to ignore the one time it is.
    */
    const reachable = (el) => {
      for (let n = el.parentElement; n; n = n.parentElement) {
        const style = getComputedStyle(n)
        if (!/(auto|scroll)/.test(style.overflowY)) continue
        const room = n.scrollHeight - n.clientHeight
        if (room <= 1) continue
        if (band === 'bottom' && n.scrollTop < room - 1) return true
        if (band === 'top' && n.scrollTop > 1) return true
      }
      return false
    }

    const hit = (r) => {
      if (!r.width || !r.height) return null
      if (r.bottom < 0 || r.top > window.innerHeight) return null
      if (band === 'top' && r.top < top) return 'under the clock'
      if (band === 'bottom' && r.bottom > bottom) return 'under the home bar'
      return null
    }

    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = (n.textContent || '').trim()
      if (!text) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      const holder = n.parentElement
      if (holder && reachable(holder)) continue
      for (const r of Array.from(range.getClientRects())) {
        const why = hit(r)
        if (why) note(text.slice(0, 24), why)
      }
    }
    for (const el of Array.from(document.querySelectorAll('button, a[href], input, textarea'))) {
      if (reachable(el)) continue
      const why = hit(el.getBoundingClientRect())
      if (!why) continue
      const label = (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)
      note(label, 'control ' + why)
    }
    return out
  })()`.replace('"BAND"', JSON.stringify(band))

  await p.evaluate('window.scrollTo(0, 0)')
  await p.waitForTimeout(220)
  const atTop = (await p.evaluate(scan('top'))) as string[]

  await p.evaluate('window.scrollTo(0, document.body.scrollHeight)')
  await p.waitForTimeout(320)
  const atBottom = (await p.evaluate(scan('bottom'))) as string[]

  return [...atTop, ...atBottom]
}

const opener = ROOTS.find((r) => r.rung === 1)!
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2)
    .slice(0, 4)
    .map((r, i) => ({
      pt: r.transfer_prompt.answer,
      en: r.transfer_prompt.ask,
      source: 'release',
      clean: true,
      at: String(i + 1),
    })),
  inventory: Object.fromEntries(
    ROOTS.flatMap((r) => r.extracts).map((e) => [
      e.id,
      {
        target_id: e.id,
        acquired_source: null,
        reinforced_sources: [],
        latest_state: 'strong',
        latest_recall_at: null,
      },
    ]),
  ),
  roots_played: [opener.root_id],
  sections_completed: CRATES.filter((c) => !c.drop)
    .slice(0, 3)
    .map((c) => c.id),
  legend: [],
  saved: [],
  liked: [],
  finished_cards: [],
  asked: [],
  evidence: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

/*
  The notch, put on by hand, after each navigation.

  The first attempt used addInitScript, which was silently useless: it runs against the
  blank document a navigation starts from, so the custom properties were set on an html
  element that the real document then replaced. The check reported every screen buried
  under a notch of 0px, which happens to be the truth about a desktop browser and nothing
  at all about a phone — a check measuring the wrong screen and passing its own assertion.

  A stylesheet is injected instead, which survives because it is added to the document
  being measured. Layout is recomputed synchronously, so reading straight afterwards is
  reading the notched page.
*/
async function notch(p: Page) {
  await p.addStyleTag({
    content: ':root{--safe-top:' + TOP + 'px;--safe-bottom:' + BOTTOM + 'px}',
  })
}

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)

console.log('\na notch of ' + TOP + 'px and a home bar of ' + BOTTOM + 'px\n')
for (const route of [
  '/',
  '/vibes',
  '/club',
  '/line',
  '/profile',
  '/proof',
  '/vocab',
  '/drops',
  '/pro',
  '/legend',
  '/feedback',
  '/signin',
  '/account',
  '/reset',
  '/nothing-is-here',
]) {
  await page.goto(BASE + route)
  await notch(page)
  await page.waitForTimeout(1000)
  const found = await buried(page)
  ok(route, found.length === 0, found.join(', '))
}

console.log('\nand inside a lesson\n')
await page.goto(BASE + '/vibes')
await notch(page)
await page.waitForTimeout(1400)
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-begin"]')
const openFound = await buried(page)
ok('the vibe takeover', openFound.length === 0, openFound.join(', '))
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(1800)
for (let i = 0; i < 4; i++) {
  const found = await buried(page)
  ok('beat ' + i, found.length === 0, found.join(', '))
  const next = await page.$('[data-testid="continue"]')
  if (!next || !(await next.isEnabled())) break
  await next.click()
  await page.waitForTimeout(1200)
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' screen(s) under the furniture\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nnothing DUB draws sits under the clock or the home bar')
