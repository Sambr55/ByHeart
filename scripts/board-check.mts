/**
 * TAPPING A CARD ON A BOARD, AND WHAT IS ON THE OTHER SIDE OF IT.
 *
 *   npm run board
 *
 * Sam, four reports in one list, all of them "the board sent me somewhere wrong":
 *
 *   "Blank Legend cards (e.g. 'So you have children') link to the run-through but should
 *      link to the actual learning task."
 *   "Board vibe cards show tasks with no reference to their source crate — Duran Duran
 *      gives you 'See you Monday'."
 *   "Lost in translations in the board gives audio playback for English not Portuguese."
 *   "Speaking Vocals into Cheats in their board isn't giving green tick/fail feedback —
 *      check all board cards."
 *
 * ONE CAUSE UNDERNEATH THREE OF THEM: the boards show every card now, done or not, and
 * every one of them linked at /revise without asking whether there was anything to revise.
 * The fourth was a screen advancing inside the handler that was about to draw the verdict.
 *
 * WHAT THIS DEFENDS:
 *
 *   every card goes somewhere that can answer it. An undone Legend frame has nothing to
 *      revise, so it must link at the screen that fills it. Asked of EVERY card on every
 *      board rather than of a sample, because the fault was invisible until a particular
 *      question was tapped.
 *
 *   the answer is always in the target language. `answer` is the field SayItCard speaks
 *      through slugFor, renders in `pt`, and hands the pt-PT recogniser to match — so an
 *      English string there is three faults at once and cannot ever pass. This is the one
 *      assertion that would have caught the idiom card on the day it was written.
 *
 *   a sentence is never asked without its moment. Every transfer_prompt carries a context
 *      and the lesson shows it; the board dropped it, which is what made a Duran Duran
 *      card read as a bare English fragment.
 *
 *   nothing on a board is a dead end. A card whose revision is empty and whose kind has no
 *      teaching route would be a tile that does nothing — allowed only where the card
 *      genuinely holds no sentence, which the check names rather than tolerates silently.
 */
import { readFileSync } from 'node:fs'
import { everyCard, cardHref, type CardKind } from '../content/collection'
import { revisionFor, revisionTitle } from '../content/revision'
import { PIECES } from '../content/roots'
import { LEGEND_FRAMES } from '../content/legend'
import { CHEATS } from '../content/cheats'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/*
  A learner who owns every word, so the WORDS shelves have something to ask. The point is
  the ROUTING rather than one person's record — a shelf asking nothing because this
  particular learner owns nothing is correct behaviour and would hide the faults above.
*/
const rich = {
  legend: LEGEND_FRAMES.map((f) => ({ frame_id: f.id, values: { x: 'y' } })),
  gender: 'm' as const,
  inventory: Object.fromEntries(Object.keys(PIECES).map((k) => [k, 1])),
  asked: [],
}

const cards = everyCard()

console.log('\nevery card, tapped\n')
{
  /*
    AN UNDONE CARD GOES TO THE TASK, A DONE ONE TO THE REVISION.

    Both directions, because this broke by always choosing one of them. Checked through
    cardHref rather than by repeating its rules here: a check that reimplements the thing
    it is checking passes when both copies are wrong together.
  */
  /*
    ASKED OF A LEARNER WHO HAS NOT DONE IT, which is the only state in which this can fail.

    First written against `rich` — a record holding every word and every frame answered —
    and it passed while frames were deliberately sabotaged back to /revise. Of course it
    did: a frame's revision IS the learner's own answer, so a learner who has answered all
    thirteen has thirteen revisions and nothing is empty. The fixture was hiding the
    reported fault.

    An undone card means somebody who has not been there, so that is who it asks. `empty`
    holds no legend, no inventory and nothing asked — the state a brand-new learner opens
    a board in, and the one Sam was in when he tapped "So you have children".

    Sets excluded, and that is not an exemption: a set whose members this product only
    glosses holds no sentence anybody has been taught, so there is nothing to ask and no
    lesson to send them to — /revise says exactly that in words. The last assertion in this
    file names every such card, so one appearing in a kind that SHOULD have content fails
    there.
  */
  const empty = { legend: [], gender: null, inventory: {}, asked: [] }
  /*
    SHEETS AND SHELVES, and the two are excluded for different reasons that both end in
    the same place: /revise is the right destination and the screen says something true
    when it gets there. A reference set holds no sentence at all. A word shelf holds
    whatever this learner has earned, which on day one is nothing — so it says so and
    points at a sitting rather than claiming to be a reference. Both were found by this
    check and both are asserted in `no dead tiles` below, which names them out loud.

    ASKED has no authored universe, so an id only exists once the learner wrote it.
  */
  const REFERENCE: CardKind[] = ['sheet', 'words', 'asked']
  const undoneToRevise = cards.filter(
    (c) =>
      !REFERENCE.includes(c.kind) &&
      cardHref({ ...c, done: false }).startsWith('/revise') &&
      !revisionFor(c.kind, c.id, empty).length,
  )
  ok(
    'no undone card links at a revision with nothing in it',
    undoneToRevise.length === 0,
    undoneToRevise.slice(0, 4).map((c) => c.kind + ':' + c.id).join(', ') || 'all routed',
  )

  const doneNotRevise = cards.filter((c) => !cardHref({ ...c, done: true }).startsWith('/revise'))
  ok(
    'a finished card always opens its revision',
    doneNotRevise.length === 0,
    doneNotRevise.slice(0, 4).map((c) => c.kind + ':' + c.id).join(', ') || String(cards.length) + ' cards',
  )

  /* The one Sam named. A frame nobody has answered must go where it gets answered. */
  const children = cardHref({ kind: 'frame', id: 'children', done: false })
  ok(
    'an unanswered Legend question opens the question',
    children === '/legend?build=children',
    children,
  )
}

