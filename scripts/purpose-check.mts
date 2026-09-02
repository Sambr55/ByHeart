/**
 * Why you are in the city, asked once and honoured after.
 *
 *   npm run purpose
 *
 * The routing axis from docs/spec-purpose-and-depth.md. Three things worth measuring, and
 * the third is the one that would go wrong quietly.
 *
 * It is asked at the Club threshold rather than at the front door or in the Legend — at
 * the front door it would be a form between somebody and the product, and in the Legend it
 * would put "are you a tourist" inside a sentence they recite in a bar.
 *
 * It is remembered, and it is changeable from YOURS, because the threshold says so and a
 * setting somebody is told they can change and then cannot find is worse than not offering
 * the change.
 *
 * And the FILTER IS OFF. Five Situations divided by three purposes is one or two each, so
 * shipping the filter before a block of ten exists would make the first thing purpose does
 * be making the Club emptier — the exact problem it is meant to solve. The wiring is real
 * and tested; the caller passes null until the content lands. This asserts that it is off,
 * so turning it on is a deliberate act rather than a drift.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_FRAMES } from '../content/legend'
import { ROOTS } from '../content/roots'
import { SITUATIONS, PURPOSES } from '../content/situations'
import { CARD_RUNG, CARD_SIZE, CRATES_TO_UNLOCK_LEGEND, cardFor } from '../content/legend'
import { FREE_ENTITLEMENTS } from '../lib/entitlements'
import { forPurpose } from '../content/feed'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nseven, for everybody\n')
/*
  The hard constraint on the whole per-purpose idea.

  Seven is promised on the front door, in the explainer, and on the deck. Two of the seven
  now depend on why somebody is here, which means the set is assembled rather than fixed —
  and an assembled set is one tag away from being six for a visitor and eight for a mover,
  which would break the only promise this product makes about how long the work takes. It
  is also exactly the bug that was just fixed on the deck, where nine frames were being
  counted against a card of seven.
*/
for (const p of PURPOSES) {
  const card = cardFor(p.id)
  ok(
    p.id + '’s card is seven',
    card.length === CARD_SIZE,
    card.length + ': ' + card.map((f) => f.id).join(', '),
  )
}
ok(
  'and so is the card for somebody who has not said',
  cardFor(null).length === CARD_SIZE,
  cardFor(null).length + ' — everybody is, at first, somebody who has recently arrived',
)
/*
  Different sevens, or the axis is decoration. If two purposes produce the same card then
  the tagging has quietly collapsed and nobody would notice, because every set would still
  be the right length.
*/
const sets = PURPOSES.map((p) => cardFor(p.id).map((f) => f.id).sort().join('|'))
ok(
  'and no two of them are the same seven',
  new Set(sets).size === PURPOSES.length,
  new Set(sets).size + ' distinct of ' + PURPOSES.length,
)

console.log('\nthe content model\n')
ok('there are three purposes', PURPOSES.length === 3, PURPOSES.map((p) => p.id).join(', '))
/*
  Untagged means everybody, and most of Lisbon is untagged on purpose — a pharmacy does not
  care why you are in the country. If this ever inverts, the Club silently empties for
  whoever has not been asked.
*/
ok(
  'an untagged room is for everybody',
  SITUATIONS.filter((s) => !s.purposes).every((s) =>
    PURPOSES.every((p) => forPurpose(s, p.id)) && forPurpose(s, null),
  ),
)
ok(
  'and an unanswered purpose sees everything',
  SITUATIONS.every((s) => forPurpose(s, null)),
  'a Club that empties until a question is answered is a form with a Club behind it',
)
const tagged = SITUATIONS.filter((s) => s.purposes)
ok('something is tagged, or the axis does nothing', tagged.length > 0, tagged.map((s) => s.id).join(', '))
ok(
  'and nobody on a four-day holiday is sent to the Junta',
  !SITUATIONS.some((s) => s.id === 'lisbon_junta' && forPurpose(s, 'visiting')),
)

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

