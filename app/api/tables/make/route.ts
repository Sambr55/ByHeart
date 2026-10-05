import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { makeTable, callOffTable, allTables, whoElse } from '@/lib/tables'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Putting a table on the board, and taking one off.
 *
 * ADMIN ONLY, guarded the way every other admin route here is: a timing-safe compare
 * against FEEDBACK_ADMIN_KEY, read from a HEADER and never a query string — a key in a
 * URL is written into server logs, browser history and anything that renders a referrer
 * — and a 404 rather than a 401 when it fails, so the route does not confirm its own
 * existence to somebody probing for it.
 *
 * A MEMBER CANNOT CREATE A TABLE, and that is a product decision rather than an
 * oversight. A member who could would be arranging a meeting between strangers under
 * DUB's name, which is the moderation surface db/migrations/012_tables.sql was built to
 * avoid. Sam puts the evening up; members take seats.
 */
function denied() {
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}

export async function GET(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return denied()
  const tables = await allTables()
  /* Who is coming, for the only reader who has a reason to see every table's list. */
  const withPeople = await Promise.all(
    tables.map(async (t) => ({
      id: t.id,
      place: t.place,
      area: t.area,
      sitsAt: t.sits_at,
      seats: t.seats,
      taken: t.taken,
      state: t.state,
      people: await whoElse(t.id, null),
    })),
  )
  return NextResponse.json({ tables: withPeople })
}

export async function POST(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return denied()

  let body: { place?: string; area?: string; sitsAt?: string; seats?: number; callOff?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  if (body.callOff) {
    const done = await callOffTable(body.callOff.trim())
    return NextResponse.json({ state: done ? 'called_off' : 'gone' })
  }

  const place = (body.place ?? '').trim()
  const sitsAt = body.sitsAt ? new Date(body.sitsAt) : null
  if (!place || !sitsAt || Number.isNaN(sitsAt.getTime())) {
    return NextResponse.json({ error: 'a place and a time are required' }, { status: 400 })
  }
  /*
    A TABLE IN THE PAST IS A TYPO, and the one that would be discovered by somebody
    looking at an empty board wondering why their evening is not on it. Refused here
    rather than filtered later, so the mistake is visible at the moment it is made.
  */
  if (sitsAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'that is in the past' }, { status: 400 })
  }

  const made = await makeTable({
    place,
    area: body.area ?? null,
    sitsAt,
    seats: body.seats,
  })
  if (!made) return NextResponse.json({ error: 'could not create' }, { status: 503 })
  return NextResponse.json(made)
}
