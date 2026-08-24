import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { redeemComp } from '@/lib/comp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Redeem a comp code.
 *
 * Testers get a cohort code with an end date, so access lapses to Free rather than
 * needing to be revoked. Native reviewers get a permanent grant — somebody correcting
 * your Portuguese should never see a paywall.
 */
export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ ok: false, reason: 'Sign in first, then redeem.' }, { status: 401 })
  }
  let body: { code?: string }
  try {
    body = (await request.json()) as { code?: string }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }
  const code = (body.code ?? '').trim()
  if (!code) return NextResponse.json({ ok: false, reason: 'No code given.' }, { status: 400 })

  const result = await redeemComp(code, user.id)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
