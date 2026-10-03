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
import { BREAKS, breakAfter, DONE } from '../content/breaks'
import { ROOTS, ROOTS_BY_FAMILY, type Root } from '../content/roots'
import { ROAD, roadFor, roadProgress } from '../content/road'
import { beatsFor } from '../engine/journey'
import { cardFor, cardToGo, clubOpen, frameReady, legendStatus, DOORWAY, LEGEND_FRAMES } from '../content/legend'
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
/*
  ASKED OF THE CARD, NOT OF THE BASICS — and the old version was asking the wrong thing.

  This walked ROOTS_BY_FAMILY.the_basics and required every basics root that asks a card
  question to be ON the road. True while the basics were the only road, and false the
  moment the road became vibes: Sam asked for "seven fun, recognisable statements leading
  to seven legend answers", so jb_english asks origin and tb_introduce still asks it too.
  Both are correct content; the check failed six times on a road that was right.

  The promise this file's own comment states is narrower and is the one that matters: a
  question the SEVEN-CARD Legend depends on cannot be left off. So that is what is
  measured — every frame on the card has a step on the road that asks it — whatever crate
  the step comes from, and however many other roots ask the same question elsewhere.
*/
for (const purpose of PURPOSES) {
  const asked = new Set<string>()
  for (const step of roadFor(purpose)) {
    const root = ROOTS.find((r) => r.root_id === step.root)
    const a = (root as { asks?: string | string[] } | undefined)?.asks
    if (!a) continue
    for (const one of Array.isArray(a) ? a : [a]) asked.add(one)
  }
  for (const frame of cardFor(purpose)) {
    /* `name` is answered in set-up, before the road starts — see cardFor. */
    if (frame.id === 'name') continue
    ok(
      'the road asks ' + frame.id,
      asked.has(frame.id),
      frame.id + ' is on the card and no road step asks it',
    )
  }
}

