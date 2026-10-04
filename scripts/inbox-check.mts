/**
 * The inbox never announces content the feed does not have.
 *
 *   npm run inbox
 *
 * ---------------------------------------------------------------------------
 * THE ONE CLAIM, and everything in this file is a way of attacking it.
 *
 * A message promising something the feed does not contain is the exact failure this
 * codebase cares most about: a learner told about a gig, opening the Club, and finding
 * nothing there. content/inbox.ts is built so that such a message has nowhere to come from
 * — it derives from `dropsFor`, the same call the Club makes — but "built so that" is a
 * sentence in a docblock, and a docblock has never caught a regression.
 *
 * So this checks the property from four directions:
 *
 *   1. SET EQUALITY, in the content layer. Every message corresponds to a live drop, every
 *      live drop has a message, and the ids match exactly. Run for every chapter, for every
 *      purpose, for every genre, and across a year of dates — because the dangerous case is
 *      not today, it is the morning a drop expires.
 *   2. NOTHING IS INVENTED INSIDE a message. The headline, venue, date, countdown and the
 *      named rooms are each checked against the drop they claim to describe. A message that
 *      names a fifth room is as much a lie as a message about a drop that is not there.
 *   3. THE BADGE CANNOT OVERCOUNT. `unreadCount` never exceeds the number of messages, and
 *      a learner who has just looked is told about nothing.
 *   4. IN THE BROWSER, because two bugs today were invisible in the DOM and obvious on
 *      screen. Every rendered row is matched back to a live drop, and the page is screenshot
 *      at 390x844.
 *
 * SABOTAGE-TESTED, three ways, because a check that cannot fail is not a check. Each of
 * these was applied, the failure confirmed, and then reverted:
 *
 *   · content/inbox.ts announcing every authored drop regardless of its window —
 *     2208 of 2400 combinations failed check 1, naming `duran_duran_arena`.
 *   · a message carrying one room its drop does not have —
 *     check 2 failed, printing the invented title against the real four.
 *   · components/Inbox.tsx rendering a row for `lisbon_ghost_gig` —
 *     check 4 failed, naming it, which is the one a content-layer test would have missed.
 * ---------------------------------------------------------------------------
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium, type Page } from 'playwright'
import { CHAPTERS, type ChapterId } from '../content/chapters'
import { GENRES, type Genre } from '../content/calendar'
import { dropDaysLeft, dropOpensOn, dropWhen, dropsFor } from '../content/feed'
import type { Drop } from '../content/drops'
import { inboxFor, unreadCount } from '../content/inbox'
import type { Purpose } from '../content/situations'
import { DEFAULT_PAIR, pairId } from '../content/pairs'
import { cardFor } from '../content/legend'

const BASE = process.env.BASE_URL ?? 'http://localhost:3111'
const KEY = 'byheart.learner.v1:' + pairId(DEFAULT_PAIR)

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** The drops the Club feed is actually serving, for exactly these inputs. */
function feedDrops(
  chapter: ChapterId,
  now: Date,
  genres: Genre[] | null,
  purpose: Purpose | null,
): Drop[] {
  return dropsFor(chapter, now, false, genres, purpose).flatMap((c) =>
    c.kind === 'situation' && c.drop ? [c.drop] : [],
  )
}

const PURPOSES: (Purpose | null)[] = [null, 'visiting', 'staying', 'moving']
const CHAPTER_IDS = CHAPTERS.map((c) => c.id)

