'use client'

import { useEffect, useRef, useState } from 'react'
import { AudioButton } from '@/components/AudioButton'
import { Tick } from '@/components/Tick'
import { slugFor } from '@/content/audio-manifest'
import { clubOpen } from '@/content/legend'
import { registerFor } from '@/content/roots'
import { rungReached } from '@/content/roots'
import { track } from '@/engine/analytics'
import { keepAsk, loadLearner } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'

/**
 * "How do I say…", from anywhere, once you are in the Club.
 *
 * The gap this closes is the one every learning product leaves open: DUB decides what to
 * teach, and a person standing at a counter needs a sentence DUB has not got to yet. Until
 * now the only honest answer was to leave and open Google Translate — which is where a
 * learner discovers that the internet's Portuguese is Brazilian, and takes it back to a
 * conversation in Lisbon.
 *
 * Floating rather than a fifth tab, because the four tabs are places you go and this is
 * something you do while you are somewhere. A tab would also make it a destination, and a
 * translator you have to navigate to is a translator you use instead of DUB rather than
 * inside it.
 *
 * Gated on the Club for two reasons that happen to agree. It is a metered API and the gate
 * is the cheapest possible protection against a stranger spending money; and a learner in
 * their first twenty minutes is meant to be finding out that they can already say more
 * than they thought, which is exactly the discovery a translate box is best at ruining.
 */
type Result = { pt: string; en: string; note: string; id: number | null; left: number }

