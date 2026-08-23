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

  let interval: 'monthly' | 'annual' = 'monthly'
  try {
    const body = (await request.json()) as { interval?: string }
    if (body.interval === 'annual') interval = 'annual'
  } catch {
    /* default */
  }

  const url = await checkoutUrl({
    userId: user.id,
    email: user.email,
    interval,
    returnTo: absoluteUrl('/account'),
  })
  if (!url) return NextResponse.json({ error: 'could not start checkout' }, { status: 500 })
  return NextResponse.json({ url })
}
