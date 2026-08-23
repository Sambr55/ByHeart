# DUB — European Portuguese through culture you already know

Two missions and the objects that outlive them. Mission 01 asks whether a familiar
film can make new language stick. Mission 02 asks the harder question: whether the
mechanism **compounds** — whether a second world makes the first world's language
easier, adds to it, and then disappears too.

    Mission 01   Remember → Discover → Play → Escape the film → Recall → Transfer
    Mission 02   Cold recall → Affinity → Acquire → Reinforce → Crossover → Deck

Built to `By_Heart_Top_Gun_Prototype_Spec_v0.1` and
`By_Heart_Mission_02_Compound_Learning_Critical_Test_Spec_v0.2`.

## Routes

| Route | What |
| --- | --- |
| `/` | Mission 01 — Top Gun, 10 minutes, 47 screens |
| `/m2` | Mission 02 — James Bond, 10 minutes, 51 screens |
| `/deck` | BY HEART DECK — 10 personalised cue cards, review and print |
| `/recall` | The 24–72 hour delayed recall, opened from a resume link |
| `/feedback` | Tester feedback — the critical interview, self-administered |
| `/admin` | Collated feedback across testers, by question or by tester, CSV export |
| `/facilitator` | Observer console: arm, state, resume link, reset, links to the above |
| `/qa` | European Portuguese QA sheet, generated from the content |

## The experiment

`?variant=neutral` runs the culture-neutral control arm: identical Portuguese,
identical interactions, identical answer choices, with the cultural setup replaced
by a plain real-world context. Screens that exist only because of the cultural layer
are removed rather than reworded. `?cohort=…` tags a batch. Both are remembered for
the rest of the learner's sessions.

The learner — inventory, evidence log, affinity, arm — persists in `localStorage`
and can be carried to another device by the resume link on the completion screen,
which encodes the whole state in the URL. Nothing is stored on a server.

## Run

    npm install
    npm run dev        # http://localhost:3000

## Where things live

| Path | What |
| --- | --- |
| `content/types.ts` | The content model — culture and curriculum kept separate |
| `content/targets.ts` | All 16 learning targets, the cultural moments, every pt-PT utterance |
| `content/missions/mission-01.ts` | Top Gun, S01–S35 and L01–L12 |
| `content/missions/mission-02.ts` | James Bond, B01–B37 and C01–C12 |
| `content/deck.ts` | The cue-card catalogue |
| `content/audio-manifest.ts` | Phrase → audio slug, and the list the TTS build must produce |
| `engine/learner.ts` | The persistent learner: inventory states, evidence log, resume link |
| `engine/deck.ts` | Deck selection — anchors, weakest, newest, combinations |
| `engine/` | Session state, hint ladder, analytics, audio |
| `components/ScreenRouter.tsx` | Dispatches on `screen.type`, holds no lesson copy |

No lesson text lives in JSX (Appendix B, item 1). A native-reviewer correction is a
one-line edit in `content/`, and it propagates to the lesson, the QA sheet at `/qa`
and the audio manifest at once.

## Brand copy

Every user-facing product name and positioning line lives in `content/brand.ts`.
Flowing a new deck's copy through the product should be an edit to that one file.
Note that "know by heart" still appears inside the *lesson* copy — that is the English
idiom the onboarding question is built on, not the old product name.

## Tester feedback

`/feedback` asks the critical-interview questions from `content/feedback.ts` and posts
to `/api/feedback`. Answers are collated at `/admin`, grouped by question so twelve
testers' answers to "what is the strongest argument against this?" read as one column.

**The question set in `content/feedback.ts` is a placeholder** seeded from the Mission
02 spec's Appendix B and §11. Replace `QUESTIONS` with the real set — the capture
screen, the API payload, the store and the collation table are all driven from that
array.

To turn on persistence:

1. Vercel dashboard → Storage → create a **Blob** store and connect it to the project
2. Redeploy (or `vercel env pull`) so `BLOB_READ_WRITE_TOKEN` is present
3. Set `FEEDBACK_ADMIN_KEY` to a long random string — it gates reads at `/admin`

Until that is done the API returns 503 and the client downloads the submission to the
tester's phone instead, so no answers are ever lost to an unprovisioned store. Anything
that failed to send is queued locally and retried from `/admin`.

## Checks

    npm run lint:content   # content invariants — run this after any content edit
    npm run walkthrough    # plays all 47 screens twice in a real browser
    npm run shots          # captures every screen at 390x844 into .screenshots/
    npm run check          # lint:content + production build

`walkthrough` needs the dev server up (`npm run dev -- --port 3111`). It plays a
perfect run, which must score 8/8 transferred, and a worst-case run in which every
answer is wrong, which must still reach the end — the hint ladder may never trap a
learner. Both runs fail on any console or page error.

`lint:content` enforces the invariants that keep the v0.2 falsification criteria
measurable, not decorative:

- no cultural cue on any screen whose result is counted — "no Maverick" primes as
  effectively as "Maverick"
- every crossover answer must be a construction no screen taught as a line, so the
  cross-world transfer score cannot be satisfied by short-term recall
- every reinforced block must have a cold-recall baseline, and the cold recall must
  include a control block that is deliberately never reinforced
- any screen carrying a cultural cue must have a `culture_neutral` replacement or be
  marked `skipInNeutral`, so the control arm cannot silently leak the cue

## Audio

Playback expects pre-generated pt-PT files at `public/audio/pt-PT/<slug>.mp3`.
Until those exist the app falls back to the browser's pt-PT speech synthesis so the
build stays testable; every fallback is flagged as `source: "tts"` in the event
payload. Device voices vary — do not run external tests on the fallback.

Generate the manifest:

    npm run audio:manifest

## Analytics

Every event named in §10 is captured to an in-session buffer. The observer downloads
one JSON file per tester from the final screen. `engine/analytics.ts` exposes
`addSink()` — point it at PostHog later without touching a call site.

## Deploying

    npx vercel --scope sambr55s-projects            # preview
    npx vercel --prod --scope sambr55s-projects     # production

Vercel Deployment Protection is on, so the URL asks for a Vercel login. Testers on
their own phones cannot get past that. Before an observed session, either create a
shareable link from the deployment in the Vercel dashboard (no login, revocable) or
turn protection off for the duration of testing.

## Rights

Brief cultural hooks only. No footage, stills, logos, soundtrack, actor likenesses,
dialogue sequences or subtitle tracks. Aviation styling is original geometry, not
film key art. Commission specialist review before any public release.
