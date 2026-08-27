import { NextResponse } from 'next/server'
import { adminKeyValid, currentUser, ensureDevice } from '@/lib/auth'
import {
  layer,
  listSessions,
  loadLearnersFor,
  recordEvents,
  saveLearner,
  saveSession,
  writeAllFor,
} from '@/lib/store'
import { mergeLearner } from '@/lib/merge'

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

  /**
   * The learner state travels on the session record, so this is also the moment to
   * merge it with whatever the server already holds and write the result back to every
   * row this person owns. Merging on the way UP as well as the way down is what stops a
   * second device resurrecting a stale copy the next time it syncs.
   */
  try {
    const held = await loadLearnersFor(device, user?.id ?? null)
    let merged = body as Record<string, unknown>
    for (const s of held) merged = mergeLearner(merged as never, s as never) as never
    await saveLearner(device, merged, user?.id ?? null)
    if (user?.id) await writeAllFor(user.id, merged)
  } catch {
    // A merge that refuses is doing its job. The session record is already saved and
    // the device's own copy is untouched, so nothing is lost by not writing.
  }

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

/**
 * Restore. The half of sync that did not exist.
 *
 * Progress uploaded and never came back: sign in on a new phone and you started from
 * zero, and clearing the browser lost work the server was already holding. A
 * subscription is a promise that what you built is still there next month, and until
 * this route existed it was a promise the product could not keep.
 *
 * Merges rather than returns, and merges across every row the person owns, because a
 * user has one Portuguese and not one per phone.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key') ?? request.headers.get('x-admin-key')

  if (url.searchParams.get('mine') === '1') {
    const device = await ensureDevice()
    const user = await currentUser()
    const states = await loadLearnersFor(device, user?.id ?? null)
    if (!states.length) {
      return NextResponse.json({ found: false, layer: layer(), state: null })
    }
    let merged = states[0] as Record<string, unknown>
    for (const next of states.slice(1)) {
      merged = mergeLearner(merged as never, next as never) as unknown as Record<string, unknown>
    }
    return NextResponse.json({
      found: true,
      layer: layer(),
      rows: states.length,
      /*
        Who the server thinks this is, sent alongside the state.

        The device needs it to stamp its own cache. Taken from the session rather than from
        the state, because the state is what is being restored and a record written before
        this field existed carries no owner at all — the session is the only thing here that
        knows for certain.
      */
      user_id: user?.id ?? null,
      state: merged,
    })
  }

  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const sessions = await listSessions()
  return NextResponse.json({ stored: layer() !== 'none', layer: layer(), count: sessions.length, sessions })
}
