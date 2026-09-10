'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * When a card throws, one card is missing — not the whole product.
 *
 * THERE WAS NO BOUNDARY ANYWHERE. A grep of app/, components/, engine/ and lib/ for
 * error.tsx, global-error, componentDidCatch, getDerivedStateFromError and ErrorBoundary
 * returned nothing, so any throw from any card took the entire screen with it and left no
 * trace. Reported as "the CTA blew up to a white screen", and the reason it could not be
 * retraced is that a white screen is all a React render error leaves behind.
 *
 * This does not stop the throw. It makes the throw legible: the learner gets a screen that
 * says what happened and offers the way back, and `digest` gives the one identifier that
 * ties a report to a server log. That is the difference between "it broke" and a bug that
 * can be found.
 *
 * DUB'S OWN VOICE, not a stack trace. Somebody who hits this is standing in a café with a
 * phone; they need a way out, not an apology and not diagnostics. The message says what is
 * true — this screen, not their work — because losing a Legend is the fear an error screen
 * creates whether or not it is warranted, and here it is not: everything is on the device.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    /*
      To the console, where the browser's own reporting can see it. Not to an endpoint:
      DUB has no error service, and inventing one here would be a network call on the one
      screen that already knows something is wrong.
    */
    console.error('[dub] render failed', error.digest ?? '', error)
  }, [error])

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-5"
    >
      <p className="eyebrow text-accent">NOT THAT ONE</p>
      <h1 className="display text-balance text-3xl">This card broke. Nothing else did.</h1>
      <p className="text-sm leading-relaxed text-muted">
        Your Portuguese, your Legend and everything you have kept are on your phone and
        untouched. Try again, or go back to the shelf and pick something else.
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          data-testid="error-retry"
          onClick={reset}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          TRY AGAIN
        </button>
        <Link
          href="/vibes"
          data-testid="error-out"
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
        >
          YOUR VIBES
        </Link>
      </div>

      {/*
        The digest, quietly. It is the only thing that connects what somebody saw to what
        the server recorded, and asking for it later is asking somebody to reproduce a
        crash they cannot reproduce.
      */}
      {error.digest ? (
        <p className="pt text-center text-xs text-muted" data-testid="error-digest">
          {error.digest}
        </p>
      ) : null}
    </main>
  )
}
