'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PRICING } from '@/lib/entitlements'

/**
 * The waitlist, and the founding pitch.
 *
 * This needs none of the account work, which is why it can go up first. The pitch is the
 * whole page: DUB's honest gap is audio, and saying so turns the biggest weakness into
 * the reason to be here early. It makes the reader a participant rather than a customer.
 *
 * One field. No name, no "how did you hear about us", no tick-boxes — every extra
 * question is a reason to close the tab, and none of them would change what gets built.
 */
export function Waitlist() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function join() {
    setState('busy')
    setMessage(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = (await res.json()) as { ok: boolean; reason?: string }
      if (body.ok) setState('done')
      else {
        setState('error')
        setMessage(body.reason ?? 'That did not work.')
      }
    } catch {
      setState('error')
      setMessage('That did not work.')
    }
  }

  return (
    <main
      data-stage="LANDING"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-bg px-5 py-10 text-fg"
    >
      <div>
        <p className="eyebrow text-muted">DUB</p>
        <h1 className="display mt-3 text-balance text-3xl">
          Every big app teaches you Brazilian Portuguese. You are moving to Lisbon.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-fg/85">
          DUB teaches the European one — estás rather than você está, telemóvel, a bica,
          the 28 — and it starts by getting you talking about yourself. Your Legend is the
          minute you can already do: who you are, where you are from, why you came. All of
          it built out of the films, music and culture already in your head.
        </p>
      </div>

      <div className="rounded border border-line bg-bg-elev p-5">
        <p className="eyebrow text-accent">WHAT THE FIRST {PRICING.founding.cap} PAY FOR</p>
        <p className="mt-3 text-sm leading-relaxed">
          Right now every line is spoken by a robot. Founding memberships pay for the
          recording sessions — real Lisbon voices, every line in the product. £
          {PRICING.founding.gbp} a year, locked for as long as you stay.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {PRICING.founding.line} Afterwards it is £{PRICING.annual.gbp}, and the price rise
          is the proof the promise was kept.
        </p>
      </div>

      {state === 'done' ? (
        <div className="rounded border border-correct/40 bg-correct/10 px-4 py-3">
          <p className="text-sm">
            You are on the list. You will hear from us when the recordings are booked, and
            not before — no drip, no nurture sequence.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Your email"
              data-testid="waitlist-email"
              className="tap-target min-w-0 flex-1 rounded border border-line bg-surface px-3 py-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              data-testid="waitlist-join"
              onClick={join}
              disabled={state === 'busy' || !email.trim()}
              className="tap-target rounded-full bg-accent px-5 py-3 text-xs tracking-widest text-accent-ink disabled:bg-chip disabled:text-muted"
            >
              KEEP ME POSTED
            </button>
          </div>
          {message ? <p className="mt-3 text-xs text-accent">{message}</p> : null}
          <p className="mt-3 text-xs leading-relaxed text-muted">
            One email when there is something real to say. Nothing else, ever.
          </p>
        </div>
      )}

      <p className="text-xs text-muted">
        Or{' '}
        <Link href="/" className="text-accent underline underline-offset-4">
          try it now
        </Link>
        , free, no account.
      </p>
    </main>
  )
}
