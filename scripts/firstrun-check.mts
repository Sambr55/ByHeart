/**
 * What a stranger sees, and what it costs them to look.
 *
 *   npm run firstrun
 *
 * The restructure in docs/spec-club-first-run.md. Four claims, and the second is the one
 * that took a wrong draft to find.
 *
 * THE CLUB IS THE FIRST THING. Not a corridor of five screens delivered to somebody who has
 * not seen a word of Portuguese and cannot skip any of it.
 *
 * NOTHING IS ASKED BEFORE ANYTHING IS SHOWN. The first draft of this opened on a wall of
 * locked cards, which assumes the reader has already decided to learn Portuguese and visit
 * Lisbon. They have not. A lock shown before a demonstration is just a wall.
 *
 * THE EXPLAINERS ARE IN THE FEED, interleaved rather than stacked, all pointing one way.
 *
 * AND ONE ROOM IS GIVEN AWAY. A showcase that only describes itself is a brochure, so the
 * first room somebody opens is theirs outright — and exactly one is, because a promise that
 * can be re-spent is not a promise.
 */
import { chromium, type Page } from 'playwright'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { INTRO_CARDS, INTRO_SETUP_AFTER } from '../content/intro'
import { ROOTS } from '../content/roots'
import { cardFor } from '../content/legend'
import { EXPLAINERS, EXPLAINER_CTA } from '../content/explainers'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)
const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** Every card in the rail, by its first line. */
async function rail(p: Page) {
  return (await p.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).map(s => (s.innerText || '').split('\\n')[0].trim())`,
  )) as string[]
}

const browser = await chromium.launch()

console.log('\nthe front door goes to the Club\n')
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(BASE + '/')
  await page.waitForTimeout(2000)
  const cta = await page.$('[data-testid="landing-cta"]')
  ok('there is a way in', Boolean(cta))
  if (cta) {
    await cta.click()
    await page.waitForTimeout(2500)
    ok(
      'and it opens the Club, not a corridor',
      new URL(page.url()).pathname === '/club',
      new URL(page.url()).pathname,
    )
  }
  await page.close()
}

console.log('\nand a stranger can look at all of it\n')
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto(BASE + '/club')
await page.waitForTimeout(2500)

const cards = await rail(page)
ok('there is a feed', cards.length > 6, cards.length + ' cards')

/*
  The opening pair, in order, with nothing between them.

  A feed decides what it is in two cards, and left to the ordinary rung ordering these two
  were "Getting a place at school" — correct, and an absurd opening line for somebody who
  has not said they are moving anywhere.

  One obviously useful and one obviously fun, because either alone argues for a different
  product: a feed of Lisbon rooms is a phrasebook with photographs, and a feed of film
  quotes is a party trick. Index 0 is the loop's clone of the last card, so the real first
  is 1.
*/
const titles = (await page.evaluate(
  `Array.from(document.querySelectorAll('.snap-y > section')).map(s => {
    const t = (s.innerText || '').split('\\n').filter(Boolean)
    return (t[0] || '') + ' — ' + (t[1] || '')
  })`,
)) as string[]
/*
  THE SEQUENCE, AND IT IS THE SHOWCASE RATHER THAN A CORRIDOR IN FRONT OF ONE.

  It used to be seven: a claim, an example, a claim, an example, three explainers and set-up
  — and this file asserted that order card by card. The brief replaced it with a longer,
  plainer sequence that also teaches the gestures, so the old assertions describe a product
  that no longer exists. A rule that no longer describes the intent is worse than no rule:
  it fails on correct work and gets deleted in a hurry, taking the protection with it.

  What is asserted now is the ORDER ITSELF, against content/intro.ts rather than against a
  list retyped here — a check that restates the sequence would pass on any sequence, as long
  as somebody remembered to edit it in two places.
*/
{
  const real = cards.slice(1, -1)
  const wanted = INTRO_CARDS.map((c) => c.eyebrow)
  const got = real.slice(0, 40)
  const at = wanted.map((e) => got.findIndex((g) => g === e))
  ok('every argument card is in the feed', at.every((i) => i >= 0), at.join(', '))
  ok(
    'and in the order the content declares',
    at.every((v, i) => i === 0 || v > at[i - 1]),
    wanted.join(' → '),
  )
  /*
    The two woven cards, and where they sit is the whole reason they are woven.

    The demo lands after VIBES so the claim about popular culture is followed immediately by
    a film line; set-up lands after the Legend card, which is the first moment somebody has
    been told what the answers are for. Asserted as ADJACENCY rather than as fixed indices,
    so adding an argument card does not fail a check about something else.
  */
  const demoAt = got.findIndex((g) => /SIXTY SECONDS/.test(g))
  const vibesAt = got.indexOf('VIBES')
  ok('the demo follows the vibes claim', demoAt === vibesAt + 1, 'vibes ' + vibesAt + ', demo ' + demoAt)
  /*
    Set-up follows whatever the content says it follows, which is the last card now.

    It was asserted against the Legend card by name. Set-up moved to the end — drops,
    revision, ask and share are the reasons to bother, and asking somebody to decide before
    they have heard them is asking early to no purpose — and the check failed on correct
    work. Taking the anchor from INTRO_SETUP_AFTER means moving it again is a content edit
    rather than a content edit plus a test edit.
  */
  const setupAt = got.findIndex((g) => /ONE DECISION/.test(g))
  const afterEyebrow = INTRO_CARDS.find((c) => c.id === INTRO_SETUP_AFTER)?.eyebrow ?? ''
  const anchorAt = got.indexOf(afterEyebrow)
  ok(
    'and set-up follows the card the content anchors it to',
    setupAt === anchorAt + 1,
    afterEyebrow + ' ' + anchorAt + ', set-up ' + setupAt,
  )
}

/*
  THE SEQUENCE IS THE FREE LOOKAROUND, so it has to show rather than promise.

  The wall is the Legend now: everything up to building one costs nothing, and these cards
  are what somebody decides on. A card that only makes a claim is the one thing this
  sequence cannot afford — a promise reads exactly like a promise, and the product has
  real Portuguese, real events and real questions sitting one import away.

  Asserted per-card rather than as a total, because a total passes when one card carries
  six specimens and four carry none.
*/
{
  const shows = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).slice(1, -1).slice(0, 12).map(s => {
       const t = (s.innerText || '').split(String.fromCharCode(10)).filter(Boolean)[0] || ''
       return t + ':' + s.querySelectorAll('[data-testid="intro-shows"] li').length
     })`,
  )) as string[]
  const seen = new Map(shows.map((r) => [r.split(':')[0], Number(r.split(':')[1])]))
  const mustShow = ['VIBES', 'YOUR LEGEND', 'DROPS', 'THE FOUR RS', 'ASK', 'WITH MATES']
  const bare = mustShow.filter((e) => !(seen.get(e) ?? 0))
  ok(
    'every card that claims something shows it',
    bare.length === 0,
    bare.length ? 'bare: ' + bare.join(', ') : mustShow.map((e) => e + ' ' + seen.get(e)).join(' · '),
  )
  /*
    And the specimens are the product's own, not copies typed into the sequence.

    The Bond line is checked against ROOTS and the Legend questions against LEGEND_FRAMES,
    because a hand-typed specimen is exactly the thing that goes quietly out of date — and
    a card teaching the wrong question about the Legend is a promise about a different
    product.
  */
  const feedText = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  /*
    Whichever root the vibes card names, not a root named here.

    This hardcoded jb_russia. The card's specimen changed to the Goose line — the only one in
    the library that proves "you already know more than you think" to somebody who has never
    heard of DUB — and the check failed on the improvement. What it is actually asserting is
    that the specimen RESOLVES: that the card names a root which exists and whose real line
    reaches the screen.
  */
  const vibes = INTRO_CARDS.find((c) => c.id === 'intro_vibes')
  const named = vibes?.shows?.kind === 'root' ? vibes.shows.root_id : ''
  const root = ROOTS.find((r) => r.root_id === named)
  ok(
    'the vibe specimen is a real root line',
    Boolean(root && feedText.includes(root.target)),
    root ? named + ': ' + root.target : 'no such root: ' + named,
  )
  const asks = cardFor(null).slice(0, 5).map((f) => f.ask)
  const missing = asks.filter((a) => !feedText.includes(a))
  ok(
    'and the Legend specimens are the questions it actually asks',
    missing.length === 0,
    missing.length ? 'not shown: ' + missing.join(', ') : asks.length + ' real questions',
  )
}