/** A learner who has just earned the Club and has never been welcomed. */
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1),
  })),
  inventory: {},
  roots_played: [],
  sections_completed: [],
  legend: LEGEND_FRAMES.map((f) => ({ frame_id: f.id, values: { seeded: 'yes' } })),
  saved: [], liked: [], finished_cards: [], asked: [], evidence: [],
  club_welcomed_at: null,
  purpose: null,
}

console.log('\nasked at the top of the Legend, once\n')
/*
  Not at the Club's threshold, which is where it was first built and was wrong twice over:
  it arrived after the Club had been earned rather than before it was explained, and it
  arrived separately from the seven questions it exists to shape.
*/
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)
console.log('\na free learner can actually reach the Legend\n')
/*
  THE DEADLOCK, and it shipped without anybody walking into it.

  Free allowed three crates. The Legend's card is assembled from pieces that live in five.
  So a free learner hit the wall at crate three, could never complete five, could never
  build a Legend — and therefore could never reach the paywall they were being walked
  towards. The old gate blocked the road to the new one.

  Invisible from the inside because everybody testing has an unlimited account, and
  invisible from the outside because it looks like ordinary progress right up until it
  stops. This walks the arithmetic rather than the product, which is the only way to see
  it: no screen ever says "you cannot get there from here".
*/
{
  const need = new Set<string>()
  for (const f of cardFor(null)) for (const pc of f.built_from ?? []) need.add(pc)
  const crates = new Set<string>()
  /*
    `extracts[].id`, and the first draft of this said `piece_id`.

    There is no piece_id on an extract, so the set came back EMPTY and every assertion
    below passed against zero — "free 5 vs 0 needed" is a green check measuring nothing,
    which is worse than no check at all. The guard is the console line: it prints the crate
    count, so a zero is visible rather than inferred from a tick.
  */
  for (const r of ROOTS as { rung?: number; culture_family: string; extracts?: { id: string }[] }[]) {
    if ((r.rung ?? 9) > CARD_RUNG) continue
    for (const e of r.extracts ?? []) {
      if (need.has(e.id)) crates.add(r.culture_family)
    }
  }
  /*
    And the arithmetic is only meaningful if it found something.

    Named separately so a future refactor that renames the field fails here — loudly, with
    a number — instead of quietly passing the three checks underneath it.
  */
  ok('the card is built from crates that exist', crates.size > 0, crates.size + ' found')
  console.log('  the card needs ' + need.size + ' pieces, living in ' + crates.size + ' crates')
  console.log('  free allows ' + FREE_ENTITLEMENTS.crates + '\n')
  ok(
    'free reaches every crate the card is built from',
    FREE_ENTITLEMENTS.crates >= crates.size,
    'free ' + FREE_ENTITLEMENTS.crates + ' vs ' + crates.size + ' needed',
  )
  ok(
    'and reaches the unlock itself',
    FREE_ENTITLEMENTS.crates >= CRATES_TO_UNLOCK_LEGEND,
    'a paywall in front of the thing the product is for is a paywall nobody pays',
  )
  /*
    Fewer than seven, which was the target, and it already was.

    Worth recording the number rather than the adjective: the Legend costs five crates, so
    "can we do it in fewer than seven vibes" was answered before it was asked. What made it
    feel unreachable was the allowance, not the length.
  */
  ok('and the Legend costs fewer than seven vibes', crates.size < 7, crates.size + ' crates')
}

await page.goto(BASE + '/club')
await page.waitForTimeout(2200)

const welcome = await page.$('[data-testid="club-welcome-cta"]')
ok('the Club still welcomes people', Boolean(welcome))
if (welcome) {
  await welcome.click()
  await page.waitForTimeout(1200)
}
ok(
  'and it does not ask anything',
  !(await page.$('[data-testid="purpose-moving"]')),
  'the biggest moment in the product is not a form',
)

