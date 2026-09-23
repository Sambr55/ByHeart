# Two systems, and where they got tangled

Sam: *"we are in a total mess here… I feel we need separate systems for how we get to the
Legend and how we run the Club. Getting to the Legend is essentially an information
gathering exercise wrapped in learning. The Club is about learning and levelling up."*

This is the map before the replan. Everything below is measured against the tree as it
stands, not remembered.

---

## 1. What is actually there

### Five progress systems, running at once

| System | Unit | Where it shows | What it gates |
|---|---|---|---|
| **Rungs** (1–6) | proof lines released | nothing names it to the learner | which roots a vibe may serve |
| **Doorway** | roots of the basics | "3 of 4 basics sessions" | half the Legend |
| **Chosen vibes** | distinct families finished | "then your vibes" | the other half |
| **Stages** (5) | words owned | the WHERE IT GOES intro card | nothing |
| **Words / progress** | weighted points | Yours | the 800-word line |

Three of these five are visible on a single screen mid-lesson, in three different units,
and none of them is the other's fraction. That is the mess, stated as a table.

### The measurement that matters most

**The basics teach the entire Legend card — every word, for all three purposes.**

```
words a card needs that the basics do NOT teach:
  visiting  (none)
  staying   (none)
  moving    (none)
```

So the three chosen vibes are a *toll*, not a contribution. A learner finishes the basics
holding everything their card needs and is then asked for three more vibes before the
card will open. That is why the bar could honestly read 10 of 10 while the door stayed
shut: the bar measured the card's vocabulary, which was complete, and the door measured
something else entirely.

It also means Sam's *"send them back to find vibes that will fill in the blanks"* has no
blanks to send anybody to. The idea is right and the content does not currently support
it.

### Rungs do nothing on the way to the Legend

```
basics roots by rung: { "1": 20 }        all twenty are rung 1
rung with no proof  : 1
```

The ladder cannot gate a vibe whose roots are all at the bottom of it. And where it
*would* bite — the forced warm-up — it is already bypassed:

```
top_gun at rung 1 serves: tg_goose(r2) tg_school(r2) tg_need(r2)
```

`sectionRoots` falls back to the lowest-rung roots when nothing qualifies, so a rung-1
learner is served rung-2 Top Gun anyway. The ladder is inert before the Legend and is
quietly overridden at the one point it would apply. Sam: *"I can't see the need for rungs
or other complications to get to the Legend."* The measurement agrees.

### What one door is made of today

`legendUnlocked` is two clauses, but reaching it crosses:

`rungReached` → `sectionRoots` (freebie rank, blocking-ask rank, doorway rank, early rank,
signature rank, rung sort, screen budget, skip-on-overflow) → `doorwayRoots(purpose)` →
`cardFor(purpose)` → `chosenVibesFinished` → `VIBES_FOR_LEGEND`.

Nine concepts to answer "can I build my card yet".

---

## 2. Why it kept going round

Every bug this week was one of three shapes, and all three come from the tangle rather
than from any single wrong line.

**a. Two numbers for one thing.** `--bar-h` and `--bar-room`; the progress bar and the
door; `doorwayRoots` and the card. Each pair was correct when written and drifted when one
half moved.

**b. A rule written as a list of members.** `onSand`, the header colour, `gatedByBasics`,
"only two roots carry `asks`". Each went stale the moment something was added beside the
single member.

**c. A fix aimed at the wrong element.** Three attempts at the "double height nav" — which
measured 67px the whole time. The gap was `.app-frame`'s padding, not the bar.

None of these is fixed by more care. They are fixed by there being fewer numbers.

---

## 3. The proposal

Sam's instinct, made concrete and with the parts that do not survive contact with the
content called out.

### Split the two systems properly

**THE ROAD IN — information gathering wrapped in learning.**
One system, one number, no ladder.

- A fixed, authored sequence: **warm-up → basics → your Legend.**
- It is a *list of steps*, not a computation. The step list is content, so it can be
  read, counted and shown without deriving anything.
- Rungs do not apply. Nothing is gated; the sequence IS the gate.
- Every step either teaches a card word or asks a profile question. That is the whole
  admission criterion for being in this list, and it makes the road self-justifying.
- The Legend opens when the list is done. One condition, one number, and the bar is
  literally "step N of M" — it cannot contradict the door because it *is* the door.

**THE CLUB — learning and levelling up.**
Everything currently in `legend.ts` about stages, words, progress weights and free
allowance stays, and becomes the Club's business alone. Rungs live here, where there is
genuinely content of varying difficulty to gate. Vibes are chosen for pleasure, not as a
toll.

### On the three vibes

Drop them from the door. The measurement is unambiguous: they contribute nothing to the
card, so requiring them is asking for payment in a currency the card does not accept.

Keep the **warm-up**, which earns its place — it is how somebody learns what DUB *is*
before being asked for anything.

### On "send them back to fill the blanks"

Right idea, and it needs content before it can be real. Two honest options:

1. **Make the deeper frames the blanks.** `age`, `into`, `children`, `who_with` are
   already authored, already off the seven-card set, and genuinely need words from
   elsewhere. The Legend opens on the seven; the deeper questions are what vibes fill in.
   No new content required — this works today.
2. **Move a card frame's vocabulary out of the basics**, so one of the seven genuinely
   needs a vibe. This is authoring work and should not be done to justify a mechanic.

Option 1 first, because it is true now.

### What this deletes

- `VIBES_FOR_LEGEND`, `chosenVibesFinished` — the toll
- `earlyRoots` vs `doorwayRoots` — two sets for one ordering question
- The doorway/early/signature rank stack inside `sectionRoots`, for the basics at least:
  an authored sequence needs no sort
- `rungReached` from the pre-Legend path entirely

### What it keeps

- `personalise`, `myName`, `myAge` — the information-gathering machinery, which is the
  good part and is working
- The whole Club: stages, words, drops, sheets, idioms, allowance
- `Missing` and its GO GET IT button, which becomes the mechanism for option 1

---

## 4. The one thing to decide first

Whether the road in is an **authored list** or a **derived set**.

Everything else follows from it. Derived is what exists now and is where every
contradiction came from — three functions deriving three numbers from overlapping
inputs. Authored means a human writes the steps in order, and the product's job is to walk
them and show the position.

Authored is slower to change and impossible to contradict. Given the week, that trade
looks right.