/*
  THE ROAD OPENS ON A VIBE, which is what the warm-up used to be for.

  There was a forced warm-up before the basics, because the shelf was a wall and the basics
  were a poor opening line. Sam: "that is now stale. It needs to go completely" — and it is
  stale because the road makes its own argument: the first thing after the two settling
  steps is a film, a band or a person.

  So the rule that survives is about the ROAD rather than about a separate screen: the
  product must show somebody what DUB is before it finishes asking them about themselves.
  Measured as "a vibe step comes before the last asking step", which is the honest shape of
  that promise and cannot be satisfied by ten basics steps in a row.
*/
{
  const steps = roadFor(null)
  const firstVibe = steps.findIndex((st) => st.family !== 'the_basics')
  const lastAsk = steps.reduce((at, st, i) => {
    const r = ROOTS.find((x) => x.root_id === st.root)
    return (r as { asks?: unknown } | undefined)?.asks ? i : at
  }, -1)
  ok(
    'the road reaches a vibe before it stops asking',
    firstVibe >= 0 && firstVibe < lastAsk,
    'first vibe at step ' + (firstVibe + 1) + ', last question at step ' + (lastAsk + 1),
  )
  /* And nothing gendered is asked before gender settles — asserted in full further down. */
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
  const mid = roadProgress({ rootsPlayed: played.slice(0, 2), sectionsCompleted: [], purpose })
  const end = roadProgress({ rootsPlayed: played, sectionsCompleted: [], purpose })
  ok(purpose + ': the road is shut part-way', !mid.open, 'open at ' + mid.done + ' of ' + mid.total)
  ok(purpose + ': the road opens at the end', end.open, 'still ' + end.done + ' of ' + end.total)
  /* And not before the warm-up, whatever else has been played. */
  console.log('    ' + purpose.padEnd(9) + end.total + ' steps')
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
    EVERY BREAK IS ACTUALLY MET, WHICH IS NOT THE SAME AS EXISTING.

    Sam: "Vamos las appears twice identically." Four distinct breaks were authored and the
    checks above all passed — they test the CONTENT. What nothing tested was the sequence a
    learner walks, and the screen read `sittings` one short: it renders immediately before
    SectionComplete, which is where rememberSection increments. So sitting 1 and sitting 2
    both read the same number, Math.max(1, n) clamped them to the same break, and Já está
    was unreachable.

    This walks the real order and requires four different screens.
  */
  /*
    AS MANY SITTINGS AS THERE ARE BREAKS, each one different.

    This asserted four, and there are three now: Já está moved off the breaks and onto the
    screen that opens the Legend — Sam, "Move Ja esta to the very last legend screen that
    opens the legend" — because it is not about carrying on, which is what the other three
    are for. Derived from BREAKS.length rather than counted, so moving one again does not
    need this line edited.
  */
  const met = BREAKS.map((_, i) => breakAfter(i + 1).pt)
  ok(
    'each sitting meets a different break',
    new Set(met).size === BREAKS.length,
    met.join(' / '),
  )
  /*
    AND THE ROAD'S END IS NOT ONE OF THEM. The celebration is DONE, on the Legend-opening
    screen; a break saying "nearly there" to somebody who has arrived is the fault this
    replaces.
  */
  ok(
    'and none of them celebrates the end',
    !BREAKS.some((b) => b.pt === DONE.pt),
    BREAKS.map((b) => b.pt).join(' / '),
  )

  /*
    AND THE SCREEN READS THE SITTING IT IS CLOSING, not the one before it.

    The two assertions above test breakAfter, which was always correct — the bug was in
    the CALLER, which passed a count that had not been incremented yet. So this asserts
    against the source: the break screen must add one to `sittings`, because
    rememberSection fires on the NEXT step. Source-level because the alternative is
    booting a browser to count four screens, and a check nobody runs is worse than a
    blunt one.
  */
  const journeySrc = readFileSync('components/Journey.tsx', 'utf8')
  ok(
    'the break screen counts the sitting it closes',
    /const sittingNow = \(learner\.sittings \?\? 0\) \+ 1/.test(journeySrc) &&
      /breakAfter\(sittingNow\)/.test(journeySrc),
    'it renders before rememberSection increments',
  )

  /*
    AND IT STOPS AFTER THE LAST ONE, rather than repeating it for ever.

    Sam: "Ja Esta progress gateway is now duplicated." The previous check stopped at
    sitting 4, so it modelled the road and nothing past it — and past it was where the
    fault lived. Two clamps both saturated on BREAKS[last]: `road.open` short-circuits
    there and never consults the count, and breakAfter falls through there for any sitting
    with no entry. A fifth sitting is easy to reach — the basics hold more roots than the
    road needs and SectionComplete's own MORE BASICS queues another — so Já está landed on
    sitting 4, then 5, then 6, each time telling a learner their Legend was finished.

    Asserted at the source, because the behaviour is a guard in the component rather than
    a value breakAfter can return: past the last break the screen stands aside.
  */
  ok(
    'the break stands aside past the last one',
    /const pastTheEnd = sittingNow > BREAKS\.length/.test(journeySrc) &&
      /if \(pastTheEnd\) return null/.test(journeySrc),
    'road.open and breakAfter both saturate on the final break',
  )

  /*
    AND NO BREAK LEANS ON A WORD DUB HAS NOT TAUGHT.

    Sam: "it is still assuming way too much. just because we have learned Vem (comigo)
    doesnt mean we understand vamos."

    He is right and the premise was wrong everywhere, not in one sentence. Break 1 said
    "You already have vamos" — vamos and lá are taught by bob_here_we_go, a Bob Marley
    vibe that is not on the road, so a learner who took Bridget Jones had neither. falta,
    pouco, quase and já are taught NOWHERE in the product.

    A break has ten seconds and no lesson behind it, so the rule is not "only use taught
    words" — that would delete three of the four. It is that the gloss may not CLAIM prior
    knowledge: no "you already have", no "add X to the Y you know". It teaches from
    nothing, every time, because it cannot know what the reader has.
  */
  for (const b of BREAKS) {
    const claims = /you already (have|know)|already on your|the \w+ you (have|know|own)/i.test(b.gloss)
    ok('break ' + b.after + ' assumes no vocabulary', !claims, b.gloss.slice(0, 60))
  }

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
/*
  AN EMPTY CARD DOES NOT OPEN THE CLUB.

  Sam: "I completed the basics but it allowed me into the club without completing the
  legend." Walking the basics DOES answer all seven — that is the design, and his own
  words are quoted at the top of content/road.ts: "you are literally building the legend
  as you learn." So the Club opening on a finished road is correct.

  What was not correct is what happens to a SKIPPED one. Clearing or skipping a card
  writes `values: {}`, and cardToGo took the caller's word for which ids were answered —
  so an empty card counted as done, and four outstanding became three. All four callers
  filter the empties first, in four separate places; the fifth to forget would have opened
  the Club to somebody who had answered nothing.

  Asserted on cardToGo rather than on the callers, because that is where it is now decided
  and a new caller inherits it for free.
*/
console.log('\nan empty card is not an answered one\n')
{
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const all = cardFor(purpose).map((f) => f.id)
    const real = all.map((id) => ({ frame_id: id, values: { x: 'y' } }))
    ok(purpose + ': seven real answers open it', clubOpen({ answeredFrameIds: all, answers: real, purpose }))
    /* One of them cleared — the id is still listed, the values are gone. */
    const skipped = real.map((a, i) => (i === 0 ? { ...a, values: {} } : a))
    ok(
      purpose + ': one skipped keeps it shut',
      !clubOpen({ answeredFrameIds: all, answers: skipped, purpose }),
      'cleared ' + all[0],
    )
    ok(
      purpose + ': and it is counted as outstanding',
      cardToGo(all, skipped, purpose) === 1,
      String(cardToGo(all, skipped, purpose)),
    )
  }
}

