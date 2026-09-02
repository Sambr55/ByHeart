/**
 * Does the shelf mean what it looks like?
 *
 *   npm run shelf        (needs a dev server)
 *
 * Two reports, one cause. Vibes already played "reappear as open", and other vibes are
 * "clickable but not white highlighted". Both are the shelf's appearance having come
 * loose from its behaviour:
 *
 *   a plan-locked card took the last styling branch and came out pixel-identical to an
 *   open one, while a tap on it left the shelf entirely for /pro;
 *
 *   a finished or waiting card was dimmed to 70% and stayed perfectly tappable;
 *
 *   and "finished" means every root played — three to five sessions for most vibes —
 *   while the session screen said "emptied out" after one, so a vibe somebody remembers
 *   completing came back at full brightness with nothing on it saying why.
 *
 * The rule this enforces is the one that was never written down: BRIGHTNESS MEANS A TAP
 * OPENS THE VIBE. Anything else is dimmed, and anything dimmed does something other than
 * open the vibe — or nothing at all.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const spending = CRATES.filter((c) => !c.drop && c.built !== false)

function seed(rootIds: string[], sections: string[]) {
  const opener = ROOTS.find((r) => r.rung === 1)
  return {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    proof: opener
      ? [{ pt: opener.transfer_prompt.answer, en: opener.transfer_prompt.ask, source: 'release', clean: true, at: '1' }]
      : [],
    inventory: {},
    roots_played: rootIds,
    sections_completed: sections,
  }
}

/** Every card on the shelf, with how it looks and what it will do. */
/**
 * Wait for the shelf to exist, rather than for a number of milliseconds.
 *
 * Every read here used to follow a fixed pause tuned on localhost, where the whole page is
 * a few milliseconds away. Run against production and 1200ms lands before the tiles do, so
 * `cards()` returns an empty list and the check reports that the shelf is empty and every
 * vibe is locked — a catastrophic-looking failure produced entirely by network latency.
 *
 * Waiting for the thing being measured is both correct and faster: it returns the moment
 * the tiles are there instead of always paying the worst case.
 */
/**
 * Put a learner on a device, and make sure it stayed there.
 *
 * The obvious sequence — goto, write localStorage, goto again — has a race in it that is
 * invisible on localhost and decisive over the network. On the first load the app boots
 * and writes its own empty default learner. Locally that happens in under a hundred
 * milliseconds, comfortably before the write; against production the boot lands AFTER it,
 * so the app's empty record overwrites the seed and the second navigation reads a device
 * that has never done anything.
 *
 * The symptom is a check reporting that the shelf is empty and every vibe is locked, on a
 * product that is fine — which is exactly what happened, and which I diagnosed wrongly
 * three times before finding this.
 *
 * So the seed is written and then CONFIRMED, with one retry. Reading back what you wrote is
 * cheap; trusting a write you raced for is not.
 */
async function seedInto(page: Page, blob: unknown) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(BASE + '/vibes')
    await page.waitForTimeout(attempt * 800)
    await page.evaluate(
      ([k, pair, s]) => {
        localStorage.setItem('byheart.pair', JSON.stringify(pair))
        localStorage.setItem(k as string, JSON.stringify(s))
      },
      [KEY, DEFAULT_PAIR, blob] as const,
    )
    await page.goto(BASE + '/vibes')
    await page.waitForTimeout(600)
    const stuck = (await page.evaluate(
      `(() => { try { return Boolean(JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').deal_accepted_at) } catch { return false } })()`,
    )) as boolean
    if (stuck) return
  }
  console.log('  · the seed would not stick — the app kept overwriting it')
}

async function shelfReady(page: Page) {
  try {
    await page.waitForSelector('[data-testid^="vibe-"]', { timeout: 20000 })
  } catch {
    /*
      Say what was on screen instead, rather than carrying on with nothing.

      Swallowing this and reading an empty shelf is how a latency problem gets reported as
      "every vibe is locked and the shelf is empty" — a catastrophic-looking finding about
      a product that is fine. If the tiles never arrive, the useful output is the screen
      that arrived instead.
    */
    const where = page.url()
    /*
      main, not body.

      textContent('body') includes the text of inline <script> tags, and Next puts its
      flight payload in one — so every page on earth "starts with (self.__next_f" and a
      body-text heuristic reports a perfectly rendered screen as never having hydrated. It
      cost me three wrong diagnoses in a row before I noticed the detector was the thing
      that was broken.
    */
    const what = ((await page.textContent('main').catch(() => '')) ?? '')
      .replace(/\s+/g, ' ')
      .slice(0, 140)
    console.log('  · no shelf at ' + where + ' — screen said: ' + (what || '(nothing)'))
  }
  // One frame past first paint, so the dimming that depends on the learner has settled.
  await page.waitForTimeout(400)
}

