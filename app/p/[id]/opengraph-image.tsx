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
          background: '#07090c',
          color: '#f3f0e9',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: '#8a96a3' }}>
            SAID COLD, WITH NOTHING ON SCREEN
          </div>
          <div style={{ fontSize: 62, fontWeight: 700, marginTop: 18, lineHeight: 1.1 }}>
            {(card?.count ?? 0) + ' things they can say in Portuguese.'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {lines.map((l) => (
            <div key={l.pt} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 40, color: '#e8b04b', fontWeight: 600 }}>{l.pt}</div>
              <div style={{ fontSize: 24, color: '#8a96a3', marginTop: 4 }}>{l.en}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 26, color: '#8a96a3' }}>No streak involved.</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 8 }}>DUB</div>
        </div>
      </div>
    ),
    size,
  )
}
