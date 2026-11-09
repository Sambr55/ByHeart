import { NextResponse } from 'next/server'
import { consumeLoginCode, ensureDevice, returnTo, startSession, upsertUser } from '@/lib/auth'
import { claimDevice } from '@/lib/store'
import { carryDeviceComp } from '@/lib/comp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * THE CODE FROM THE EMAIL, TYPED INTO THE APP (2026-11-05). The same landing as the link
 * (/api/auth/verify): a user, a session, and this device's progress claimed — but on the
 * device the person is actually holding, which on an installed iPhone app the link is not.
 */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { email?: unknown; code?: unknown; next?: unknown }
  if (typeof b.email !== 'string' || typeof b.code !== 'string') {
    return NextResponse.json({ ok: false, reason: 'An email and a code.' }, { status: 400 })
  }
  const r = await consumeLoginCode(b.email, b.code)
  if (r === 'wrong') return NextResponse.json({ ok: false, reason: 'That code is not right. Check the email and try again.' }, { status: 422 })
  if (r === 'dead') {
    return NextResponse.json({ ok: false, dead: true, reason: 'That code has expired or had too many tries. Send a new one.' }, { status: 422 })
  }
  const user = await upsertUser(b.email.trim().toLowerCase())
  if (!user) return NextResponse.json({ ok: false, reason: 'Accounts are not available right now.' }, { status: 503 })
  const session = await startSession(user.id)
  const device = await ensureDevice()
  await claimDevice(device, user.id)
  /* Free access given to this device at launch follows the person onto their account. */
  await carryDeviceComp(device, user.id)
  const out = NextResponse.json({ ok: true, next: returnTo(typeof b.next === 'string' ? b.next : null) })
  /* On this response itself, as /api/auth/verify learned: a constructed response does not carry the jar's cookies. */
  if (session) out.cookies.set(session.name, session.value, session.options)
  return out
}
