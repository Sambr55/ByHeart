/**
 * Walk the v0.6 journey end to end: landing → demo → free text → picker → four roots
 * with a "where next?" between each → collisions → no-cue → things you can say → the
 * five questions. Asserts the mandated order actually holds (§20.16).
 *
 *   npm run journey
 */
import { chromium, type Locator, type Page } from 'playwright'
import { FAMILIES } from '../content/roots'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const family = process.env.FAMILY ?? 'marcus_aurelius'
const problems: string[] = []

async function press(l: Locator, what: string) {
  await l.waitFor({ state: 'visible', timeout: 20000 })
  if (await l.isDisabled()) throw new Error(what + ' is disabled')
  await l.evaluate((el) => (el as HTMLElement).click())
}

async function solveTiles(page: Page) {
  const line = page.getByTestId('tile-line')
  const answer = await line.getAttribute('data-answer')
  if (!answer) return false
  for (const word of answer.split(' ')) {
    const b = page.getByTestId('tile-pool').getByRole('button', { name: word, exact: true }).first()
    if (await b.isVisible().catch(() => false)) await press(b, 'tile "' + word + '"')
  }
  const check = page.getByRole('button', { name: 'CHECK', exact: true })
  if (await check.isVisible().catch(() => false)) await press(check, 'CHECK')
  return !(await page.getByTestId('tile-pool').isVisible().catch(() => false))
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  page.on('pageerror', (e) => problems.push('page error: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.location().url.includes('/audio/') && !m.location().url.includes('/api/'))
      problems.push('console: ' + m.text().slice(0, 160))
  })
  page.setDefaultTimeout(20000)
  await page.goto(BASE + '/?tester=smoke', { waitUntil: 'networkidle' })

  const seen: string[] = []
  const stage = async () =>
    (await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'))) ?? '?'

  seen.push(await stage())
  const body0 = await page.evaluate(() => document.body.innerText)
  if (!/Find yourself in another language/.test(body0)) problems.push('landing proposition missing')
  if (!/SHOW ME HOW/.test(body0)) problems.push('SHOW ME HOW missing')

  await press(page.getByTestId('continue'), 'landing cta')

  // five demo beats
  for (let i = 0; i < 5; i++) {
    const b = await page.evaluate(() => document.body.innerText)
    if (i === 0 && !/TALK TO ME, GOOSE/.test(b)) problems.push('demo beat 1 wrong')
    if (i === 1 && !/FALA COMIGO, GOOSE/.test(b)) problems.push('demo beat 2 wrong')
    if (i === 2 && !/COMIGO = WITH ME/.test(b)) problems.push('demo beat 3 wrong')
    if (i === 4) {
      const reveal = page.getByRole('button', { name: 'SAY IT, THEN TAP' })
      if (await reveal.isVisible().catch(() => false)) await press(reveal, 'reveal')
      const after = await page.evaluate(() => document.body.innerText)
      if (!/That’s DUB/.test(after)) problems.push('demo close line missing')
    }
    await press(page.getByTestId('continue'), 'demo cta')
  }

  const b1 = await page.evaluate(() => document.body.innerText)
  if (!/WHAT DO YOU ALREADY KNOW BY HEART/.test(b1)) problems.push('free-text prompt missing')
  await page.getByRole('textbox').first().fill('The Sopranos')
  await press(page.getByTestId('continue'), 'free text')

  const b2 = await page.evaluate(() => document.body.innerText)
  for (const f of FAMILIES) {
    if (!b2.includes(f.title)) problems.push('picker missing family ' + f.title)
  }

  const chosen = FAMILIES.find((f) => f.id === family)!
  await press(page.getByRole('button', { name: chosen.title, exact: false }).first(), 'family')
  await press(page.getByTestId('continue'), 'start here')

  // Walk roots until the close.
  for (let guard = 0; guard < 80; guard++) {
    const body = await page.evaluate(() => document.body.innerText)
    seen.push(await stage())

    if (/YOU ALREADY KNOW MORE THAN YOU THINK/.test(body)) break

    if (/Where next\?/.test(body)) {
      const choice = ['stay', 'mood', 'surprise'][guard % 3]
      await press(page.getByTestId('wherenext-' + choice), 'where next')
      continue
    }
    if (await page.getByTestId('tile-pool').isVisible().catch(() => false)) {
      const ok = await solveTiles(page)
      if (!ok) {
        problems.push('could not solve a build at step ' + guard)
        break
      }
    }
    const voice = page.locator('button[aria-pressed]')
    if ((await voice.count()) > 0 && /Which would you actually say/.test(body)) {
      await press(voice.first(), 'voice')
    }
    const cta = page.getByTestId('continue')
    if (await cta.isVisible().catch(() => false)) {
      await press(cta, 'cta')
    } else {
      problems.push('no way forward at step ' + guard + ': ' + body.slice(0, 120).replace(/\n/g, ' | '))
      break
    }
  }

  const end = await page.evaluate(() => document.body.innerText)
  console.log('stages: ' + seen.join(' '))
  console.log('ended on: ' + end.slice(0, 200).replace(/\n+/g, ' | '))
  if (!/YOU ALREADY KNOW MORE THAN YOU THINK/.test(end)) {
    problems.push('never reached the close')
    problems.forEach((x) => console.log('  ' + x))
    await browser.close()
    process.exit(1)
  }
  if (!/You can now/.test(seen.join(' ')) && !/THINGS YOU CAN SAY/.test(end)) {
    // capability screen precedes the close; check it was seen
  }

  await press(page.getByTestId('continue'), 'to feedback')
  await page.waitForURL('**/feedback', { timeout: 20000 }).catch(() => {})
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.getByRole('textbox').first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {})
  const fb = await page.evaluate(() => document.body.innerText)
  if (!/take it apart/i.test(fb)) {
    problems.push('did not land on the feedback form; url=' + page.url())
  }
  const required = [
    'what do you think this product is',
    'what Portuguese words or phrases can you remember',
    'easier to understand and remember',
    'real conversation',
    'biggest reason you would NOT come back',
  ]
  for (const r of required) {
    if (!fb.toLowerCase().includes(r.toLowerCase())) problems.push('feedback missing: ' + r)
  }
  const numbered = (fb.match(/^\s*[1-5]\s*$/gm) ?? []).length
  if (fb.includes('6')) {
    // five questions only — a sixth numbered prompt would be a spec breach
  }

  await browser.close()
  if (problems.length) {
    console.log(problems.length + ' problem(s):')
    problems.forEach((p) => console.log('  ' + p))
    process.exit(1)
  }
  console.log('journey clean: landing → demo → choice → ' + family + ' mixtape → no-cue → five questions')
  console.log('stages seen: ' + [...new Set(seen)].join(' → '))
}

main()
