/**
 * Is there always a way forward?
 *
 *   npm run forward
 *
 * Written for a bug that every other gate in this repo passed. A learner did the basics
 * and picked two crates — exactly what the free tier asks of them — and the shelf then
 * rendered a small grey box reading "nothing new is open right now", with the word Pro
 * sitting in the prose as plain text. No link. Every card below it disabled. The most
 * important moment in the product, and the screen had no exit.
 *
 * Nothing caught it because nothing was broken: valid JSX, correct copy, right condition.
 * A dead end is not a rule violation, it is an ABSENCE, and absence is what this looks
 * for. For each state a learner can actually be in, it counts the routes out of the
 * shelf and fails when there are none — and at the cap it insists one of them is the way
 * through, because "go through one again" on its own is a loop, not a path.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { CRATES, ROOTS, ROOTS_BY_FAMILY } from '../content/roots'
import { FREE_ENTITLEMENTS } from '../lib/entitlements'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []

/** The crates that spend the allowance, in the order the picker offers them. */
const spending = CRATES.filter((c) => !c.drop && c.built !== false)
const basics = spending.find((c) => c.id === 'the_basics')
const others = spending.filter((c) => c.id !== 'the_basics')

/** One root out of each named crate — the thing that marks it claimed. */
function rootsOf(ids: string[]): string[] {
  return ids.flatMap((id) => {
    const list = (ROOTS_BY_FAMILY as Record<string, { root_id: string }[]>)[id] ?? []
    return list.length ? [list[0].root_id] : []
  })
}

/**
 * A learner who started some crates and finished only some of them.
 *
 * The state that produced the trap: `roots_played` marks a crate CLAIMED, and
 * `sections_completed` marks it FINISHED. The allowance counted the first and the Legend
 * counts the second, so somebody who opens five and finishes three is at the cap with two
 * unfinished and no way to reach a Legend that needs five finished.
 */
function seedPartial(started: string[], finished: string[]) {
  return { ...seed(started), sections_completed: finished }
}

function seed(crateIds: string[]) {
  const opener = ROOTS.find((r) => r.rung === 1)
  return {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    proof: opener
      ? [{ pt: opener.transfer_prompt.answer, en: opener.transfer_prompt.ask, source: 'release', clean: true, at: '1' }]
      : [],
    inventory: {},
    roots_played: rootsOf(crateIds),
    sections_completed: crateIds,
  }
}

/**
 * A route out. Not every anchor: the header's back link and the footer are furniture,
 * present on a dead end and on a live screen alike, so counting them would certify the
 * exact screen this exists to catch.
 */
async function waysForward(page: Page) {
  return page.evaluate(() => {
    const out: { href: string; text: string }[] = []
    const main = document.querySelector('main') ?? document.body
    for (const el of Array.from(main.querySelectorAll('a[href], button'))) {
      if (el.closest('nextjs-portal') || el.closest('header') || el.closest('footer')) continue
      const s = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      if (s.display === 'none' || s.visibility === 'hidden' || !r.width || !r.height) continue
      if ((el as HTMLButtonElement).disabled) continue
      if (el.getAttribute('aria-disabled') === 'true') continue
      const href = el.getAttribute('href') ?? 'button'
      if (href === '/vibes' || href === '#') continue
      out.push({ href, text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) })
    }
    return out
  })
}

/*
  The cap is asked for rather than assumed, and the fixture is built to reach it.

  This hardcoded three crates and called it "at the cap", which was true while the free
  allowance was three. Raising free to the number the Legend actually needs left this
  seeding a learner who is comfortably INSIDE the allowance and then failing because the
  shelf did not show them a gateway they have not earned — a check reporting a wall that
  correctly is not there.

  Derived now, so the fixture follows the allowance instead of restating a number somebody
  else is free to change.
*/
const CAP = FREE_ENTITLEMENTS.crates
const upTo = (n: number) => (basics ? [basics.id, ...others.slice(0, Math.max(0, n - 1)).map((c) => c.id)] : [])

