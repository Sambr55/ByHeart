/**
 * Drops — what they are now, and where they turn up.
 *
 *   npm run drops
 *
 * A drop used to be a vibe with an expiry: six Duran Duran song titles, gone the morning
 * after the gig. Fun idea about a band, no use to somebody who wants to go — because what
 * you need that week is where the arena is, whether there are tickets left, which line goes
 * there, and how to ask somebody to come with you.
 *
 * These check the shape of the replacement and, most of all, the ranking: a drop expires
 * and nothing else in the Club does, so it goes first. That is a rule about urgency rather
 * than about quality, and it needs no engagement signal to work.
 */
import { DROPS } from '../content/drops'
import { CRATES } from '../content/roots'
import { dropDaysLeft, dropLive, dropPurposeRank, dropsFor, feedFor, purposeRank, roomsFor, type FeedCard } from '../content/feed'
import { GENRES } from '../content/calendar'
import { nextRecurring } from '../content/recurring'
import { DROP_TEMPLATES } from '../content/drop-templates'
import { WANTED, bankImage } from '../content/images'
import { generatedDrops, generationReport } from '../content/generated'
import { draftDrop, type Candidate } from '../lib/draft'
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nwhat a drop is\n')
ok('there is at least one', DROPS.length > 0, DROPS.length + ' authored')
for (const d of DROPS) {
  ok(
    d.id + ' is a cluster, not a single room',
    d.situations.length >= 3,
    d.situations.map((s) => s.title).join(' · '),
  )
  // Getting there, getting in, and asking somebody — the three things an evening needs.
  ok(
    d.id + ' ends on the invitation',
    /\?$/.test(d.situations[d.situations.length - 1].release.answer.trim()),
    d.situations[d.situations.length - 1].release.answer,
  )
}

console.log('\nthe song titles stayed on the shelf\n')
/*
  The vibe is a vibe again. It is about a band, and a band does not expire — putting the
  gig's clock on six song titles meant somebody who liked Duran Duran could only learn them
  in a three-week window once a year.
*/
ok(
  'no vibe expires any more',
  !CRATES.some((c) => c.drop),
  CRATES.filter((c) => c.drop).map((c) => c.id).join(' '),
)
ok(
  'and Duran Duran is still there',
  CRATES.some((c) => c.id === 'duran_duran_lisboa'),
)

console.log('\nwhen it is live\n')
const d = DROPS[0]
/*
  The cards belonging to the drop under test.

  Every assertion here was written when DROPS held one hand-authored drop, so "the drops in
  the feed" and "this drop's rooms" were the same list. Nine generated ones publish now, and
  the checks began failing on Evanescence cards while comparing them to Duran Duran.

  Filtering by id keeps each assertion about the thing it names. Loosening them to "some
  card matches" would instead pass on a feed where this drop had vanished entirely, which is
  the failure they exist to catch.
*/
const mine = (cards: FeedCard[]) =>
  cards.filter((c) => c.kind === 'situation' && c.drop?.id === d.id)
const day = (iso: string) => new Date(iso + 'T12:00:00Z')
const event = new Date(d.on + 'T12:00:00Z')
/*
  Far enough out that nothing should be live, which is now further than it was.

  Sixty days used to be "too early" because everything opened twenty-one days ahead. An
  arena show now opens ninety days ahead — deliberately, because by the time a three-week
  window opens the good seats are gone and a countdown you cannot act on is decoration. So
  the too-early mark moves with it.
*/
const before = new Date(event)
before.setUTCDate(before.getUTCDate() - 120)
const inside = new Date(event)
inside.setUTCDate(inside.getUTCDate() - 5)
const after = new Date(event)
after.setUTCDate(after.getUTCDate() + 2)

