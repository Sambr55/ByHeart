import { ImageResponse } from 'next/og'
import { DUB_MARK } from '@/content/marks'
import { getShareCard } from '@/lib/share'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'An invitation, in Portuguese'

/**
 * The card somebody actually sees in a message thread.
 *
 * Sam: "Mint and actual card with an image as a nice shareable invite."
 *
 * An invite link was arriving as a line of grey text — a URL and a title — which is the
 * least persuasive form an invitation can take. Most people who receive one will decide
 * from the preview alone and never open the page, so the preview IS the invitation and
 * the page is where it goes if they want the detail.
 *
 * DRAWN RATHER THAN SCREENSHOTTED, because the thing worth showing is one sentence of
 * Portuguese at a size nothing else on a phone competes with. The event, the venue and
 * the night sit under it as the facts they are.
 *
 * WRITTEN FOR SATORI, which is not a browser. app/icon.tsx learned this the hard way and
 * its note stands: explicit top/right/bottom/left rather than `inset`, every element that
 * contains more than one child gets an explicit `display: flex`, and no shorthand it has
 * not implemented. Fonts are fetched rather than assumed — Satori has none built in, so a
 * missing fetch is not a fallback face, it is a throw.
 */

/** Archivo, the display face, fetched as the binary Satori needs. */
async function archivo(weight: 700 | 800): Promise<ArrayBuffer | null> {
  try {
    /*
      Google's CSS API, asked for a format Satori can parse.

      The `user-agent` matters: without one Google serves woff2, which Satori cannot read.
      An old Mac UA gets plain TTF, which it can.
    */
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Archivo:wght@' + weight + '&display=swap',
      { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } },
    ).then((r) => r.text())
    const url = css.match(/src: url\((https:[^)]+)\) format\('(truetype|opentype)'\)/)?.[1]
    if (!url) return null
    return await fetch(url).then((r) => r.arrayBuffer())
  } catch {
    /* A card without the brand face is worse-looking; a card that throws does not exist. */
    return null
  }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function nightOf(on: string): string {
  if (!on) return ''
  const d = new Date(on + 'T00:00:00Z')
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]
}

export default async function InviteImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getShareCard(id)
  const inv = card?.invite

  const [bold, heavy] = await Promise.all([archivo(700), archivo(800)])
  const fonts = [
    ...(bold ? [{ name: 'Archivo', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(heavy ? [{ name: 'Archivo', data: heavy, weight: 800 as const, style: 'normal' as const }] : []),
  ]

  /*
    A PROOF CARD IS NOT AN INVITATION, so it keeps the plain mark.

    Both kinds of card come through this route — they share a table and a URL shape — and
    only one of them is addressed to a person. Rendering a proof card as "somebody is
    asking you" would be the preview lying about what the link is.
  */
  const sand = '#efe7d9'
  const azulejo = '#1f5d8c'

  if (!inv) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: azulejo,
          }}
        >
          <svg viewBox={DUB_MARK.viewBox} width={220} height={258} fill={sand} fillRule="evenodd">
            <path d={DUB_MARK.d} />
          </svg>
        </div>
      ),
      size,
    )
  }

  /*
    The Portuguese gets the room, and the size is set by its own length.

    A two-line ask and a four-line one cannot share a type size without one of them either
    overflowing or rattling around in the middle of a 630px card. Three steps, measured
    against the longest ask the templates can produce.
  */
  const n = inv.pt.length
  const asking = n > 64 ? 62 : n > 44 ? 74 : 88

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: sand,
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 3,
              color: '#635c50',
              fontWeight: 700,
            }}
          >
            {(inv.from ? inv.from.toUpperCase() + ' IS ASKING' : 'SOMEBODY IS ASKING')}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: asking,
              lineHeight: 1.1,
              color: azulejo,
              fontWeight: 800,
            }}
          >
            {inv.pt}
          </div>
          {inv.en ? (
            <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: '#3d3830' }}>
              {inv.en}
            </div>
          ) : null}
        </div>

        {/*
          The night, along the foot, with the mark at the end of it.

          borderTop rather than a rule element: one fewer box for Satori to lay out, and
          the line is a property of the row rather than a thing beside it.
        */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            borderTop: '2px solid #c9bfae',
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 34, color: '#1a1a1a', fontWeight: 700 }}>
              {inv.event}
            </div>
            <div style={{ display: 'flex', marginTop: 10, fontSize: 26, color: '#635c50' }}>
              {[nightOf(inv.on), inv.venue].filter(Boolean).join('  ·  ')}
            </div>
          </div>
          <svg viewBox={DUB_MARK.viewBox} width={56} height={66} fill={azulejo} fillRule="evenodd">
            <path d={DUB_MARK.d} />
          </svg>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  )
}
