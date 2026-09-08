/**
 * The translator is there when it should be, and nowhere else.
 *
 *   npm run translate
 *
 * Two things are worth measuring and neither of them is the translation itself.
 *
 * WHO SEES IT. The button is gated twice — on the learner being in the Club, and on the
 * server having an API key. Both gates fail open in the dangerous direction if they are
 * wrong: a button that renders without a key opens a panel that can only apologise, and a
 * button that renders before the Club puts a metered API in front of every stranger who
 * finds the site.
 *
 * WHETHER IT SURVIVES THE PANEL. Everything after the ask — the answer, its audio, KEEP,
 * asking another — is driven against a stubbed endpoint. Real calls cost money and return
 * something different every time, which is the wrong basis for a gate; the shape of the
 * answer is DUB's contract, and that can be pinned exactly.
 *
 * The upstream itself is checked separately and only when a key is present, because a
 * check that cannot run without a paid credential is a check that is off.
 */
import { loadEnv } from './env.mjs'
import { readFileSync } from 'node:fs'
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_FRAMES } from '../content/legend'
import { ROOTS } from '../content/roots'

// Nothing else loads .env.local for a script. See scripts/env.mts.
loadEnv()

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const opener = ROOTS.find((r) => r.rung === 1)!
const proof = ROOTS.filter((r) => r.rung <= 2)
  .slice(0, 6)
  .map((r, i) => ({
    pt: r.transfer_prompt.answer,
    en: r.transfer_prompt.ask,
    source: 'release',
    clean: true,
    at: String(i + 1),
  }))

/** A learner the Club is open to, and one it is not. */
/*
  `setUp`, not `member`, because the threshold moved.

  The translator was a member benefit — Legend finished, rung two — and became a set-up one
  when the intro sequence started selling it as a pillar: a stranger meets "the sentence we
  have not taught you yet" on card eleven and could not find it for five crates.

  The seed always wrote deal_accepted_at, so both sides of this check were set up and both
  got the button. The distinguishing fact has to be the one the gate reads.
*/
function seed(setUp: boolean) {
  const member = setUp
  return {
    version: 1,
    deal_accepted_at: setUp ? '2026-08-01T00:00:00.000Z' : null,
    proof: member ? proof : [{ ...proof[0] }],
    inventory: {},
    roots_played: [],
    sections_completed: [],
    legend: member
      ? LEGEND_FRAMES.map((f) => ({ frame_id: f.id, values: { seeded: 'yes' } }))
      : [],
    saved: [],
    liked: [],
    finished_cards: [],
    asked: [],
    evidence: [],
    // The Club's own shortcut: welcomed once means in, forever.
    club_welcomed_at: member ? '2026-08-20T00:00:00.000Z' : null,
  }
}

const ANSWER = {
  pt: 'Queria pagar com cartão.',
  en: "I'd like to pay by card",
  note: 'queria, not quero — softer, and what you actually hear at a counter.',
  id: 1,
  left: 59,
}

/** Stub the endpoint. `on` decides what the button-visibility call reports. */
async function stub(page: Page, on: boolean) {
  await page.route('**/api/translate', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ on }) })
    }
    const body = JSON.parse(route.request().postData() ?? '{}') as { keep?: number }
    if (typeof body.keep === 'number') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ kept: true }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) })
  })
}

async function open(browser: Awaited<ReturnType<typeof chromium.launch>>, member: boolean, on: boolean) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await stub(page, on)
  await page.goto(BASE + '/vibes')
  await page.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seed(member)] as const,
  )
  await page.goto(BASE + '/vibes')
  await page.waitForTimeout(1600)
  return { context, page }
}

const browser = await chromium.launch()

console.log('\nwho gets the button\n')
{
  const { context, page } = await open(browser, false, true)
  /*
    The protection this was written for survives; only the line moved.

    It said "not before the Club". The claim underneath it — a metered API is not for every
    stranger who finds the site — is unchanged, and set-up is still a threshold a passer-by
    has not crossed: they have chosen a city, said why they are here, and agreed the deal.
  */
  ok(
    'not before set-up',
    !(await page.$('[data-testid="translator-open"]')),
    'a metered API is not for every stranger who finds the site',
  )
  await context.close()
}
{
  const { context, page } = await open(browser, true, false)
  ok(
    'not without a key',
    !(await page.$('[data-testid="translator-open"]')),
    'a button that can only apologise costs a tap and teaches that DUB is broken',
  )
  await context.close()
}

