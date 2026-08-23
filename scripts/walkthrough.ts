/**
 * End-to-end walkthrough of both missions, the deck and the delayed recall,
 * driven from the content data.
 *
 *   npm run dev -- --port 3111
 *   npm run walkthrough
 *
 * Run 1 answers everything correctly and asserts the headline numbers: a clean
 * Mission 01 transfers 8/8, a clean Mission 02 recalls 6/6 cold and completes every
 * crossover task unassisted, and all sixteen blocks end up owned with four
 * strengthened. Run 2 answers everything wrongly and asserts only one thing, which
 * is the thing that matters: the learner is never trapped.
 */

import { chromium, type Page } from 'playwright'
import { MISSIONS, MISSION_ORDER } from '../content/missions'
import { TARGETS } from '../content/targets'
import type { Mission, Screen } from '../content/types'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const PATHS: Record<string, string> = { mission_01: '/', mission_02: '/m2' }
const problems: string[] = []

async function tap(page: Page, label?: string) {
  const btn = label
    ? page.getByRole('button', { name: label, exact: false })
    : page.getByTestId('continue')
  await btn.first().click()
}

async function fillTiles(
  page: Page,
  scope: ReturnType<Page['getByTestId']> | Page,
  tiles: { id: string; text: string }[],
  answer: string[],
  mode: 'correct' | 'wrong',
) {
  const order = mode === 'correct' ? answer : [...answer].reverse()
  for (const id of order) {
    const tile = tiles.find((t) => t.id === id)!
    const loc = scope.getByRole('button', { name: tile.text, exact: true }).first()
    if (await loc.isVisible().catch(() => false)) await loc.click()
  }
}

