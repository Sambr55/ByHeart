/**
 * The Legend is the hero of Yours, and the practice is one tap away.
 *
 *   npm run hero
 *
 * Sam: "I want you to do a full review of the Yours section to ensure Legend is the hero
 * and is presented as a powerful source of learning to be returned to. If a person
 * practised their Legend once a day they will be flying with Portuguese."
 *
 * It was a bordered row, fifth down the page, under three grids of cards, at the same type
 * size as a saved card. The two practice routes — out loud, and cold — existed but were at
 * the bottom of the Legend's own second screen, so nothing on Yours pointed at the daily
 * act the whole claim rests on.
 *
 * THIS IS DRIVEN, NOT REASONED ABOUT. The position of a section on a page and whether a
 * button is reachable are facts about the rendered screen, and every time I have argued
 * them from the source in this repo I have been wrong about something. So a real browser
 * loads it with a real record and reports the order it actually sees.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { cardFor } from '../content/legend'
import { ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)

const base = {
  version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z', profile: { goal: 'curious' },
  inventory: {}, proof: [], roots_played: [], sections_completed: [],
  legend: [], saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
}
/* A member with a Legend under way: four answered, which is past the run-through's two. */
const member = {
  ...base,
  sections_completed: ['the_basics', 'top_gun', 'james_bond', 'pulp_fiction', 'bridget_jones'],
  finished_cards: ['lisbon_farmacia'],
  saved: ['lisbon_cafe'],
  legend: cardFor(null).slice(0, 4).map((f) => ({ frame_id: f.id, values: { x: 'y' } })),
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
}

async function seed(p: Page, blob: Record<string, unknown>) {
  /* addInitScript, so the page's own save cannot land on top of the seed. */
  await p.addInitScript(
    ([k, pair, v]) => {
      try {
        localStorage.clear()
        localStorage.setItem('byheart.pair', JSON.stringify(pair))
        localStorage.setItem(k as string, JSON.stringify(v))
      } catch {}
    },
    [KEY, DEFAULT_PAIR, blob] as const,
  )
}

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
await seed(p, member)
await p.goto(BASE + '/profile', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(process.env.BASE_URL ? 5000 : 2600)

console.log('\nthe Legend is the hero of Yours\n')

const hero = p.locator('[data-testid="legend-hero"]')
ok('the hero renders at all', (await hero.count()) > 0)

/*
  FIRST ON THE PAGE, measured by where it actually sits rather than by reading the JSX.
  Compared against the first Section heading — if a grid of cards outranks it, the screen
  is saying the product is a collection.
*/
const heroY = await hero.first().boundingBox().then((box) => box?.y ?? -1)
const firstSection = await p.locator('h2.eyebrow').first().boundingBox().then((box) => box?.y ?? -1)
ok('nothing sits above it', heroY >= 0 && heroY <= firstSection + 1, `hero at y=${Math.round(heroY)}`)

/* Above the fold on a phone: the point of a hero is that it is what you land on. */
ok('it is on the first screen without scrolling', heroY >= 0 && heroY < 844, `y=${Math.round(heroY)}`)

/*
  PRACTICE IS REACHABLE FROM HERE. The whole claim is a daily habit, and a habit behind
  two taps on a second screen is not one.
*/
const practise = p.locator('[data-testid="hero-practise"]')
const cold = p.locator('[data-testid="hero-cold"]')
ok('practice out loud is one tap from Yours', (await practise.count()) > 0)
ok('the cold open is one tap from Yours', (await cold.count()) > 0)

/*
  AND THE TAP ARRIVES. A link to a mode the Legend does not accept is the same bug as a
  404 — it was ?run=1, which did not exist until this work added it.
*/
await practise.first().click()
await p.waitForTimeout(1500)
ok(
  'it lands in a run-through, not the deck',
  (await p.locator('[data-testid="legend-rehearse"]').count()) === 0 &&
    !p.url().endsWith('/profile'),
  p.url(),
)

/*
  NO SCORE, NO FRACTION, NO PERCENTAGE — the product's own rule, and the specific thing
  Sam asked for: the first seven are a start, not a quota, so nothing may read "of".
*/
await p.goto(BASE + '/profile', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(process.env.BASE_URL ? 5000 : 2600)
const heroText = (await hero.first().innerText()).replace(/\s+/g, ' ')
ok('no fraction in the hero', !/\b\d+\s*(of|\/)\s*\d+\b/i.test(heroText), heroText.slice(0, 80))
ok('no percentage in the hero', !heroText.includes('%'))

await b.close()

if (problems.length) {
  console.log('\n' + problems.length + ' error(s)')
  process.exit(1)
}
console.log('\nthe Legend leads the screen, and practice is one tap away')
