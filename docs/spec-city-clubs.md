# DUB — City Clubs specification v0.1

> Dub Club — Lisbon, and how content, functions and services are pulled and pushed
> around a city. Written against what is already built, so the diffs are small and the
> second chapter is cheap.

**Joining the Club is the goal.** You get in by being able to introduce yourself in
Portuguese. Inside is the part that is about *Lisbon* rather than about *Portuguese* —
the people, the places, the things that are happening, and what to say when it goes
wrong.

## 00 The one-sentence test

Everything below has to serve this: **non-judgemental support for doing something
genuinely difficult.** Not praise, not points — reducing the cost of being bad at it.
The model already in the product is `THE_SWITCH`:

> "Sorry — do you speak English?"
> *That is what happens. Not because you were bad at it — because they are being kind.*
> **Estou a aprender. Tenha paciência.**

Remove the shame, hand over the sentence. Anything in a City Club that congratulates
somebody instead of equipping them is wrong.

## 01 What already exists

The delivery machinery is built. Nothing here needs new plumbing.

| channel | what it is | built |
|---|---|---|
| Drops | event-pegged, expiring, `from`/`on` window, `link` | yes |
| The Line | daily, 20 seconds, cron + `notificationFor` | yes |
| Web push | VAPID, `/api/push/subscribe`, `/api/cron/line` | yes |
| The shelf | pull surface for vibes | yes |
| The library | pull surface for pieces, by shelf | yes |
| Repair kit | four lines for when it collapses | yes |

**What does not exist: any notion of a chapter.** A drop's `place` is free text
("Altice Arena, Lisboa"). Nothing knows what city anything belongs to. That single
missing field is what stands between the product and everything in this document.

## 02 Three layers, and why Faro must be cheap

The governing constraint. **If a chapter needs the whole product rebuilt, chapters do
not scale.**

| layer | scope | contains | shared by |
|---|---|---|---|
| Language | national | pt-PT, the ladder, the vibes | every chapter in the country |
| Country | national | NIF, Junta de Freguesia, national figures and holidays | every chapter in the country |
| City | chapter | places, local people, local moments, local speech | one chapter |

Estimated cost of opening Faro if this holds: Errands ~10% new (procedures are national,
offices are local), People ~40%, Places 100%, Moments 100%. Roughly a third of a
chapter. Without the layering it is a whole product.

## 03 The content types

Five, distinguished by what they are **pegged to**.

| type | pegged to | example | direction |
|---|---|---|---|
| Place | a location | the talho, the 28, a tasca | pull |
| Person | nothing | Amália, Eusébio, a chef worth knowing | pull |
| Moment | a date | Santo António, a Sporting match | **push** |
| Errand | a task | NIF, doctor, landlord, bank | pull, urgently |
| Repair | a situation going wrong | the switch to English | pull, panicked |

Place, Moment and Errand are the **same shape** — a thing you will stand in front of,
with the language you need for it. Only the peg differs. So they are one content type
with optional pegs, and a Moment is simply a Situation pegged to a date. Drops are not a
separate feature to reconcile; they are the time-pegged case of this one.

## 04 The Situation

```ts
interface Situation {
  id: string
  chapter: ChapterId          // 'lisbon' | 'faro' — the only new scoping concept
  kind: 'place' | 'person' | 'moment' | 'errand'
  title: string               // what a member calls it
  why: string                 // why a member would open this, in their words
  /** Optional pegs. A Moment has `on`; a Place has `where`; an Errand has neither. */
  on?: string                 // ISO date — makes it pushable and expiring
  from?: string               // when it starts being urgent
  where?: { name: string; area: string }
  /** The language. Reuses the root machinery unchanged. */
  lines: { pt: string; en: string; when: string }[]
  /** What a member is expected to be able to say cold afterwards. */
  release: { ask: string; answer: string }
  image?: SituationImage      // see §06
  rung: Rung                  // the ladder rung it assumes
  review_by?: string          // see §07 — places rot
}
```

`lines` and `release` deliberately mirror a root's `branches` and `transfer_prompt`, so
a Situation runs through the existing teach → take away → say-cold beats with no new
teaching code.

## 05 Pull and push

**Push brings people back. Pull is why they stay.**

