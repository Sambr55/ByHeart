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
async function cards(page: Page) {
  return page.$$eval('main button', (els) =>
    els
      .map((el) => {
        const title = el.querySelector('.display')?.textContent?.trim() ?? ''
        if (!title) return null
        const s = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        if (!r.height) return null
        return {
          title,
          opacity: Number(s.opacity),
          disabled: (el as HTMLButtonElement).disabled,
          badge: (el.textContent ?? '').includes('PRO') ? 'pro' : '',
        }
      })
      .filter(Boolean) as { title: string; opacity: number; disabled: boolean; badge: string }[],
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

await page.goto(BASE + '/vibes')
await page.evaluate(
  ([k, pair, s]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(s))
  },
  [KEY, DEFAULT_PAIR, seed(played, ['the_basics', 'james_bond', 'bridget_jones'])] as const,
)
await page.goto(BASE + '/vibes')
await page.waitForTimeout(1200)

const list = await cards(page)
console.log('\n' + list.length + ' cards on the shelf\n')
for (const c of list) {
  console.log(
    '  ' + c.title.padEnd(34) + 'opacity ' + c.opacity.toFixed(2) +
      (c.disabled ? '  disabled' : '  tappable') + (c.badge ? '  [PRO]' : ''),
  )
}

console.log('\nbrightness means a tap opens the vibe\n')
const bright = list.filter((c) => c.opacity > 0.9)
const dim = list.filter((c) => c.opacity <= 0.9)

ok('there is something to tap', bright.length > 0, bright.length + ' at full brightness')
ok(
  'nothing at full brightness is disabled',
  bright.every((c) => !c.disabled),
  bright.filter((c) => c.disabled).map((c) => c.title).join(', '),
)
ok(
  'nothing at full brightness is behind the paywall',
  bright.every((c) => c.badge !== 'pro'),
  bright.filter((c) => c.badge === 'pro').map((c) => c.title).join(', '),
)
ok('the dimmed ones are visibly different', dim.every((c) => c.opacity < 0.85), '')

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
  await page2.goto(BASE + '/vibes')
  await page2.evaluate(
    ([k, pair, s]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(s))
    },
    // Roots played, and NOTHING in sections_completed. Exactly the reported device.
    [KEY, DEFAULT_PAIR, seed(basicsRoots, [])] as const,
  )
  await page2.goto(BASE + '/vibes')
  await page2.waitForTimeout(1200)
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

console.log('\nhow far in you are is on the card\n')
const text = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
ok('a part-played vibe says so', /\d+ of \d+ taken/.test(text), (text.match(/\d+ of \d+ taken/) ?? ['none'])[0])

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe shelf looks like what it does')
