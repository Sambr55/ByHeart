/**
 * Every step on the road in earns its place, and the road arrives.
 *
 *   npm run road
 *
 * The road is an authored list (content/road.ts) rather than a computation, which removes
 * the class of fault that produced a bar reading 10 of 10 above a sentence saying one more
 * session. What an authored list cannot do is notice that the content moved underneath it,
 * so that is this file's job.
 *
 * It asserts the admission test the road claims for itself — every step teaches a card
 * word or asks something about the learner — and then that walking the whole road actually
 * leaves somebody able to build their card. A road that arrives is the only promise worth
 * making here.
 */
import { readFileSync } from 'node:fs'
import { BREAKS, breakAfter } from '../content/breaks'
import { ROOTS, ROOTS_BY_FAMILY, type Root } from '../content/roots'
import { ROAD, WARM_UP, roadFor, roadProgress } from '../content/road'
import { beatsFor } from '../engine/journey'
import { cardFor, frameReady, legendStatus, DOORWAY, LEGEND_FRAMES } from '../content/legend'
import type { Purpose } from '../content/situations'

const fail: string[] = []
const ok = (what: string, good: boolean, saw = '') => {
  console.log((good ? '  ✓ ' : '  ✗ ') + what + (good || !saw ? '' : '   ' + saw))
  if (!good) fail.push(what)
}

const byId = new Map<string, Root>(ROOTS.map((r) => [r.root_id, r]))
const PURPOSES: Purpose[] = ['visiting', 'staying', 'moving']

/* Every word any card is built from, which is what a step may claim to teach. */
const cardWords = new Set(PURPOSES.flatMap((p) => cardFor(p).flatMap((f) => f.built_from)))
/* And the deeper questions, which a step may also legitimately serve. */
const deeperWords = new Set(
  LEGEND_FRAMES.filter((f) => f.depth === 'deeper').flatMap((f) => f.built_from),
)

/* 1. Every step exists, and is in the crate it says it is. */
for (const step of ROAD) {
  const root = byId.get(step.root)
  if (!root) { ok('step ' + step.root + ' exists', false); continue }
  ok(
    'step ' + step.root + ' is in ' + step.family,
    root.culture_family === step.family,
    'it is in ' + root.culture_family,
  )
}

/*
  2. THE ADMISSION TEST. Every step teaches a card word or asks something.

  This is the road's own claim about itself — "a person on it is always either learning
  their card or being asked about themselves" — and it is the reason a learner can be
  asked to walk it without being told why. A step that stops satisfying it is a detour,
  and a detour on the road in is exactly what was removed to get here: four counting roots
  that taught nothing the card needs.
*/
for (const step of ROAD) {
  const root = byId.get(step.root)
  if (!root) continue
  const teaches = root.extracts.filter((e) => cardWords.has(e.id) || deeperWords.has(e.id))
  const earns = teaches.length > 0 || Boolean(root.asks)
  if (step.not_for_the_card) {
    /*
      The declared exception, checked in the other direction: a step excused from the test
      must actually need excusing. Otherwise the flag becomes a way of turning the rule off
      and the road fills up with detours nobody has to argue for.
    */
    ok(
      step.root + ' genuinely needs its exception',
      !earns,
      'it teaches ' + teaches.map((e) => e.id).join(',') + ' — drop not_for_the_card',
    )
    continue
  }
  ok(
    step.root + ' teaches a Legend word or asks something',
    earns,
    'teaches ' + root.extracts.map((e) => e.id).join(',') + ' and asks nothing',
  )
}
/* And only one step may be excused. */
ok(
  'the road has one declared exception',
  ROAD.filter((s) => s.not_for_the_card).length === 1,
  ROAD.filter((s) => s.not_for_the_card).map((s) => s.root).join(' '),
)

/*
  3. EVERY QUESTION THE CARD NEEDS IS ASKED ON THE ROAD.

  A first version of this asserted that every asking root is on the road, which is a
  stronger claim than the road makes and the wrong one: it conflates "asked at all" with
  "asked before the door". tb_into fills a depth 'deeper' frame and tb_email is not a
  frame at all, so asking either before the Legend opens is the road doing the Club's
  work — and it was the difference between three sittings and four.

  What must be true is narrower and is the actual promise: a question the SEVEN-CARD
  Legend depends on cannot be left off, which is how tb_age once came to arrive three
  sittings past the open door.
*/
const cardFrameWords = new Set(
  PURPOSES.flatMap((p) => cardFor(p).flatMap((f) => f.built_from)),
)
for (const root of ROOTS_BY_FAMILY.the_basics) {
  if (!root.asks) continue
  const feedsCard = root.extracts.some((e) => cardFrameWords.has(e.id))
  if (!feedsCard) continue
  ok(
    'the road asks ' + root.asks,
    ROAD.some((s) => s.root === root.root_id),
    root.root_id + ' asks ' + root.asks + ', feeds the card, and is not on the road',
  )
}