console.log('\nthe answer is the language being learned\n')
{
  /*
    THE ASSERTION THAT WOULD HAVE CAUGHT THE IDIOM CARD.

    Not a dictionary check — a shape check. English function words are the cheapest
    reliable tell, and `answer` on a revision line should never read as a sentence of
    them. "Bob's your uncle" trips this; "E pronto" does not.
  */
  const ENGLISH = /\b(the|you|your|and|that|with|have|dont|don’t|it’s|its|not|is|are|was|of|to|for|my|me|i)\b/i
  const bad: string[] = []
  for (const c of cards) {
    for (const line of revisionFor(c.kind, c.id, rich)) {
      const words = line.answer.toLowerCase().replace(/[^a-z’' ]/g, '').split(/\s+/).filter(Boolean)
      const hits = words.filter((w) => ENGLISH.test(w)).length
      /*
        Two or more, because Portuguese shares a few short strings with English function
        words by accident and one is not evidence. Two in a row is a sentence in the wrong
        language.
      */
      if (words.length && hits >= 2) bad.push(c.kind + ':' + c.id + ' → "' + line.answer + '"')
    }
  }
  ok(
    'no revision asks for an English sentence',
    bad.length === 0,
    bad.slice(0, 4).join(' | ') || 'every answer is Portuguese',
  )

  /* The idiom card specifically, named because it is the one that was wrong. */
  const idiom = revisionFor('idiom', 'bobs_your_uncle', rich)[0]
  ok(
    'an idiom asks for what Portugal actually says',
    idiom?.answer === 'E pronto',
    String(idiom?.answer),
  )
}

console.log('\nnothing is asked without its moment\n')
{
  /*
    Vibes and drops only. A word on a shelf has no situation and inventing one would be
    writing content in a lookup function — see RevisionLine.context.
  */
  const needs: CardKind[] = ['vibe', 'drop']
  const missing: string[] = []
  for (const c of cards.filter((c) => needs.includes(c.kind))) {
    for (const line of revisionFor(c.kind, c.id, rich)) {
      if (!line.context?.trim()) missing.push(c.kind + ':' + c.id + ' → "' + line.ask + '"')
    }
  }
  ok(
    'every vibe and drop line says what moment it is for',
    missing.length === 0,
    missing.slice(0, 4).join(' | ') || 'all situated',
  )

  /*
    A SHAPE ALWAYS SAYS WHAT THE SHAPE IS.

    Sam: "the 'add mente to English adjectives ending ly' explanation is on the front card
    — needs to be in Board Hack click-throughs too."

    The feed's cheat card and CheatPane both show `does`, and the board click-through showed
    the header -LY → -MENTE then asked for "normally" with nothing stating the rule. Three
    worked examples and no rule is a vocabulary list wearing a pattern's name.

    AND A TRANSFORMATION HACK SAYS HOW. A shape with an arrow in it asks somebody to change
    a word, which means there is a move to get wrong — -mente attaches to the feminine, so
    ridiculomente is what you get by generalising from the examples. Both arrow shapes carry
    a note now and they are the only two; QUERO + ANYTHING needs none, because its examples
    ARE the rule.
  */
  const noRule = CHEATS.filter(
    (c) => !revisionFor('cheat', c.id, rich).every((l) => l.context?.includes(c.does)),
  )
  ok(
    'every shape says what the shape is',
    noRule.length === 0,
    noRule.slice(0, 3).map((c) => c.shape).join(', ') || String(CHEATS.length) + ' shapes',
  )
  const arrowsNoNote = CHEATS.filter((c) => c.shape.includes('→') && !c.note)
  ok(
    'and a transformation says how to make it',
    arrowsNoNote.length === 0,
    arrowsNoNote.map((c) => c.shape).join(', ') || 'both arrow shapes carry the move',
  )

  /* The one Sam named: Duran Duran handing over "See you Monday" with nothing round it. */
  const dd = revisionFor('vibe', 'duran_duran_lisboa', rich).find((l) => l.ask === 'See you Monday.')
  ok(
    'the Duran Duran card says when you would say it',
    Boolean(dd?.context),
    dd?.context ?? 'not found',
  )
  ok(
    'and the header still names the crate it came from',
    revisionTitle('vibe', 'duran_duran_lisboa') === 'Duran Duran song titles',
    revisionTitle('vibe', 'duran_duran_lisboa'),
  )
}

console.log('\nno dead tiles\n')
{
  /*
    A card with nothing to revise AND no teaching route is a tile that does nothing when
    pressed. One case is legitimate — a set whose members this product only glosses holds
    no sentence to ask — so this names them rather than failing, and fails on anything
    else.
  */
  const dead = cards.filter(
    (c) => !revisionFor(c.kind, c.id, rich).length && cardHref({ ...c, done: false }).startsWith('/revise'),
  )
  const notSheets = dead.filter((c) => c.kind !== 'sheet')
  ok(
    'the only cards with nothing to say back are reference sets',
    notSheets.length === 0,
    notSheets.slice(0, 4).map((c) => c.kind + ':' + c.id).join(', ') ||
      dead.length + ' reference sets: ' + dead.map((c) => c.id).join(', '),
  )

  /*
    AND THE EMPTY SCREEN SAYS WHICH KIND OF EMPTY IT IS.

    A word shelf and a reference set both arrive at /revise with nothing to ask, and for a
    while both were told "it is a reference rather than a sentence" — false about a shelf
    somebody has simply not filled yet, and a dead end on the one card in the product that
    is designed to grow. Asserted on the source rather than in a browser because the
    branch is the fact: two messages, two destinations.
  */
  const revise = readFileSync('components/Revise.tsx', 'utf8')
  ok(
    'an empty word shelf is not called a reference',
    /kind === 'words'/.test(revise) && /Nothing on this shelf yet/.test(revise),
    'shelf and set say different things',
  )
  ok(
    'and it offers the sitting that would fill it',
    /kind === 'words' \? '\/vibes'/.test(revise),
    'GO AND EARN SOME → /vibes',
  )
}

console.log('\nsaying it right is answered\n')
{
  /*
    THE SUCCESS PANEL EXISTS AND IS NOT UNMOUNTED BEFORE IT PAINTS.

    Sam: "Speaking Vocals into Cheats in their board isn't giving green tick/fail feedback."
    Measured in a browser with a stubbed recogniser: a WRONG answer drew the whole amber
    panel and a RIGHT one drew nothing, on every kind of board card.

    THE CAUSE WAS A CONTRACT, not content. SayItCard calls `onClose` the moment it hears a
    match and then owns a two-second pause before calling `onNext` — that pause is the
    time somebody looks at what they said. Revise advanced its line inside onClose, and
    because the card is keyed on the sentence, the component was torn down in the same tick
    as the verdict it was about to render.

    So this asserts the division: onClose records, onNext advances, and `setAt` appears in
    exactly one of them. A source assertion rather than a browser one because that is where
    the rule lives — and because the browser version needs a stubbed speech engine, which
    belongs in scripts/say-check.mts with the rest of the microphone.
  */
  const src = readFileSync('components/Revise.tsx', 'utf8')
  const onClose = src.slice(src.indexOf('onClose={'), src.indexOf('onClose={') + 2600)
  const body = onClose.slice(0, onClose.indexOf('}}'))
  const advances = /setAt\(/.test(body) || /setDone\(/.test(body)
  ok(
    'a correct answer does not advance the line itself',
    !advances,
    advances
      ? 'onClose moves the line, so the card unmounts before the verdict paints'
      : 'onClose records only',
  )
  const onNextOwns = /onNext=\{\(\) => \{\s*if \(at \+ 1 < lines\.length\) setAt\(at \+ 1\)/.test(src)
  ok(
    'advancing is the way-on handler, which the reading pause calls',
    onNextOwns,
    onNextOwns ? 'onNext owns setAt' : 'nothing advances on the two-second pause',
  )
}

console.log(
  '\n' + (problems.length ? '✗ ' + problems.length + ' problem(s)\n' + problems.map((p) => '  - ' + p).join('\n') : '✓ every board card lands somewhere that can answer it') + '\n',
)
process.exit(problems.length ? 1 : 0)
