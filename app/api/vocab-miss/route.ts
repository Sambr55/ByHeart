import { NextResponse } from 'next/server'
import { adminKeyValid, currentUser, ensureDevice } from '@/lib/auth'
import { listVocabMisses, saveVocabMiss } from '@/lib/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The content backlog, collected by the product rather than asked for.
 *
 * Every write is best-effort and every failure is silent, because a learner searching
 * the library must never be shown an error about telemetry. GET is the useful half:
 * the words people wanted and DUB could not answer, most-wanted first.
 */
export async function POST(request: Request) {
  let body: { query?: unknown; scope?: unknown }
  try {
    body = (await request.json()) as { query?: unknown; scope?: unknown }
  } catch {
    return NextResponse.json({ logged: false }, { status: 400 })
  }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 64) : ''
  // Two characters is where a search starts meaning something. Below that it is typing.
  if (query.length < 2) return NextResponse.json({ logged: false })

  const scope = body.scope === 'mine' ? 'mine' : 'all'
  try {
    const where = await saveVocabMiss(await ensureDevice(), (await currentUser())?.id ?? null, {
      query,
      scope,
    })
    return NextResponse.json({ logged: where !== 'none', layer: where })
  } catch {
    return NextResponse.json({ logged: false })
  }
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') ?? request.headers.get('x-admin-key')
  if (!adminKeyValid(key)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const misses = await listVocabMisses()
  return NextResponse.json({ count: misses.length, misses })
}
