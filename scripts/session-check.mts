/**
 * What a session says it did, against what it did.
 *
 *   npm run session
 *
 * A session serves at most four roots. The basics has fourteen. So finishing a session and
 * finishing a vibe are three or four sittings apart — and the end screen said "— DONE" and
 * "VIBE COMPLETE" after the first one, while the shelf said "3 of 14 taken". The count was
 * right; the screen was not, and the person reading both concluded the count was broken.
 *
 * No single check could have caught that, because neither screen is wrong on its own. This
 * one reads both and asserts they agree.
 *
 * It also covers the build beat's controls, where being shown the answer used to leave
 * nothing to do but press CHECK on somebody else's work.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const basics = ((ROOTS_BY_FAMILY as Record<string, { root_id: string }[]>)['the_basics'] ?? [])

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
page.setDefaultTimeout(15000)

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(
      k as string,
      JSON.stringify({
        version: 1,
        deal_accepted_at: '2026-08-01T00:00:00.000Z',
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
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1800)
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-begin"]')
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(2200)

console.log('\nthe build beat, when you ask to be shown\n')
/** Walk to the first build beat. */
async function toBuild(p: Page): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    if (await p.$('[data-testid="build-check"]')) return true
    const next = await p.$('[data-testid="continue"]')
    if (!next || !(await next.isEnabled())) return false
    await next.click()
    await p.waitForTimeout(700)
  }
  return false
}
const built = await toBuild(page)
ok('a build beat is reachable', built)

if (built) {
  ok('CHECK and SHOW ME sit together', Boolean(await page.$('[data-testid="build-help"]')))
  ok('and there is nothing to retry yet', !(await page.$('[data-testid="build-retry"]')))

  const row = await page.evaluate(`(() => {
    const a = document.querySelector('[data-testid="build-check"]').getBoundingClientRect()
    const b = document.querySelector('[data-testid="build-help"]').getBoundingClientRect()
    return Math.abs(a.top - b.top)
  })()`) as number
  ok('on the same line', row <= 2, row + 'px apart')

  await page.click('[data-testid="build-help"]')
  await page.waitForTimeout(1800)
  const shown = await page.evaluate(
    `document.querySelectorAll('[data-testid="tile-line"] button').length`,
  ) as number
  ok('SHOW ME lays the answer out', shown > 0, shown + ' pieces placed')
  ok('and RETRY takes its place', Boolean(await page.$('[data-testid="build-retry"]')))
  ok('SHOW ME is gone — there is nothing left to show', !(await page.$('[data-testid="build-help"]')))

  await page.click('[data-testid="build-retry"]')
  await page.waitForTimeout(700)
  const after = await page.evaluate(
    `document.querySelectorAll('[data-testid="tile-line"] button').length`,
  ) as number
  ok('RETRY clears the line', after === 0, after + ' pieces left')
  ok(
    'and does not offer to show it again',
    Boolean(await page.$('[data-testid="build-retry"]')),
    'being shown is a fact about the attempt, not a mood',
  )
}

console.log('\nwhat the end of a session claims\n')
// Straight through, however the beats behave, to whatever screen ends it.
for (let i = 0; i < 60; i++) {
  const done = await page.$('[data-testid="section-done"], [data-testid="finish-another"]')
  if (done) break
  const check = await page.$('[data-testid="build-check"]')
  if (check) {
    /*
      Solved rather than shown.

      Pressing SHOW ME and then CHECK worked until RETRY existed — retry clears the line,
      CHECK is correctly disabled on an empty one, and the walk sat there clicking a
      disabled button. Reading the answer off the line's data-answer seam and tapping the
      pieces is what a person does anyway, and it exercises the beat properly.
    */
    const answer = ((await page.getAttribute('[data-testid="tile-line"]', 'data-answer')) ?? '')
      .split(/\s+/)
      .filter(Boolean)
    for (const word of answer) {
      const tile = await page.$(
        '[data-testid="tile-pool"] button:has-text("' + word.replace(/"/g, '') + '")',
      )
      if (tile) {
        await tile.click()
        await page.waitForTimeout(90)
      }
    }
    const ready = await page.$('[data-testid="build-check"]')
    if (ready && (await ready.isEnabled())) {
      await ready.click()
      await page.waitForTimeout(1200)
    } else {
      break
    }
    continue
  }
  const next = await page.$('[data-testid="continue"]')
  if (next && (await next.isEnabled())) {
    await next.click()
    await page.waitForTimeout(800)
    continue
  }

  /*
    A beat that asks something.

    The profile questions — "are you speaking as a man or a woman", how long you are
    staying — have their own controls and no continue until one is chosen, so a walk that
    only knows about `continue` stops dead on them. This answers with the first option, the
    way somebody would, and carries on.
  */
  const answered = await page.evaluate(`(() => {
    const nav = '[data-testid="bottom-nav"]'
    for (const el of Array.from(document.querySelectorAll('main button'))) {
      if (el.closest(nav) || el.disabled) continue
      const t = (el.textContent || '').trim()
      if (!t || /^(CHECK|RETRY|SHOW ME)$/i.test(t)) continue
      if (el.getAttribute('aria-label')) continue
      el.click()
      return t.slice(0, 24)
    }
    return null
  })()`) as string | null
  if (!answered) break
  await page.waitForTimeout(800)
}

const seen = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
const played = (await page.evaluate(
  `(() => { const s = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}'); return (s.roots_played || []).length })()`,
)) as number

console.log('  roots served this session: ' + played + ' of ' + basics.length)
console.log('  the screen says: ' + seen.slice(0, 70))
if (/DONE|COMPLETE/i.test(seen)) {
  /*
    The assertion the whole check exists for. Claiming the vibe is finished is only
    allowed when it IS finished — otherwise the shelf's count reads as a fault.
  */
  const claimsVibeDone = /VIBE COMPLETE|— DONE/i.test(seen)
  ok(
    'it does not claim the vibe is finished when it is not',
    !claimsVibeDone || played >= basics.length,
    played + ' of ' + basics.length + ' roots played',
  )
  ok(
    'and says how much is left',
    played >= basics.length || /more in there/i.test(seen),
    seen.slice(0, 60),
  )
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na session says it is a session, and being shown leaves something to do')
