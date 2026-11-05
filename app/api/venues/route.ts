import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { venueBoard } from '@/lib/venues'
import { holidayOn } from '@/lib/venue-rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Every venue's count, the partners' offers, where you've been, and which prizes are on. */
export async function GET() {
  const user = await currentUser()
  const b = await venueBoard(user?.id ?? null)
  return NextResponse.json({
    counts: b?.counts ?? {},
    partners: b?.partners ?? {},
    mine: b?.mine ?? [],
    signedIn: Boolean(user),
    draw: b?.draw ?? false,
    holiday: holidayOn(),
  })
}
