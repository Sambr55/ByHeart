'use client'

import { useState } from 'react'

/**
 * Sign in.
 *
 * One field. The copy has a job to do: nobody signs up to a language app because
 * they want an account, so the screen has to say what the account is *for* before
 * it asks for anything.
 */
export function SignIn({ accountsReady }: { accountsReady: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
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
    setState('sent')
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-5 py-12">
      <a href="/" className="eyebrow text-accent">
        ← DUB
      </a>

      {state === 'sent' ? (
        <>
          <h1 className="display text-balance text-3xl">Check your email.</h1>
          <p className="text-sm text-fg/80">
            One link, good for twenty minutes, and it only works once. Open it on the phone you
            want to learn on.
          </p>
          {debugUrl ? (
            <a href={debugUrl} className="break-all rounded-xl border border-accent/40 bg-accent/5 p-4 text-xs text-accent">
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
            <form onSubmit={submit} className="mt-2 space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-surface px-4 py-4 text-base outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={state === 'sending'}
                className="tap-target w-full rounded-full bg-accent px-5 py-4 text-xs tracking-widest text-accent-ink disabled:opacity-50"
              >
                {state === 'sending' ? 'SENDING…' : 'SEND ME A LINK'}
              </button>
              {message ? <p className="text-xs text-accent">{message}</p> : null}
            </form>
          ) : (
            <p className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
              Accounts are not switched on yet. Everything still works — what you have learned is
              saved on this device, and it will move across the moment you can sign in.
            </p>
          )}
        </>
      )}
    </main>
  )
}
