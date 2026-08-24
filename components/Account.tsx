'use client'

import { useState } from 'react'
import type { Entitlements } from '@/lib/entitlements'
import { PLANS } from '@/lib/entitlements'
import { Menu } from '@/components/Menu'

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

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-8 px-5 py-10">
      <header className="flex items-center justify-between gap-3">
        <a href="/" className="eyebrow text-accent">
          ← DUB
        </a>
        <a href="/api/auth/logout" className="eyebrow flex-1 text-right text-muted">
          SIGN OUT
        </a>
        <Menu />
      </header>

      <section>
        <p className="eyebrow text-muted">SIGNED IN AS</p>
        <p className="display mt-2 break-all text-2xl">{user.email}</p>
        <p className="mt-2 text-sm text-muted">
          Learning {user.target_language === 'pt-PT' ? 'European Portuguese' : user.target_language}{' '}
          since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>
      </section>

      {/* ---------------------------------------------------------------- plan */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow text-accent">{pro ? 'DUB PRO' : 'DUB'}</p>
          {subscription ? (
            <p className="text-xs text-muted">{STATUS_LINE[subscription.status] ?? subscription.status}</p>
          ) : null}
        </div>
        <p className="mt-2 text-sm">{pro ? PLANS.pro.line : PLANS.free.line}</p>

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
          <ul className="mt-4 space-y-1.5">
            {PLANS.pro.includes.map((i) => (
              <li key={i} className="flex gap-2 text-sm text-fg/80">
                <span className="text-accent">·</span>
                {i}
              </li>
            ))}
          </ul>
        ) : null}

        {billingReady ? (
          <div className="mt-5 flex flex-wrap gap-2">
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
          <p className="mt-4 text-xs text-muted">
            Billing is not switched on in this environment yet.
          </p>
        )}
        {error ? <p className="mt-3 text-xs text-accent">{error}</p> : null}
      </section>

      {/* -------------------------------------------------------------- details */}
      <section className="space-y-4">
        <p className="eyebrow text-muted">DETAILS</p>
        <label className="block">
          <span className="text-sm text-muted">What should we call you?</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Optional"
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent"
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
            <p className="eyebrow text-accent">CLOSE YOUR ACCOUNT</p>
            <p className="text-sm text-fg/80">
              Your recordings are deleted outright and your name and email are wiped. What we keep is
              which lines people find hard, with nothing attached to say it was you — that is what
              makes the next version better.
            </p>
            <p className="text-sm text-muted">Type {user.email} to confirm.</p>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none focus:border-accent"
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
                if (res.ok) window.location.href = '/'
                else setError('Could not close the account.')
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
