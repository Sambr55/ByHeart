'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PLANS } from '@/lib/entitlements'
import { Menu } from '@/components/Menu'
import { useEntitlements } from '@/engine/useEntitlements'

/**
 * The page you land on when a crate is beyond the free three.
 *
 * Written to be read rather than to convert. The honest gap in DUB today is audio —
 * every line is a synthetic voice — and that gap is also the offer, so the page says so
 * in the first paragraph instead of burying it. It makes the buyer a participant rather
 * than a customer, and it turns the biggest weakness into the reason to buy now.
 *
 * What it must never do: hurry anybody. No countdown, no "limited time", no strike-
 * through price theatre. The product's whole argument is that manufactured deadlines do
 * not produce speakers, and a paywall that contradicts the deal screen is the product
 * arguing with itself at the till.
 */
export function Pro() {
  const access = useEntitlements()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * A JSON body, because that is what the route reads.
   *
   * This sent the interval as a QUERY STRING on a body-less POST. The route does
   * `await request.json()`, which throws on an empty body, catches, and falls back to
   * 'monthly' — so the ANNUAL button charged monthly. Account.tsx had always sent a
   * body; two components, two wire formats, one route. It was masked only because the
   * buttons are gated behind billing being configured, which it is not yet.
   */
  async function go(path: string, body?: Record<string, string>) {
    setBusy(path)
    setError(null)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      })
      const reply = (await res.json()) as { url?: string; error?: string }
      if (reply.url) window.location.href = reply.url
      else setError(reply.error ?? 'That did not work.')
    } catch {
      setError('That did not work.')
    }
    setBusy(null)
  }

  const pro = access.entitlements.plan === 'pro'

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-30 flex items-center gap-3 px-5 py-3">
        <Link href="/crates" className="tap-target eyebrow opacity-80 transition hover:opacity-100">
          ← Crates
        </Link>
        <span className="eyebrow flex-1">DUB</span>
        <Menu />
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        {pro ? (
          <div>
            <h1 className="display text-balance text-2xl">You already have it.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {access.comped
                ? 'On the house. Nothing to pay and nothing to manage.'
                : 'Every crate, every drop, and whatever comes next.'}
            </p>
            <Link
              href="/crates"
              className="eyebrow mt-6 inline-block text-accent underline underline-offset-4"
            >
              YOUR CRATES
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="eyebrow text-muted">THE MONEY</p>
              <h1 className="display mt-3 text-balance text-2xl">
                Right now, every line in DUB is spoken by a robot.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-fg/85">
                Nothing has been recorded yet. Playback falls back to whatever synthetic
                European Portuguese voice your phone happens to have, and they vary. That is
                the honest gap in this product, and it is what a membership pays for: real
                Lisbon voices, every line, recorded properly — including the Legend you
                have already built, read back by somebody who actually lives there.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Until that lands, three crates are yours for good and every drop stays open.
                There is no hurry here and there is no countdown — a product built on the
                argument that deadlines do not produce speakers would look ridiculous
                inventing one at the till.
              </p>
            </div>

            <section className="rounded border border-line bg-bg-elev p-5">
              <p className="eyebrow text-accent">{PLANS.pro.name ?? 'DUB'}</p>
              <p className="mt-3 text-sm">{PLANS.pro.line}</p>
              <ul className="mt-3 space-y-1">
                {PLANS.pro.includes.map((i) => (
                  <li key={i} className="flex gap-3 text-sm text-fg/80">
                    <span className="text-accent">·</span>
                    {i}
                  </li>
                ))}
              </ul>

              {/*
                What the money builds, kept visibly separate from what it buys.

                Four of the five bullets above used to sell capture, the Booth, offline
                audio and publishing — none of which exist. They are not deleted from the
                pitch, they are moved to the half of it that is honest: a founding
                membership is funding these, and saying so is a better argument than
                pretending they are already here.
              */}
              <div className="mt-6 rounded border border-dashed border-line-strong px-4 py-3">
                <p className="eyebrow text-muted">NOT BUILT YET</p>
                <ul className="mt-3 space-y-1">
                  {PLANS.pro.funding.map((i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted">
                      <span aria-hidden>·</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>

              {!access.known ? null : access.billingReady ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-testid="pro-annual"
                    onClick={() => go('/api/billing/checkout', { interval: 'annual' })}
                    disabled={busy !== null}
                    className="tap-target rounded-full bg-accent px-5 py-3 text-xs tracking-widest text-accent-ink"
                  >
                    ANNUAL
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/api/billing/checkout', { interval: 'monthly' })}
                    disabled={busy !== null}
                    className="tap-target rounded-full border border-line px-5 py-3 text-xs tracking-widest"
                  >
                    MONTHLY
                  </button>
                </div>
              ) : (
                <p className="mt-6 text-xs leading-relaxed text-muted">
                  Memberships are not open yet. Nothing here is for sale today — this page
                  exists so you know what is coming and what it pays for.
                </p>
              )}
              {error ? <p className="mt-3 text-xs text-accent">{error}</p> : null}
            </section>

            <section>
              <p className="eyebrow text-muted">ALWAYS FREE</p>
              <ul className="mt-3 space-y-1">
                {PLANS.free.includes.map((i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted">
                    <span className="text-muted">·</span>
                    {i}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                And everything you have already learned stays yours whatever you decide. We
                are never going to charge you to look at your own Portuguese.
              </p>
            </section>

            {!access.signedIn ? (
              <p className="text-xs leading-relaxed text-muted">
                Got a code?{' '}
                <Link href="/account" className="text-accent underline underline-offset-4">
                  Redeem it on your account
                </Link>
                .
              </p>
            ) : null}
          </>
        )}
      </div>
    </main>
  )
}
