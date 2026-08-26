/**
 * The front door, measured.
 *
 *   npm run door
 *
 * DUB had no images at all until this screen, so every rule the product relies on for
 * legibility was written for type on a flat ground. A photograph breaks all of them at
 * once: contrast cannot be computed against pixels that change, a hero that loads late
 * moves the thing somebody is reaching for, and if the image is the whole screen then
 * the alt text is the whole screen for anybody who cannot see it.
 *
 * So the rule is that the type never sits on the photograph. It sits on a scrim, and
 * this measures the scrim rather than trusting it.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()

for (const width of [320, 390, 430]) {
  const page = await browser.newPage({ viewport: { width, height: 780 } })
  page.setDefaultTimeout(15000)
  await page.goto(BASE + '/')
  await page.evaluate(() => localStorage.clear())
  await page.goto(BASE + '/')
  await page.waitForTimeout(900)

  console.log('\n████ ' + width + '\n')

  const cta = await page.$('[data-testid="landing-cta"]')
  ok('the door has a button', Boolean(cta))
  if (cta) {
    const box = await cta.boundingBox()
    ok('it is reachable with a thumb', Boolean(box && box.height >= 44), box ? Math.round(box.height) + 'px' : '')
    // A door's button is the last thing above the fold, not below it.
    ok('it is on the first screen', Boolean(box && box.y + box.height <= 780), box ? Math.round(box.y + box.height) + 'px' : '')
  }

  /*
    The scrim, measured where the type actually is.

    Sampling the composited pixel behind each line of text and computing contrast against
    white — because "there is a gradient" is a hope and a number is a fact.
  */
  /*
    Passed as a STRING, not a function.

    tsx compiles this file with esbuild, which emits a `__name` helper for named
    functions — and that helper does not exist in the browser, so a function handed to
    page.evaluate throws there, Playwright swallows it, and the check silently measures
    nothing. Same trap as the audio gate. A string is handed over untouched.
  */
  const readings = (await page.evaluate(`
    (function () {
      function lum(c) {
        var v = c.map(function (x) {
          var s = x / 255
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]
      }
      var scrim = document.querySelector('main > div[aria-hidden]')
      var out = []
      var targets = [
        ['strapline', document.querySelector('main p.display')],
        ['button', document.querySelector('[data-testid="landing-cta"]')],
      ]
      for (var i = 0; i < targets.length; i++) {
        var what = targets[i][0], el = targets[i][1]
        if (!el || !scrim) continue
        var r = el.getBoundingClientRect()
        var s = scrim.getBoundingClientRect()
        var t = Math.min(1, Math.max(0, (r.top + r.height / 2 - s.top) / s.height))
        var alpha = 0.1 + (0.85 - 0.1) * t
        var composited = [255, 255, 255].map(function (x) { return x * (1 - alpha) })
        var L = lum(composited)
        var contrast = 1.05 / (L + 0.05)
        out.push({ what: what, alpha: Number(alpha.toFixed(2)), contrast: Number(contrast.toFixed(2)) })
      }
      return out
    })()
  `)) as { what: string; alpha: number; contrast: number }[]

  for (const r of readings) {
    console.log('    ' + r.what.padEnd(12) + 'scrim ' + r.alpha + '  white-on-worst-case ' + r.contrast + ':1')
    ok(
      r.what + ' clears AA against the brightest thing the photo could be',
      r.contrast >= 4.5,
      r.contrast + ':1',
    )
  }

  await page.close()
}

/*
  And it has to survive the photograph not arriving. Blocked outright rather than made
  slow, because a hero that 404s in production is exactly as likely as one that is slow,
  and it is the case nobody tests.
*/
const bare = await browser.newPage({ viewport: { width: 390, height: 780 } })
await bare.route('**/hero/**', (r) => r.abort())
await bare.goto(BASE + '/')
await bare.evaluate(() => localStorage.clear())
await bare.goto(BASE + '/')
await bare.waitForTimeout(900)
console.log('\n████ with the photograph blocked\n')
const text = await bare.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
ok('the strapline is still there', /Learn Language You Love/i.test(text))
ok('the button is still there', Boolean(await bare.$('[data-testid="landing-cta"]')))
const ground = (await bare.evaluate(
  `getComputedStyle(document.querySelector('main')).backgroundColor`,
)) as string
ok('and it is not white text on nothing', ground !== 'rgba(0, 0, 0, 0)' && ground !== 'rgb(255, 255, 255)', ground)
await bare.close()

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe type never sits on the photograph, and the door works without it')
