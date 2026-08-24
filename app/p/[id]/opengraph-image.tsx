import { ImageResponse } from 'next/og'
import { getShareCard } from '@/lib/share'

export const runtime = 'nodejs'
export const alt = 'Sentences said in Portuguese with nothing on screen'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The card, as an image.
 *
 * The whole point of slice 4: the Portuguese goes IN the picture. A shared string asks
 * the reader to imagine the sentences; a rendered card shows them, and that is the
 * thing people actually screenshot and post.
 *
 * Colours are DUB's own instrument palette, hard-coded because next/og resolves no CSS
 * variables and this must render identically wherever it is unfurled.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getShareCard(id)
  const lines = card?.lines ?? []

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#efe7d9',
          color: '#1a2430',
          position: 'relative',
          padding: '56px 72px 56px 96px',
          fontFamily: 'sans-serif',
        }}
      >
        {/*
          The tile band. This is the only graphic a stranger will ever see, and at
          thumbnail size the thing that has to be recognisable is a shape, not the words —
          so the azulejo goes down the edge where it survives being scaled to a postage
          stamp in a timeline.
        */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 26,
            display: 'flex',
            background:
              'repeating-linear-gradient(45deg, #1f5d8c 0 2px, #efe7d9 2px 13px), repeating-linear-gradient(-45deg, #1f5d8c 0 2px, transparent 2px 13px)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: '#635c50' }}>
            SAID COLD, WITH NOTHING ON SCREEN
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, marginTop: 14, lineHeight: 1.08 }}>
            {(card?.count ?? 0) + ' things they can say in Portuguese.'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flexGrow: 1, justifyContent: 'center' }}>
          {lines.map((l) => (
            <div key={l.pt} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 34, color: '#1f5d8c', fontWeight: 600 }}>{l.pt}</div>
              <div style={{ fontSize: 21, color: '#635c50', marginTop: 2 }}>{l.en}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTop: '1px solid #d3c7b1' }}>
          <div style={{ fontSize: 26, color: '#a8492f' }}>No streak involved.</div>
          {/* The tile mark and the name, because a recipient who has never heard of DUB
              is being invited into something and should be able to see what. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                width: 34,
                height: 34,
                border: '3px solid #1f5d8c',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 6, color: '#1a2430' }}>
              DUB CLUB
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
