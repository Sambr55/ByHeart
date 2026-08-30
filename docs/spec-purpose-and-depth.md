# DUB — Purpose, depth, and why the Club feels arbitrary

> The Club is not arbitrary because it was badly ordered. It is arbitrary because five
> cards cannot be ordered into anything. And you have never seen a Drop because there is
> one in the product and it opens on 24 October.
>
> This spec proposes: **purpose as the spine**, **ten-card blocks as the unit of supply**,
> and **a city calendar as the drop engine** — with the smallest honest version of each.

---

## 00 The numbers, first, because they change the shape of the answer

Counted today, 2026-08-30:

| | Count |
|---|---|
| Situations in the Club | **5** |
| Drops in the product | **1** |
| Drops live today | **0** |
| Recorded audio files | **0** |

The Club holds five rooms — the pharmacy, a coffee standing up, the bread queue, the Junta,
getting on the 28. Three at rung 2, two at rung 3. There is no sequence in that because
five items in two bands cannot express one.

**So "arbitrary" is not a perception problem to be fixed with better ordering.** Any
ordering of five cards looks arbitrary, because a person can see all five at once and
therefore sees no shape. Depth is not a feeling that can be designed onto a small library.
It is what a large one feels like.

This matters for how the rest of this document is read: the design below is worth having,
but **none of it is what makes the Club feel deep. Volume is.** The design is what stops
volume feeling like a pile.

### 00.1 Why you have never seen a Drop

Not the days rule. The rule is correct and it is working exactly as written on an empty
library:

- one Drop exists: `duran_duran_arena`, pegged to **2026-11-14**
- the window opens 21 days before: **2026-10-24**
- today is **2026-08-30**, so it is 55 days early
- `dropsFor()` therefore returns nothing, correctly

`/club?preview=drops` exists precisely for this and shows it. The feature works; there is
nothing to show. **One hand-authored Drop is not a Drops feature, it is a proof that the
renderer works.** §03 is about the supply.

---

## 01 Purpose as the spine

### 01.1 It is already collected, and it steers nothing

`why_here` is Legend card 9. It asks *Porquê Portugal?* and offers five reasons:

| Answer | English |
|---|---|
| `quero fazer o que adoro` | I want to do what I love |
| `o trabalho trouxe-me cá` | work brought me here |
| `quero uma vida mais calma` | I want a calmer life |
| `alguém que amo está cá` | someone I love is here |
| `quero recomeçar` | I want to start again |

That is a **sentence about feelings**, and it is a good one — it belongs in the Legend and
should stay exactly as it is. But it cannot route content: "someone I love is here"
describes a mover and a long-distance visitor equally, and "I want to start again" tells
you nothing about whether they need a NIF or a bus ticket.

**So this needs a second, blunter question, and it is not a Legend card.** The Legend is
the minute about yourself you can say out loud in Portuguese. This is configuration.
Conflating them would put "are you a tourist" into a sentence somebody recites in a bar.

### 01.2 The four purposes

Proposed, and the fourth is the one worth arguing about:

| id | Reads as | What it implies about content |
|---|---|---|
| `visiting` | *I'm here for a few days* | Transactions with strangers. High frequency, low stakes, no follow-up. Ordering, buying, asking directions, getting a taxi. Nothing that requires you to come back tomorrow. |
| `staying` | *I'm here for a season* | Repeat relationships with the same people. The café that knows you, a landlord, a gym, a doctor once. Small talk becomes load-bearing. |
| `moving` | *I'm making a life here* | Institutions. NIF, Finanças, a bank account, a lease, a car, a school, SNS, the Junta. Long, high-stakes, form-shaped, and the sentences are worth having exactly once. |
| `language` | *I just want the language* | No situational spine at all. This person wants the graph — verbs, patterns, register — and the Club's premise does not serve them. |

**The fourth is a trap and should not ship in v1.** A learner with no location and no
purpose is asking for a course, and DUB is not a course — its entire claim is that language
arrives attached to a place and a reason. Building a fourth content track for people who
have rejected the premise is the fastest way to have four half-supplied tracks instead of
three good ones. If somebody picks it, give them `visiting` and say so plainly.