async function playScreen(page: Page, s: Screen, mode: 'correct' | 'wrong') {
  switch (s.type) {
    case 'promise':
    case 'briefing':
      return tap(page)
    case 'culture-select':
      await page.getByRole('button', { name: 'TOP GUN', exact: false }).first().click()
      return tap(page)
    case 'familiarity':
      await page.getByRole('button', { name: s.options[0].label }).click()
      return tap(page)
    case 'inventory':
    case 'result':
    case 'generativity':
    case 'retention-result':
    case 'compound-inventory':
    case 'crossover-result':
      return tap(page)
    case 'block-intro':
      for (const b of s.blocks) {
        await page.getByRole('button', { name: b.gloss, exact: false }).first().click()
      }
      return tap(page)
    case 'preference':
      await page.getByRole('button', { name: s.options[0].title, exact: false }).first().click()
      return tap(page)
    case 'continuation':
      await page.getByRole('button', { name: s.options[0].label }).click()
      return tap(page)
    case 'culture-categories':
      await page.getByRole('button', { name: s.cards[0].title, exact: false }).first().click()
      return tap(page)
    case 'free-text':
      await page.getByRole('textbox').first().fill('The Sopranos')
      return tap(page)
    case 'forced-choice':
      await page.getByRole('button', { name: s.cards[0].title, exact: false }).first().click()
      return tap(page)
    case 'scale':
      await page.getByRole('button', { name: s.points[2].label, exact: false }).first().click()
      return tap(page)
    case 'post-intent':
      await page.getByRole('button', { name: s.options[0].label }).click()
      return tap(page, 'FINISH')

    case 'meaning-check': {
      const right = s.options.find((o) => o.correct)!
      const wrong = s.options.find((o) => !o.correct)!
      if (mode === 'correct') {
        await page.getByRole('button', { name: right.label, exact: false }).first().click()
      } else {
        for (let i = 0; i < 3; i++) {
          const opt = page.getByRole('button', { name: wrong.label, exact: false }).first()
          if (await opt.isEnabled().catch(() => false)) await opt.click()
        }
      }
      return tap(page)
    }

    case 'choice': {
      const right = s.options.find((o) => o.correct)!
      const wrong = s.options.find((o) => !o.correct)!
      if (mode === 'correct') {
        await page.getByRole('button', { name: right.pt, exact: true }).click()
      } else {
        for (let i = 0; i < 3; i++) {
          const opt = page.getByRole('button', { name: wrong.pt, exact: true })
          if (await opt.isEnabled().catch(() => false)) await opt.click()
        }
      }
      return tap(page)
    }

    case 'tiles': {
      if (mode === 'correct') {
        await fillTiles(page, page.getByTestId('tile-pool'), s.tiles, s.answer, 'correct')
        await tap(page, 'CHECK')
      } else {
        for (let attempt = 0; attempt < 3; attempt++) {
          const pool = page.getByTestId('tile-pool')
          if (!(await pool.isVisible().catch(() => false))) break
          await fillTiles(page, pool, s.tiles, s.answer, 'wrong')
          await tap(page, 'CHECK')
          const line = page.getByTestId('tile-line')
          for (const id of s.answer) {
            const tile = s.tiles.find((t) => t.id === id)!
            const placed = line.getByRole('button', { name: tile.text, exact: true }).first()
            if (await placed.isEnabled().catch(() => false)) await placed.click()
          }
        }
      }
      return tap(page)
    }

    case 'composite': {
      for (const part of s.parts) {
        const section = page.getByTestId('part-' + part.id)
        if (part.kind === 'choice') {
          const right = part.options.find((o) => o.correct)!
          const wrong = part.options.find((o) => !o.correct)!
          for (let i = 0; i < (mode === 'correct' ? 1 : 3); i++) {
            const target = mode === 'correct' ? right.pt : wrong.pt
            const btn = section.getByRole('button', { name: target, exact: true }).first()
            if (await btn.isVisible().catch(() => false)) await btn.click()
          }
        } else {
          for (let attempt = 0; attempt < (mode === 'correct' ? 1 : 3); attempt++) {
            const pool = page.getByTestId('pool-' + part.id)
            if (!(await pool.isVisible().catch(() => false))) break
            await fillTiles(page, pool, part.tiles, part.answer, mode)
            const check = section.getByRole('button', { name: 'CHECK', exact: true })
            if (await check.isEnabled().catch(() => false)) await check.click()
            const line = page.getByTestId('line-' + part.id)
            for (const id of part.answer) {
              const tile = part.tiles.find((t) => t.id === id)!
              const placed = line.getByRole('button', { name: tile.text, exact: true }).first()
              if (await placed.isEnabled().catch(() => false)) await placed.click()
            }
          }
        }
      }
      return tap(page)
    }

    case 'match': {
      const card = (id: string) => page.getByTestId('pair-' + id)
      if (mode === 'wrong') {
        for (const p of s.pairs) {
          const other = s.pairs.find((x) => x.blockId !== p.blockId)!
          await card(p.blockId).getByRole('button', { name: other.en, exact: true }).click()
        }
      }
      for (const p of s.pairs) {
        await card(p.blockId).getByRole('button', { name: p.en, exact: true }).click()
      }
      return tap(page)
    }

    case 'recall-burst': {
      for (const c of s.cards) {
        const wrong = c.options.find((o) => o !== c.answer)!
        if (mode === 'wrong') {
          for (let i = 0; i < 2; i++) {
            const btn = page.getByRole('button', { name: TARGETS[wrong].label, exact: true })
            if (await btn.isEnabled().catch(() => false)) await btn.click()
            await page.waitForTimeout(100)
          }
        } else {
          await page.getByRole('button', { name: TARGETS[c.answer].label, exact: true }).click()
        }
        await page.waitForTimeout(1000)
      }
      return tap(page)
    }
  }
}

async function playMission(page: Page, mission: Mission, mode: 'correct' | 'wrong') {
  await page.goto(BASE + PATHS[mission.mission_id], { waitUntil: 'networkidle' })
  const tag = '[' + mode + '/' + mission.mission_id + '] '

  for (const s of mission.screens) {
    const before = await page.locator('[data-screen]').first().getAttribute('data-screen')
    if (before !== s.id) {
      problems.push(tag + 'expected ' + s.id + ' but the shell is on ' + before)
      return false
    }
    try {
      await playScreen(page, s, mode)
    } catch (err) {
      problems.push(
        tag + s.id + ' (' + s.name + ') stuck: ' +
          (err instanceof Error ? err.message.split('\n')[0] : String(err)),
      )
      return false
    }
    if (s.type !== 'post-intent' && s.type !== 'continuation') {
      const after = await page.locator('[data-screen]').first().getAttribute('data-screen')
      if (after === s.id) {
        problems.push(tag + s.id + ' (' + s.name + ') did not advance')
        return false
      }
    }
  }
  return true
}

