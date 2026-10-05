import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { broadcast, reachable, pushConfigured } from '@/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Telling everybody who has DUB on their phone something.
 *
 * Sam: "We also need a method of pushing these updates to people who have already
 * downloaded the app."
 *
 * ADMIN ONLY, and guarded the way every admin route here is — timing-safe compare against
 * FEEDBACK_ADMIN_KEY read from a header, and a 404 rather than a 401 so the route does not
 * confirm its own existence. A broadcast endpoint that could be found and called is the
 * worst possible thing to leave open: it reaches every phone at once.
 */
function denied() {
  return NextResponse.json({ error: 'not found' }, { status: 404 })
}

export async function GET(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return denied()
  return NextResponse.json({ reachable: await reachable(), configured: pushConfigured() })
}

export async function POST(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return denied()

  let body: { title?: string; body?: string; url?: string; tag?: string; dryRun?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const title = (body.title ?? '').trim()
  const text = (body.body ?? '').trim()
  const tag = (body.tag ?? '').trim()
  if (!title || !text || !tag) {
    return NextResponse.json({ error: 'a title, a body and a tag are required' }, { status: 400 })
  }
  /*
    A LOCK SCREEN IS NOT A PAGE. Android truncates around 65 characters of body and iOS
    rather less; anything longer is written and never read. Refused rather than silently
    cut, so the person writing it finds out while they can still fix it.
  */
  if (title.length > 48 || text.length > 140) {
    return NextResponse.json(
      { error: 'too long for a lock screen — 48 for the title, 140 for the body' },
      { status: 400 },
    )
  }

  const result = await broadcast({
    title,
    body: text,
    url: body.url?.trim() || '/',
    tag,
    dryRun: Boolean(body.dryRun),
  })
  return NextResponse.json(result)
}
