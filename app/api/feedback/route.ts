import { NextResponse } from 'next/server'
import type { FeedbackSubmission } from '@/content/feedback'
import { adminKeyValid, currentUser, ensureDevice } from '@/lib/auth'
import { layer, listFeedback, saveFeedback } from '@/lib/store'

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
 * Preference order is Postgres, then Blob, then nothing. To turn on the good one:
 *   1. provision any Postgres (Neon, Supabase, Vercel Postgres)
 *   2. set DATABASE_URL, then `npm run db:migrate`
 *   3. set FEEDBACK_ADMIN_KEY to any long random string — it gates reads
 */
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

  const device = await ensureDevice()
  const user = await currentUser()
  const where = await saveFeedback(device, user?.id ?? null, {
    submission_id: body.submission_id,
    tester_label: (body as { tester_label?: string }).tester_label,
    answers: body.answers,
    recorded_at: body.submitted_at,
  })

  if (where === 'none') {
    return NextResponse.json(
      {
        stored: false,
        reason:
          'No store configured. Set DATABASE_URL or BLOB_READ_WRITE_TOKEN to persist; the client keeps a local copy meanwhile.',
      },
      { status: 503 },
    )
  }
  return NextResponse.json({ stored: true, layer: where })
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? request.headers.get('x-admin-key')
  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  const submissions = await listFeedback()
  return NextResponse.json({
    stored: layer() !== 'none',
    layer: layer(),
    count: submissions.length,
    submissions,
  })
}
