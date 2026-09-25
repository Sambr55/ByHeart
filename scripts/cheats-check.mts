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
import { CHEATS, cheatUnlocked, cheatNeeds, type CheatKind } from '../content/cheats'
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
  const deck = decks([]).find((d) => d.id === 'cheats')
  ok('there is a cheats deck', Boolean(deck))
  ok('and it has a real total', deck?.total === CHEATS.length, String(deck?.total))

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

console.log('')
if (problems.length) {
  console.log('✗ ' + problems.length + ' problem' + (problems.length === 1 ? '' : 's'))
  for (const p of problems) console.log('  - ' + p)
  process.exit(1)
}
console.log(CHEATS.length + ' shapes, all reachable, all worth something')
