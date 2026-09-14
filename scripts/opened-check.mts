/**
 * The unlock moment actually fires, for everybody, more than once.
 *
 *   npm run opened
 *
 * Sam: "this needs to be an achievement as it is now the main spine of our learning."
 *
 * A celebration nobody triggers is worse than no celebration, because it costs the same
 * to build and reads as dead code forever after. The first version of this screen was
 * gated on the Legend being OPEN, which sounded careful and was measured here at 0.13
 * firings per run — 87% of learners would never have seen it once. The arithmetic: the
 * Legend opens at five completed vibes, and every word that makes a question answerable
 * is taught in vibes one to five, so the trigger and the celebration sat at opposite ends
 * of the same five vibes.
 *
 * That class of bug is invisible in review and obvious in measurement, so it is measured
 * here across every way a learner can spend the free tier, and it stays measured.
 */
import { framesJustOpened, cardFor, CARD_SIZE } from '../content/legend'
import { ROOTS, CRATES } from '../content/roots'
import { FREE_ENTITLEMENTS } from '../lib/entitlements'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

const piecesOf = (fam: string) =>
  ROOTS.filter((r) => r.culture_family === fam).flatMap((r) =>
    r.extracts.map((e) => e.id),
  )

const BASICS = 'the_basics'
const others = CRATES.map((c) => c.id).filter((id) => id !== BASICS)
const free = FREE_ENTITLEMENTS.crates

/*
  Every way to spend the free tier: the basics, which is forced, plus every combination of
  the rest. Order inside a run does not change what a run OPENS in total, but it does
  change when — so each run is walked in sequence, exactly as a learner walks it.
*/
const runs: string[][] = []
const pick = (start: number, acc: string[]) => {
  if (acc.length === free - 1) return void runs.push([BASICS, ...acc])
  for (let i = start; i < others.length; i++) pick(i + 1, [...acc, others[i]])
}
pick(0, [])

let firings = 0
let silent = 0
for (const run of runs) {
  const owned = new Set<string>()
  let fires = 0
  for (const fam of run) {
    const before = new Set(owned)
    for (const p of piecesOf(fam)) owned.add(p)
    if (framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] }).length) fires++
  }
  firings += fires
  if (fires === 0) silent++
}

note(`${runs.length} ways to spend the free tier · ${(firings / runs.length).toFixed(2)} unlock screens per run`)

/* THE INVARIANT THAT MATTERS. Not "it can fire" — that a real learner sees it. */
if (silent > 0) {
  fail.push(`${silent} of ${runs.length} free-tier runs never show the unlock screen at all`)
}

/*
  The doorway hands over the whole card, and the screen says so in different words.

  If a content change ever leaves one card question unopened by the basics, the doorway
  firing silently becomes an ordinary one — the learner is told "another part opened"
  about seven questions, and the five-vibe trap is quietly back.
*/
const byBasics = framesJustOpened({
  before: new Set(),
  after: new Set(piecesOf(BASICS)),
  answered: [],
  purpose: null,
  answers: [],
})
const card = cardFor(null)
const missing = card.filter((f) => !byBasics.some((o) => o.id === f.id))
if (missing.length) {
  fail.push(`the basics does not open the whole card — missing ${missing.map((f) => f.id).join(', ')}`)
} else {
  note(`the basics opens all ${CARD_SIZE} card questions (+${byBasics.length - CARD_SIZE} above it)`)
}

/*
  And it must still have something left to say afterwards. A doorway that opens every
  frame in the product leaves every later vibe silent, which is the 87% bug wearing a
  different hat.
*/
const later = runs.filter((run) => {
  const owned = new Set(piecesOf(BASICS))
  return run.slice(1).some((fam) => {
    const before = new Set(owned)
    for (const p of piecesOf(fam)) owned.add(p)
    return framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] }).length > 0
  })
}).length
note(`${later} of ${runs.length} runs open another question after the basics`)
if (later === 0) fail.push('nothing opens after the basics — the screen fires once, ever')

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('the unlock moment reaches every learner')
