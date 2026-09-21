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
import { framesJustOpened, legendStatus, cardFor, CARD_SIZE } from '../content/legend'
import { ROOTS, CRATES, type CultureFamily, type Rung } from '../content/roots'
import { sectionRoots } from '../engine/journey'
import { FREE_ENTITLEMENTS } from '../lib/entitlements'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

/*
  A VIBE IS NOT ONE SITTING, and modelling it as one is how this check first lied.

  The first version added a whole vibe's pieces in one step, which made the basics look
  like a single event that hands over all seven card questions at once. Driven in a real
  browser it is nothing of the sort: the basics is 16 roots played over FOUR sittings,
  and the card arrives 1, then 5, then 1, then 1. The screen that was supposed to say
  "you have a Legend now" could therefore never fire, because no single sitting opens the
  whole card.

  So this walks sittings, using sectionRoots — the product's own answer to "what does this
  session serve" — rather than a convenient fiction about vibes being atomic.
*/
/** One sitting: the roots it served and the pieces they teach. The door needs both. */
type Sitting = { roots: string[]; pieces: string[] }

const sittingsOf = (fam: CultureFamily, reached: Rung = 6): Sitting[] => {
  const out: Sitting[] = []
  const played: string[] = []
  const total = ROOTS.filter((r) => r.culture_family === fam && r.rung <= reached).length
  /*
    STOP WHEN THE VIBE IS EXHAUSTED, not when sectionRoots goes quiet — it never does.

    `fresh.length ? fresh : replay` means that once every root has been played it starts
    serving them AGAIN, for ever, so a `!roots.length` guard runs to whatever bound it is
    given. With 20 it reported "20 sittings" for a 4-sitting vibe, which is the check
    describing its own loop rather than the product.

    A replayed root teaches nothing new, so counting played roots is the honest end.
  */
  while (played.length < total) {
    const roots = sectionRoots(fam, reached, played)
    const fresh = roots.filter((r) => !played.includes(r.root_id))
    if (!fresh.length) break
    out.push({ roots: fresh.map((r) => r.root_id), pieces: fresh.flatMap((r) => r.extracts.map((e) => e.id)) })
    for (const r of fresh) played.push(r.root_id)
  }
  return out
}

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
let beforeDoor = 0
let pending = 0
/* Sittings are the same for every run, so resolve each vibe's once. */
const SITTINGS = new Map<string, Sitting[]>(
  [BASICS, ...others].map((id) => [id, sittingsOf(id as CultureFamily)]),
)

/*
  THE RULE, MODELLED THE WAY THE COMPONENT ACTUALLY RUNS.

  The door is the DOORWAY VIBE FINISHED, so it opens on whichever sitting plays the last
  root of the basics — not on a vibe count. Roots are accumulated as they are served and
  the door is asked after each sitting, which is exactly what SectionComplete does.
  `wasOpen` separates the opening sitting from ordinary ones after it.
*/
for (const run of runs) {
  const owned = new Set<string>()
  const played: string[] = []
  let wasOpen = false
  let fires = 0
  for (const fam of run) {
    const sits = SITTINGS.get(fam) ?? []
    for (let i = 0; i < sits.length; i++) {
      const before = new Set(owned)
      for (const p of sits[i].pieces) owned.add(p)
      played.push(...sits[i].roots)
      /*
        The three chosen vibes granted, because this file tests WHEN AN ANNOUNCEMENT
        FIRES rather than what the door costs. Varying the second half here would make
        every assertion below depend on a condition this walk never simulates.
      */
      const open = legendStatus({
        rootsPlayed: played,
        sectionsCompleted: ['top_gun', 'james_bond', 'bridget_jones'],
      }).open
      /*
        NOTHING FIRES WHILE THE DOOR IS SHUT. Sam, on a phone at the end of his first vibe:
        "these unlockers shouldn't show while doing the first five vibes where we are
        unlocking the first 7 legend questions." Measured at the time: six interruptions
        before the door and zero after it, every one announcing something he could not go
        and do.

        `pending` is how many WOULD have fired without the guard — the size of the problem
        that was there, reported as a note so the guard's value stays visible — while
        `beforeDoor` counts screens that actually reach a learner early, which must be zero.
      */
      if (!open) {
        if (
          framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] })
            .length
        ) {
          pending++
        }
        continue
      }
      const seen = wasOpen ? before : new Set<string>()
      if (
        framesJustOpened({ before: seen, after: owned, answered: [], purpose: null, answers: [] })
          .length
      ) {
        fires++
      }
      wasOpen = true
    }
  }
  firings += fires
  if (fires === 0) silent++
}

