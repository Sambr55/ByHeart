'use client'

import { useState } from 'react'
import type { Entitlements } from '@/lib/entitlements'
import { PLANS } from '@/lib/entitlements'
import { wipeLearner } from '@/engine/learner'
import { Menu } from '@/components/Menu'
import { Wordmark } from '@/components/Wordmark'

/**
 * Account settings.
 *
 * Written to be legible rather than exhaustive. Everything a person can plausibly
 * want to do about their own account is on one screen, in the order they want it:
 * who am I, what am I on, how do I change it, how do I leave.
 */

interface Props {
  user: {
    id: string
    email: string
    display_name: string | null
    target_language: string
    marketing_opt_in: boolean
    created_at: string
  }
  entitlements: Entitlements
  subscription: {
    plan: string
    status: string
    current_period_end: string | null
    cancel_at_period_end: boolean
  
    source?: string | null
  } | null
  billingReady: boolean
}

const STATUS_LINE: Record<string, string> = {
  active: 'Active.',
  trialing: 'On trial.',
  past_due: 'Payment did not go through. Your access is untouched while we retry.',
  canceled: 'Cancelled.',
  inactive: 'Not active.',
}

export function Account({ user, entitlements, subscription, billingReady }: Props) {
  const [name, setName] = useState(user.display_name ?? '')
  const [optIn, setOptIn] = useState(user.marketing_opt_in)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'done'>('idle')
  const [busy, setBusy] = useState<string | null>(null)
  const [confirm, setConfirm] = useState('')
  const [danger, setDanger] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaved('saving')
    await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ display_name: name, marketing_opt_in: optIn }),
    })
    setSaved('done')
    setTimeout(() => setSaved('idle'), 2200)
  }

  const go = async (path: string, body?: unknown) => {
    setBusy(path)
    setError(null)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) window.location.href = data.url
      else setError(data.error ?? 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const pro = entitlements.plan === 'pro'
  // A comped learner must never be shown a billing button. portalUrl already returns
  // null without a stripe_customer_id so nothing would happen if they pressed it — but
  // a control that does nothing is worse than no control, and it is also simply untrue
  // about their situation.
  const comped = subscription?.source === 'comp'

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between gap-3">
        <a href="/" className="tap-target flex shrink-0 items-center gap-1 eyebrow text-accent">
          <span aria-hidden>←</span>
          <Wordmark className="h-3" title="DUB — back to your crates" />
        </a>
        <a href="/api/auth/logout" className="eyebrow flex-1 text-right text-muted">
          SIGN OUT
        </a>
        <Menu />
      </header>

      <section>
        <p className="eyebrow text-muted">SIGNED IN AS</p>
        <p className="display mt-3 break-all text-2xl">{user.email}</p>
        <p className="mt-3 text-sm text-muted">
          Learning {user.target_language === 'pt-PT' ? 'European Portuguese' : user.target_language}{' '}
          since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>
      </section>

      {/* ---------------------------------------------------------------- plan */}
      <section className="rounded border border-line bg-bg-elev p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow text-accent">{pro ? 'DUB PRO' : 'DUB'}</p>
          {subscription ? (
            <p className="text-xs text-muted">{STATUS_LINE[subscription.status] ?? subscription.status}</p>
          ) : null}
        </div>
        <p className="mt-3 text-sm">{pro ? PLANS.pro.line : PLANS.free.line}</p>

        {subscription?.current_period_end ? (
          <p className="mt-3 text-xs text-muted">
            {subscription.cancel_at_period_end ? 'Ends' : 'Renews'}{' '}
            {new Date(subscription.current_period_end).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        ) : null}

        {!pro ? (
          <ul className="mt-3 space-y-1">
            {PLANS.pro.includes.map((i) => (
              <li key={i} className="flex gap-3 text-sm text-fg/80">
                <span className="text-accent">·</span>
                {i}
              </li>
            ))}
          </ul>
        ) : null}

        {comped ? (
          <p className="mt-6 rounded border border-accent/40 bg-accent/[0.06] px-4 py-3 text-sm text-fg/85">
            You are in on the house
            {subscription?.current_period_end ? ', until the date above' : ', permanently'}. Nothing
            to pay and nothing to manage.
          </p>
        ) : billingReady ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {pro ? (
              <button
                type="button"
                onClick={() => go('/api/billing/portal')}
                disabled={busy !== null}
                className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest"
              >
                MANAGE BILLING
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go('/api/billing/checkout', { interval: 'monthly' })}
                  disabled={busy !== null}
                  className="tap-target rounded-full bg-accent px-5 py-3 text-xs tracking-widest text-accent-ink"
                >
                  GO PRO — MONTHLY
                </button>
                <button
                  type="button"
                  onClick={() => go('/api/billing/checkout', { interval: 'annual' })}
                  disabled={busy !== null}
                  className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest"
                >
                  ANNUAL
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted">
            Billing is not switched on in this environment yet.
          </p>
        )}
        {error ? <p className="mt-3 text-xs text-accent">{error}</p> : null}
      </section>

      {!comped ? <RedeemCode /> : null}

      {/* -------------------------------------------------------------- details */}
      <section className="space-y-3">
        <p className="eyebrow text-muted">DETAILS</p>
        <label className="block">
          <span className="text-sm text-muted">What should we call you?</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Optional"
            className="mt-3 w-full rounded border border-line bg-bg-elev px-4 py-3 text-base outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-1 size-4 accent-[var(--accent)]"
          />
          <span className="text-sm text-fg/80">
            Email me when a drop lands that fits what I am learning. Nothing else, and never more
            than one a week.
          </span>
        </label>
        <button
          type="button"
          onClick={save}
          className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest"
        >
          {saved === 'saving' ? 'SAVING…' : saved === 'done' ? 'SAVED' : 'SAVE'}
        </button>
      </section>

      {/* ----------------------------------------------------------------- data */}
      <section className="space-y-3 border-t border-line pt-6">
        <p className="eyebrow text-muted">YOUR DATA</p>
        <p className="text-sm text-fg/80">
          Everything we hold about you, in one file — every line you have learned, every answer you
          gave us, and what you are paying.
        </p>
        <a
          href="/api/account/export"
          className="tap-target inline-block rounded-full border border-line px-5 py-3 text-xs tracking-widest"
        >
          DOWNLOAD MY DATA
        </a>
      </section>

      {/* --------------------------------------------------------------- danger */}
      <section className="space-y-3 border-t border-line pt-6 pb-10">
        {!danger ? (
          <button type="button" onClick={() => setDanger(true)} className="text-xs text-muted underline">
            Close my account
          </button>
        ) : (
          <>
            <p className="eyebrow text-accent">CLOSE ACCOUNT</p>
            <p className="text-sm text-fg/80">
              Your recordings are deleted outright and your name and email are wiped. What we keep is
              which lines people find hard, with nothing attached to say it was you — that is what
              makes the next version better.
            </p>
            <p className="text-sm text-muted">Type {user.email} to confirm.</p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded border border-line bg-bg-elev px-4 py-3 text-base outline-none focus:border-accent"
            />
            <button
              type="button"
              disabled={confirm.trim().toLowerCase() !== user.email.toLowerCase()}
              onClick={async () => {
                const res = await fetch('/api/account/delete', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ confirm }),
                })
                if (!res.ok) {
                  setError('Could not close the account.')
                  return
                }
                /*
                  Clear the device too, and land on the front door.

                  The server deleted everything and the client kept every byte of it —
                  so closing an account dropped somebody on /club with their whole
                  history intact and the redirect back to it working perfectly. It
                  looked exactly like the deletion had failed, which is the worst
                  possible outcome for the one flow where trust is the entire product.

                  wipeLearner clears the namespaced record for every language pair, not
                  just the current one, because a learner may have started more than one.
                */
                wipeLearner()
                window.location.href = '/'
              }}
              className="tap-target rounded-full border border-accent px-5 py-3 text-xs tracking-widest text-accent disabled:opacity-40"
            >
              CLOSE MY ACCOUNT
            </button>
          </>
        )}
      </section>
    </main>
  )
}

