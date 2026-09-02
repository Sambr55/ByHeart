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
  /*
    Past the one question that comes before the seven.

    The Legend now opens on "what brings you to Lisbon" for anybody who has not answered it
    — see docs/spec-club-first-run.md §05 — and this check is about the deck behind it, not
    about that screen. purpose-check owns the question itself, including that it is asked
    once and never again.
  */
  purpose: 'moving',
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

/*
  Saying it cold, and hearing it back.

  The cold beat called the parent's onDone straight out of onSolved, and the parent
  navigated — so the screen left in the same frame the sentence was finished. MiniBuild's
  banked row, the answer with its audio, was rendered and replaced too fast to read. It was
  the one screen in the product where the sentence is about the learner, and the one place
  they could never hear it said.

  Driven by tapping the pieces in order, which is what a person does now that the last one
  settles the line by itself.
*/
console.log('\nsaying your own sentence cold\n')
{
  await page.goto(BASE + '/legend')
  await page.waitForTimeout(1500)
  const card = await page.$('[data-testid^="legend-card-"]')
  if (card) {
    await card.click()
    await page.waitForTimeout(900)
    const mine = await page.$('[data-testid="legend-make-mine"]')
    if (mine) {
      await mine.click()
      await page.waitForTimeout(900)
      // Fill whatever the card asks for, so there is a sentence to say back.
      const fields = await page.$$('input[type="text"], input:not([type]), textarea')
      for (const f of fields) await f.fill('Sam')
      await page.waitForTimeout(400)
      const save = await page.$('[data-testid="legend-save"]')
      if (save && (await save.isEnabled())) {
        await save.click()
        await page.waitForTimeout(1400)

        const pool = await page.$('[data-testid="tile-pool"]')
        ok('it asks for it cold', Boolean(pool), 'no clues, tiles only')
        if (pool) {
          const answer = ((await page.getAttribute('[data-testid="tile-line"]', 'data-answer')) ?? '')
            .split(/\s+/)
            .filter(Boolean)
          for (const word of answer) {
            const tile = await page.$(
              '[data-testid="tile-pool"] button:has-text("' + word.replace(/"/g, '') + '")',
            )
            if (tile) {
              await tile.click()
              await page.waitForTimeout(100)
            }
          }
          await page.waitForTimeout(1300)
          const shown = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
          ok(
            'the sentence stays on screen once it is right',
            shown.includes(answer.join(' ')),
            answer.join(' '),
          )
          ok(
            'and it can be heard',
            Boolean(await page.$('[data-testid="audio"]')),
            'their own sentence, said back to them',
          )
          ok(
            'moving on is a decision, not a consequence',
            Boolean(await page.$('[data-testid="legend-cold-next"]')),
          )
        }
      }
    }
  }
}

console.log('\nyour children are children, not a count\n')
/*
  Back to the deck first.

  The section above finishes standing on a cold beat, not on the deck — so this walked
  straight into a fifteen-second wait for a card that was not on screen, and took the whole
  gate down with it. Each section starts from a known place rather than inheriting wherever
  the last one happened to stop.
*/
await page.goto(BASE + '/legend')
await page.waitForTimeout(1500)
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
