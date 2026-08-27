# DUB — Derived cards, and grammar without a grammar table

> The third supply. Not written by us and not written by members: **assembled from what a
> member already owns.** Supply proportional to how much somebody has learned, which is the
> right shape — the further in you are, the more there is to practise.
>
> Companion to [spec-club-first.md](spec-club-first.md) §03, which is where the Club runs
> out of cards. This is what stops it.

## 00 The Duolingo problem, diagnosed

"It must have told me a thousand times what coffee with sugar is."

The failure there is not repetition. Learning is repetition and there is no way round it.
The failure is that **the same item comes back inside the same frame** — one card, shown
again, asking for recognition it already had. Nothing new is demanded, so nothing new is
learned, and the learner is correct to feel that their time was taken.

Which gives the whole principle:

> **Repeat the piece. Never repeat the card.**

A piece can come back twenty times. A *card* is used once, ever. Every encounter is a new
use: a different sentence, a different person spoken to, a different counter to say it at.

That is the same rule spec-club-first §03 already arrived at from the other direction — a
card is spent when it is performed and leaves the feed. The two specs agree, and derived
cards are what refills the room behind them.

---

## 01 What already exists

More than expected. Counted from the live content, not from memory:

| | |
|---|---|
| Pieces | **177** |
| Pieces carrying a `lemma` | **60** |
| Distinct lemmas | **39** |
| Lemmas where 2+ forms are already known | **15** — `ser` has five, `estar` four, `poder` three |
| Hand-authored collisions | **68** |

The morphology spine is already in the model and was built for exactly this reason. From
`content/roots.ts`:

> `lemma` — *"the single biggest cause of the library reading as random: tenho and tens
> were unrelated rows, stages apart, rather than one word."*

So `sou`, `és`, `é`, `somos` are already known to be one verb wearing four faces. And
`COLLISIONS` is a derived card shape that has been hand-made sixty-eight times — which
means the template is not a guess, it is a pattern with sixty-eight worked examples to
generalise from.

The "because you learned…" framing exists too: vocab cards already carry a `because`.

**What is missing is one thing, and it is a data problem rather than a code problem.** DUB
knows which forms a member has *met*. It does not know which forms *exist*. To say "you
know `sou`, here is `és`" the paradigm has to be in the repo as verified data.

---

## 02 The one non-negotiable

Generated content is the single biggest threat to the promise this product is built on.
"European Portuguese, always" — `comboio` not `trem`, `dezasseis` not `dezesseis`, `estás`
not `você está`. An LLM asked for a Portuguese sentence will produce Brazilian forms
confidently, at scale, and in a register no gate currently reads.

So:

> **A derived card assembles. It never invents. Every Portuguese word it shows already
> exists in the repo, authored and native-reviewed. If it is not in the table, there is no
> card.**

That splits the job in a way that makes it safe:

| | who does it | checkable? |
|---|---|---|
| What the Portuguese *is* | authored data, native-reviewed once | yes — `npm run lint:content` already reads exactly this |
| Which frame it goes in | authored templates | yes |
| *Which* combination is worth showing this person today | selection logic, and optionally a model | it cannot get the language wrong, because it only picks |

A model may choose. It may not speak. That single line is the difference between infinite
supply you can trust and infinite supply that quietly teaches the wrong language.

---

## 03 The card families

Six templates. Each takes pieces a member owns and produces work they have not done.

### 1. Collision — two worlds, one sentence
Already built, 68 examples. A piece from Bond finishing a sentence that started in Bridget
Jones. The moment unrelated memories start behaving like one language.

### 2. Extension of use — same words, new counter
> *Because you learned* **quanto custa** *at the market.* Same words, at the ticket office.

The cheapest family and the most immediately useful. It teaches nothing new and moves a
piece from "I know it" to "I use it", which is the gap the whole product is about.

### 3. The next person — this is the grammar one
> *You can say* **quero um café.** *Here is how you offer one:* **queres um café?**

A conjugation arrives as **a person you can now speak to**, never as a paradigm. See §04.

### 4. The near miss — the pt-PT trap
> *You have been saying* **obrigado.** *If you are a woman, it is* **obrigada** — *it agrees
> with you, not with them.*

Small, specific, culturally loaded, and exactly the class of thing generic apps get wrong.
`Extract` already carries `gender` and forms like `inglês` / `inglesa` are already in there.

### 5. Cold recall, relocated
The release beat, moved. Same demand — say it with nothing on screen — in a situation the
member has not seen. This is the only family that writes to `proof`.

### 6. The city frame
An owned piece, placed in a Lisbon situation. Where derived cards join the Club rather than
sitting beside it, and where "local cultural relevance" actually lives: the piece is theirs,
the counter is real, the card is new.

---

## 04 Grammar, without a grammar table

DUB has been deliberately light on grammar and should stay that way. But "I want" without
"do you want?" is a person who can order and cannot offer, and that ceiling arrives quickly.

**Never teach the paradigm. Teach one person at a time, in the order life demands them.**

