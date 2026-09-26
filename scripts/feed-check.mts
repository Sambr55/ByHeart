/**
 * Does the Club feed behave?
 *
 *   npm run feed
 *
 * Three things a feed has to get right and one it has to refuse.
 *
 * It must LOOP rather than end: swiping past the last card comes back to the first, and
 * the seam has to be invisible. It must reveal the language sideways without navigating
 * away. Every card must fill the screen. And it must never show a count on a like —
 * a product that has spent every other screen refusing to reward turning up cannot grow
 * a score on this one.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { LEGEND_CARD } from '../content/legend'
import { PIECES, ROOTS } from '../content/roots'
import { cardById, cheatCards, explainerCards, fluentCards, idiomCards, legendCards, sheetCards, feedFor, vibeCards } from '../content/feed'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(15000)

const opener = ROOTS.find((r) => r.rung === 2) ?? ROOTS[0]
await page.goto(BASE + '/club')
await page.evaluate(
  ([k, pair, frames, pt, en]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify({
      version: 1,
      deal_accepted_at: '2026-08-01T00:00:00.000Z',
      proof: [{ pt, en, source: 'release', clean: true, at: '1' }],
      inventory: {}, roots_played: [], sections_completed: ['the_basics'],
      legend: (frames as string[]).map((id) => ({ frame_id: id, values: { x: 'y' }, at: '1' })),
      legend_prompt: 'accepted',
      club_welcomed_at: '2026-08-20T00:00:00.000Z',
    }))
  },
  [KEY, DEFAULT_PAIR, LEGEND_CARD.map((f) => f.id), opener.transfer_prompt.answer, opener.transfer_prompt.ask] as const,
)
await page.goto(BASE + '/club')
await page.waitForTimeout(1800)

/*
  WHAT THE FEED ACTUALLY IS, not what one of its producers returns.

  feedFor supplies the rooms and the drops. The component adds the explainers, the vibes
  and the Legend question on top — and this seeded learner is a member with a finished
  Legend, so explainers and the Legend card are both empty and only the vibes land.

  It counted feedFor alone and passed for two months because vibeCards, though written,
  was never called by anything. The moment the vibes reached the Club the number was 12
  short and three assertions about looping went red for a reason that had nothing to do
  with looping.
*/
/*
  How many cards the weave walks, and therefore how many idioms its beat can place.

  The component builds `rest` from the rooms, the Legend cards and the learner's own kept
  things, then walks it pushing an idiom every seventh index. This reproduces that count
  from the same sources rather than hard-coding it.
*/
/*
  AND THE ADVANCED LEGEND CARDS, which the walk also carries.

  `rest` in the component is rooms + legend + FLUENT + the learner's own kept things, and
  this reproduced only the first two. One card short is not a rounding error here: the
  beats divide by it, so a walk of 48 places six idioms and a walk of 49 places seven, and
  the whole sum came out one card light for a reason three assertions away from the count.

  Built from the same fixture this file seeds — a finished Legend and no purpose — so it
  moves if the seed does.
*/
const IDIOM_WALK =
  feedFor().length +
  legendCards([], [], null).length +
  fluentCards(
    LEGEND_CARD.map((f) => ({ frame_id: f.id, values: { x: 'y' }, at: '1' })),
    null,
    [],
  ).length
const IDIOM_BEAT_PLACES = Math.floor(IDIOM_WALK / 7)

