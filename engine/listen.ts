'use client'

/**
 * WHAT THEY ACTUALLY SAID, judged on the device.
 *
 * Sam: "apps such as Pomospeak, Jumpspeak and Praktika.ai all have call and response ai
 * tooling. Let's look at building that into our say it cold routes and in fact make it a
 * third option on everything, listen, copy or say."
 *
 * The cold routes are the place this matters most, because they are the one beat in the
 * product that MEASURES rather than teaches — and until now they measured nothing. I SAID
 * IT is a claim the tap cannot check: somebody who could not remember a word pressed the
 * same button as somebody who said it perfectly, and the note on that fork says so in as
 * many words. This is the first thing in DUB that can tell the difference.
 *
 * ON THE DEVICE, AND FREE. The Web Speech API with pt-PT, no network, no key, no cost per
 * attempt — which matters because saying things cold is the core loop rather than an
 * occasional flourish. A learner on a plane keeps it.
 *
 * WHERE IT IS NOT AVAILABLE, NOTHING BREAKS. `canListen()` is false on browsers without
 * it and the SAY control is simply not drawn; the existing I SAID IT stays exactly as it
 * is. That is the whole degradation story: a learner on an unsupported browser is where
 * they were yesterday, not somewhere worse.
 *
 * AND IT IS APPROXIMATE, WHICH THE PRODUCT MUST SAY. Browser recognition of a beginner's
 * Portuguese is a rough instrument — it mishears accents, it guesses, and it is confident
 * either way. So this returns 'close' rather than a score, the threshold is generous, and
 * nothing anywhere calls the result correct. A product that tells somebody their
 * pronunciation is wrong on this evidence would be lying with a number.
 */

import { track } from './analytics'

/*
  THE BROWSER'S OWN TYPES DO NOT SHIP THIS.

  SpeechRecognition is not in lib.dom — it is a draft spec that every engine implements
  and TypeScript does not describe. Declared minimally here rather than pulled in as a
  dependency: only the five members this file touches, so the shape cannot drift from the
  use and there is nothing to keep updated.
*/
interface Spoken {
  transcript: string
}
interface SpokenResult {
  readonly length: number
  [i: number]: Spoken
}
interface SpokenEvent {
  results: { readonly length: number; [i: number]: SpokenResult }
}
interface Recogniser {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SpokenEvent) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

/** What the browser calls it, which is not the same everywhere. */
function ctor(): (new () => Recogniser) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => Recogniser
    webkitSpeechRecognition?: new () => Recogniser
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Can this device listen at all?
 *
 * Asked before anything is drawn, because the honest answer to "no" is to draw nothing
 * rather than to offer a control that fails when pressed. Safari on iOS has shipped this
 * since 14.5 and Chrome has it everywhere; Firefox does not, and a learner there keeps
 * the self-report.
 */
export function canListen(): boolean {
  return Boolean(ctor())
}

export interface Heard {
  /** What the browser thought it heard, for showing back. */
  said: string
  /**
   * Why nothing came back, where that is knowable and worth saying.
   *
   * 'blocked' is the microphone being refused — a fact about the device that the learner
   * can act on, and the one case where "we did not catch it" would be a lie. Absent means
   * the ordinary outcome: it listened and heard nothing it could use.
   */
  why?: 'blocked'
  /** Whether it is close enough to count — never a score. See `near`. */
  close: boolean
  /** 0–1, for deciding how warmly to respond. Not shown as a number. */
  score: number
}

/**
 * Strip everything that is not the word.
 *
 * Accents come off because a recognisers's idea of `está` versus `esta` is not a fact
 * about the speaker, and punctuation goes because nobody pronounces a full stop. What is
 * left is the sound of the sentence, which is the only thing being compared.
 */
function bare(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * How many single-letter changes turn one word into the other.
 *
 * Only ever called on two words, which is why the simple two-row table is the right shape
 * — no word in this product is long enough for the allocation to matter, and the version
 * that builds a full matrix is harder to read for no gain.
 */
function edits(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = row
  }
  return prev[b.length]
}

/**
 * How close two sentences are, 0 to 1.
 *
 * WORD OVERLAP RATHER THAN EDIT DISTANCE, and the reason is what this is judging. A
 * recogniser hearing "sou escocesa" as "sou escossesa" has understood the learner
 * perfectly and spelled it its own way; one hearing "bom dia" has not. Letters would
 * punish the first as hard as the second. Words are the unit the learner produced.
 *
 * Short answers are common here — "sim", "obrigada" — so a single wrong word must not
 * round to zero on a two-word sentence. The ratio is over the EXPECTED words, so saying
 * more than was asked costs nothing: somebody who answers "sou casado, sim" has said the
 * thing.
 */
