'use client'

import { useEffect } from 'react'
import { buzz, tap } from '@/engine/tap'

/**
 * Every control in DUB makes the same small sound, from one listener.
 *
 * Delegated rather than wired into each button, and that is a design decision rather than
 * a shortcut. There are well over a hundred pressable things in this product and any
 * scheme that needs each one to remember something ends up with a handful that do not —
 * which is worse than no sound at all, because a control that is silent when its
 * neighbours are not reads as broken rather than quiet.
 *
 * `.tap-target` is the marker DUB already uses for "a thing a person presses", so the rule
 * is exactly "if it is pressable, it confirms". Two exceptions, both because they make
 * their own sound: the audio buttons, and anything inside the translator's result while it
 * is speaking.
 *
 * pointerdown, not click. The confirmation has to arrive with the finger — a sound on
 * click lands after the release, which is up to 200ms later on a slow tap and reads as a
 * lag in the app rather than a response to the press.
 */
export function Tap() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.tap-target')
      if (!el) return
      // A disabled control did not do anything, so it should not sound as though it did.
      if (el.matches('[disabled], [aria-disabled="true"]')) return
      if (el.closest('[data-testid="audio"]')) return
      /*
        WHAT WAS ON SCREEN WHEN THE LAST THING WAS PRESSED.

        A crash record written from app/error.tsx sees the DOM AFTER the boundary has
        already replaced the card — it captured "error-retry error-out error-digest",
        which describes the error screen and not the fault. By then the evidence is gone.

        So the last press is remembered here, on the one listener that already runs for
        every tap in the product. A crash almost always follows a press, so this is the
        screen that broke and the control that broke it — and unlike a stack it cannot be
        minified away, which matters because Vercel answers 403 to every sourcemap.

        Cheap: two attribute reads and a sessionStorage write per tap, and the whole thing
        is in a try/catch because a diagnostic that throws is the one bug nobody can see.
      */
      try {
        sessionStorage.setItem(
          'byheart.lastpress',
          JSON.stringify({
            testid: el.getAttribute('data-testid') ?? '',
            label: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
            onScreen: Array.from(document.querySelectorAll('[data-testid]'))
              .map((n) => n.getAttribute('data-testid'))
              .filter(Boolean)
              .slice(0, 30)
              .join(' '),
          }),
        )
      } catch {
        /* Storage unavailable. The sound below still happens, which is the job here. */
      }
      tap()
      buzz()
    }
    /*
      Capture, so a handler that stops propagation cannot silence the press.

      Several controls call stopPropagation for their own reasons — the feed's rail, the
      tile pool — and a bubbling listener would go quiet on exactly the screens with the
      most tapping on them.
    */
    window.addEventListener('pointerdown', onDown, { capture: true, passive: true })
    return () => window.removeEventListener('pointerdown', onDown, { capture: true })
  }, [])

  return null
}
