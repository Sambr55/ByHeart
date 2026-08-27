'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PLANS } from '@/lib/entitlements'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Back } from '@/components/Back'
import { useEntitlements } from '@/engine/useEntitlements'

/**
 * The page you land on when a crate is beyond the free three.
 *
 * Written to be read rather than to convert — but it does have to make the case.
 *
 * It used to open "Right now, every line in DUB is spoken by a robot", and carry a panel
 * headed NOT BUILT YET listing three things the membership does not include. The theory
 * was that candour sells. It does not read as candour on a sales page: a visitor cannot
 * tell an honest disclosure from a warning, and the first thing the page did was argue
 * against itself. So it leads with what the membership is, and the one thing it must not
 * do — claim something untrue — is handled where it belongs, by not selling anything
 * until it is true. `billingConfigured` gates the buttons and the page says so plainly
 * when it is false.
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
        <Back />
        <span className="eyebrow flex-1">DUB</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        {pro ? (
          <div>
            <h1 className="display text-balance text-2xl">You already have it.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {access.comped
                ? 'On the house. Nothing to pay and nothing to manage.'
                : 'Every vibe, every drop, and whatever comes next.'}
            </p>
            <Link
              href="/vibes"
              className="eyebrow mt-6 inline-block text-accent underline underline-offset-4"
            >
              YOUR VIBES
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="eyebrow text-muted">THE MONEY</p>
              <h1 className="display mt-3 text-balance text-2xl">
                Every vibe, and your Legend finished.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-fg/85">
                Membership opens every vibe DUB has written and every one it writes next —
                and it carries your Legend the rest of the way, all ten answers, into the
                Club where it keeps growing. Real Lisbon voices read it back to you.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Your three free vibes stay yours either way, and every drop stays open.
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
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