Push (DUB initiates) — all channels exist:
- A Moment enters its `from` window → drop appears, notification fires
- The Line can draw from the member's chapter, not just the national pool
- Nothing is ever pushed twice, and nothing pushed is required

Pull (the member initiates) — one of these does not exist and it is the important one:

> **"I have to do a thing tomorrow."**
> Pick the errand → get the lines → say them cold.

That is a nervous person at 11pm the night before a doctor's appointment. It is the
Club's promise made concrete, it needs no new teaching machinery, and it is the thing
that makes DUB a tool rather than a course. **Build this first.**

## 06 The visual layer

DUB has **no images today**. `public/` is audio and SVG marks; there is no `<img>` or
`next/image` anywhere; a vibe is identified by a `tone` and a line drawing. Adding
photography is a genuine first and it must be designed, not bolted on.

### 06.1 Why it belongs here specifically

A word is not a place. "Lisbon" is an abstraction; the light on a tiled façade is the
reason somebody is learning this at all. The emotional pull of the destination is the
Club's strongest asset and the product currently gives it nothing to look at.

### 06.2 Art direction — evidence, not aspiration

The risk is obvious: photography is how DUB starts looking like every other travel app,
and the austerity is a brand asset. The rule that keeps it DUB is the same rule its
copy already follows — **specific and true beats general and impressive.**

- The queue outside the pastelaria, not sunset over the Tejo
- A handwritten menu, a tiled number, a ticket machine, a *talho* window
- Ordinary weather. Ordinary people or none
- No text baked into images, ever — that is the overlay's job and it cannot be translated
- One image per Situation, never a gallery. It is evidence, not a slideshow

If an image could sell any city, it is the wrong image.

### 06.3 The object

```ts
interface SituationImage {
  src: string                 // local asset, never a remote hotlink
  alt: string                 // required; describes the evidence, not the mood
  credit?: string             // shown where the licence requires it
  rights_status: 'owned' | 'licensed' | 'cc-by' | 'permission-given'
  taken_at?: string           // places rot; a photo has an age
}
```

`rights_status` mirrors the roots' existing field for the same reason: a real place is a
factual claim and a photograph of it is somebody's property. **No image ships without a
rights status**, enforced by lint exactly as root rights are.

### 06.4 Performance and honesty

- Local assets, `next/image`, explicit `sizes`, AVIF/WebP
- A Situation must be fully usable with images off or failed — the language is the
  payload and the picture is support
- Never a background image behind text; contrast is checked and images cannot be
- Respect `prefers-reduced-motion`: no parallax, no Ken Burns, no autoplay

## 07 Places rot

A café closes. A market moves. An office changes its hours. Content with an address is a
maintenance liability forever, and a Club full of things that are no longer true is
worse than a Club with less in it.

- Every Place and Errand carries `review_by`
- Past `review_by` it is hidden, not wrong — silence beats a lie
- A lint reports what is due, so it is a chore with a list rather than a slow decay
- Moments expire on their own already, which is the pattern the rest should follow

## 08 Risks, stated

| risk | mitigation |
|---|---|
| Photography makes DUB generic | §06.2 art direction; evidence not aspiration |
| Image rights on real places and people | `rights_status` required, lint-enforced |
| Factual claims about real businesses | `review_by`, and prefer public/civic over commercial |
| External links break silently | very few, checked, never load-bearing |
| Faro is a thin room | Faro is proof the layering works, not a growth move |
| The Club becomes a directory | every Situation must end in something you can say cold |

## 09 Build order

1. **`chapter` on the content model**, backfilled to Lisbon, drops made chapter-aware.
   Small, unlocks everything else.
2. **One errand end to end** — the pharmacy. Universal, low stakes, genuinely useful,
   and it proves a Situation runs on the existing beat machinery.
3. Decide Places or Moments next based on how the errand actually feels.
4. Visual layer, once there is something worth photographing.
5. Faro, only when Lisbon is full.

## 10 Non-negotiables

- A Situation always ends in something the member can say cold. Never a directory entry.
- Nothing in a City Club counts, scores, or congratulates.
- No image without a rights status, and no image the language depends on.
- Nothing pushed is ever required, and nothing expires that was paid for.
- The way in stays the Legend Card. The Club is entered by speaking, not by paying.