/*
  4. THE ROAD ARRIVES. Walk every step for each purpose and the card must be buildable.

  The one promise. Everything else here is about the road being honest; this is about it
  being worth walking.
*/
for (const purpose of PURPOSES) {
  const steps = roadFor(purpose)
  const owned = new Set<string>()
  for (const step of steps) {
    const root = byId.get(step.root)
    for (const e of root?.extracts ?? []) owned.add(e.id)
  }
  const card = cardFor(purpose)
  const short = card.filter((f) => !frameReady(f, owned))
  ok(
    'walking the road builds the whole ' + purpose + ' card',
    short.length === 0,
    short.map((f) => f.id + ' still needs ' + f.built_from.join(',')).join('; '),
  )

  /* And the number the bar shows is the number the door reads. */
  const played = steps.map((s) => s.root)
  const mid = roadProgress({ rootsPlayed: played.slice(0, 2), sectionsCompleted: [WARM_UP[0]], purpose })
  const end = roadProgress({ rootsPlayed: played, sectionsCompleted: [WARM_UP[0]], purpose })
  ok(purpose + ': the road is shut part-way', !mid.open, 'open at ' + mid.done + ' of ' + mid.total)
  ok(purpose + ': the road opens at the end', end.open, 'still ' + end.done + ' of ' + end.total)
  /* And not before the warm-up, whatever else has been played. */
  const noWarm = roadProgress({ rootsPlayed: played, sectionsCompleted: [], purpose })
  ok(purpose + ': the warm-up is required', !noWarm.open, 'open without it')
  console.log('    ' + purpose.padEnd(9) + end.total + ' steps: warm-up + ' + steps.length)
}

/* 5. The warm-up offers something real. */
for (const v of WARM_UP) {
  ok('warm-up ' + v + ' has roots', (ROOTS_BY_FAMILY[v] ?? []).length > 0)
}

/*
  THE BREAK BETWEEN SITTINGS, which is what pays for the fourth one.

  Sam, on the road picking up tb_into and tb_email: "add a keep going? mechanic between
  each sitting, but make them fun and add some Portuguese learning at every sitting break.
  Make sure each is different."

  Different is the assertion. Four identical encouragements would be worse than none —
  a learner who reads the same line four times has been told the product has nothing to
  say — so the phrases, their English and the buttons are all checked for repeats.
*/
console.log('\nevery sitting break teaches something, and something new\n')
{
  const seen = new Set<string>()
  for (const b of BREAKS) {
    ok('break ' + b.after + ' says something Portuguese', /[a-z]/i.test(b.pt), b.pt)
    ok('break ' + b.after + ' says what it means', Boolean(b.en.trim()), b.en)
    ok('break ' + b.after + ' says why it is worth having', b.gloss.length > 40, String(b.gloss.length))
    /* The button is an eyebrow, so it lives under the same fourteen characters. */
    ok('break ' + b.after + ' has a label-sized button', b.cta.length <= 14, b.cta)
    ok('break ' + b.after + ' is new', !seen.has(b.pt), b.pt)
    seen.add(b.pt)
  }
  /* One per sitting the longest road takes, so nobody meets a repeat on the way. */
  const longest = Math.max(
    ...(['visiting', 'staying', 'moving'] as const).map((p) => {
      const screens = roadFor(p).reduce((n, step) => {
        const r = ROOTS.find((x) => x.root_id === step.root)
        return n + (r ? beatsFor(r).length : 0)
      }, 0)
      return Math.ceil(screens / 30)
    }),
  )
  ok('there is a break for every sitting of the road', BREAKS.length >= longest, BREAKS.length + ' for ' + longest)

  /* And the sequence is in order, so it can describe the shape of the journey. */
  const order = BREAKS.map((b) => b.after)
  ok('the breaks are in order', order.every((n, i) => n === i + 1), order.join(','))
  /* After the last one, a learner who keeps going is not handed nothing. */
  ok('past the end it still answers', Boolean(breakAfter(99).pt), breakAfter(99).pt)

  /*
    AND IT IS A SCREEN, NOT A PANEL.

    Sam, on the first attempt: "the keep going gates are very soft and tbh hard to spot.
    They need to be standalone screens with clear intent and signposting to continue or
    save their way out." It was a card on section-complete, which already carries a
    headline, a payoff, a progress bar, the save offer and two buttons — so the one screen
    asking somebody to carry on was the fifth thing on it.

    Asserted on the step queue rather than on the rendered screen, because that is where
    "standalone" is decided: a break that is not its own step cannot be its own screen,
    and putting the panel back would silently pass a check that only read the DOM.
  */
  const src = readFileSync('engine/journey.tsx', 'utf8')
  ok(
    'a sitting break is a step of its own',
    /kind: 'sitting-break'/.test(src),
    'engine/journey.tsx',
  )
  /* Before the summary, because the break is the decision and the summary is the receipt. */
  const atBreak = src.indexOf("steps.push({ kind: 'sitting-break' })")
  const atSummary = src.indexOf("steps.push({ kind: 'section-complete' })")
  ok(
    'and it comes before the summary',
    atBreak > 0 && atSummary > atBreak,
    atBreak + ' then ' + atSummary,
  )

  const ui = readFileSync('components/Journey.tsx', 'utf8')
  /* Both ways out, named. A screen with one button is not a decision. */
  ok('the break offers a way on', /data-testid="break-go"/.test(ui))
  ok('and a way out that saves', /data-testid="break-save"/.test(ui))
}

