'use client'

import { useEffect, useRef, useState } from 'react'
import { canListen, listenFor, type Heard } from '@/engine/listen'
import { missed as missedSound, ping } from '@/engine/tap'

/**
 * SAY IT — the third thing you can do with a Portuguese line.
 *
 * Sam: "listen, copy or say." Hearing it and taking it away were both possible; the one
 * act the product is actually for — producing the sentence — had nothing beside them.
 *
 * WHAT IT CLAIMS, which is deliberately little. Browser recognition of a beginner's
 * Portuguese is a rough instrument, so this reports "close" and never a score, never a
 * percentage, and never that something was wrong. A miss says the recogniser did not
 * catch it, which is honest about where the uncertainty lives: the learner may have said
 * it perfectly to a browser that mishears accents for a living.
 *
 * NOT DRAWN WHERE IT CANNOT WORK. canListen() is false on browsers without the API and
 * this renders nothing — the surrounding beat keeps whatever it had before, which on the
 * cold routes is the self-report. Nobody is offered a control that fails when pressed.
 *
 * STARTED INSIDE THE TAP. iOS grants the microphone to the gesture that asked for it and
 * takes it back the moment control returns to the browser, so nothing is awaited before
 * listenFor runs — the same rule engine/audio.ts records for speech synthesis, learned
 * there the expensive way.
 */
/**
 * Whether this device can listen, after mount.
 *
 * Exported because a caller needs it too: the SAY button hides itself where recognition
 * is absent, but the sentence NEXT to it — "Say it out loud, or build it below" — would
 * be left pointing at nothing. Measured: 0 buttons and the caption still there.
 */
export function useCanListen(): boolean {
  const [able, setAble] = useState(false)
  useEffect(() => setAble(canListen()), [])
  return able
}