console.log('\nthe door and the copy agree\n')
{
  for (const purpose of ['visiting', 'staying', 'moving'] as const) {
    const all = roadFor(purpose).map((step) => step.root)
    /* Road walked AND warmed up — the door is open, so nothing may ask for more. */
    const done = legendStatus({
      rootsPlayed: all,
      sectionsCompleted: [DOORWAY],
      sittings: 9,
      purpose,
    })
    ok(purpose + ': a walked road opens the door', done.open, JSON.stringify(done))
    ok(
      purpose + ': and asks for nothing more',
      done.vibesNeeded - done.vibesDone <= 0,
      done.vibesDone + ' of ' + done.vibesNeeded,
    )
    /*
      THE WARM-UP HALF IS GONE. There were two fixtures here — road walked WITH a finished
      warm-up and road walked WITHOUT one — asserting open and shut respectively. With the
      warm-up removed they became the same fixture, so one of them necessarily failed; the
      honest reading is that the second question no longer exists.

      What it was protecting is still protected by the assertion above it: a walked road
      opens the door and nothing asks for more. See content/road.ts on why the warm-up
      went.
    */
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

/*
  A GENDERED QUESTION IS NEVER ASKED BEFORE GENDER IS KNOWN.

  Sam: "it needs to feed the language selector so we get ingles/inglesa for the right
  gender." The nationality chips are drawn with the learner's own ending — inglês or
  inglesa — so the root that settles gender has to come first. It did not: thank_you was
  third and tb_introduce, which draws the chips, was second.

  Asserted as an ordering rule rather than as two fixed positions, so moving either one
  again cannot quietly reopen it.
*/
console.log('\nnothing gendered is asked before gender is known\n')
{
  const order = ROAD.map((s) => s.root)
  const genderAt = order.findIndex((id) => {
    const r = ROOTS.find((x) => x.root_id === id)
    const a = (r as { asks?: string | string[] } | undefined)?.asks
    return (Array.isArray(a) ? a : a ? [a] : []).includes('gender')
  })
  /* Every frame with a gendered slot, and the step that asks it. */
  for (const [i, step] of ROAD.entries()) {
    const r = ROOTS.find((x) => x.root_id === step.root)
    const a = (r as { asks?: string | string[] } | undefined)?.asks
    for (const which of Array.isArray(a) ? a : a ? [a] : []) {
      const frame = LEGEND_FRAMES.find((f) => f.id === which)
      const gendered = frame?.slots.some((sl) => sl.gendered || sl.options?.some((o) => o.f))
      if (!gendered) continue
      ok(
        step.root + ' is asked after gender is known',
        genderAt >= 0 && genderAt < i,
        'gender settles at step ' + (genderAt + 1) + ', this is step ' + (i + 1),
      )
    }
  }
}

if (fail.length) { console.log('\n' + fail.length + ' error(s)'); process.exit(1) }
console.log('\nevery step earns its place, and the road arrives')
