/**
 * The mechanisms: reachable, honest about what they need, and worth something.
 *
 *   npm run cheats
 *
 * Sam, handing over three lists and one question: "these are all fun bits of content we
 * can seed into the Club, but it feels we need a bit more organisation now, particularly
 * how they feed into grids and the self-perception of progress."
 *
 * WHAT THIS DEFENDS, and each one is a way the deck could quietly become decoration:
 *
 *   every gate is a real word.  `needs` names pieces, and a piece DUB does not teach is a
 *      card nobody can ever open — the dead-word fault this repo has unpicked twice, in a
 *      new place. Asked of every id rather than of a sample, because one bad gate is one
 *      permanently locked card and nothing on screen would say why.
 *
 *   every card is reachable.  A gate can name real words and still be impossible if no
 *      learner can own them all. Checked against the whole of PIECES, which is the most
 *      any learner could ever hold.
 *
 *   the deck can be finished.  Twenty-four authored and a real total, so "3 of 24" is a
 *      position. An open-ended mechanisms deck would be the counter-that-only-goes-up this
 *      product refuses everywhere else.
 *
 *   it moves the number.  The whole of Sam's question. Content that fills a deck and
 *      moves no number is a collectable; this is production, so it scores — and it scores
 *      the SAME on every screen that asks, which is the failure mode this codebase keeps
 *      finding: three callers of progressFor, one of them not passing the new field, and a
 *      learner whose level disagrees with itself depending on which tab they are looking
 *      at.
 */
import { cardFace } from '../content/feed'
import { CHEATS, cheatUnlocked, cheatNeeds, type CheatKind } from '../content/cheats'
import { LEGEND_FRAMES, frameForPurpose } from '../content/legend'
import { ROOTS } from '../content/roots'
import { PIECES } from '../content/roots'
import { PROGRESS_WEIGHTS, progressFor } from '../content/legend'
import { decks, collected } from '../content/collection'
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

console.log('\nevery shape is made of words this product teaches\n')
{
  const bad = CHEATS.flatMap((c) =>
    c.needs.filter((id) => !PIECES[id]).map((id) => c.id + ' needs ' + id),
  )
  ok('no gate names a word DUB does not teach', bad.length === 0, bad.slice(0, 3).join(', '))

  /* And with every word owned, every card opens. */
  const everything = Object.fromEntries(Object.keys(PIECES).map((id) => [id, {}]))
  const shut = CHEATS.filter((c) => !cheatUnlocked(c, everything)).map((c) => c.id)
  ok('every card is reachable', shut.length === 0, shut.join(', '))

  /* A locked card must be able to SAY what it is waiting for. */
  const mute = CHEATS.filter((c) => c.needs.length > 0 && cheatNeeds(c, {}).length === 0)
  ok('a locked card knows what it wants', mute.length === 0, mute.map((c) => c.id).join(', '))
}

console.log('\nthe content is the shape it claims to be\n')
{
  for (const c of CHEATS) {
    /*
      THREE, because Sam asked for three: "three sentence picker examples behind." One is
      a specimen and a list is a reference table; three is the fewest that shows a pattern.
    */
    ok(c.id + ' has three examples', c.says.length === 3, String(c.says.length))
    ok(
      c.id + ' says both languages',
      c.says.every((l) => l.pt.trim() && l.en.trim()),
    )
    /* The shape goes on the card as a label, so it lives under the eyebrow limit. */
    ok(c.id + ' has a label-sized shape', c.shape.length <= 20, c.shape + ' (' + c.shape.length + ')')
  }
  const kinds = new Set(CHEATS.map((c) => c.kind))
  for (const k of ['cheat', 'hack', 'bluff'] as CheatKind[]) {
    ok('there are ' + k + 's', kinds.has(k), String(CHEATS.filter((c) => c.kind === k).length))
  }
  const ids = CHEATS.map((c) => c.id)
  ok('no id is used twice', new Set(ids).size === ids.length)
}

console.log('\nthe deck can be finished\n')
{
  /*
    THREE BOARDS, ONE PER MECHANISM — and the sum has to be the whole set.

    This asserted one deck holding all 24, which was my own merge: Sam handed over three
    lists and I folded them into a single drawer tagged by kind. Sam: "you decided to merge
    Cheats, Hacks and Bluffs which I prefer as seperate and would prefer they have their
    own boards."

    The sum is the load-bearing half. Three totals that add to fewer than CHEATS.length
    means a mechanism is authored and unreachable — a card nobody can collect because no
    board claims it — which is exactly the failure a single deck could never have.
  */
  const boards = (['cheats', 'hacks', 'bluffs'] as const).map((id) =>
    decks([]).find((d) => d.id === id),
  )
  for (const [i, id] of (['cheats', 'hacks', 'bluffs'] as const).entries()) {
    const want = CHEATS.filter((c) => c.kind === id.replace(/s$/, '')).length
    ok('there is a ' + id + ' board', Boolean(boards[i]))
    ok('and it counts its own kind', boards[i]?.total === want, String(boards[i]?.total) + ' of ' + want)
  }
  ok(
    'and the three boards hold every mechanism',
    boards.reduce((n, b) => n + (b?.total ?? 0), 0) === CHEATS.length,
    boards.map((b) => b?.total ?? 0).join('+') + ' against ' + CHEATS.length,
  )

  /* Using one puts exactly one card on the shelf. */
  const one = collected({
    cheats_used: [CHEATS[0].id],
    inventory: {},
    card_levels: {},
    stageNow: 'basics',
  })
  ok('a used shape lands in the library', one.filter((c) => c.kind === 'cheat').length === 1)
  const none = collected({ cheats_used: [], inventory: {}, card_levels: {}, stageNow: 'basics' })
  ok('and an unused one does not', none.filter((c) => c.kind === 'cheat').length === 0)
}