export function near(saidRaw: string, wantRaw: string): number {
  const said = bare(saidRaw).split(' ').filter(Boolean)
  const want = bare(wantRaw).split(' ').filter(Boolean)
  if (!want.length) return 0
  const pool = [...said]
  let hit = 0
  for (const w of want) {
    const at = pool.indexOf(w)
    if (at >= 0) {
      hit += 1
      pool.splice(at, 1)
      continue
    }
    /*
      A NEAR MISS STILL COUNTS, because the recogniser is the unreliable half.

      "trabalho" heard as "trabalhou" is the learner being understood and the browser
      guessing a tense; "sou casado" heard as "so cassado" is the same thing on shorter
      words. A prefix rule catches the first and missed the second entirely — measured:
      it scored zero, which would have told somebody who said the sentence correctly that
      they had not.

      So closeness is per-word edit distance, which handles both without caring how long
      the word is. One edit in three letters is a different thing from one in eight, so
      the allowance scales: a quarter of the word's own length, rounded up, and at least
      one. `so`/`sou` and `cassado`/`casado` pass; `sim`/`não` does not.
    */
    const loose = pool.findIndex((p) => {
      const room = Math.max(1, Math.ceil(Math.max(w.length, p.length) / 4))
      return edits(w, p) <= room
    })
    if (loose >= 0) {
      /*
        THREE QUARTERS, NOT A HALF.

        At a half, a sentence the recogniser heard imperfectly in EVERY word scored 0.50
        and failed — "so cassado" for "sou casado", which is somebody saying it correctly
        into a browser that spells badly. The whole point of the near-miss rule is that
        the recogniser is the unreliable half, so a near miss has to be worth more than a
        coin toss or the rule cannot carry a short sentence on its own.
      */
      hit += 0.75
      pool.splice(loose, 1)
    }
  }
  const score = Math.min(1, hit / want.length)

  /*
    AND THE NEGATIVE IS NOT OPTIONAL.

    "sou casado" scored 0.67 against "Não sou casado" — a pass, for a sentence that means
    the opposite. Word overlap cannot see this: dropping one short word out of three is
    arithmetically a small miss and semantically the whole sentence.

    So a `não` in the target that is absent from what was said fails outright, whatever
    else matched. The reverse is left alone: somebody who says "não sou casado" when asked
    for "sou casado" has said something true about themselves, and this is not a grammar
    test.
  */
  const wantsNot = want.includes('nao')
  const saidNot = said.includes('nao')
  if (wantsNot && !saidNot) return 0

  return score
}

/** Generous on purpose — see the note at the top of this file. */
export const CLOSE_ENOUGH = 0.6

/**
 * Listen once, and say how close it was.
 *
 * CALLED INSIDE THE TAP, never after an await. iOS grants microphone access to the
 * gesture that asked for it and takes it back the moment control returns to the browser —
 * the same rule engine/audio.ts documents for speech synthesis, and the same bug waiting
 * for anybody who awaits something first.
 *
 * Resolves rather than rejects when nothing is heard: silence is an ordinary outcome of
 * pointing a microphone at a person, not an error worth a red screen.
 */
export function listenFor(want: string, opts: { lang?: string } = {}): Promise<Heard | null> {
  const Rec = ctor()
  if (!Rec) return Promise.resolve(null)

  return new Promise<Heard | null>((resolve) => {
    let settled = false
    const done = (h: Heard | null) => {
      if (settled) return
      settled = true
      resolve(h)
    }

    const rec = new Rec()
    rec.lang = opts.lang ?? 'pt-PT'
    /* One shot. A continuous session would keep the microphone open after the answer. */
    rec.continuous = false
    rec.interimResults = false
    /*
      Three guesses rather than one. The top result is often a confident English reading
      of Portuguese — "so cassado" for "sou casado" — while the second is right, so all of
      them are scored and the best is taken.
    */
    rec.maxAlternatives = 3

    /*
      HELD, NOT SETTLED, because onend can beat onresult to the finish.

      Sam: "when I speak into the phone there is no resolution. I say something and there
      is no response." This is why. `onend` fires on every session close — including the
      one that follows a perfectly good result — and it called done(null). The two are
      separate events with no guaranteed order, so on any build where the session closes as
      the transcript is delivered, the answer was thrown away and the control fell back to
      idle having heard the learner correctly.

      Traced by running the settle order both ways: result-then-end returns the answer,
      end-then-result returns null. On iOS the second is common.

      So the result is kept here and the promise is settled by whichever event is last. A
      transcript that arrives at all is used, whenever it arrives.
    */
    let held: Heard | null = null
    rec.onresult = (e: SpokenEvent) => {
      const first = e.results[0]
      const alts: string[] = []
      for (let i = 0; i < (first?.length ?? 0); i++) alts.push(first[i].transcript)
      let best = ''
      let score = 0
      for (const a of alts) {
        const s = near(a, want)
        if (s > score) {
          score = s
          best = a
        }
      }
      held = { said: (best || alts[0] || '').trim(), close: score >= CLOSE_ENOUGH, score }
      track('said_aloud', { close: held.close, score: Math.round(score * 100) })
      /*
        Settled here too, so a session that never ends — which happens when the tab is
        backgrounded mid-utterance — still answers the moment it has something to say.
      */
      done(held)
    }
    /*
      A REFUSED MICROPHONE IS NOT SILENCE.

      The error was discarded, so a learner who had denied permission — or never been asked,
      which is what an iOS install does until the first prompt — saw exactly what somebody
      who mumbled saw. Nothing to act on, and the product apparently ignoring them.

      Only the two that mean "the device said no" are reported. 'no-speech' and 'aborted'
      are ordinary and stay quiet; inventing a reason for those would be worse than none.
    */
    rec.onerror = (e: { error?: string }) => {
      if (held) return done(held)
      const why = e?.error === 'not-allowed' || e?.error === 'service-not-allowed'
      done(why ? { said: '', close: false, score: 0, why: 'blocked' } : null)
    }
    /*
      END WAITS A BEAT FOR A RESULT THAT IS STILL COMING.

      Settling on `end` with whatever is held fixes result-then-end and does nothing for
      end-then-result — measured, and the second is the ordering that produces "I say
      something and there is no response". The session closes, the transcript is delivered
      a tick later, and by then the promise has already answered null.

      So a session that ends with nothing held gives the transcript one more frame to
      arrive before giving up. 250ms is imperceptible to somebody who has just stopped
      talking and long enough for a result already in flight; if nothing comes, the answer
      is the same null it would have been.
    */
    rec.onend = () => {
      if (held) return done(held)
      window.setTimeout(() => done(held), 250)
    }

    try {
      rec.start()
    } catch {
      /* Already running, or the device refused. Either way there is nothing to hear. */
      done(null)
    }

    /*
      A HARD STOP, because onend is not guaranteed.

      Some builds leave a recogniser open when the tab loses focus mid-utterance, and a
      promise that never settles leaves the control spinning for ever. Six seconds is
      longer than any sentence in the product.
    */
    window.setTimeout(() => {
      try {
        rec.stop()
      } catch {
        /* Already stopped. */
      }
      done(held)
    }, 6000)
  })
}

