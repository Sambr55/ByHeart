import { NextResponse, type NextRequest } from 'next/server'

/**
 * THE OTHER HALF OF THE www → app.thisisdub.club HANDOFF (2026-11-02).
 *
 * Sam: "Will existing users get redirected?" — and arrive as themselves, which is the part
 * that needed code. This app used to live on www.thisisdub.club, so every existing
 * learner's `dub_device` and `dub_session` cookies are scoped to www and are never sent
 * here. The marketing site now serves www, and its proxy.ts copies those two values into
 * domain-wide handoff cookies (.thisisdub.club, httpOnly, secure).
 *
 * Here, on the first request that carries a handoff and lacks the real cookie, the value
 * is adopted as this host's own cookie — set on the response for the browser, and on the
 * request itself so the page being rendered right now already knows who this is. Then the
 * handoff cookies are cleared. From there the app does what it always does: useRestore()
 * on the Club asks /api/session?mine=1, which loads the learner by device and session,
 * and the path comes back.
 *
 * ADOPT ONLY WHEN MISSING. A device that already has its own cookie on this host keeps
 * it; overwriting would detach whatever it has done here. Before the cutover nobody has
 * one, so in practice every existing learner is adopted on their first visit.
 *
 * Cookie options mirror lib/auth.ts (ensureDevice, startSession). The session's real
 * expiry lives in the database, so the browser lifetime here is a ceiling, not the truth.
 */
const DOMAIN = '.thisisdub.club'
const ADOPT = [
  { handoff: 'dub_handoff_device', cookie: 'dub_device', maxAge: 60 * 60 * 24 * 365 * 2 },
  { handoff: 'dub_handoff_session', cookie: 'dub_session', maxAge: 60 * 60 * 24 * 90 },
] as const

export function proxy(request: NextRequest) {
  const adopt = ADOPT.filter((a) => request.cookies.get(a.handoff)?.value)
  if (adopt.length === 0) return NextResponse.next()

  const taken: { cookie: string; value: string; maxAge: number }[] = []
  for (const a of adopt) {
    const value = request.cookies.get(a.handoff)!.value
    if (!request.cookies.get(a.cookie)?.value) {
      request.cookies.set(a.cookie, value)
      taken.push({ cookie: a.cookie, value, maxAge: a.maxAge })
    }
  }

  const response = NextResponse.next({ request })
  for (const t of taken) {
    response.cookies.set(t.cookie, t.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: t.maxAge,
    })
  }
  for (const a of adopt) {
    response.cookies.set(a.handoff, '', { domain: DOMAIN, path: '/', maxAge: 0 })
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|mp3|ico)$).*)'],
}
