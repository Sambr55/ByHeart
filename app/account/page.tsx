import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Account } from '@/components/Account'
import { Back } from '@/components/Back'
import { RedeemCode } from '@/components/RedeemCode'
import { Wordmark } from '@/components/Wordmark'
import { currentUser, deviceId } from '@/lib/auth'
import { billingConfigured, entitlementsForUser, subscriptionFor } from '@/lib/billing'
import { entitlementsForDevice } from '@/lib/comp'
import { sendable } from '@/lib/email'
import { hasDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  if (!hasDb()) redirect('/signin')
  const user = await currentUser()
  // A signed-out visitor used to be redirected to /signin, which put the redeem box
  // behind the exact wall it exists to get a tester past — and sign-in cannot deliver
  // a link without a mail sender. So they get a page of their own instead.
  if (!user) return <SignedOut />

  const [subscription, entitlements] = await Promise.all([
    subscriptionFor(user.id),
    entitlementsForUser(user.id),
  ])

  return (
    <Account
      user={{ ...user, created_at: user.created_at.toISOString() }}
      entitlements={entitlements}
      subscription={
        subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              source: subscription.source,
              current_period_end: subscription.current_period_end?.toISOString() ?? null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            }
          : null
      }
      billingReady={billingConfigured()}
    />
  )
}

/**
 * The account page for somebody with no account.
 *
 * Two things belong here and nothing else: the code box, because a tester was handed a
 * code and this is where they were told to type it; and the way to make a real account,
 * for anybody who came looking for one. It says what a code does before asking for one,
 * because "GOT A CODE?" alone does not tell you what happens if you have.
 */
async function SignedOut() {
  const comped = await entitlementsForDevice(await deviceId())
  const canSignIn = sendable()

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 px-5 py-10">
      {/* The same header the signed-in page has. A wordmark is sized by height, and
          leaving the class off renders it at its intrinsic size — enormous. */}
      <header className="flex items-center justify-between gap-3">
        <Back />
      </header>

      <section>
        <p className="eyebrow text-muted">THIS DEVICE</p>
        <h1 className="display mt-3 text-balance text-2xl">
          {comped ? 'Every vibe is open on this device.' : 'You are on the free three.'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {comped
            ? 'A code has been redeemed here. It stays with this device — including if you start again from /reset.'
            : 'The basics and two vibes you pick. If somebody gave you a code, this is where it goes — you do not need an account.'}
        </p>
      </section>

      {!comped ? <RedeemCode /> : null}

      {/*
        The button only exists when it can work.

        Sign-in is a magic link, and without a mail sender the link cannot be delivered —
        so SIGN IN led to a page that says accounts are not switched on. A control that
        cannot do the thing it names is worse than no control: it costs a tap, and the
        tap teaches somebody that the product is broken.

        The sentence stays either way, because "everything lives on this device" is
        something a tester genuinely needs to know before they clear their browser.
      */}
      <section className="border-t border-line pt-6">
        <p className="eyebrow text-muted">THIS PHONE</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {canSignIn
            ? 'Everything you learn lives on this device until you sign in. An account moves it across to another phone.'
            : 'Everything you learn lives on this device. Keep using the same browser and it will be here — accounts, for moving it to another phone, are coming.'}
        </p>
        {canSignIn ? (
          <Link
            href="/signin"
            className="tap-target eyebrow mt-3 inline-block rounded-full border border-line px-5 py-3"
          >
            SIGN IN
          </Link>
        ) : null}
      </section>
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
