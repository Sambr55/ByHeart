/**
 * What a stranger sees, and what it costs them to look.
 *
 *   npm run firstrun
 *
 * The restructure in docs/spec-club-first-run.md. Four claims, and the second is the one
 * that took a wrong draft to find.
 *
 * THE CLUB IS THE FIRST THING. Not a corridor of five screens delivered to somebody who has
 * not seen a word of Portuguese and cannot skip any of it.
 *
 * NOTHING IS ASKED BEFORE ANYTHING IS SHOWN. The first draft of this opened on a wall of
 * locked cards, which assumes the reader has already decided to learn Portuguese and visit
 * Lisbon. They have not. A lock shown before a demonstration is just a wall.
 *
 * THE EXPLAINERS ARE IN THE FEED, interleaved rather than stacked, all pointing one way.
 *
 * AND ONE ROOM IS GIVEN AWAY. A showcase that only describes itself is a brochure, so the
 * first room somebody opens is theirs outright — and exactly one is, because a promise that
 * can be re-spent is not a promise.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { EXPLAINERS, EXPLAINER_CTA } from '../content/explainers'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** Every card in the rail, by its first line. */
async function rail(p: Page) {
  return (await p.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).map(s => (s.innerText || '').split('\\n')[0].trim())`,
  )) as string[]
}

const browser = await chromium.launch()

console.log('\nthe front door goes to the Club\n')
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE + '/')
  await page.waitForTimeout(2000)
  const cta = await page.$('[data-testid="landing-cta"]')
  ok('there is a way in', Boolean(cta))
  if (cta) {
    await cta.click()
    await page.waitForTimeout(2500)
    ok(
      'and it opens the Club, not a corridor',
      new URL(page.url()).pathname === '/club',
      new URL(page.url()).pathname,
    )
  }
  await page.close()
}

console.log('\nand a stranger can look at all of it\n')
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(BASE + '/club')
await page.waitForTimeout(2500)

const cards = await rail(page)
ok('there is a feed', cards.length > 6, cards.length + ' cards')

/*
  The opening pair, in order, with nothing between them.

  A feed decides what it is in two cards, and left to the ordinary rung ordering these two
  were "Getting a place at school" — correct, and an absurd opening line for somebody who
  has not said they are moving anywhere.

  One obviously useful and one obviously fun, because either alone argues for a different
  product: a feed of Lisbon rooms is a phrasebook with photographs, and a feed of film
  quotes is a party trick. Index 0 is the loop's clone of the last card, so the real first
  is 1.
*/
const titles = (await page.evaluate(
  `Array.from(document.querySelectorAll('.snap-y > section')).map(s => {
    const t = (s.innerText || '').split('\\n').filter(Boolean)
    return (t[0] || '') + ' — ' + (t[1] || '')
  })`,
)) as string[]
ok('it opens on something obviously useful', /The pharmacy/.test(titles[1] ?? ''), titles[1] ?? '')
ok(
  'and then on a vibe, with nothing between them',
  /A VIBE/.test(titles[2] ?? ''),
  titles[2] ?? '',
)
ok(
  'nothing is asked before anything is shown',
  !/purpose-|deal|accept/i.test((await page.textContent('main')) ?? ''),
  'no form in front of the demonstration',
)

/*
  Interleaved, not stacked. Four explanations in a row is a corridor with swipes instead of
  taps, which is the thing this replaces.
*/
const eyebrows = EXPLAINERS.map((e) => e.eyebrow)
const at = cards.map((c, i) => (eyebrows.includes(c) ? i : -1)).filter((i) => i >= 0)
ok('the explainers are in it', at.length >= 3, at.length + ' of ' + EXPLAINERS.length)
ok(
  'and none of them are adjacent',
  at.every((n, i) => i === 0 || n - at[i - 1] > 1),
  'positions ' + at.join(', '),
)
ok(
  'real Lisbon content is between them',
  cards.filter((c) => !eyebrows.includes(c)).length > at.length,
  'the shop, not just the sign',
)

console.log('\nevery explainer points the same way\n')
{
  const detail = await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).map(s => s.innerText || '').filter(t => ${JSON.stringify(eyebrows)}.some(e => t.startsWith(e))).join(' ~~ ')`,
  ) as string
  const links = (detail.match(new RegExp(EXPLAINER_CTA, 'g')) ?? []).length
  ok('one destination, several reasons', links >= 3, links + ' cards carry it')
}

console.log('\none room is given away, and exactly one\n')
const first = await page.$('[data-testid="card-continue"]')
ok('a room can be opened', Boolean(first))
if (first) {
  await first.click()
  await page.waitForTimeout(1500)
  const shown = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok(
    'and it opens the whole way',
    /WHAT TO SAY/.test(shown),
    'a showcase that only describes itself is a brochure',
  )
  const tasted = (await page.evaluate(
    `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').tasted } catch { return null } })()`,
  )) as string | null
  ok('the gift is recorded', Boolean(tasted), String(tasted))

  /*
    The next one is teased, and the tease withholds capability rather than information.
    Reading that your landlord has kept the deposit costs nothing; knowing what to say back
    is the product.
  */
  await page.evaluate(`(() => { const r = document.querySelector('.snap-y'); if (r) r.scrollTop += r.clientHeight * 2 })()`)
  await page.waitForTimeout(1200)
  const another = await page.$('[data-testid="card-continue"]')
  if (another) {
    await another.click()
    await page.waitForTimeout(1400)
    const second = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
    ok(
      'the next one is teased instead',
      /What to say arrives with your Legend/.test(second),
      'one, ever',
    )
    ok(
      'and the tease still says what the moment is',
      /THE MOMENT/.test(second),
      'withholding capability, not information',
    )
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na stranger is shown the product before being asked for anything')
