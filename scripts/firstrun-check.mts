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
  Explanation, then the thing it explained. Twice.

  The order was the other way round and did not survive first contact: a stranger landed on
  a photograph of a pharmacy whose only instruction read SWIPE LEFT — sideways, into the
  room, away from every explanation there is — and the answer to "what is this" was the
  third card with nothing on the first saying so.
*/
ok('it opens on an explanation', /SIXTY SECONDS/.test(titles[1] ?? ''), titles[1] ?? '')
ok(
  'then on the obvious example of it',
  /The pharmacy/.test(titles[2] ?? ''),
  titles[2] ?? '',
)
ok('then on the next explanation', /THE WAY IN/.test(titles[3] ?? ''), titles[3] ?? '')
ok('then on a vibe, which is the other half of the product', /A VIBE/.test(titles[4] ?? ''), titles[4] ?? '')
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
  Interleaved, not stacked. Four explanations in a row is a corridor with swipes instead of
  taps, which is the thing this replaces.
*/
const eyebrows = EXPLAINERS.map((e) => e.eyebrow)
/*
  Without the clones, or the count lies.

  The rail is [last, ...cards, first] so the loop is seamless, and with an explainer at each
  end that yields five matches for four explainers — a number that is not wrong so much as
  about a different list. Counting a clone as a card is how "and none of them are adjacent"
  would one day pass on a feed where two of them are.
*/
const real = cards.slice(1, -1)
const at = real.map((c, i) => (eyebrows.includes(c) ? i : -1)).filter((i) => i >= 0)
ok(
  'the explainers are in it',
  at.length === EXPLAINERS.length,
  at.length + ' of ' + EXPLAINERS.length,
)
/*
  At most two in a row, never three.

  The rule used to be "never adjacent", which described the previous design — content-led,
  with explanations woven through. The brief changed to explanations leading as a block with
  the showcase examples among them, and a rule that no longer describes the intent is worse
  than no rule: it fails on correct work and gets deleted in a hurry, taking the protection
  with it.

  What still has to hold is that this never becomes a corridor with swipes instead of taps.
  Two short cards back to back is a pair; three is a lecture.
*/
let run = 1
let longest = 1
for (let i = 1; i < at.length; i++) {
  run = at[i] - at[i - 1] === 1 ? run + 1 : 1
  longest = Math.max(longest, run)
}
ok(
  'and never three of them in a row',
  longest <= 2,
  'longest run ' + longest + ', at positions ' + at.join(', '),
)
ok(
  'real Lisbon content is between them',
  real.filter((c) => !eyebrows.includes(c)).length > at.length,
  'the shop, not just the sign',
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
  const face = async () =>
    ((await page.evaluate(
      `(() => {
        const r = document.querySelector('.snap-y')
        return r && r.children[1] ? (r.children[1].innerText || '') : ''
      })()`,
    )) as string).replace(/\s+/g, ' ')

  const first = await face()
  ok('the first card is the demo', /SIXTY SECONDS/.test(first), first.slice(0, 44))
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
    }
  }
}

console.log('\nevery explainer points the same way\n')
{
  const detail = await page.evaluate(
    `Array.from(document.querySelectorAll('.snap-y > section')).map(s => s.innerText || '').filter(t => ${JSON.stringify(eyebrows)}.some(e => t.startsWith(e))).join(' ~~ ')`,
  ) as string
  const links = (detail.match(new RegExp(EXPLAINER_CTA, 'g')) ?? []).length
  ok('one destination, several reasons', links >= 3, links + ' cards carry it')
}

/*
  Seven cards of argument before the ordinary feed starts: the two explainers with their two
  examples, the remaining two explainers, and set-up. Anything at or beyond this index is a
  room like any other, which is what "nothing ordinary in front of it" is asking about.
*/
const LEAD_LENGTH = 7

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
  ok(
    'and it comes after the argument, not before it',
    set === LEAD_LENGTH - 1,
    'last of the seven: four reasons and two of them shown working, first',
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

  const where = await page.$('[data-testid="setup-where-lisbon"]')
  ok('it asks where first', Boolean(where), 'a city, not a parameter nobody was asked about')
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
  ok(
    'set-up is what they get instead',
    Boolean(await p2.$('[data-testid="setup-where-lisbon"]')),
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