| order | person | why it comes when it does |
|---|---|---|
| 1 | **eu** — I | you arrive needing things |
| 2 | **tu** — you | offering, asking, including somebody |
| 3 | **ele / ela** | talking *about* somebody — the first sentence with three people in it |
| 4 | **nós** — we | making a plan, which is the invitation card in a Drop |
| 5 | **eles** | last, and rarely needed to *say* |

The second person is the interesting one, and it is not a grammar point in Lisbon — it is a
social judgement. **tu** or **você** is a decision about closeness that a learner has to
make out loud, at a counter, about a stranger. That is DUB's kind of material: teaching the
second person *is* teaching a piece of culture, and it is why this ladder does not read as a
conjugation drill.

Tense goes the same way, and the first step is a dodge that happens to be how people
actually speak:

1. **present** — everything so far
2. **near future** = `vou` + infinitive. Not a tense at all: one owned piece plus a verb you
   already have. It postpones the entire future tense and is what a person in a bar says.
3. **past** — `foi`, `era`, and the fact that Portuguese has two of them, met one at a time
   through use rather than as a distinction to learn

### What has to be authored

A **verified paradigm table**: for each lemma, the forms, each one native-reviewed. Roughly
39 lemmas exist in the content today; the high-frequency European Portuguese verb set is of
the order of 50–80. That is a **finite, one-time authoring job** — a week or so of a native
speaker's attention — and it is the thing that turns the whole of this spec from "generate
some sentences" into something that can be trusted to run unattended.

It is also the only part of this that cannot be skipped or approximated.

---

## 05 When a piece comes back

Spacing, kept deliberately crude.

A piece is **due** when it has not been used for a while, and the interval grows each time
it is used successfully. That is all. No ease factors, no scores, no strength percentages —
those are a scoring system, and DUB does not score.

Two rules that keep it DUB-shaped:

- **Due-ness picks the piece. The template picks the card.** The member never meets the same
  card twice, however often the piece returns. This is §00, mechanised.
- **The number of due pieces is never shown.** "27 cards due" is a debt, and a debt is
  precisely the feeling that makes people stop opening an app. The Club simply contains the
  right cards today. Nobody is told how far behind they are, because they are not behind.

---

## 06 How much supply this actually is

Worth being concrete rather than saying "infinite".

Supply is a function of what a member owns. Roughly, after three vibes somebody holds on the
order of 40 pieces. Collisions alone are pairs — around 780 combinations, of which the shelf
rules and rung constraints admit perhaps five to ten per cent, so **50–80 viable cards** from
one family. Add extensions, next-person, near-miss and city frames and it is comfortably
into the hundreds, against a demand of roughly 150 cards a year (spec-club-first §03).

So: **not infinite, and proportional to how much you have learned.** Which is the right
property, and a better one than infinite — somebody two vibes in gets a handful, somebody
eight vibes in has more than they can get through, and that ordering is exactly the
incentive the product wants.

### The trap: infinite supply is how this becomes a treadmill

"The Club never has to be empty" must not become "the Club is bottomless". A feed that
always has one more derived card is a grind wearing a friendly face — the Duolingo problem
rebuilt out of better parts.

So derived cards are **rationed on purpose**: a small number a day, arriving as reminders,
under the authored material rather than instead of it. The scarcity is what keeps them
feeling like the app noticing something about you.

Feed order, and it is a ranking of *urgency*, not of quality:

1. **Live drops** — they expire; nothing else on the screen does
2. **Standing rooms not yet done** — authored, finite, the best cards in the product
3. **Derived cards** — the floor, rationed, never the bulk of a session

---

## 07 What a derived card looks like

The framing does real work. `because` is not decoration — it is the card's provenance, and
it is what makes a generated card feel earned rather than randomly served.

```
BECAUSE YOU LEARNED

  quero um café
  from Pulp Fiction banger quotes, three weeks ago

  Here is how you offer one.

  "Queres um café?"
  Do you want a coffee?

  Same verb. You have been asking for things;
  this is the one you say to somebody else.

                                    SWIPE LEFT TO SAY IT
```

Rules for the copy:

- **Always name where the piece came from**, and when. It is true, it is specific, and it is
  the difference between "the app remembers me" and "the app is showing me a flashcard".
- **Never claim mastery on somebody's behalf.** Not "you've mastered *quero*" — nothing here
  scores, and a compliment the learner does not believe costs more than it gives.
- **One new thing per card.** A card that extends the person must not also change the tense.
- **The English is the ask, the Portuguese is the answer** — same shape as everything else.

---

## 07a What is built, and what it actually yields

Written after building it, because the estimate in §06 was optimistic and the honest number
is more useful than the hopeful one.

**Built:** the paradigm table (`content/paradigms.ts`), the generator (`engine/derive.ts`)
for families **1 (collision)**, **3 (next person)** and **4 (near miss)**, and derived cards
in the Club feed, rationed to three a session, ranked under the authored rooms and carrying
the photograph of the vibe the piece came from.