Recommendation: **three purposes ship, `language` is offered as a fourth option that maps
onto `visiting` with an honest line explaining why.**

### 01.3 Where it is asked

Not in the Legend, and not on the first screen either — the front door already carries
enough. Asked **at the Club threshold**, on the welcome the Club already shows once:

> **Before you go in**
> The Club is Lisbon. What brings you?
> ○ A few days ○ A season ○ For good

One tap, changeable later from YOURS, and the reason is worth saying on screen: it decides
what the Club offers you, and it is the difference between being taught how to buy a bus
ticket and being taught how to register at the Junta.

### 01.4 What it must not become

**It must not become a difficulty setting.** A mover is not "advanced" and a tourist is not
"beginner" — a tourist ordering a complicated coffee is doing something harder than a mover
signing a form they have printed out. Purpose selects *which* content; the ladder still
decides *when*. Two axes, and collapsing them is how this becomes a level system by
accident.

---

## 02 Blocks of ten, and progression without levels

### 02.1 The unit

**A block is ten Situations for one purpose, in one city, at one depth.** Ten because that
is what an image session yields — a real constraint and a good one, since it forces a block
to be conceived as a set with a shared look rather than ten cards commissioned separately.

```
lisbon / moving / block 1   → arriving:   NIF, bank, phone, lease, Junta registration…
lisbon / moving / block 2   → settling:   doctor, school, car, utilities, tax…
lisbon / visiting / block 1 → the street: coffee, ticket, directions, bill, chemist…
```

### 02.2 The progression, and why it is not a level

The learner is never shown a number, a rank, or a percentage. What they are shown is that
**block 2 exists and is closed**, and the sentence that says so is about content, not
attainment:

> *There is more of Lisbon after this one. Ten more rooms, and they are the ones you need
> once you have somewhere to live.*

That is a promise about the city, not a score about the person. It produces the pull of a
level system without the machinery — and, critically, without the lie, because the second
block genuinely is harder and genuinely is for later.

**Opening rule:** block N+1 opens when **seven of ten** in block N are finished. Not ten.
Ten makes the last three compulsory and turns a feed into a checklist; seven says "you have
had the shape of this" and lets somebody skip the three that do not apply to them. The
three left behind stay available.

### 02.3 What "more advanced" actually means

Not longer sentences. Three real axes, in the order they matter:

1. **Fewer scaffolds.** Block 1 gives the whole exchange; block 3 gives your line and lets
   the other half arrive unseen.
2. **More reply.** Block 1 is things you say. Block 3 is things you say when the answer was
   not the one on the card — the *repair* half, which is where every real conversation goes
   wrong.
3. **More at stake.** A wrong coffee costs nothing. A wrong sentence at Finanças costs an
   afternoon and a second appointment.

Difficulty as **consequence**, not as vocabulary size. That is also what makes it feel like
Lisbon rather than like a syllabus.

---

## 03 The city calendar, and Drops that actually exist

### 03.1 The supply problem stated honestly

A Drop pegged to a dated event has a brutal property: **it is worthless the day after, and
it took the same effort to author as a Situation that lasts forever.** One hand-written
cluster took real work and will be live for 22 days, once, and then be dead content in the
repo forever.

That economics only works one of two ways:

- **the drop is cheap to make** — templated, filled from a calendar row, minutes not hours
- **the drop is reused** — Santo António comes round every June

Both, ideally. `content/drop-templates.ts` already exists and does the first: slots for
`event`, `venue`, `station`, `day`. It has one template and no source feeding it.

### 03.2 The monthly calendar

**One file per city per month**, hand-curated, ten to fifteen rows:

```ts
// content/calendar/lisbon-2026-09.ts
{ on: '2026-09-13', kind: 'festa',    name: 'Festas do Bairro', where: 'Alfama',        station: 'Santa Apolónia' }
{ on: '2026-09-20', kind: 'match',    name: 'Benfica–Porto',    where: 'Estádio da Luz', station: 'Colégio Militar' }
{ on: '2026-09-30', kind: 'deadline', name: 'IMI segunda prestação' }
```

