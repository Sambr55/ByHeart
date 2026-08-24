import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * The mark: one azulejo tile with DUB in it.
 *
 * There was a wordmark and no logo, and the icon was still cockpit black on instrument
 * amber — the one piece of DUB a person sees every day, left behind by the repaint.
 *
 * A tile is the right form because it is the thing DUB is made of everywhere else: the
 * field behind the screens, the block on a crate card, the band down the share card. At
 * home-screen size the only things that survive are the ground colour, the border and
 * the shape of the letters, so it is those three and nothing else.
 */
export default function Icon() {
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
          position: 'relative',
        }}
      >
        {/* The tile: a hard square inset from the edge, the way a real one is laid. */}
        <div
          style={{
            position: 'absolute',
            inset: 34,
            border: '10px solid #efe7d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Corner motifs, which is what makes an azulejo an azulejo. */}
          {[
            { top: 16, left: 16 },
            { top: 16, right: 16 },
            { bottom: 16, left: 16 },
            { bottom: 16, right: 16 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 26,
                height: 26,
                background: '#efe7d9',
                transform: 'rotate(45deg)',
                display: 'flex',
              }}
            />
          ))}
          <div
            style={{
              color: '#efe7d9',
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              display: 'flex',
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