ok('not four months out', !dropLive(d, before), 'urgency spent early is urgency spent')
/*
  And the other end of the same rule, which is the half a single number could not express.

  Widening was not simply "make it bigger". A strike is CALLED two to three weeks out, so a
  ninety-day window on one would show an empty countdown for two months — urgency spent on
  something nobody has announced yet. The lead time is a property of the kind, and this
  proves the two kinds actually differ rather than both taking the larger number.
*/
{
  const sixty = new Date(event)
  sixty.setUTCDate(sixty.getUTCDate() - 60)
  ok('a gig you need tickets for is live at sixty days', dropLive({ ...d, kind: 'event' }, sixty))
  ok(
    'a strike at the same distance is not',
    !dropLive({ ...d, kind: 'disruption' }, sixty),
    'called two to three weeks out, so earlier than that is speculation',
  )
}
ok('live in the week before', dropLive(d, inside), dropDaysLeft(d, inside) + ' days left')
ok('live on the day', dropLive(d, day(d.on)))
ok('gone the morning after', !dropLive(d, after))

console.log('\nand where it turns up\n')
/*
  This one is about THIS drop, not about the feed being empty.

  It asserted the whole feed had no drops before the window opened. Other drops are live at
  that moment now — correctly, they are pegged to different dates — so the claim has to name
  which drop it means.
*/
ok('nothing when it is not live', mine(dropsFor('lisbon', before)).length === 0)
/*
  ONE CARD, EVERY ROOM — and the difference between those two is the point.

  This counted CARDS and expected one per room, which is how a drop used to arrive: four
  separate cards for four steps of one evening, scattered nine swipes apart with a pharmacy
  in between. A drop is one card now and its remaining rooms are a rightward flow inside it,
  so counting cards measures the shape rather than the promise.

  The promise is that nothing is lost. So it counts the ROOMS the card carries — the one on
  its face plus the ones in its flow — which stays true whichever way they are laid out.
*/
{
  const cards = mine(dropsFor('lisbon', inside))
  const rooms = cards.reduce(
    (n, c) => n + (c.kind === 'situation' ? 1 + (c.flow?.length ?? 0) : 0),
    0,
  )
  ok('one card when it is live', cards.length === 1, cards.length + ' cards')
  ok(
    'and every room of it inside that card',
    rooms === d.situations.length,
    rooms + ' of ' + d.situations.length,
  )
}
/*
  Ahead of the standing rooms, and this is the whole ranking. The pharmacy will be there
  next month; the gig will not.
*/
const feed = feedFor('lisbon')
const previewed = mine(dropsFor('lisbon', before, true))
ok(
  'a preview can open it early',
  previewed.length === 1 &&
    previewed[0].kind === 'situation' &&
    1 + (previewed[0].flow?.length ?? 0) === d.situations.length,
  previewed.length + ' card(s)',
)
const withDrop = [...previewed, ...feed.filter((c) => !(c.kind === 'situation' && c.drop))]
ok(
  'and it sits ahead of the standing rooms',
  withDrop[0].kind === 'situation' && Boolean(withDrop[0].drop),
  withDrop.slice(0, 2).map((c) => c.id).join(' → '),
)

console.log('\nand it says it is one\n')
for (const card of previewed) {
  ok(
    card.id + ' carries its event',
    card.kind === 'situation' && card.drop?.event === d.event,
  )
}

