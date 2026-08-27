/**
 * Building a Legend should feel like a conversation, not like filing.
 *
 *   npm run legend:flow
 *
 * Answering one card used to return you to a deck of ten to choose the next from, which
 * turned seven questions into seven decisions about which question to answer. Nobody
 * choosing between "Do you have children?" and "What do you do?" is making a meaningful
 * choice — they are doing the app's filing, between every answer, and it is why building
 * one was reported as laborious.
 *
 * Needs the dev server. Everything else about the Legend is checked without a browser;
 * this is about what it is like to use, which is not visible in the data.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_FRAMES } from '../content/legend'
import { CRATES, ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** Enough vibes behind them that every card is open. */
const opener = ROOTS.find((r) => r.rung === 1)
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: opener
    ? [{ pt: opener.transfer_prompt.answer, en: opener.transfer_prompt.ask, source: 'release', clean: true, at: '1' }]
    : [],
  inventory: Object.fromEntries(ROOTS.flatMap((r) => r.extracts).map((e) => [e.id, 'strong'])),
  roots_played: [],
  sections_completed: CRATES.filter((c) => !c.drop).slice(0, 6).map((c) => c.id),
  legend: [],
  saved: [],
  liked: [],
  finished_cards: [],
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
page.setDefaultTimeout(15000)

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)
await page.goto(BASE + '/legend')
await page.waitForTimeout(1800)

console.log('\nit runs on\n')
/** Open a card, get past the ask beat, and read which question it is. */
async function into(): Promise<string> {
  await page.waitForSelector('[data-testid="legend-ask"]')
  const ask = ((await page.textContent('[data-testid="legend-ask"]')) ?? '').trim()
  await page.click('[data-testid="legend-make-mine"]')
  await page.waitForSelector('[data-testid="legend-skip"]')
  return ask
}

const first = LEGEND_FRAMES[0].id
await page.click('[data-testid="legend-card-' + first + '"]')
const one = await into()
ok('a card opens', Boolean(one), one)

/*
  Leaving one empty is the quickest honest way through a card, and it is the path most
  likely to be taken more than once — so it is the one that matters most for the flow.
*/
await page.click('[data-testid="legend-skip"]')
await page.waitForTimeout(1400)
ok(
  'finishing it opens the next question, not the deck',
  Boolean(await page.$('[data-testid="legend-ask"]')),
  'still on a card',
)
const two = await into()

await page.click('[data-testid="legend-skip"]')
await page.waitForTimeout(1400)
const three = await page.$('[data-testid="legend-ask"]')
  ? ((await page.textContent('[data-testid="legend-ask"]')) ?? '').trim()
  : ''
ok('and it keeps going', Boolean(three))
ok('a different question each time', one !== two && two !== three, [one, two, three].join(' → '))
await page.click('[data-testid="legend-make-mine"]')
await page.waitForSelector('[data-testid="legend-stop"]')

console.log('\nand it can be stopped\n')
ok('there is a way out', Boolean(await page.$('[data-testid="legend-stop"]')))
const stop = ((await page.textContent('[data-testid="legend-stop"]')) ?? '').trim()
// A shape, never a score. "Three more when you want them", not "4/7" with a bar behind it.
ok('said as a sentence, not a tally', !/\d+\s*\/\s*\d+/.test(stop), stop)
await page.click('[data-testid="legend-stop"]')
await page.waitForTimeout(1200)
ok(
  'stopping goes back to the deck',
  Boolean(await page.$('[data-testid="legend-card-' + first + '"]')),
)

console.log('\nyour children are children, not a count\n')
await page.click('[data-testid="legend-card-children"]')
await page.waitForTimeout(1200)
// The ask beat comes first; the build beat is where the rows live.
const build = await page.$('[data-testid="legend-make-mine"]')
if (build) await build.click()
await page.waitForTimeout(800)
ok('there is a way to add one', Boolean(await page.$('[data-testid="kid-add"]')))
await page.click('[data-testid="kid-add"]')
await page.waitForTimeout(400)
await page.fill('[data-testid="kid-name-0"]', 'Tilly')
await page.click('[data-testid="kid-f-0"]')
await page.fill('[data-testid="kid-age-0"]', '9')
await page.click('[data-testid="kid-add"]')
await page.waitForTimeout(400)
await page.fill('[data-testid="kid-name-1"]', 'Bea')
await page.click('[data-testid="kid-f-1"]')
await page.waitForTimeout(600)
const preview = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
ok('both names are in the sentence', preview.includes('Tilly') && preview.includes('Bea'), '')
ok(
  'and two girls are duas filhas',
  preview.includes('duas filhas'),
  (preview.match(/Tenho[^.]*\./) ?? ['?'])[0],
)

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\none question leads to the next, and your children are your own')
