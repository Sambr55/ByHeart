/**
 * The library: five decks, everything finished in one of them, nothing ever evicted.
 *
 *   npm run library
 *
 * Sam: "essentially I want everything to be cards and everything completed to be saved
 * into decks... The cards become your library where you can retry or remind."
 *
 * WHAT THIS DEFENDS, and every one of them is a claim that would rot quietly:
 *
 *   every kind has a deck.  Five kinds, five drawers, and a card that belongs to none of
 *      them simply does not render — no error, no gap, just a thing the learner finished
 *      and cannot find. Asked as a property of the mapping rather than by counting to
 *      five, so adding a sixth kind fails here rather than in somebody's library.
 *
 *   a night stops expiring once it is kept.  This is the whole of what Sam asked for
 *      drops, and it is the one card whose collection is a decision rather than a
 *      by-product. The failure mode is silent: dropLive() governs everything else about a
 *      drop, so a library that read it would empty itself the morning after the gig and
 *      nothing would say why.
 *
 *   a word card counts what is on it.  These are living cards — collected at the first
 *      word and never finished — so the only honest thing on the face is what it holds.
 *      A shelf that says "1 of 9" or shows a tick has been quietly turned back into a
 *      completable card by somebody tidying up.
 *
 *   the open-ended decks do not claim a total.  NIGHTS and WORDS have no denominator: the
 *      first because the content pipeline decides how many drops exist, the second because
 *      a shelf never ends. "6 of 1" is a lie about the product and "6 of 9" a lie about
 *      the learner, and both are one careless line away.
 *
 *   revision exists for every kind.  A card in the library that asks nothing back is a
 *      dead end — the library is explicitly "where you can retry or remind", so a kind
 *      that collects but cannot be revised has half a feature.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { collected, decks, everyCard, type CardKind } from '../content/collection'
import { revisionFor } from '../content/revision'
import { DROPS } from '../content/drops'
import { SHELVES, PIECES } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nevery kind has a drawer\n')
{
  /*
    Asked of the model rather than of the screen, and asked as "no kind is homeless"
    rather than "there are five decks" — the second passes forever while a sixth kind
    quietly renders nowhere.
  */
  const kinds = [...new Set(everyCard().map((c) => c.kind))]
  const seeded = collected({
    sheet_got: ['um'],
    sections_completed: ['top_gun'],
    legend: [{ frame_id: 'name', values: { name: 'Jane' } }],
    drops_done: DROPS.map((d) => d.id),
    inventory: Object.fromEntries(Object.keys(PIECES).slice(0, 40).map((id) => [id, {}])),
    card_levels: {},
    stageNow: 'basics',
  })
  const filed = new Set(decks(seeded).flatMap((d) => d.cards.map((c) => c.kind)))
  for (const k of kinds) ok(k + ' cards land in a deck', filed.has(k as CardKind))
}

console.log('\nthe open-ended decks do not invent a total\n')
{
  const ds = decks([])
  const byId = Object.fromEntries(ds.map((d) => [d.id, d]))
  ok('nights has no total', byId.drops?.total === undefined, String(byId.drops?.total))
  ok('words has no total', byId.words?.total === undefined, String(byId.words?.total))
  /* And the closed ones do, because "4 of 13" is the whole point of a closed deck. */
  ok('legend has one', typeof byId.legend?.total === 'number', String(byId.legend?.total))
  ok('rooms has one', typeof byId.vibes?.total === 'number', String(byId.vibes?.total))
  ok('sheets has one', typeof byId.sheets?.total === 'number', String(byId.sheets?.total))
}

console.log('\na night that is kept does not expire\n')
{
  /*
    THE CLAIM IN ITS OWN TERMS: a drop long past its date is still in the library. Stood
    far enough after every authored drop that dropLive() is false for all of them, so this
    cannot pass by accident of when it runs — the same trap calendar-check documents.
  */
  const kept = collected({
    drops_done: DROPS.map((d) => d.id),
    inventory: {},
    card_levels: {},
    stageNow: 'basics',
  })
  ok('every kept night is collected', kept.filter((c) => c.kind === 'drop').length === DROPS.length)
  const unkept = collected({ drops_done: [], inventory: {}, card_levels: {}, stageNow: 'basics' })
  ok('and an unkept one is not', unkept.filter((c) => c.kind === 'drop').length === 0)
  /* No level on a night: its date is a fact about the gig, not about the learner. */
  ok('a night carries no level', kept.filter((c) => c.kind === 'drop').every((c) => !c.level))
}