console.log('\nthe template reproduces the drop somebody wrote by hand\n')
/*
  The strongest check here, and the same trick as the 68 collisions being the generator's
  test set. The concert template was made by lifting the facts out of the hand-authored
  Duran Duran drop; if filling it back in does not give the same Portuguese, the abstraction
  lost something, and every drop the pipeline ever makes will be missing it too.
*/
{
  const fixture = JSON.parse(readFileSync('data/fixture-candidates.json', 'utf8')) as Candidate[]
  const c = fixture.find((x) => x.id === 'duran_duran_arena')
  ok('the fixture has the hand-authored one in it', Boolean(c))
  if (c) {
    // Before its own date, or draftDrop rightly refuses to draft something that has been.
    const result = draftDrop(c, new Date('2026-08-27T12:00:00Z'))
    ok('and it drafts', result.ok, result.ok ? '' : result.why)
    if (result.ok) {
      const hand = DROPS.find((x) => x.id === 'duran_duran_arena')!
      const say = (d: typeof hand) =>
        d.situations.flatMap((s2) => [
          ...s2.lines.map((l) => l.pt + ' | ' + l.en),
          s2.release.answer,
          s2.release.ask,
        ])
      /*
        ONE DELIBERATE DIVERGENCE, NAMED, and the check is stronger for naming it.

        The hand-authored drop says "É a linha vermelha." — it is the red line — and that is
        correct, because it is at Oriente and somebody checked. The TEMPLATE cannot say it,
        because the template does not know which station it is being filled with: three of
        the nine drops publishing today are on the blue and yellow lines, and every one of
        them was teaching red.

        So the fidelity claim changes shape rather than being weakened. It was "the template
        reproduces the authored drop exactly". It is now "the template reproduces every line
        of it except the one that states a fact the template cannot source" — and the second
        assertion below pins that exception open, so nobody can quietly put a metro colour
        back into a template.
      */
      const SOURCED_AWAY = 'É a linha vermelha. | It is the red line.'
      const a = say(hand).filter((line) => line !== SOURCED_AWAY)
      const b = say(result.drop)
      ok(
        'the template names no metro line of its own',
        !b.some((line) => /linha (vermelha|azul|verde|amarela)/i.test(line)),
        'a colour it cannot know is a learner standing on the wrong platform',
      )
      const differ = a.filter((line, i) => line !== b[i])
      ok(
        'every line comes back the same',
        a.length === b.length && !differ.length,
        differ.length ? differ.join('  /  ') : a.length + ' lines',
      )
      // And the facts moved with them, which is the half the template does NOT own.
      ok('with the venue', result.drop.place.name === hand.place.name)
      /*
        The date, in the words a learner actually says — and it was 'catorze' here until the
        Drop turned out to be on the wrong night.

        Worth stating plainly: the metadata said 14 November and so did this sentence, so
        the product would have taught somebody to invite a stranger to a concert on a day it
        was not happening. Fixing the date field alone would have left the sentence wrong and
        this check green, which is why it names the word rather than counting one.
      */
      ok('and the date said as a word', result.drop.situations.some((s2) => s2.release.answer.includes('três')))
    }
  }
}

console.log('\nevery template names a picture that exists\n')
/*
  A template referring to a slug the bank does not have renders a card with no ground, and
  the failure is invisible until somebody opens it on the night. Cheap to check, and it is
  also what keeps the wanted-list honest.
*/
for (const t of DROP_TEMPLATES) {
  for (const room of t.rooms) {
    ok(
      t.id + '/' + room.id + ' → ' + room.image,
      Boolean(bankImage(room.image)) || WANTED.some((w) => w.slug === room.image),
      bankImage(room.image) ? 'in the bank' : 'still wanted',
    )
  }
}
// Nothing in the wanted list has quietly arrived, and nothing in the bank is on both lists.
const both = WANTED.filter((w) => bankImage(w.slug))
ok('the wanted list has no pictures that already exist', !both.length, both.map((w) => w.slug).join(' '))

