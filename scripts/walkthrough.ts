/**
 * End-to-end walkthrough of the whole ten minutes, driven from the content data.
 *
 *   npm run dev -- --port 3111
 *   npm run walkthrough
 *
 * Run 1 answers everything correctly and asserts a clean 8/8 transfer.
 * Run 2 answers everything wrongly and asserts the hint ladder always reveals and
 * moves on — the learner must never be trapped (spec §11).
 */

import { chromium, type Page } from 'playwright'
import { SCREENS } from '../content/topgun-pt'
import { TARGETS } from '../content/targets'
import type { Screen } from '../content/types'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const problems: string[] = []

async function tapContinue(page: Page, label?: string) {
  const btn = label
    ? page.getByRole('button', { name: label, exact: false })
    : page.getByTestId('continue')
  await btn.first().click()
}

async function playScreen(page: Page, s: Screen, mode: 'correct' | 'wrong') {
  switch (s.type) {
    case 'promise':
    case 'briefing':
      await tapContinue(page)
      return
    case 'culture-select':
      await page.getByRole('button', { name: 'TOP GUN', exact: false }).first().click()
      await tapContinue(page)
      return
    case 'familiarity':
      await page.getByRole('button', { name: s.options[0].label }).click()
      await tapContinue(page)
      return
    case 'block-intro':
      for (const b of s.blocks) {
        await page.getByRole('button', { name: b.gloss, exact: false }).first().click()
      }
      await tapContinue(page)
      return
    case 'inventory':
    case 'result':
    case 'generativity':
      await tapContinue(page)
      return
    case 'preference':
      await page.getByRole('button', { name: s.options[0].title, exact: false }).first().click()
      await tapContinue(page)
      return
    case 'continuation':
      await page.getByRole('button', { name: s.options[0].label }).click()
      await tapContinue(page)
      return

    case 'choice': {
      const right = s.options.find((o) => o.correct)!
      const wrong = s.options.find((o) => !o.correct)!
      if (mode === 'correct') {
        await page.getByRole('button', { name: right.pt, exact: true }).click()
      } else {
        // Three wrong taps must end in a reveal, not a dead end.
        for (let i = 0; i < 3; i++) {
          const opt = page.getByRole('button', { name: wrong.pt, exact: true })
          if (await opt.isEnabled().catch(() => false)) await opt.click()
        }
      }
      await tapContinue(page)
      return
    }

    case 'tiles': {
      if (mode === 'correct') {
        for (const id of s.answer) {
          const tile = s.tiles.find((t) => t.id === id)!
          await page
            .getByTestId('tile-pool')
            .getByRole('button', { name: tile.text, exact: true })
            .first()
            .click()
        }
        await tapContinue(page, 'CHECK')
      } else {
        const bad = [...s.answer].reverse()
        for (let attempt = 0; attempt < 3; attempt++) {
          const pool = page.getByTestId('tile-pool')
          if (!(await pool.isVisible().catch(() => false))) break
          for (const id of bad) {
            const tile = s.tiles.find((t) => t.id === id)!
            const loc = pool.getByRole('button', { name: tile.text, exact: true }).first()
            if (await loc.isVisible().catch(() => false)) await loc.click()
          }
          await tapContinue(page, 'CHECK')
          // Clear the line for the next attempt if the screen is still open.
          const line = page.getByTestId('tile-line')
          for (const id of bad) {
            const tile = s.tiles.find((t) => t.id === id)!
            const placed = line.getByRole('button', { name: tile.text, exact: true }).first()
            if (await placed.isEnabled().catch(() => false)) await placed.click()
          }
        }
      }
      await tapContinue(page)
      return
    }

    case 'match': {
      const pairCard = (blockId: string) => page.getByTestId('pair-' + blockId)
      if (mode === 'wrong') {
        // Swap both answers: the screen must reject the pairing, not accept a half-match.
        for (const p of s.pairs) {
          const other = s.pairs.find((x) => x.blockId !== p.blockId)!
          await pairCard(p.blockId)
            .getByRole('button', { name: other.en, exact: true })
            .click()
        }
      }
      for (const p of s.pairs) {
        await pairCard(p.blockId).getByRole('button', { name: p.en, exact: true }).click()
      }
      await tapContinue(page)
      return
    }

    case 'recall-burst': {
      for (const card of s.cards) {
        const wrong = card.options.find((o) => o !== card.answer)!
        if (mode === 'wrong') {
          for (let i = 0; i < 2; i++) {
            const btn = page.getByRole('button', { name: TARGETS[wrong].label, exact: true })
            if (await btn.isEnabled().catch(() => false)) await btn.click()
            await page.waitForTimeout(120)
          }
        } else {
          const btn = page.getByRole('button', { name: TARGETS[card.answer].label, exact: true })
          await btn.click()
        }
        await page.waitForTimeout(1000)
      }
      await tapContinue(page)
      return
    }
  }
}

async function run(mode: 'correct' | 'wrong') {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

  page.on('pageerror', (e) => problems.push('[' + mode + '] page error: ' + e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // Audio assets are generated separately; a missing mp3 falls back to speech
    // synthesis by design and is not a defect until the TTS build has run.
    if (m.location().url.includes('/audio/')) return
    problems.push('[' + mode + '] console: ' + m.text())
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })

  for (const s of SCREENS) {
    const before = await page.locator('[data-screen]').first().getAttribute('data-screen')
    if (before !== s.id) {
      problems.push('[' + mode + '] expected ' + s.id + ' but the shell is on ' + before)
      await browser.close()
      return null
    }
    try {
      await playScreen(page, s, mode)
    } catch (err) {
      problems.push(
        '[' + mode + '] ' + s.id + ' (' + s.name + ') stuck: ' +
          (err instanceof Error ? err.message.split('\n')[0] : String(err)),
      )
      await browser.close()
      return null
    }
    if (s.type !== 'continuation') {
      const after = await page.locator('[data-screen]').first().getAttribute('data-screen')
      if (after === s.id) {
        problems.push('[' + mode + '] ' + s.id + ' (' + s.name + ') did not advance')
        await browser.close()
        return null
      }
    }
  }

  const body = await page.locator('body').innerText()
  await browser.close()
  return body
}

async function main() {
  const correct = await run('correct')
  if (correct) {
    if (!/SESSION COMPLETE/.test(correct)) {
      problems.push('[correct] never reached the end of the session')
    }
    if (!/Transferred[\s\S]*8\/8/.test(correct)) {
      problems.push('[correct] a clean run did not score 8/8 transferred:\n' + correct)
    }
    if (!/First try[\s\S]*8\/8/.test(correct)) {
      problems.push('[correct] a clean run did not score 8/8 first try')
    }
  }

  const wrong = await run('wrong')
  if (wrong && !/SESSION COMPLETE/.test(wrong)) {
    problems.push('[wrong] the hint ladder trapped the learner before the end')
  }

  if (problems.length) {
    console.log(problems.length + ' problem(s):')
    problems.forEach((p) => console.log('  ' + p))
    process.exit(1)
  }
  console.log('walkthrough clean: ' + SCREENS.length + ' screens, both a perfect and a worst-case run')
}

main()
