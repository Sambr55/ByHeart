import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { currentUser, ensureDevice } from '@/lib/auth'
import {
  keepTranslation,
  recordTranslation,
  translationsEverywhereToday,
  translationsToday,
} from '@/lib/store'
import { readImage, translate, translatorConfigured } from '@/lib/translate'

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
/*
  AND A CEILING FOR THE WHOLE DEPLOYMENT, because a per-caller cap bounds one person.

  Sixty a day each is the friendly limit. It says nothing about a thousand callers, or one
  caller who has worked out how to look like a thousand — and the per-caller number cannot
  be raised to cover that without making the friendly limit unfriendly. Two numbers, two
  jobs: what one person may reasonably do, and what this deployment will spend in a day
  before it stops and tells me.

  Deliberately generous against real use and tight against a bill: 2,000 asks is far more
  than DUB has learners, and it is a rounding error in money. Raise it when the first
  honest day gets near it.
*/
const MAX_EVERYWHERE = Number(process.env.TRANSLATE_DAILY_CEILING ?? 2000)

/*
  A photograph, bounded before it is believed.

  Base64 costs a third on top, so this is about 1.5MB of actual image — plenty for a menu
  from a phone camera and far below the point where an upload becomes a way to make the
  server do expensive work for free. The type is read from the data URL rather than trusted
  from a field, and only the two the model accepts are allowed through.
*/
const MAX_IMAGE_B64 = 2_000_000

function readPhoto(raw: string): { data: string; media: 'image/jpeg' | 'image/png' } | null {
  const m = /^data:(image\/jpeg|image\/png);base64,([A-Za-z0-9+/=]+)$/.exec(raw.trim())
  if (!m) return null
  if (m[2].length > MAX_IMAGE_B64) return null
  return { data: m[2], media: m[1] as 'image/jpeg' | 'image/png' }
}

/**
 * Who is asking, in a form they cannot throw away and I cannot read back.
 *
 * ensureDevice mints a fresh id whenever the cookie is missing, so counting by device alone
 * meant a caller who sent no cookies counted zero on every request and was never capped at
 * all. The first forwarded hop is the thing they cannot discard.
 *
 * Hashed with a server-side salt, and this matters: an IP address in a table is personal
 * data with a retention question attached, and DUB has no use for one. A salted hash counts
 * the same caller twice without anybody — including whoever holds the database — being able
 * to turn the column back into an address. Falls back to the deployment's own secret so it
 * is never unsalted; if neither exists there is no hash and the device cap stands alone,
 * which is where this started rather than somewhere worse.
 */