console.log('\nthe calendar becoming drops\n')
/*
  The join that did not exist: rowsFor had no callers, so a verified row reached nobody.

  What this asserts is mostly a REFUSAL, because that is what the pipeline is for. The
  interesting number is `unreviewed` — finished work waiting on one person reading one
  template — and it is separated from `blocked` so it cannot hide inside it.
*/
{
  const now = new Date('2026-09-02T12:00:00Z')
  const rep = generationReport('lisbon', now)
  const count = (st: string) => rep.filter((r) => r.status === st).length
  console.log(
    '  ' + count('ready') + ' ready · ' + count('unreviewed') + ' waiting on a reading · ' + count('blocked') + ' blocked\n',
  )
  for (const r of rep) console.log('  ' + r.status.padEnd(11) + r.on + '  ' + r.name.slice(0, 44).padEnd(46) + r.why)
  console.log()

  ok('the calendar is read by something now', rep.length > 0, rep.length + ' rows considered')
  /*
    PUBLISHING AHEAD OF REVIEW, on instruction, and the check follows the policy rather than
    arguing with it.

    This asserted that nothing unreviewed reached the feed. That is no longer the rule — see
    PUBLISH_UNREVIEWED — so the assertion has to change or it fails on a deliberate decision
    and gets deleted, taking the real protection with it.

    What is still worth guarding is that the number is not an accident: everything published
    is either reviewed or knowingly unreviewed, and nothing arrives from a state nobody named.
  */
  ok(
    'everything published is accounted for',
    generatedDrops('lisbon', now).length === count('ready') + count('live-unreviewed'),
    count('ready') + ' reviewed, ' + count('live-unreviewed') + ' shipping ahead of a reader',
  )
  /*
    And the flag stays honest while the policy changes.

    The template still says needs-review, because it has not been reviewed. Writing
    'reviewed' into the data would be a lie that outlives the decision — somebody reading
    that field later would believe a speaker had signed it off.
  */
  ok(
    'and the review flag still tells the truth',
    DROP_TEMPLATES.every((t) => t.review === 'needs-review' || t.review === 'reviewed') &&
      DROP_TEMPLATES.some((t) => t.review === 'needs-review'),
    'policy is not a fact, and does not get written into one',
  )
  /*
    A holiday drafts nothing, and that is a design statement rather than a gap.

    "Things are shut" has no venue, no ticket and no metro stop. A template that tried to
    teach it would be inventing an evening nobody is going to.
  */
  ok(
    'a holiday is not an evening you go to',
    rep.some((r) => r.id === 'lisbon_republica' && r.status === 'blocked'),
    'no shape, so nothing drafts',
  )
  /*
    And the station guard bites on a real row rather than a hypothetical one.

    LAV is in Alcântara and has no metro. Inventing a line to fill the slot is the single
    worst thing this pipeline could do, so the row refuses until a person writes down how
    people actually get there.
  */
  ok(
    'a venue with no station refuses rather than guesses',
    rep.some((r) => r.id === 'lisbon_lemon_twigs' && /no station/.test(r.why)),
    'an invented metro line puts somebody in the wrong place',
  )
  /*
    AND THE FOOTBALL DRAFTS NOW, which is what this line used to be waiting for.

    It read "the football is waiting on a template, not on a reviewer" and asserted that
    two fixtures drafted nothing — correct while the only template was the concert, and
    the right way to hold a gap open: the alternative was Benfica v Celtic telling somebody
    to ask "onde é o concerto?" outside the Estádio da Luz.

    The match template exists, so the assertion turns over rather than being deleted. What
    it guards now is that both fixtures reach a learner, and that neither of them is
    quietly being served concert language.
  */
  const football = rep.filter((r) => /benfica|sporting/.test(r.id))
  ok(
    'the football drafts, and drafts as football',
    football.length === 2 && football.every((r) => r.status !== 'blocked'),
    football.map((r) => r.id + ': ' + r.status).join(', '),
  )
  const matchDrops = generatedDrops('lisbon', now).filter((d) => /benfica|sporting/.test(d.id))
  ok(
    'and nobody is sent to a match asking about a concert',
    matchDrops.length === 2 &&
      matchDrops.every((d) =>
        d.situations.some((s2) => s2.lines.some((l) => l.pt === 'Onde é o jogo?')),
      ) &&
      !matchDrops.some((d) =>
        d.situations.some((s2) => s2.lines.some((l) => /concerto/.test(l.pt))),
      ),
    matchDrops.length + ' fixtures drafted',
  )
  /*
    AND THE VENUE ROOM IS NOT ONE SENTENCE NINE TIMES.

    Sam, reading the drops: "They are all identical, we need to link them in some way to
    teh context of teh event." Every live drop ran the one concert room, so the arrival at
    a twenty-thousand-seat arena and the arrival at a hall on Restauradores were the same
    three lines with the station swapped.

    Counted rather than named, so the assertion survives new venues: what it refuses is the
    state where every drop says the same thing, not any particular wording. Three is what
    the current calendar can produce — arena, hall, ground — and a fourth is written and
    waiting on a station for LAV.
  */
  const arrivals = new Set(
    generatedDrops('lisbon', now).map((d) =>
      (d.situations.find((s2) => s2.id.endsWith('_where'))?.lines ?? [])
        .map((l) => l.pt)
        .join(' / '),
    ),
  )
  ok(
    'the arrival is said differently for different buildings',
    arrivals.size >= 3,
    arrivals.size + ' distinct venue rooms across the live drops',
  )
  /*
    AND EVERY DROP CARD HAS A PICTURE, which is not decoration here.

    dropsFor takes each drop's FIRST situation as its card, and every first situation is
    the arrival — so on any screen that renders these as a grid the photograph is most of
    what tells one night from another. The hand-authored Duran Duran drop had no image on
    any of its rooms, because it was written before there was a bank, and it rendered as a
    grey rectangle among eleven photographs on Yours.

    Invisible in the Club feed, where the drop's own banner sits above the card, which is
    why it survived this long.
  */
  const cards = dropsFor('lisbon', now)
  const noImage = cards.filter((c) => c.kind === 'situation' && !c.situation.image)
  ok(
    'every drop card has a photograph',
    noImage.length === 0,
    noImage.length ? noImage.map((c) => c.id).join(', ') : cards.length + ' cards',
  )
  /*
    And more than one of them, because twelve nights with one picture is one card twelve
    times. Counted rather than named so a new venue kind cannot quietly collapse it.
  */
  const shots = new Set(
    cards.flatMap((c) => (c.kind === 'situation' && c.situation.image ? [c.situation.image.src] : [])),
  )
  ok(
    'and the nights do not all look the same',
    shots.size >= 3,
    shots.size + ' distinct photographs across ' + cards.length + ' drops',
  )
  /*
    AND THE WHOLE NIGHT IS REACHABLE FROM ANY OF ITS ROOMS.

    dropsFor hands the feed the drop's FIRST room and puts the other three in a sideways
    `flow` inside that card, which works in the Club and nowhere else. Anywhere a room is
    reached directly — a link, a tile on Yours, a bookmark — three quarters of the evening
    did not exist. Sam went looking for the invitation he had just been told about and
    could not find it: "Cant see the invite card at all."

    Checked as data rather than as pixels, because the fault was structural: the rooms
    were always in the drop, and nothing outside the feed ever offered them.
  */
  const withSiblings = cards.filter((c) => {
    if (c.kind !== 'situation' || !c.drop) return false
    return c.drop.situations.length > 1
  })
  ok(
    'every drop has more than one room to reach',
    withSiblings.length === cards.length,
    withSiblings.length + ' of ' + cards.length,
  )
  /*
    And one of them is the ask, which is the room with somewhere to go. Matched the same
    way Errand matches it, so the two cannot drift.
  */
  const askable = cards.filter(
    (c) => c.kind === 'situation' && c.drop?.situations.some((s2) => /(^|_)invite$/.test(s2.id)),
  )
  ok(
    'and one of them is an invitation',
    askable.length === cards.length,
    askable.length + ' of ' + cards.length + ' nights can be offered to somebody',
  )
  /*
    AND IT IS LAST, because the night is a sequence now.

    Errand walks a drop's rooms in authored order and hands each one on to the next, so
    the room that ends the evening is whichever is written last — and the whole shape
    depends on that being the ask. Sam: "make it into one flow, ending on teh invite and a
    minted card to share the invite."

    Authored order is easy to change without noticing what it decides, which is exactly
    why it is worth an assertion rather than a comment.
  */
  const endsOnAsk = cards.filter((c) => {
    if (c.kind !== 'situation' || !c.drop) return false
    const last = c.drop.situations[c.drop.situations.length - 1]
    return Boolean(last) && /(^|_)invite$/.test(last.id)
  })
  ok(
    'and the night ends on it',
    endsOnAsk.length === cards.length,
    endsOnAsk.length + ' of ' + cards.length + ' end on the ask',
  )
}