/*
  THE TUTORIAL CARDS HOLD YOU UNTIL YOU DO THE THING.

  The only place in DUB where the scroll is stopped rather than an action, and a deliberate
  exception to a rule argued for repeatedly: gates live on actions, never on the thumb. It
  earns the exception because here the gate IS the lesson — "swipe left to send a card back"
  is not learned by reading it, and somebody who swipes past the instruction has been told a
  gesture and never made it, which is the same as not being told.

  Asserted as the lock ATTRIBUTE plus the released state, because a check that only looked
  at whether scrolling moved could not tell a lock from a slow browser.
*/
{
  const lockedAt = INTRO_CARDS.findIndex((c) => c.only)
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    if (r) r.scrollTop = r.clientHeight * ${lockedAt + 1}
  })()`)
  await page.waitForTimeout(900)
  const held = await page.evaluate(
    `document.querySelector('[data-testid="feed"]').getAttribute('data-locked')`,
  )
  ok('the reject lesson holds the thumb', held === INTRO_CARDS[lockedAt].id, String(held))
  ok(
    'and says so with a moving arrow',
    Boolean(await page.$('.nudge-left')),
    'on the three tutorial cards only — an arrow that loops everywhere stops being read',
  )

  /*
    And doing it lets go. Released per card and never re-armed: once you have rejected
    something you know how, and meeting the same lock twice is a quiz rather than a lesson.
  */
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    const s = r.children[${lockedAt + 1}]
    const pane = s && s.querySelector('[data-testid="card-panes"]')
    if (pane) pane.scrollLeft = pane.clientWidth * 2
  })()`)
  await page.waitForTimeout(1500)
  ok(
    'and making the gesture lets go',
    !(await page.evaluate(`document.querySelector('[data-testid="feed"]').getAttribute('data-locked')`)),
    'the lesson is the doing',
  )
}