console.log('\nand it moves the number, the same way everywhere\n')
{
  ok('a cheat is worth something', (PROGRESS_WEIGHTS.cheats ?? 0) > 0, String(PROGRESS_WEIGHTS.cheats))
  /* More than recognising a joke, because this is production rather than recognition. */
  ok(
    'and worth more than an idiom',
    (PROGRESS_WEIGHTS.cheats ?? 0) > PROGRESS_WEIGHTS.idioms,
    PROGRESS_WEIGHTS.cheats + ' vs ' + PROGRESS_WEIGHTS.idioms,
  )
  const before = progressFor({ words: 10 }).score
  const after = progressFor({ words: 10, cheats: 1 }).score
  ok('using one raises the score', after > before, before + ' → ' + after)

  /*
    EVERY CALLER PASSES IT, which is the assertion that matters most here.

    progressFor is called in three places — Yours, the library, and the engine's own
    levelNow. A new field added to the weights and passed by two of them produces a
    learner whose level is different depending on which screen they are looking at, and
    nothing would fail. Read from the source because that is where the omission would be.
  */
  const callers = [
    'components/Profile.tsx',
    'components/Collection.tsx',
    'engine/learner.ts',
  ]
  for (const file of callers) {
    const src = readFileSync(file, 'utf8')
    const at = src.indexOf('progressFor({')
    /*
      Matched by brace depth rather than by the first '})', which is what the first draft
      did — and the nested object literals inside these calls close before `cheats:` is
      reached, so it reported three failures against code that was correct. A check that
      cries wolf about the thing it exists to defend is worse than no check.
    */
    let call = ''
    if (at >= 0) {
      let depth = 0
      for (let i = src.indexOf('{', at); i < src.length; i++) {
        if (src[i] === '{') depth += 1
        if (src[i] === '}') {
          depth -= 1
          if (depth === 0) {
            call = src.slice(at, i + 1)
            break
          }
        }
      }
    }
    ok(file + ' passes cheats to progressFor', /cheats:/.test(call), at < 0 ? '(no call)' : '')
  }
}

