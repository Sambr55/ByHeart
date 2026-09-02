/**
 * Why you are in the city, asked once and honoured after.
 *
 *   npm run purpose
 *
 * The routing axis from docs/spec-purpose-and-depth.md. Three things worth measuring, and
 * the third is the one that would go wrong quietly.
 *
 * It is asked at the Club threshold rather than at the front door or in the Legend — at
 * the front door it would be a form between somebody and the product, and in the Legend it
 * would put "are you a tourist" inside a sentence they recite in a bar.
 *
 * It is remembered, and it is changeable from YOURS, because the threshold says so and a
 * setting somebody is told they can change and then cannot find is worse than not offering
 * the change.
 *
 * And the FILTER IS OFF. Five Situations divided by three purposes is one or two each, so
 * shipping the filter before a block of ten exists would make the first thing purpose does
 * be making the Club emptier — the exact problem it is meant to solve. The wiring is real
 * and tested; the caller passes null until the content lands. This asserts that it is off,
 * so turning it on is a deliberate act rather than a drift.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_FRAMES } from '../content/legend'
import { ROOTS } from '../content/roots'
import { SITUATIONS, PURPOSES } from '../content/situations'
import { forPurpose } from '../content/feed'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nthe content model\n')
ok('there are three purposes', PURPOSES.length === 3, PURPOSES.map((p) => p.id).join(', '))
/*
  Untagged means everybody, and most of Lisbon is untagged on purpose — a pharmacy does not
  care why you are in the country. If this ever inverts, the Club silently empties for
  whoever has not been asked.
*/
ok(
  'an untagged room is for everybody',
  SITUATIONS.filter((s) => !s.purposes).every((s) =>
    PURPOSES.every((p) => forPurpose(s, p.id)) && forPurpose(s, null),
  ),
)
ok(
  'and an unanswered purpose sees everything',
  SITUATIONS.every((s) => forPurpose(s, null)),
  'a Club that empties until a question is answered is a form with a Club behind it',
)
const tagged = SITUATIONS.filter((s) => s.purposes)
ok('something is tagged, or the axis does nothing', tagged.length > 0, tagged.map((s) => s.id).join(', '))
ok(
  'and nobody on a four-day holiday is sent to the Junta',
  !SITUATIONS.some((s) => s.id === 'lisbon_junta' && forPurpose(s, 'visiting')),
)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

/** A learner who has just earned the Club and has never been welcomed. */
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
  inventory: {},
  roots_played: [],
  sections_completed: [],
  legend: LEGEND_FRAMES.map((f) => ({ frame_id: f.id, values: { seeded: 'yes' } })),
  saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
  club_welcomed_at: null,
  purpose: null,
}

console.log('\nasked at the top of the Legend, once\n')
/*
  Not at the Club's threshold, which is where it was first built and was wrong twice over:
  it arrived after the Club had been earned rather than before it was explained, and it
  arrived separately from the seven questions it exists to shape.
*/
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)
await page.goto(BASE + '/club')
await page.waitForTimeout(2200)

const welcome = await page.$('[data-testid="club-welcome-cta"]')
ok('the Club still welcomes people', Boolean(welcome))
if (welcome) {
  await welcome.click()
  await page.waitForTimeout(1200)
}
ok(
  'and it does not ask anything',
  !(await page.$('[data-testid="purpose-moving"]')),
  'the biggest moment in the product is not a form',
)

await page.goto(BASE + '/legend')
await page.waitForTimeout(2000)
ok('the Legend asks it first', Boolean(await page.$('[data-testid="purpose-moving"]')))
ok('all three are offered', (await page.$$('[data-testid^="purpose-"]')).length === 3)

await page.click('[data-testid="purpose-moving"]')
await page.waitForTimeout(1400)
const stored = (await page.evaluate(
  `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').purpose } catch { return null } })()`,
)) as string | null
ok('the answer is remembered', stored === 'moving', String(stored))
ok(
  'and it lets you straight on to the seven',
  !(await page.$('[data-testid="purpose-moving"]')),
  'asked once',
)

await page.reload()
await page.waitForTimeout(1800)
ok(
  'and never asks again',
  !(await page.$('[data-testid="purpose-moving"]')),
  'a question that reappears is a form rather than a decision',
)

console.log('\nand changeable afterwards, as promised\n')
await page.goto(BASE + '/profile')
await page.waitForTimeout(1600)
ok('it is in Yours', Boolean(await page.$('[data-testid="purpose-set-visiting"]')))
await page.click('[data-testid="purpose-set-visiting"]')
await page.waitForTimeout(700)
const changed = (await page.evaluate(
  `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').purpose } catch { return null } })()`,
)) as string | null
ok('changing it sticks', changed === 'visiting', String(changed))
const proof = (await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').proof || []).length } catch { return 0 } })()`,
)) as number
ok(
  'and nothing learned is taken away by it',
  proof === seed.proof.length,
  proof + ' sentences still there',
)

console.log('\nthe filter is built and deliberately off\n')
/*
  Asserted rather than assumed. The Junta is tagged for staying and moving, so a visiting
  learner would lose it the moment the filter is switched on — and with five rooms in the
  product that is a quarter of the Club. Turning it on must be a deliberate act taken when
  a block of ten exists, not something that drifts in.
*/
await page.goto(BASE + '/club')
await page.waitForTimeout(2200)
const text = ((await page.textContent('body')) ?? '').replace(/\s+/g, ' ')
ok(
  'a visiting learner can still see every room',
  text.includes('Junta'),
  'five rooms divided by three purposes is one or two each',
)

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhy you are here is asked once, kept, and changes nothing you have done')
