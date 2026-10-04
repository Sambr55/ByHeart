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

  const session = await startSession(user.id)
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
  const out = NextResponse.redirect(absoluteUrl(returnTo(next)))
  /*
    THE COOKIE RIDES ON THIS RESPONSE, because this response is not the one Next built.

    Sam, having tapped the link and arrived: "I'm still signed out." He was. The token had
    been spent — he landed in the product rather than on /signin?expired=1 — so the session
    row existed and the browser had never been told.

    startSession writes to the `cookies()` jar, and Next attaches that jar's Set-Cookie
    headers to the response IT builds for a handler. This handler builds its own, with
    NextResponse.redirect, and a constructed response does not inherit them. The 307 went
    out with no Set-Cookie on it at all.

    Nothing about the cookie's own settings was wrong, which is why it looked like a
    platform problem: the device cookie uses identical options and works, because it is set
    on requests whose response Next builds.

    Set here rather than by changing the jar write, so every other caller of startSession
    keeps working the way it does — this is the one route that constructs its own response.
  */
  if (session) out.cookies.set(session.name, session.value, session.options)
  return out
}