const real =
  feedFor().length +
  vibeCards([]).length +
  /*
    And the explainers this seeded learner still sees.

    They used to be none: explainersFor returned nothing at all for a member. It does not
    any more — a member is done being sold to and is not done being told how things work,
    so the translator card and the Club's own explainer survive membership. Computed from
    the same function the component calls rather than typed as a number here, because a
    literal would be right today and silently wrong the next time one is added.
  */
  explainerCards({
    playedAVibe: false,
    legendWritten: true,
    isMember: true,
    usedTranslator: false,
    actedOnACard: false,
    usedTheCalendar: false,
  }).length +
  /*
    And the cheat sheets, for the reason the block above gives.

    Nine closed sets woven in on a beat of five. Counted from sheetCards rather than
    written as 9, because a literal is right today and silently wrong the next time a set
    is added — which is precisely what happened to this check when the vibes arrived.

    Nothing dismissed: this learner is seeded fresh, so every sheet is offered.
  */
  sheetCards([]).length +
  /*
    AND THE IDIOMS THAT THE WEAVE ACTUALLY REACHES, which is not all of them.

    Every other source here appends its leftovers, so its whole length lands in the feed.
    Idioms deliberately do not: all thirty live in the Bob's Your Uncle vibe, openable at
    rung 1, so one the Club did not reach today is one swipe away rather than unoffered —
    and appending them put 22 in a stack at the bottom of the feed, which is the failure
    the sheet beat fixed for itself and this check caught here as 103 sections for 71
    cards.

    So the number is how many the beat places, not how many exist. Derived from the same
    two facts the component uses — the length of the array being walked and the beat — for
    the reason every other line in this sum gives: a literal would be right today.
  */
  Math.min(IDIOM_BEAT_PLACES, idiomCards([], [], []).length) +
  /*
    AND THE CHEATS, woven on a beat of eleven.

    Added to the Club yesterday and not added here, so this sum came up seven short and
    three assertions about LOOPING went red for a reason that had nothing to do with
    looping — the same failure this file's own note describes happening to the vibes two
    months ago, repeated by me.

    Capped by the beat for the reason the idioms are: the weave places one every eleventh
    index, so what lands is min(places, available) rather than everything authored. Only
    the UNLOCKED ones are ever offered — see cheatCards — which is why the inventory is
    passed empty here to match the seeded learner.
  */
  Math.min(Math.floor(IDIOM_WALK / 11), cheatCards({}, [], []).length)

/*
  A SAVED SHEET CAN BE FOUND AGAIN, which is the half that was missing.

  The bookmark on a feed card writes its id to `saved`, and Yours renders a saved id by
  looking it up through cardById — which knew about drops, rooms and words and not about
  sheets. So saving a cheat sheet wrote the id and nothing could resolve it: a control that
  records something invisible looks broken while working perfectly, which is the same fault
  KEEP THIS had and the hardest kind to report.

  Checked as data rather than on a screen, because the fault was a lookup and not a layout.
*/
{
  const sheet = sheetCards([])[0]
  ok(
    'a saved cheat sheet resolves',
    Boolean(sheet && cardById(sheet.id)),
    sheet ? sheet.id : 'no sheets authored',
  )
}

const feed = await page.$('[data-testid="feed"]')
ok('the feed is there', Boolean(feed))

const metrics = async (p: Page) =>
  p.evaluate(() => {
    const el = document.querySelector('[data-testid="feed"]') as HTMLElement
    return { top: el.scrollTop, h: el.clientHeight, all: el.scrollHeight, kids: el.children.length }
  })

const m = await metrics(page)
console.log('\n  ' + real + ' cards, ' + m.kids + ' rendered, viewport ' + m.h + 'px\n')
ok('every card fills the screen', m.all === m.kids * m.h, m.all + ' / ' + m.kids * m.h)
ok(
  'the list is cloned at both ends so it can loop',
  m.kids === real + 2,
  m.kids + ' rendered for ' + real + ' cards',
)
ok('it opens on the first real card, not a clone', m.top === m.h, String(m.top))

/*
  The loop, exercised rather than inspected. Scroll to the trailing clone and check the
  position is silently moved back to the real first card — that swap IS the loop.
*/
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="feed"]') as HTMLElement
  el.scrollTop = el.scrollHeight - el.clientHeight
})
await page.waitForTimeout(500)
const looped = await metrics(page)
ok(
  'swiping past the end comes back to the beginning',
  looped.top === looped.h,
  'landed at ' + looped.top + ', expected ' + looped.h,
)

// And backwards, which is the half people forget.
await page.evaluate(() => {
  const el = document.querySelector('[data-testid="feed"]') as HTMLElement
  el.scrollTop = 0
})
await page.waitForTimeout(500)
const back = await metrics(page)
ok(
  'and swiping back off the front reaches the end',
  back.top === real * back.h,
  'landed at ' + back.top + ', expected ' + real * back.h,
)

console.log('\n  sideways\n')
const pane = await page.evaluate(() => {
  const card = document.querySelector('[data-testid="feed"] section') as HTMLElement
  const scroller = card.querySelector('div') as HTMLElement
  return { w: scroller.clientWidth, all: scroller.scrollWidth }
})
/*
  Three lanes: the language, the face, and away.

  Two was right while left meant "into this one". Left is reject now, so the language moved
  to the left of the face and an empty lane sits to its right for the card to be carried
  into. Exactly three — a fourth would mean a lane nobody named.
*/
ok('each card has exactly three lanes', pane.all === pane.w * 3, pane.all + ' / ' + pane.w * 3)

