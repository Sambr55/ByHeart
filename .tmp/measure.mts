import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { ROOTS_BY_FAMILY } from '../content/roots'
const BASE = 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
type R = { root_id: string; transfer_prompt: { answer: string; ask: string } }
const basics = ((ROOTS_BY_FAMILY as Record<string, R[]>)['the_basics'] ?? []).slice(0, 3)

const SEED = `(() => {
  localStorage.setItem('byheart.pair', ${JSON.stringify(JSON.stringify(DEFAULT_PAIR))});
  localStorage.setItem(${JSON.stringify(KEY)}, ${JSON.stringify(JSON.stringify({
    version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z',
    proof: [{ pt: basics[0].transfer_prompt.answer, en: basics[0].transfer_prompt.ask, source: 'release', clean: false, at: '1' }],
    inventory: {}, roots_played: basics.map(r => r.root_id), sections_completed: ['the_basics'],
    legend: [], saved: [], liked: [], finished_cards: [],
    club_welcomed_at: '2026-08-20T00:00:00.000Z',
  }))});
})()`

const SRC = `(() => {
  const q = (s) => document.querySelector(s);
  const nav = q('[data-testid="bottom-nav"]');
  const dock = q('.dock');
  const cs = getComputedStyle(document.documentElement);
  const rect = (e) => e ? e.getBoundingClientRect() : null;
  const n = rect(nav), d = rect(dock);
  const scroller = document.scrollingElement || document.documentElement;
  return {
    barRoom: cs.getPropertyValue('--bar-room').trim(),
    barH: cs.getPropertyValue('--bar-h').trim(),
    navH: n ? Math.round(n.height) : null,
    navBottomToVh: n ? Math.round(innerHeight - n.bottom) : null,
    gapDockToNav: (d && n) ? Math.round(n.top - d.bottom) : null,
    scrollable: Math.max(0, scroller.scrollHeight - scroller.clientHeight)
  };
})()`

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
await p.goto(BASE + '/vibes')
await p.evaluate(SEED)
for (const route of ['/club','/profile','/calendar','/legend','/proof']) {
  try {
    await p.goto(BASE + route, { waitUntil: 'networkidle' })
    await p.waitForTimeout(400)
    console.log(route.padEnd(11), JSON.stringify(await p.evaluate(SRC)))
  } catch (e) { console.log(route.padEnd(11), 'ERR', (e as Error).message.split('\n')[0]) }
}
await b.close()