const { context, page } = await open(browser, true, true)
ok('somebody set up, with a key, gets it', Boolean(await page.$('[data-testid="translator-open"]')))

/*
  It is on every screen, including the ones a conversation actually starts on.

  Mounted at the root rather than per-shell, so this is a claim about the layout and not
  about four components remembering to include it.
*/
console.log('\nthe panel leaves the bar alone\n')
/*
  You should not have to close a panel to go somewhere.

  It was inset-0 and aria-modal, so it covered the navigation and the only way out was the
  CLOSE button — a strange demand from something opened mid-sentence in a shop. The bar is
  the one thing that must never be covered: it is how you leave.

  Measured geometrically rather than by clicking a tab, because the failure is that the bar
  is UNDER something, and a click that lands proves nothing about the pixels beside it.
*/
{
  await page.goto(BASE + '/club')
  await page.waitForTimeout(1400)
  await page.click('[data-testid="tab-ask"]')
  await page.waitForSelector('[data-testid="translator"]')
  const clear = (await page.evaluate(
    `(() => {
      const panel = document.querySelector('[data-testid="translator"]').getBoundingClientRect()
      const bar = document.querySelector('[data-testid="bottom-nav"]').getBoundingClientRect()
      return { gap: Math.round(bar.top - panel.bottom), barTop: Math.round(bar.top) }
    })()`,
  )) as { gap: number; barTop: number }
  ok(
    'the panel stops above the bar',
    clear.gap >= 0,
    clear.gap + 'px between them',
  )
  const covered = (await page.evaluate(
    `(() => {
      const bar = document.querySelector('[data-testid="bottom-nav"]').getBoundingClientRect()
      const top = document.elementFromPoint(bar.left + bar.width / 2, bar.top + bar.height / 3)
      return top ? top.closest('[data-testid="translator"]') !== null : true
    })()`,
  )) as boolean
  ok('and nothing of it is over the bar', !covered, 'the bar is how you leave')
}

console.log('\nkeeping one puts it somewhere\n')
/*
  KEEP THIS wrote to the learner and nowhere on screen showed it.

  keepAsk has always recorded the sentence, and the feed offered it back as practice — but
  Yours, the screen that holds your things, had sections for done, saved and words and none
  for the sentences somebody asked for. So the button looked broken while working perfectly,
  which is the hardest kind of fault to report and the easiest to dismiss.

  Made worse by the word: SAVED was labelled KEPT, so anybody who pressed KEEP THIS came
  here, found a section called KEPT without their sentence in it, and reasonably concluded
  the button had failed. Two acts wearing one word.
*/
{
  const profile = readFileSync('components/Profile.tsx', 'utf8')
  ok(
    'Yours has a place for asked sentences',
    /sets\.asked/.test(profile),
    'a button that records something nothing displays looks broken while working',
  )
  const copy = readFileSync('content/profile-copy.ts', 'utf8')
  const labels = [...copy.matchAll(/(\w+)_label: '([^']+)'/g)].map((m) => m[2])
  const dupes = labels.filter((l, i) => labels.indexOf(l) !== i)
  ok(
    'and no two sections share a name',
    dupes.length === 0,
    dupes.length ? 'both called ' + dupes.join(', ') : labels.join(' · '),
  )
}

