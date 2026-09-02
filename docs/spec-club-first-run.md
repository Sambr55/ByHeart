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

## 05 Where the "why are you here" question goes

Not in the showcase — that is the mistake this spec opens by correcting. Somebody browsing a
feed has not decided anything and asking them to classify themselves is the fastest way to
lose them.

**It belongs at the top of the Legend**, which is the first moment the answer is both earned
and useful: they have done five vibes, they are about to say seven things about themselves,
and what a stranger asks you genuinely differs by whether you are here for four days or for
good.

It does two jobs there:

1. **Routes Club content**, as already built — the Junta for a mover, never for a visitor.
2. **Shapes the Legend.** A mover is asked where they live and what they do here; a visitor
   is asked how long they are staying and where they are from. That needs a `purposes` field
   on `LEGEND_FRAMES` and enough frames to draw three sets from.

The existing `why_here` card — *Porquê Portugal?* — stays exactly as it is. It collects a
feeling and it is a good sentence; it was never a router.

---

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