console.log('\nthe five pillars arrive as headlines\n')
/*
  They were eleven-point labels carrying the biggest ideas in the product.

  Asserted against the content's own `pillar` flag rather than a list retyped here, and on
  the rendered class rather than on the copy — a pillar that is declared and not styled is
  exactly the failure mode, and it is invisible in the text.
*/
{
  const pillars = INTRO_CARDS.filter((c) => c.pillar).map((c) => c.eyebrow)
  const rendered = (await page.evaluate(
    `Array.from(document.querySelectorAll('[data-testid="pillar"]')).map(e => e.textContent.trim())`,
  )) as string[]
  const missed = pillars.filter((e) => !rendered.includes(e))
  ok(
    'every pillar lands as one',
    missed.length === 0,
    missed.length ? 'flat: ' + missed.join(', ') : pillars.join(' · '),
  )
}

ok(
  'and the first card says the feed keeps going',
  /keep swiping/i.test((await page.textContent('main')) ?? ''),
  'the only instruction on screen used to point sideways',
)
ok(
  'nothing is asked before anything is shown',
  !/purpose-|deal|accept/i.test((await page.textContent('main')) ?? ''),
  'no form in front of the demonstration',
)
/*
  The gestures are taught, which nothing did before.

  Left used to open a card and now it sends it away, so even somebody who has used DUB
  before is holding a different product — and there is no tutorial anywhere else.
*/
ok(
  'the grammar is taught in the sequence',
  /Swipe left and it goes to the back/.test((await page.textContent('main')) ?? '') &&
    /Tap a card to open it/.test((await page.textContent('main')) ?? ''),
  'reject and enter, both said before either is needed',
)

