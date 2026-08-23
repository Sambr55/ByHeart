import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { db } from '@/lib/db'
import { entitlementsForUser } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The Booth — real people saying the lines.
 *
 * A synthesised voice teaches you what a language is supposed to sound like. A room
 * full of actual speakers teaches you what it does sound like, which is the thing
 * that goes wrong when a learner lands. So every line in the product can carry both:
 * one reference take, and as many community takes as people care to leave.
 *
 * Submissions arrive as `pending` and are never served until reviewed. This is
 * user-generated audio attached to a product used by strangers, and the review queue
 * is not optional.
 */

const MAX_BYTES = 2_000_000 // ~60s of decent mono. Longer than any line here needs.

export async function POST(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'no audio store configured' }, { status: 503 })
  }

  const user = await currentUser()
  const device = await ensureDevice()
  const ent = await entitlementsForUser(user?.id ?? null)
  if (!ent.booth) {
    return NextResponse.json({ error: 'The Booth is part of Pro.', upgrade: true }, { status: 402 })
  }

  const form = await request.formData()
  const audio = form.get('audio')
  const lineId = String(form.get('line_id') ?? '')
  const linePt = String(form.get('line_pt') ?? '')
  const region = String(form.get('region') ?? '') || null
  const kind = form.get('speaker_kind') === 'native' ? 'native' : 'learner'
  const durationMs = Number(form.get('duration_ms') ?? 0) || null

  if (!(audio instanceof Blob)) return NextResponse.json({ error: 'no audio' }, { status: 400 })
  if (!lineId || !linePt) return NextResponse.json({ error: 'no line' }, { status: 400 })
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: 'too long' }, { status: 413 })

  const { put } = await import('@vercel/blob')
  // Private: this is somebody's voice, and it stays unlisted until it is approved.
  const stored = await put('booth/' + lineId + '/' + crypto.randomUUID() + '.webm', audio, {
    access: 'private',
    contentType: audio.type || 'audio/webm',
    addRandomSuffix: false,
  })

  const [row] = await sql`
    insert into voice_takes (line_id, line_pt, user_id, device_id, blob_url, duration_ms, region, speaker_kind)
    values (${lineId}, ${linePt}, ${user?.id ?? null}, ${device}, ${stored.url},
            ${durationMs}, ${region}, ${kind})
    returning id, status
  `
  return NextResponse.json({ ok: true, take: row })
}

/** Approved takes for one line. What the player reaches for after the reference. */
export async function GET(request: Request) {
  const sql = db()
  if (!sql) return NextResponse.json({ takes: [] })
  const lineId = new URL(request.url).searchParams.get('line_id')
  if (!lineId) return NextResponse.json({ error: 'line_id required' }, { status: 400 })

  const takes = await sql`
    select id, blob_url, region, speaker_kind, duration_ms
      from voice_takes
     where line_id = ${lineId} and status = 'approved'
     order by (speaker_kind = 'native') desc, approvals desc
     limit 12
  `
  return NextResponse.json({ takes })
}
