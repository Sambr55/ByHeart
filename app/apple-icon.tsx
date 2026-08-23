import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/** iOS masks the corners itself and does not want transparency, so this is a full bleed. */
export default function AppleIcon() {
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
          fontSize: 66,
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