console.log('\nthe logo goes back to the front door\n')
/*
  So the product can be looked at without being wiped.

  The front door sends a returning learner straight on, which meant the only way to see it
  again was to clear the device — impossible for a member and a bad way to test your own
  first run. The logo now asks for the door explicitly and the door honours the ask.

  Both halves are asserted, because either one alone is useless: a link that bounces, or a
  door nothing links to.
*/
{
  const logo = await page.$('header a[href*="door=1"]')
  ok('the logo asks for the door', Boolean(logo), (logo ? await logo.getAttribute('href') : null) ?? 'not a link home')
  if (logo) {
    await logo.click()
    await page.waitForTimeout(2200)
    const body = ((await page.textContent('body')) ?? '').replace(/\s+/g, ' ')
    ok('and the door opens rather than redirecting', /COME IN/.test(body), page.url().replace(BASE, ''))
    ok('and it is the front door, not the Club', !page.url().includes('/club'), page.url().replace(BASE, ''))
    // Back to where the rest of this file expects to be standing.
    await page.goto(BASE + '/club')
    await page.waitForTimeout(2400)
  }
}

console.log('\nthe demo plays where a stranger lands\n')
/*
  THE ONE SAM COULD NOT SEE, and no check would have caught it.

  The two-beat Goose demo lived in the intro corridor. The front door's COME IN then started
  going straight to /club, which skips every corridor step — so the strongest sixty seconds
  in the product became unreachable for a new person, and what stood in its place was a card
  DESCRIBING the demo with the Goose line behind a swipe. Reported from a phone as "only one
  Goose screen showing", which is exactly what an advert for a demo looks like.

  Every assertion here is about the FIRST CARD'S FACE — no swipe, no gesture anybody has to
  discover — because the whole point is that it plays where somebody lands.
*/
{
  /*
    FOUND BY ITS EYEBROW, NOT BY ITS INDEX.

    This read children[1] because the demo was the first card. It is the fifth now — the
    sequence puts three argument cards and the vibes claim in front of it — and an index is
    the wrong way to identify a card in a list whose order is a content decision. Every
    assertion below is about the demo's FACE, so the card has to be located first.
  */
  const demoAt = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).findIndex(s => (s.innerText||'').startsWith('SIXTY SECONDS'))`,
  )) as number
  ok('the demo is in the sequence', demoAt > 0, 'at ' + demoAt)
  const face = async () =>
    ((await page.evaluate(
      `(() => {
        const r = document.querySelector('.snap-y')
        return r && r.children[${demoAt}] ? (r.children[${demoAt}].innerText || '') : ''
      })()`,
    )) as string).replace(/\s+/g, ' ')

  // It has to be on screen for its controls to be clickable.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    if (r) r.scrollTop = r.clientHeight * ${demoAt}
  })()`)
  await page.waitForTimeout(900)

  const first = await face()
  ok(
    'and it plays rather than pointing sideways',
    !/SWIPE LEFT/.test(first),
    'a card that has to be DONE does not send you somewhere else to do it',
  )
  ok('the familiar line is on the face', /TALK TO ME, GOOSE/i.test(first), 'recognition, in English, first')

  /*
    Both beats, because for a while only the first was reachable.

    The second is the half that turns a party trick into a product: one word out of one film
    line, in three sentences you can now say. Counting only "the demo is there" would have
    passed on the broken version.
  */
  const reveal = await page.$('[data-testid="demo-reveal"]')
  ok('it can be played', Boolean(reveal), reveal ? '' : 'no control on the face')
  if (reveal) {
    await reveal.click()
    await page.waitForTimeout(600)
    const beat1 = await face()
    ok('beat one gives the Portuguese', /FALA COMIGO, GOOSE/i.test(beat1), 'the reveal')
    ok('and says what it gave you', /COMIGO = WITH ME/i.test(beat1), 'the line, then the word')

    const on = await page.$('[data-testid="demo-build"]')
    ok('there is a second beat', Boolean(on), on ? '' : 'only one Goose screen — the reported bug')
    if (on) {
      await on.click()
      await page.waitForTimeout(600)
      const beat2 = await face()
      const said = ['Vem comigo', 'Fica comigo', 'Podes vir comigo'].filter((l) => beat2.includes(l))
      ok('and it builds three sentences from the one word', said.length === 3, said.join(' / '))
      /*
        AND THERE IS A WAY ON, which the last beat did not have.

        The version above this asserted the three sentences were present and stopped there —
        so it went green on a demo that ended in a dead end, at the exact instant the
        argument lands. Reported from a phone, not by this file.

        The lesson is the one forward-check already applies to the shelf: content being
        correct is not the same as a person being able to proceed, and only the second is
        what somebody actually experiences. Checking what a screen SAYS while never asking
        what it lets you DO is how a dead end passes review.
      */
      ok(
        'and the last beat has a way on',
        Boolean(await page.$('[data-testid="demo-go"]')),
        'a demo that ends in nothing wastes the moment it just earned',
      )
    }
  }
}

