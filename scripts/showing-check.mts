/**
 * Showing: built, and for months reachable from almost nowhere.
 *
 * The mechanic was complete — mint a card of sentences you have actually said, hand it to
 * one person, they show one back and you are a pair, with reporting and blocking behind it.
 * What it did not have was a way in. The feed's share button, the most-tapped share control
 * in the product, posted a link to the homepage; the artefact built to be worth sending sat
 * on /proof, a screen almost nobody finds.
 *
 * So this checks REACHABILITY rather than the mechanic. The mechanic has a database behind
 * it and is tested where that lives; what kept breaking is the question of whether a person
 * can get to it, which is the half no unit test sees.
 */
import { chromium } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []

function ok(what: string, pass: boolean, detail = '') {
  console.log('  ' + (pass ? '✓' : '✗') + ' ' + what + (detail ? '   ' + detail : ''))
  if (!pass) problems.push(what + (detail ? ' — ' + detail : ''))
}

/** Somebody who has said things cold, which is what makes a card mintable. */
const seed = {
  version: 1,
  deal_accepted_at: '2026-08-01T00:00:00.000Z',
  purpose: 'visiting',
  chapter: 'lisbon',
  proof: [
    { pt: 'Uma bica, se faz favor.', en: 'An espresso, please.', source: 'release', clean: true, at: '1' },
    { pt: 'A conta, por favor.', en: 'The bill, please.', source: 'release', clean: true, at: '2' },
    { pt: 'Onde fica o Chiado?', en: 'Where is the Chiado?', source: 'release', clean: true, at: '3' },
  ],
  inventory: {},
  roots_played: [],
  sections_completed: [],
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 780 } })
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, blob]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify(blob))
  },
  [KEY, DEFAULT_PAIR, seed] as const,
)

console.log('\nthe share button sends the artefact, not the homepage\n')
/*
  The specific regression. It shared window.location.origin + '/club' — no card, no
  sentences, nothing of the sender in it — so "are you on DUB?" arrived as a URL instead of
  as three things your friend can now say.

  Asserted on what the handler DOES rather than on the button existing: navigator.share is
  stubbed so the payload can be read, which is the only way to tell an advert from an
  artefact.
*/
await page.goto(BASE + '/club')
await page.waitForTimeout(2600)

/*
  ASSERTED ON THE ATTEMPT, NOT THE OUTCOME, and that distinction is the whole check.

  Minting needs a database and this environment has none — /api/share answers "links are
  not switched on in this environment yet" — so the share correctly falls back to an
  invitation and the URL is /club either way. A check that read the shared URL would
  therefore report the bug as unfixed for ever, locally, while being unable to tell the
  fixed code from the broken code at all.

  What separates them is whether the button TRIES. The old handler built a string and
  opened the sheet, touching the network never; the new one asks for a card first. So the
  request is the evidence, and it is evidence in any environment.
*/
const asked: string[] = []
page.on('request', (r) => {
  if (r.method() === 'POST' && /\/api\/(share|showing)/.test(r.url())) asked.push(new URL(r.url()).pathname)
})

await page.evaluate(`(() => {
  window.__shared = null
  navigator.share = (d) => { window.__shared = d; return Promise.resolve() }
})()`)
const share = await page.$('[data-testid="feed-share"]')
ok('there is a share control', Boolean(share))
if (share) {
  await share.click()
  await page.waitForTimeout(2600)
  ok(
    'it tries to mint a card of what you can say',
    asked.includes('/api/share'),
    asked.length ? asked.join(', ') : 'no request — it built a URL and called that sharing',
  )
  const shared = (await page.evaluate(`window.__shared`)) as { url?: string } | null
  const url = shared?.url ?? ''
  ok('and it shares something either way', Boolean(url), url.replace(BASE, ''))
  /*
    And the fallback is honest rather than silent. With no database there is no showing to
    send, so the invitation is the next best thing a person can hand over — but only after
    the real artefact has been attempted.
  */
  ok(
    'falling back to the invitation only after trying',
    !/\/s\//.test(url) ? asked.includes('/api/share') : true,
    /\/s\//.test(url) ? 'minted a showing' : 'no database here, so the invitation',
  )
}

console.log('\nand the people you have shown are in Yours\n')
/*
  The relationship was invisible. showingsFor has existed and been correct the whole time;
  the only screen that rendered it was /proof, which is not where somebody looks for their
  own things.
*/
await page.goto(BASE + '/profile')
await page.waitForTimeout(2600)
const invite = await page.$('[data-testid="friends-invite"]')
ok('there is a way to show somebody, from Yours', Boolean(invite), invite ? '' : 'buried on /proof')
const body = ((await page.textContent('body')) ?? '').replace(/\s+/g, ' ')
ok(
  'and it is a list, never a number',
  !/\b\d+\s+(friends?|showings?|people)\b/i.test(body),
  'a tally of who has shown you something is a score with extra steps',
)

console.log('\nand a stranger who opens one is given a way in\n')
/*
  The conversion moment of the entire referral loop: somebody who has never heard of DUB
  opens a friend's link. They cannot show anything back — they have said nothing cold — so
  the only thing that screen can honestly offer is the way to get some.
*/
{
  // The viewport belongs to the context; newPage on a context takes no arguments.
  const fresh = await browser.newContext({ viewport: { width: 390, height: 780 } })
  const p2 = await fresh.newPage()
  await p2.goto(BASE + '/s/does-not-exist')
  await p2.waitForTimeout(1600)
  const text = ((await p2.textContent('body')) ?? '').replace(/\s+/g, ' ')
  ok(
    'even a dead link offers the way in',
    /WHAT THIS IS|START/i.test(text),
    'a link that has expired is still somebody being invited',
  )
  await fresh.close()
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nwhat is built can be reached')
