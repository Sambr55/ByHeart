/**
 * Does a tap on the speaker actually make a sound?
 *
 *   npm run audio:check
 *
 * Every tap was silent on every iPhone, and nothing in this repo could see it. The code
 * was correct, the button was wired, the fallback existed, and it worked perfectly on
 * the desktop it was written on.
 *
 * The rule it broke is the one rule iOS enforces about sound: speechSynthesis.speak()
 * only works when it is called INSIDE the user gesture that asked for it. play() awaited
 * the mp3 first — and since no mp3 has been recorded, every tap waited for a 404, lost
 * the gesture, and then asked a browser that had stopped listening to talk.
 *
 * So that is what this measures, and it is measurable without an iPhone: it stubs
 * speechSynthesis, calls .click() on a real speaker button, and checks whether speak()
 * was called by the time click() returned. Synchronous means the gesture is intact.
 * Anything awaited first shows up as "not yet", which is exactly the bug.
 */
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

// Stub the speech API before any app code runs, and record how each call arrived.
await page.goto(BASE + '/'); await page.evaluate(() => localStorage.clear())
await page.goto(BASE + '/'); await page.waitForTimeout(1000)

// Walk to the Goose beat, which is the first screen with a speaker on it.
for (let i = 0; i < 8; i++) {
  const t = await page.evaluate(() => (document.querySelector('main') ?? document.body).innerText)
  if (t.includes('FALA COMIGO') || (await page.$('button[aria-label^="Play"]'))) break
  const btn = await page.$('main button.bg-accent, main a.bg-accent, main button:not([aria-label])')
  if (!btn) break
  await btn.click().catch(() => {})
  await page.waitForTimeout(600)
}

/*
  The stub is a STRING, and that detail is the whole reason this file works.

  Passing a function to page.evaluate means tsx/esbuild compiles it first — and esbuild
  emits a `__name` helper for any named function, which does not exist in the browser.
  The helper threw, Playwright swallowed it, and the stub silently never installed: the
  test then measured the real, voiceless headless engine and reported the app as broken
  when it was fine. A string is handed over untouched.

  defineProperty rather than assignment for the same class of reason: speechSynthesis is
  a read-only accessor, so `window.speechSynthesis = stub` quietly does nothing.

  It installs after load rather than before because the app reads window.speechSynthesis
  at the moment it speaks, so late is soon enough.
*/
await page.evaluate(`
  (function () {
    window.__spoken = []
    window.__inGesture = false
    var stub = {
      speaking: false,
      pending: false,
      paused: false,
      getVoices: function () {
        return [{ lang: 'pt-PT', name: 'Test PT', default: true, localService: true, voiceURI: 'x' }]
      },
      addEventListener: function () {},
      removeEventListener: function () {},
      cancel: function () {},
      resume: function () {},
      speak: function (u) {
        window.__spoken.push({ text: u.text, lang: u.lang, rate: u.rate, sync: window.__inGesture === true })
      },
    }
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: stub })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function (text) { this.text = text; this.lang = ''; this.rate = 1; this.volume = 1 },
    })
  })()
`)

ok(
  'the test can see what the app says',
  await page.evaluate(() => Boolean((window.speechSynthesis as unknown as { getVoices?: () => unknown[] })?.getVoices?.().length)),
)

const speaker = await page.$('button[aria-label^="Play"]')
ok('there is a speaker button to press', Boolean(speaker))

if (speaker) {
  // The whole test. Click synchronously and read the log the instant click() returns.
  const first = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>
    const el = document.querySelector('button[aria-label^="Play"]') as HTMLButtonElement
    ;(w.__spoken as unknown[]).length = 0
    w.__inGesture = true
    el.click()
    const immediately = (w.__spoken as unknown[]).length
    w.__inGesture = false
    return { immediately, log: w.__spoken as { text: string; lang: string; rate: number; sync: boolean }[] }
  })

  ok('it speaks during the tap, not after it', first.immediately > 0,
    first.immediately === 0 ? 'speak() had not been called when click() returned — the gesture is lost, and iOS will refuse it' : '')
  ok('the utterance is inside the gesture', Boolean(first.log[0]?.sync))
  ok('it speaks European Portuguese', first.log[0]?.lang === 'pt-PT', first.log[0]?.lang ?? '—')
  ok('it says something', Boolean(first.log[0]?.text?.trim()), JSON.stringify(first.log[0]?.text ?? ''))

  // A second tap is the slow one, and it must survive the same rule.
  await page.waitForTimeout(400)
  const second = await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>
    const el = document.querySelector('button[aria-label^="Play"]') as HTMLButtonElement
    ;(w.__spoken as unknown[]).length = 0
    w.__inGesture = true
    el.click()
    const immediately = (w.__spoken as unknown[]).length
    w.__inGesture = false
    return { immediately, log: w.__spoken as { rate: number }[] }
  })
  ok('the second tap also speaks in-gesture', second.immediately > 0)
  ok('and it is the slow one', (second.log[0]?.rate ?? 1) < 1, String(second.log[0]?.rate ?? '—'))
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe speaker makes a sound inside the tap, which is the only way iOS allows one')