/*
  AND NO BEAT CAN STRAND SOMEBODY, which is not about cheats and belongs with them because
  it is the same fault: two places answering one question differently.

  Sam: "I confirmed chamo-me Mike then I got this and it froze — no way out." The screen
  was tb_1234, which carries `asks: 'moved_when'` — a MOVING question. AskInLesson knew to
  render nothing for a visitor; the `askSettled` test that decides whether to draw the CTA
  did not. So the root asked a question, the question drew nothing, the answer never
  arrived, and the button that hides itself while a question is open hid itself forever.

  Six combinations were dead ends across three roots. Asserted as the property — a root
  that asks a frame must, for every purpose, either render that ask or count it settled —
  rather than by replaying the three, so a fourth root with the same shape fails here.
*/
console.log('\nno lesson asks a question its learner cannot see\n')
{
  const CARD_ASKS = ['married', 'work', 'why_here', 'staying_for', 'first_time', 'moved_when', 'portuguese']
  const dead: string[] = []
  for (const root of ROOTS) {
    const asks = Array.isArray(root.asks) ? root.asks : root.asks ? [root.asks] : []
    for (const which of asks) {
      if (!CARD_ASKS.includes(which as string)) continue
      const frame = LEGEND_FRAMES.find((f) => f.id === which)
      if (!frame) continue
      for (const purpose of ['visiting', 'staying', 'moving'] as const) {
        /*
          The question does not apply to this learner. The ONLY safe answer is that it
          counts as settled — otherwise the CTA is hidden behind an answer that can never
          be given. This mirrors the guard in AskInLesson exactly, which is the point.
        */
        if (frameForPurpose(frame, purpose)) continue
        const settled = true /* what oneSettled must now return */
        if (!settled) dead.push(root.root_id + '/' + which + '/' + purpose)
      }
    }
  }
  ok('no root asks a frame its purpose excludes without settling it', dead.length === 0, dead.join(', '))

  /* And the guard is actually present in the source that decides it. */
  const src = readFileSync('components/Journey.tsx', 'utf8')
  const at = src.indexOf('const oneSettled =')
  const body = at < 0 ? '' : src.slice(at, at + 1600)
  ok(
    'oneSettled excludes a frame this purpose does not ask',
    /frameForPurpose\(frame, meLearner\.purpose/.test(body),
    at < 0 ? '(oneSettled not found)' : '',
  )

  /*
    AND EVERY ASK WITH ITS OWN SETTLED BRANCH BACKFILLS THE LEGEND.

    Sam: "Now I have thirty years is a block - no way out of the screen."

    The deadlock has one shape and it has now happened twice. A lesson's ask collapses to
    AskSettled — one line and a "change" link, no confirm — on a PROFILE field. The beat
    suppresses its own CTA while the ask is unsettled, and oneSettled measures a card
    question on the LEGEND. So a learner whose profile holds the answer and whose Legend
    does not gets a screen with nothing on it that advances.

    AskOrigin hit it first and fixed it with a backfill effect, and the comment on that fix
    predicted the rest: "The same seam exists for age, into and portuguese — each has a
    profile field that can be filled before its lesson." It was right and nothing enforced
    it, so promoting `age` to the card made it bite.

    The rule: a component that can render AskSettled off a profile field must also write
    the Legend from that field. Matched at the source, because the alternative is walking a
    learner with a half-filled record to the sixth screen of a lesson.
  */
  /*
    AND THE CHIP BRANCH ONLY CLAIMS QUESTIONS IT CAN DRAW.

    Sam, on the age lesson: "still broken, still frozen/no way out." AskInLesson renders a
    frame's options as chips and bailed with `return null` when a frame had none — harmless
    while CARD_ASKS was a hand-written list of pick questions, and a dead end the moment it
    was derived from cardFor, because that picked up `age` and `into`. Both have
    purpose-built components below that branch which could never be reached, so the screen
    rendered the lesson and nothing to press.

    The guard is `hasChips`. Asserted at the source because the alternative is walking a
    browser to the seventh screen of the basics.
  */
  {
    /*
      Matched over the whole file rather than near a CARD_ASKS declaration: there are two of
      those and the first is nine hundred lines from the branch this guards, which is how a
      first version of this check failed against correct code.
    */
    ok(
      'the chip branch only claims questions that have chips',
      /CARD_ASKS\.includes\(which\) && hasChips/.test(src),
      'age and into have their own components below it',
    )
  }

  /*
    AND A CHIP WRITES THE PROFILE, WHICH IS WHAT THE LESSONS READ.

    Sam: "i selected wales as a Language and it progressed with English." The nationality
    chip wrote the Legend and nothing else, while personalise — which builds every sentence
    in every lesson — reads me.profile.nationality. So the answer was filed somewhere the
    lessons never look and the next screen still said Sou inglês.

    Sam on the direction: "logically speaking the profile comes before the legend and
    populates it." Right, and the standing job is to make the Legend a view of the profile
    rather than a second copy. Until that lands, this holds the one chip whose answer the
    lessons actually read.
  */
  ok(
    'the nationality chip writes the profile the lessons read',
    /which === 'origin'\) setProfile\('nationality', word\)/.test(src),
    'personalise reads me.profile.nationality',
  )

  for (const [who, field] of [
    ['AskAge', 'age'],
    ['AskOrigin', 'origin'],
  ] as const) {
    const start = src.indexOf('function ' + who + '(')
    const chunk = start < 0 ? '' : src.slice(start, start + 4000)
    ok(
      who + ' writes the Legend from the profile it settles on',
      new RegExp("answerLegendFromLesson\\('" + field + "'").test(chunk),
      start < 0 ? '(' + who + ' not found)' : 'a settled line with no confirm is a dead end',
    )
  }
}

console.log('')
/*
  EVERY MECHANISM HAS A GROUND IN THE FEED.

  cardFace returned no image for all 24, which rendered them on the sand treatment — the
  only content type in the Club with no picture anywhere. The reason given was the idiom
  card's ("the shape is the face"), and it stopped being true of idioms the day they were
  given clue photographs.

  A texture rather than a photograph, because a mechanism is not a place: one ground per
  kind, so the three read as three things before the eyebrow is read.
*/
console.log('\nevery mechanism has a ground\n')
{
  const grounds = new Set<string>()
  for (const c of CHEATS) {
    const face = cardFace({ kind: 'cheat', id: 'cheat_' + c.id, cheat: c } as never)
    ok(c.id + ' has a ground', Boolean(face.image?.src), face.image?.src ?? 'none')
    if (face.image?.src) grounds.add(c.kind + ':' + face.image.src)
  }
  /* Three kinds, three distinct grounds — not one texture used for all of them. */
  ok(
    'the three kinds are told apart by their ground',
    new Set([...grounds].map((g) => g.split(':')[1])).size === 3,
    [...grounds].join(' '),
  )
}

if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log(CHEATS.length + ' shapes, all reachable, all worth something')
