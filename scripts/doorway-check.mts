/**
 * The door can always be reached, from wherever the learner is standing.
 *
 *   npm run doorway
 *
 * The Legend opens when the doorway is finished — the roots of the basics that carry card
 * vocabulary. That replaced "five vibes visited", which counted turning up while the card
 * needed ten specific words: measured on a real run, five vibes gave 23 pieces and 3 of 7
 * questions, and Sam hit exactly that.
 *
 * THE FAILURE THIS GUARDS is the one the new gate introduced and nearly shipped with. The
 * door depends on `tb_why` ("Why Do Fools Fall in Love"), the ONLY root in the product
 * that teaches `porque`, and it is rung 2. `sectionRoots` will not serve a rung-2 root to
 * a rung-1 learner — so a learner who never releases anything can play every other line in
 * the basics and never open their Legend. Measured: 15 roots, 29 pieces, door shut.
 *
 * In practice a release in the first sitting puts anybody at rung 2, so the trap is narrow.
 * It is also exactly the shape of the five-vibe trap: a promise that is satisfiable in
 * theory and unreachable for somebody standing in the wrong place. So it is measured
 * rather than reasoned about.
 */
import { doorwayRoots, legendUnlocked, LEGEND_CARD } from '../content/legend'
import { ROOTS, type CultureFamily, type Rung } from '../content/roots'
import { sectionRoots } from '../engine/journey'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

const doorway = doorwayRoots().map((r) => r.root_id)
const full = ROOTS.filter((r) => doorway.includes(r.root_id))
const fam = (full[0]?.culture_family ?? 'the_basics') as CultureFamily

note(`the doorway is ${doorway.length} roots of ${ROOTS.filter((r) => r.culture_family === fam).length} in ${fam}`)
note(`  ${full.map((r) => r.root_id + '(r' + r.rung + ')').join(' ')}`)

/*
  IT MUST BE WALKABLE AT EVERY RUNG A LEARNER CAN BE STUCK AT.

  Played the way the product actually serves — sectionRoots, sitting after sitting, at a
  fixed rung — the door has to close. If it cannot at some rung, a learner standing there
  is in a dead end with no signal, which is the whole class of bug this replaces.
*/
/*
  FROM THE LOWEST RUNG THE DOORWAY ITSELF REQUIRES, not from rung 1 unconditionally.

  `tb_why` is rung 2 and teaches `porque`, which `why_here` — "Porque {reason}" — genuinely
  needs. The content is right: the root teaches an accent distinction (porquê asks, porque
  answers) and is not a first line. So the door legitimately sits at rung 2.

  That is only safe because rung 2 costs one release — `rungReached` returns top + 1, so
  the first line anybody says cold puts them there, and the release beat is in every
  sitting. The check therefore starts at the doorway's own floor and asserts that floor is
  reachable, rather than demanding the impossible at rung 1 and being weakened later.
*/
const floor = Math.max(...full.map((r) => r.rung))
note(`the doorway needs rung ${floor}, which one release reaches`)
if (floor > 2) {
  fail.push(
    `the doorway needs rung ${floor} — that is more than one release away, so a learner ` +
      'can sit below the door with nothing telling them how to climb',
  )
}

for (const rung of [floor, 3, 4, 5, 6] as const) {
  const played: string[] = []
  let guard = 0
  while (guard++ < 40) {
    const serve = sectionRoots(fam, rung as Rung, played)
    const fresh = serve.filter((r) => !played.includes(r.root_id))
    if (!fresh.length) break
    for (const r of fresh) played.push(r.root_id)
    if (legendUnlocked(played)) break
  }
  const open = legendUnlocked(played)
  note(`  rung ${rung}: ${open ? 'the door closes' : 'DEAD END'} after ${played.length} roots`)
  if (!open) {
    const short = doorway.filter((id) => !played.includes(id))
    fail.push(
      `a learner at rung ${rung} can never open their Legend — ` +
        `${short.join(', ')} ${short.length === 1 ? 'is' : 'are'} never served`,
    )
  }
}

/*
  AND FINISHING IT MUST ACTUALLY DELIVER THE CARD. The door is only honest if walking
  through it leaves every card question answerable — otherwise it opens onto the same
  half-built Legend Sam reported.
*/
const owned = new Set(full.flatMap((r) => r.extracts.map((e) => e.id)))
const short = LEGEND_CARD.filter((f) => !f.built_from.every((p) => owned.has(p)))
if (short.length) {
  fail.push(
    `finishing the doorway leaves ${short.length} card question(s) unanswerable: ` +
      short.map((f) => f.id).join(', '),
  )
} else {
  note(`finishing it answers all ${LEGEND_CARD.length} card questions`)
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('the door can be reached from anywhere, and opening it delivers the card')
