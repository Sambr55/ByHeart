'use client'

import { useEffect, useRef, useState } from 'react'
import { track } from '@/engine/analytics'
import { tap } from '@/engine/tap'

/**
 * Take the Portuguese with you.
 *
 * WHY IT SITS WHERE THE SPEAKER SITS. Audio and copy are the same idea wearing two faces:
 * this is a thing you carry out of the app. You hear it to say it; you copy it to send it,
 * to paste it into a message, to put it in a note for the counter you are walking towards.
 * So wherever a sentence can be played it can now also be taken, and the two controls
 * bracket the line rather than living in different parts of the product.
 *
 * IT COPIES THE PORTUGUESE AND NOTHING ELSE. Not the English, not the note, not "pt — en".
 * Somebody pasting this into a message is sending the sentence, and a paste that arrives
 * with a translation attached says "I looked this up" — which is exactly what DUB is for
 * them not to have to say.
 *
 * THE CONFIRMATION IS THE POINT. A copy that gives no feedback is indistinguishable from a
 * copy that failed, and the clipboard is invisible by definition — so the icon becomes a
 * tick for a moment. Same acknowledgement the banked row uses, for the same reason: it
 * happened, and nothing is being celebrated.
 */
export function CopyButton({
  text,
  size = 'md',
  label,
}: {
  /** The Portuguese, exactly as it should arrive in somebody else's message. */
  text: string
  size?: 'sm' | 'md'
  /** Overrides the accessible name where the surrounding row already says what this is. */
  label?: string
}) {
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-12 w-12'

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  async function copy() {
    /*
      Two ways, because the good one is not always there.

      navigator.clipboard needs a secure context and, on some iOS versions, a gesture the
      browser agrees was a gesture. The execCommand fallback is deprecated and works
      everywhere that matters, so a phone that refuses the modern API still gets the
      sentence rather than a control that silently does nothing.
    */
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      try {
        const el = document.createElement('textarea')
        el.value = text
        el.setAttribute('readonly', '')
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        ok = document.execCommand('copy')
        document.body.removeChild(el)
      } catch {
        ok = false
      }
    }
    if (!ok) return
    tap()
    track('sentence_copied', { chars: text.length })
    setDone(true)
    if (timer.current) clearTimeout(timer.current)
    /* Long enough to be read as an answer, short enough that the row goes back to normal. */
    timer.current = setTimeout(() => setDone(false), 1200)
  }

  return (
    <button
      type="button"
      data-testid="copy-pt"
      aria-label={done ? 'Copied' : (label ?? 'Copy the Portuguese')}
      onClick={copy}
      className={
        dim +
        ' tap-target inline-flex shrink-0 items-center justify-center rounded-full text-muted transition active:scale-95'
      }
    >
      {done ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-correct" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" />
        </svg>
      )}
    </button>
  )
}
