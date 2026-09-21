# The promises

> **This file is Sam's. Claude enforces it and does not add to it.**
>
> Every promise here is measured by `npm run promises`. If the product stops keeping one,
> the check fails and names it. If a promise is wrong, change it here and the check follows.

## Why this exists

Ten spec documents describe DUB in prose. Nothing measured any of them, so the product
drifted from all ten and the drift was only ever found by a person on a phone — one
screenshot at a time, each fix blind to the next.

Sam: *"Unless we sort this out once and for all we are never going to ship as we will keep
going around coding loops."*

The loop breaks when the promises are written by the person who owns them and checked by
the machine. `engine/sim.ts` can already simulate a learner end to end in under a second,
so anything sayable about a learner's experience is measurable. The bottleneck is no longer
tooling — it is deciding what should be true.

## How to write one

A promise is one sentence about what a learner experiences. It must be **falsifiable** —
something that could be observed to be false.

| Good | Why |
|---|---|
| "Finishing the doorway opens the Legend." | A learner either ends with it open or does not. |
| "A vibe ends on lines from that vibe." | The three cold prompts either belong to it or do not. |
| "No learner can reach a state with nothing to do next." | Every path either has a next step or does not. |

| Not yet a promise | Why |
|---|---|
| "The product should feel coherent." | Nothing to measure. Split it into what coherence means here. |
| "Vibes should be fun." | True but not falsifiable. What would prove it false? |

Write it in plain English. Claude turns it into an assertion and reports back **exactly
what it measured**, so a promise that got enforced as something narrower than intended is
visible rather than silent.

Status values: `HOLDS` · `BROKEN` · `NOT YET ENFORCED` · `RETIRED`.

---

## P1 — The doorway plus three chosen vibes opens the Legend

A learner who plays the basics until there is nothing left has all seven card questions
answerable. The Legend opens once they have also finished three vibes they chose for
themselves.

**Status: HOLDS.** Measured: 16 roots over 6 sittings gives card 7/7; the door opens on
the third finished vibe.

*Decided 2026-09-15, after five vibes gave 3 of 7 and the Legend opened anyway. Changed
2026-09-21: the basics are compulsory, so opening the Legend on them alone asked nothing
of the learner but compliance. Sam: "Basics are essentially the first vibe and compulsory
— to which the user then adds a number of vibes in order to open the Legend."*

## P2 — The road in is impossible to miss

At every moment before the Legend opens, the screen a learner is on says what to do next
and how far away it is.

**Status: BROKEN.** Measured: a learner who plays one sitting of each of the twelve vibes
ends with 29 roots played, card 2/7, and the Legend shut — while the shelf reads
SESSION DONE on the basics with 13 of its 16 roots unplayed. Nothing on that screen
mentions the doorway.

*This is the bug Sam hit twice, and a third time on 2026-09-21: "I have just done
multiple vibes but the legend isn't opening." The door now has two halves and
`legendStatus` carries both as numbers rather than one boolean, so a screen can say which
half somebody is on — NotYet.tsx does. The remaining half of this promise is the shelf,
which still says SESSION DONE without saying what is left.*

## P3 — A vibe ends on its own lines

The three cold prompts that close a sitting come from the vibe that was just played.

**Status: BROKEN.** Measured: *Olá, bom dia* closes 6 of 12 vibes, *Muito obrigado* 6 of
12, *Desculpe, com licença* 5 of 12. The pool holds 20 prompts against 12 vibes × 3 per
sitting, so it exhausts and vibes share leftovers.

*Sam: "all vibes have an ordering coffee question — seemingly random."*

## P4 — A vibe opens on what it is famous for

The first sitting of a vibe serves the kind of thing its tile promises.

**Status: HOLDS.** Measured per vibe by `npm run signature`; james_bond now opens on
*From Russia with Love* and *Bond. 007.* rather than on two Bond quotes.

## P5 — No path strands a learner

There is no sequence of choices after which a learner can neither progress nor be told why.

**Status: NOT YET ENFORCED.** Partly covered — `npm run doorway` proves the door closes
from every rung. What is not covered is the general case across all paths.

---

## Promises still to be written

The ones above are only those already decided in conversation. **Sam writes the rest.**
Candidates worth a decision, each measurable today:

- **What a session is worth.** A sitting is 2–3 roots of a vibe's 6–16. Is that the right
  size, and should a learner be told how much of a vibe is left?
- **What the free tier delivers.** Five vibes, and the Legend before any ask. Is the
  promise "a complete Legend, free" — and should the audit prove it holds on every path?
- **Where the deeper Legend questions come from.** Four sit above the card, fed by Bridget
  Jones, Duran Duran, Marcus Aurelius and Pulp Fiction. Is that the intended map, or should
  each vibe own a question deliberately?
- **The city part.** Zero questions built, and Club rooms cannot teach words — so nothing
  can currently feed it. Is it in scope, and if so what changes?
- **What "done" means on a tile.** Today SESSION DONE means one sitting, and a vibe can
  read done with most of it unplayed.