console.log('\nand who has read the language\n')
/*
  Reported and not failed, exactly as the paradigm table does it. A green tick would be a
  lie about provenance — but a template is a half-hour of a native speaker's time that
  covers a year of drops, which is the whole argument for templates.
*/
const reviewed = DROP_TEMPLATES.filter((t) => t.review === 'reviewed').length
console.log('  ' + reviewed + ' of ' + DROP_TEMPLATES.length + ' templates read by a native speaker')
if (reviewed < DROP_TEMPLATES.length) {
  console.log('  ⚠ nothing drafted from the rest should reach anybody until they have been')
}

/*
  PURPOSE CURATES, IT DOES NOT SUBTRACT.

  Sam: "purpose - it should curate rather than subtract."

  It used to filter, and every honest answer shrank the Club — measured across the real
  content: no answer 35 rooms, moving 23, staying 16, visiting 14, with visiting having
  nothing at all at rung 4. The widest Club belonged to the person who claimed nothing,
  which inverts what the question is for.

  Worse than the counts: the feed weaves idioms every 7th card and cheats every 11th
  against the ROOMS array, so a shorter room list is a shorter carrier. A visitor was
  served 3 of 30 idioms where somebody who answered nothing got 6.

  There was no test for any of this. feed-check runs on a learner with NO purpose, which
  is the one case where the old filter was inert — so the starvation was invisible to the
  gate for as long as it existed.
*/
console.log('\npurpose ranks the Club rather than shrinking it\n')
{
  const all = roomsFor('lisbon', null).length
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const rooms = roomsFor('lisbon', purpose)
    ok(
      purpose + ' sees the whole Club',
      rooms.length === all,
      rooms.length + ' of ' + all,
    )
    /*
      AND ITS OWN ROOMS COME FIRST. Seeing everything is only half of curating — if the
      order were unchanged, answering the question would buy nothing at all.
    */
    const first = rooms[0]
    const firstIsMine =
      first?.kind === 'situation' && purposeRank(first.situation, purpose) === 0
    ok(purpose + ' opens on a room written for it', firstIsMine, first?.id ?? 'none')
    /*
      Every tagged room ahead of every untagged one, and those ahead of other purposes'.
      Checked as a monotonic sequence rather than by counting, because that is the actual
      claim: the bands never interleave.
    */
    const ranks = rooms.map((c) => (c.kind === 'situation' ? purposeRank(c.situation, purpose) : 1))
    ok(
      purpose + ' keeps the three bands in order',
      ranks.every((r, i) => i === 0 || ranks[i - 1] <= r),
      ranks.join('').slice(0, 40),
    )
  }
  /*
    AND NOBODY IS STARVED OF THE WEAVE. The carrier is the same length for everybody now,
    so the idiom and cheat beats land the same number of cards whatever was answered.
  */
  const carrier = (p: 'visiting' | 'staying' | 'moving' | null) =>
    roomsFor('lisbon', p).length + dropsFor('lisbon', new Date(), false).length
  const base = carrier(null)
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    ok(
      purpose + ' gets the same weave carrier as an unanswered learner',
      carrier(purpose) === base,
      carrier(purpose) + ' against ' + base,
    )
  }
}

