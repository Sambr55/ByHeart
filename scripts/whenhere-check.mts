/**
 * The one card in the intro that asks a question, and the three ways it was broken.
 *
 *   npm run whenhere
 *
 * Every failure here was reported from a phone, by Sam, after the card had shipped and
 * passed every other check — which is the whole argument for this file. Nothing in the
 * content gate can see a native date sheet close itself, and nothing in the type system
 * can see grey type on a dark photograph.
 *
 * WHAT IS ASSERTED, and why each one rots silently rather than loudly:
 *
 *   the third answer counts.  "I do not know yet" writes no dates and no flag, so for as
 *      long as the card asked `here_for_good || here_from` whether it had been answered,
 *      that tap did nothing at all — and did nothing SILENTLY, because a panel that
 *      re-renders identically looks like a panel that was never tapped. Sam: "Nothing
 *      happens if you tap I dont know yet." Asserted as a visible change on the card,
 *      not as a field on the record, because the record was never the complaint.
 *
 *   the picker survives its own first tap.  The inputs were uncontrolled — defaultValue
 *      plus onChange — on a card that re-renders whenever the store is written. React
 *      rebuilds an input whose defaultValue shifts, and iOS dismisses the native sheet
 *      the instant its input is replaced: "tapping the from date flashes and closes the
 *      first time." A controlled input cannot do this, so what is asserted is that the
 *      value entered is STILL THERE after the write settles. An uncontrolled input that
 *      remounts loses it; nothing else would.
 *
 *   it is legible on the photograph.  This card has an image, so it is white type on a
 *      scrim — and the settled panel was bg-surface/50 and text-muted, which is a pale
 *      grey box on a dark picture: "the panel that comes up is illegible." Asserted as
 *      measured contrast rather than as a class name, because the class is not the
 *      promise and renaming it should not break this.
 *
 * All three are asked of a REAL RENDER on the route Sam was on, because all three are
 * bugs that only exist once the thing is drawn.
 */
import { chromium, type Page } from 'playwright'
import { EXPLAINERS } from '../content/explainers'
import { INTRO_CARDS } from '../content/intro'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/**
 * Relative luminance, so legibility is measured rather than assumed.
 *
 * The same construction contrast-check uses. A class name is not a promise — text-white
 * on a white panel passes any grep and fails a reader.
 */
