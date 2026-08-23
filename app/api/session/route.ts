import { NextResponse } from 'next/server'
import { adminKeyValid, currentUser, ensureDevice } from '@/lib/auth'
import { listSessions, recordEvents, saveSession, layer } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Session records for multi-user testing.
 *
 * Feedback answers are only half the picture: an opinion is unreadable without the
 * behaviour that produced it. This stores the session itself — who tested, which
 * world they chose, what they built, how the no-cue beats went — so a facilitator
 * reads the two side by side instead of collating a dozen phones by hand.
 *
 * Storage is whatever is provisioned: Postgres, else Blob, else nothing. The local
 * copy on the device stays authoritative either way, so an unprovisioned
 * environment costs a tester nothing.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body.session_id) return NextResponse.json({ error: 'missing session_id' }, { status: 400 })

  const device = await ensureDevice()
  const user = await currentUser()
  const where = await saveSession(device, user?.id ?? null, body)

  // The event buffer travels with the session record. Sending it separately meant a
  // tester who closed the tab lost the run-up to whatever they were complaining about.
  const events = Array.isArray(body.events) ? (body.events as { name: string }[]) : []
  if (events.length) await recordEvents(device, user?.id ?? null, events)

  if (where === 'none') {
    return NextResponse.json(
      { stored: false, reason: 'No store configured. Set DATABASE_URL or BLOB_READ_WRITE_TOKEN.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ stored: true, layer: where })
}

export async function GET(request: Request) {
  const key =
    new URL(request.url).searchParams.get('key') ?? request.headers.get('x-admin-key')
  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const sessions = await listSessions()
  return NextResponse.json({ stored: layer() !== 'none', layer: layer(), count: sessions.length, sessions })
}
