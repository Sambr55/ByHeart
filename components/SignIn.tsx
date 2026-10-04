'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Back } from '@/components/Back'
import { Wordmark } from '@/components/Wordmark'
import { loadLearner } from '@/engine/learner'

/**
 * Sign in.
 *
 * One field. The copy has a job to do: nobody signs up to a language app because
 * they want an account, so the screen has to say what the account is *for* before
 * it asks for anything.
 */
export function SignIn({ accountsReady }: { accountsReady: boolean }) {
  // Read after mount rather than via useSearchParams, so this component needs no
  // Suspense boundary and the server render stays identical for everybody.
  /*
    Two people arrive here and the page only ever spoke to one of them.

    Somebody who taps "Been here before?" on the front door is RETURNING — new phone,
    cleared browser, a laptop — and what they want is the way back in. Telling them to
    "keep what you have learned" is selling an account to a person who already has one, and
    describing work that is not on this device as being on it.

    Somebody who taps the line at the end of a session is the opposite: they have just
    earned something, it is on this phone only, and the pitch is exactly right.

    The device knows which is which without asking. An empty one is somebody coming back;
    a full one is somebody with something to protect. Read after mount, like everything
    else that comes out of localStorage.
  */
  const [kept, setKept] = useState<number | null>(null)
  useEffect(() => {
    setKept((loadLearner().proof ?? []).length)
  }, [])
  const returning = kept === 0

  const [expired, setExpired] = useState(false)
  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get('expired') === '1')
  }, [])
  const [email, setEmail] = useState('')
  const [state, setState] = useState<
    'idle' | 'sending' | 'sent' | 'error' | 'undeliverable'
  >('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [debugUrl, setDebugUrl] = useState<string | null>(null)

  /*
    Read once after mount rather than with useSearchParams, so this page needs no Suspense
    boundary — the same reason and the same shape as the Legend's ?cold= handling.
  */
  const [backTo, setBackTo] = useState<string | null>(null)
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('next')
    if (asked) {
      setBackTo(asked)
      return
    }
    /*
      AND WHERE THEY CAME FROM, WHEN NOTHING SAID.

      Sam: "Clicking the emailed link when signing in takes me back to What brings you to
      Lisbon. It needs to round trip to where you have come from."

      The round trip works — returnTo honours ?next= and the allowlist has eight screens on
      it. What was wrong is that nothing was capturing the origin: four of the six places
      that offer sign-in hardcode `next=%2Fvibes`, and /vibes is where set-up asks "What
      brings you to Lisbon". So a member signing in from their profile was handed the
      shelf, and a learner mid-sitting was handed a question they had already answered.

      `document.referrer` rather than threading a prop through six call sites, because the
      browser already knows and the alternative is six places to keep right. Same-origin
      only, and the path alone — returnTo filters it against the allowlist on the way out
      and again on the way back, so this cannot widen what is reachable, only choose better
      among what already is.

      Falls through to null where there is no referrer, which is a direct visit or a
      stripped one. That lands on /account?welcome=1, exactly as it did before, and that is
      the right answer for somebody who arrived at the sign-in page from nowhere.
    */
    try {
      const from = document.referrer
      if (!from) return
      const url = new URL(from)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return
      setBackTo(url.pathname)
    } catch {
      /* A referrer that will not parse is a referrer we do not have. */
    }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    setMessage(null)
    const res = await fetch('/api/auth/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      /*
        WHERE THEY WERE, so the link brings them back to it.

        Sam signed in two vibes from his Legend and landed on the billing page: "it took me
        back here and I couldn't return to where I was." The link had nowhere else to go —
        the origin was never sent.

        From ?next= on this page's own URL, which the screens that offer sign-in now set.
        The server filters it against a fixed list either way (see returnTo in lib/auth),
        so this is a hint rather than an instruction and a missing one costs nothing.
      */
      body: JSON.stringify({ email, next: backTo }),
    })
    const data = (await res.json()) as { ok?: boolean; reason?: string; debug_url?: string; sent?: boolean }
    if (!res.ok || !data.ok) {
      setState('error')
      setMessage(data.reason ?? 'That did not work.')
      return
    }
    setDebugUrl(data.debug_url ?? null)
    /*
      Do not say "check your email" when the server has just said it sent nothing.

      Without RESEND_API_KEY the route answers { ok: true, sent: false } — it issued a
      real token and had nowhere to post it — and this screen showed the same cheerful
      "Check your email" it shows on success. A person then waits, checks spam, tries a
      second address, and concludes the product is broken. It is not broken; it is
      unconfigured, and those are different sentences.
    */
    setState(data.sent === false && !data.debug_url ? 'undeliverable' : 'sent')
  }

  return (
    <main className="safe-top mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-5 py-10">
      <div className="flex items-center justify-between gap-3">
        <Back />
      </div>

      {/*
        The one message that has to land, and nothing was reading it.

        /api/auth/verify redirects here with ?expired=1 when a link is stale or already
        used — and this page ignored it, so somebody who tapped a twenty-minute link
        after twenty-five minutes was shown a blank sign-in form and no explanation. They
        would try the same link again, and again.
      */}
      {expired && state === 'idle' ? (
        <div
          data-testid="signin-expired"
          className="flex flex-col gap-1 rounded border border-coach/60 bg-coach/[0.08] px-4 py-3"
        >
          <p className="text-sm font-semibold">That link has expired.</p>
          <p className="text-xs leading-relaxed text-muted">
            They last twenty minutes and only work once — which is what makes them safe to
            send by email. Put your address in again and we will send another.
          </p>
        </div>
      ) : null}

      {/*
        THE WHITE CARD, and on this screen it is a legibility fix rather than a style.

        Sam: "I like the black text on white, it is so easy to read." On this page that is
        not a preference — it is the bug. Every page carrying the bottom bar paints its
        canvas azulejo so the strip under the bar is blue rather than sand (see
        `html:has(.bar)` in globals.css), and this `<main>` is `justify-center` on a short
        document: it never fills the viewport, so the blue canvas shows through behind the
        words. The ink does not move with it — `--fg` is still the deep indigo meant for
        sand — so the headline rendered dark-on-blue and the muted line rendered amber
        on blue. Both are under 4.5:1 and the screenshot is unreadable.

        A card fixes it at the root rather than by patching colours: the words get their
        own near-white ground, so they are the black-on-white they were always designed
        to be, and the blue stays where it was meant to be — behind the page, not behind
        the type.

        One card per state, because the three states are three different screens that
        happen to share a route.
      */}
      {state === 'undeliverable' ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-3xl">No email is going to arrive.</h1>
          <p className="text-sm leading-relaxed text-fg/85">
            DUB has no mail sender configured yet, so it made you a sign-in link and had nowhere to
            send it. That is a missing setting rather than a problem with your address — nothing you
            do here will fix it.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Everything you have learned is safe on this device in the meantime. It stays there, and
            it will still be there when accounts open.
          </p>
          <Link
            href="/club"
            className="tap-target eyebrow mt-3 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            DUB CLUB
          </Link>
        </div>
      ) : state === 'sent' ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-3xl">Check your email.</h1>
          <p className="text-sm text-fg/80">
            One link, good for twenty minutes, and it only works once. Open it on the phone you
            want to learn on.
          </p>
          {debugUrl ? (
            <a href={debugUrl} className="break-all rounded border border-accent/40 bg-accent/5 p-4 text-xs text-accent">
              {debugUrl}
            </a>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-bg-elev px-5 py-6">
          <h1 className="display text-balance text-3xl">
            {returning ? 'Welcome back.' : 'Keep what you have learned.'}
          </h1>
          <p className="text-sm text-fg/80">
            {returning
              ? 'There is nothing on this device yet. Sign in and everything you have already done comes back — the sentences, your Legend, the lot.'
              : /*
                  The number, because it is the whole argument.

                  "Keep what you have learned" is abstract. "Eleven sentences you can say
                  cold, and they are on this phone only" is the same sentence with the
                  stakes in it — and it is the one number DUB counts, so using it here is
                  reporting rather than persuading.
                */
                (kept
                  ? kept + (kept === 1 ? ' sentence you can say' : ' sentences you can say') +
                    ' cold, and they are on this phone only. An account moves them somewhere they cannot be lost, and lets you carry on wherever you are.'
                  : 'Everything you have done so far is on this phone. An account moves it somewhere it cannot be lost, and lets you carry on wherever you are.')}
          </p>
          <p className="text-sm text-muted">
            No password. We send a link, you tap it, you are in.
          </p>

          {accountsReady ? (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                /* bg-surface, not bg-bg-elev: the field sits on the card now, and
                   --surface is the inset token — "below the ground, so a field reads as
                   a hole". bg-bg-elev here would be a borderless white box on white. */
                className="w-full rounded border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={state === 'sending'}
                className="tap-target w-full rounded-full bg-accent px-5 py-3 text-xs tracking-widest text-accent-ink disabled:opacity-50"
              >
                {state === 'sending' ? 'SENDING…' : 'SEND ME A LINK'}
              </button>
              {message ? <p className="text-xs text-accent">{message}</p> : null}
            </form>
          ) : (
            /* bg-surface: this note sits INSIDE the card now, and bg-bg-elev on
               bg-bg-elev is the same colour with no edge. Inset is what a panel within a
               card is — the move Friends.tsx makes for its rows. */
            <p className="rounded border border-line bg-surface p-4 text-sm text-muted">
              Accounts are not switched on yet. Everything still works — what you have learned is
              saved on this device, and it will move across the moment you can sign in.
            </p>
          )}
        </div>
      )}
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
