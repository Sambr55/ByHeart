# The Legend's three parts — content brief

> Who you are, who you are with, where you are. The frames for the second and
> third, and the vocabulary a vibe would have to teach before they can be
> answered.

## Why this exists

The Legend is the spine. Its deck now renders three parts (`LEGEND_PARTS`,
`content/legend.ts`), but only one of them has content:

| Part | Questions today |
|---|---|
| About you | 10 |
| About them | 1 — `children` |
| About the city | 0 |

The structure is real and lopsided. This brief is the content that makes it
worth having.

## What a drop can and cannot do

**A drop cannot unlock a Legend question.** This was asked directly and the
answer is structural, not a matter of effort.

A `Drop` (`content/drops.ts`) carries `situations` — rooms — and never `roots`.
Only a root has `extracts`, and extracts are what create pieces. So a drop hands
somebody *a place to use what they have*; it cannot hand them a word. Measured:
the Duran Duran drop contains 6 findable pieces in its rooms and **none** of them
is a word the Legend needs.

That is the right shape and should not be changed. `duran_duran_lisboa` was a
drop and was deliberately converted to a permanent vibe because *"a band does not
expire"* — a Legend question whose words expire with a gig is a question a
learner could permanently lose.

**Vibes are where the dynamism lives, and that already works.** A vibe teaches
pieces; a frame's `built_from` names pieces; own them all and the question is
answerable. A new vibe automatically feeds whichever frames need its words, with
no authoring beyond the vibe itself.

## Naming

To a learner these are **vibes**. The word *crate* appears in no learner-facing
string — it survives only as an internal identifier (`CRATES`, `CultureFamily`).
This brief says vibes.

## The authoring rule

**A frame may name words DUB does not teach yet.** A frame that cannot be
answered is a content brief — *this question needs `moro`, and no vibe teaches
it* — which is more useful than restricting the Legend to accidental
recombination of the 177 pieces that happen to exist.

**But writing ahead is not shipping ahead**, and the distinction cost a frame to
learn. `lint-content` requires every `built_from` piece to exist, and it is right
to: a frame on a learner's deck naming a word nothing teaches is a question they
can never answer. So a frame written ahead of its vocabulary lives **here, in
this brief**, until a root teaches the words — see `they_do` below.

`parts-check` sits one step looser, and deliberately. It prints unteachable words
as a backlog rather than failing, and draws its own line at `VOUCHED` — the
reviewed-forms allowlist — so it can tell *not taught yet* from *not real*.

One caveat found the hard way: `VOUCHED` derives from the paradigm table, which
holds verbs and agreements. **A noun can never appear in it.** So a new noun
belongs in a pick option, where the lint already requires it to be taught or
glossed, rather than in `built_from`.

## About the city — "your life here"

Sam's brief: where you live, how you get about, your local, what you do at
weekends. Answerable by anybody in any city, and the answers are personal.

### The vocabulary gap, measured

Of 22 obvious words for this part, **DUB teaches 6**:

| have | `comboio` (wizardry) · `sábado` `domingo` (basics) · `trabalho` `onde` (top gun) · `como` (aurelius) |
|---|---|
| **missing** | `morar` (live) · `perto` `longe` · `casa` `apartamento` · `autocarro` `metro` `a pé` · `bairro` · `fim de semana` · `café` · `ir` `vir` |

`morar` — the single most necessary verb for "where do you live" — is taught
nowhere. About the city is genuinely a content brief, not a recombination job.

### Proposed frames

Each names the pieces it needs. **New** means no vibe teaches it yet.