/*
  THE SHELF HAS A FLOOR, AND SOMETHING SAYS SO BEFORE A LEARNER FINDS OUT.

  THE MEASUREMENT THAT PUT THIS HERE. Walking the real dropsFor forward from 2026-10-03:
  twelve drops, eight on the 15th, four on the 23rd, one on the 29th, and ZERO from
  2026-11-04 — not for a week but for ever, because every drop came from one harvested
  month and a row is gone the morning after it happens. Nothing in the build noticed. The
  only assertion that would have fired lives in scripts/calendar-check.mts, which is in
  `gate:browser` rather than in `npm run check`, and it reads the authored DROPS alone so
  it would not have fired until the very last one expired anyway.

  So it is here, in the check that runs on every build, and it measures the WORST GENRE
  rather than the total: four of the seven used to collapse the Club to a single card, so
  an aggregate of three can pass while somebody who said they like the beach has nothing.

  It fails rather than warns, because a warning in a passing build is the status quo that
  produced this. Recurring content means it can be made green by authoring something true
  rather than by harvesting a listing nobody has confirmed — see content/recurring.ts.
*/
console.log('\nthe shelf has a floor\n')
{
  /* The real clock. Every other block in this file pins a date so its assertions are
     stable; this one is deliberately about TODAY, because the thing being checked is
     whether the shelf is empty now. */
  const now = new Date()
  const FLOOR = 3
  const horizon = (days: number) => new Date(now.getTime() + days * 86_400_000)
  const worstAt = (when: Date) =>
    Math.min(...GENRES.map((g) => dropsFor('lisbon', when, false, [g.id]).length))

  /*
    TWO HORIZONS, AND ONLY THE NEAR ONE FAILS — because a check must only fail for
    something the person reading it can actually fix tonight.

    TODAY AND A FORTNIGHT OUT ARE A HARD FLOOR. Recurring content can always make these
    green, by authoring something that is true every year rather than by confirming a
    listing nobody has checked. If these go red the tab is about to be empty and the fix is
    in this repository.

    BEYOND THAT IT WARNS. Three weeks out the shelf thins because real listings run out,
    and the only honest fix is a harvest plus somebody reading each row — which cannot be
    done by a build, at midnight, by a machine. A failure there would be a check Sam
    deletes in a fortnight, and a deleted check is how this went unnoticed in the first
    place.
  */
  for (const days of [0, 14]) {
    const when = horizon(days)
    const worst = worstAt(when)
    ok(
      days === 0 ? 'there are drops today, whatever you like' : 'and still some in a fortnight',
      worst >= FLOOR,
      dropsFor('lisbon', when).length + ' live, ' + worst + ' for the thinnest taste' +
        (worst < FLOOR ? ' — author a recurring one in content/recurring.ts' : ''),
    )
  }
  for (const days of [30, 60]) {
    const when = horizon(days)
    const worst = worstAt(when)
    const total = dropsFor('lisbon', when).length
    console.log(
      '  ' + (worst >= FLOOR ? '✓' : '⚠') + ' in ' + days + ' days   ' + total + ' live, ' +
        worst + ' for the thinnest taste' +
        (worst >= FLOOR
          ? ''
          : ' — only the year itself is left out there. npm run calendar:harvest -- lisbon <month>'),
    )
  }
  /*
    AND IT CANNOT RUN OUT, which is the property the harvested calendar never had. A year
    and a half out there is no listing in the product, so anything live on that date is
    there because the year itself puts it there.
  */
  const far = horizon(550)
  ok(
    'the year itself still fills the tab long after every listing has expired',
    dropsFor('lisbon', far).length > 0,
    dropsFor('lisbon', far).length + ' live on ' + far.toISOString().slice(0, 10),
  )
  /*
    AND AN EMPTY DAY STILL HAS SOMETHING TRUE TO SAY. The Drops page names the next real
    thing instead of apologising twice, which only works if there is always a next one.
  */
  const quiet = new Date('2027-03-10T09:00:00Z')
  const next = nextRecurring('lisbon', quiet)
  ok(
    'a quiet day can still name what is coming',
    Boolean(next),
    next ? next.event.slice(0, 48) + ' on ' + next.on : 'nothing to point at',
  )
}

