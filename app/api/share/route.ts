import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { createShareCard, type Snapshot } from '@/lib/share'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Mint a share card and hand back its link.
 *
 * The client sends the snapshot rather than the server deriving it, because the honest
 * count lives on the device and the server's copy may be a merge behind. Capped at three
 * lines: the card is a claim, not a transcript.
 */
export async function POST(request: Request) {
  let body: Partial<Snapshot>
  try {
    body = (await request.json()) as Partial<Snapshot>
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 400 })
  }

  const lines = (Array.isArray(body.lines) ? body.lines : [])
    .filter((l) => l && typeof l.pt === 'string' && l.pt.trim())
    .slice(0, 3)
    .map((l) => ({ pt: String(l.pt).slice(0, 120), en: String(l.en ?? '').slice(0, 120) }))

  if (!lines.length) {
    return NextResponse.json(
      { ok: false, reason: 'Say something cold first — there is nothing to show yet.' },
      { status: 400 },
    )
  }

  const snapshot: Snapshot = {
    count: Math.max(0, Math.min(100000, Number(body.count) || lines.length)),
    worlds: Math.max(1, Math.min(50, Number(body.worlds) || 1)),
    lines,
    made_at: new Date().toISOString(),
  }

  const device = await ensureDevice()
  const user = await currentUser()
  const id = await createShareCard(snapshot, user?.id ?? null, device)

  if (!id) {
    return NextResponse.json(
      { ok: false, reason: 'Links are not switched on in this environment yet.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ ok: true, id, path: '/p/' + id })
}