Family 1 turned out not to need generating at all. Sixty-eight collisions are already
authored, each declaring the two pieces it `requires`, each carrying a provenance line
somebody wrote by hand — *"A Beatles single and a Bridget Jones disaster, in one order."*
And the journey serves at most **one per session**, so a learner eight vibes in has unlocked
thirty and met a handful. That is not a generation problem, it is authored content that was
never being scheduled, and it is the highest-quality supply available at zero invention
risk. `requires` was built for exactly this.

**Two gates**, both in `npm run gate`:

- `npm run paradigms` — coverage, register, and the cross-check described in §01: all
  **60** forms the content already teaches agree with the table. Those were authored one at
  a time, in context, months apart, so sixty independent samples reproducing is a real check
  on the authoring rather than a rubber stamp.
- `npm run derive` — exhaustive rather than sampled, because the card set is small enough to
  enumerate: every card any learner could ever be shown is checked for an invented string, a
  repeat, a boast, a count, or a form they already own.

**The yield, measured:**

| owned | at first | after the backfill | with collisions |
|---|---|---|---|
| 1 vibe | 0 | 0 | **1** |
| 3 vibes | 3 | 3 | **10** |
| every piece in the product | 21 | 28 | **96** |

Ninety-six against a demand of roughly 150 a year, and the two families still unbuilt
(extension of use, the city frame) are the ones that reuse authored Situations. So supply is
no longer the thing standing in the way — the **native review** is.

### What the `lemma` backfill actually found

Most of the 117 pieces without a lemma correctly have none: numbers, days and fixed phrases
ARE their own lemma. Eight were real, and one group of them was not a supply problem at all.

`estou farto`, `Estou nervoso` and `não sou bom` already carried the feminine form — as
prose, in a `note`: *"A man saying it. A woman says estou nervosa."* True, useful, and
sitting somewhere nothing could generate from. **A woman using DUB was being taught to say
`estou farto` about herself, with the correction in small print underneath.** Structured as
an agreement paradigm it becomes a card that arrives when she needs it.

That is the general lesson for the backfill: the content mostly already knows this, in
sentences. The job is moving it somewhere a machine can act on.

**Bugs the gates caught that were live:** the ration took the top three of a sorted list,
and near misses sort first — so a learner with three outstanding near misses never saw a
collision at all. The ordering meant to help was crowding out the best cards in the feed. A
session is a round-robin across kinds now, and the check asserts that every kind with
something to offer is heard before any kind gets a second slot.

Also: a near-miss card offered `obrigada` to somebody
who already owned it, because `the_basics` teaches both genders as separate pieces — being
handed a word you have been using for a month is the most Duolingo-ish failure available
here. And the check for "one new thing per card" was matching any note containing a comma,
which every note does, so it was passing on nothing.

## 08 Build order

1. **The paradigm table.** Authored, native-reviewed, in the repo. Everything below is
   blocked on it, and nothing below is safe without it. Start with the ~39 lemmas already in
   the content.
2. **`lemma` and `form` backfill** — 60 of 177 pieces carry a lemma. The rest need auditing,
   which is a content job and also improves the vocab library on its own merits.
3. **Extension of use.** The cheapest family, no new language at all, and it proves the
   "because you learned…" frame in front of real people before anything harder is built.
4. **Collision generation**, generalised from the 68 hand-authored examples — which double as
   the test set: a generator that cannot reproduce them is not ready.
5. **Spacing** — due-ness, crude, no counts shown.
6. **The next person**, one person at a time, `tu` first and written as a social choice.
7. **Near miss** and **city frame**.
8. **Rationing and feed order**, measured against how many derived cards a session actually
   wants before it starts to feel like homework.

## 09 Gates this needs

In the spirit of the ones that already exist, because generation is precisely where content
rules rot silently:

- **`lint:content` runs on generated cards**, identically to authored ones. Generated cards
  are made of the same data, so this is nearly free and it is the whole safety story.
- **No card may show a Portuguese string absent from the repo.** Checkable exactly, and the
  single most important rule here.
- **No member ever sees the same card twice.** Assertable against `finished_cards`.
- **One new thing per card** — a card may extend the person or the tense, never both.
- **The 68 hand-authored collisions are the generator's test set.**
- **No count of what is due is rendered anywhere.**

## 10 Open

1. **How many derived cards a day?** Guess: three. It wants measuring, and it is the
   difference between a reminder and a treadmill.
2. **Does a derived card write to `proof`?** Only family 5 demands something cold, so only
   family 5 should count. The proof card has never counted anything but cold speech and it
   should not start.
3. **Does the member know a card was assembled rather than written?** Argument for: honesty,
   and this product says what it does. Argument against: it reads as an apology for a card
   that is doing its job. Leaning toward not saying so, provided the quality never makes the
   question occur to anybody.
4. **Who reviews the paradigm table**, and when does the pt-PT reviewer get hired? This is
   already the blocking dependency on the Situations and the Legend variants; it is now on
   the critical path for supply as well.
