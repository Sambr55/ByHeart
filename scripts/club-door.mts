/**
 * Who gets into Dub Club — Lisbon?
 *
 *   npm run club
 *
 * The Club was the most important threshold in the product and it had no door: /club
 * rendered for anybody who typed the address. The welcome CEREMONY was gated; the room
 * behind it was not. And the welcome copy said the test was having "been all the way
 * through once" — attendance — in a product whose entire argument is that nothing is
 * earned by turning up.
 *
 * Now membership is something you can be outside of, so it is something that can be
 * wrongly granted or wrongly refused. Both are checked here, against the predicate the
 * app itself uses rather than a copy of its logic.
 *
 * The door moved from the Legend to set-up (Sam, pivoting DUB to the city), so this now
 * asserts set-up opens it, the card has no say, welcomed members are never put out, and
 * the free starter set is what the paywall reads. The card checks below stay: the Legend
 * is optional, not gone.
 */
import {
  LEGEND_CARD,
  LEGEND_FRAMES,
  type Child,
  cardDone,
  cardToGo,
  clubOpen,
  clubOpenFor,
  fillFrame,
  frameApplies,
  isAnswered,
} from '../content/legend'
import { ROAD } from '../content/road'
import { ROOTS } from '../content/roots'
import { say } from '../content/numbers'
import { SITUATIONS } from '../content/situations'
import { LISBON_VISITING_1 } from '../content/blocks/lisbon-visiting-1'
import { FREE_ROOMS, PLANS, canOpenRoom, hasFullAccess, isFreeRoom } from '../lib/entitlements'
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const all = LEGEND_CARD.map((f) => f.id)
const harder = LEGEND_FRAMES.filter((f) => f.depth === 'deeper').map((f) => f.id)

console.log('\nthe card\n')
/*
  THE CARD IS WHAT THE ROAD ANSWERS — derived, not counted.

  This asserted `length === 7` and `every depth === 'card'`, and both are the fault the
  comment below already names: a bare count of content fails when the content changes
  rather than when the product breaks, and `depth` was a second copy of the card's
  membership that somebody had to keep in step with the road by hand.

  Sam, after a week of the two disagreeing: "yes remove disagreement." cardFor derives the
  card from ROAD now, so the thing worth asserting is that the derivation HOLDS — every
  question the road asks is on the card, and nothing is on the card that the road does not
  ask. Change the road and this follows it; break the link and it goes red.
*/
{
  const asked = new Set<string>(['name'])
  for (const step of ROAD) {
    const root = ROOTS.find((r) => r.root_id === step.root)
    const a = (root as { asks?: string | string[] } | undefined)?.asks
    if (!a) continue
    for (const one of Array.isArray(a) ? a : [a]) asked.add(one)
  }
  /*
    NOT EVERYTHING THE ROAD ASKS IS A LEGEND FRAME. `email` and `gender` are profile
    fields — the address the work is sent to, and which of obrigado/obrigada is yours —
    and neither is a thing you say about yourself on a card. So the claim is over the
    road's questions that ARE frames, which is what cardFor filters on.
  */
  const frameIds = new Set(LEGEND_FRAMES.map((f) => f.id))
  const askedFrames = [...asked].filter((id) => frameIds.has(id))
  ok(
    'is exactly what the road asks, plus the name',
    all.length === askedFrames.length && all.every((id) => askedFrames.includes(id)),
    all.length + ' on the card against ' + askedFrames.length + ' asked as frames',
  )
  /*
    AND THE ROAD ANSWERS ALL OF IT. The mirror of the line above: a card question no step
    asks is one a learner could never answer by walking the road, which is the dead end
    this whole rewrite is removing.
  */
  const unanswerable = askedFrames.filter((id) => id !== 'name' && !all.includes(id))
  ok('and every road question lands on it', unanswerable.length === 0, unanswerable.join(', '))
}
/*
  THE PROPERTY, NOT THE COUNT.

  This asserted `harder.length === 2`, and the comment above it had already been edited once
  from three to two — which is the tell. A bare count of content does not fail when the
  product breaks, it fails when the content changes, and the only available response is to
  bump the number. It went red today because a duplicated frame was deliberately removed;
  nothing was wrong.

  What the line is actually for is the shape of the card: there ARE questions held back, and
  none of them is on the seven a stranger asks. Both halves matter — an empty `harder` would
  mean the Legend has no inside left, and a harder frame appearing on the card would mean the
  door is gated on something the ladder has not reached.
*/
/*
  AND SOMETHING IS STILL HELD BACK. `age` and `into` moved onto the card when the road
  picked them up — Sam put both on his ten — so the held-back set is smaller than it was,
  and the property is unchanged: there IS an inside to the Legend, and none of it gates the
  door. Measured against the card rather than against `depth`, which is no longer what
  decides membership.
*/
const held = LEGEND_FRAMES.filter((f) => !all.includes(f.id)).map((f) => f.id)
ok(
  'holds the harder ones back for inside',
  held.length > 0,
  held.join(', ') || 'nothing held back',
)

