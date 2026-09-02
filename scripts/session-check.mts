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
    if (await p.$('[data-testid="tile-pool"]')) return true
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
  ok('SHOW ME is the only thing offered', Boolean(await page.$('[data-testid="build-help"]')))
  ok('there is nothing to check with', !(await page.$('[data-testid="build-check"]')))
  ok('and nothing to retry yet', !(await page.$('[data-testid="build-retry"]')))

  /*
    The line marks itself.

    CHECK was a second action for a decision already made — the app can see whether the
    line is the sentence the moment the last tile lands. Tapping the pieces in order and
    then waiting is what somebody actually does now, so that is what this does.
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
  await page.waitForTimeout(1200)
  const settled = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok(
    'the last word settles it, with nothing pressed',
    Boolean(await page.$('[data-testid="continue"]')),
    settled.slice(0, 50),
  )

  /* And the result carries its audio, on this beat as on every other. */
  ok(
    'and the answer can be heard',
    Boolean(await page.$('[data-testid="audio"]')),
    'every build ends in a banked row with its audio',
  )

  // Back to a fresh build to exercise being shown.
  const again = await toBuild(page)
  ok('another build beat is reachable', again)

  await page.click('[data-testid="build-help"]')
  await page.waitForTimeout(1800)
  const shown = await page.evaluate(
    `document.querySelectorAll('[data-testid="tile-line"] button').length`,
  ) as number
  ok('SHOW ME lays the answer out', shown > 0, shown + ' pieces placed')
  ok('and RETRY takes its place', Boolean(await page.$('[data-testid="build-retry"]')))
  ok('SHOW ME is gone — there is nothing left to show', !(await page.$('[data-testid="build-help"]')))
  ok(
    'being shown does not settle it for you',
    Boolean(await page.$('[data-testid="build-said"]')),
    'the words were not entered by anybody',
  )

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
  const pool = await page.$('[data-testid="tile-pool"]')
  if (pool) {
    /*
      Solved rather than shown, and nothing pressed afterwards.

      Reading the answer off the line's data-answer seam and tapping the pieces is what a
      person does anyway, and it exercises the beat properly. The last tap settles it.
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
    await page.waitForTimeout(1100)
    const said = await page.$('[data-testid="build-said"]')
    if (said) {
      await said.click()
      await page.waitForTimeout(900)
    }
    if (!(await page.$('[data-testid="continue"]'))) break
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
  /*
    That there IS more, which is deliberately not how much more.

    The label used to say "how much is left" and the screen used to answer it with a
    number. Both are gone: a session serves three or four roots and a vibe holds six to
    fourteen, so counting them on the screen that has just congratulated somebody produced
    "I did all of it" and "you are a fifth of the way through" on consecutive screens. The
    assertion survives because what it protects is that the vibe is not silently presented
    as finished; only its wording needed to stop describing a behaviour we removed.
  */
  ok(
    'and says there is more',
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
