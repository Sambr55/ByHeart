# DUB — Showing v0.1

> The smallest thing that tests whether DUB should be social at all. One member shows
> another their proof card. Not a feed, not a follow graph, not comments.

## 00 Why this shape and not Duolingo's

Duolingo's follow graph runs on **streaks**. That is the fuel: you follow somebody, a
number goes up, you feel something. DUB has spent every screen refusing that fuel — no
streaks, no points, no lives, nothing that rewards turning up.

Copy the mechanism without the fuel and you get an empty graph. You follow somebody and
there is nothing to look at, because there is no daily number to compare.

So the question is not "should we add following". It is **what would there be to see** —
and DUB has exactly two things worth showing another person, neither of which is a score:

| | why it is worth showing |
|---|---|
| **Sentences you can say cold** | "Here are eleven things I can now say" beats a 340-day streak, and it cannot be farmed by turning up |
| **What you found in Lisbon** | Only a member can make it, and it feeds the city layer directly |

This spec builds the first. The second is where it goes if the first works.

## 01 What it is

A member can show one specific person their proof card. That person sees it, once, and
can show theirs back. That is the whole feature.

**Not** a feed. **Not** a follower count. **Not** comments. **Not** a profile you can
browse. Each of those is a different product and each brings a permanent obligation
(§06) that this one does not.

## 02 What already exists

Most of it. This is deliberately a small diff.

| piece | state |
|---|---|
| The proof card | built — `/proof`, the honest count, three most recent cold lines |
| A shareable snapshot | built — `POST /api/share` mints `share_cards`, capped at three lines |
| A public card page | built — `/p/[id]` plus a generated OG image |
| The `shareable` filter | built — Legend lines are excluded, so a card cannot leak somebody's children by accident |
| Accounts | built — magic link, `users`, sessions |
| Device identity | built — httpOnly cookie, and the reason a signed-out learner still has state |

**What is missing is only the pairing**: a way for one member to say "this person may see
mine", and the other to agree.

## 03 The unit: a showing

```ts
interface Showing {
  id: string
  /** Who is showing. */
  from_user: string
  /** Who may look. Null until the invitation is taken up. */
  to_user: string | null
  /** The card they are showing. An existing share_cards row — no new artefact. */
  card_id: string
  /** Mutual, always: this is null until they show one back. */
  return_card_id: string | null
  created_at: string
  /** Invitations do not sit open for ever. */
  expires_at: string
}
```

A showing is an **artefact plus consent**, not a relationship. There is no `follows`
table, because a follow is a standing claim on somebody's attention and a showing is one
card, once.

## 04 The flow

1. On `/proof`, **Show this to somebody** mints a card (existing route) and a showing
2. It produces a link. The member sends it however they already talk to that person
3. The recipient opens it and sees the card — *and nothing else about the sender*
4. They are offered: **show them yours back**
5. If they do, both sides see both. That is the mutual step, and it is the only one

**Accepting is showing.** There is no accept button separate from the act — a mutual
follow that costs a tap is a notification to dismiss; a mutual showing costs you an
artefact, which is the point.

## 05 What leaves the device

Deliberately little, and it is worth being explicit because this is the first feature
that shows one member anything about another.

| shown | not shown |
|---|---|
| Up to three sentences you can say cold | Your Legend, ever — the `shareable` filter already excludes it |
| The honest count | Your email, your device, your profile answers |
| Your display name, if you set one | Your photograph — it is device-local by design and stays that way |
| How many vibes you have opened | What you got wrong, how long you took, when you last opened the app |

**The photograph does not travel.** It lives in its own storage key precisely so the
learner blob can sync without it, and a showing does not change that. If an avatar is
ever wanted here it is a new decision with a new consent, not a side effect of this one.

## 06 What this obliges us to, honestly

The moment two people can send each other anything, DUB owns:

- **Reporting** — a way to say "this was not okay", that a person reads
- **Blocking** — one-sided, immediate, and permanent
- **Minors** — an age gate, or a defensible reason there is not one
- **Removal** — the ability to take a card down and mean it

This spec keeps that list as short as it can be by allowing **no free text at all**. A
showing carries sentences DUB authored the frames for and the learner filled from a closed
set. There is nothing to moderate because there is nothing arbitrary to write.

**That property is load-bearing.** The first feature that adds a message box changes this
from a small obligation to a permanent one, and it should be taken deliberately rather
than arrived at.

## 07 What it must never become