/*
  THE DOOR IS SET-UP, NOT THE LEGEND.

  Sam moved it when DUB became about the city: the Legend "must stop being the gateway to
  the Club". clubOpen takes the two facts the door reads — set_up_at and club_welcomed_at
  — and nothing about the card, so the assertions below are about those two facts and
  about the card having NO say.
*/
console.log('\nthe door\n')
const SET_UP = '2026-11-01T00:00:00.000Z'
ok('a brand new learner is outside', !clubOpen({}))
ok('nulls are outside too', !clubOpen({ setUpAt: null, welcomedAt: null }))
ok('set-up opens it', clubOpen({ setUpAt: SET_UP }), 'no Legend, no road')
ok(
  'and the record form asks the same question',
  clubOpenFor({ set_up_at: SET_UP }) && !clubOpenFor({}) && !clubOpenFor({ set_up_at: null }),
)

console.log('\nnobody already inside is put back out\n')
/*
  WELCOMED IS ALWAYS IN, and it is the bug this replaces: the old clubOpen counted Legend
  proof BEFORE reading welcomedAt, so a member welcomed under one rule was shut out again
  when the rule moved — and /skip, which writes the stamp, said "The door is open" over a
  door that was shut.
*/
ok(
  'a welcomed member with no set-up stays in',
  clubOpen({ welcomedAt: '2026-08-01T00:00:00.000Z' }),
  'grandfathered',
)
ok(
  'and so does one whose record is otherwise empty',
  clubOpenFor({ club_welcomed_at: '2026-01-01', set_up_at: null }),
)

