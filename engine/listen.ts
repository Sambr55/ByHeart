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
  onerror: (() => void) | null
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
      const heard = { said: (best || alts[0] || '').trim(), close: score >= CLOSE_ENOUGH, score }
      track('said_aloud', { close: heard.close, score: Math.round(score * 100) })
      done(heard)
    }
    rec.onerror = () => done(null)
    rec.onend = () => done(null)

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
      done(null)
    }, 6000)
  })
}
