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

Consequence: `parts-check` must report unteachable words **as a brief, not a
failure**. A frame naming a word no vibe teaches is expected during authoring;
what must fail is a frame naming a word that does not exist *as a piece at all*,
because that is a typo rather than a plan.

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

One new vibe would carry most of it: **getting about and where you live** —
`morar`, `perto`, `longe`, `autocarro`, `metro`, `a pé`, `bairro`, `café`,
`fim de semana`.

It needs a cultural source in the existing style. That is the open question for
this part, and it is Sam's to answer, not mine.

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
answer and belongs above CARD_RUNG so the card stays seven.*

**`they_do` — E ela, o que faz?** · *And her, what does she do?*
`Ela trabalha com {thing}.` — She works with {thing}.
Needs: `ela` ✓, `trabalha` **new** (third person of `trabalho`, which exists —
so this is a *form*, not a new word, and `derive.ts`'s `next_person` machinery
already generates exactly this kind of card).
*The cheapest frame in the brief.*

**`how_met` — Como se conheceram?** · *How did you meet?*
Harder — it needs a past tense DUB does not teach. **Defer.** Named here so it
is a known gap rather than an oversight.

## Ordering

1. **`they_do`** — needs one verb form the paradigm already knows.
2. **`who_with`** — one new word, everything else exists.
3. **`local`** — one new noun.
4. **`lives`, `gets_about`, `weekend`** — need the new vibe.
5. **`how_met`** — deferred until there is a past tense.

## What must stay true

- **The card is seven.** Every new frame goes above `CARD_RUNG`, like `children`
  and `age`. `scripts/purpose-check.mts` fails otherwise.
- **The card fits the free tier.** Measured at exactly 5 vibes against 5 free —
  zero slack. A new frame *on the card* needing a sixth vibe breaks it.
  `scripts/parts-check.mts` asserts this.
- **Every word is taught or glossed** — `scripts/lint-content.ts`.
- **A frame's declared rung is ≥ the highest rung of its pieces.**

## Open questions for Sam

1. **What is the cultural source for the "getting about" vibe?** Every existing
   vibe hangs off recognisable English-language culture. This one is the most
   functional content in the product and has the least obvious hook.
2. **Does `who_with` supersede `married` on the card**, or sit above it as the
   fuller answer? Replacing a card frame is the riskier move.
3. **Is a past tense in scope this year?** It gates `how_met` and most of the
   stories half of a Legend.
