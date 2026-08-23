import { NextResponse } from 'next/server'
import type { FeedbackSubmission } from '@/content/feedback'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Tester feedback: write once, read collated.
 *
 * The store is pluggable on purpose. A prototype should not be blocked on
 * provisioning, and a tester's answers should never be lost because a token was not
 * set yet — so when nothing is configured the route says so honestly and the client
 * falls back to a local download the facilitator can collect by hand.
 *
 * To turn on persistence:
 *   1. Vercel dashboard → Storage → create a Blob store, connect it to the project
 *   2. `vercel env pull` (or redeploy) so BLOB_READ_WRITE_TOKEN is present
 *   3. set FEEDBACK_ADMIN_KEY to any long random string — it gates reads
 */

const PREFIX = 'feedback/'

function adminKeyOk(request: Request): boolean {
  const expected = process.env.FEEDBACK_ADMIN_KEY
  if (!expected) return false
  const given =
    new URL(request.url).searchParams.get('key') ??
    request.headers.get('x-admin-key') ??
    ''
  // Length-independent comparison is overkill here, but the key is the only gate.
  return given.length === expected.length && given === expected
}

async function blob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  return import('@vercel/blob')
}

export async function POST(request: Request) {
  let body: FeedbackSubmission
  try {
    body = (await request.json()) as FeedbackSubmission
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  if (!body?.submission_id || !body?.answers) {
    return NextResponse.json({ error: 'missing submission_id or answers' }, { status: 400 })
  }

  const store = await blob()
  if (!store) {
    return NextResponse.json(
      {
        stored: false,
        reason:
          'No blob store configured. Set BLOB_READ_WRITE_TOKEN to persist; the client keeps a local copy meanwhile.',
      },
      { status: 503 },
    )
  }

  const key =
    PREFIX + body.submitted_at.slice(0, 10) + '/' + body.submission_id + '.json'
  await store.put(key, JSON.stringify(body, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  })
  return NextResponse.json({ stored: true, key })
}

export async function GET(request: Request) {
  if (!adminKeyOk(request)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const store = await blob()
  if (!store) {
    return NextResponse.json({ submissions: [], stored: false, reason: 'no blob store' })
  }
  const { blobs } = await store.list({ prefix: PREFIX, limit: 1000 })
  const submissions = await Promise.all(
    blobs.map(async (b: { url: string }) => {
      const res = await fetch(b.url, { cache: 'no-store' })
      return (await res.json()) as FeedbackSubmission
    }),
  )
  submissions.sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
  return NextResponse.json({ stored: true, count: submissions.length, submissions })
}
