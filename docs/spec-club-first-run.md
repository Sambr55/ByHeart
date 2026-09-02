# DUB — The Club, from the first swipe

> "11 what, why?" is the right question, and the number was never the problem. Nothing has
> ever told a learner what a vibe is FOR, so any number attached to one is noise.
>
> This is the restructure Sam described, with one assumption of mine corrected out of it and
> the consequences worked through.

---

## 00 The correction that shapes everything

My first draft opened the Club as a wall of locked cards. Sam's note killed it, and the
reason is worth stating because it applies to every screen in the first ten minutes:

> *You are assuming the person is planning to learn Portuguese and visit Lisbon before we
> have asked them anything.*

That is exactly what it assumed, and it is what the whole product currently assumes. The
front door, the deal, the pair screen and the picker are all configuration — they take
somebody who has arrived curious and immediately ask them to commit, choose, and start
working. Nothing sells the idea first.

**So the first screen is not a gate, a form, or a wall. It is a demonstration.** A feed you
can swipe through that shows what DUB is: immersion in a place, learning on the move, from
content that is current. You should be able to get the whole idea without typing anything or
agreeing to anything.

---

## 01 The shape

```
front door
   │  swipe
   ▼
THE CLUB — a feed anybody can browse
   │
   │  swipe up / down, freely, nothing locked, nothing asked
   │
   ├─ real Lisbon content ......... what the product actually gives you
   ├─ SEE HOW IT WORKS ............ the Goose demo, playable right there
   ├─ real content ................
   ├─ BUILD YOUR LEGEND ........... what the card is and why it is the way in
   ├─ a live Drop ................. dated, counting down, obviously current
   ├─ LEARN FROM LIVE EVENTS ...... what a Drop is
   ├─ real content ................
   └─ ASK ME ANYTHING ............. the translator
        │
        │  every explainer's CTA is the same one
        ▼
   TRY YOUR FIRST THREE VIBES
        │
        ▼
   ┌──────────────┐
   │  the gate    │  three free, then pay
   └──────────────┘
        │
        ▼
   two more vibes  ──▶  YOUR LEGEND  ──▶  the Club, unlocked
```

### 01.1 What this replaces

The linear intro — WELCOME, HOW_IN, the demo, the pair screen, THE_WAY — is a corridor. Five
screens in a fixed order, each one a wall between somebody and the thing they came to see,
and no way to skip ahead or look around.

**The same content becomes cards in a feed.** Every claim the corridor makes is still made,
but the learner chooses the order and can stop reading and start swiping at any point. A
corridor tests patience; a feed tests interest, which is the thing actually worth measuring
before somebody has committed anything.

It also means the demo is no longer screen four of an onboarding. It is a card called SEE
HOW IT WORKS sitting between two real Lisbon cards, which is a much better argument for
itself.

---

## 02 The four explainers

Interleaved with real content, never consecutive. Each answers one question and every one
of them ends in the same call to action.

| Card | The question it answers | What it shows |
|---|---|---|
| **SEE HOW IT WORKS** | *Can I actually do this?* | The Goose demo, playable in the card. "Talk to me, Goose" → *fala comigo* → you now own **comigo**. Sixty seconds, no account, and it is the strongest thing DUB has. |
| **BUILD YOUR LEGEND** | *What am I working towards?* | The card is seven questions a stranger asks you, answered in Portuguese, out of language you own. It is the way in here. |
| **LEARN FROM LIVE EVENTS** | *Why is this not a textbook?* | A real Drop, with its real countdown. Something happening in Lisbon this month and what you will need to say at it. |
| **ASK ME ANYTHING** | *What happens when I need a sentence you have not taught me?* | The translator. The thing every learning app leaves you to Google, in the app, in European Portuguese. |

**Every CTA is `TRY YOUR FIRST THREE VIBES`.** One destination, four reasons to want it. A
learner who is sold by the Drop and a learner who is sold by the demo end up in the same
place, which is what makes this a funnel rather than a menu.

---

## 03 The three states of the Club

This is the part that has to be got right, because the same screen now serves somebody who
has never heard of DUB and somebody who has been in Lisbon for a year.

| State | Who | What the feed holds |
|---|---|---|
| **Showcase** | Nobody yet — no vibes done | Real content, freely browsable, plus the four explainers. Nothing locked, because there is nothing yet to withhold and a lock before a demonstration is just a wall. |
| **Working** | Vibes started, Legend not finished | The explainers retire as they are answered. Content is now **teased**: the photograph, the moment in English, and the Portuguese withheld — "your landlord has just said the deposit is not coming back. What to say arrives with your Legend." |
| **Member** | Legend done | Everything, plus Drops, plus the derived cards. What exists today. |

