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
    /*
      AND ONTO THE RECORD, because the console is not reachable from a phone.

      Sam hit this screen mid-run and the only thing it showed was the apology — no
      digest, because a digest is a SERVER fact and this was a client render. So the crash
      could not be retraced at all: not from the screenshot, not from the device, not
      afterwards. Four separate attempts to reproduce it from the outside found nothing,
      which is the cost of an error screen that records nothing.

      Written where everything else about this learner already lives, and capped at the
      last five so a crash loop cannot fill the record. Wrapped in try/catch because
      storage throws in private mode, and an error handler that throws is the one bug
      nobody can see.
    */
    /*
      WHAT WAS ON SCREEN, which is the part a minified stack cannot tell us.

      Sourcemaps are emitted but Vercel answers 403 to every .map request, so the stack
      stays minified on the device AND in devtools — I checked rather than assumed, having
      already claimed once that maps would solve this.

      So the record takes a description of the screen instead: the route, and the testids
      present when it died. "ask-gender-f was on screen" locates a crash far better than
      "a variable called e was undefined", and unlike a stack it cannot be minified away.
    */
    let onScreen = ''
    let pressed = ''
    try {
      /*
        Read from the LAST PRESS rather than from the DOM, which by now is this error
        screen — a first attempt recorded "error-retry error-out error-digest", perfectly
        accurate and describing the apology rather than the fault. See components/Tap.tsx,
        where every press in the product already passes through one listener.
      */
      const last = JSON.parse(sessionStorage.getItem('byheart.lastpress') ?? '{}')
      onScreen = String(last.onScreen ?? '')
      pressed = [last.testid, last.label].filter(Boolean).join(' · ')
    } catch {
      /* No record of a press, which is itself worth knowing — the field stays empty. */
    }

    try {
      const KEY = 'byheart.crashes'
      const prior = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      const next = [
        {
          at: new Date().toISOString(),
          where: window.location.pathname + window.location.search,
          message: String(error?.message ?? error).slice(0, 300),
          digest: error?.digest ?? null,
          /*
            The whole stack, not a summary. With sourcemaps served this names files and
            lines, and truncating it would cut exactly the frames that say which of them.
          */
          stack: String(error?.stack ?? '').slice(0, 2000),
          onScreen,
          pressed,
        },
        ...(Array.isArray(prior) ? prior : []),
      ].slice(0, 5)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* Storage is unavailable. The console line above is still there. */
    }
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
      {/*
        WHAT BROKE, ON THE SCREEN.

        This showed `digest` and nothing else, so a client-side throw — which has no
        digest — left a screen with no identifying mark on it whatsoever. That is the
        difference between a bug report and a screenshot of an apology.

        Small and last, because somebody in a café needs the way out first and the
        diagnosis never. But it is THERE, so a photograph of this screen is enough to find
        the fault, which is how this one should have been caught.
      */}
      {error.digest || error.message ? (
        <p className="pt text-center text-xs text-muted" data-testid="error-digest">
          {error.digest ? error.digest + ' · ' : ''}
          {error.message ? error.message.slice(0, 140) : ''}
        </p>
      ) : null}
    </main>
  )
}