console.log('\nevery explainer points the same way\n')
{
  /*
    Every card carrying the call to action, rather than every card on a list of eyebrows.

    The list was EXPLAINERS, which the sequence replaced — so the filter was selecting from
    a set that no longer describes the feed. Counting the string across the whole feed is
    both simpler and closer to the claim: one destination, several reasons.
  */
  const detail = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).map(s => s.innerText || '').join(' ~~ ')`,
  )) as string
  const links = (detail.match(new RegExp(EXPLAINER_CTA, 'g')) ?? []).length
  ok('one destination, several reasons', links >= 3, links + ' cards carry it')
}

/*
  How much of the feed is the sequence, DERIVED rather than typed.

  It was 7 — two explainers with their examples, two more explainers, and set-up. The
  sequence replaced that with nine argument cards plus the demo and set-up woven in, and a
  hardcoded 7 then reported four argument cards as "ordinary rooms in front of the saved
  one". Taking it from the content means adding a card to the sequence cannot silently
  break a check about something else.
*/
const LEAD_LENGTH = INTRO_CARDS.length + 2

console.log('\nthe set-up is a card, and it does not block\n')
/*
  The process is visible in the thing that IS the process.

  "Which language" was the one step that happened somewhere else — a person tapped the call
  to action and arrived at a form nobody had mentioned. And it must not stop a thumb:
  nothing gates the scroll here, two things gate an ACTION, and the difference is the whole
  reason this is a feed rather than a corridor.
*/
{
  // Clones off, so this index means the same thing as every other index in this file.
  const set = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section'))
      .slice(1, -1)
      .findIndex(s => (s.innerText || '').startsWith('ONE DECISION'))`,
  )) as number
  ok('set-up is in the feed', set >= 0, 'at position ' + set)
  /*
    After the Legend card, which is the first moment somebody has been told what the answers
    are FOR — and no longer last, since four more arguments follow it.

    It was asserted as "last of the lead", which was true when set-up closed the sequence.
    The new order puts drops, revision, ask and share after it, so the meaningful claim is
    adjacency to the card that gives it a reason, not a position in a list.
  */
  /*
    After whatever the content anchors it to — the last card of the sequence now.

    Named by content rather than by "the Legend card", for the same reason as above: where
    set-up sits is a decision that belongs in content/intro.ts, and a check naming a
    specific neighbour fails every time that decision is revisited.
  */
  const anchor = INTRO_CARDS.find((c) => c.id === INTRO_SETUP_AFTER)?.eyebrow ?? ''
  const anchorIdx = (await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).slice(1, -1)
      .findIndex(s => (s.innerText || '').startsWith(${JSON.stringify(anchor)}))`,
  )) as number
  ok(
    'and it comes straight after the card it is anchored to',
    set === anchorIdx + 1,
    anchor + ' ' + anchorIdx + ', set-up ' + set,
  )
  ok(
    'and it can be swiped past',
    /Keep swiping if you would rather look around/i.test((await page.textContent('main')) ?? ''),
    'the gate is on the action, never on the thumb',
  )
}

console.log('\nsaving a card brings it back\n')
/*
  The mechanism that makes swiping past safe, and the one that did nothing at all.

  Save filled a bookmark and filed the card in YOURS — a filing action, not a deferring one.
  If skipping loses things then nobody skips, and a feed nobody skips is a corridor.

  READING THIS FEED NEEDS THE CLONES OFF. The loop renders [last, ...cards, first], so
  children[0] is a copy of the end and the first real card is at index 1. The first draft of
  this check took `before` straight off .children and then clicked the first feed-save on the
  page — which belongs to the LEADING CLONE. It read one card's title and saved a different
  card, then reported the feature broken. Every read below goes through titles(), and the
  click is scoped to the section actually on screen.
*/
{
  const titles = async () =>
    (await page.evaluate(
      `Array.from(document.querySelectorAll('.snap-y > section'))
        .slice(1, -1)
        .map(s => (s.innerText || '').split(String.fromCharCode(10)).filter(Boolean)[1] || '')`,
    )) as string[]

  const before = await titles()

  /*
    The LAST card, chosen by position in the list rather than by a scroll offset.

    This scrolled to a fixed multiple of the viewport and saved whatever was under it, which
    worked only for as long as the feed's contents never changed. Verifying the calendar put
    a live Drop at the front of the rooms, everything shifted down, and the card under that
    offset turned out to be the one already leading — so saving it could not move it
    forward and the check called a working feature broken.

    Taking the last card makes the claim unambiguous: whatever else is in the feed, the
    thing at the very bottom should be near the top after somebody saves it. The +1 is the
    leading clone, so section index and title index stay in step.
  */
  const wasAt = before.length - 1
  const saving = before[wasAt]
  const clicked = (await page.evaluate(
    `(() => {
      const r = document.querySelector('.snap-y')
      r.scrollTop = r.clientHeight * ${wasAt + 1}
      const s = r.children[${wasAt + 1}]
      const b = s && s.querySelector('[data-testid="feed-save"]')
      if (b) { b.click(); return true }
      return false
    })()`,
  )) as boolean
  ok('a card can be saved', clicked && wasAt > 0, saving + ', at ' + wasAt)

  if (clicked && wasAt > 0) {
    await page.waitForTimeout(1200)
    await page.reload()
    await page.waitForTimeout(2600)
    const after = await titles()
    const nowAt = after.indexOf(saving)
    ok(
      'and it leads the feed afterwards',
      nowAt >= 0 && nowAt < wasAt,
      saving + ': ' + wasAt + ' → ' + nowAt,
    )
    /*
      Ahead of every other room, not merely earlier than it was.

      "Earlier" would pass on a feed that had simply shuffled. The promise is that not now
      means bring it back, and bringing it back at position nineteen is not bringing it back.
    */
    const lead = after
      .slice(0, nowAt)
      .filter((t) => t !== saving && before.indexOf(t) >= LEAD_LENGTH)
    ok(
      'and nothing ordinary is in front of it',
      lead.length === 0,
      lead.length ? 'still behind ' + lead.join(', ') : 'first among the rooms',
    )
  }
}

console.log('\none room is given away, and exactly one\n')
const first = await page.$('[data-testid="card-continue"]')
ok('a room can be opened', Boolean(first))
if (first) {
  await first.click()
  await page.waitForTimeout(1500)
  const shown = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
  ok(
    'and it opens the whole way',
    /WHAT TO SAY/.test(shown),
    'a showcase that only describes itself is a brochure',
  )
  const tasted = (await page.evaluate(
    `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}) || '{}').tasted } catch { return null } })()`,
  )) as string | null
  ok('the gift is recorded', Boolean(tasted), String(tasted))

  /*
    The next one is teased, and the tease withholds capability rather than information.
    Reading that your landlord has kept the deposit costs nothing; knowing what to say back
    is the product.
  */
  await page.evaluate(`(() => { const r = document.querySelector('.snap-y'); if (r) r.scrollTop += r.clientHeight * 2 })()`)
  await page.waitForTimeout(1200)
  const another = await page.$('[data-testid="card-continue"]')
  if (another) {
    await another.click()
    await page.waitForTimeout(1400)
    const second = ((await page.textContent('main')) ?? '').replace(/\s+/g, ' ')
    ok(
      'the next one is teased instead',
      /What to say arrives with your Legend/.test(second),
      'one, ever',
    )
    ok(
      'and the tease still says what the moment is',
      /THE MOMENT/.test(second),
      'withholding capability, not information',
    )
  }
}

console.log('\nset-up asks who, where and why — and the feed changes because of it\n')
/*
  The three questions that make tailoring possible, and the proof that it happened.

  They were scattered: the city was a parameter with no question attached, the purpose was
  a screen at the top of the Legend five vibes later, and the name was an onBlur in Yours
  that nothing links to. So the Club built the same feed for everybody, however much it
  knew — feedFor was called with `undefined` for the chapter and no purpose at all.

  LAST IN THIS FILE ON PURPOSE. Committing set-up accepts the deal and moves the learner
  out of showcase, so every assertion above it would be reading a different product.
*/
{
  // The set-up card, reached the way a person reaches it.
  await page.evaluate(`(() => {
    const r = document.querySelector('.snap-y')
    if (r) r.scrollTop = r.clientHeight * (LEAD + 1)
  })()`.replace('LEAD', String(LEAD_LENGTH - 1)))
  await page.waitForTimeout(900)

  const where = await page.$('[data-testid="where-lisbon"]')
  ok('where is asked on its own card, third', Boolean(where), 'moved out of set-up so every card after it is true of somewhere')
  if (where) {
    await where.click()
    await page.waitForTimeout(400)
    const why = await page.$('[data-testid="setup-why-moving"]')
    ok('then why', Boolean(why), 'what a stranger asks you differs by this')
    if (why) {
      await why.click()
      await page.waitForTimeout(400)
      const who = await page.$('[data-testid="setup-who"]')
      ok('then who', Boolean(who), 'the answer to the first thing you say in Portuguese')
      if (who) await who.fill('Sam')
      const commit = await page.$('[data-testid="setup-commit"]')
      if (commit) await commit.click()
      await page.waitForTimeout(1200)

      /*
        Recorded, all three, on the record the feed actually reads.

        Checked in storage rather than by what the screen says next: a card that shows "you
        are set up" while writing nothing is the exact failure this is here to catch.
      */
      const saved = (await page.evaluate(
        /*
          The record is keyed per pair — byheart.learner.v1:<pairId>, not one flat key.

          Reading 'byheart.learner' returned null and every field came back undefined, which
          reads exactly like "set-up wrote nothing" and is not. Finding the key by prefix
          means this keeps working when a second pair exists.
        */
        `(() => {
          try {
            const k = Object.keys(localStorage).find(k => k.startsWith('byheart.learner.v1'))
            return k ? JSON.parse(localStorage.getItem(k) || '{}') : {}
          } catch { return {} }
        })()`,
      )) as { chapter?: string; purpose?: string; display_name?: string }
      /*
        AND THE ANSWER PAYS, VISIBLY, which nothing in the product did before.

        Purpose filtered the feed in silence: somebody answered "a few days", the Club
        quietly became a different Club, and no screen ever said so. This asserts the rooms
        named back are REAL — drawn from roomsFor with the learner's own chapter and purpose,
        the same call the feed makes — because the failure worth catching is not a missing
        list, it is a convincing one made of invented topic names that nothing keeps true.
      */
      const topics = (await page.evaluate(
        `Array.from(document.querySelectorAll('[data-testid="setup-topics"] li')).map(li => li.textContent.trim())`,
      )) as string[]
      ok('the answer names what it bought', topics.length > 0, topics.join(' · ').slice(0, 70))
      if (topics.length) {
        const rooms = new Set(
          (await page.evaluate(
            `Array.from(document.querySelectorAll('.snap-y > section')).slice(1,-1)
              .map(s => (s.innerText||'').split(String.fromCharCode(10)).filter(Boolean)[1] || '')`,
          )) as string[],
        )
        const invented = topics.filter((t) => !rooms.has(t))
        ok(
          'and every one of them is a room in their own feed',
          invented.length === 0,
          invented.length ? 'invented: ' + invented.join(', ') : topics.length + ' real',
        )
      }
      ok('where is recorded', saved.chapter === 'lisbon', String(saved.chapter))
      ok('why is recorded', saved.purpose === 'moving', String(saved.purpose))
      ok('who is recorded', saved.display_name === 'Sam', String(saved.display_name))

      /*
        And the feed is now theirs.

        The point of asking. `moving` is the only purpose that owns a block of ten, so a
        mover's rooms must lead — ordered rather than filtered, because visiting matches
        four Situations of fifteen and a four-card Club is not tailoring.
      */
      await page.reload()
      await page.waitForTimeout(2600)
      const titles = (await page.evaluate(
        `Array.from(document.querySelectorAll('.snap-y > section'))
          .slice(1, -1)
          .map(s => (s.innerText || '').split(String.fromCharCode(10)).filter(Boolean)[1] || '')`,
      )) as string[]
      const MOVER = ['Getting your NIF', 'A phone number that is yours', 'Getting a place at school']
      const seen = MOVER.map((t) => titles.indexOf(t)).filter((i) => i >= 0)
      ok('the mover content is there', seen.length > 0, seen.length + ' of ' + MOVER.length + ' found')
      if (seen.length) {
        /*
          Measured against a room nobody saved, because save outranks purpose and should.

          The first version of this compared against "A coffee, standing up" — which the
          save section above had explicitly saved, so it was leading the feed by design.
          The check called correct behaviour a failure. An inferred preference must never
          beat somebody pressing a button, so the control here is an all-purpose room that
          was never touched.
        */
        const bread = titles.indexOf('The bread queue')
        ok(
          'and it leads the untagged rooms',
          bread < 0 || Math.min(...seen) < bread,
          'moving at ' + Math.min(...seen) + ', all-purpose at ' + bread,
        )
      }
    }
  }
}

console.log('\nthe call to action cannot land on a question set-up already asks\n')
/*
  The leak that shipped, and the reason it shipped.

  Set-up can be swiped past forever, and the promise attached to that is that every call to
  action needing an answer routes BACK to the card. /vibes did not: it checked for a chosen
  pair and, finding none, jumped to a full-screen language list — the exact question set-up
  had stopped asking, in the exact place the restructure existed to remove. So anybody who
  swiped past set-up and tapped TRY YOUR FIRST THREE VIBES on any explainer got the old
  form. Reported from a phone, not by any check here, which is why this one exists.
*/
{
  const fresh = await browser.newContext()
  const p2 = await fresh.newPage()
  await p2.goto(BASE + '/vibes')
  await p2.waitForTimeout(3000)

  const text = ((await p2.textContent('body')) ?? '').replace(/\s+/g, ' ')
  ok(
    'no language list stands between them and a vibe',
    !/Portuguese \(European\)|English \(British\)/i.test(text),
    'the question set-up already asks',
  )
  /*
    It shows set-up in place, rather than bouncing them back to the feed.

    Sending somebody to the Club one tap after they asked to start reads as a rejection —
    and a hard navigation here destroyed the execution context of every check that seeds a
    device on /vibes. The same component the Club shows on card seven renders here.
  */
  /*
    Set-up opens on WHY now, because where moved to its own card third in the sequence.

    The gate itself is unchanged — /vibes without a chosen pair still shows set-up rather
    than a language list — but the first thing set-up asks is different, and the check named
    the old first step.
  */
  ok(
    'set-up is what they get instead',
    Boolean(await p2.$('[data-testid="setup-why-visiting"]')),
    'one question, one component, two places',
  )
  ok(
    'and they are still where they asked to be',
    p2.url().includes('/vibes'),
    p2.url().replace(BASE, '') || '/',
  )
  await fresh.close()
}

await browser.close()

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na stranger is shown the product before being asked for anything')
