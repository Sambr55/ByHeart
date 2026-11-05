import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { peopleReport } from '@/lib/people'
import { compExisting } from '@/lib/comp'
import { billingConfigured, trialDays } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Registrations, sign-ups, trials, paying, cancels — /admin/people. */
export async function GET(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const r = await peopleReport()
  if (!r) return NextResponse.json({ error: 'no database' }, { status: 503 })
  return NextResponse.json({ ...r, billingReady: billingConfigured(), trialDays: trialDays() })
}

/**
 * { action: 'comp-existing', confirm: 'FREE FOR EXISTING' } — free access for every account
 * and device that exists now (lib/comp.ts compExisting). Typed confirmation, because it
 * writes to every learner at once.
 */
export async function POST(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { action?: unknown; confirm?: unknown }
  if (b.action !== 'comp-existing' || b.confirm !== 'FREE FOR EXISTING') return NextResponse.json({ error: 'confirm' }, { status: 400 })
  const r = await compExisting(new Date())
  if (!r) return NextResponse.json({ error: 'no database' }, { status: 503 })
  return NextResponse.json({ ok: true, ...r })
}
