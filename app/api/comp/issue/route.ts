import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { issueCodes } from '@/lib/comp'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mint comp codes without holding the production connection string.
 *
 * `npm run comp:issue` needs DATABASE_URL locally, and Vercel marks it Sensitive — so
 * `vercel env pull` hands back the literal string "[SENSITIVE]" and the only way to run
 * the CLI against production is to copy a live credential onto a laptop by hand, every
 * time. This does the same job over the wire, behind the admin key that already exists.
 *
 * Guarded the same way the feedback export is: a timing-safe compare against
 * FEEDBACK_ADMIN_KEY, and a 404 rather than a 401 when it fails, so the route does not
 * confirm its own existence to somebody probing for it.
 */
export async function POST(request: Request) {
  const key =
    request.headers.get('x-admin-key') ?? new URL(request.url).searchParams.get('key')
  if (!adminKeyValid(key)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  if (!db()) {
    return NextResponse.json({ ok: false, reason: 'No database configured.' }, { status: 503 })
  }

  let body: { note?: string; uses?: number; until?: string | null; count?: number; club?: boolean }
  try {
    body = (await request.json()) as typeof body
  } catch {
    body = {}
  }

  const note = (body.note ?? 'comp').slice(0, 120)
  // Clamped rather than trusted. A typo in a curl should not mint ten thousand codes or
  // a single code good for ten thousand people.
  const uses = Math.min(Math.max(Number(body.uses ?? 1) || 1, 1), 500)
  const count = Math.min(Math.max(Number(body.count ?? 1) || 1, 1), 50)
  const until = body.until ? String(body.until) : null

  // Opt-in per code, never a default: a code that opens the Club has to be asked for.
  const club = body.club === true
  const codes = await issueCodes({ note, uses, until, count, club })
  return NextResponse.json({ ok: true, codes, note, uses, until, club, redeem_at: '/account' })
}
