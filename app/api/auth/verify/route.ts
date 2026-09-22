import { NextResponse } from 'next/server'
import { absoluteUrl, consumeLoginToken, ensureDevice, returnTo, startSession, upsertUser } from '@/lib/auth'
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

  /*
    Back where they were, when the link says so.

    Filtered again on the way out rather than trusted from the URL: this value has been
    through a mail client, which is outside. returnTo falls back to the account page for
    anything not on its list, so a mangled or hostile `next` lands exactly where every
    link used to.
  */
  const next = new URL(request.url).searchParams.get('next')
  return NextResponse.redirect(absoluteUrl(returnTo(next)))
}
