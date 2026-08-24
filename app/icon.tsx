import { ImageResponse } from 'next/og'
import { DUB_MARK } from '@/content/marks'

export const contentType = 'image/png'

/**
 * The mark: the U and its speech-bubble tail.
 *
 * It drew the word DUB until now, which is the one thing an icon must not do — three
 * letters at 16px are three grey smudges. The U is the glyph carrying the tail, the tail
 * is the idea in the mark, and a single bold letterform is what survives a browser tab.
 *
 * TWO SIZES, because they have different jobs and a downscale cannot serve both. At 512
 * this is an azulejo tile — the frame and the four corner motifs, the same thing that
 * appears as the band under every header and the block on every crate card. At 32 all of
 * that turns to mud, so the frame goes and the letterform gets the whole square. Checked
 * at 16px rather than assumed.
 *
 * Written for Satori: explicit top/right/bottom/left rather than the `inset` shorthand,
 * which it ignores — that is what once turned the tile into a rectangle with the letters
 * hanging off its edge. It renders <svg> and <path>, so this is the real mark rather
 * than a redrawing of it, and lint:content fails if it stops matching the file.
 */
export function generateImageMetadata() {
  return [
    { id: 'small', size: { width: 32, height: 32 }, contentType: 'image/png' },
    { id: 'tile', size: { width: 512, height: 512 }, contentType: 'image/png' },
  ]
}

// `id` arrives as a Promise in Next 16 — awaited, not read. Read directly it is an
// object, `id === 'tile'` is quietly false, and both sizes render the small variant
// with no error anywhere. Caught by rendering them and looking.
export default async function Icon({ id }: { id: Promise<string> }) {
  const tile = (await id) === 'tile'
  const size = tile ? { width: 512, height: 512 } : { width: 32, height: 32 }

  const motif = (style: Record<string, number>) => ({
    position: 'absolute' as const,
    width: 22,
    height: 22,
    background: '#efe7d9',
    transform: 'rotate(45deg)',
    display: 'flex',
    ...style,
  })

  const glyph = (w: number, h: number) => (
    <svg viewBox={DUB_MARK.viewBox} width={w} height={h} fill="#efe7d9" fillRule="evenodd">
      <path d={DUB_MARK.d} />
    </svg>
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5d8c',
        }}
      >
        {tile ? (
          <div
            style={{
              position: 'absolute',
              top: 46,
              right: 46,
              bottom: 46,
              left: 46,
              border: '9px solid #efe7d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={motif({ top: 14, left: 14 })} />
            <div style={motif({ top: 14, right: 14 })} />
            <div style={motif({ bottom: 14, left: 14 })} />
            <div style={motif({ bottom: 14, right: 14 })} />
            {glyph(196, 230)}
          </div>
        ) : (
          glyph(22, 26)
        )}
      </div>
    ),
    size,
  )
}