/**
 * Redeeming a code.
 *
 * Quiet and last on the page: almost nobody has one, and a prominent box asking for a
 * code you do not have reads as a discount hunt. The people who do have one were handed
 * it personally and know to look.
 */
function RedeemCode() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<{ ok?: boolean; message?: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function redeem() {
    setBusy(true)
    setState(null)
    try {
      const res = await fetch('/api/comp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const body = (await res.json()) as { ok: boolean; reason?: string; until?: string | null }
      setState({
        ok: body.ok,
        message: body.ok
          ? body.until
            ? 'Done. You have DUB until ' +
              new Date(body.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
              '. Reload to see it.'
            : 'Done, permanently. Reload to see it.'
          : body.reason ?? 'That did not work.',
      })
    } catch {
      setState({ ok: false, message: 'That did not work.' })
    }
    setBusy(false)
  }

  return (
    <section>
      <p className="eyebrow text-muted">GOT A CODE?</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-1234"
          aria-label="Comp code"
          data-testid="comp-code"
          className="tap-target min-w-0 flex-1 rounded border border-line bg-surface px-3 py-3 text-sm uppercase tracking-widest text-fg placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          data-testid="comp-redeem"
          onClick={redeem}
          disabled={busy || !code.trim()}
          className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest disabled:opacity-40"
        >
          REDEEM
        </button>
      </div>
      {state ? (
        <p className={'mt-3 text-xs ' + (state.ok ? 'text-correct' : 'text-accent')}>{state.message}</p>
      ) : null}
    </section>
  )
}