The middle state is where the lock finally belongs, and it locks the right thing: not
information, **capability**. Reading what the moment is costs nothing; knowing what to say
is the product.

---

## 04 One number at a time

Three counters is what produced "11 more in here". The rule from here:

> **A screen states the distance to the NEXT thing, and never a total.**

| Where | What it says | What it must never say |
|---|---|---|
| Showcase | "Try your first three vibes" | anything about seven, or about the Legend's length |
| In a vibe | "Where questions one and two come from" | "3 of 14" |
| After three | "Two more, then your Legend" | a total across the whole product |
| In the Legend | "Seven questions. Three answered." | vibes, rungs, or crates |

Three, then two, then seven — but never all three at once, and each stated only when it is
the thing immediately ahead. A learner is told what to do next and what it unlocks, always,
and is never handed a denominator that spans stages.

The vibe card in the picker therefore stops counting roots entirely and says what the vibe
is for:

> **The basics, in songs you know**
> *Where questions one and two come from.*

---

## 05 Who, where and why — asked in set-up, before anything is tailored

> **This section previously said the opposite, and it was wrong.** Kept as a correction
> rather than quietly rewritten, because the mistake is instructive.

### 05.1 The misreading

The note that produced the original §05 was:

> *You are assuming the person is planning to learn Portuguese and visit Lisbon before we
> have asked them anything.*

I read that as **do not ask**, and pushed the purpose question five vibes downstream to the
top of the Legend. It means **do not assume — ask.** The generic feed in front of set-up is
generic *precisely because* these questions have not been answered yet; answering them is
what turns it into somebody's.

### 05.2 What the mistake actually cost

Worse than misplacement. The three questions ended up in three different places and none of
them reached the thing that builds the feed:

| | Where it was | Reached the feed? |
|---|---|---|
| **Where** | Nowhere. `ChapterId` was a parameter on `feedFor`, `roomsFor`, `dropsFor` and `rowsFor`, and every caller passed the default. Two cities in `CHAPTERS`, no question anywhere. | No |
| **Why** | A full screen at the top of the Legend — five vibes and a paywall after the content it was meant to shape | No. `feedFor` did not even accept a purpose. |
| **Who** | An `onBlur` on a text field in Yours that nothing links to | No |

So the answer to *"can we tailor the content?"* was **no**, and would have stayed no even
after somebody answered, because the wiring stopped at the parameter.

### 05.3 Where they go

**All three in the set-up card**, in this order, before any content is tailored:

```
WHERE   which city          → chapter, and the pair falls out of it
WHY     visiting/staying/moving → which of the city the Club offers
WHO     your name           → optional; the answer to the first thing you say in Portuguese
```

The §00 correction still holds and is not in tension with this: **the argument comes first,
the questions come seventh.** Nobody is asked to classify themselves at the front door. They
are asked after four reasons and two demonstrations, on a card they can swipe past forever.
Gates live on actions, never on the scroll.

The language question is gone. Every chapter in `CHAPTERS` carries the same pair, so choosing
Lisbon chooses pt-PT — asking twice for one answer is a form, not a decision.

### 05.4 Ordering, not filtering — and why that is a content fact

Turning the purpose filter on today would make the Club **emptier**, which is the exact
problem it exists to solve. Of fifteen Situations:

| Purpose | Matching rooms |
|---|---|
| moving | 15 |
| staying | 6 |
| visiting | 4 |

A visitor would get a four-card Club. So `feedFor` **orders** by purpose instead: what
somebody is here for leads, everything else follows, nothing is hidden. Identical wiring,
lower strictness — pass `purpose` through to `roomsFor` and it becomes a filter the day
`visiting` and `staying` have blocks of ten.

**Save still outranks purpose.** A card somebody pressed a button to keep beats a preference
inferred from a menu, always.

### 05.5 What this makes urgent

The asymmetry above is now the top content priority. `lisbon-moving-1.ts` gave `moving`
ten rooms; `visiting` and `staying` have none of their own and are living on the four
untagged originals. **A visitor who answers honestly currently gets the thinnest Club of the
three** — the opposite of what answering should do.

Two blocks of ten, `lisbon-visiting-1` and `lisbon-staying-1`, and then §05.4's ordering
becomes a filter.

The existing `why_here` card — *Porquê Portugal?* — stays exactly as it is. It collects a
feeling and it is a good sentence; it was never a router.

`WhyHere` stays in the Legend as a **fallback**, not the primary ask: it now fires only for
learners who reached the deck without ever answering in set-up, and it has the forward exit
its own doc comment always claimed it had.

## 06 Order of work

Staged so each step is worth having on its own, and so nothing ships that makes the current
product worse while the next step is being built.