function clientFingerprint(request: Request): string | null {
  const hop = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim()
  if (!hop) return null
  const salt = process.env.CLIENT_HASH_SALT ?? process.env.FEEDBACK_ADMIN_KEY ?? ''
  if (!salt) return null
  return createHash('sha256').update(salt + '|' + hop).digest('base64url').slice(0, 32)
}

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

  let body: { text?: unknown; register?: unknown; keep?: unknown; image?: unknown }
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

  /*
    A PHOTOGRAPH IS AN ASK, and it comes through here rather than through a route of its own.

    Everything below this line — the meter, the per-caller cap, the deployment ceiling, the
    row that is both the record and the meter — exists because this is the one place in DUB
    where a stranger can spend money. A second endpoint would have to say all of it again,
    and the two would drift; the first thing to drift would be the cap.

    One ask per photograph, whatever is on it. A menu costs a learner one of their day's
    allowance rather than one per line, which is both kinder and the only version that is
    affordable.
  */
  const photo = typeof body.image === 'string' ? body.image : ''
  const shot = photo ? readPhoto(photo) : null
  if (photo && !shot) {
    return NextResponse.json(
      {
        error: 'bad photo',
        why: 'That did not arrive as a photograph we can read. Try taking it again.',
      },
      { status: 400 },
    )
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text && !shot) return NextResponse.json({ error: 'empty' }, { status: 400 })
  if (!shot && text.length > MAX_CHARS) {
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
  const client = clientFingerprint(request)

  let already = 0
  try {
    already = await translationsToday(device, client)
    /*
      The ceiling is checked with the meter and fails the same way, because a ceiling that
      is skipped when the count is unavailable is not a ceiling.
    */
    const everywhere = await translationsEverywhereToday()
    if (everywhere !== null && everywhere >= MAX_EVERYWHERE) {
      return NextResponse.json(
        {
          error: 'ceiling',
          why: 'The translator has done all it is doing today. Nothing is wrong with your ask — this is ours.',
        },
        { status: 503 },
      )
    }
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
    /*
      A photograph gets longer, because it is doing more.

      Twelve seconds is the right ceiling for a sentence typed in a shop. Reading a menu is
      a bigger call and a slower one, and aborting a photograph at twelve seconds would
      spend the money and then show a failure — the worst of both. Twenty-five is still
      inside the platform's own timeout.
    */
    const bail = setTimeout(() => controller.abort(), shot ? 25_000 : 12_000)

    if (shot) {
      const seen = await readImage({
        image: shot.data,
        media: shot.media,
        register,
        signal: controller.signal,
      }).finally(() => clearTimeout(bail))

      /*
        Recorded like any other ask, because it IS one — it is the row the meter counts.

        `ask` says what was asked rather than storing the photograph: DUB has no use for a
        picture of somebody's lunch, and a table of them is a retention question nobody
        wants. The Portuguese that came back is kept, because that is the part a learner
        may want again.
      */
      try {
        await recordTranslation(
          device,
          user?.id ?? null,
          {
            ask: 'a photograph',
            answer: seen.lines.map((l) => l.pt).join(' / '),
            note: seen.note,
            direction: 'pt-en',
          },
          client,
        )
      } catch {
        /* The reading still happened. */
      }

      return NextResponse.json({
        lines: seen.lines,
        note: seen.note,
        left: Math.max(0, MAX_PER_DAY - already - 1),
      })
    }

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
      const written = await recordTranslation(
        device,
        user?.id ?? null,
        {
        ask: text,
        answer: result.pt,
        note: result.note,
        direction: result.direction,
        },
        client,
      )
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
    // What the upstream said and which model we asked about, for the statuses that need it.
    const detail = message.replace(/^upstream \d+:?\s*/, '').slice(0, 200)
    const why =
      (e as Error)?.name === 'AbortError'
        ? 'That took too long. Try again.'
        : status === 401 || status === 403
          ? 'The translator key was refused (' + status + '). That is ours to fix.'
          : status === 429
            ? 'The translator is out of credit or asking too fast (429). Ours to fix.'
            : status === 404
              ? 'The translator is pointed at a model that is not there (404). Ours to fix.'
              /*
                Three workspace failures, three sentences.

                They all say "workspace" and they need three different actions: set the
                variable, correct its value, or check the key. One message for all three
                tells somebody who has already done the first to do it again — which is what
                happened, and cost another round trip.
              */
              : /workspace/i.test(detail) && !process.env.ANTHROPIC_WORKSPACE_ID
                ? 'The translator key is an organisation key and needs ANTHROPIC_WORKSPACE_ID set alongside it. Ours to fix.'
                : /workspace/i.test(detail) &&
                    !(process.env.ANTHROPIC_WORKSPACE_ID ?? '').startsWith('wrkspc_')
                  ? 'ANTHROPIC_WORKSPACE_ID is set but is not a workspace ID — they begin with wrkspc_. Ours to fix.'
                  : /workspace/i.test(detail)
                    ? 'The workspace ID was refused. It looks right but is not one this key can use. Ours to fix.'
                : status
                ? 'The translator answered ' + status + '. ' + detail + ' That is ours to fix.'
                : 'Could not reach the translator. Try again in a moment.'
    /*
      THE RAW FACT TRAVELS ALONGSIDE THE FRIENDLY SENTENCE, rather than instead of it.

      The friendly sentence is chosen by matching on the upstream's words, so any OTHER
      failure containing "workspace" — a wrong id, a revoked one — renders as the same
      advice, and somebody who has already followed that advice is told to follow it again.
      That is the exact fault this whole chain has been about: a specific fact replaced by a
      general sentence, one level below where anybody reads it.

      `detail` carries what was actually said. `workspace` says only WHETHER the id is set,
      never its value — enough to tell "not configured" from "configured and refused", which
      are the same screen and completely different problems.
    */
    return NextResponse.json(
      {
        error: 'upstream',
        status,
        why,
        detail,
        workspace: Boolean(process.env.ANTHROPIC_WORKSPACE_ID),
      },
      { status: 502 },
    )
  }
}
