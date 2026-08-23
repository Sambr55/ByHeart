/**
 * Capture every screen at phone size for design review.
 *
 *   npm run dev -- --port 3111
 *   npm run shots            # writes .screenshots/<id>.png
 *   SHOTS=S08,L01 npm run shots
 *
 * Exercise screens are captured three times: fresh, filled in, and resolved.
 */

import { mkdir } from 'node:fs/promises'
import { chromium, type Page } from 'playwright'
import { SCREENS } from '../content/topgun-pt'
import { TARGETS } from '../content/targets'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const OUT = '.screenshots'
const only = process.env.SHOTS ? new Set(process.env.SHOTS.split(',')) : null

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })

  let taken = 0
  const shoot = async (p: Page, id: string, suffix = '') => {
    if (only && !only.has(id)) return
    await p.waitForTimeout(420) // let colour transitions settle before capturing
    await p.screenshot({ path: OUT + '/' + id + suffix + '.png' })
    taken++
  }

  for (const s of SCREENS) {
    await page.waitForTimeout(120)
    await shoot(page, s.id)

    if (s.type === 'tiles') {
      for (const a of s.answer) {
        const t = s.tiles.find((x) => x.id === a)!
        await page
          .getByTestId('tile-pool')
          .getByRole('button', { name: t.text, exact: true })
          .first()
          .click()
      }
      await shoot(page, s.id, '-filled')
      await page.getByRole('button', { name: 'CHECK' }).click()
      await shoot(page, s.id, '-solved')
    } else if (s.type === 'choice') {
      await page
        .getByRole('button', { name: s.options.find((o) => o.correct)!.pt, exact: true })
        .click()
      await shoot(page, s.id, '-solved')
    } else if (s.type === 'culture-select') {
      await page.getByRole('button', { name: 'TOP GUN', exact: false }).first().click()
    } else if (s.type === 'familiarity') {
      await page.getByRole('button', { name: s.options[0].label }).click()
      await shoot(page, s.id, '-picked')
    } else if (s.type === 'block-intro') {
      for (const b of s.blocks) {
        await page.getByRole('button', { name: b.gloss, exact: false }).first().click()
      }
      await shoot(page, s.id, '-tapped')
    } else if (s.type === 'preference') {
      await page
        .getByRole('button', { name: s.options[0].title, exact: false })
        .first()
        .click()
    } else if (s.type === 'continuation') {
      await page.getByRole('button', { name: s.options[0].label }).click()
      await shoot(page, s.id, '-picked')
    } else if (s.type === 'match') {
      for (const p of s.pairs) {
        await page
          .getByTestId('pair-' + p.blockId)
          .getByRole('button', { name: p.en, exact: true })
          .click()
      }
      await shoot(page, s.id, '-solved')
    } else if (s.type === 'recall-burst') {
      for (const c of s.cards) {
        await page
          .getByRole('button', { name: TARGETS[c.answer].label, exact: true })
          .click()
        await page.waitForTimeout(1000)
      }
      await shoot(page, s.id, '-solved')
    }

    await page
      .getByTestId('continue')
      .first()
      .click()
      .catch(() => {})
  }

  await page.waitForTimeout(300)
  await shoot(page, 'END')
  await browser.close()
  console.log(taken + ' screenshots in ' + OUT + '/')
}

main()