await page.goto(BASE + '/legend')
await page.waitForTimeout(2000)
ok('the Legend asks it first', Boolean(await page.$('[data-testid="purpose-moving"]')))
/*
  Named, not counted by prefix.

  This counted every [data-testid^="purpose-"] and asserted three. Adding a skip control
  called purpose-skip made it four and the check failed — correctly reporting a number, and
  reporting nothing at all about whether visiting, staying and moving are on the screen,
  which is the thing it is named after. A count is a proxy; the three ids are the claim.
*/
{
  const offered = await Promise.all(
    PURPOSES.map(async (p) => ((await page.$('[data-testid="purpose-' + p.id + '"]')) ? null : p.id)),
  )
  const missing = offered.filter(Boolean)
  ok('all three are offered', missing.length === 0, missing.length ? 'missing ' + missing.join(', ') : PURPOSES.map((p) => p.id).join(', '))
}

await page.click('[data-testid="purpose-moving"]')
await page.waitForTimeout(1400)
const stored = (await page.evaluate(
  `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').purpose } catch { return null } })()`,
)) as string | null
ok('the answer is remembered', stored === 'moving', String(stored))
ok(
  'and it lets you straight on to the seven',
  !(await page.$('[data-testid="purpose-moving"]')),
  'asked once',
)

await page.reload()
await page.waitForTimeout(1800)
ok(
  'and never asks again',
  !(await page.$('[data-testid="purpose-moving"]')),
  'a question that reappears is a form rather than a decision',
)

console.log('\nand changeable afterwards, as promised\n')
await page.goto(BASE + '/profile')
await page.waitForTimeout(1600)
ok('it is in Yours', Boolean(await page.$('[data-testid="purpose-set-visiting"]')))
await page.click('[data-testid="purpose-set-visiting"]')
await page.waitForTimeout(700)
const changed = (await page.evaluate(
  `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').purpose } catch { return null } })()`,
)) as string | null
ok('changing it sticks', changed === 'visiting', String(changed))
const proof = (await page.evaluate(
  `(() => { try { return (JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').proof || []).length } catch { return 0 } })()`,
)) as number
ok(
  'and nothing learned is taken away by it',
  proof === seed.proof.length,
  proof + ' sentences still there',
)

console.log('\nthe filter is on, and it does not empty the Club\n')
/*
  This used to assert the OPPOSITE, and the change is the point.

  The filter was built and deliberately off, because five Situations divided by three
  purposes is one or two each — so switching it on would have made the first thing purpose
  ever did be making the Club emptier. The check guarded that: it asserted a visiting
  learner could still see the Junta, so the filter could not drift on before the content
  existed to survive it.

  The content exists now. With lisbon-visiting-1 and lisbon-staying-1 in it is 14 / 16 / 23,
  every purpose has a Club of its own, and the guard has become the thing it was guarding
  against. So it inverts: a visitor must NOT be sent to the Junta, and must still have a
  Club worth opening.
*/
await page.goto(BASE + '/club')
await page.waitForTimeout(2600)
const text = ((await page.textContent('body')) ?? '').replace(/\s+/g, ' ')
ok(
  'a visitor is not sent to the Junta',
  !text.includes('Junta de Freguesia'),
  'the promise the purpose question makes',
)
/*
  And the fear that kept it off is measured rather than assumed.

  "It does not empty the Club" is the whole reason this was not switched on two months ago,
  so it is asserted on the rendered feed rather than on the content arithmetic — the numbers
  can be right while the wiring drops everything.
*/
{
  const shown = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).length`,
  )) as number
  ok('and still has a Club worth opening', shown >= 10, shown + ' cards rendered')
  ok(
    'including rooms written for them',
    /A table for two|fado|Sintra/i.test(text),
    'the visiting block reaches the person it was written for',
  )
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhy you are here is asked once, kept, and changes nothing you have done')
