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

  /*
    AND AN INVITATION, when one was sent.

    Every field is clamped and re-read off the request rather than trusted, exactly as the
    lines are: this is a public page minted by an anonymous caller, so the only things that
    reach it are strings this route has measured. `from` is the sender's own display name,
    which is the one field somebody could use to put words in another person's mouth — it
    gets the shortest cap for that reason.

    An invite with no Portuguese in it is not an invite, so a malformed one is dropped
    rather than half-rendered.
  */
  const raw = body.invite
  const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)
  const invite =
    raw && typeof raw === 'object' && text(raw.pt, 1).length
      ? {
          pt: text(raw.pt, 160),
          en: text(raw.en, 160),
          from: text(raw.from, 40) || undefined,
          event: text(raw.event, 120),
          venue: text(raw.venue, 80),
          on: /^\d{4}-\d{2}-\d{2}$/.test(text(raw.on, 10)) ? text(raw.on, 10) : '',
        }
      : undefined

  const snapshot: Snapshot = {
    count: Math.max(0, Math.min(100000, Number(body.count) || lines.length)),
    worlds: Math.max(1, Math.min(50, Number(body.worlds) || 1)),
    lines,
    made_at: new Date().toISOString(),
    ...(invite ? { invite } : {}),
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