async function run(mode: 'correct' | 'wrong') {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  // Fail fast. A wedged screen should surface in seconds, not after the default
  // 30s times out on every action for the rest of a 98-screen run.
  page.setDefaultTimeout(15000)
  page.on('pageerror', (e) => problems.push('[' + mode + '] page error: ' + e.message))
  page.on('crash', () => problems.push('[' + mode + '] the page crashed'))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    if (m.location().url.includes('/audio/')) return
    problems.push('[' + mode + '] console: ' + m.text())
  })

  const bodies: Record<string, string> = {}
  for (const id of MISSION_ORDER) {
    const ok = await playMission(page, MISSIONS[id], mode)
    if (!ok) {
      await browser.close()
      return null
    }
    bodies[id] = await page.locator('body').innerText()
    bodies[id + '_inventory'] = await page.evaluate(() => {
      const raw = localStorage.getItem('byheart.learner.v1')
      if (!raw) return 'none'
      const parsed = JSON.parse(raw)
      return Object.keys(parsed.inventory ?? {}).join(',')
    })
  }

  await page.goto(BASE + '/deck', { waitUntil: 'networkidle' })
  bodies.deck = await page.locator('body').innerText()
  await page.getByRole('button', { name: 'REVIEW NOW' }).click()
  for (let i = 0; i < 12; i++) {
    const show = page.getByRole('button', { name: 'SHOW ME' })
    if (!(await show.isVisible().catch(() => false))) break
    await show.click()
    await page.getByRole('button', { name: 'GOT IT' }).click()
  }
  bodies.deckDone = await page.locator('body').innerText()

  await page.goto(BASE + '/recall', { waitUntil: 'networkidle' })
  for (let item = 0; item < 12; item++) {
    const options = page.locator('main button')
    if (!(await options.count())) break
    await options.nth(0).click()
    const next = page.getByRole('button', { name: 'NEXT' })
    try {
      await next.waitFor({ state: 'visible', timeout: 4000 })
    } catch {
      // No NEXT means the answer never registered, or we are already on the result.
      break
    }
    await next.click()
  }
  bodies.recall = await page.locator('body').innerText()
  bodies.recallTail = bodies.recall.slice(0, 200).replace(/\n/g, ' | ')

  await browser.close()
  return bodies
}

async function main() {
  const correct = await run('correct')
  if (correct) {
    const m1 = correct.mission_01 ?? ''
    const m2 = correct.mission_02 ?? ''
    if (!/SESSION COMPLETE/.test(m1)) problems.push('[correct] Mission 01 never completed')
    if (!/Transferred[\s\S]*8\/8/.test(m1)) {
      problems.push('[correct] a clean Mission 01 did not transfer 8/8')
    }
    if (!/SESSION COMPLETE/.test(m2)) problems.push('[correct] Mission 02 never completed')
    if (!/Survived from before[\s\S]*6\/6/.test(m2)) {
      problems.push('[correct] a clean cold recall did not score 6/6')
    }
    if (!/Cross-world[\s\S]*8\/8/.test(m2)) {
      problems.push('[correct] a clean crossover did not complete 8/8')
    }
    if (!/Blocks owned[\s\S]*16/.test(m2)) {
      const owned = /Blocks owned\s*(\S+)/.exec(m2)?.[1] ?? '?'
      problems.push(
        '[correct] the compound inventory reached ' + owned + ', not 16 blocks. ' +
          'stored after m01: ' + (correct.mission_01_inventory ?? '?') + ' | ' +
          'after m02: ' + (correct.mission_02_inventory ?? '?'),
      )
    }
    if (!/Strengthened[\s\S]*4/.test(m2)) {
      problems.push('[correct] four Top Gun blocks were not strengthened by Bond')
    }
    if (!/REVIEW NOW/.test(correct.deck ?? '')) {
      problems.push('[correct] the deck did not generate any cards')
    }
    if (!/Deck done/.test(correct.deckDone ?? '')) {
      problems.push('[correct] the deck review never finished')
    }
    if (!/came back with no film/.test(correct.recall ?? '')) {
      problems.push(
        '[correct] the delayed recall never reported a score. saw: ' +
          (correct.recallTail ?? ''),
      )
    }
  }

  const wrong = await run('wrong')
  if (wrong && !/SESSION COMPLETE/.test(wrong.mission_02 ?? '')) {
    problems.push('[wrong] the hint ladder trapped the learner before the end')
  }

  if (problems.length) {
    console.log(problems.length + ' problem(s):')
    problems.forEach((p) => console.log('  ' + p))
    process.exit(1)
  }
  const total = MISSION_ORDER.reduce((n, m) => n + MISSIONS[m].screens.length, 0)
  console.log(
    'walkthrough clean: ' + total + ' screens across ' + MISSION_ORDER.length +
      ' missions, plus deck and delayed recall, on a perfect and a worst-case run',
  )
}

main()
