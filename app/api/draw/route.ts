import { NextResponse } from 'next/server'
import { currentUser, deviceId } from '@/lib/auth'
import { db } from '@/lib/db'
import { loadLearnersFor } from '@/lib/store'
import { mergeLearner } from '@/lib/merge'
import { enterDraw } from '@/lib/venues'
import { drawOn } from '@/lib/venue-rules'
import { DRAW_TERMS } from '@/content/board'
import { isFreeRoom } from '@/lib/entitlements'
import { pathUnits } from '@/content/path'
import { gemsHomeFirst } from '@/content/gems'
import { WALKS } from '@/content/walks'
import { pathView } from '@/components/path/progress'
import { lapOf } from '@/components/path/lap'
import type { LearnerState } from '@/engine/learner'
import type { Purpose } from '@/content/situations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * A FINISHED BOARD, ENTERED IN THE DRAW (Sam, 2026-11-05) — only while PRIZE_DRAW is on.
 *
 * Checked here, not taken on the phone's word: the learner's own synced record must have
 * the board's free rooms laid (the paid ones are stepped over, as on the board, so a free
 * learner can finish too — the free route a UK draw needs), and the extra entry needs a
 * check-in at every venue on the board.
 */
export async function POST(req: Request) {
  if (!drawOn() || !DRAW_TERMS) return NextResponse.json({ result: 'off' })
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'signin' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { board?: unknown; free?: unknown }
  /* THE FREE ROUTE: one entry a month for anybody signed in, no board needed — what a UK draw needs. */
  if (b.free === true) {
    const n = await enterDraw(user.id, 'free:' + new Date().toISOString().slice(0, 7), ['board'])
    return NextResponse.json({ result: typeof n === 'number' ? 'in' : n, entries: typeof n === 'number' ? n : 0 })
  }
  const m = typeof b.board === 'string' ? b.board.match(/^(visiting|staying|moving):([a-z_]+)$/) : null
  if (!m) return NextResponse.json({ error: 'board' }, { status: 400 })
  const purpose = m[1] as Purpose
  const now = new Date()
  const units = pathUnits(undefined, now, purpose)
  const index = units.findIndex((u) => u.id === m[2])
  if (index < 0) return NextResponse.json({ error: 'board' }, { status: 400 })

  const device = (await deviceId()) ?? ''
  const states = (await loadLearnersFor(device, user.id)) as Partial<LearnerState>[]
  const rec = states.reduce<Partial<LearnerState>>((a, s) => mergeLearner(a, s), {})
  const view = pathView(
    { finished_cards: rec.finished_cards ?? [], proof: rec.proof ?? [], evidence: rec.evidence ?? [], mission_completed_at: rec.mission_completed_at ?? {} } as never,
    units,
    (id) => (isFreeRoom(id, purpose) ? 'open' : 'paid'),
    now,
  )
  const lap = lapOf(view, index, purpose, { gems: gemsHomeFirst(rec.chapter ?? 'lisbon'), rows: [], walks: WALKS, chapter: rec.chapter ?? 'lisbon' })
  if (!lap.complete) return NextResponse.json({ result: 'unfinished' }, { status: 422 })

  const venues = lap.squares.flatMap((s) => (s.kind === 'venue' ? [s.gem.id] : []))
  const sql = db()
  const been = sql ? new Set((await sql<{ gem: string }[]>`select gem from venue_checkins where user_id = ${user.id}`).map((r) => r.gem)) : new Set<string>()
  const all = venues.length > 0 && venues.every((g) => been.has(g))
  const n = await enterDraw(user.id, m[0], all ? ['board', 'venues'] : ['board'])
  return NextResponse.json({ result: typeof n === 'number' ? 'in' : n, entries: typeof n === 'number' ? n : 0, venuesToGo: venues.filter((g) => !been.has(g)).length })
}