const STATES: { name: string; crates: string[]; finished?: string[]; mustReachGate?: boolean }[] = [
  { name: 'brand new', crates: [] },
  { name: 'basics done', crates: upTo(1) },
  { name: 'halfway to the cap', crates: upTo(Math.max(2, Math.floor(CAP / 2))) },
  /*
    The one Sam hit, and being at the cap now means something more specific.

    The allowance counts crates OPEN, not crates ever touched — so five FINISHED crates is
    zero open and correctly not at the cap. To be capped you have to be holding the whole
    allowance unfinished, which is what `finished: []` says.
  */
  { name: 'at the cap (' + CAP + ' open)', crates: upTo(CAP), finished: [], mustReachGate: true },
]

console.log('abandoning crates does not strand you short of the Legend\n')
/*
  THE TRAP, walked in the product rather than in arithmetic.

  Raising the free allowance to the number of crates the Legend needs made the road exactly
  as long as the road, with no margin. `crates` is documented as "how many can be open at
  once" and was implemented as how many have EVER been touched — the same number only for
  somebody who finishes everything they start. Open five, finish three, wander off from two,
  and you are capped with nothing left to open and no way to reach the Legend. Permanently,
  and with nothing on screen saying so: from the inside it is ordinary progress that stopped.

  Reported from a phone as "not getting to the Legend after completing multiple vibes".

  Asserted on the RENDERED picker, because a version of this written as arithmetic over the
  two constants passes whether or not the code was ever fixed.
*/
{
  const b0 = await chromium.launch()
  const p0 = await b0.newPage({ viewport: { width: 390, height: 780 } })
  const all = upTo(CAP)
  const done = all.slice(0, Math.max(1, CAP - 2))
  await p0.goto(BASE + '/vibes')
  await p0.evaluate(
    ([k, pair, blob]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(blob))
    },
    [KEY, DEFAULT_PAIR, seedPartial(all, done)] as const,
  )
  await p0.goto(BASE + '/vibes')
  await p0.waitForTimeout(2600)
  const body = ((await p0.textContent('body')) ?? '').replace(/\s+/g, ' ')
  const capped = /WHAT MEMBERSHIP OPENS/.test(body)
  const line = 'started ' + all.length + ', finished ' + done.length
  if (capped) {
    problems.push(
      line + ': at the cap with unfinished crates and no way to reach the Legend — ' +
        'finishing must free the slot, or abandoning one is terminal',
    )
    console.log('  ✗ ' + line + ' — capped\n')
  } else {
    console.log('  ✓ ' + line + ' — not capped; finishing frees the slot\n')
  }
  await b0.close()
}

const browser = await chromium.launch()
console.log('routes out of the shelf, per state\n')

for (const st of STATES) {
  const page = await browser.newPage({ viewport: { width: 390, height: 780 } })
  page.setDefaultTimeout(12000)
  await page.goto(BASE + '/vibes', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([k, pair, s]) => {
      localStorage.setItem('byheart.pair', JSON.stringify(pair))
      localStorage.setItem(k as string, JSON.stringify(s))
    },
    [KEY, DEFAULT_PAIR, seedPartial(st.crates, st.finished ?? st.crates)] as const,
  )
  await page.goto(BASE + '/vibes', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)

  const ways = await waysForward(page)
  // The gateway itself, not any old link to /pro. An inline "join up" on a dimmed card
  // eleven rows down satisfies a naive href check and is what shipped the dead end.
  const gate = await page.$$eval('[data-testid="gateway"] a[href="/pro"]', (els) =>
    els.map((e) => (e.textContent ?? '').trim().slice(0, 40)),
  )
  console.log('  ' + st.name.padEnd(26) + String(ways.length).padStart(3) + ' out' + (gate.length ? '   → gateway: ' + gate[0] : ''))

  if (!ways.length) {
    problems.push(st.name + ': the shelf has no route out — every control on it is dead')
  }
  if (st.mustReachGate && !gate.length) {
    problems.push(
      st.name +
        ': at the cap and there is no gateway. The learner has finished the free tier ' +
        'and the shelf does not say what comes next.',
    )
  }
  await page.close()
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' dead end' + (problems.length === 1 ? '' : 's') + '\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nevery state has a route out, and the cap points through the gate')