/*
  ============================================================================
  1. THE INBOX IS THE FEED. Same set, every time, under every combination.
  ============================================================================

  A YEAR OF DATES rather than today, because today is the one day this cannot be wrong on:
  I wrote both sides this morning against this morning's eleven drops. The failure that
  matters arrives on its own schedule — a drop expiring overnight, a recurring drop opening,
  a month where nothing is on — so the comparison is run on the 1st and the 15th of twelve
  months, which crosses every window boundary the content has.
*/
console.log('\nthe inbox is the feed, and cannot be anything else\n')
{
  const dates: Date[] = []
  for (let m = 0; m < 12; m++) {
    dates.push(new Date(Date.UTC(2026, m, 1)))
    dates.push(new Date(Date.UTC(2026, m, 15)))
  }
  /* And the exact boundaries of every drop in the product: the morning each one opens and
     the morning each one is gone. Those two are where an off-by-one lives. */
  for (const chapter of CHAPTER_IDS) {
    for (const d of feedDrops(chapter, new Date(Date.UTC(2026, 0, 1)), null, null)) {
      dates.push(dropOpensOn(d))
    }
  }

  let compared = 0
  let mismatches = 0
  for (const chapter of CHAPTER_IDS) {
    for (const purpose of PURPOSES) {
      /* Every genre on its own, plus no preference at all — a single genre is the case that
         once collapsed the Club to one card, so it is the case most likely to make the two
         lists disagree. */
      for (const genres of [null, ...GENRES.map((g) => [g.id] as Genre[])]) {
        for (const now of dates) {
          const feed = feedDrops(chapter, now, genres, purpose).map((d) => d.id)
          const inbox = inboxFor(chapter, now, genres, purpose).map((m) => m.id)
          compared++
          const feedSet = new Set(feed)
          const inboxSet = new Set(inbox)
          const announcedButAbsent = inbox.filter((id) => !feedSet.has(id))
          const presentButSilent = feed.filter((id) => !inboxSet.has(id))
          if (announcedButAbsent.length || presentButSilent.length) {
            mismatches++
            if (mismatches <= 5) {
              ok(
                chapter +
                  '/' +
                  (purpose ?? 'any') +
                  '/' +
                  (genres?.join(',') ?? 'any') +
                  ' on ' +
                  now.toISOString().slice(0, 10),
                false,
                (announcedButAbsent.length
                  ? 'ANNOUNCED BUT NOT IN THE FEED: ' + announcedButAbsent.join(' ')
                  : '') +
                  (presentButSilent.length
                    ? ' in the feed and never announced: ' + presentButSilent.join(' ')
                    : ''),
              )
            }
          }
        }
      }
    }
  }
  ok(
    'every message matches a live drop, and every live drop a message',
    mismatches === 0,
    compared + ' combinations compared, ' + mismatches + ' disagreed',
  )
  /*
    AND THE COMPARISON IS NOT VACUOUS.

    Two empty lists are equal, so a broken `inboxFor` returning nothing would pass check 1
    silently on every one of those combinations. This is the assertion that makes the rest
    mean something: somewhere in that sweep, real messages were produced.
  */
  const today = inboxFor('lisbon', new Date(), null, null)
  ok(
    'and there is something to compare',
    today.length > 0,
    today.length + ' messages live in Lisbon today',
  )
}

/*
  ============================================================================
  2. NOTHING IS INVENTED INSIDE A MESSAGE.
  ============================================================================

  Check 1 proves the inbox talks about the right drops. It says nothing about whether it
  describes them correctly — and "four rooms about getting into the Luz" is a promise about
  content just as much as the headline is. A message naming a room the drop does not have
  sends somebody looking for it.
*/
console.log('\nand nothing inside a message is invented\n')
{
  let checked = 0
  const bad: string[] = []
  for (const chapter of CHAPTER_IDS) {
    for (const now of [new Date(), new Date(Date.UTC(2026, 9, 20)), new Date(Date.UTC(2026, 11, 20))]) {
      const drops = new Map(feedDrops(chapter, now, null, null).map((d) => [d.id, d]))
      for (const m of inboxFor(chapter, now, null, null)) {
        const d = drops.get(m.id)
        if (!d) continue /* check 1 owns that case */
        checked++
        if (m.headline !== d.event) bad.push(m.id + ' headline "' + m.headline + '" ≠ "' + d.event + '"')
        if (!m.where.startsWith(d.place.name)) bad.push(m.id + ' venue "' + m.where + '" ≠ ' + d.place.name)
        if (m.when !== dropWhen(d)) bad.push(m.id + ' date "' + m.when + '" ≠ ' + dropWhen(d))
        if (m.left !== dropDaysLeft(d, now)) bad.push(m.id + ' countdown ' + m.left + ' ≠ ' + dropDaysLeft(d, now))
        if (m.at !== dropOpensOn(d).toISOString().slice(0, 10)) {
          bad.push(m.id + ' arrival ' + m.at + ' ≠ ' + dropOpensOn(d).toISOString().slice(0, 10))
        }
        /* The rooms, exactly — same titles, same count, same order. */
        const real = d.situations.map((s) => s.title)
        if (m.rooms.length !== real.length || m.rooms.some((r, i) => r !== real[i])) {
          bad.push(m.id + ' names rooms [' + m.rooms.join('|') + '] but has [' + real.join('|') + ']')
        }
        /* A countdown that has already run out would be a message about a dead night. */
        if (m.left < 0) bad.push(m.id + ' is announced with ' + m.left + ' days left')
      }
    }
  }
  ok('every fact in a message comes from its drop', bad.length === 0, bad.slice(0, 4).join('; '))
  ok('and messages were actually inspected', checked > 0, checked + ' messages')
}