export function SayButton({
  want,
  size = 'md',
  onHeard,
}: {
  /** The sentence they are being asked to say. */
  want: string
  /*
    `lg` is the run-through, where the microphone is the control rather than an ornament
    beside one. Sam: "the say it loud gives no indication it is listening or has heard" —
    half of that was feedback and half was that a 44px circle next to a full-width button
    does not read as the thing you are meant to press.
  */
  size?: 'sm' | 'md' | 'lg'
  /** Told what happened, so the beat around it can record or move on. */
  onHeard?: (h: Heard) => void
}) {
  const [able, setAble] = useState(false)
  const [state, setState] = useState<'idle' | 'listening' | 'close' | 'missed' | 'blocked'>(
    'idle',
  )
  const alive = useRef(true)

  /*
    Asked after mount, like everything else that reads the browser. A server render has no
    window, and branching on it during render is the hydration mismatch this codebase has
    paid for more than once.
  */
  useEffect(() => {
    /*
      SET LIVE AGAIN ON EVERY MOUNT, and the missing line was a real bug.

      `alive.current` starts true, the cleanup sets it false, and nothing ever set it back —
      so in Strict Mode, where React deliberately mounts, unmounts and remounts every
      effect in development, the cleanup ran once and the button was dead for the rest of
      the session. Every result came back from the recogniser and was dropped by the
      `if (!alive.current) return` guard: no tick, no feedback panel, no proof row, and
      (once it existed) no auto-advance.

      Found by driving the run-through in a browser with a fake recogniser that always
      agrees — the transcript arrived, the state never changed. It would have looked exactly
      like the recogniser failing, which is the kind of bug that gets blamed on the device.
    */
    alive.current = true
    setAble(canListen())
    return () => {
      alive.current = false
    }
  }, [])

  if (!able) return null

  const dim = size === 'sm' ? 'h-11 w-11' : size === 'lg' ? 'h-24 w-24' : 'h-12 w-12'
  /* The glyph follows the button, or `lg` is a small microphone in a large circle. */
  const glyph = size === 'lg' ? 'h-10 w-10' : 'h-5 w-5'

  return (
    <button
      type="button"
      data-testid="say-it"
      aria-label={
        state === 'listening'
          ? 'Listening'
          : state === 'blocked'
            ? 'The microphone is blocked'
            : state === 'missed'
              ? 'Not caught — try again'
              : 'Say it'
      }
      title={state === 'blocked' ? 'DUB cannot hear the microphone. Allow it in your browser settings.' : undefined}
      disabled={state === 'listening'}
      onClick={() => {
        setState('listening')
        /* No await before this line — see the note on the iOS gesture rule above. */
        void listenFor(want).then((h) => {
          if (!alive.current) return
          if (!h) {
            /*
              SILENCE IS AN ATTEMPT, AND THE CARD HAS TO HEAR ABOUT IT.

              Sam: "im not getting any of the feedback or narrative and cant get any of my
              attempts to pass."

              This set the button's own state and returned, so `onHeard` never fired —
              which meant the card around it learned NOTHING. No verdict panel, no attempt
              counted, no third-go encouragement, no five-fail message. Every piece of
              feedback this product has is driven by that callback, and the commonest
              outcome on a phone in a quiet room skipped it entirely: the recogniser ends
              having heard nothing and resolves null.

              So a null becomes what it actually is — an attempt that produced no words —
              and travels like any other. The card already renders exactly this: see
              `run_missed`, "DID NOT CATCH IT", which until now could only appear when the
              recogniser returned an empty string rather than nothing at all.
            */
            setState('missed')
            onHeard?.({ said: '', close: false, score: 0 })
          } else if (h.why === 'blocked') {
            /*
              The device refused the microphone, which is a different thing from not
              hearing anything — and the only one the learner can do something about. Not
              passed to onHeard: nothing was said, so nothing should be recorded.
            */
            setState('blocked')
            /*
              AND A REFUSED MICROPHONE REACHES THE CARD TOO, flagged so it is not counted
              as a go. The button's own title attribute explains this and a phone never
              shows a title — so the one failure the learner can actually DO something
              about was the one the product said nothing about.
            */
            onHeard?.(h)
          } else {
            setState(h.close ? 'close' : 'missed')
            /*
              HEARD, AND HEARD. Sam: "when an audio is correct it needs to have a subtle
              ping for success sound."

              Here rather than in the run-through, because every one of these buttons is
              marking the same act and a success that only sounds on one screen would be a
              reward for being in the right place. It rides engine/tap's switch like the
              press does — see the note on `ping` for why this sound exists at all when
              the tick is right there on the button.
            */
            if (h.close) ping()
            /*
              AND A MISS SAYS SO. Sam: "we also need a failed noise." Only where something
              was actually heard and judged — silence already has the ear-with-a-line
              through it, and a sound for "I heard nothing" would fire every time somebody
              tapped the microphone by accident. See `missed` in engine/tap for why this is
              not the rejection sound.
            */
            else if (h.said) missedSound()
            onHeard?.(h)
          }
          /*
            Held long enough to be read. 1600ms was tuned for a tick, which is instantly
            legible; a miss has to be noticed AND understood before it clears, or it reads
            as a flicker.
          */
          window.setTimeout(() => {
            if (alive.current) setState('idle')
          }, 2600)
        })
      }}
      className={
        'tap-target flex shrink-0 items-center justify-center rounded-full border transition ' +
        dim +
        (state === 'listening'
          ? ' listening border-accent bg-accent/15 text-accent'
          : state === 'close'
            /*
              GREEN, NOT AZULEJO. Sam: "make the success icon white tick on green."

              It was accent-on-accent-ink — the same blue as the Portuguese, the header and
              every CTA in the product. So the one mark that means "you said it" looked
              like every other filled button, and the tick was doing all the work. Green is
              the only colour here that means a single thing, and `--correct` already
              carried it. The ink is paired per theme: see the note on --correct-ink, white
              on the light green and dark ink on the pale one.
            */
            ? ' border-correct bg-correct text-correct-ink'
            : state === 'missed' || state === 'blocked'
              ? ' border-line-strong text-muted'
              : ' border-line text-muted hover:border-accent/50')
      }
    >
      {state === 'close' ? (
        /* A tick, for the one outcome worth marking. */
        <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : state === 'missed' || state === 'blocked' ? (
        /*
          AND A MISS LOOKS LIKE SOMETHING.

          Sam: "when I speak into the phone there is no resolution. I say something and
          there is no response." Half of that was a real bug in the recogniser; the other
          half is this — `missed` drew the same microphone as `idle`, tinted, so a miss was
          indistinguishable from nothing having happened at all.

          An ear with a line through it: the product did not catch it, which is the honest
          claim. Never a cross, because a cross says the learner was wrong and the browser
          is the unreliable half here.
        */
        <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
          <path d="M4 4l16 16" strokeLinecap="round" />
        </svg>
      ) : (
        /* A microphone, which is the same shape whether it is idle or listening. */
        <svg viewBox="0 0 24 24" className={glyph} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
          <path d="M12 18v3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
