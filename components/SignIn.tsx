'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    setMessage(null)
    const res = await fetch('/api/auth/request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
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
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-5 py-10">
      <div className="flex items-center justify-between gap-3">
        <a href="/" className="tap-target flex shrink-0 items-center gap-1 eyebrow text-accent">
          <span aria-hidden>←</span>
          <Wordmark className="h-3" title="DUB — back to your crates" />
        </a>
        <Menu />
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

      {state === 'undeliverable' ? (
        <div className="flex flex-col gap-3">
          <h1 className="display text-balance text-3xl">No email is going to arrive.</h1>
          <p className="text-sm leading-relaxed text-fg/85">
            DUB has no mail sender configured yet, so it made you a sign-in link and had
            nowhere to send it. That is a missing setting rather than a problem with your
            address — nothing you do here will fix it.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Everything you have learned is safe on this device in the meantime. It stays
            there, and it will still be there when accounts open.
          </p>
          <Link
            href="/club"
            className="tap-target eyebrow mt-3 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            DUB CLUB
          </Link>
        </div>
      ) : state === 'sent' ? (
        <>
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
        </>
      ) : (
        <>
          <h1 className="display text-balance text-3xl">Keep what you have learned.</h1>
          <p className="text-sm text-fg/80">
            Everything you have done so far is on this phone. An account moves it somewhere it
            cannot be lost, and lets you carry on wherever you are.
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
                className="w-full rounded border border-line bg-bg-elev px-4 py-3 text-base outline-none focus:border-accent"
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
            <p className="rounded border border-line bg-bg-elev p-4 text-sm text-muted">
              Accounts are not switched on yet. Everything still works — what you have learned is
              saved on this device, and it will move across the moment you can sign in.
            </p>
          )}
        </>
      )}
    </main>
  )
}
