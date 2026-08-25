import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { redeemComp, redeemCompForDevice } from '@/lib/comp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Redeem a comp code.
 *
 * Testers get a cohort code with an end date, so access lapses to Free rather than
 * needing to be revoked. Native reviewers get a permanent grant — somebody correcting
 * your Portuguese should never see a paywall.
 *
 * Signing in is no longer required. It used to be, and that made the entire comp system
 * unreachable on the live domain: redeeming needed an account, an account needed a magic
 * link, and the magic link needed an email sender that is not configured. A tester met
 * a wall with a code in their hand. With no account the grant binds to the device cookie
 * instead, which is also simply the right shape for a ten-minute test on someone's own
 * phone.
 */
export async function POST(request: Request) {
  let body: { code?: string }
  try {
    body = (await request.json()) as { code?: string }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }
  const code = (body.code ?? '').trim()
  if (!code) return NextResponse.json({ ok: false, reason: 'No code given.' }, { status: 400 })

  const user = await currentUser()
  const result = user
    ? await redeemComp(code, user.id)
    : await redeemCompForDevice(code, await ensureDevice())

  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
