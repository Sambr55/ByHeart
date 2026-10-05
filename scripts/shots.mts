/**
 * The screenshots the walk-through shows, taken from the live product.
 *
 *   npm run shots        (with the dev server running)
 *
 * Sam, on putting the walk-through on the home page: "It does need to show a screenshot of
 * the Vibes selector and the Top Gun Talk to me Goose walk through for us to be able to put
 * it on the main home page (and maybe we use it as an ad in future)."
 *
 * THE OBJECTION TO SCREENSHOTS WAS RIGHT AND IS ANSWERED HERE. A picture of DUB inside DUB
 * goes stale the first time either screen is touched, and this product has been bitten by
 * exactly that before. What rots is a screenshot nobody can regenerate; one with a command
 * beside it is a build artefact like any other, and this is the command.
 *
 * BOTH ARE TAKEN FROM A REAL LEARNER, not from a fixture. /club-member builds a member in
 * one hit, and the vibes shelf then needs the road walked — otherwise /vibes shows the
 * jump-off screen, which is what the first run of this captured and is the reason the seed
 * below exists. The Goose card is the intro sequence's, so it is taken from a second,
 * untouched page: a member has already been through the showcase.
 *
 * FIVE NOW RATHER THAN TWO. Sam: "it needs to be seriously updated with screenshots. It
 * is too oblique at the moment and needs to lock into the proposition above the process."
 *
 * The walk used to name controls — FIND is for this, the cog is that — and a tour of the
 * furniture needs no pictures, because the control is on the screen behind the overlay.
 * The steps that make an ARGUMENT are the ones that need them: a stranger has not seen
 * the Legend being said, has never met a table, and has no idea the product has a voice
 * to choose. Those three are the proposition, and a sentence about each is a claim where
 * a picture of each is evidence.
 *
 * At deviceScaleFactor 2 and 390x844, which is the phone this product is designed on.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
const BASE = 'http://localhost:3111'
mkdirSync('public/walk', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.setDefaultTimeout(25000)
page.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0,110)))
await page.goto(BASE + '/club-member', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(5500)
// The road is walked, so /vibes shows the shelf rather than the jump-off.
await page.evaluate(([k]) => {
  const b = JSON.parse(localStorage.getItem(k as string) || '{}')
  b.roots_played = ['tb_hello_goodbye','tb_thank_you','jb_name','jb_english','bj_marrieds',
                    'tg_school','dd_wolf','bow_golden_years','ah_adoro','dd_like']
  b.sections_completed = ['the_basics','james_bond']
  localStorage.setItem(k as string, JSON.stringify(b))
}, ['byheart.learner.v1:' + pairId(DEFAULT_PAIR)] as const)

// 1 — the vibes selector.
await page.goto(BASE + '/vibes', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3200)
console.log('vibes shows:', await page.evaluate(`(() => {
  const m = document.querySelector('main')
  return ((m?m.textContent:'')||'').replace(/\\s+/g,' ').trim().slice(0,60)
})()`))
await page.screenshot({ path: 'public/walk/vibes.png' })

// 2 — Top Gun, the Goose unpack. It is the intro_vibes card, which lives in the showcase.
const fresh = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
fresh.setDefaultTimeout(25000)
await fresh.goto(BASE + '/club?in=1', { waitUntil: 'domcontentloaded' })
await fresh.waitForTimeout(3200)
for (let i = 0; i < 70; i++) {
  const there = await fresh.evaluate(`(() => {
    const s = Array.from(document.querySelectorAll('.snap-y > section'))
      .find(n => n.getAttribute('data-card') === 'intro_vibes')
    if (s && Math.abs(s.getBoundingClientRect().top) < 60) return true
    let n = document.querySelector('[data-rail]')
    while (n && n.scrollHeight <= n.clientHeight) n = n.parentElement
    ;(n || document.scrollingElement).scrollBy(0, (n || document.scrollingElement).clientHeight)
    return false
  })()`)
  if (there) break
  await fresh.waitForTimeout(300)
}
await fresh.waitForTimeout(2400)
console.log('goose shows:', await fresh.evaluate(`(() => {
  const s = Array.from(document.querySelectorAll('.snap-y > section'))
    .find(n => n.getAttribute('data-card') === 'intro_vibes')
  return s ? (s.innerText||'').replace(/\\s+/g,' ').trim().slice(0,66) : 'NOT FOUND'
})()`))
await fresh.screenshot({ path: 'public/walk/goose.png' })

/*
  3 — THE LEGEND BEING SAID, which is the product's whole first claim and the one thing a
  stranger has never seen. /legend?run=1 is the run-through: the sentence, the microphone,
  and the tiles under it.
*/
const legend = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
legend.setDefaultTimeout(25000)
await legend.goto(BASE + '/club-member', { waitUntil: 'domcontentloaded' })
await legend.waitForTimeout(5000)
await legend.goto(BASE + '/legend?run=1', { waitUntil: 'domcontentloaded' })
await legend.waitForTimeout(3200)
/* The run-through draws its own card rather than a SayItCard, so read the page. */
console.log('legend shows:', await legend.evaluate(`(() => {
  const m = document.querySelector('main') || document.body
  return ((m.textContent)||'').replace(/\\s+/g,' ').trim().slice(0,52)
})()`))
await legend.screenshot({ path: 'public/walk/legend.png' })

/*
  4 — A TABLE. The screen a stranger has no reason to imagine exists, and the one that
  answers "ex-pats are lazy, they defer to speaking their native language". The page opens
  on the photograph and the rule, which is exactly what the step is claiming.
*/
await legend.goto(BASE + '/table', { waitUntil: 'domcontentloaded' })
await legend.waitForTimeout(2800)
console.log('table shows:', await legend.evaluate(`(() => {
  const m = document.querySelector('main') || document.body
  return ((m.textContent)||'').replace(/\\s+/g,' ').trim().slice(0,60)
})()`))
await legend.screenshot({ path: 'public/walk/table.png' })

/*
  5 — THE MENTOR PICKER, taken from the walk itself. It is the only step with a real
  decision in it and the funniest thing in the product; a line about "you choose who it
  sounds like" is a claim, and four voices saying the same sentence is the joke landing.
*/
await legend.goto(BASE + '/profile?walk=1', { waitUntil: 'domcontentloaded' })
await legend.waitForTimeout(3000)
for (let i = 0; i < 14; i++) {
  const there = await legend.evaluate(`Boolean(document.querySelector('[data-testid="walk-mentors"]'))`)
  if (there) break
  await legend.click('[data-testid="walk-next"]').catch(() => {})
  await legend.waitForTimeout(420)
}
await legend.waitForTimeout(900)
console.log('mentors shows:', await legend.evaluate(`String(document.querySelectorAll('[data-testid^="mentor-"]').length) + ' mentors'`))
await legend.screenshot({ path: 'public/walk/mentors.png' })

await browser.close()
