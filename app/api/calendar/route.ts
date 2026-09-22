import { NextResponse } from 'next/server'
import { GENRES } from '@/content/calendar'
import { DEFAULT_CHAPTER } from '@/content/chapters'
import { randomBytes } from 'node:crypto'
import { currentUser, ensureDevice } from '@/lib/auth'
import { db } from '@/lib/db'

/* Minted here rather than exported from lib/auth, which keeps its own `secret` private
   on purpose — a session token and a calendar token have different lifetimes and
   different blast radii, and sharing a helper invites sharing the assumptions too. */
const feedToken = () => randomBytes(24).toString('base64url')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IDS = new Set(GENRES.map((g) => g.id as string))

/**
 * Mint or adjust the calendar somebody can subscribe to.
 *
 * ONE FEED PER DEVICE, AND THE TOKEN NEVER CHANGES. A calendar subscription that changes
 * its address whenever somebody adjusts a filter is one that silently stops updating —
 * the phone keeps the old URL, gets nothing, and shows no error. So this upserts: the
 * same token comes back every time and the filters are read at fetch time.
 *
 * The genres are validated against the authored list rather than stored as sent, because
 * this writes an array that a later query filters on, and an unknown genre would be a row
 * that quietly matches nothing forever.
 */
export async function POST(request: Request) {
  const sql = db()
  if (!sql) {
    return NextResponse.json(
      { ok: false, reason: 'Subscribing needs a database. Set DATABASE_URL.' },
      { status: 503 },
    )
  }

  let genres: string[] = []
  let perWeek = 3
  let chapter: string = DEFAULT_CHAPTER
  try {
    const body = (await request.json()) as {
      genres?: unknown
      perWeek?: unknown
      chapter?: unknown
    }
    if (Array.isArray(body.genres)) genres = body.genres.filter((g): g is string => typeof g === 'string' && IDS.has(g))
    if (typeof body.perWeek === 'number') perWeek = Math.max(1, Math.min(14, Math.round(body.perWeek)))
    if (typeof body.chapter === 'string') chapter = body.chapter
  } catch {
    /* An empty body is a valid ask: give me everything, three a week. */
  }

  const device = await ensureDevice()
  const user = await currentUser()

  const rows = await sql<{ token: string }[]>`
    insert into calendar_feeds (token, device_id, user_id, chapter, genres, per_week)
    values (${feedToken()}, ${device}, ${user?.id ?? null}, ${chapter}, ${genres}, ${perWeek})
    on conflict (device_id) do update
      set chapter  = excluded.chapter,
          genres   = excluded.genres,
          per_week = excluded.per_week,
          user_id  = coalesce(calendar_feeds.user_id, excluded.user_id)
    returning token
  `
  const token = rows[0]?.token
  if (!token) return NextResponse.json({ ok: false, reason: 'could not mint a feed' }, { status: 500 })

  const origin = new URL(request.url).origin
  return NextResponse.json({
    ok: true,
    /* webcal:// is what makes a phone offer to SUBSCRIBE rather than download a file once
       — the same URL, and the scheme is the whole difference between a living calendar
       and a snapshot that never updates. */
    subscribe: origin.replace(/^https?:/, 'webcal:') + '/api/calendar/' + token,
    url: origin + '/api/calendar/' + token,
  })
}