async function cards(page: Page) {
  return page.$$eval('main button', (els) =>
    els
      .map((el) => {
        const title = el.querySelector('.display')?.textContent?.trim() ?? ''
        if (!title) return null
        const s = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (!r.height) return null
        const img = el.querySelector('img')
        return {
          title,
          opacity: Number(s.opacity),
          /*
            Locked is a treatment, not an opacity.

            The shelf used to say "not yet" by turning the tile down — to 0.4, where a
            photograph is a grey rectangle, and then to 0.75, where nobody can tell. Both
            are the same mistake. It is a dashed border and a picture drained of colour now,
            so that is what this reads.
          */
          locked: s.borderStyle === 'dashed',
          drained: img ? getComputedStyle(img).filter !== 'none' : false,
          disabled: (el as HTMLButtonElement).disabled,
          badge: (el.textContent ?? '').includes('PRO') ? 'pro' : '',
        }
      })
      .filter(Boolean) as {
      title: string
      opacity: number
      locked: boolean
      drained: boolean
      disabled: boolean
      badge: string
    }[],
  )
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
page.setDefaultTimeout(15000)

// A learner who has played most of one vibe and claimed three, so every state is on
// screen at once: open, partly taken, plan-locked and ladder-locked.
const bond = (ROOTS_BY_FAMILY['james_bond' as never] ?? []) as { root_id: string }[]
const played = [
  ...bond.slice(0, 3).map((r) => r.root_id),
  ...(((ROOTS_BY_FAMILY['the_basics' as never] ?? []) as { root_id: string }[]).slice(0, 3).map((r) => r.root_id)),
  ...(((ROOTS_BY_FAMILY['bridget_jones' as never] ?? []) as { root_id: string }[]).slice(0, 2).map((r) => r.root_id)),
]

await seedInto(page, seed(played, ['the_basics', 'james_bond', 'bridget_jones']))
await shelfReady(page)

const list = await cards(page)
console.log('\n' + list.length + ' cards on the shelf\n')
for (const c of list) {
  console.log(
    '  ' + c.title.padEnd(34) + (c.locked ? 'not yet ' : 'open    ') +
      (c.drained ? 'drained' : 'colour ') + (c.badge ? '  [PRO]' : ''),
  )
}

console.log('\nfull colour means a tap opens the vibe\n')
const bright = list.filter((c) => !c.locked)
const dim = list.filter((c) => c.locked)

ok('there is something to open', bright.length > 0, bright.length + ' open')
ok(
  'nothing shown as open is disabled',
  bright.every((c) => !c.disabled),
  bright.filter((c) => c.disabled).map((c) => c.title).join(', '),
)
ok(
  'nothing shown as open is behind the paywall',
  bright.every((c) => c.badge !== 'pro'),
  bright.filter((c) => c.badge === 'pro').map((c) => c.title).join(', '),
)
// The other half, and the one that was missing: nothing you cannot open looks like you can.
ok(
  'and nothing locked looks open',
  dim.every((c) => c.drained),
  dim.filter((c) => !c.drained).map((c) => c.title).join(', '),
)
/*
  "Not yet" needs a signal somebody can name.

  This used to be `opacity < 0.85`, which passed at 0.75 — a difference nobody can see,
  next to a tile with no badge on it, on a shelf that was then reported as having every
  vibe open. An opacity threshold is not a test of whether a person can tell; it is a test
  of whether a number is below another number.

  So: a locked tile must differ by something you could point at — a drained picture or a
  chip saying which wall it is. Both, as it happens, but either would do.
*/
const locked = await page.$$eval('[data-testid^="vibe-"]', (els) =>
  els
    .map((el) => {
      const img = el.querySelector('img')
      const chip = el.querySelector('span[class*="rounded-full"]')
      return {
        id: el.getAttribute('data-testid') ?? '',
        title: (el.querySelector('.display')?.textContent ?? '').trim(),
        dashed: getComputedStyle(el).borderStyle === 'dashed',
        filtered: img ? getComputedStyle(img).filter !== 'none' : false,
        chip: (chip?.textContent ?? '').trim(),
      }
    })
    .filter((c) => c.dashed),
)
console.log('  ' + locked.length + ' shown as not yet open')
ok('something is shown as not yet open', locked.length > 0)
ok(
  'and every one of them is drained of colour',
  locked.every((c) => c.filtered),
  locked.filter((c) => !c.filtered).map((c) => c.title).join(', '),
)
ok(
  'and says which wall it is',
  locked.every((c) => c.chip.length > 0),
  locked.filter((c) => !c.chip).map((c) => c.title).join(', '),
)
// And the open one must not be wearing any of that, or the distinction says nothing.
const openTiles = await page.$$eval('[data-testid^="vibe-"]', (els) =>
  els
    .filter((el) => getComputedStyle(el).borderStyle !== 'dashed')
    .map((el) => {
      const img = el.querySelector('img')
      return {
        title: (el.querySelector('.display')?.textContent ?? '').trim(),
        filtered: img ? getComputedStyle(img).filter !== 'none' : false,
      }
    }),
)
ok(
  'while what IS open keeps its colour',
  openTiles.every((c) => !c.filtered),
  openTiles.filter((c) => c.filtered).map((c) => c.title).join(', '),
)

/*
  The wall you would hit FIRST is the one worth naming.

  Swearing opens at stage 6. It was filed under "Comes with Dub Pro" and captioned "tap
  to see what membership opens" — an invitation to pay for something paying would not
  unlock, on the most enticing card in the product. Money cannot move the ladder, so the
  ladder is named first.
*/
ok(
  'nothing behind the paywall is also behind the ladder',
  list.filter((c) => c.badge === 'pro').every((c) => !c.disabled),
  list.filter((c) => c.badge === 'pro' && c.disabled).map((c) => c.title).join(', '),
)

/*
  The doorway, for somebody who played the basics and never tapped the button.

  The state in the report: three basics roots played, sections_completed empty, because
  the only thing that writes it is the end-of-section screen and there are a dozen ways
  to leave before it — the header, a bookmark, the back gesture, closing the tab. Every
  other vibe sat behind "AFTER BASICS" while the basics card said "3 of 14 taken"
  directly above it.
*/
{
  const page2 = await browser.newPage({ viewport: { width: 390, height: 900 } })
  const basicsRoots = ((ROOTS_BY_FAMILY['the_basics' as never] ?? []) as { root_id: string }[])
    .slice(0, 3)
    .map((r) => r.root_id)
  // Roots played, and NOTHING in sections_completed. Exactly the reported device.
  await seedInto(page2, seed(basicsRoots, []))
  await shelfReady(page2)
  const after = await cards(page2)
  const locked = after.filter((c) => c.disabled)
  console.log('\nplayed the basics, never tapped through\n')
  console.log('  ' + after.filter((c) => !c.disabled).length + ' of ' + after.length + ' tappable')
  ok(
    'playing the basics opens the shelf, tapped through or not',
    after.filter((c) => !c.disabled).length > 1,
    locked.length + ' locked: ' + locked.map((c) => c.title).slice(0, 3).join(', '),
  )
  const txt2 = await page2.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
  ok('and nothing says AFTER BASICS to somebody who has done them', !/AFTER BASICS/.test(txt2))
  await page2.close()
}

console.log('\nthe shape of it\n')
/*
  Two across, three by four.

  It was a stack of wide rows, which is a list of options — read top to bottom, each one
  arguing for itself in a paragraph. A vibe is not read, it is chosen, and choosing is
  what a grid is for.
*/
const tiles = await page.$$eval('[data-testid^="vibe-"]', (els) =>
  els.map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.getAttribute('data-testid'), ratio: Number((r.width / r.height).toFixed(2)), w: Math.round(r.width) }
  }),
)
const grid = tiles.filter((t) => t.ratio < 1)
console.log('  ' + tiles.length + ' vibes, ' + grid.length + ' as tiles')
ok('the vibes are tiles, not rows', grid.length >= tiles.length - 1, grid.length + ' of ' + tiles.length)
ok(
  'every tile is three by four',
  grid.every((t) => Math.abs(t.ratio - 0.75) < 0.03),
  [...new Set(grid.map((t) => t.ratio))].join(', '),
)
/* Two across: one is a list wearing a grid's clothes, three is unreadable at 320px. */
const across = await page.evaluate(() => {
  const tile = document.querySelector('[data-testid^="vibe-"]')
  const g = tile?.parentElement as HTMLElement
  return getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length
})
ok('two across', across === 2, String(across))

