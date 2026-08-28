/**
 * Every button sits under the words that earned it.
 *
 *   npm run anchor
 *
 * `mt-auto` pushes a control to the foot of its column. On a short screen that leaves a
 * lake of nothing between the last sentence and the thing to press, and puts a blue button
 * hard against the blue bar — two blues with a hairline between them, reading as one shape.
 *
 * This was fixed on the journey's Cta and the demo and nowhere else, which is worse than
 * not fixing it: a rule applied to some screens is not a rule, it is an inconsistency with
 * a good reason. So this measures every screen rather than trusting a grep — the fault is
 * about where a control ENDS UP, and `mt-auto` is only one of the ways to get there.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
/** A section step is 40px. Twice that is generous; past it, something pushed the button. */
const LIMIT = 96
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/**
 * Every prominent control on screen, and how far it floats below its own content.
 *
 * "Prominent" means full-width and filled — the thing somebody is meant to press. A quiet
 * text link at the foot of a page is a footnote and is allowed to sit there.
 *
 * Measured against the bottom of everything BEFORE it in its own column, not against the
 * last sentence: a screen that deliberately reserves space for something about to animate
 * in is not floating, and reading only text would call it that.
 */
async function floats(p: Page) {
  return p.evaluate(`(() => {
    const out = []
    const wide = window.innerWidth * 0.6
    for (const el of Array.from(document.querySelectorAll('main button, main a[href]'))) {
      if (el.closest('[data-testid="bottom-nav"]')) continue
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (r.width < wide || r.height < 40) continue
      const bg = s.backgroundColor
      const filled = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
      const bordered = s.borderStyle !== 'none' && parseFloat(s.borderTopWidth) > 0
      if (!filled && !bordered) continue

      /*
        Measured against the last GLYPH above it, not the last box.

        Two versions of this check passed on screens that were plainly wrong, and both
        failed the same way: they compared the button to element rectangles. The usual way
        a button ends up at the foot of a screen is a flex-1 block above it — and a
        flex-1 block's rectangle STRETCHES down to meet the button, so the gap measures
        near zero and the fault reports as fine. The box is exactly the thing that lies.

        Text does not stretch. A Range around a text node returns where the glyphs actually
        are, so "the bottom of the last revealed text" is measured rather than inferred,
        which is also the rule as it was asked for.
      */
      let last = null
      const walk = document.createTreeWalker(
        document.querySelector('main'),
        NodeFilter.SHOW_TEXT,
      )
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!(n.textContent || '').trim()) continue
        if (el.contains(n)) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        for (const orr of Array.from(range.getClientRects())) {
          if (!orr.height || !orr.width) continue
          if (orr.bottom > r.top) continue
          if (last === null || orr.bottom > last) last = orr.bottom
        }
      }
      /*
        An image or an empty field can be the last thing revealed, and neither stretches.

        Without the field, a card whose last row is a box waiting to be typed in measured
        from the LABEL above the box — reporting a gap of 119px on a screen where the
        button sits directly under the thing it submits. Reading only text is how a correct
        screen gets called wrong, which costs as much trust as the reverse.
      */
      for (const other of Array.from(document.querySelectorAll('main img, main input, main textarea, main select'))) {
        const orr = other.getBoundingClientRect()
        if (!orr.height || orr.bottom > r.top) continue
        if (last === null || orr.bottom > last) last = orr.bottom
      }
      if (last === null) continue
      out.push({
        label: (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 26),
        gap: Math.round(r.top - last),
      })
    }
    return out
  })()`) as Promise<{ label: string; gap: number }[]>
}

async function look(p: Page, where: string) {
  await p.waitForTimeout(900)
  for (const c of await floats(p)) {
    ok(
      where + ' — ' + c.label,
      c.gap <= LIMIT,
      c.gap + 'px below its content',
    )
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
    const check = await page.$('[data-testid="build-check"]')
    if (check && (await check.isEnabled())) {
      await check.click()
      await page.waitForTimeout(900)
      await look(page, 'beat ' + i + ' checked')
    }
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
    console.log(out.split('\n').filter((l) => /✗|viewport|every button/.test(l)).join('\n'))
  } catch (e) {
    const err = e as { stdout?: string }
    console.log(err.stdout ?? String(e))
    problems.push('controls float on a tall screen')
  }
}

if (problems.length) {
  console.log('\n' + problems.length + ' control(s) floating\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery button sits under the words that earned it')
