import { NextResponse } from 'next/server'
import { absoluteUrl, currentUser } from '@/lib/auth'
import { billingConfigured, checkoutUrl } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'sign in first' }, { status: 401 })
  if (!billingConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_PRO_MONTHLY.' },
      { status: 503 },
    )
  }

  /*
    Read from the body OR the query string, and never silently default on a money path.

    This read only the body. Pro.tsx sent a query string on a body-less POST, so the JSON
    parse threw, the catch swallowed it, and the ANNUAL button quietly charged monthly.
    A payment route that falls back to a different price than the one requested is the
    worst shape of bug there is: it succeeds, and the customer finds out on their
    statement.

    So it accepts both wire formats, and an interval it does not recognise is a 400
    rather than a guess.
  */
  const asked =
    (await request
      .json()
      .then((b: { interval?: string }) => b?.interval)
      .catch(() => undefined)) ?? new URL(request.url).searchParams.get('interval') ?? 'monthly'

  if (asked !== 'monthly' && asked !== 'annual' && asked !== 'founding') {
    return NextResponse.json({ error: 'unknown interval "' + asked + '"' }, { status: 400 })
  }
  // Founding is a real price id or it is nothing. Falling back to annual would charge
  // somebody £54 for the thing they were told cost £29, which is the worst possible
  // failure mode for a launch offer.
  if (asked === 'founding' && !process.env.STRIPE_PRICE_FOUNDING) {
    return NextResponse.json({ error: 'the founding offer is not configured' }, { status: 503 })
  }
  const interval: 'monthly' | 'annual' | 'founding' = asked

  const url = await checkoutUrl({
    userId: user.id,
    email: user.email,
    interval,
    returnTo: absoluteUrl('/account'),
  })
  if (!url) return NextResponse.json({ error: 'could not start checkout' }, { status: 500 })
  return NextResponse.json({ url })
}