console.log('\n  the rail\n')
for (const t of ['feed-like', 'feed-save', 'feed-share', 'feed-comment']) {
  const el = await page.$('[data-testid="' + t + '"]')
  const box = el ? await el.boundingBox() : null
  ok(t.replace('feed-', '') + ' is there and thumb-sized', Boolean(box && box.height >= 44 && box.width >= 44),
    box ? Math.round(box.width) + '×' + Math.round(box.height) : 'missing')
}

const text = await page.evaluate(() => (document.querySelector('main') as HTMLElement).innerText)
ok(
  'nothing on a card is counted',
  !/\b\d+\s*(likes?|saves?|shares?)\b/i.test(text),
  'a number next to a like turns the feed into something that wants feeding',
)

// A like is remembered, because a save that forgets is worse than no save.
await page.click('[data-testid="feed-like"]')
await page.waitForTimeout(400)
const liked = await page.evaluate((k) => {
  const s = JSON.parse(localStorage.getItem(k as string) || '{}')
  return (s.liked ?? []).length
}, KEY)
ok('a like is written down', liked === 1, String(liked))

console.log('\nyours, on the profile\n')
/*
  The words came out of the feed because they read as the same kind of thing as a room —
  same shape, same rail, same full-bleed photograph — so the feed was two sorts of card
  competing to be understood. They are not lost; this is where they went.
*/
const prof = await browser.newPage({ viewport: { width: 390, height: 1200 } })
await prof.goto(BASE + '/profile')
/*
  With a couple of words banked, because YOUR WORDS is the learner's inventory now.

  The fixture had `inventory: {}` — right while that section was four editorial cards
  shown to everybody, and wrong now that it is what this person owns. An empty inventory
  renders the empty state correctly, so the assertion below was measuring the fixture
  rather than the screen.
*/
const someWords = Object.keys(PIECES).slice(0, 3)
await prof.evaluate(
  ([k, pair, words]) => {
    localStorage.setItem('byheart.pair', JSON.stringify(pair))
    localStorage.setItem(k as string, JSON.stringify({
      version: 1, deal_accepted_at: '2026-08-01T00:00:00.000Z', proof: [],
      inventory: Object.fromEntries(
        (words as string[]).map((id, i) => [
          id,
          {
            target_id: id,
            acquired_source: 'the_basics',
            reinforced_sources: [],
            latest_state: 'NEW',
            latest_recall_at: '2026-08-0' + (i + 1) + 'T00:00:00.000Z',
          },
        ]),
      ),
      roots_played: [], sections_completed: ['the_basics'],
      finished_cards: ['lisbon_farmacia'], saved: ['lisbon_cafe'], liked: [],
    }))
  },
  [KEY, DEFAULT_PAIR, someWords] as const,
)
await prof.goto(BASE + '/profile')
await prof.waitForTimeout(1200)

const feedText = await page.evaluate(() => (document.querySelector('main') as HTMLElement).innerText)
ok('no word cards in the feed', !/WORTH HAVING/.test(feedText))

/*
  THE TILES ARE INSIDE SECTIONS THAT START CLOSED.

  Yours is a concertina now — five rows, one open at a time — so a tile only exists in the
  DOM once its section is open. That is the design rather than a regression: the screen's
  first statement is how much there is of each pile, not the first six things in the first
  one.

  So the check opens the two sections that hold tiles and looks in both. It no longer
  looks for a vocab tile on this screen at all: WORTH HAVING rendered four editorial cards
  that were identical for every learner, and the row that replaced it is the learner's own
  inventory, rendered as lines of Portuguese rather than as 3/4 photographs.
*/
const tiles: { id: string | null; ratio: number }[] = []
/*
  YOURS IS DECKS NOW, not tile sections.

  This opened `been-through` and `put-aside`, counted `tile-*` elements and then clicked
  one — and all three of those are gone: the strips were replaced by the library's eight
  collapsible decks, so every assertion here was describing a screen that no longer
  exists.

  THE CLAIMS ARE THE SAME and are still worth holding: a learner must be able to find what
  they finished, and opening one must land on a real card. So they are asked of the decks,
  which is where those things now live.
*/
const deckIds = await prof.$$eval('[data-testid^="deck-"]', (els) =>
  els.map((e) => e.getAttribute('data-testid') ?? ''),
)
console.log('  ' + deckIds.length + ' decks')
ok('the library has its decks', deckIds.length >= 5, deckIds.join(' '))
ok('including the rooms you have been through', deckIds.includes('deck-vibes'))
ok('and your own Legend', deckIds.includes('deck-legend'))

