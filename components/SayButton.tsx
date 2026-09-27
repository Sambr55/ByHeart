'use client'

import { useEffect, useRef, useState } from 'react'
import { canListen, listenFor, type Heard } from '@/engine/listen'

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
  size?: 'sm' | 'md'
  /** Told what happened, so the beat around it can record or move on. */
  onHeard?: (h: Heard) => void
}) {
  const [able, setAble] = useState(false)
  const [state, setState] = useState<'idle' | 'listening' | 'close' | 'missed'>('idle')
  const alive = useRef(true)

  /*
    Asked after mount, like everything else that reads the browser. A server render has no
    window, and branching on it during render is the hydration mismatch this codebase has
    paid for more than once.
  */
  useEffect(() => {
    setAble(canListen())
    return () => {
      alive.current = false
    }
  }, [])

  if (!able) return null

  const dim = size === 'sm' ? 'h-11 w-11' : 'h-12 w-12'

  return (
    <button
      type="button"
      data-testid="say-it"
      aria-label={state === 'listening' ? 'Listening' : 'Say it'}
      disabled={state === 'listening'}
      onClick={() => {
        setState('listening')
        /* No await before this line — see the note on the iOS gesture rule above. */
        void listenFor(want).then((h) => {
          if (!alive.current) return
          if (!h) {
            setState('missed')
          } else {
            setState(h.close ? 'close' : 'missed')
            onHeard?.(h)
          }
          window.setTimeout(() => {
            if (alive.current) setState('idle')
          }, 1600)
        })
      }}
      className={
        'tap-target flex shrink-0 items-center justify-center rounded-full border transition ' +
        dim +
        (state === 'listening'
          ? ' animate-pulse border-accent bg-accent/15 text-accent'
          : state === 'close'
            ? ' border-accent bg-accent text-accent-ink'
            : state === 'missed'
              ? ' border-line-strong text-muted'
              : ' border-line text-muted hover:border-accent/50')
      }
    >
      {state === 'close' ? (
        /* A tick, for the one outcome worth marking. */
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        /* A microphone, which is the same shape whether it is idle or listening. */
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
          <path d="M12 18v3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  )
}
