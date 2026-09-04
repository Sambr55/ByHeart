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
import { dropDaysLeft, dropLive, dropsFor, feedFor, type FeedCard } from '../content/feed'
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
ok(
  'every room of it when it is',
  mine(dropsFor('lisbon', inside)).length === d.situations.length,
  String(mine(dropsFor('lisbon', inside)).length),
)
/*
  Ahead of the standing rooms, and this is the whole ranking. The pharmacy will be there
  next month; the gig will not.
*/
const feed = feedFor('lisbon')
const previewed = mine(dropsFor('lisbon', before, true))
ok('a preview can open it early', previewed.length === d.situations.length)
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
      const a = say(hand)
      const b = say(result.drop)
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
  ok(
    'and the football is waiting on a template, not on a reviewer',
    rep.filter((r) => /no match template/.test(r.why)).length === 2,
    'two fixtures, both drafting nothing',
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

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\na cluster, pegged to a night, ahead of everything that is not going anywhere')