/*
  OPEN THE ONE THIS FIXTURE ACTUALLY FILLS.

  The profile page is seeded separately from the feed — see the second evaluate above —
  with a finished basics section and some owned words, and NO legend. So the legend deck
  is correctly empty here and asserting against it reported "0 cards" about a record that
  was never given any.

  ROOMS is what this learner has: the basics, finished. Opened only if it is shut, because
  one deck opens by default — whichever has room, see openAtFirst — so an unconditional
  click is as likely to close the one deck holding anything.
*/
const roomsDeck = await prof.$('[data-testid="deck-vibes"]')
if (roomsDeck && (await roomsDeck.getAttribute('aria-expanded')) !== 'true') {
  await roomsDeck.click()
  await prof.waitForTimeout(600)
}
const collected = await prof.$$eval('[data-testid^="collected-"]', (els) =>
  els.map((e) => ({
    id: e.getAttribute('data-testid') ?? '',
    ratio: (e as HTMLElement).clientWidth / Math.max(1, (e as HTMLElement).clientHeight),
  })),
)
ok('what you finished is here', collected.length > 0, collected.length + ' cards')
/* Three by four, which is the shape every collected card keeps. */
ok(
  'every card is three by four',
  collected.every((c) => Math.abs(c.ratio - 0.75) < 0.05),
  [...new Set(collected.map((c) => c.ratio.toFixed(2)))].join(', '),
)

/*
  AND OPENING ONE LANDS ON A REAL CARD.

  This clicked `tile-lisbon_farmacia`, which no longer exists. A collected card opens a
  REVISION now rather than the card itself — see /revise — so the lane geometry below is
  checked on the feed's own card, which is where card-panes actually lives.
*/
await prof.goto(BASE + '/club')
await prof.waitForTimeout(1800)
const panes = await prof.evaluate(() => {
  const el = document.querySelector('[data-testid="card-panes"]') as HTMLElement
  return el ? { w: el.clientWidth, all: el.scrollWidth, at: el.scrollLeft } : null
})
/*
  THREE lanes now, and the card starts in the middle one.

  It was two — face then language — and swiping left was the reveal. Left is reject now, so
  the language moved to the left of the face and an away lane sits to the right of it. The
  starting position is the load-bearing part: a three-lane scroller opens at lane 0 unless
  told otherwise, which would show every card already answered.
*/
ok(
  'a card is three lanes wide',
  Boolean(panes && panes.all === panes.w * 3),
  panes ? panes.all + ' / ' + panes.w : 'no panes',
)
ok(
  'and opens on the middle one, the face',
  Boolean(panes && Math.abs(panes.at - panes.w) < 4),
  panes ? 'at ' + panes.at + ', face is ' + panes.w : '',
)
await prof.click('[data-testid="card-continue"]')
await prof.waitForTimeout(800)
const after = await prof.evaluate(() => (document.querySelector('[data-testid="card-panes"]') as HTMLElement).scrollLeft)
/*
  Entering goes LEFT now, toward lane 0. The old assertion was `after > 0`, which was true
  of the old direction and is true of the starting position too — it would pass on a button
  that did nothing at all.
*/
ok('and the button opens the language, which is now leftward', after === 0, 'scrolled to ' + after)
await prof.close()

