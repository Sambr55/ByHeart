import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import { keepTranslation, recordTranslation, translationsToday } from '@/lib/store'
import { translate, translatorConfigured } from '@/lib/translate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The one place in DUB where a stranger can spend money.
 *
 * Everything else here is static content and a database DUB pays a flat rate for. This
 * route calls a metered API on text somebody typed, which makes it the only endpoint
 * where "it works" and "it is safe to leave running" are different questions.
 *
 * So three limits, in ascending order of how much they cost to breach:
 *
 * A length cap, because a translator is for a sentence and anything past a few hundred
 * characters is somebody pasting a document — the cap is on characters rather than a
 * token estimate, since that is the number a person can be told.
 *
 * A daily count per device, read from the log rather than held in memory. A serverless
 * platform recycles processes between requests, so an in-process limiter is a limiter
 * that resets whenever the platform feels like it, which is to say not one.
 *
 * And the key itself. With no ANTHROPIC_API_KEY the route reports that it is off and the
 * floating button never renders — DUB has to run with zero configuration, and an unset
 * key must degrade the product rather than break it.
 */
const MAX_CHARS = 300
const MAX_PER_DAY = Number(process.env.TRANSLATE_DAILY_CAP ?? 60)

export async function GET() {
  /*
    Whether to show the button at all, answered by the server.

    The client cannot know if a key is configured, and a floating button that opens a
    panel that can only apologise is worse than no button: it costs a tap and teaches
    somebody the product is broken.
  */
  return NextResponse.json({ on: translatorConfigured() })
}

export async function POST(request: Request) {
  if (!translatorConfigured()) {
    return NextResponse.json({ error: 'off', why: 'The translator is not switched on.' }, { status: 503 })
  }

  let body: { text?: unknown; register?: unknown; keep?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }

  const device = await ensureDevice()
  const user = await currentUser()

  /*
    KEEP is the same route, because it is the same row.

    A second endpoint would need the id, the device and its own guard to say the same
    thing this one already says, and the two would drift.
  */
  if (typeof body.keep === 'number') {
    const ok = await keepTranslation(device, body.keep)
    return NextResponse.json({ kept: ok })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 })
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      {
        error: 'too long',
        why: 'A sentence at a time. That is longer than ' + MAX_CHARS + ' characters.',
      },
      { status: 400 },
    )
  }

  const already = await translationsToday(device)
  if (already >= MAX_PER_DAY) {
    return NextResponse.json(
      {
        error: 'enough',
        why: 'That is ' + MAX_PER_DAY + ' translations today. It resets tomorrow.',
      },
      { status: 429 },
    )
  }

  const register = body.register === 'formal' ? 'formal' : 'tu'

  try {
    /*
      A ceiling on how long a learner waits.

      The panel is opened mid-sentence in a shop. Twelve seconds is already far past
      useful, and without an abort a stalled upstream holds the request until the
      platform's own timeout — which is a spinner that never resolves.
    */
    const controller = new AbortController()
    const bail = setTimeout(() => controller.abort(), 12_000)
    const result = await translate({ text, register, signal: controller.signal }).finally(() =>
      clearTimeout(bail),
    )

    /*
      Logged after the answer, not before.

      The row is the meter as well as the backlog, so writing it on the way in would
      charge somebody for a call that failed. Best-effort: a learner standing in a shop
      must never be shown an error about our record-keeping.
    */
    let id: number | null = null
    try {
      const written = await recordTranslation(device, user?.id ?? null, {
        ask: text,
        answer: result.pt,
        note: result.note,
        direction: result.direction,
      })
      id = written.id
    } catch {
      /* The translation still happened. */
    }

    return NextResponse.json({ ...result, id, left: Math.max(0, MAX_PER_DAY - already - 1) })
  } catch (e) {
    const why =
      (e as Error)?.name === 'AbortError'
        ? 'That took too long. Try again.'
        : 'Could not reach the translator. Try again in a moment.'
    return NextResponse.json({ error: 'upstream', why }, { status: 502 })
  }
}
