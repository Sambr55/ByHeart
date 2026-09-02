/**
 * The button is in the same place on every screen.
 *
 *   npm run anchor
 *
 * This check used to assert the opposite: that a control sat close under the last line of
 * text. That was the right rule for a browser tab, where the bottom of the screen is not a
 * place — Safari's URL bar comes and goes as you scroll, so anything pinned down there
 * moves under you.
 *
 * Installed to the home screen there is no URL bar. The bottom is fixed, and a docked
 * action bar is what an app is expected to do. So the thing worth measuring flipped: not
 * how near the button is to its sentence, but whether it is in the SAME place every time.
 * A button that is 72px from the bottom here and 300px from the bottom on the next screen
 * is one somebody has to look for.
 *
 * Two heights, because a fault that only shows on a tall screen is a fault that only shows
 * on somebody else's phone.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/**
 * Every dock on screen, and how far it floats above the bottom.
 *
 * Measured to the viewport bottom rather than to the content above it, because that is
 * the promise being made: the bar beneath is a fixed height, and the dock sits directly
 * on top of it whatever the screen contains.
 */
async function docks(p: Page) {
  return p.evaluate(`(() => {
    const out = []
    for (const el of Array.from(document.querySelectorAll('[data-testid="dock"]'))) {
      const r = el.getBoundingClientRect()
      if (!r.height) continue
      out.push({
        label: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 26),
        fromBottom: Math.round(window.innerHeight - r.bottom),
      })
    }
    return out
  })()`) as Promise<{ label: string; fromBottom: number }[]>
}

/**
 * Prominent controls sitting OUTSIDE a dock, on a screen that has one.
 *
 * One docked button and one loose one is worse than neither: it teaches somebody where
 * the button lives and then puts the next one somewhere else. Screens with no dock at all
 * are left alone — the full-bleed cards run their own layout.
 */
async function strays(p: Page) {
  return p.evaluate(`(() => {
    if (!document.querySelector('[data-testid="dock"]')) return []
    const out = []
    const wide = window.innerWidth * 0.6
    for (const el of Array.from(document.querySelectorAll('main button, main a[href]'))) {
      if (el.closest('[data-testid="dock"]')) continue
      if (el.closest('[data-testid="bottom-nav"]')) continue
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (r.width < wide || r.height < 40) continue
      const bg = s.backgroundColor
      const filled = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
      if (!filled) continue
      out.push((el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 26))
    }
    return out
  })()`) as Promise<string[]>
}

/* The bar is 4.5rem, and the dock sits on it. Two pixels of slack for rounding. */
const REST = 72
const seen = new Map<string, number>()

async function look(p: Page, where: string) {
  await p.waitForTimeout(900)
  for (const d of await docks(p)) {
    seen.set(where + ' — ' + d.label, d.fromBottom)
    ok(
      where + ' — ' + d.label,
      Math.abs(d.fromBottom - REST) <= 2,
      d.fromBottom + 'px above the bottom',
    )
  }
  for (const stray of await strays(p)) {
    ok(where + ' — ' + stray + ' is outside the dock', false, 'a button somewhere else')
  }
}

const opener = ROOTS.find((r) => r.rung === 1)!
/*
  Real inventory items, not the word 'strong'.

  An InventoryItem is an object; seeding the string put a value in the record that the
  evidence writer could not read, and the exception it threw took out the click handler
  before it reached next(). The walk then pressed a live button twenty-four times without
  moving, and reported twenty-four passing beats — a check measuring one screen over and
  over while its log said it had covered the lesson.
*/
const everything = Object.fromEntries(
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
)
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: [
    { pt: opener.transfer_prompt.answer, en: opener.transfer_prompt.ask, source: 'release', clean: true, at: '1' },
  ],
  inventory: everything,
  roots_played: [],
  sections_completed: CRATES.filter((c) => !c.drop).slice(0, 6).map((c) => c.id),
  legend: [],
  // Past the question the Legend now opens with; purpose-check owns that screen.
  purpose: 'moving',
  saved: [],
  liked: [],
  finished_cards: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
}

/*
  Two heights, and the tall one is the point.

  `mt-auto` only shows itself when there is spare vertical space: on a screen whose content
  happens to fill 844px the button lands where it would anyway, and the check passes on a
  page that is wrong. A tall viewport is where the fault becomes visible, and a tall
  viewport is also a real phone — 430×932 is a Pro Max, and a desktop browser is taller
  still.
*/
const HEIGHT = Number(process.env.ANCHOR_HEIGHT ?? 844)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: HEIGHT } })
page.setDefaultTimeout(15000)
console.log('\nviewport 390×' + HEIGHT)
await page.goto(BASE + '/vibes')
/* eslint-disable-next-line no-unused-expressions */
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)

