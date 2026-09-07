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

  /*
    THE METER'S OWN FAILURE IS ITS OWN MESSAGE.

    This line sat outside the try below, so anything it threw became an unhandled 500 — and
    the client's fallback text, "could not reach the translator", which is a sentence about
    the network and the upstream. It sent me to check the key, the model and the endpoint,
    all of which were fine, while the actual fault was a missing table.

    An error should name the thing that broke. This one now does, and it fails CLOSED: the
    cap is the only thing between a text box and somebody else's money, so a meter that
    cannot be read stops the feature rather than quietly uncapping it.
  */
  let already = 0
  try {
    already = await translationsToday(device)
  } catch {
    return NextResponse.json(
      {
        error: 'meter',
        why: 'The translator cannot count today\'s asks, so it is not spending anything. This is ours to fix.',
      },
      { status: 503 },
    )
  }
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
    /*
      THE STATUS IS THE DIAGNOSIS, and it was being thrown away.

      lib/translate.ts throws `upstream 401` — the number that says which of the three
      possible faults it is: the key, the credit, or the model. This caught it and replaced
      it with "could not reach the translator", a sentence that fits all three equally and
      distinguishes none, and which is therefore no use to the one person who can fix it.

      A status code is safe to show: it is not the key and not the upstream's body, and
      anybody looking at this screen is already looking at DUB's own error.

      401 is the key. 429 is credit or rate. 404 is the model. Said in those words, because
      "upstream 401" is a sentence for somebody who already knows what it means.
    */
    const message = (e as Error)?.message ?? ''
    const status = Number(message.match(/upstream (\d+)/)?.[1] ?? 0)
    const why =
      (e as Error)?.name === 'AbortError'
        ? 'That took too long. Try again.'
        : status === 401 || status === 403
          ? 'The translator key was refused (' + status + '). That is ours to fix.'
          : status === 429
            ? 'The translator is out of credit or asking too fast (429). Ours to fix.'
            : status === 404
              ? 'The translator is pointed at a model that is not there (404). Ours to fix.'
              : status
                ? 'The translator answered ' + status + '. That is ours to fix.'
                : 'Could not reach the translator. Try again in a moment.'
    return NextResponse.json({ error: 'upstream', status, why }, { status: 502 })
  }
}