export function Translator() {
  const learner = useLearner()
  const [on, setOn] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'asking' | 'done' | 'failed'>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [why, setWhy] = useState('')
  const [kept, setKept] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)

  /*
    The server decides whether this exists.

    Only it knows whether an API key is configured, and a floating button that opens a
    panel which can only apologise is worse than no button — it costs a tap and teaches
    somebody the product is broken.
  */
  useEffect(() => {
    let live = true
    fetch('/api/translate')
      .then((r) => r.json())
      .then((d: { on?: boolean }) => {
        if (live) setOn(Boolean(d.on))
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])

  const answered = (learner.legend ?? []).filter((a) => Object.keys(a.values).length > 0)
  const member = clubOpen({
    answeredFrameIds: answered.map((a) => a.frame_id),
    answers: learner.legend ?? [],
    rung: rungReached(learner.proof),
    welcomedAt: learner.club_welcomed_at,
    purpose: learner.purpose,
  })

  useEffect(() => {
    if (open) box.current?.focus()
  }, [open])

  // Esc closes, because a panel over the whole screen that only closes by aiming at a
  // small X is a panel people learn to avoid opening.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!on || !member) return null

  async function ask() {
    const asking = text.trim()
    if (!asking || state === 'asking') return
    setState('asking')
    setWhy('')
    setKept(false)
    track('translate_ask', { chars: asking.length })
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: asking,
          // The same register the lessons are teaching this learner. A translator that
          // hands back você to somebody being taught tu contradicts the screen they were
          // on ninety seconds ago.
          register: registerFor(loadLearner().profile?.age_band),
        }),
      })
      const data = (await res.json()) as Result & { error?: string; why?: string }
      if (!res.ok || data.error) {
        setWhy(data.why ?? 'Could not reach the translator.')
        setState('failed')
        return
      }
      setResult(data)
      setState('done')
    } catch {
      setWhy('No connection. This one needs the internet.')
      setState('failed')
    }
  }

  function keep() {
    if (!result || kept) return
    keepAsk({ pt: result.pt, en: result.en, note: result.note })
    setKept(true)
    track('translate_kept', {})
    // Best-effort, and never blocking: the sentence is already on the learner's device.
    if (typeof result.id === 'number') {
      void fetch('/api/translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ keep: result.id }),
      }).catch(() => {})
    }
  }

  function again() {
    setText('')
    setResult(null)
    setKept(false)
    setState('idle')
    box.current?.focus()
  }

  if (!open) {
    return (
      <button
        type="button"
        data-testid="translator-open"
        onClick={() => {
          setOpen(true)
          track('translate_opened', {})
        }}
        aria-label="How do I say something"
        /*
          Above the bar, clear of the dock, on the side a thumb reaches.

          It sits at the nav's height plus a step so it never covers a docked button, and
          z-30 keeps it under the bar rather than over it — a floating control that hides
          navigation is a floating control people resent.
        */
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 6h10M9 4v2c0 4-2.5 7-5 8M7 11c1.5 3 4 5 6 5.5" />
          <path d="M13 20l4-9 4 9M14.5 17h5" />
        </svg>
      </button>
    )
  }

  return (
    <div
      data-testid="translator"
      role="dialog"
      aria-modal="true"
      aria-label="How do I say"
      className="fixed inset-0 z-50 flex flex-col bg-bg text-fg"
    >
      <header className="bar flex items-center justify-between gap-3 px-5 py-3">
        <p className="eyebrow">HOW DO I SAY</p>
        <button
          type="button"
          data-testid="translator-close"
          onClick={() => setOpen(false)}
          className="tap-target eyebrow px-2 opacity-80"
        >
          CLOSE
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
        <div className="flex flex-col gap-3">
          <label htmlFor="ask" className="text-sm text-muted">
            In English, or in Portuguese if you want it checked.
          </label>
          <textarea
            id="ask"
            ref={box}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends. A translator is one line, and a newline in it means nothing.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void ask()
              }
            }}
            rows={3}
            maxLength={300}
            data-testid="translator-input"
            placeholder="I'd like to pay by card"
            className="w-full rounded border border-line bg-surface px-4 py-3 text-base text-fg outline-none focus:border-accent"
          />
        </div>

        {state === 'asking' ? <p className="text-sm text-muted">Asking…</p> : null}

        {state === 'failed' ? (
          <p data-testid="translator-why" className="text-sm text-coach">
            {why}
          </p>
        ) : null}

        {state === 'done' && result ? (
          <div data-testid="translator-result" className="flex flex-col gap-3">
            {/* Their own words, quietly, above the answer — so what they asked for and
                what they got can be read together. */}
            <p className="text-sm text-muted">“{result.en}”</p>
            {result.pt ? (
              <>
                <div className="animate-bank flex items-center gap-3 rounded border border-correct/40 bg-correct/10 px-4 py-3">
                  <AudioButton slug={slugFor(result.pt)} text={result.pt} size="sm" />
                  <span className="pt min-w-0 flex-1 text-lg">{result.pt}</span>
                  <Tick className="text-correct" />
                </div>
                {result.note ? (
                  <p className="text-sm leading-relaxed text-muted">{result.note}</p>
                ) : null}
              </>
            ) : (
              /* The model was asked to refuse by returning no Portuguese and a reason.
                 Shown as written rather than dressed up as an error. */
              <p className="text-sm text-coach">{result.note || 'Nothing to translate there.'}</p>
            )}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3">
          {state === 'done' && result?.pt ? (
            <>
              <button
                type="button"
                data-testid="translator-keep"
                onClick={keep}
                disabled={kept}
                className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
              >
                {kept ? 'KEPT' : 'KEEP THIS'}
              </button>
              <button
                type="button"
                data-testid="translator-again"
                onClick={again}
                className="tap-target eyebrow w-full rounded border border-line-strong px-5 py-3 text-muted"
              >
                ASK ANOTHER
              </button>
            </>
          ) : (
            <button
              type="button"
              data-testid="translator-ask"
              onClick={ask}
              disabled={!text.trim() || state === 'asking'}
              className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
            >
              {state === 'asking' ? 'ASKING' : 'SAY IT IN PORTUGUESE'}
            </button>
          )}
          {kept ? (
            <p className="text-xs leading-relaxed text-muted">
              Kept. It is with your sentences, and it will come back around.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
