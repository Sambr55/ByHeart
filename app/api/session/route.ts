import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Session records for multi-user testing.
 *
 * Feedback answers are only half the picture: an opinion is unreadable without the
 * behaviour that produced it. This stores the session itself — who tested, which world
 * they chose, what they built, how the no-cue beats went — so a facilitator reads the
 * two side by side instead of collating a dozen phones by hand.
 *
 * Same pluggable store as feedback, and the same rule: an unprovisioned token must
 * never cost a tester their session, so the local copy stays authoritative.
 */

const PREFIX = 'sessions/'

function adminKeyOk(request: Request): boolean {
  const expected = process.env.FEEDBACK_ADMIN_KEY
  if (!expected) return false
  const given =
    new URL(request.url).searchParams.get('key') ?? request.headers.get('x-admin-key') ?? ''
  return given.length === expected.length && given === expected
}

async function blob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  return import('@vercel/blob')
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const id = String(body.session_id ?? '')
  if (!id) return NextResponse.json({ error: 'missing session_id' }, { status: 400 })
  const at = String(body.recorded_at ?? new Date().toISOString())

  const store = await blob()
  if (!store) {
    return NextResponse.json(
      { stored: false, reason: 'No blob store configured. Set BLOB_READ_WRITE_TOKEN.' },
      { status: 503 },
    )
  }
  // One object per session, overwritten as it progresses, so a tester who reloads does
  // not fragment into several partial records.
  await store.put(PREFIX + at.slice(0, 10) + '/' + id + '.json', JSON.stringify(body, null, 2), {
    // Tester answers are personal. A public blob is readable by anyone who learns the
    // URL, and these URLs are not secret enough to carry that.
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return NextResponse.json({ stored: true })
}

export async function GET(request: Request) {
  if (!adminKeyOk(request)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const store = await blob()
  if (!store) return NextResponse.json({ sessions: [], stored: false, reason: 'no blob store' })
  const { blobs } = await store.list({ prefix: PREFIX, limit: 1000 })
  const sessions = await Promise.all(
    blobs.map(async (b: { pathname: string }) => {
      // Private blobs are not fetchable by URL; they are read back through the token.
      const found = await store.get(b.pathname, { access: 'private' })
      if (!found) return null
      const res = new Response(found.stream)
      return (await res.json()) as Record<string, unknown>
    }),
  )
  const clean = sessions.filter(Boolean) as Record<string, unknown>[]
  clean.sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))
  return NextResponse.json({ stored: true, count: clean.length, sessions: clean })
}
