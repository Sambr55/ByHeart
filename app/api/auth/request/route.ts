import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDevice, issueLoginToken } from '@/lib/auth'
import { debugLinksOn, sendable, sendLoginLink } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Ask for a sign-in link.
 *
 * Always answers the same way whether or not the address exists. Sign-in is a
 * public endpoint, and a different response for a known address turns it into a
 * "does this person use DUB?" oracle.
 */
export async function POST(request: Request) {
  if (!db()) {
    return NextResponse.json(
      { ok: false, reason: 'Accounts need a database. Set DATABASE_URL and run npm run db:migrate.' },
      { status: 503 },
    )
  }

  let email = ''
  try {
    email = String(((await request.json()) as { email?: string }).email ?? '').trim()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ ok: false, reason: 'That does not look like an email address.' }, { status: 400 })
  }

  await ensureDevice()
  const link = await issueLoginToken(email)
  if (!link) return NextResponse.json({ ok: false, reason: 'could not issue a link' }, { status: 500 })

  const delivered = await sendLoginLink(email, link.url)

  // Before an email domain is verified there is no way to receive the link, so a
  // facilitated session can opt into getting it back in the response. Guarded by an
  // env var precisely because it hands out a session to whoever asks.
  if (!delivered && debugLinksOn()) {
    return NextResponse.json({ ok: true, sent: false, debug_url: link.url })
  }
  return NextResponse.json({ ok: true, sent: delivered, configured: sendable() })
}
