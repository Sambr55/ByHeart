import { NextResponse } from 'next/server'
import { absoluteUrl, endSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Signing out ends the session and touches nothing else.
 *
 * The local copy stays, stamped with whose it is, and that is deliberate on three counts —
 * the third being the one that matters.
 *
 *   1. Signing out is not deleting. Somebody signing out on their own phone and back in an
 *      hour later should find their Portuguese where they left it.
 *   2. If the server holds nothing — an anonymous session that signed in, synced nothing,
 *      and signed out — clearing the device would be losing it permanently.
 *   3. The stamp is what makes the NEXT sign-in safe. A copy that remembers it is Alice's
 *      cannot be merged into Bob's account; an unstamped one has no way to object.
 *
 * Deleting the account is a different action and does clear the device — see
 * /api/account/delete. So does /reset. Those are both explicit, and this is not.
 */

export async function POST() {
  await endSession()
  return NextResponse.json({ ok: true })
}

/** GET too, so a plain link works with no JavaScript. */
export async function GET() {
  await endSession()
  return NextResponse.redirect(absoluteUrl('/'))
}