/*
  WHAT THE DOOR ASKS FOR IS WHAT THE SCREENS SAY IT ASKS FOR.

  Sam, reading the picker: it promised "three vibes of your own" while the door was
  already open. The vibe toll was removed weeks ago and VIBES_FOR_LEGEND stayed at three,
  so five screens went on counting against a rule nothing enforced — including NotYet,
  which is the locked door itself.

  The note above that constant had warned about this exact failure in its own words:
  "typing a 3 in here is how five vibes survived three rules past being true." It then
  happened to the same line. So the numbers are derived now, and this asserts the
  agreement rather than the number: a learner the road calls done must never be told to
  finish anything, and one it calls unfinished must never be told they are done.
*/
console.log('\nthe door and the copy agree\n')
{
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const all = roadFor(purpose).map((step) => step.root)
    /* Road walked AND warmed up — the door is open, so nothing may ask for more. */
    const done = legendStatus({
      rootsPlayed: all,
      sectionsCompleted: [DOORWAY, WARM_UP[0]],
      sittings: 9,
      purpose,
    })
    ok(purpose + ': a walked road opens the door', done.open, JSON.stringify(done))
    ok(
      purpose + ': and asks for nothing more',
      done.vibesNeeded - done.vibesDone <= 0,
      done.vibesDone + ' of ' + done.vibesNeeded,
    )
    /* Road walked, no warm-up — one thing outstanding, and exactly one. */
    const cold = legendStatus({
      rootsPlayed: all,
      sectionsCompleted: [DOORWAY],
      sittings: 9,
      purpose,
    })
    ok(purpose + ': without a warm-up it stays shut', !cold.open)
    ok(
      purpose + ': and asks for exactly one',
      cold.vibesNeeded - cold.vibesDone === 1,
      cold.vibesDone + ' of ' + cold.vibesNeeded,
    )
  }
  /*
    AND NO SCREEN TYPES THE OLD NUMBER. The fault was a literal three in copy, so this
    looks for one where it did the damage rather than trusting the derivation alone.
  */
  /*
    COMMENTS STRIPPED FIRST. The first version of this matched its own documentation —
    the notes explaining what the old copy said contain the old copy — and reported two
    failures against files that were already correct. What is being defended is what a
    learner reads, so only the strings a learner can read are searched.
  */
  const strip = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  const copy = strip(readFileSync('content/front-door.ts', 'utf8'))
  ok('the picker no longer promises three vibes', !/three vibes/i.test(copy))
  const notYet = strip(readFileSync('components/NotYet.tsx', 'utf8'))
  ok('nor does the locked door', !/vibes of your own/i.test(notYet))
}

if (fail.length) { console.log('\n' + fail.length + ' error(s)'); process.exit(1) }
console.log('\nevery step earns its place, and the road arrives')