function lum(rgb: string): number | null {
  const m = rgb.match(/\d+(\.\d+)?/g)
  if (!m || m.length < 3) return null
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const c = Number(v) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Walk up for the first non-transparent background, which is what the eye actually sees. */
async function contrastOf(page: Page, sel: string): Promise<number | null> {
  const pair = (await page.evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)})
    if (!el) return null
    const fg = getComputedStyle(el).color
    let node = el, bg = 'rgba(0, 0, 0, 0)'
    while (node) {
      const c = getComputedStyle(node).backgroundColor
      if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) { bg = c; break }
      node = node.parentElement
    }
    return [fg, bg]
  })()`)) as [string, string] | null
  if (!pair) return null
  const a = lum(pair[0])
  const b = lum(pair[1])
  if (a === null || b === null) return null
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/**
 * Get past the welcome and onto the deck.
 *
 * /club-member lands on the member ceremony, not the feed — the intro cards are behind
 * it. The first draft of this scrolled instead, which found nothing and reported the card
 * missing: the deck renders every card into the DOM at once, so there was never anything
 * to scroll TO. Clicking the ceremony through is the actual route somebody takes.
 */
async function reachTheCard(page: Page): Promise<boolean> {
  for (let i = 0; i < 8; i++) {
    const cta = await page.$('[data-testid="club-welcome-cta"]')
    if (!cta) break
    await cta.click()
    await page.waitForTimeout(1200)
  }
  return Boolean(
    (await page.$('[data-testid="when-here-from"]')) ||
      (await page.$('[data-testid="when-here-unknown"]')),
  )
}

/*
  THE TWO CARDS THAT MAKE ONE PROMISE, kept identical.

  ASK is shown twice — once to a stranger in the intro, once to a member in their front
  door deck — and Sam asked for the member's to BE the intro's rather than to resemble it.
  Two hand-maintained copies of the same specimen is the drift this product keeps paying
  for, so the specimen is compared rather than eyeballed: a change to one that is not made
  to the other fails here, on the day it is made.
*/
console.log('\nask is the same promise on both cards\n')
{
  const member = EXPLAINERS.find((e) => e.id === 'ask_anything')
  const stranger = INTRO_CARDS.find((c) => c.id === 'intro_ask')
  ok('both cards exist', Boolean(member && stranger))
  ok('the member card carries a specimen', Boolean(member?.shows), member?.shows?.kind ?? '(none)')
  ok(
    'and it is the same specimen the intro shows',
    JSON.stringify(member?.shows) === JSON.stringify(stranger?.shows),
  )
  ok('the blurb matches too', member?.blurb === stranger?.body, member?.blurb?.slice(0, 40))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

/* The member route, which is the one that shows the five intro cards. */
await page.goto(BASE + '/club-member')
await page.waitForTimeout(3000)

console.log('\nthe card that asks\n')
const found = await reachTheCard(page)
ok('the when-will-you-be-here card is reachable', found)

if (found) {
  /*
    ONE QUESTION, ASKED ONCE. Sam: "remove the second instance of When will you be here?"

    The title on the face asks it; the panel used to ask it again four words lower. Counted
    rather than matched, because the first instance is correct and must stay.
  */
  const text = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  const asks = (text.match(/When will you be here\?/g) ?? []).length
  ok('the question is asked once, not twice', asks <= 1, asks + ' instances')

  console.log('\nthe picker keeps what you type\n')
  /*
    THE FLASH-AND-CLOSE, ASKED AS PERSISTENCE.

    Playwright drives a headless input rather than an iOS date sheet, so the dismissal
    itself cannot be observed here. What CAN be observed is its cause: an uncontrolled
    input that remounts when the store writes loses the value it was given. Fill it, let
    the write settle, and ask whether the value survived — it does not if the element was
    replaced underneath.
  */
  const from = await page.$('[data-testid="when-here-from"]')
  ok('there is a from date', Boolean(from))
  if (from) {
    await from.fill('2026-11-02')
    await page.waitForTimeout(900)
    const still = await page.inputValue('[data-testid="when-here-from"]')
    ok('the from date survives the write', still === '2026-11-02', still || '(emptied)')

    /* Black type on the picker, which is a white field on either background. */
    const pickerInk = (await page.evaluate(`(() => {
      const el = document.querySelector('[data-testid="when-here-from"]')
      return el ? getComputedStyle(el).color : null
    })()`)) as string | null
    const pl = pickerInk ? lum(pickerInk) : null
    ok('the picker types in ink, not white', pl !== null && pl < 0.2, pickerInk ?? '(none)')

    /*
      THE LEAVING FIELD IS STILL THERE TO BE USED, which is the assertion that would have
      caught the one-way trip.

      Settling on `here_from` alone removed this input the instant an arrival was typed —
      a from with no to, unfixable without the `change` link. The card must stay open
      while a pair of dates is half-entered; it is only a complete answer once both are
      in, and THEN settling is right.
    */
    const to = await page.$('[data-testid="when-here-to"]')
    ok('the leaving date survives the arriving one', Boolean(to))
    if (to) {
      await to.fill('2026-11-09')
      await page.waitForTimeout(1200)
      /* A complete trip settles, and says both dates back. */
      const panel = await page.$('[data-testid="when-here-said"]')
      ok('a complete trip settles the card', Boolean(panel))
      const back = panel ? ((await panel.textContent()) ?? '') : ''
      ok('and it says both dates back', back.includes('2026-11-02') && back.includes('2026-11-09'), back.trim().slice(0, 80))

      console.log('\nand you can read what it says back\n')
      /*
        THE ILLEGIBLE PANEL, measured. Sam reported it on "I live here"; it is the same
        settled panel whichever answer put it there, so it is asked at the first one
        reached.
      */
      const c = await contrastOf(page, '[data-testid="when-here-said"]')
      ok('the settled panel clears 4.5:1', c !== null && c >= 4.5, c === null ? '(not found)' : c.toFixed(2) + ':1')
    }

  }
}

console.log('\nthe third answer is an answer\n')
/*
  Reloaded, because the dates just typed would settle the card by themselves and the
  unknown button is only reachable while the question is still open.
*/
await page.goto(BASE + '/club-member')
await page.waitForTimeout(3000)
if (await reachTheCard(page)) {
  const before = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  const unknown = await page.$('[data-testid="when-here-unknown"]')
  ok('there is an I-do-not-know-yet', Boolean(unknown))
  if (unknown) {
    await unknown.click()
    await page.waitForTimeout(1200)
    const after = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
    /*
      SOMETHING CHANGED, which is the whole of the complaint. Not which words — the card
      is free to say it however it likes — but that the tap was not swallowed.
    */
    ok('tapping it changes the card', after !== before)
    ok('and the question is put away', !(await page.$('[data-testid="when-here-unknown"]')))
    /* Legible here too — this is the panel Sam actually hit it on. */
    const c = await contrastOf(page, '[data-testid="when-here-said"]')
    ok('the unknown panel clears 4.5:1', c !== null && c >= 4.5, c === null ? '(not found)' : c.toFixed(2) + ':1')
  }
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('the card asks once, keeps what you type, and answers back legibly')
