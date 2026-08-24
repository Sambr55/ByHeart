# DUB — European Portuguese through culture you already know

Every big language app teaches Brazilian Portuguese. DUB teaches the European one, and it
teaches it through things a person already carries around: a Bond title, a Bridget Jones
disaster, a Duran Duran gig, a Beatles single. The cultural hook is scaffolding, and the
whole method is built around taking it away again.

**81 roots · 12 crates · 149 pieces · 65 collisions.**

## The idea, in four beats

    ROOT            something you already recognise, in English
    NATURAL PT      what a Portuguese person would actually say
    EXTRACT         the useful piece hiding inside it
    RELEASE         say it cold, with nothing on screen to copy from

Only that last beat counts. The number on the proof card is sentences produced with no
cue on screen — it cannot be inflated by opening the app, and that is the point. There is
no streak in DUB, no XP, and no number that goes down.

Five things here have no equivalent in a mainstream language app, and all five work:

- **The proof number** counts only cold production.
- **The release beat** removes the cultural cue once you own the language.
- **Collisions** combine pieces from unrelated crates into one sentence.
- **Osmosis** shows you the grammar you absorbed, and never tests it.
- **Drops** are pegged to a real event and expire — what you learned inside them does not.

## The shape of the code

    content/roots.ts      the graph: crates → roots → pieces → collisions. The product.
    content/daily-line.ts the morning line, picked from what you own
    engine/journey.tsx    which beats a section contains, and in what order
    engine/learner.ts     the learner record. One per language pair, on the device.
    lib/merge.ts          two copies of a learner, merged so it can only ever gain
    components/           the screens

The learner record is authoritative on the device and syncs to Postgres when there is
one. `lib/merge.ts` is the one file where a bug is unrecoverable: lose a proof line and
there is nothing anywhere to restore it from, so `assertCanOnlyGain` throws rather than
writing a loss, and `scripts/merge-test.mts` runs the real shapes through it.

## Routes

| Route | What |
| --- | --- |
| `/` | The front door — or Dub Club, for anybody who has been here before |
| `/club` | Dub Club: what you can say, and three to five moves worth making |
| `/crates` | The picker, grouped by what you can actually open |
| `/vocab` | The library: every word DUB teaches, and which are yours |
| `/line` | One sentence a morning, chosen from what you own |
| `/drops` | Live, expiring, never gated |
| `/proof` | The card — sentences said cold, and the share image |
| `/p/[id]` | A shared card, public |
| `/pro` | What a membership buys, and what it funds |
| `/account`, `/signin` | Accounts, billing, and deleting yourself properly |
| `/qa` | Every Portuguese string, generated, for a native reviewer |
| `/facilitator`, `/admin` | Testing tools |

## The gates

The rule this repo runs on: **a rule with no grep behind it decays.** Every one that had
a script stayed clean; every one that did not had rotted by the time anybody looked.

    npm run gate        everything below, in order

    npm run lint:content   the graph — rungs, shelves, sets, collisions, osmosis evidence
    npm run line:test      the daily line, across 365 days × 5 salts
    npm run merge:test     a merge can only ever gain, on the real types
    npm run first          simulates a beginner's first session, per crate
    npm run words          one noun per thing, no medium named, every eyebrow a label
    npm run spacing        four spacing steps and three z-layers, and nothing else
    npm run mobile         nothing slides sideways; nothing is under 44px
    npm run contrast       every colour, including the translucent ones, over its ground
    npm run journey        walks a whole session in a browser  (FAMILY=<crate> to pick one)
    npm run brand          regenerates the marks from public/brand/*.svg

`npm run first` is the unusual one. It checks an *experience* rather than a rule, because
the worst defects in this product were never rule violations: "You can now ." is valid
JSX, three identical filler screens are a valid section, and a 59-screen first session
against a ten-minute promise passes every lint in the tree.

## Running it

    npm install
    npm run dev

Nothing is required to run DUB. With an empty environment it works exactly as it ships:
progress lives on the device and every API route says honestly that it has nowhere to
write. Each block in `.env.example` switches on one capability — accounts, sign-in email,
billing, push. `npm run db:migrate` after setting `DATABASE_URL`.

## What is not built

Said plainly, because the alternative is a paywall that lies:

- **Audio is synthetic.** Every line, on every screen. Recording real Lisbon voices is
  what a founding membership pays for, and `/pro` says so in those words.
- **The Booth** is a route and a table with no UI in front of it.
- **Native review** has not happened. Everything is `pending-native-review`, and that is
  the last true blocker on charging anybody money.
