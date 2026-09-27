/**
 * The card moves when you push it.
 *
 *   npm run swipe
 *
 * Sam, with a Tinder screenshot: "you get a far more satisfying swipe left/right motion
 * where you see/feel a card being moved. Let's replicate that."
 *
 * WHY IT FELT INERT. The lanes are a native scroller — three panes, CSS snap — and the
 * note above them argues that native snap "keeps the gesture feeling like the phone rather
 * than like JavaScript". True of the SCROLL, and exactly why the card felt nailed down:
 * what moved was the viewport, so the world slid past a card that never budged.
 *
 * WHAT IS ASSERTED, and each is a way the feel could quietly go:
 *
 *   it tilts at all.  A transform on the face lane, proportional to how far off centre the
 *      scroller is. Zero at rest, because a resting card wearing a rotation is a bug
 *      nobody would think to look for.
 *
 *   the two directions differ.  Away lifts and fades; the language lane leans and does
 *      neither. They are opposite acts — discarding and revealing — and one treatment for
 *      both would say they are the same thing.
 *
 *   it comes home.  Back at the face, the transform is CLEARED rather than set to zero, so
 *      a card at rest carries none at all.
 *
 * MEASURED WITH SNAP OFF. A scroll-snap container refuses programmatic scrollLeft — it
 * pulls straight back — so the first three attempts at this measured a card that had never
 * moved and reported no tilt on a feature that worked. Snap is disabled for the
 * measurement only; what is being checked is paint(), not the browser's snapping.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(BASE + '/')
await page.evaluate(
  ([k, pair]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(
      k as string,
      JSON.stringify({
        version: 1,
        deal_accepted_at: '2026-08-01T00:00:00.000Z',
        set_up_at: '2026-08-01T00:00:00.000Z',
        chapter: 'lisbon',
        purpose: 'visiting',
        profile: { goal: 'trip' },
        proof: [],
        inventory: {},
        roots_played: [],
        sections_completed: ['the_basics', 'top_gun'],
        club_welcomed_at: '2026-08-20T00:00:00.000Z',
      }),
    )
  },
  [KEY, DEFAULT_PAIR] as const,
)
await page.goto(BASE + '/club')
await page.waitForTimeout(2600)
for (let i = 0; i < 6; i++) {
  const cta = await page.$('[data-testid="club-welcome-cta"]')
  if (!cta) break
  await cta.click()
  await page.waitForTimeout(800)
}

/**
 * The face lane's inline transform, at a given position in lanes.
 *
 * WAITS A FRAME, because paint() is coalesced into a requestAnimationFrame — one write
 * per painted frame however many scroll events arrive, which is what stopped it sticking.
 * A read taken in the same tick as the scroll therefore sees the PREVIOUS value, which
 * had this reporting "no tilt" on a card that tilts correctly.
 */
const at = async (lanes: number | null) => {
  const out = JSON.parse(
    (await page.evaluate(`(async () => {
      const el = document.querySelector('[data-testid="card-panes"]')
      if (!el) return JSON.stringify({ missing: true })
      ${'' /* The face lane. Identified by its order, not by will-change: that hint is
              added while dragging and removed at rest, which is the point of it. */}
      const face = el.querySelector('.order-2')
      if (!face) return JSON.stringify({ missing: true })
      ${'' /* null means leave it where it is — the resting read */}
      const want = ${lanes === null ? 'null' : lanes}
      if (want !== null) {
        el.style.scrollSnapType = 'none'
        el.scrollLeft = el.clientWidth * want
        el.dispatchEvent(new Event('scroll'))
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return JSON.stringify({
        transform: face.style.transform || '',
        opacity: face.style.opacity || '',
        willChange: face.style.willChange || '',
      })
    })()`)) as string,
  ) as { transform: string; opacity: string; willChange: string; missing?: boolean }
  return out
}

const deg = (t: string) => {
  const m = t.match(/rotate\((-?[\d.]+)deg\)/)
  return m ? Number(m[1]) : 0
}

console.log('\nat rest it carries nothing\n')
{
  const home = await at(null)
  ok('the face lane is there', !home.missing)
  ok('and wears no transform', home.transform === '', home.transform || '(none)')
}

console.log('\npushed away, it tilts and lifts\n')
{
  const away = await at(1.3)
  ok('it tilts', deg(away.transform) > 1, away.transform || '(none)')
  /* Matched on the Y term alone: the browser normalises 0 to 0px and spaces the args. */
  ok('it lifts off the surface', /translate3d\([^,]+, *-[\d.]+px/.test(away.transform), away.transform)
  /*
    THE FADE IS GONE, and its absence is asserted rather than merely unchecked.

    Animating opacity on a full-bleed photograph recomposites the whole layer every frame
    — the expensive half of the first version, and most of why it felt sluggish. The tilt
    already says the card is leaving. A fade coming back would be a regression in feel,
    not an improvement, so this notices it.
  */
  ok('and does not fade', away.opacity === '', away.opacity || '(none)')
  /*
    FURTHER OUT TILTS FURTHER — the lean tracks the thumb rather than switching on.

    Measured at 1.45 rather than 1.7, and the reason is worth keeping: past the halfway
    mark the card is REJECTED, which clears the transform on purpose so the next card does
    not inherit it. A first version read at 1.7, found zero, and reported "no tilt" about
    the throw completing correctly.
  */
  const further = await at(1.45)
  ok(
    'and further out tilts further',
    deg(further.transform) > deg(away.transform),
    deg(away.transform) + ' → ' + deg(further.transform),
  )
}

console.log('\npulled toward the language, it leans the other way\n')
{
  const into = await at(0.7)
  ok('it tilts the opposite way', deg(into.transform) < -1, into.transform || '(none)')
  /*
    AND IT DOES NOT LIFT. Revealing is not discarding, and giving both the same treatment
    would tell a learner the two gestures do the same thing.
  */
  ok('and does not lift', !/translate3d\([^,]+, *-[\d.]+px/.test(into.transform), into.transform)
  ok('nor fade', into.opacity === '' || Number(into.opacity) === 1, into.opacity || '(none)')
}

console.log('\nand back home it clears\n')
{
  const home = await at(1)
  ok('the transform is gone', home.transform === '', home.transform || '(none)')
  ok('and so is the fade', home.opacity === '', home.opacity || '(none)')
  /*
    AND THE LAYER HINT WITH IT. will-change was in the class list, so all 63 cards in the
    feed held a composited layer for the whole session — which is what "sluggish" was.
    It is added while a card moves and removed here, and a resting card carrying one is
    that bug returning.
  */
  ok('and the layer hint is released', home.willChange === '', home.willChange || '(none)')
}

await browser.close()

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log('the card leans where it is pushed, and lifts only when thrown')