/*
  ============================================================================
  3. THE BADGE CANNOT OVERCOUNT.
  ============================================================================

  The badge is the only count in Dub Club and it is on the Club's own header, so it is the
  one number a learner sees before they have decided to look at anything. It must never be
  larger than the list it opens.
*/
console.log('\nthe badge counts the list and never more\n')
{
  const messages = inboxFor('lisbon', new Date(), null, null)
  ok('never opened means everything is new', unreadCount(messages, null) === messages.length)
  ok(
    'just looked means nothing is new',
    unreadCount(messages, new Date().toISOString()) === 0,
    String(unreadCount(messages, new Date().toISOString())),
  )
  const mid = messages.length ? messages[Math.floor(messages.length / 2)].at : null
  if (mid) {
    const n = unreadCount(messages, mid)
    ok('a mark part-way through counts only what is above it', n >= 0 && n < messages.length, String(n))
  }
  /* And it can never exceed the list, whatever the mark. */
  const silly = ['1970-01-01', '2999-12-31', '']
  ok(
    'no mark can make the count exceed the list',
    silly.every((s) => unreadCount(messages, s || null) <= messages.length),
  )
}

/*
  ============================================================================
  4. IN THE BROWSER, at 390x844.
  ============================================================================

  Two bugs today were invisible in the DOM and obvious in a screenshot — white on white
  being one of them — so the rendered page is checked rather than only the functions behind
  it. Every row on screen is matched back to a drop the feed is serving, which is the same
  claim as check 1 made against what a learner can actually read.
*/
console.log('\nand on the screen, at 390x844\n')
const browser = await chromium.launch()
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page: Page = await ctx.newPage()

  /*
    A MEMBER, seeded exactly the way the other browser checks seed one.

    This record is lifted from scripts/hero-check.mts rather than invented, and the first
    draft of it here was invented and did not work: `club_welcomed_at` alone is not a
    member, because `clubOpen` asks for a Legend that has been SAID — four answered frames
    and six clean proof lines — and a thinner record lands in the showcase, where there is
    correctly no inbox door at all. Caught by this check failing, which is the point of it.
  */
  /*
    THE WHOLE CARD, not the four that hero-check seeds.

    `clubOpen` counts `needed` as every frame that APPLIES — which is all seven of the
    universal card, regardless of how many have been answered — so a record with four
    answers and four proof lines is three short and the door stays shut. Measured rather
    than guessed: cardFor(null) is seven, and seven is what the gate asks for.
  */
  const legendCard = cardFor(null).map((f) => ({ frame_id: f.id, values: { x: 'y' } }))
  const member = {
    version: 1,
    deal_accepted_at: '2026-08-01T00:00:00.000Z',
    profile: { goal: 'curious' },
    inventory: {},
    chapter: 'lisbon',
    sections_completed: ['the_basics', 'top_gun', 'james_bond', 'pulp_fiction', 'bridget_jones'],
    finished_cards: ['lisbon_farmacia'],
    saved: ['lisbon_cafe'],
    liked: [],
    asked: [],
    evidence: [],
    roots_played: ['tb_greet'],
    legend: legendCard,
    club_welcomed_at: '2026-08-20T00:00:00.000Z',
    set_up_at: '2026-08-01T00:00:00.000Z',
    /*
      SAID COLD, AND SAID AS THE LEGEND — which is the condition the door actually asks for.

      `clubOpen` counts proof rows with `source: 'legend'` and `clean`, against the number
      of frames that apply to this learner's card. A first draft of this seed used
      `source: 'release'` — copied from hero-check, where it is right, because that screen
      asks a different question — and the Club refused with "3 more sittings of the basics"
      while every assertion about the inbox itself passed. One row per applicable frame, so
      the seed moves with the card rather than fixing a count that will go stale.
    */
    proof: legendCard.map((f, i) => ({
      pt: 'Chamo-me Sam ' + i,
      en: 'My name is Sam',
      source: 'legend',
      clean: true,
      at: String(i + 1),
      frame_id: f.frame_id,
    })),
    /* Never opened, so everything live should read as new — the retro-fill on a first open. */
    inbox_opened_at: null,
  }

  await page.addInitScript(
    ([k, pair, v]) => {
      try {
        localStorage.clear()
        localStorage.setItem('byheart.pair', JSON.stringify(pair))
        localStorage.setItem(k as string, JSON.stringify(v))
      } catch {}
    },
    [KEY, DEFAULT_PAIR, member] as const,
  )

  await page.goto(BASE + '/inbox', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="inbox-message"]', { timeout: 10_000 }).catch(() => {})

  const rendered = (await page.evaluate(
    `Array.from(document.querySelectorAll('[data-testid="inbox-message"]')).map(el => ({
       id: el.getAttribute('data-drop'),
       fresh: el.getAttribute('data-new') !== null,
       text: (el.innerText || '').replace(/\\s+/g, ' ').trim(),
     }))`,
  )) as { id: string | null; fresh: boolean; text: string }[]

  const live = feedDrops('lisbon', new Date(), null, null)
  const liveIds = new Set(live.map((d) => d.id))

  ok('the page renders messages', rendered.length > 0, rendered.length + ' rows')
  ok(
    'every row on screen is a drop the feed is serving',
    rendered.every((r) => r.id && liveIds.has(r.id)),
    rendered.filter((r) => !r.id || !liveIds.has(r.id)).map((r) => r.id ?? '(no id)').join(' '),
  )
  ok(
    'and every drop the feed is serving is on screen',
    live.every((d) => rendered.some((r) => r.id === d.id)),
    live.filter((d) => !rendered.some((r) => r.id === d.id)).map((d) => d.id).join(' '),
  )
  /*
    THE EVENT NAME IS ON THE ROW, not merely in an attribute.

    `data-drop` matching proves the wiring; it does not prove a learner can read what the
    message is about. This is the assertion that would have caught a row whose headline
    rendered empty — which is what white-on-white looks like to a DOM query.
  */
  ok(
    'and each row says what it is about, in words',
    rendered.every((r) => {
      const d = live.find((x) => x.id === r.id)
      return d ? r.text.includes(d.event) : false
    }),
    rendered
      .filter((r) => {
        const d = live.find((x) => x.id === r.id)
        return !d || !r.text.includes(d.event)
      })
      .map((r) => r.id ?? '?')
      .join(' '),
  )
  /* A learner who has never opened it is shown everything as new — the retro-fill. */
  ok(
    'a first open marks them all new',
    rendered.length > 0 && rendered.every((r) => r.fresh),
    rendered.filter((r) => !r.fresh).length + ' rows were not marked new',
  )

  /*
    NOTHING IS WHITE ON WHITE.

    The card idiom is bg-bg-elev on sand, and `.shown-on-photo` repoints --fg to white
    wherever a photograph is behind it. There are no photographs on this screen by design,
    so this asserts the outcome rather than the design: the computed text colour on a row
    must differ from the computed background behind it.
  */
  const legible = (await page.evaluate(
    `Array.from(document.querySelectorAll('[data-testid="inbox-message"]')).map(el => {
       const s = getComputedStyle(el)
       const h = el.querySelector('h2')
       return { bg: s.backgroundColor, fg: h ? getComputedStyle(h).color : s.color }
     })`,
  )) as { bg: string; fg: string }[]
  ok(
    'no row is its own colour',
    legible.length > 0 && legible.every((r) => r.bg !== r.fg),
    JSON.stringify(legible.filter((r) => r.bg === r.fg).slice(0, 2)),
  )

  /*
    THE OPT-IN, and what it is allowed to do when push is not configured.

    Dev has no VAPID keys, so `pushReady` is false and PushToggle renders NOTHING — which
    is the correct and long-standing behaviour it inherits from /line: a button that asks
    for notification permission and then cannot send one would burn the browser's single
    permission prompt for nothing. So this cannot simply assert that a button is present,
    or it would fail on every machine that is not production.

    What it asserts instead is the pair of claims that are true either way: the card
    explaining the offer is on the screen, and the control inside it is the SHARED one
    rather than a second subscription flow — proved by the testid that only
    components/PushToggle.tsx renders, and by the absence of any other call to
    /api/push/subscribe in the inbox's own source.
  */
  const offer = (await page.evaluate(
    `(() => {
       const card = Array.from(document.querySelectorAll('section, div')).find(
         (el) => (el.innerText || '').includes('ON YOUR PHONE'),
       )
       const el = document.querySelector('[data-testid="push-toggle"], [data-testid="line-install"]')
       return { card: !!card, control: el ? (el.innerText || '').trim() : null }
     })()`,
  )) as { card: boolean; control: string | null }
  ok('the offer to turn notifications on is on the screen', offer.card, JSON.stringify(offer))
  ok(
    'and the control is the shared flow, or correctly absent without VAPID keys',
    offer.control !== null || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    String(offer.control),
  )
  /*
    AND THE INBOX DOES NOT SUBSCRIBE ON ITS OWN.

    The failure this guards against is not visible on any screen: a second, divergent
    subscribe call that overwrites the first one's `time_zone` and moves somebody's morning
    line by hours. Asserted against the source, because that is where it would be written.
  */
  const inboxSrc = readFileSync('components/Inbox.tsx', 'utf8')
  ok(
    'the inbox has no subscription flow of its own',
    !/api\/push\/subscribe|pushManager|requestPermission/.test(inboxSrc),
    'components/Inbox.tsx talks to push directly',
  )

  /* And the door is in the Club's header, with a count on it. */
  await page.goto(BASE + '/club', { waitUntil: 'networkidle' })
  await page.waitForTimeout(620)
  const door = await page.evaluate(
    `(() => { const el = document.querySelector('[data-testid="inbox-door"]'); if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = el.querySelector('[data-testid="inbox-count"]');
      return { count: c ? (c.innerText || '').trim() : null, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } })()`,
  )
  ok('the Club header has a door to the inbox', door !== null, JSON.stringify(door))
  if (door) {
    const d = door as { count: string | null; w: number; h: number; top: number }
    /* 44px is the product's tap target, and a door nobody can hit is not a door. */
    ok('and it can be tapped', d.w >= 24 && d.h >= 44, d.w + 'x' + d.h)
    ok('and it is on screen', d.top >= 0 && d.top < 844, 'top ' + d.top)
  }

  await page.goto(BASE + '/inbox', { waitUntil: 'networkidle' })
  await page.waitForTimeout(620)
  /* .screenshots/ is already gitignored, so a check that runs on every gate does not leave
     an untracked PNG in the repo root for somebody to wonder about. */
  mkdirSync('.screenshots', { recursive: true })
  await page.screenshot({ path: '.screenshots/inbox.png', fullPage: true })
  console.log('\n  wrote .screenshots/inbox.png')
} finally {
  await browser.close()
}

if (problems.length) {
  console.log('\n' + problems.length + ' error(s)')
  for (const p of problems) console.log('  · ' + p)
  process.exit(1)
}
console.log('\nthe inbox says nothing the feed cannot back up')