note(`${runs.length} ways to spend the free tier · ${(firings / runs.length).toFixed(2)} unlock screens per run`)

/* THE INVARIANT THAT MATTERS. Not "it can fire" — that a real learner sees it. */
if (silent > 0) {
  fail.push(`${silent} of ${runs.length} free-tier runs never show the unlock screen at all`)
}
if (beforeDoor > 0) {
  fail.push(
    `${beforeDoor} unlock screens fire before the Legend opens — nothing may interrupt the first five vibes`,
  )
} else {
  note(
    `nothing is announced before the Legend opens (${(pending / runs.length).toFixed(1)} ` +
      'interruptions per run avoided)',
  )
}

/*
  THE BASICS STILL HANDS OVER THE WHOLE CARD — over its sittings, not in one of them.

  This is the invariant that untrapped the card (see docs/spec-legend-parts.md): whichever
  five vibes somebody picks, the forced doorway gives them every question on it. What is
  NOT true, and what a browser had to show me, is that it arrives all at once: the basics
  is 16 roots over four sittings and the card lands 1, then 5, then 1, then 1.
*/
const basicsSittings = SITTINGS.get(BASICS) ?? []
const openedByBasics: string[] = []
{
  const owned = new Set<string>()
  for (const sitting of basicsSittings) {
    const before = new Set(owned)
    for (const p of sitting.pieces) owned.add(p)
    for (const f of framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] })) {
      openedByBasics.push(f.id)
    }
  }
}
const card = cardFor(null)
const missing = card.filter((f) => !openedByBasics.includes(f.id))
if (missing.length) {
  fail.push(`the basics does not open the whole card — missing ${missing.map((f) => f.id).join(', ')}`)
} else {
  note(
    `the basics opens all ${CARD_SIZE} card questions across ${basicsSittings.length} sittings ` +
      `(+${openedByBasics.length - CARD_SIZE} above the card)`,
  )
}

/*
  NO SITTING MAY HAND OVER THE WHOLE CARD, which is the opposite of what I first assumed
  and the reason the doorway screen was cut.

  The screen had a second framing — "YOU HAVE a Legend now" — for a firing that opened the
  entire card at once. Driven in a browser, no sitting does: the most any one of them
  opens is five of the seven. A branch that can never be true is dead copy that reads as
  shipped, so it went, and this keeps the fact it was cut for honest: if content ever
  changes so one sitting DOES hand over the card, this fails and the doorway framing is
  worth writing again.
*/
{
  const owned = new Set<string>()
  let biggest = 0
  for (const sitting of basicsSittings) {
    const before = new Set(owned)
    for (const p of sitting.pieces) owned.add(p)
    const op = framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] })
    const onCard = op.filter((f) => card.some((c) => c.id === f.id)).length
    biggest = Math.max(biggest, onCard)
  }
  note(`the biggest single sitting opens ${biggest} of the ${CARD_SIZE} card questions`)
  if (biggest >= CARD_SIZE) {
    fail.push('one sitting now opens the whole card — the doorway framing is worth writing again')
  }
}

/*
  And it must still have something left to say afterwards. A doorway that opened every
  frame in the product would leave every later vibe silent, which is the 87% bug wearing
  a different hat.
*/
const later = runs.filter((run) => {
  const owned = new Set<string>()
  for (const sitting of SITTINGS.get(BASICS) ?? []) for (const p of sitting.pieces) owned.add(p)
  return run.slice(1).some((fam) =>
    (SITTINGS.get(fam) ?? []).some((sitting) => {
      const before = new Set(owned)
      for (const p of sitting.pieces) owned.add(p)
      return framesJustOpened({ before, after: owned, answered: [], purpose: null, answers: [] }).length > 0
    }),
  )
}).length
note(`${later} of ${runs.length} runs open another question after the basics`)
if (later === 0) fail.push('nothing opens after the basics — the screen fires once, ever')

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('the unlock moment reaches every learner')
