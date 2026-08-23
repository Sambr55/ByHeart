import { NextResponse } from 'next/server'
import { absoluteUrl, consumeLoginToken, ensureDevice, startSession, upsertUser } from '@/lib/auth'
import { claimDevice } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Spend a magic link and land the person back in the product.
 *
 * The claim step is the important one: whatever this device learned anonymously
 * becomes theirs at the moment they sign in. Someone who has just finished a crate
 * and then makes an account must find it still there.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const email = await consumeLoginToken(token)
  if (!email) {
    return NextResponse.redirect(absoluteUrl('/signin?expired=1'))
  }

  const user = await upsertUser(email)
  if (!user) return NextResponse.redirect(absoluteUrl('/signin?error=1'))

  await startSession(user.id)
  const device = await ensureDevice()
  await claimDevice(device, user.id)

  return NextResponse.redirect(absoluteUrl('/account?welcome=1'))
}
