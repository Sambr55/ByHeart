import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * The mark: one azulejo tile with DUB in it.
 *
 * There was a wordmark and no logo, and the icon was still cockpit black on instrument
 * amber — the one piece of DUB a person sees every day, left behind by the repaint.
 *
 * A tile is the right form because it is what DUB is made of everywhere else: the band
 * under the header, the block on a crate card, the strip down the share card. At
 * home-screen size the only things that survive are the ground colour, the frame and the
 * shape of the letters, so it is those three and nothing else.
 *
 * Written for Satori, which renders these: explicit top/right/bottom/left rather than
 * the `inset` shorthand, which it ignores — that is what turned the tile into a
 * rectangle with the letters hanging off its edge.
 */
export default function Icon() {
  const motif = (style: Record<string, number>) => ({
    position: 'absolute' as const,
    width: 22,
    height: 22,
    background: '#efe7d9',
    transform: 'rotate(45deg)',
    display: 'flex',
    ...style,
  })

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
          <div
            style={{
              display: 'flex',
              color: '#efe7d9',
              fontSize: 116,
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            DUB
          </div>
        </div>
      </div>
    ),
    size,
  )
}