console.log('\nthe standing screens\n')
for (const route of [
  '/vibes',
  '/club',
  '/line',
  '/profile',
  '/proof',
  '/vocab',
  '/drops',
  '/pro',
  '/account',
  '/legend',
  '/feedback',
  '/signin',
  '/reset',
]) {
  await page.goto(BASE + route)
  await look(page, route)
}

console.log('\ninside a lesson\n')
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1400)
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-begin"]')
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(2200)
/*
  Far enough to reach the release, and it must SAY it got there.

  The screen this check exists for — LAST TIME / TAKE IT AWAY, the one beat that moves the
  ladder — sits deeper than eight beats. The walk stopped short of it, so the run went
  green on a suite that had never loaded the screen somebody was looking at. A walk that
  quietly ends early reports "nothing floating" when it means "nothing looked at", which is
  the more expensive of the two lies.
*/
let sawRelease = false
for (let i = 0; i < 26; i++) {
  await look(page, 'beat ' + i)
  if (/LAST TIME/.test((await page.textContent('main')) ?? '')) sawRelease = true
  /*
    Answer the screen before pressing on.

    A beat that needs a sentence built does not advance on CONTINUE, so the walk pressed a
    dead button twenty-four times and measured the same screen twenty-four times over. The
    log read as twenty-four passing beats. Tap the tiles in order — the pool is the answer
    with the words shuffled, and CHECK is what unlocks the way forward.
  */
  const pool = await page.$('[data-testid="tile-pool"]')
  if (pool) {
    for (let t = 0; t < 14; t++) {
      const tile = await page.$('[data-testid="tile-pool"] button:not([disabled])')
      if (!tile) break
      await tile.click()
      await page.waitForTimeout(120)
    }
    /* The last tile settles it; there is nothing to press. */
    await page.waitForTimeout(1000)
    await look(page, 'beat ' + i + ' settled')
  }
  const next = await page.$('[data-testid="continue"]')
  if (!next || !(await next.isEnabled())) break
  await next.click()
  await page.waitForTimeout(1300)
}
ok('the walk reached the release beat', sawRelease, sawRelease ? '' : 'never loaded it')

console.log('\nbuilding a Legend card\n')
await page.goto(BASE + '/legend')
await page.waitForTimeout(1600)
const card = await page.$('[data-testid^="legend-card-"]')
if (card) {
  await card.click()
  await look(page, 'legend ask')
  const mine = await page.$('[data-testid="legend-make-mine"]')
  if (mine) {
    await mine.click()
    await look(page, 'legend build')
  }
}

console.log('\nan errand in the Club\n')
const rooms = (ROOTS_BY_FAMILY as Record<string, unknown>) && true
if (rooms) {
  await page.goto(BASE + '/club')
  await page.waitForTimeout(2200)
  const cont = await page.$('[data-testid="card-continue"]')
  if (cont) {
    await cont.click()
    await look(page, 'club reveal')
  }
}

await browser.close()

/*
  And again, tall.

  `mt-auto` only shows itself when there is spare vertical space — on a screen whose content
  happens to fill 844px the button lands where it would anyway, and the check passes on a
  page that is wrong. Every one of the four faults this found was invisible at 844 and
  obvious at 1300. Run as a second pass rather than left to an env var, because a check
  somebody has to remember to turn on is a check that is off.
*/
if (!process.env.ANCHOR_HEIGHT) {
  const { execFileSync } = await import('node:child_process')
  console.log('\n─── and again, tall ' + '─'.repeat(46))
  try {
    const out = execFileSync('npx', ['tsx', 'scripts/anchor-check.mts'], {
      env: { ...process.env, ANCHOR_HEIGHT: '1300' },
      encoding: 'utf8',
    })
    console.log(out.split('\n').filter((l) => /✗|viewport|same place|docks, resting/.test(l)).join('\n'))
  } catch (e) {
    const err = e as { stdout?: string }
    console.log(err.stdout ?? String(e))
    problems.push('controls move on a tall screen')
  }
}

const spread = [...new Set(seen.values())].sort((a, b) => a - b)
console.log(
  '\n' + seen.size + ' docks, resting ' +
  (spread.length === 1 ? spread[0] + 'px' : spread[0] + '-' + spread[spread.length - 1] + 'px') +
  ' above the bottom',
)

if (problems.length) {
  console.log('\n' + problems.length + ' control(s) out of place\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe button is in the same place on every screen')