console.log('\nreject sinks a card, and rewind brings it back\n')
/*
  The new verb, and the promise attached to it.

  Left used to open a card; it carries it away now. The thing worth asserting is not that
  the gesture fires — it is that NOTHING IS LOST when it does. The feed is thirty-five rooms
  and a reject that removed a card would let a bored thumb permanently shrink somebody's
  Club, so a rejected card sinks behind the others and comes back.

  Driven by scrolling the lane rather than by calling the handler, because settling on the
  away lane IS the gesture — a half-swipe that springs back must do nothing, and only a real
  scroll can prove that.
*/
{
  const titles = async () =>
    (await page.evaluate(
      `Array.from(document.querySelectorAll('.snap-y > section')).slice(1, -1)
        .map(s => (s.innerText || '').split(String.fromCharCode(10)).filter(Boolean)[1] || '')`,
    )) as string[]

  /*
    MEASURED ON THE RECORD AND THE COUNT, not on a title.

    The first version tracked a card by its heading and asked where it moved to. The Duran
    Duran drop contributes four cards that all carry the same header line, so indexOf found
    a different one and reported "0 → 0" on a reject that had worked perfectly.

    The two claims are simpler than a position anyway: the reject is RECORDED, and the feed
    is still the same length afterwards. Nothing lost is the promise; the ordering is
    covered by the code that builds it.
  */
  const rejects = async () =>
    (await page.evaluate(
      `(() => {
        try {
          const k = Object.keys(localStorage).find(k => k.startsWith('byheart.learner.v1'))
          return k ? (JSON.parse(localStorage.getItem(k) || '{}').rejected ?? []) : []
        } catch { return [] }
      })()`,
    )) as string[]

  const before = await titles()
  const wasRejected = await rejects()

  // A half-swipe: out toward away, then back. Nothing may happen.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    r.scrollTop = r.clientHeight * 2
  })()`)
  await page.waitForTimeout(700)
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    const s = r.children[2]
    const p = s.querySelector('[data-testid="card-panes"]')
    /*
      A fifth of the way past the face, whatever lane the face is.

      This was 1.2 * clientWidth, which assumed the face was lane 1 — true of a room and
      false of a drop, whose remaining evening now sits between the face and the language
      lane. Measured from the far end instead: away is the LAST lane, always.
    */
    const away = p.scrollWidth - p.clientWidth
    p.scrollLeft = away - p.clientWidth * 0.8
  })()`)
  await page.waitForTimeout(600)
  ok(
    'a half-swipe toward away does nothing',
    (await rejects()).length === wasRejected.length,
    'a gesture you can abandon is what makes it cheap',
  )

  // And all the way.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    const s = r.children[2]
    const p = s.querySelector('[data-testid="card-panes"]')
    // All the way to the away lane, which is the end of the scroller by construction.
    p.scrollLeft = p.scrollWidth - p.clientWidth
  })()`)
  await page.waitForTimeout(1400)
  const now = await rejects()
  ok('settling on away rejects the card', now.length === wasRejected.length + 1, now.join(', '))
  const after = await titles()
  ok(
    'and nothing left the feed',
    after.length === before.length,
    after.length + ' cards, was ' + before.length + ' — reject sinks, it does not destroy',
  )

  const rewind = await page.$('[data-testid="feed-rewind"]')
  ok('rewind appears once there is something to bring back', Boolean(rewind))
  if (rewind) {
    await rewind.click()
    await page.waitForTimeout(1400)
    ok(
      'and it undoes the last one',
      (await rejects()).length === wasRejected.length,
      'one step, which is the one somebody wants',
    )
  }
}

console.log('\nthe loop comes round under a real swipe\n')
/*
  Under a programmatic instant scroll there is no snap animation to fight, which is how the
  old 90ms debounce passed a check while failing on a phone: it set scrollTop while the
  browser was still animating to the snap point, and the snap overruled it. Driven with the
  wheel here so the animation is real.
*/
{
  await page.goto(BASE + '/club')
  await page.waitForTimeout(2500)
  const n = await page.evaluate(`document.querySelectorAll('[data-testid="feed"] > section').length`) as number
  const seen: number[] = []
  for (let i = 0; i < n + 3; i++) {
    await page.mouse.move(195, 400)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(700)
    seen.push(
      (await page.evaluate(
        `(() => { const el = document.querySelector('[data-testid="feed"]'); return Math.round(el.scrollTop / el.clientHeight) })()`,
      )) as number,
    )
  }
  const stuck = seen.slice(-3).every((v) => v === seen[seen.length - 1])
  ok(
    'it wraps rather than stopping at the last card',
    !stuck,
    'indices: ' + seen.join(' '),
  )
}

console.log('\na card with no photograph still has a ground\n')
/*
  Drop rooms are authored the week they matter and will not always have a picture ready.
  An empty near-black rectangle reads as a broken image, which is worse than no image.
*/
{
  await page.goto(BASE + '/club?preview=drops')
  await page.waitForTimeout(2500)
  const painted = await page.evaluate(`(() => {
    /*
      Index 1, not 0. The loop renders [last, ...cards, first] so the two clones make the
      wrap seamless — which means the first element in the DOM is the LAST card.
    */
    const first = document.querySelectorAll('[data-testid="feed"] > section')[1]
    if (!first) return null
    return {
      photo: Boolean(first.querySelector('img')),
      pattern: Boolean(first.querySelector('.card-ground')),
      says: (first.textContent || '').trim().slice(0, 24),
    }
  })()`) as { photo: boolean; pattern: boolean; says: string } | null
  ok('the drop is first in the feed', painted?.says.startsWith('A DROP') === true, painted?.says ?? '')
  ok(
    'and it has something behind it',
    Boolean(painted && (painted.photo || painted.pattern)),
    painted?.photo ? 'a photograph' : 'the pattern',
  )
}

/*
  THE CLUB OPENS ON THE CLUB, not on an explanation of it.

  Sam: "you have mixed up the intro to the club cards with actual club cards, there needs
  to be a clear delineation."

  Everybody who reaches this feed built a Legend to get in — Club.tsx turns away anybody
  without one, and the showcase stage returns its own sequence long before the weave. So
  the explainers here are reference, not an argument: what the translator is, what the
  Club is, what Pro adds. On a beat of two they were landing at positions 2 and 5, which
  is the product introducing itself to somebody who has been using it for a month.

  Asserted on the first handful rather than on the whole feed, because the cards are not
  banned — they are useful and they stay. What may not happen is one of them greeting you.
*/
{
  const opening = await page.evaluate(() =>
    [...document.querySelectorAll('section')]
      .slice(0, 8)
      .map((s) => (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)),
  )
  const EXPLAINER_EYEBROWS = ['ANY MOMENT', 'THIS PLACE', 'THIS MONTH', "HERE'S HOW IT WORKS"]
  const early = opening.filter((t) => EXPLAINER_EYEBROWS.some((e) => t.startsWith(e)))
  ok(
    'no explainer greets a member in the Club',
    early.length === 0,
    early.length ? early.join(' / ') : 'the first eight cards are all content',
  )
}

/*
  A RETURNING LEARNER NEVER MEETS THE INTRO AGAIN.

  Sam: "what happens to a returning user, they shouldn't see the intro cards."

  The routing was already right — app/page.tsx sends a member to /club and a mid-game
  learner to /vibes, with a blank frame in between so the pitch cannot flash past. What
  was not guarded is that it STAYS right, and the ways it could break are quiet ones: the
  redirect is gated on chosenPair(), so any path that loses the pair drops a member back
  on the landing screen looking like a first-time visitor. That is exactly what the /skip
  tool did until this was written.

  Checked from the front door and from the Club tab, including with ?in=1 — the parameter
  that opens the showcase for somebody arriving through the door, and which must not
  resurrect it for somebody who is already inside.
*/
{
  const INTRO = ['HERE’S HOW IT WORKS', 'NOT THIS ONE', 'SIXTY SECONDS', 'THE WAY IN', 'ONE DECISION']
  for (const route of ['/', '/club?in=1']) {
    await page.goto(BASE + route)
    await page.waitForTimeout(1800)
    const seen = (await page.evaluate(() =>
      (document.body.innerText || '').replace(/\s+/g, ' '),
    )) as string
    const hits = INTRO.filter((x) => seen.includes(x))
    const landed = new URL(page.url()).pathname
    /*
      THE DESTINATION, not just the absence of intro copy.

      The first version of this only searched for the tutorial cards' words, and it passed
      with the redirect deliberately broken — because `/` renders the LANDING screen, "Find
      Yourself in Language" and COME IN, which contains none of those words and is still
      the last thing a member should ever see. A check that a regression walks straight
      past is worse than none, because it reports the thing as guarded.

      So both halves: a member ends up in the Club, and nothing in the tutorial sequence is
      on screen when they get there.
    */
    ok(
      'a member opening ' + route + ' lands in the Club',
      landed === '/club',
      'landed at ' + landed,
    )
    ok(
      'and does not get the intro on the way',
      hits.length === 0,
      hits.join(', ') || 'no tutorial copy on screen',
    )
  }
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nit loops, it reveals sideways, and it does not keep score')