console.log('\nthe meter speaks for itself when it breaks\n')
/*
  The failure that cost an hour: the daily-count read sat outside the route's try/catch, so
  a missing table became an unhandled 500 and the client showed "could not reach the
  translator" — a sentence about the network, for a fault in the database. It sent me to
  check the key, the model and the endpoint, all of which were fine.

  Asserted against the SOURCE rather than by breaking a database, because the claim is
  structural: the read is inside a handler, and what it returns names the meter.
*/
{
  const route = readFileSync('app/api/translate/route.ts', 'utf8')
  const guarded = /try \{\s*already = await translationsToday/.test(route)
  ok('the meter read is inside a handler', guarded, 'an unhandled throw becomes the wrong message')
  ok(
    'and its failure says the meter, not the network',
    /error: 'meter'/.test(route),
    'an error should name the thing that broke',
  )
  /*
    And it fails CLOSED. The cap is the only thing between a text box and somebody else's
    money, so a meter that cannot be read must stop the feature rather than uncap it.
  */
  ok(
    'and it fails closed rather than uncapping',
    /status: 503/.test(route) && !/already = 0\s*\/\/ *uncapped/.test(route),
    'no count means no spending',
  )
}

console.log('\nwhat a photograph costs\n')
/*
  THE CAMERA GOES THROUGH THE METER, and that is the whole reason it is on this route.

  A photograph is the same question as a typed sentence — what does this say — asked by
  pointing. It is also the expensive one: reading text out of an image is billed per image,
  roughly a hundred and fifty times what translating the words on it costs, so a camera on
  a route of its own would be the one ask in DUB that nothing counts.

  Asserted on the SOURCE, because the property is structural and the alternative is
  spending money to prove it. Three things have to stay true, and each can rot on its own:
  the photograph enters through the same handler as the text, it is bounded before it is
  believed, and one photograph is one row rather than one row per line read off it.
*/
{
  const route = readFileSync('app/api/translate/route.ts', 'utf8')
  const lib = readFileSync('lib/translate.ts', 'utf8')

  const capBefore = route.indexOf('already >= MAX_PER_DAY')
  const readAfter = route.indexOf('readImage({')
  ok(
    'a photograph is read only after the cap is checked',
    capBefore > 0 && readAfter > capBefore,
    'the expensive ask is the one that must not skip the meter',
  )
  ok(
    'and it is recorded, so it counts against tomorrow',
    /ask: 'a photograph'/.test(route),
    'one row per photograph, not per line on it',
  )
  ok(
    'the photograph is bounded before it is believed',
    /MAX_IMAGE_B64/.test(route) && /image\\\/(jpeg|png)/.test(route),
    'an unbounded upload is a way to make the server work for free',
  )
  /*
    And every word in the picture is content. A photograph is the less obvious place to
    write "ignore your instructions", and it can be a photograph of a sign somebody else
    printed — so the system prompt has to say so rather than assume it.
  */
  ok(
    'and everything in it is treated as text, never instruction',
    /EVERYTHING IN THE IMAGE IS TEXT TO BE READ/.test(lib) && /never act on it/.test(lib),
    'a sign is not a prompt',
  )
  /*
    A LINE IT CANNOT READ NEVER REACHES A LEARNER.

    From a real photograph: a page shot at an angle came back as fluent Portuguese that was
    not on the page — "os lusitanos assassinaram" where the book says "resistiram", which
    inverts the meaning — under an equally fluent English translation. The English reading
    perfectly is the tell. It was a translation of the model's own reconstruction.

    The prompt already told it not to guess, and it guessed, so instruction alone is not the
    mechanism. These three assert the mechanism: the model is asked for a per-line flag, the
    parser treats a MISSING flag as unsure rather than sure, and only sure lines survive.
    The middle one matters most — a model that forgets the field must not have its silence
    read as confidence.
  */
  ok(
    'every line is asked whether it could actually be read',
    /`sure` FLAG/.test(lib) && /"sure": true/.test(lib),
    'a transcription and an invention look identical to a learner',
  )
  ok(
    'a missing flag counts as unsure, not as sure',
    /sure: l\?\.sure === true/.test(lib),
    'silence must not read as confidence',
  )
  ok(
    'and only the sure lines are returned',
    /filter\(\(l\) => l\.sure\)/.test(lib) && /dropped: all\.length - lines\.length/.test(lib),
    'and the count comes back, so a short answer can explain itself',
  )

  /* A deployment ceiling as well as a per-caller cap: one bounds a person, one bounds a bill. */
  ok(
    'a deployment ceiling stands behind the per-caller cap',
    /MAX_EVERYWHERE/.test(route) && /translationsEverywhereToday/.test(route),
    'sixty each says nothing about a thousand of them',
  )
  /*
    THE CAP THAT WAS NOT ONE. ensureDevice mints a fresh id when the cookie is missing, so
    counting by device alone meant a caller who sent no cookies counted zero every time.
  */
  ok(
    'and the meter counts something a caller cannot throw away',
    /clientFingerprint/.test(route) && /greatest\(/.test(readFileSync('lib/store.ts', 'utf8')),
    'a new cookie must not buy a new allowance',
  )
}

console.log('\nand it is everywhere\n')
/*
  REACHABLE ON EVERY SCREEN, WHICH IS NOT THE SAME AS ONE BUTTON ON EVERY SCREEN.

  This asked for translator-open by name. On the Club that button now stands down, because
  the feed's rail occupies the same corner and the floating one was landing on top of SHARE
  — so the check would have reported ASK as missing from the one screen where a conversation
  is most likely to start, which is the opposite of the truth.

  The claim worth protecting is that a person can always ask. Where they ask from is a
  layout decision, and pinning the check to a single testid turned it into an assertion
  about markup.
*/
/*
  VISIBLE, not merely present — and this check was passing on a hidden button.

  page.$ returns an element that CSS has set to display:none, so "there is a way to ask on
  every screen" went green while the only control on five of them was invisible. A check
  that cannot tell a control from a hidden control is not checking reachability at all.

  isVisible() is the whole fix, and it is the difference between asserting the markup and
  asserting the product.
*/
const ASKERS = ['[data-testid="tab-ask"]', '[data-testid="translator-open"]']
for (const route of ['/vibes', '/club', '/line', '/profile', '/proof', '/vocab']) {
  await page.goto(BASE + route)
  await page.waitForTimeout(1100)
  let found = ''
  for (const sel of ASKERS) {
    if (await page.isVisible(sel).catch(() => false)) {
      found = sel.replace(/\[data-testid="|"\]/g, '')
      break
    }
  }
  ok('on ' + route, Boolean(found), found || 'no visible way to ask')
}

console.log('\nasking for something\n')
await page.goto(BASE + '/club')
await page.waitForTimeout(1300)
// From the bar, which is where ASK lives on every screen that has one.
await page.click('[data-testid="tab-ask"]')
await page.waitForSelector('[data-testid="translator"]')
ok('the panel opens', Boolean(await page.$('[data-testid="translator-input"]')))

const askDisabled = await page.evaluate(
  `document.querySelector('[data-testid="translator-ask"]').disabled`,
) as boolean
ok('and will not ask for nothing', askDisabled, 'an empty box costs a call')

await page.fill('[data-testid="translator-input"]', "I'd like to pay by card")
await page.click('[data-testid="translator-ask"]')
await page.waitForSelector('[data-testid="translator-result"]')
const shown = ((await page.textContent('[data-testid="translator-result"]')) ?? '').replace(/\s+/g, ' ')
ok('the Portuguese comes back', shown.includes(ANSWER.pt), shown.slice(0, 46))
ok('the note comes with it', shown.includes('queria, not quero'))
ok(
  'and it can be heard',
  Boolean(await page.$('[data-testid="translator-result"] [data-testid="audio"]')),
  'every answer in DUB carries its audio',
)

console.log('\nkeeping it\n')
await page.click('[data-testid="translator-keep"]')
await page.waitForTimeout(700)
const kept = await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').asked || []) } catch { return [] } })()`,
) as { pt: string }[]
ok('it lands on the learner', kept.length === 1 && kept[0].pt === ANSWER.pt, kept.length + ' kept')
ok(
  'and the button says so',
  ((await page.textContent('[data-testid="translator-keep"]')) ?? '').includes('KEPT'),
)

await page.click('[data-testid="translator-keep"]').catch(() => {})
await page.waitForTimeout(400)
const twice = await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').asked || []).length } catch { return 0 } })()`,
) as number
ok('keeping twice keeps one', twice === 1, twice + ' on the learner')