console.log('\nevery vibe has a picture, and every picture loads\n')
/*
  A missing photograph does not throw — next/image renders an <img> that never paints, so
  the tile silently becomes a dark rectangle with a title on it. Checked by asking the
  browser whether pixels actually arrived.
*/
const shots = await page.$$eval('[data-testid^="vibe-"] img', (els) =>
  els.map((el) => ({
    src: (el as HTMLImageElement).currentSrc || (el as HTMLImageElement).src,
    ok: (el as HTMLImageElement).naturalWidth > 0,
  })),
)
ok('every tile carries one', shots.length >= tiles.length - 1, shots.length + ' of ' + tiles.length)
const broken = shots.filter((s2) => !s2.ok).map((s2) => s2.src.split('/').pop())
ok('and every one of them painted', !broken.length, broken.join(' '))

console.log('\ntapping opens the picture, swiping goes in\n')
/*
  Two steps, deliberately. Tapping used to enter, which was right when a tile was a line
  drawing — there was nothing more to see. With a photograph, entering on the tap means
  nobody ever sees the picture at the size that makes them want it.
*/
await page.click('[data-testid="vibe-the_basics"]')
await page.waitForSelector('[data-testid="vibe-open"]')
ok('the tap opens it full bleed', Boolean(await page.$('[data-testid="vibe-open"]')))
ok('and has not entered anything yet', Boolean(await page.$('[data-testid="vibe-begin"]')))
/*
  Wait for the picture to arrive before asking whether it arrived.

  naturalWidth was read the instant the element appeared, which on localhost is after the
  file is in cache and over the network is well before it. The assertion then reported that
  the hero image of the whole shelf had failed to paint, on a screen where it paints fine a
  few hundred milliseconds later.
*/
await page
  .waitForFunction(
    `(() => { const i = document.querySelector('[data-testid="vibe-open"] img'); return Boolean(i && i.naturalWidth > 0) })()`,
    { timeout: 15000 },
  )
  .catch(() => {})
