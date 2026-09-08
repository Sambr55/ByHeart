import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { markReviewed, openReports } from '@/lib/showings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The reports, for the person who reads them.
 *
 * "A way to say this was not okay, that a person reads" was in the obligations list from
 * the start, and a report button writing to a table nobody opens is worse than no button:
 * it makes a promise on a screen where somebody is already upset.
 *
 * Admin key, like every other operational route here. There is no UI for it inside the
 * product because the person who reads these is not a member.
 */
/*
  THE HEADER, AND ONLY THE HEADER — and this route is the one that had no other way.

  Three of the admin routes accepted `x-admin-key` as an alternative and no caller used it.
  This one read the query string alone, so there was nothing to switch to: the key was
  written into the access log on every poll of the reports queue with no header path
  available even to a caller who wanted one. That is why it is worth naming here rather
  than fixing quietly — the pattern existed elsewhere in the codebase and this route is
  where it was dropped.
*/
function adminHeader(request: Request): string | null {
  return request.headers.get('x-admin-key')
}

export async function GET(request: Request) {
  if (!adminKeyValid(adminHeader(request))) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, reports: await openReports() })
}

export async function POST(request: Request) {
  if (!adminKeyValid(adminHeader(request))) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }
  let body: { id?: unknown }
  try {
    body = (await request.json()) as { id?: unknown }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const id = Number(body.id)
  if (!Number.isFinite(id)) return NextResponse.json({ ok: false }, { status: 400 })
  await markReviewed(id)
  return NextResponse.json({ ok: true })
}
