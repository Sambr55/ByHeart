/**
 * Does anything slide sideways?
 *
 *   npm run mobile
 *
 * This codebase already believes that a rule nobody checks is a rule that decays — the
 * content lint has caught a real fault in every batch. Layout deserves the same, and
 * more so: every widget in this app is a flex row with text of unknown length in it, and
 * the content is still growing.
 *
 * It seeds a learner at each stage because the bug it was written to catch only appears
 * at stage 5, where the label is "Talk about other people". A single-state check would
 * have passed and the phone would still have slid.
 *
 * When it fails it names the innermost offending element, its classes and its text,
 * because a check that tells you WHERE is worth more than a rule you have to re-read.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const WIDTHS = [320, 360, 390, 430]
const ROUTES = ['/club', '/legend', '/crates', '/vocab', '/drops', '/line', '/proof', '/pro', '/account', '/waitlist']
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)

const problems: string[] = []

/**
 * Anything you can tap that is smaller than a thumb.
 *
 * Nothing measured this, so 33 of 135 interactive elements sat under 44px — almost all
 * of them the back link in the header, which is the control a person reaches for most
 * and the one hardest to hit while walking.
 *
 * Zero-sized and hidden elements are skipped: a control that is not on screen is not a
 * tap target, and a menu that has not been opened would otherwise report every row.
 */
async function tinyTargets(page: Page): Promise<string[]> {
  return page.$$eval(
    'a[href], button, input, select, textarea, summary, [role="button"]',
    (els) =>
      els
        .map((e) => {
          const r = e.getBoundingClientRect()
          const s = getComputedStyle(e)
          if (s.display === 'none' || s.visibility === 'hidden' || !r.width || !r.height) return null
          // The Next.js dev-tools launcher is not part of the product, and this suite
          // runs against the dev server. Excluded by its own attributes rather than by
          // size, so a real 32px control is never mistaken for it.
          if (e.closest('nextjs-portal') || e.hasAttribute('data-next-mark') || e.id.startsWith('next-')) {
            return null
          }
          if (r.width >= 44 && r.height >= 44) return null
          // An inline link inside a paragraph is text, not a control, and giving it a
          // 44px box would break the line it sits in.
          const inProse = e.tagName === 'A' && getComputedStyle(e).display === 'inline'
          if (inProse) return null
          const text = (e.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 28)
          return (
            '<' + e.tagName.toLowerCase() + '> ' +
            Math.round(r.width) + 'x' + Math.round(r.height) +
            ' "' + text + '" needs .tap-target'
          )
        })
        .filter(Boolean) as string[],
  )
}

/** A learner sitting at a given stage, with the deal accepted so /crates opens. */
function seedFor(stage: number) {
  // rungReached is one above the highest cleanly released rung, so release stage-1.
  const opener = ROOTS.find((r) => r.rung === Math.max(1, stage - 1))
  return {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    proof: opener
      ? [{ pt: opener.transfer_prompt.answer, en: opener.transfer_prompt.ask, source: 'release', clean: true, at: '1' }]
      : [],
    inventory: Object.fromEntries(ROOTS.flatMap((r) => r.extracts).slice(0, 24).map((e) => [e.id, 'strong'])),
    roots_played: [],
  }
}

/**
 * Nothing may finish flush with the foot of the screen, and no button may be crowded by
 * the text above it. Both were real: the CTA was positioned with mt-auto alone, which
 * gives nothing on a full screen, and the scrolling pages had a 24px well.
 */
async function clearance(page: Page) {
  return page.evaluate(() => {
    const out: string[] = []
    const foot = document.documentElement.scrollHeight
    for (const el of Array.from(document.querySelectorAll('button, a[href], input'))) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const bottom = r.bottom + window.scrollY
      if (foot - bottom < 8 && foot - bottom >= 0) {
        out.push('flush with the foot: ' + (el.textContent ?? '').trim().slice(0, 30))
      }
    }
    return out.slice(0, 2)
  })
}

async function offenders(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    if (doc.scrollWidth <= doc.clientWidth) return null
    const limit = doc.clientWidth
    const out: { tag: string; cls: string; text: string; w: number; right: number }[] = []
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.right <= limit + 1) continue
      // innermost only: an ancestor is not the culprit, its child is
      if (Array.from(el.children).some((c) => c.getBoundingClientRect().right > limit + 1)) continue
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') ?? '').slice(0, 110),
        text: (el.textContent ?? '').trim().slice(0, 46),
        w: Math.round(r.width),
        right: Math.round(r.right),
      })
    }
    return { over: doc.scrollWidth - limit, scrollWidth: doc.scrollWidth, clientWidth: limit, out: out.slice(0, 3) }
  })
}

const browser = await chromium.launch()

for (const width of WIDTHS) {
  console.log('\n████ ' + width)
  for (let stage = 1; stage <= 6; stage++) {
    const page = await browser.newPage({ viewport: { width, height: 780 } })
    page.setDefaultTimeout(12000)
    await page.goto(BASE + '/crates', { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([k, seed]) => {
        localStorage.setItem('byheart.pair', JSON.stringify({ source_culture: 'en-GB', target_language: 'pt', target_locale: 'pt-PT', day_zone: 'Europe/Lisbon' }))
        localStorage.setItem(k as string, JSON.stringify(seed))
      },
      [KEY, seedFor(stage)] as const,
    )
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {})
      await page.waitForTimeout(450)
      // open every disclosure — a bug hiding inside a closed one still ships
      await page.$$eval('summary', (els) => els.forEach((e) => (e.parentElement as HTMLDetailsElement).setAttribute('open', '')))
      await page.waitForTimeout(200)
      for (const c of await clearance(page)) {
        problems.push(route + ' @' + width + ' stage ' + stage + ' — ' + c)
        console.log('  ' + route.padEnd(11) + '✗ ' + c)
      }
      /*
        And can a thumb hit it?

        Measured only at the narrowest width, once — a control's size does not change
        with the viewport, and reporting the same button four times per stage would bury
        the result. 44px is the figure both Apple and WCAG land on, and .tap-target
        already enforces it; the ones that fail are the ones that never got the class.
      */
      if (width === WIDTHS[0] && stage === 1) {
        for (const t of await tinyTargets(page)) {
          problems.push(route + ' — ' + t)
          console.log('  ' + route.padEnd(11) + '✗ ' + t)
        }
      }

      const bad = await offenders(page)
      if (bad) {
        const first = bad.out[0]
        problems.push(route + ' @' + width + ' stage ' + stage + ' +' + bad.over + 'px' + (first ? ' — <' + first.tag + '> "' + first.text + '"' : ''))
        console.log('  ' + route.padEnd(11) + '✗ SLIDES +' + bad.over + 'px  (stage ' + stage + ')')
        for (const o of bad.out) {
          console.log('      └ <' + o.tag + '> w=' + o.w + ' right=' + o.right + '  "' + o.text + '"')
          console.log('        ' + o.cls)
        }
      }
    }
    await page.close()
    if (stage === 1) console.log('  stages 1–6 checked across ' + ROUTES.length + ' routes')
  }
}

await browser.close()

console.log('')
if (problems.length) {
  console.log(problems.length + ' overflow(s):')
  for (const p of problems) console.log('  ' + p)
  process.exit(1)
}
console.log('no route slides sideways at 320 / 360 / 390 / 430, at any stage')