const full = await page.$eval('[data-testid="vibe-open"] img', (el) => {
  const r = el.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height), painted: (el as HTMLImageElement).naturalWidth > 0 }
})
ok('the picture is the whole screen', full.w >= 380 && full.h >= 800, full.w + '×' + full.h)
ok('and it painted', full.painted)
await page.click('[data-testid="vibe-begin"]')
await page.waitForTimeout(2200)
ok(
  'the swipe goes in',
  !(await page.$('[data-testid="vibe-open"]')) && !(await page.$('[data-testid^="vibe-the_basics"]')),
  'a lesson, not the shelf',
)

console.log('\na vibe you cannot have yet still opens\n')
{
  const p3 = await browser.newPage({ viewport: { width: 390, height: 900 } })
  await seedInto(p3, seed([], []))
  await shelfReady(p3)
  const locked = await p3.$$eval('[data-testid^="vibe-"]', (els) =>
    els.map((el) => el.getAttribute('data-testid')).filter(Boolean),
  )
  ok('the whole shelf is on screen from the first visit', locked.length >= 10, String(locked.length))
  // Swearing is the most enticing thing in the product and it opens at stage 6. Showing
  // the picture is the argument for it; there is nothing to press, because money cannot
  // move the ladder.
  await p3.click('[data-testid="vibe-portuguese_swearing"]')
  await p3.waitForSelector('[data-testid="vibe-open"]')
  ok('a locked vibe opens its picture', Boolean(await p3.$('[data-testid="vibe-open"]')))
  ok('and says which wall it is', Boolean(await p3.$('[data-testid="vibe-stage"]')))
  ok('with nothing to press', !(await p3.$('[data-testid="vibe-begin"]')))
  await p3.close()
}

console.log('\nhow far in you are is on the card\n')
// The swipe above left this page inside a lesson. Back to the shelf before reading it.
await page.goto(BASE + '/vibes')
await shelfReady(page)
const text = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
/*
  Says what is LEFT, and never a denominator.

  The card used to read "3 of 14 taken", which is arithmetically correct and tells somebody
  the opposite of the truth: a session serves three or four roots by design, so doing
  everything DUB offers, correctly, in one sitting, earned a card scoring you at a fifth —
  immediately after a screen congratulating you for finishing. A denominator is a score
  whatever sentence it is wrapped in, so the assertion is that there is not one.
*/
ok(
  'a part-played vibe says what is left',
  /\d+ more in here|One more in here/.test(text),
  (text.match(/(\d+|One) more in here/) ?? ['none'])[0],
)
ok(
  'and does not score you out of the whole vibe',
  !/\d+ of \d+ taken/.test(text),
  'a denominator is a score whatever sentence it is in',
)

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe shelf looks like what it does')