console.log('\nthe card has no say in it\n')
{
  /*
    Source-level: the signature no longer takes a card, so a caller cannot pass one by
    mistake — and the function body must not read proof, answers or the card.
  */
  const legendSrc = readFileSync('content/legend.ts', 'utf8')
  const body = legendSrc.slice(
    legendSrc.indexOf('export function clubOpen('),
    legendSrc.indexOf('export function clubOpenFor('),
  )
  const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  ok('clubOpen reads no proof, answers or card', !/proof|answer|cardDone|cardFor|rough/.test(code))
  ok(
    'and it reads the welcome before set-up',
    code.indexOf('welcomedAt') > -1 && code.indexOf('welcomedAt') < code.indexOf('setUpAt)'),
  )
  /* Every gate asks the one function, not a copy of it. */
  for (const file of [
    'engine/useClub.ts',
    'app/view.tsx',
    'components/Club.tsx',
    'components/Legend.tsx',
    'components/Skip.tsx',
  ]) {
    const src = readFileSync(file, 'utf8')
    ok(file + ' asks clubOpenFor', /clubOpenFor\(/.test(src))
  }
  const club = readFileSync('components/Club.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  ok(
    'the welcome fires on the door, not on the Legend',
    /if \(!clubOpenFor\(state\)\) return\s*\n\s*setWelcome\(true\)/.test(club) && /\[fromDoor, setUpAt\]/.test(club),
    'first entry after set-up',
  )
  const view = readFileSync('app/view.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  ok(
    'the front door sends a set-up learner to the Club',
    /isMember\(learner\) \? '\/club'/.test(view) && /!isMember\(learner\) && !returning\(learner\)/.test(view),
    'even before they have played anything',
  )
}

/*
  THE STARTER SET, which replaced "free until the Legend".

  Five Lisbon rooms that exist, are standing rooms in the visitor's city, and are named
  in one place — the new home screen imports them, so a typo here would be a room that
  is free in the copy and paid in the product.
*/
console.log('\nthe starter set\n')
{
  const ids = new Set([...SITUATIONS, ...LISBON_VISITING_1].map((x) => x.id))
  /* Five first-day rooms plus the emergency room, which belongs to the survival kit. */
  ok('five first-day rooms and the emergency room are free', FREE_ROOMS.length === 6 && FREE_ROOMS.includes('lisbon_emergencia'), FREE_ROOMS.join(', '))
  ok('the first unit of the path can be started free', FREE_ROOMS.includes('lisbon_aeroporto'))
  const missing = FREE_ROOMS.filter((id) => !ids.has(id))
  ok('every free room exists', missing.length === 0, missing.join(', ') || 'all found')
  ok('isFreeRoom agrees with the list', FREE_ROOMS.every((id) => isFreeRoom(id)) && !isFreeRoom('lisbon_fado'))
  /*
    "When billing is not configured, everybody is in", and nothing locks before the server
    has answered — the two rules the Club wrote inline, now one function.
  */
  const free = { plan: 'free' as const }
  const pro = { plan: 'pro' as const }
  ok('no billing, everybody is in', hasFullAccess({ known: true, billingReady: false, entitlements: free }))
  ok('unknown is in, so nobody is locked out for a second', hasFullAccess({ known: false, billingReady: true, entitlements: free }))
  ok('billing live, free is not', !hasFullAccess({ known: true, billingReady: true, entitlements: free }))
  ok('billing live, pro is', hasFullAccess({ known: true, billingReady: true, entitlements: pro }))
  const live = { known: true, billingReady: true, entitlements: free }
  ok('a free room opens for free', canOpenRoom(FREE_ROOMS[0], live))
  ok('a paid room does not', !canOpenRoom('lisbon_fado', live))
  /* And the feed — the one place rooms are withheld today — reads the same list. */
  const feed = readFileSync('components/Feed.tsx', 'utf8')
  ok('the feed frees the starter set', /isFreeRoom\(card\.id, learner\.purpose \?\? null\)/.test(feed))
  /* The pricing no longer promises a door that is gone. */
  const plans = JSON.stringify(PLANS)
  ok('no plan sells the path to the Legend', !/path to the Legend|Your Legend all the way/i.test(plans), PLANS.free.line)
}

console.log('\ncounting down\n')
/* The whole card, whatever size the road makes it — see the derivation note above. */
ok('an empty card has the whole card to go', cardToGo([]) === all.length, String(cardToGo([])))
ok('a full card has none to go', cardToGo(all) === 0)
ok('cardDone agrees with cardToGo', cardDone(all) && !cardDone(all.slice(0, 6)))

console.log('\nthe card fits a life that is not mine\n')
/*
  Four faults, one cause: somebody else's life written into the frames.

  "E o que fazem?" assumed children, and more than one, and one of them at university.
  "Tenho {n}. Chamam-se {names}." assumed you had them at all. And two cards had no
  slots — a fixed sentence put in the learner's mouth — which also made them impossible
  to answer, so the Club told somebody who had finished everything that two questions
  were left.
*/
const F = (id: string) => LEGEND_FRAMES.find((f) => f.id === id)!
const ans = (id: string, values: Record<string, string>) => ({ frame_id: id, values })

ok('no card is a fixed sentence with nothing to choose', LEGEND_FRAMES.every((f) => f.slots.length))
/*
  Your children, not a count of them.

  The card asked "how many" from a fixed list and only had names for one son or one
  daughter — so two children got a sentence with nobody's name in it, and two girls got the
  masculine plural. These check the composed sentence instead, and they check the thing the
  old model could not do at all.
*/
const kids = (...list: Child[]) => JSON.stringify(list)
const said = (...list: Child[]) => fillFrame(F('children'), { kids: kids(...list) }, 'm')

ok(
  'childless is an answer, not an empty field',
  isAnswered(F('children'), { kids: kids() }) || isAnswered(F('children'), {}),
  said(),
)
ok('and it says so', said() === 'Não tenho filhos.', said())
ok(
  'one child is named',
  said({ name: 'Tom', g: 'm', age: '8' }).includes('Tom'),
  said({ name: 'Tom', g: 'm', age: '8' }),
)
ok(
  'and so is every one of three',
  ['Oscar', 'Tilly', 'Ted'].every((n) =>
    said(
      { name: 'Oscar', g: 'm' },
      { name: 'Tilly', g: 'f' },
      { name: 'Ted', g: 'm' },
    ).includes(n),
  ),
  said({ name: 'Oscar', g: 'm' }, { name: 'Tilly', g: 'f' }, { name: 'Ted', g: 'm' }),
)
/*
  The one the old model got wrong every time. Portuguese bends the NUMBER as well as the
  noun: two daughters is duas filhas. A fixed list of counts cannot know who they are.
*/
ok(
  'two girls are duas filhas, not dois filhos',
  said({ name: 'A', g: 'f' }, { name: 'B', g: 'f' }).includes('duas filhas'),
  said({ name: 'A', g: 'f' }, { name: 'B', g: 'f' }),
)
ok(
  'and a mixed pair goes masculine, as Portuguese does',
  said({ name: 'A', g: 'f' }, { name: 'B', g: 'm' }).includes('dois filhos'),
  said({ name: 'A', g: 'f' }, { name: 'B', g: 'm' }),
)
/* An age nobody gave is not a gap. The clause simply does not appear. */
ok(
  'an age withheld leaves no hole',
  !said({ name: 'Tom', g: 'm' }).includes('anos'),
  said({ name: 'Tom', g: 'm' }),
)
ok(
  'and an age given is said as a word',
  said({ name: 'Tom', g: 'm', age: '8' }).includes('oito anos'),
  said({ name: 'Tom', g: 'm', age: '8' }),
)
/*
  "And what do they do?" is gone rather than made conditional. It was a second question
  about children — "Ainda andam na escola" — which describes one particular family and was
  put in everybody's mouth. Removing it is also most of why building a Legend is shorter.
*/
ok(
  'nobody is asked a second question about their children',
  !LEGEND_FRAMES.some((f) => f.id === 'children_doing'),
)

console.log('\nthe count the Club shows\n')
const cardIds = LEGEND_CARD.map((f) => f.id)
/*
  ANSWERED MEANS ANSWERED, and this used to fake it with `ans(id, {})`.

  Empty values are what CLEARING a card writes, and cardToGo counted them as done — so
  this asserted "answering every card" against seven cards that had been answered with
  nothing. It passed for the wrong reason and went red the moment that hole was closed.

  Real values now, which is what the assertion always meant to describe.
*/
const answeredCard = cardIds.map((id) => ans(id, { x: 'y' }))
ok(
  'answering every card leaves nothing outstanding',
  cardToGo(cardIds, answeredCard) === 0,
  String(cardToGo(cardIds, answeredCard)),
)
/* And clearing one puts it back, which is the behaviour that hole was hiding. */
ok(
  'and clearing one puts it back',
  cardToGo(cardIds, answeredCard.map((a, i) => (i === 0 ? ans(a.frame_id, {}) : a))) === 1,
)

console.log('\nnumbers are words\n')
ok('an age reads as Portuguese, not digits', fillFrame(F('age'), { n: '56' }, 'm').includes('cinquenta e seis'),
  fillFrame(F('age'), { n: '56' }, 'm'))

/*
  NO SENTENCE CONTAINS A WORD THAT IS ONLY PUNCTUATION.

  Every free-text answer goes into the frame verbatim, and the build screen makes its tiles
  by splitting the sentence on spaces — so one stray trailing space, which a phone keyboard
  adds without anybody noticing, turned "Trabalho com {thing}." into four tiles with a lone
  FULL STOP among them. The learner was asked to place a piece of punctuation into a
  sentence about their job.

  Asserted on the sentence rather than on the tiles, because the sentence is also what is
  recorded as proof, said aloud and compared against later: a phantom space is wrong
  everywhere, not only where it is visible.
*/
{
  const messy = ['Advertising ', ' design', '  música  ']
  const bad = messy
    .map((v) => fillFrame(F('work'), { thing: v }, 'm'))
    .filter((sentence) => sentence.split(' ').some((w) => /^[.,!?]+$/.test(w)))
  ok(
    'a stray space never becomes a tile of its own',
    bad.length === 0,
    bad.join(' | ') || 'trimmed where the sentence is made',
  )
}
ok('and it is the European sixteen', say(16) === 'dezasseis', say(16))
ok('twenty-one composes with e', say(21) === 'vinte e um', say(21))

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe way in is set-up, the welcome is never taken back, and the first day is free')
