# BY HEART — Top Gun / European Portuguese prototype

A 10-minute mobile-first web experience that tests one question: can a familiar
cultural reference make a new piece of language easier to acquire, and more likely
to survive into a different real-world context?

Built to `By_Heart_Top_Gun_Prototype_Spec_v0.1` (23 August 2026).

    Remember -> Discover -> Play -> Escape the film -> Recall -> Transfer

## Run

    npm install
    npm run dev        # http://localhost:3000

## Where things live

| Path | What |
| --- | --- |
| `content/types.ts` | The §12 content model — culture and curriculum kept separate |
| `content/targets.ts` | The 10 learning targets, the cultural moments, every pt-PT utterance |
| `content/topgun-pt.ts` | All 47 screens (S01–S35, L01–L12) as data |
| `content/audio-manifest.ts` | Phrase → audio slug, and the list the TTS build must produce |
| `engine/` | Session state, hint ladder, analytics, audio |
| `components/` | The ten core components from §11 |
| `app/page.tsx` | The screen router — dispatches on `screen.type`, holds no lesson copy |

No lesson text lives in JSX (Appendix B, item 1). A native-reviewer correction is a
one-line edit in `content/`, and it propagates to the lesson, the QA sheet at `/qa`
and the audio manifest at once.

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

## Rights

Brief cultural hooks only. No footage, stills, logos, soundtrack, actor likenesses,
dialogue sequences or subtitle tracks. Aviation styling is original geometry, not
film key art. Commission specialist review before any public release.