| # | Work | Size | Why here |
|---|---|---|---|
| 1 | The Club renders for a stranger: real content, freely browsable, no lock | M | The showcase exists before anything is asked. Nothing else can be tested until this does. |
| 2 | The four explainer cards, interleaved, all CTAs to the same place | M | The argument, made in the feed instead of a corridor |
| 3 | Route the front door's swipe to the Club; retire the corridor | S | The moment this becomes the product's opening |
| 4 | The teased state, for somebody working | M | Only meaningful once step 1 exists to tease |
| 5 | Retire the counters; each stage states only its own next step | M | Where "11 more in here" actually dies |
| 6 | Purpose at the top of the Legend | S | Moving what already exists |
| 7 | `purposes` on `LEGEND_FRAMES`, three question sets | M | Needs the reviewer |

Steps 1–5 are the restructure and are about two weeks. 6 is an afternoon. 7 is content.

### 06.1 The risk worth naming twice

**A showcase is only as good as the shop.** This makes the Club the first impression while
it holds five standing rooms, one unverified block of ten, and one Drop that opens in
October. If the browsable content is thin, the demonstration argues against the product.

That is not a reason to delay the restructure — it is the reason the calendar and the
`moving` block matter more than anything else on the list. **The first screen becoming a
window makes content supply the whole game.**

---

## 07 What I still need decided

1. **Does the showcase feed need its own content?** Real Lisbon cards are the honest choice
   and they are the same five rooms a member sees. Showing a member's content to a stranger
   is either generous or it spends the good stuff early — my instinct is generous, because
   the thing being sold is that the content is real.
2. **What happens if a stranger taps a content card in the showcase?** My proposal: it opens
   normally, the whole way, once — one free room, ever. Strongest possible demonstration
   and it costs nothing that can be re-spent.
3. **Do the explainers ever come back?** My proposal: each retires permanently once its
   thing has been used, and never returns. An explainer a member still sees is an advert.

---

## 08 The feed is the product, not a shell around it

> Added after a fair complaint: the first version of this was me transcribing instructions
> rather than thinking the flow through. What follows is the design position, including the
> place where the brief contradicts itself and what to do about it.

### 08.1 The contradiction worth naming

**"Feels like TikTok" and "each swipe moves them on in the process" pull in opposite
directions.** TikTok is infinite, orderless and lossless — swiping past costs nothing,
because whatever you skipped comes back. A process is ordered, finite and has
prerequisites, so swiping past loses something.

Reconciling them is not a matter of tone. It needs one mechanism:

**Save is what makes swiping past safe.** It is not a feature on the rail; it is the thing
that lets a queue behave like a feed. Without it, "swipe past" means "lose", and a person
who senses that stops swiping and starts reading everything — which is a corridor again,
with extra steps.

And today **save does nothing at all to the feed.** It fills a bookmark and files the card
in YOURS. It is a filing action, not a deferring one, and only the second makes this model
work. That is the single most important gap in the brief and it is invisible from outside.

### 08.2 Three verbs, and only three

| Gesture | Means | Costs |
|---|---|---|
| **Swipe up** | Next. Move on in the process. | Nothing, because of save |
| **Swipe left** | Into this one. Do it. | The thing itself |
| **Save** | Not now — bring it back. | Nothing |

That is the whole grammar. Anything that cannot be expressed in it is a screen, and screens
are what this restructure exists to remove.

### 08.3 Gates live on actions, never on the scroll

If every swipe is progress, then in principle a gate must stop a swipe — and a feed that
stops your thumb is not a feed.

**So nothing gates the scroll. Two things gate an ACTION.** The language pair decides which
learner record even exists, and the deal is the thing DUB asks of somebody before it starts
keeping their work. Neither can be skipped, and neither needs to block browsing.

The resolution: **you may swipe past set-up forever; you cannot start a vibe without it.**
The card sits in the feed like any other, and every call to action that needs it routes
through it. Nothing stops the thumb; the process still cannot be entered sideways.

### 08.4 The order, and why

```
1  you already understand more than you can say   ← the demo, playable
2  the pharmacy                                   ← what it looks like, obvious
3  seven questions a stranger will ask you        ← what you are working towards
4  Bridget Jones cringe moments                   ← what it looks like, fun
5  Lisbon as it is actually happening             ← why this is not a textbook
6  the sentence we have not taught you yet        ← the translator
7  SET UP — one decision, then you start          ← the pair, the deal, and in
8+ the ordinary feed
```

Claim, then evidence, twice — because a claim without evidence is advertising and evidence
without a claim is a mood board. Set-up comes seventh because by then somebody has been
given four reasons and shown two of them working, which is the first moment asking for
anything is fair.

### 08.5 What "see it again" has to mean

A saved card **leads the feed next time the Club is opened**, and survives being done.
Anything less and the promise is a bookmark rather than a return, which is what it is now.

