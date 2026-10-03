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

**Status: SUPERSEDED 2026-10-03.** The door no longer counts vibes and the basics no
longer carry the road. Replaced by P1a below.

*Decided 2026-09-15, after five vibes gave 3 of 7 and the Legend opened anyway. Changed
2026-09-21: the basics are compulsory, so opening the Legend on them alone asked nothing
of the learner but compliance. Sam: "Basics are essentially the first vibe and compulsory
— to which the user then adds a number of vibes in order to open the Legend."*

## P1a — The road is vibes, one recognisable line per Legend question

Each of the seven card questions is taught, asked and answered by a step on an authored
road, and seven of those steps are a film, a band or a person. The Legend opens when the
road is walked — there is no separate vibe toll, because the road IS vibes.

**Status: HOLDS.** Measured by `npm run vibes:legend`: every card frame has a road step
that asks it, every piece it is built from has a source outside the basics, and each
Legend-reaching release matches the sentence its frame builds.

*Decided 2026-10-03. Sam, on the claim the product had been making: "We claim a user
builds their legend out of vibes, but actually they do one warm up vibe and then it's all
from basics." Five of seven questions already could come from a cherry-picked vibe root;
two could not, and `anos` could only come from Bridget — which forced one crate to carry
two road steps and broke P4 for it. Sam: "Remember we can build a new vibe if we need it -
dont force it." Hence bowie_golden_years, and the Audrey merge, so every crate carries
exactly one step.*

*Two basics steps remain and neither is a card question: the opening wink (olá/adeus, so
the first screen is something you can already say) and obrigado/obrigada, because gender
has to settle before anything gendered is drawn and no vibe settles it.*

## P2 — The road in is impossible to miss

At every moment before the Legend opens, the screen a learner is on says what to do next
and how far away it is.

**Status: BROKEN.** Measured: a learner who plays one sitting of each of the twelve vibes
ends with 29 roots played, card 2/7, and the Legend shut — while the shelf reads
SESSION DONE on the basics with 13 of its 16 roots unplayed. Nothing on that screen
mentions the doorway.

*This is the bug Sam hit twice, and a third time on 2026-09-21: "I have just done
multiple vibes but the legend isn't opening."*

*The SCREENS half is done. `legendStatus` carries both halves of the door as numbers
rather than one boolean, and the three screens that matter all say where somebody stands,
from the same call: the shelf under its headline ("Finish one more vibe and your Legend
opens"), the Club door, and the payoff panel at the end of a vibe. Measured across five
states, the shelf reads 6-lines / 3-vibes / 2-vibes / one-more / silent-when-open.*

*The OUTCOME half is still BROKEN, and the check below still says so — but the shape of
the failure has changed and is worth stating precisely.*

*What was wrong on 2026-09-21: the door counted vibes FINISHED, and finishing a vibe means
playing every root in it. The basics hold 16 and a sitting serves about four, so "basics +
3 vibes" cost roughly ELEVEN sittings. Sam did five, watched five SESSION DONE badges
appear, and the door had not moved: "why are we so disconnected here." Worse, the six
doorway roots sat at positions 3, 5, 6, 7, 10 and 16, and the last was rung 2 — so a
rung-1 learner could not open it at all.*

*Three changes: the door counts SITTINGS, which is the number SESSION DONE is already
claiming; the doorway roots are front-loaded inside the basics; and tb_why is rung 1,
because `porque` is a rung-1 word and it was the accent nuance that was advanced.
Measured: a learner doing the obvious thing — three sittings of the basics, then one vibe
they chose — opens the Legend on sitting FOUR.*

*What is still broken is the thin-spread case the check models: one sitting of each of the
twelve vibes finishes the basics no faster, so that learner still ends without a Legend.
It is better than it was (4 doorway roots short rather than 5, card 3/7 rather than 2/7)
and it is not fixed. That is a content-shape problem rather than a screen one.*

## P3 — A vibe ends on its own lines

The three cold prompts that close a sitting come from the vibe that was just played.

**Status: BROKEN.** Measured: *Olá, bom dia* closes 6 of 12 vibes, *Muito obrigado* 6 of
12, *Desculpe, com licença* 5 of 12. The pool holds 20 prompts against 12 vibes × 3 per
sitting, so it exhausts and vibes share leftovers.

*Sam: "all vibes have an ordering coffee question — seemingly random."*

## P4 — A vibe opens on what it is famous for

The first sitting of a vibe serves the kind of thing its tile promises.

**Status: HOLDS, with one named content gap.** Measured per vibe by `npm run signature`;
james_bond opens on *From Russia with Love* and *Bond. 007.* rather than on two Bond
quotes.

*audrey_hepburn cannot satisfy this by any route and never could: its banger
(`ah_paris` — "Paris is always a good idea.") is authored at rung 4 and the crate has NO
rung-1 roots at all, so a beginner has never opened on it. Measured against main before
the vibe road existed, so this is a pre-existing authoring gap rather than a regression.
The fix is content — a rung-1 Audrey root worth opening on, or moving ah_paris down — and
`npm run first` reports it rather than failing, because failing would assert the opposite
of what the road is for. See the note in scripts/first-session.mts.*

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