/**
 * WHICH WORDS DID NOT LAND.
 *
 * Sam: "Is there any way we can get the feedback a bit more advanced on the audio? At the
 * moment it says just not quite."
 *
 * A band says how close; this says where. The run-through can now point at the one or two
 * words that went missing rather than handing back a verdict on the whole sentence, which
 * is the difference between feedback and a mark.
 *
 * THE SAME MATCHING AS `near`, DELIBERATELY DUPLICATED IN SHAPE AND NOT IN EFFECT. Both
 * walk the expected words against a consumable pool, take an exact hit first and a
 * per-word edit-distance miss second, with the same quarter-length allowance. If the two
 * drifted apart the screen would highlight a word the scorer had already forgiven — the
 * most confusing possible feedback, because it would be telling somebody to fix a word
 * that was never counted against them. Any change to the loop in `near` belongs here too.
 *
 * It returns the words AS WRITTEN in the target, accents and all, rather than the bare
 * forms it compares — somebody aiming at a word needs to see the word, not its skeleton.
 */
export function missedWords(saidRaw: string, wantRaw: string): string[] {
  const said = bare(saidRaw).split(' ').filter(Boolean)
  /*
    Kept in step: the bare forms are what get compared, the originals are what get shown,
    and they are zipped by index because `bare` only ever maps one word to one word.
  */
  const originals = wantRaw.split(/\s+/).filter(Boolean)
  const want = originals.map((w) => bare(w))
  const pool = [...said]
  const missed: string[] = []

  want.forEach((w, idx) => {
    if (!w) return
    const at = pool.indexOf(w)
    if (at >= 0) {
      pool.splice(at, 1)
      return
    }
    const loose = pool.findIndex((pw) => {
      const room = Math.max(1, Math.ceil(Math.max(w.length, pw.length) / 4))
      return edits(w, pw) <= room
    })
    if (loose >= 0) {
      pool.splice(loose, 1)
      return
    }
    /* Punctuation off, because "casado," is not a word somebody can aim at. */
    const shown = (originals[idx] ?? '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    if (shown) missed.push(shown)
  })

  return missed
}

/**
 * How close, as a band rather than a number.
 *
 * FOUR, AND THE BOUNDARIES ARE WHERE THE ADVICE CHANGES rather than at round numbers.
 * CLOSE_ENOUGH (0.6) is a pass and stays exactly where it was — this adds no strictness
 * anywhere, it only subdivides what used to be one undifferentiated "not quite".
 *
 *   · 'got'    — at or above the pass mark. Counted, proof recorded, ping played.
 *   · 'nearly' — 0.4 up to the pass. Most of the sentence arrived; saying it again is
 *                genuinely likely to land it, so that is what the copy asks for.
 *   · 'some'   — 0.15 up to 0.4. The shape is there and the words are not, which is a
 *                different problem and wants the answer on screen.
 *   · 'no'     — below 0.15, or nothing recognised at all. Not a telling-off: at this
 *                level the most likely explanation is the microphone or the room.
 */
export type Band = 'got' | 'nearly' | 'some' | 'no'

export function bandFor(h: Heard): Band {
  if (h.close) return 'got'
  if (!h.said) return 'no'
  if (h.score >= 0.4) return 'nearly'
  if (h.score >= 0.15) return 'some'
  return 'no'
}
