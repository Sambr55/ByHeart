/**
 * A pick list that cannot hold everybody has a way out of it.
 *
 *   npm run open:slot
 *
 * The Legend's work slot offers ten fields, and somebody in advertising has nothing to
 * pick — reported as "it doesn't have advertising for instance so that is me stumped".
 * A plain text box is not the answer either: the frame is "Trabalho com {thing}" and a
 * bare box asks the learner to do the translating, which is the complaint that turned
 * this slot into a pick list in the first place.
 *
 * So the slot borrows the translator, and this measures the whole round trip: the chip is
 * there, it opens the panel asking for a word rather than a sentence, and the answer lands
 * in the frame as a bare noun.
 *
 * THE TRIM IS THE PART THAT BROKE. The frame supplies its own full stop and Portuguese
 * likes an article in front of a bare noun, so "a publicidade." became "Trabalho com a
 * publicidade..". The cleanup lives where the word LANDS rather than where it is sent,
 * because that is the path every route into the slot has to take — and this asserts the
 * sentence, which is the only thing that proves it.
 *
 * The word is dispatched rather than translated for real: the API costs money per call and
 * the thing under test is the plumbing, not the model.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS } from '../content/roots'
import { LEGEND_FRAMES, doorwayRoots } from '../content/legend'

/*
  THE LEARNER OWNS THE WORDS THE CARD IS BUILT FROM.

  The fixture had `inventory: {}` and leaned on sections_completed alone, which was enough
  while the Legend opened on crates and nothing else. It is not any more: a card stays shut
  until the learner has the words in its `built_from`, so the work card was blocked, MAKE
  IT MINE never rendered, and this check died on a 30-second timeout rather than a failed
  assertion — the worst way for a gate to break, because it says nothing about what is
  wrong.

  Derived from the frame rather than typed, so the day `work` is built from a second word
  this fixture follows it instead of going stale again.
*/
const WORK = LEGEND_FRAMES.find((f) => f.id === 'work')!
const OWNED = Object.fromEntries((WORK.built_from ?? []).map((id) => [id, 'strong']))

/*
  AND THE DOOR IS ACTUALLY OPEN, which sections_completed alone no longer means.

  The door is two halves — the doorway roots AND the chosen vibes — and this fixture
  satisfied the second and left the first empty, so legendStatus said toGo: 7 and the whole
  deck was behind the locked screen. Played rather than asserted: the same list the door
  counts, so this cannot drift from it.
*/
const PLAYED = doorwayRoots().map((r) => r.root_id)
const BASE = 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 900 } })
await p.addInitScript(([k, pair, v]) => {
  localStorage.clear()
  localStorage.setItem('byheart.pair', JSON.stringify(pair))
  localStorage.setItem(k as string, JSON.stringify(v))
}, [KEY, DEFAULT_PAIR, {
  version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z', profile: { goal: 'curious' },
  inventory: OWNED, roots_played: PLAYED, sections_completed: ['the_basics','top_gun','james_bond','bridget_jones','pulp_fiction'],
  finished_cards: [], saved: [], liked: [], asked: [], evidence: [], legend: [],
  club_welcomed_at: '2026-08-20T00:00:00.000Z',
  proof: ROOTS.filter((r) => r.rung <= 2).slice(0, 6).map((r, i) => ({
    pt: r.transfer_prompt.answer, en: r.transfer_prompt.ask, source: 'release', clean: true, at: String(i + 1) })),
}] as const)
await p.goto(BASE + '/legend')
await p.waitForTimeout(2600)
await p.click('text=O que fazes?')
await p.waitForTimeout(1500)
await p.click('text=MAKE IT MINE')
await p.waitForTimeout(1400)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nthe way out of a list that cannot hold everybody\n')
ok('the slot offers a way to ask', await p.isVisible('[data-testid="slot-ask-thing"]'))
await p.click('[data-testid="slot-ask-thing"]')
await p.waitForTimeout(1200)
ok('and it opens the translator', await p.isVisible('[data-testid="translator-input"]'))
/*
  Asking for a WORD, not a sentence. The placeholder is the whole of how the panel says
  what it wants, so it is the honest thing to assert.
*/
ok(
  'asking for a word rather than a sentence',
  (await p.getAttribute('[data-testid="translator-input"]', 'placeholder')) === 'advertising',
  String(await p.getAttribute('[data-testid="translator-input"]', 'placeholder')),
)
/* The API needs a key; simulate the answer coming back rather than spend a call. */
await p.evaluate(`window.dispatchEvent(new CustomEvent('dub:word', { detail: { for: 'legend:work:thing', pt: 'a publicidade.', en: 'advertising' } }))`)
await p.waitForTimeout(900)
const said = await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll('p')).find((e) => /^Trabalho com/.test((e.textContent ?? '').trim()))
  return el ? (el.textContent ?? '').trim() : null
})
ok('the word lands in the frame', Boolean(said), said ?? 'no sentence built')
ok(
  'as a bare noun, with no article and one full stop',
  said === 'Trabalho com publicidade.',
  said ?? '(none)',
)
await b.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const x of problems) console.log('  ✗ ' + x)
  process.exit(1)
}
console.log('\na job that is not on the list is still a job\n')
