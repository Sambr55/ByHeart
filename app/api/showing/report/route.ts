import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { REPORT_REASONS, type ReportReason } from '@/content/showing-copy'
import { reportShowing } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * This was not okay.
 *
 * A closed set of reasons and no free text — not to save work, but because a report box
 * that accepts arbitrary prose is itself a channel for sending somebody a message, and
 * the one property holding this feature's moderation obligation down is that nothing
 * arbitrary can be written anywhere in it.
 */
export async function POST(request: Request) {
  let body: { showing_id?: unknown; reason?: unknown }
  try {
    body = (await request.json()) as { showing_id?: unknown; reason?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const showing = typeof body.showing_id === 'string' ? body.showing_id.trim() : ''
  const reason = String(body.reason ?? '')
  if (!showing || !REPORT_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json({ ok: false, reason: 'missing' }, { status: 400 })
  }

  const device = await ensureDevice()
  const user = await currentUser()
  await reportShowing(showing, { userId: user?.id ?? null, deviceId: device }, reason as ReportReason)
  return NextResponse.json({ ok: true })
}
