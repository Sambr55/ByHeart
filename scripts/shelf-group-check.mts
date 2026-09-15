/**
 * A vibe you have sat through is filed with the ones you have sat through.
 *
 *   npm run shelf:group
 *
 * Sam, from a phone with six sessions behind him: "why do I see the basics plus four
 * vibes as session done and then scrolling down on the same screen sees Marcus and Audrey
 * under opens as you go with a status as done for now?"
 *
 * Both statements were true of the same vibe and the shelf made them look like different
 * states. `waiting` — started, with nothing left at this learner's rung — decided the
 * GROUP, and it was asked before anything asked whether a session had been completed. The
 * ladder does the rest: Audrey has 2 roots at rung 2 of 6, Marcus 2 of 9, so ONE session
 * exhausts what is servable and both fell off the top of the shelf into a heading that
 * means "not yet".
 *
 * The badge still says `done for now`, because that is the honest word for "there is more
 * in here, later". What changed is that the heading no longer contradicts it.
 *
 * This is a pure-logic check of the grouping rule — the same `facts` shape the shelf
 * builds — so it runs without a browser and cannot be fooled by a seed.
 */
import { readFileSync } from 'node:fs'
import { ROOTS_BY_FAMILY, CRATES, entryRung, type CultureFamily, type Rung } from '../content/roots'

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

type Group = 'drops' | 'later' | 'pro' | 'done' | 'open'

/*
  RESTATED HERE, AND TIED TO THE SOURCE.

  This is a copy of the shelf's rule rather than an import — the real one is a ternary
  inside a closure in a 4000-line component, not an exported function. A copy can drift
  from what it claims to guard, which is the failure mode that makes a green check
  worthless, so the source is read below and the two are required to agree on the one
  clause that matters.
*/
function groupFor(opts: {
  drop: boolean
  unreached: boolean
  waiting: boolean
  sessionDone: boolean
  planLocked: boolean
  finished: boolean
}): Group {
  return opts.drop
    ? 'drops'
    : (opts.unreached || opts.waiting) && !opts.sessionDone
      ? 'later'
      : opts.planLocked
        ? 'pro'
        : opts.finished
          ? 'done'
          : 'open'
}

/*
  THE INVARIANT: completing a session must never file a vibe under "not yet".

  Exercised across every rung and both waiting states, because the bug was a combination —
  sat through AND out of reachable roots — and only that combination produced it.
*/
for (const waiting of [true, false]) {
  for (const unreached of [true, false]) {
    const g = groupFor({
      drop: false,
      unreached,
      waiting,
      sessionDone: true,
      planLocked: false,
      finished: false,
    })
    if (g === 'later') {
      fail.push(
        `a vibe with a completed session is filed under "opens as you go" ` +
          `(waiting=${waiting}, unreached=${unreached})`,
      )
    }
  }
}

/*
  AND THE RULE STILL BITES where it should: a vibe nobody has sat through, with nothing
  reachable in it, genuinely belongs under "opens as you go". Without this the check
  passes on a shelf that has simply stopped grouping anything.
*/
if (groupFor({ drop: false, unreached: true, waiting: false, sessionDone: false, planLocked: false, finished: false }) !== 'later') {
  fail.push('an unreached vibe is no longer filed under "opens as you go"')
}
if (groupFor({ drop: false, unreached: false, waiting: true, sessionDone: false, planLocked: false, finished: false }) !== 'later') {
  fail.push('a started-but-exhausted vibe nobody finished is no longer filed under "opens as you go"')
}

/*
  THE COPY ABOVE MUST STILL BE THE SHELF'S RULE.

  Asserted by reading the component: the grouping ternary has to carry the sessionDone
  guard. If somebody removes it, this check keeps passing its own logic while the product
  regresses — so the text is checked, crudely and on purpose.
*/
{
  const src = readFileSync('components/Journey.tsx', 'utf8')
  if (!/\(unreached \|\| waiting\) && !sessionDone/.test(src)) {
    fail.push(
      'the shelf no longer guards its grouping on sessionDone — this check is now testing only itself',
    )
  }
}

/*
  THE CONTENT FACT THAT CAUSED IT, reported so it stays visible: how many vibes one
  session can exhaust. A vibe with very few roots at the entry rung will always land in
  this state, and that is worth knowing when authoring rather than discovering on a phone.
*/
const thin: string[] = []
for (const c of CRATES) {
  if (c.drop) continue
  const all = ROOTS_BY_FAMILY[c.id as CultureFamily] ?? []
  const at = entryRung(c)
  const servable = all.filter((r) => r.rung <= ((at + 1) as Rung)).length
  if (servable > 0 && servable <= 3) thin.push(`${c.id} (${servable} of ${all.length})`)
}
note(`${CRATES.length} vibes · ${thin.length} can be exhausted by one session near their entry rung`)
if (thin.length) note('  ' + thin.join(', '))

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('what you have sat through is filed with what you have sat through')
