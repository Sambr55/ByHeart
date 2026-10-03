/**
 * CAN THE LEGEND BE BUILT OUT OF VIBES?
 *
 *   npm run vibes:legend
 *
 * Sam, having a crisis about the product's central claim: "We claim a user builds their
 * legend out of vibes, but actually they do one warm up vibe and then it's all from
 * basics. Could we get to the seven legend questions from cherry picked phrases from our
 * original vibes… Obviously we have My name is Bond, so rather than doing a whole bond
 * section, could we just pick that one."
 *
 * THE CLAIM IS THE PRODUCT. "Build your legend out of what you have learned" is on the
 * intro card, and if the only road to it runs through the basics then the vibes are
 * decoration and the sentence is marketing. Measured when he asked: five of the seven
 * frames could already be built from one cherry-picked vibe root each, and two could not —
 * `into` needed gosto_de and musica, `why_here` needed porque, and each of those pieces
 * was taught by exactly one root, all of them in the basics.
 *
 * WHAT THIS ASSERTS, and it is deliberately only one thing: every frame on the Legend card
 * has at least one source OUTSIDE the_basics for every piece it is built from. Not that a
 * particular path exists, not how long it is, and nothing about rungs — Sam: "rungs dont
 * matter in the legend build. We just want seven fun, recognisable statements leading to
 * seven legend answers. Everything else is noise."
 *
 * So this fails when a frame becomes basics-only again, which is the regression that would
 * quietly un-say the claim. It prints the cherry-picked path alongside, because the path is
 * the thing somebody actually wants to look at.
 */
import { CRATES, ROOTS } from '../content/roots'
import { cardFor } from '../content/legend'

const BASICS = 'the_basics'
const fail: string[] = []

/** Which roots teach a piece, and which of those are not the basics. */
const teaches = new Map<string, string[]>()
for (const r of ROOTS) {
  for (const e of r.extracts) {
    const at = teaches.get(e.id) ?? []
    at.push(r.root_id)
    teaches.set(e.id, at)
  }
}
const outside = (piece: string) =>
  (teaches.get(piece) ?? []).filter((id) => {
    const r = ROOTS.find((x) => x.root_id === id)
    return r && r.culture_family !== BASICS
  })

const card = cardFor(null)
console.log('\nthe seven, and where each piece comes from\n')
for (const frame of card) {
  const gaps: string[] = []
  for (const piece of frame.built_from) {
    const vibes = outside(piece)
    if (!vibes.length) gaps.push(piece)
  }
  if (gaps.length) {
    fail.push(
      frame.id + ' can only be built from the basics — no vibe teaches ' + gaps.join(', '),
    )
    console.log('  FAIL  ' + frame.id.padEnd(10) + 'basics-only: ' + gaps.join(', '))
    continue
  }
  /* The shortest honest answer: one root per piece, named with its crate. */
  const from = frame.built_from.map((piece) => {
    const pick = outside(piece)[0]
    const r = ROOTS.find((x) => x.root_id === pick)!
    return piece + ' ← ' + pick + ' (' + r.culture_family + ')'
  })
  console.log('  ok    ' + frame.id.padEnd(10) + from.join('  ·  '))
}

/*
  AND THE SOURCING, which Sam says IS the product: "We need to be very clear the source of
  each fun vibe question, who said it to whom in what film etc. That literally is the VIBE
  of Dub."
  
  Every root already has a `credit` and Journey renders it, so this reports rather than
  fails — but the roots that reach the Legend are the ones a learner meets first, and a
  credit that says "How you introduce yourself, anywhere" is a usage note where the vibe
  wants a person, a film and a moment.
*/
const USAGE_NOTE = /^(how|said at|asked|counted|explaining|when|for)\b/i
const reaching = new Set<string>()
for (const frame of card) for (const piece of frame.built_from) for (const id of outside(piece)) reaching.add(id)
const thin = [...reaching]
  .map((id) => ROOTS.find((r) => r.root_id === id)!)
  .filter((r) => USAGE_NOTE.test((r as { credit?: string }).credit ?? ''))
if (thin.length) {
  console.log('\n  ' + thin.length + ' of ' + reaching.size + ' Legend-reaching roots credit a USE rather than a source:')
  for (const r of thin) {
    console.log('    ' + r.root_id.padEnd(16) + '"' + ((r as { credit?: string }).credit ?? '') + '"')
  }
}

console.log('\n  ' + CRATES.filter((c) => c.id !== BASICS).length + ' vibes, ' + card.length + ' questions')
if (fail.length) {
  console.log('')
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log('\n' + fail.length + ' error(s)')
  process.exit(1)
}
console.log('every Legend question can be reached without the basics\n')