**`lives` — Onde moras?** · *Where do you live?*
`Moro em {place}.` — I live in {place}.
Needs: `moro` **new**, `em` **new**. Slot: `place`, free text (a neighbourhood
is a proper noun and does not translate — same reasoning as `origin`'s town).

**`gets_about` — Como vens?** · *How do you get here?*
`Venho de {how}.` — I come by {how}.
Needs: `venho` **new**, `de`, and a pick list: `autocarro` **new**, `metro`
**new**, `comboio` ✓, `a pé` **new**, `carro` **new**.

**`local` — Qual é o teu café?** · *Which is your café?*
`O meu café é o {name}.` — My café is the {name}.
Needs: `o meu` ✓, `café` **new**, `é` ✓. Slot: `name`, free text.
*The most DUB-ish of the four — it assumes you have one, which is the point.*

**`weekend` — O que fazes ao fim de semana?** · *What do you do at weekends?*
`Ao fim de semana, {thing}.` — At weekends, {thing}.
Needs: `fim de semana` **new**, plus a pick list built from verbs DUB already
teaches where possible. Deliberately open (`open: 'surfing'`) so the translator
can fill what the list cannot — the same mechanism `work` uses.

### The vibe this implies

One new vibe carries most of it: **You and the city** — `morar`, `perto`,
`longe`, `autocarro`, `metro`, `a pé`, `bairro`, `café`, `fim de semana`.

**Its source is the city itself**, and that is settled. I stalled once asking
what "cultural hook" it needed, and the question was wrong: there is no hook
field on a vibe — only `id`, `title`, `blurb`, `tone` — and the swearing vibe
already hangs off no film at all. Its source is *"Portuguese television, with the
subtitles on"*. 27 of 96 roots are `root_type: 'other'`; a root that is not a
quote is the norm, not an exception.

So the roots are real Lisbon lines: *"Moro em Alfama"*, *"O 28 vai ao Chiado"*,
*"Fica perto do rio."* The recognition is the place, which is the strongest
possible source for the one part of a Legend that is about being somewhere.

**Named for the part it feeds**, breaking the `<property> <content type>` pattern
on purpose. A vibe named after what it unlocks is a better promise than one named
after where its lines came from.

### What it costs — found by trying

Declaring the vibe ahead of its roots does not work, and the shelf said so.

`built: false` **does not hide a tile.** The shelf rendered 13 and
`shelf-check` failed on a missing image — it asserts every picture actually
loads. There are exactly 12 images for 12 vibes.

So a new vibe needs, as one indivisible piece of work:

1. **An image** — `/public/vibes/you-and-the-city.jpg`, in the house style
   (an object or a street, Lisbon light, no text).
2. **Its roots** — 6–8, each a real line with `extracts`, `branches`,
   `transfer_prompt` and a `credit` in the "where you would hear it" register.
3. **The `CultureFamily` union, `ROOTS_BY_FAMILY` and `VIBE_IMAGES`** — the type
   system requires all three, which is the system working.

The declaration was written and backed out rather than shipped half-done. This
section is what it taught.

## About them — the people in your life

`children` is the seed. The part is about the people around you and the person
opposite you.

### What exists

Both flirting vibes and the 3 `person` situations already supply vocabulary for
the second half. `ele`/`ela`, `gosta`, `comigo`, `és` are all taught.

### Proposed frames

**`who_with` — Estás com alguém?** · *Are you with somebody?*
Pick: `Sou solteiro/a` ✓ · `Tenho namorado/a` (**new** `namorado`) ·
`Sou casado/a` ✓.
*Note it overlaps `married`, which is on the card. This one is the fuller
answer and is `depth: 'deeper'` so the card stays seven.*

**`they_do` — E ela, o que faz?** · *And her, what does she do?*
`Ela trabalha com {thing}.` — She works with {thing}.
Needs: `ela` **new**, `trabalha` **new**.

**Written, then parked — and the reason is the useful part.**

`trabalha` is the third person of `trabalho`, which the Legend already uses. The
paradigm knows it and both words are in `VOUCHED`, so they are real, reviewed
Portuguese. It looked like the cheapest frame in the brief.

But `lint-content` enforces the stricter rule — a frame's `built_from` must name
pieces that exist — and **it is right to.** A frame on a learner's deck that
names a word nothing teaches is a question they can never answer, whatever the
authoring intent behind it. The authoring rule permits writing ahead of the
vocabulary; it does not permit *shipping* ahead of it.

No root says either word, so there is nowhere honest to attach them. Teaching
them means authoring a root — which is the vibe work below, not a line in a
frame.

The frame is written and ready. It lands the day a vibe teaches `ela` and
`trabalha`, and that is one root, not a whole vibe:

> *"E ela? Trabalha com computadores."* — a person, a verb ending, and the
> question that follows "what do you do?" about ninety seconds later.

**This is the cheapest real content in the brief: one root unlocks one frame.**

**`how_met` — Como se conheceram?** · *How did you meet?*
Harder — it needs a past tense DUB does not teach. **Defer.** Named here so it
is a known gap rather than an oversight.

## Ordering

1. **`who_with`** — shipped. Sits above `married` rather than replacing it: the
   card frame is what a stranger opens with, and replacing one risks the seven.
2. **`they_do`** — written and parked. One root teaching `ela` and `trabalha`
   lands it.
3. **`local`** — one new noun.
4. **`lives`, `gets_about`, `weekend`** — need the new vibe.
5. **`how_met`** — deferred until there is a past tense.

## The five-vibe trap, and how it was fixed

Found while preparing for tester recruitment, and it would have wrecked the first
session for almost everybody.

**Every word the card needs was taught by exactly one vibe.** Five of them forced
three specific vibes. With a free allowance of five there were **792 ways to pick
five vibes and exactly one** that let a learner finish their card — so 791
choices opened the Legend and left it unfinishable. A learner picking by what
they like, which is the entire premise of vibes, would almost certainly pick
wrong.

`parts-check` had reported this as *"5 vibes needed, 5 free — zero slack"*. That
read as tight. It was broken: it only held if you picked the right five.

**Three things fixed it**, in increasing order of honesty:

1. `quero` second-sourced into `tb_why` — *"Porque quero."* was already that
   root's own branch and already in its helpers. It was taught in everything but
   name. **1 → 1 of 792.** Not enough alone.
2. `why_here` stopped naming `adoro` in `built_from`. The word appears in one of
   five options, so a learner picking any other never says it — yet it held the
   whole frame, and `adoro` is Audrey-only. **1 → 8 of 792.**
3. **Two new basics roots** — `tb_introduce` (*"Chamo-me Sam. Sou inglês."*) and
   `tb_married_work` (*"Sou casado. Trabalho."*). Five words that are your name,
   your nationality, whether you are married and what you do. They belong in the
   basics on their own merits; that they also untrap the card is the fix.
   **→ 100%.**

   Written first as ONE root with five extracts, and the lint refused it: a root
   teaches 1–3 pieces. It was right — five extracts is a vocabulary list, not a
   line somebody says. Splitting it is also truer to the conversation: you give
   your name, and then they ask what you do.

Every choice that includes the basics now finishes the card, and the basics is
the forced doorway (`gatedByBasics`, `components/Journey.tsx:1116`).

**A knock-on worth knowing.** `mine-check`'s count of basics lines using untaught
words went 5 → 7, and neither new entry was authored: both are *"E tu, como te
chamas?"*, a **James Bond** line that became reachable the moment `chamo_me` had
a home in the basics. `linesFor` gathers every line showing a piece across the
whole graph. That is the library's argument working — a word stops belonging to
the vibe that taught it — so the baseline moved rather than the check loosening.

## What must stay true

- **The card is seven.** Every new frame is `depth: 'deeper'`, like `children` and `age`. `scripts/purpose-check.mts` fails otherwise.
- **The card fits the free tier.** Measured at exactly 5 vibes against 5 free —
  zero slack. A new `depth: 'card'` frame needing a sixth vibe breaks it.
  `scripts/parts-check.mts` asserts this.
- **Every word is taught or glossed** — `scripts/lint-content.ts`.
- **A card frame's words are teachable early** — `depth: 'card'` means the seven you
  hand a stranger, so nothing on the card may need a piece above rung 2.
  (This replaces "a frame's declared rung is ≥ the highest rung of its pieces". The
  `rung` field on a frame never meant difficulty — seven of twelve declared *above* what
  their words needed, purely to push themselves off the card — so it is now `depth`,
  which says what it does.)

## Open questions for Sam

1. **What is the cultural source for the "getting about" vibe?** Every existing
   vibe hangs off recognisable English-language culture. This one is the most
   functional content in the product and has the least obvious hook.
2. **Does `who_with` supersede `married` on the card**, or sit above it as the
   fuller answer? Replacing a card frame is the riskier move.
3. **Is a past tense in scope this year?** It gates `how_met` and most of the
   stories half of a Legend.
