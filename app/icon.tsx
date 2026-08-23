import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

/**
 * The app icon, generated rather than committed.
 *
 * A wordmark on a dark ground: at home-screen size the only thing that survives is
 * the shape of the letters, so there is nothing else in it.
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
          background: '#07090c',
          color: '#e8b04b',
          fontSize: 190,
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        DUB
      </div>
    ),
    size,
  )
}