- A count of who has shown you anything. That is a score with extra steps
- A prompt to show somebody. Nudging somebody to perform is the thing streaks do
- A default. Nothing is shown that was not deliberately shown
- A reason to come back. If showing becomes the loop, DUB is a social app that teaches

## 08 How we know if it worked

The thesis is that people want to show this, not that they can. So:

- **Sent** — how many members mint a showing at all, unprompted
- **Returned** — how many recipients show one back. This is the real number: it is the
  difference between an artefact worth sending and a link that gets ignored
- **Second showings** — anybody who does it twice has told us something the first one did not

If members do not send, the thesis is wrong and no amount of graph would have fixed it.
If they send and nobody returns, the artefact is not good enough yet — which is a content
answer, not a social one.

## 09 Build order

1. `showings` table and the pairing routes. No UI changes to the card itself
2. The **Show this to somebody** action on `/proof`, and the return flow on `/p/[id]`
3. Report and block, before a single showing is sent to anybody outside the test
4. Then, and only then, decide whether what you found in Lisbon becomes shareable

## 10 Non-negotiables

- Mutual or nothing. A showing that is not returned stays private to the two of them
- No free text anywhere in a showing
- The Legend never travels, by accident or on purpose, from this feature
- Nothing here is counted, ranked, or shown as a total
- Report and block ship before the feature does, not after it is needed

---

## 11 What the build changed, and why

Written after building it. Three departures from v0.1 above, each because the spec was
wrong rather than because the code was easier.

### The return flow is at `/s/[id]`, not `/p/[id]`

§04 said the recipient opens the existing public card page. That is wrong, and it took
building it to see why: `/p/[id]` is the growth loop — a card meant to be posted where
strangers see it. Putting "show them yours back" on that page turns every card anybody
posts publicly into a pairing invitation for whoever clicks first.

A showing is addressed to **one person**, and the id is the whole access control. So it
gets its own route and its own id — twelve characters rather than seven, because a public
card only needs to be hard to enumerate and a showing needs to be hopeless to guess. The
page also sets `robots: noindex` and renders no preview metadata, so a link passing
through a group chat does not unfurl somebody's sentences to the group.

`/p/[id]` is unchanged, and a check enforces that it stays that way.

### A party is an account **or** a device

§03 types both sides as `string` user ids. DUB works signed out by design — the proof card
is free at every tier and is the thing that brings people in — so requiring an account to
show one would gate the artefact the whole feature is about.

Every party is therefore "the account if there is one, and the device either way", matched
account-first with a device fallback. Sign in later and showings made anonymously are
still yours, because the device half never changed.

### Blocking is checked against the counterparty, not the sender

The obvious implementation asks "is there a block between the sender and whoever is
looking". For a recipient that is right. For the **sender** it asks whether Alice has
blocked Alice — so the person who had been blocked carried on seeing the card of the
person who blocked them. Whoever is looking, the question is always "is there a block
between me and the person at the other end of this". The flow check covers it.

## 12 What is checked, and where

Two gates, both in `npm run gate`.

`npm run showing` (`scripts/showing-check.mts`) reads the source and needs nothing running.
It asserts the rules that erode quietly rather than loudly: that every publisher derives
its lines from `engine/showable` — nobody will ever decide to publish a Legend, it will
arrive as a second filter written one clause short; that no surface in the feature has a
free-text field, which is the property holding the moderation obligation down; that no
showing screen renders a `.length`, because a count of who has shown you something is a
score with extra steps; and that there is no route anywhere that lifts a block.

`npm run showing:flow` (`scripts/showing-flow.mts`) needs Postgres and drives three real
browser contexts through it: minting, showing back, a third person finding it already
answered, reporting, blocking, and — the one that must never fail — that a Legend line on
the sender's own card does not appear on the recipient's screen.

## 13 Still open

- **Minors.** §06 lists an age gate or a defensible reason there is not one. There is
  still neither. The Legend asks for an age but nothing gates on it, and this should be
  settled before the feature is on for anybody outside the test cohort.
- **Removal.** A sender cannot yet take a showing back. `expires_at` means every
  invitation dies within a fortnight, which is a floor rather than an answer.
- ~~**Reports are written and nothing reads them.**~~ Closed during the build:
  `/admin/reports` reads the queue, renders the reported card so the reader can judge it
  without opening a showing addressed to somebody else, and marks it read. The gate
  asserts both the route and the page still exist.