Curated rather than scraped. §03.4 says why.

### 03.3 Purpose decides which rows become Drops

This is where the calendar and the purpose spine meet, and it is the part that makes the
Club feel like it knows who you are:

| Calendar row | `visiting` | `staying` | `moving` |
|---|---|---|---|
| Benfica–Porto | ✓ getting there, a ticket, a beer | ✓ the same, plus the argument after | ✓ plus taking a side, which is social currency |
| Festas do Bairro | ✓ | ✓ | ✓ |
| IMI instalment deadline | ✗ | ✗ | ✓ the letter, the portal, the queue |
| Câmara consultation | ✗ | ✗ | ✓ |
| Metro strike | ✓ | ✓ | ✓ |

A tourist never sees a property-tax Drop. A mover sees it and it is the most useful thing
DUB has ever shown them. **Same calendar, three products.**

### 03.4 Curated, not scraped

`lib/harvest/` exists and `SOURCES` is empty. It should stay empty for now.

A scraped Drop is a sentence a learner will say to a stranger, assembled from a source
nobody vouched for. The failure mode is not a missing gig — it is confidently teaching
somebody to ask about a concert that was cancelled, at a venue on the wrong side of the
river. **Fifteen curated rows a month is an hour of work and cannot embarrass anybody.**
Automate it when the templates have been proven by a season of hand-filled ones.

---

## 04 What this costs, and the order to do it in

Sequenced so each step is useful alone:

| # | Work | Size | Why here |
|---|---|---|---|
| 1 | Ask purpose at the Club threshold; store it; show it in YOURS | S | Everything downstream keys off it, and it is worth knowing what real testers pick before authoring for them |
| 2 | Tag the existing 5 Situations with purposes; filter the feed | S | Proves the routing on real content, costs nothing |
| 3 | **Author `visiting` block 1 — 10 Situations** | **L** | The first block that makes the Club not-empty. This is the actual work |
| 4 | Blocks, the 7-of-10 opening rule, and the "there is more" card | M | Only meaningful once two blocks exist |
| 5 | `lisbon-2026-10.ts` + purpose tags on rows; drops built from templates | M | First month where a Drop is live because a calendar said so |
| 6 | `moving` block 1 — the institutional set | L | The highest-value content in the product and the hardest to write |

**Steps 1, 2, 4 and 5 are about a week of engineering between them. Steps 3 and 6 are
content, and content is the schedule.** Ten Situations is ten titles, ten photographs, ten
sets of lines, and every line needs the pt-PT reviewer who is already the blocker on
everything else.

### 04.1 The honest risk

This spec proposes tripling the content surface — three purposes × N blocks — while the
product has **five Situations and no reviewed audio**. The plan is right; the sequencing
risk is that purpose-routing arrives first and makes the Club emptier, because five cards
divided by three purposes is one or two cards each.

**Mitigation: do not ship the filter until a block exists to filter to.** Step 2 tags and
filters behind a flag; the Club stays undivided until step 3 lands. Otherwise the first
thing purpose does is make the problem it exists to solve visibly worse.

---

## 05 What I need from you

1. **Three purposes or four?** My recommendation is three plus an honest redirect for the
   language-only learner. You may feel that person is a real audience worth a fourth track.
2. **Which block first?** `visiting` is easier to write and serves the widest audience;
   `moving` is far more valuable and is the one no other app does well. My instinct is
   `moving`, because it is the reason somebody would choose DUB over Duolingo — but it is
   the harder ten to get right and it needs the reviewer most.
3. **Who writes the calendar?** Fifteen rows a month is small but it is *monthly*, and a
   drop feature with a lapsed calendar is worse than none.
4. **Does purpose change after the fact?** If somebody moves from `visiting` to `moving`,
   do they get the mover blocks from the start, or keep what they have done? I would keep
   everything and open the new track — nothing learned is ever taken away — but it means a
   learner can hold two tracks at once and the Club has to say which is which.
