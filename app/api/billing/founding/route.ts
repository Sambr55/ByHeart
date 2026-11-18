import { NextResponse } from 'next/server'
import { billingConfigured, foundingLeft } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * IS THE FOUNDING OFFER OPEN? (2026-11-18)
 *
 * Asked once, by the membership card after sign-in, so it can offer "Sócio fundador" only
 * when the price exists and places are left. Never asked by every page: counting means
 * listing subscriptions at Stripe. Closed is the answer whenever it cannot be counted —
 * and the screen then offers annual instead, openly, rather than substituting one price
 * for another at the till.
 */
export async function GET() {
  if (!billingConfigured() || !process.env.STRIPE_PRICE_FOUNDING) {
    return NextResponse.json({ open: false, left: 0 })
  }
  const left = await foundingLeft().catch(() => null)
  return NextResponse.json({ open: Boolean(left), left: left ?? 0 })
}
