/**
 * A vibe opens on the thing it is famous for.
 *
 *   npm run signature
 *
 * Sam, on a phone: "for James Bond Titles there are no longer any actual titles — only
 * chamos-te and James Bond, from London. English."
 *
 * The vibe holds six titles. A first sitting served "My name is… James Bond." and "Bond.
 * James Bond. English." — both rung 1, both Bond, neither a title — because after the
 * freebie the sort fell back to rung, and *From Russia with Love* is ALSO rung 1 and
 * simply lost to whichever root was authored first.
 *
 * A vibe serves 2-4 roots of 6-16, so roughly 20% of itself. Which 20% is therefore the
 * whole of what the vibe IS to somebody meeting it, and it has to be the 20% the tile
 * promises.
 */
import { ROOTS, CRATES, type CultureFamily, type Root } from '../content/roots'
import { sectionRoots } from '../engine/journey'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

const dominant = (roots: Root[]): Root['root_type'] | null => {
  const counts = new Map<Root['root_type'], number>()
  for (const r of roots) counts.set(r.root_type, (counts.get(r.root_type) ?? 0) + 1)
  let best: Root['root_type'] | null = null
  let top = 0
  for (const [kind, n] of counts) if (n > top) { top = n; best = kind }
  return best
}

for (const c of CRATES) {
  const all = ROOTS.filter((r) => r.culture_family === c.id)
  if (!all.length) continue
  /*
    THE DECLARED SIGNATURE WINS over the measured one.

    dominant() answers "what is this crate mostly made of", which is a fact about the
    content. `signature` answers "what does the tile promise", which is the thing a
    learner is actually owed — and using the measurement as the target makes the check
    circular: content that drifts drags the expectation along with it, so the crate always
    opens on whatever it happens to be full of. Reading the declaration instead means a
    crate that quietly fills up with something else FAILS, which is the point.
  */
  const kind = c.signature ?? dominant(all)
  const served = sectionRoots(c.id as CultureFamily, 2, [])
  if (!served.length) { note(`${c.id}: nothing served at rung 2`); continue }

  /*
    THE FREEBIE IS EXEMPT. It is the ten-second wink the vibe chose for itself and leads
    outright — "Royale with Cheese" is a quote in a quote-vibe, but "My name is… James
    Bond" is a quote in a TITLE-vibe and is still the right thing to open on. What must not
    happen is a sitting that is ENTIRELY off-signature.
  */
  const rest = served.filter((r) => !r.freebie_flag)
  const onKind = rest.filter((r) => r.root_type === kind).length
  const share = all.filter((r) => r.root_type === kind).length / all.length

  note(
    `${String(c.id).padEnd(21)} ${String(kind).padEnd(19)} ` +
      `${onKind}/${rest.length} of the sitting, ${Math.round(share * 100)}% of the vibe`,
  )

  /*
    Only asserted where the vibe genuinely IS mostly one thing. A vibe split evenly across
    kinds has no signature to honour, and demanding one would be inventing a promise its
    content does not make.

    AND ONLY WHERE THE TILE MAKES THE PROMISE IN THE FIRST PLACE. the_basics is 60% title
    by root_type and that number means nothing: tb_1234, tb_six_seven and tb_saturday are
    counting and days of the week, filed under `title` because the line they hang on came
    from a song. The crate says so itself — "named for what it teaches, not for where it
    comes from". This check measures where roots COME FROM, which is the one thing that
    crate deliberately does not promise, so asserting it here invents a promise and then
    fails the content for keeping a different one.

    Every other crate on the shelf is named for its source — Top Gun, Bond, Duran Duran —
    and for those the source IS the promise, which is what this check is for. Keyed off
    `signature`, so a crate opts in by declaring what it is famous for rather than by not
    appearing in a list somebody has to remember to update.
  */
  if (!c.signature) { note(`${String(c.id).padEnd(21)} — named for what it teaches; no source to honour`); continue }

  /*
    NO SHARE THRESHOLD ONCE A CRATE HAS DECLARED ITSELF.

    The old guard — assert only where the crate is already ≥60% one kind — belonged to the
    version that measured the signature instead of reading it, where it stopped the check
    inventing a promise nobody made. Kept alongside a declaration it becomes an escape
    hatch that swallows exactly the failure this is for: a crate whose content drifts away
    from its tile drops below the threshold and stops being checked at the moment it
    starts being wrong. Declaring a signature IS the opt-in; there is nothing left to
    guard against.
  */
  if (rest.length > 0 && onKind === 0) {
    fail.push(
      `${c.id} promises ${kind} and its first sitting serves none — ` +
        `the tile says one thing and the session delivers another ` +
        `(${Math.round(share * 100)}% of the crate is ${kind})`,
    )
  }
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('every vibe opens on what it is famous for')