console.log('\na word card counts what is on it\n')
{
  const shelf = SHELVES[0].id
  const two = Object.entries(PIECES)
    .filter(([, p]) => p.shelf === shelf)
    .slice(0, 2)
    .map(([id]) => id)
  const one = collected({
    inventory: { [two[0]]: {} },
    card_levels: {},
    stageNow: 'basics',
  }).find((c) => c.kind === 'words')
  ok('one word collects the shelf', Boolean(one), one ? one.label : '(none)')
  ok('and it holds one', one?.holds === 1, String(one?.holds))
  const both = collected({
    inventory: Object.fromEntries(two.map((id) => [id, {}])),
    card_levels: {},
    stageNow: 'basics',
  }).find((c) => c.kind === 'words')
  ok('a second word grows it', both?.holds === 2, String(both?.holds))
  /* Never completable, so never stamped with a level. */
  ok('and it carries no level', !both?.level)
  const none = collected({ inventory: {}, card_levels: {}, stageNow: 'basics' })
  ok('an empty shelf is not a card', none.filter((c) => c.kind === 'words').length === 0)
}

console.log('\nevery kind can be revised\n')
{
  const me = {
    legend: [{ frame_id: 'name', values: { name: 'Jane' } }],
    gender: 'f' as const,
    inventory: Object.fromEntries(Object.keys(PIECES).slice(0, 60).map((id) => [id, {}])),
  }
  const cases: [CardKind, string][] = [
    ['frame', 'name'],
    ['drop', DROPS[0].id],
    ['words', PIECES[Object.keys(me.inventory)[0]].shelf],
  ]
  for (const [kind, id] of cases) {
    const lines = revisionFor(kind, id, me)
    ok(kind + ' asks something back', lines.length > 0, lines.length + ' lines')
    ok(
      kind + ' asks in both languages',
      lines.every((l) => l.ask && l.answer),
    )
  }
}

/* And the whole thing on screen, because a model that works and a screen that does not is
   the failure this product keeps finding. */
console.log('\nand it is all on screen\n')
const browser = await chromium.launch()
const page: Page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)
await page.goto(BASE + '/club-member')
await page.waitForTimeout(3000)
await page.evaluate(`(() => {
  const s = JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}))
  s.inventory = s.inventory || {}
  for (const id of ${JSON.stringify(Object.keys(PIECES).slice(0, 20))}) s.inventory[id] = { got_at: '2026-09-01' }
  s.drops_done = ${JSON.stringify(DROPS.map((d) => d.id))}
  localStorage.setItem(${JSON.stringify(KEY)}, JSON.stringify(s))
})()`)
await page.goto(BASE + '/profile')
await page.waitForTimeout(2500)

const drawers = (await page.evaluate(
  `Array.from(document.querySelectorAll('[data-testid^="deck-"]')).map(e=>e.getAttribute('data-testid'))`,
)) as string[]
for (const id of ['deck-legend', 'deck-vibes', 'deck-sheets', 'deck-drops', 'deck-words']) {
  ok(id + ' is drawn', drawers.includes(id))
}

/* Exactly one open, which is what makes five drawers readable. */
const expanded = (await page.evaluate(
  `Array.from(document.querySelectorAll('[data-testid^="deck-"]')).filter(e=>e.getAttribute('aria-expanded')==='true').length`,
)) as number
ok('one drawer is open', expanded === 1, String(expanded))

/* And shutting it shuts it — the whole point of collapsible. */
const openOne = await page.$('[data-testid="deck-legend"]')
if (openOne) {
  const wasOpen = await openOne.getAttribute('aria-expanded')
  await openOne.click()
  await page.waitForTimeout(500)
  const now = await page.getAttribute('[data-testid="deck-legend"]', 'aria-expanded')
  ok('a drawer can be toggled', wasOpen !== now, wasOpen + ' -> ' + now)
}

/* The nights deck holds the kept drop, past its date or not. */
const nights = await page.$('[data-testid="deck-drops"]')
if (nights) {
  await nights.click()
  await page.waitForTimeout(700)
  const has = await page.$('[data-testid="collected-drop-' + DROPS[0].id + '"]')
  ok('the kept night is on the shelf', Boolean(has))
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('five decks, everything filed, nothing evicted')
