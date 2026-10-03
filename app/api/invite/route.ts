import { NextResponse } from 'next/server'
import { currentUser, deviceId, ensureDevice } from '@/lib/auth'
import { acceptInvite, invitesFrom, mintInvite } from '@/lib/invites'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Invitations: mint one, take one up, and list your own.
 *
 * NOTHING HERE TOUCHES A CONTACT LIST. The invitation travels through the operating
 * system's own share sheet — see components/Friends.tsx — so the sender's phone book never
 * leaves their phone and this route has no parameter that could carry one. That is a
 * deliberate ceiling rather than a first version: reading contacts is the most invasive
 * permission an app can ask for, and DUB's consent screen promises the opposite.
 *
 * Signed out works, like everything else in the Club that matters. The device cookie is a
 * party in its own right, so somebody can bring a friend in before they have an account
 * and still be paid for it when they get one.
 */
export async function POST(request: Request) {
  let body: { code?: unknown; chapter?: unknown; pair?: unknown }
  try {
    body = (await request.json()) as { code?: unknown; chapter?: unknown; pair?: unknown }
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const user = await currentUser()
  const device = await ensureDevice()

  /*
    A code in the body means "I am taking this one up"; no code means "mint me one". One
    route rather than two because they are the two halves of a single act and the party
    resolution — user and device, in that order of preference — is identical for both.
  */
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (code) {
    const out = await acceptInvite({ code, userId: user?.id ?? null, device })
    return NextResponse.json(out, { status: out.ok ? 200 : 409 })
  }

  const invite = await mintInvite({
    userId: user?.id ?? null,
    device,
    chapter: typeof body.chapter === 'string' ? body.chapter : null,
    pair: typeof body.pair === 'string' ? body.pair : null,
  })
  if (!invite) {
    return NextResponse.json({ ok: false, reason: 'no database configured' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, invite })
}

/** The invitations this learner has out, and what became of them. */
export async function GET() {
  const user = await currentUser()
  const device = await deviceId()
  const invites = await invitesFrom({ userId: user?.id ?? null, device })
  return NextResponse.json({ ok: true, invites })
}