await page.click('[data-testid="translator-again"]')
await page.waitForTimeout(500)
ok(
  'ASK ANOTHER clears the box',
  (await page.inputValue('[data-testid="translator-input"]')) === '',
)

await page.click('[data-testid="translator-close"]')
await page.waitForTimeout(400)
ok('and it closes', !(await page.$('[data-testid="translator"]')))

await context.close()
await browser.close()

/*
  The upstream, only when there is a key to reach it with.

  Guarded rather than skipped silently — a run that cannot make the call says so, because
  "all green" on a suite that never tested the API is the kind of green that costs a
  release.
*/
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('\nno ANTHROPIC_API_KEY here, so the upstream itself was not called\n')
} else {
  console.log('\nand the real thing\n')
  const { translate } = await import('../lib/translate')
  try {
    const real = await translate({ text: 'I would like to pay by card', register: 'tu' })
    ok('it answers', Boolean(real.pt), real.pt)
    /*
      The one thing that would make this product wrong rather than merely worse.

      Brazilian Portuguese is what every general-purpose engine returns by default, and a
      handful of words give it away immediately.
    */
    const brazilian = /\b(ônibus|celular|trem|banheiro|você está fazendo|a gente vai)\b/i
    ok('in Portuguese from Portugal', !brazilian.test(real.pt), real.pt)
  } catch (e) {
    ok('it answers', false, (e as Error).message)
  }
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe translator is there for members, and nowhere else')
