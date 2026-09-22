import { NextResponse } from 'next/server'
import { CHAPTERS, DEFAULT_CHAPTER } from '@/content/chapters'
import { dropsInMonth } from '@/content/feed'
import { db } from '@/lib/db'
import { capPerWeek, icsFor } from '@/lib/ics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The calendar somebody subscribed to, as their phone asks for it.
 *
 * NO COOKIE, NO SESSION, NO SIGN-IN. A calendar app is not a browser: it fetches this on a
 * schedule, in the background, with nothing but the URL. So the token in the path is the
 * whole of the authentication, and the row it names decides the city, the genres and the
 * cap. See db/migrations/010 for why that is an acceptable thing to put in a URL and what
 * it deliberately cannot reach.
 *
 * ALWAYS 200 WITH A CALENDAR, even when the token is unknown. A 404 to a calendar app is
 * a subscription that shows an error badge in somebody's settings forever; an empty
 * calendar is one that quietly has nothing in it, which is also what a revoked feed should
 * look like. The one exception is a database that is not there, which is a fault on our
 * side and says so.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params
  const sql = db()
  if (!sql) {
    return NextResponse.json({ ok: false, reason: 'no database' }, { status: 503 })
  }

  const rows = await sql<
    { chapter: string; genres: string[]; per_week: number }[]
  >`select chapter, genres, per_week from calendar_feeds where token = ${token}`
  const feed = rows[0]

  const chapter = (feed?.chapter ?? DEFAULT_CHAPTER) as typeof DEFAULT_CHAPTER
  const city = CHAPTERS.find((c) => c.id === chapter)?.city ?? 'Lisbon'
  const now = new Date()

  /*
    Three months ahead, which is as far as the drops themselves reach.

    A calendar subscription is read on a schedule and cached between reads, so a feed that
    only carried the next fortnight would leave somebody's diary empty for a fortnight
    every time their phone happened not to refresh. Three months is also DROP_LEAD_DAYS at
    its longest — beyond that there is nothing to say.
  */
  const drops = feed
    ? [0, 1, 2].flatMap((n) => {
        const m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + n, 1))
        return dropsInMonth(chapter, m.getUTCFullYear(), m.getUTCMonth(), now)
      })
    : []

  /* Empty genres means all of them — somebody who has never opened the filters subscribed
     to "what is on", not to nothing. */
  const wanted = feed?.genres ?? []
  const filtered = wanted.length ? drops.filter((d) => d.genre && wanted.includes(d.genre)) : drops

  const body = icsFor(capPerWeek(filtered, feed?.per_week ?? 3), {
    origin: new URL(request.url).origin,
    city,
    perWeek: feed?.per_week ?? 3,
    now,
  })

  if (feed) {
    /* Fire and forget: a failed counter must never cost somebody their calendar. */
    void sql`update calendar_feeds set fetched_at = now(), fetches = fetches + 1 where token = ${token}`.catch(
      () => {},
    )
  }

  return new NextResponse(body, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      /* Named so a download lands as a calendar rather than as `[token]`. */
      'content-disposition': 'inline; filename="dub-' + chapter + '.ics"',
      /* The refresh interval is in the body; this stops a CDN serving one learner's feed
         to another, which with a per-learner filter would be a real leak. */
      'cache-control': 'private, max-age=0, must-revalidate',
    },
  })
}
