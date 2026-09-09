/**
 * One door, asked in one place, on every tab that is behind it.
 *
 *   npm run tabs
 *
 * The bar offered four ways into a building nobody had entered. /calendar rendered a
 * month of a city that had not been chosen, /profile rendered BEEN THROUGH and YOUR
 * PORTUGUESE and a Legend over empty arrays four seconds after a reset, and ASK opened
 * the translator to anybody on any screen. Reported as: accessing Lisbon, On or Ask
 * before joining the club should reveal an explainer; Yours should be accessible but
 * empty; it is currently full of content even after reset.
 *
 * The rule was never in doubt and is not invented here — `clubOpen` in content/legend.ts
 * is the door, and its terms are the Legend. What was missing is that only Club.tsx was
 * asking. useClub asks it once for all four.
 *
 * THE TRAP THIS EXISTS FOR is the front door. The showcase sequence lives at /club too —
 * COME IN pushes there and the argument is the feed — so a gate keyed on the route alone
 * shuts onboarding for the one person it was built for. It happened while writing this:
 * a fresh device tapped COME IN and got the explainer. So both halves are asserted, and
 * the second is the one that matters.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { cardFor } from '../content/legend'
import { ROOTS } from '../content/roots'
const BASE = 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)

const base = {
  version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z', profile: { goal: 'curious' },
  inventory: {}, proof: [], roots_played: [], sections_completed: [],
  legend: [], saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
}
/* A member: the seven answered, at rung 2. */
const seven = cardFor(null).map((f) => ({ frame_id: f.id, values: { x: 'y' } }))
/*
  A member with things in their record, because that is what a member is. Yours is empty
  when it is empty — including for somebody who finished a Legend and has kept nothing —
  so a seed with no sections and no saved cards would assert the wrong screen here.
*/
const member = {
  ...base,
  sections_completed: ['the_basics'],
  finished_cards: ['lisbon_farmacia'],
  saved: ['lisbon_cafe'],
  legend: seven,
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
}

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  THREE ARE ROOMS, AND YOURS IS A RECORD.

  /club, /calendar and /ask are things you are let into, so they are behind the Legend.
  /profile is not: it is what you have done, and hiding somebody's own saved words from
  them until they qualify is a worse failure than the one this file exists for. It is
  empty when it is EMPTY, which is asserted separately below.
*/
const TABS = ['/club', '/calendar', '/ask']
const b = await chromium.launch()

console.log('\nbefore the Legend, every tab explains itself\n')
for (const route of TABS) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/vibes')
  await p.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(v)) }, [KEY, base] as const)
  await p.goto(BASE + route)
  await p.waitForTimeout(2200)
  const explainer = await p.isVisible('[data-testid="notyet-go"]')
  ok(route + ' explains rather than opens', explainer)
  /*
    Both ways out, because an explainer with no exit is the dead end forward-check exists
    for — and this one would be on four tabs at once.
  */
  if (explainer) {
    ok(route + ' offers a way on', await p.isVisible('[data-testid="notyet-go"]'))
    ok(route + ' offers a way back', await p.isVisible('[data-testid="notyet-back"]'))
  }
  await p.close()
}

console.log('\nand Yours is empty rather than full of headings over nothing\n')
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/vibes')
  await p.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(v)) }, [KEY, base] as const)
  await p.goto(BASE + '/profile')
  await p.waitForTimeout(2200)
  /*
    The SECTIONS, not the words. My first version grepped for "been through" and failed on
    the explainer's own sentence — "the vibes you have been through" — which is a check
    reading its own copy back and calling it content. A section is a heading with a list
    under it, so the heading element is what says one is there.
  */
  const headings = await p.$$eval('main [data-testid^="section-"]', (els) =>
    els.map((e) => (e.getAttribute('data-testid') ?? '')))
  ok(
    'no sections on a device with nothing in them',
    headings.length === 0,
    headings.join(', ') || 'nothing but the line',
  )
  ok('it says so instead', await p.isVisible('[data-testid="yours-empty"]'))
  ok('and offers somewhere to start', await p.isVisible('[data-testid="yours-start"]'))
  /*
    THE SETTINGS SURVIVE, which the first two attempts at this did not.

    Yours carries the name, the theme, the sound switch and the purpose choice, and none of
    those is content — a setting is never empty. Replacing the whole screen took them with
    it, and tap-check found the missing sound toggle. Asserted here so the empty state
    cannot quietly become an empty screen again.
  */
  ok('and the settings are still reachable', Boolean(await p.$('[data-testid="sound-off"]')))
  await p.close()
}

console.log('\nthe front door still opens, which is the half that broke\n')
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/')
  await p.evaluate(() => localStorage.clear())
  await p.goto(BASE + '/')
  await p.waitForTimeout(2400)
  await p.click('[data-testid="landing-cta"]')
  await p.waitForTimeout(3000)
  const pillars = await p.$$eval('[data-testid="pillar"]', (els) => els.map((e) => (e.textContent ?? '').trim()))
  ok(
    'COME IN still reaches the sequence',
    pillars.length > 0,
    pillars.join(', ') || 'the explainer, which is the regression',
  )
  ok('and not the explainer', !(await p.isVisible('[data-testid="notyet-go"]')))
  await p.close()
}

console.log('\nand Yours shows work as soon as there is any\n')
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/vibes')
  /*
    Finished the basics, kept one card, saved another — and no Legend. The state
    feed-check seeds, and the one my first version of this got wrong: it told this
    learner "not yet" about their own saved words.
  */
  await p.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(v)) },
    [KEY, { ...base, sections_completed: ['the_basics'], finished_cards: ['lisbon_farmacia'], saved: ['lisbon_cafe'] }] as const)
  await p.goto(BASE + '/profile')
  await p.waitForTimeout(2400)
  ok('a learner mid-journey sees their own things', !(await p.isVisible('[data-testid="notyet-go"]')))
  const sections = await p.$$eval('main [data-testid^="section-"]', (els) => els.length)
  ok('and the sections are there', sections > 0, sections + ' sections')
  await p.close()
}

console.log('\nwith the Legend done, the tabs are the product\n')
for (const route of [...TABS, '/profile']) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/vibes')
  await p.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(v)) }, [KEY, member] as const)
  await p.goto(BASE + route)
  await p.waitForTimeout(2600)
  ok(route + ' opens for a member', !(await p.isVisible('[data-testid="notyet-go"]')))
  await p.close()
}

console.log('\nand no tab is named after a city\n')
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 } })
  await p.goto(BASE + '/vibes')
  await p.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(v)) }, [KEY, member] as const)
  await p.goto(BASE + '/club')
  await p.waitForTimeout(2400)
  const labels = await p.$$eval('[data-testid="bottom-nav"] [data-testid^="tab-"]', (els) =>
    els.map((e) => (e.textContent ?? '').trim()))
  console.log('  bar: ' + labels.join(', '))
  ok('the first tab is the Club', labels[0] === 'Club', labels[0] ?? '(none)')
  ok('and no city is on the bar', !labels.some((l) => /lisbon|porto|algarve/i.test(l)))
  await p.close()
}

await b.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const x of problems) console.log('  ✗ ' + x)
  process.exit(1)
}
console.log('\none door, four tabs, and the front one still opens\n')
