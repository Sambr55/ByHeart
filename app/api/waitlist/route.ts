import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** One field, one promise, and no account. */
export async function POST(request: Request) {
  let body: { email?: string; note?: string }
  try {
    body = (await request.json()) as { email?: string; note?: string }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, reason: 'That does not look like an email.' }, { status: 400 })
  }
  const sql = db()
  if (!sql) {
    return NextResponse.json({ ok: false, reason: 'Not switched on yet.' }, { status: 503 })
  }
  // Signing up twice is somebody tapping the button again, not an error.
  await sql`
    insert into waitlist (email, note) values (${email}, ${body.note ?? null})
    on conflict (email) do nothing
  `
  return NextResponse.json({ ok: true })
}