/*
  PURPOSE REACHES A DROP NOW, AND RANKS RATHER THAN SHRINKS.

  The same property purposeRank guarantees for rooms, which this file already asserts
  below. It is asserted separately for drops because the two were wired independently and
  only the rooms half was ever true: measured before this change, all three purposes and no
  answer at all saw an identical twelve drops.
*/
console.log('\nand why they are here changes the order, never the size\n')
{
  const now = new Date()
  const base = dropsFor('lisbon', now).length
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const mine = dropsFor('lisbon', now, false, null, purpose)
    ok(
      purpose + ' sees every drop',
      mine.length === base,
      mine.length + ' of ' + base,
    )
    /* Beyond the urgent week, the ones written for them come first. */
    const ranks = mine
      .flatMap((c) => (c.kind === 'situation' && c.drop ? [c.drop] : []))
      .filter((d) => dropDaysLeft(d, now) > 7)
      .map((d) => dropPurposeRank(d, purpose))
    ok(
      purpose + ' keeps the bands in order beyond the urgent week',
      ranks.every((r, i) => i === 0 || ranks[i - 1] <= r),
      ranks.join('') || 'nothing beyond the week',
    )
  }
  /*
    AND A NARROW TASTE CANNOT EMPTY IT. beach_surf returned exactly one drop before the
    floor went in — a learner who answered honestly got a thinner Club than one who said
    nothing, which is the failure purposeRank was rewritten to kill for rooms.
  */
  for (const g of GENRES) {
    const n = dropsFor('lisbon', now, false, [g.id]).length
    ok('liking ' + g.id + ' does not empty the Club', n >= 3, n + ' drops')
  }
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na cluster, pegged to a night, ahead of everything that is not going anywhere')
