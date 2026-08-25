import { NextResponse } from 'next/server'
import { currentUser, deviceId } from '@/lib/auth'
import { billingConfigured, entitlementsForUser, subscriptionFor } from '@/lib/billing'
import { entitlementsForDevice } from '@/lib/comp'
import { sendable } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * What this learner is entitled to, for the client to gate on.
 *
 * Advisory, not authoritative. Anything that actually costs money — the Booth, offline
 * audio — is checked again on its own route. This exists so the picker can dim a crate
 * honestly rather than letting somebody walk into one and be thrown out at the door,
 * which is the worse version of the same rule.
 *
 * Anonymous learners get the free tier rather than an error: DUB works with no account
 * at all, and that must keep being true.
 *
 * A DEVICE grant is consulted alongside the account, and the better of the two wins.
 * Order matters and it is not obvious: a tester who redeems a code and later signs in
 * has an account with no subscription, so reading the account alone would take Pro back
 * off them at the moment they did the thing we asked. Never take access away.
 */
export async function GET() {
  const user = await currentUser()
  const accountEntitlements = await entitlementsForUser(user?.id ?? null)
  const deviceEntitlements = await entitlementsForDevice(await deviceId())

  const comped = deviceEntitlements ?? null
  const entitlements =
    comped && comped.crates > accountEntitlements.crates ? comped : accountEntitlements

  const sub = user ? await subscriptionFor(user.id) : null
  return NextResponse.json({
    entitlements,
    signedIn: Boolean(user),
    comped: sub?.source === 'comp' || Boolean(comped),
    billingReady: billingConfigured(),
    signInReady: sendable(),
  })
}
