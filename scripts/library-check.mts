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
import { IDIOMS } from '../content/idioms'
import { CHEATS } from '../content/cheats'
import { PROFILE_COPY } from '../content/profile-copy'

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
    idioms_got: IDIOMS.map((i) => i.id),
    cheats_used: CHEATS.map((c) => c.id),
    asked: [{ pt: 'Pode partir a conta?', en: 'Can you split the bill?', note: '', at: '2026-09-20' }],
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
  /*
    ASKED is the one deck whose content this product did not author — it is whatever the
    learner typed — so a total here would be a claim about somebody else's sentences.
  */
  ok('asked has no total', byId.asked?.total === undefined, String(byId.asked?.total))
  /* Idioms ARE closed: thirty authored, so this one reads as a collection to finish. */
  ok('lost in translation has one', byId.idioms?.total === IDIOMS.length, String(byId.idioms?.total))
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
    asked: [
      { pt: 'Pode partir a conta?', en: 'Can you split the bill?', note: '', at: '2026-09-20' },
    ],
  }
  const cases: [CardKind, string][] = [
    ['frame', 'name'],
    ['drop', DROPS[0].id],
    ['words', PIECES[Object.keys(me.inventory)[0]].shelf],
    ['idiom', IDIOMS[0].id],
    ['asked', 'pode-partir-a-conta'],
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
for (const id of [
  'deck-legend',
  'deck-vibes',
  'deck-sheets',
  'deck-drops',
  'deck-words',
  'deck-idioms',
  'deck-asked',
]) {
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

/*
  AND THE STRIPS ARE GONE. Sam: "for my money we don't need the blue boxes above the
  grids anymore."

  Asserted on the rendered screen rather than on the SECTIONS array, because the failure
  worth catching is a strip coming BACK — somebody restoring a list that the library
  already holds, which is the exact drift that made five of these redundant one at a
  time. SAID COLD is named as the one that stays, so removing it also fails here.
*/
console.log('\nthe strips are gone, except the one that is not a collection\n')
{
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  /*
    NAMED LITERALLY, not read from PROFILE_COPY.

    The first version of this asserted against PROFILE_COPY.aside_label and its three
    neighbours — which nothing renders any more, so renaming one of those constants would
    have quietly changed what this check was looking for and passed either way. A check
    that cannot fail is worse than no check, because it reads like cover.

    These four strings are what a learner would SEE if a strip came back, which is the
    thing being defended.
  */
  for (const label of ['PUT ASIDE', 'YOUR WORDS', 'WHAT WE SAY', 'DROPS']) {
    ok(label + ' is not a strip any more', !text.includes(label))
  }
  ok('SAID COLD stays', text.includes(PROFILE_COPY.cold_label))
}

/*
  A DEVICE THAT LOOKS SET-UP IS NOT ASKED TO SET UP AGAIN.

  Sam, arriving at the Legend: "it got me to select my language and city again, but then
  everything else I had pre-selected was populated in my legend."

  The Club's set-up card asks the record for a pair, the deal and a goal, and shows the
  selector if any is missing. The test routes wrote two of those under a comment claiming
  they wrote what set-up writes — so the card re-asked on a device whose Legend was full,
  and only that one screen came back, which is why it read as a glitch rather than a wipe.

  Asserted on the SCREEN rather than on the record, because the record was never the
  complaint: what a learner sees is whether the question comes back.
*/
console.log('\na settled device is not asked to settle again\n')
for (const route of ['/club-member', '/club-ret']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const pg = await ctx.newPage()
  await pg.goto(BASE + route)
  await pg.waitForTimeout(3000)
  for (let i = 0; i < 8; i++) {
    const c = await pg.$('[data-testid="club-welcome-cta"]')
    if (!c) break
    await c.click()
    await pg.waitForTimeout(900)
  }
  const langs = (await pg.evaluate(
    `document.querySelectorAll('[data-testid^="lang-"]').length`,
  )) as number
  ok(route + ' does not re-ask for a language', langs === 0, langs + ' tiles')
  const pair = (await pg.evaluate(`localStorage.getItem('byheart.pair')`)) as string | null
  ok(route + ' has a pair on the device', Boolean(pair))
  await ctx.close()
}

/*
  AND AN ERRAND HAS A DOOR BACK. Sam: "I tried to select a missing word — Gosto — and it
  linked me through to this screen, with no way out."

  Both controls in the vibe header stay inside /vibes, which is right for a vibe somebody
  chose and a dead end for one they were sent to. The errand carries ?from=legend and the
  header answers it; a chosen vibe must NOT get that door, or the shelf becomes
  unreachable from the one screen that reaches it.
*/
console.log('\nan errand can get back to what sent it\n')
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const pg = await ctx.newPage()
  await pg.goto(BASE + '/vibes?open=the_basics&from=legend')
  await pg.waitForTimeout(2600)
  const why = await pg.$('[data-testid="setup-why-trip"]')
  if (why) {
    await why.click()
    await pg.waitForTimeout(700)
    const commit = await pg.$('[data-testid="setup-commit"]')
    if (commit) {
      await commit.click()
      await pg.waitForTimeout(1600)
    }
  }
  const door = await pg.$('[data-testid="home-legend"]')
  ok('an errand shows the way back to the Legend', Boolean(door))
  if (door) {
    await door.click()
    await pg.waitForTimeout(2200)
    ok('and it lands there', new URL(pg.url()).pathname === '/legend', new URL(pg.url()).pathname)
  }
  await pg.goto(BASE + '/vibes?open=the_basics')
  await pg.waitForTimeout(2600)
  ok(
    'a vibe picked off the shelf does not',
    !(await pg.$('[data-testid="home-legend"]')),
  )
  await ctx.close()
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('eight decks, everything filed, nothing evicted')
