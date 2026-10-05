import { NextResponse } from 'next/server'
import { currentUser } from '@/lib/auth'
import { openTables, seatsFor, takeSeat, releaseSeat, whoElse, SEATS } from '@/lib/tables'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The tables somebody could sit at, and who else is coming.
 *
 * ANONYMOUS CALLERS GET THE LIST, which is deliberate: the whole argument for a table is
 * made by seeing one, and hiding it behind an account would mean explaining the idea to
 * somebody in words instead of showing them a Wednesday. What they do not get is the
 * names — see whoElse, which is only called for a signed-in member.
 */
export async function GET() {
  const user = await currentUser()
  const tables = await openTables()
  const mine = user ? await seatsFor(user.id) : []

  const withPeople = await Promise.all(
    tables.map(async (t) => ({
      id: t.id,
      place: t.place,
      area: t.area,
      sitsAt: t.sits_at,
      seats: t.seats,
      taken: t.taken,
      sitting: mine.includes(t.id),
      /*
        Names only for somebody who is actually in the room. A stranger browsing sees how
        many seats are left and nothing about who is in them, which is the same rule the
        ticker follows and for the same reason.
      */
      people: user ? await whoElse(t.id, user.id) : [],
    })),
  )

  return NextResponse.json({ tables: withPeople, seats: SEATS, signedIn: Boolean(user) })
}

/**
 * Take a seat, or give one back.
 *
 * THE BAR IS CHECKED ON THE SERVER, from the proof the client sends — and that is worth
 * being honest about: the record lives on the device, so this trusts a number the caller
 * supplies. It is the same trust the rest of the product already places in the learner's
 * own record, and the thing it protects is a dinner rather than a payment. What it stops
 * is the accidental case — somebody tapping through before they are ready — rather than a
 * determined one, and the honest place to say so is here rather than in a claim that this
 * is secure.
 */
export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'sign-in required' }, { status: 401 })

  let body: { table?: string; said?: number; release?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const tableId = (body.table ?? '').trim()
  if (!tableId) return NextResponse.json({ error: 'bad request' }, { status: 400 })

  if (body.release) {
    const done = await releaseSeat({ tableId, userId: user.id })
    return NextResponse.json({ state: done ? 'released' : 'gone' })
  }

  const said = Math.max(0, Math.floor(Number(body.said ?? 0)))
  const state = await takeSeat({ tableId, userId: user.id, saidCold: said })
  return NextResponse.json({ state }, { status: state === 'unavailable' ? 503 : 200 })
}
