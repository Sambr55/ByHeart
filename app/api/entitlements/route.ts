import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { billingConfigured, entitlementsForUser, subscriptionFor } from '@/lib/billing'

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
 */
export async function GET() {
  const user = await currentUser()
  const entitlements = await entitlementsForUser(user?.id ?? null)
  const sub = user ? await subscriptionFor(user.id) : null
  return NextResponse.json({
    entitlements,
    signedIn: Boolean(user),
    comped: sub?.source === 'comp',
    billingReady: billingConfigured(),
  })
}
