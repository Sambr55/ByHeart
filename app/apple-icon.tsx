import { ImageResponse } from 'next/og'
import { DUB_MARK } from '@/content/marks'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

/**
 * iOS masks the corners itself and does not want transparency, so this is a full bleed.
 *
 * The U rather than the word, for the same reason as the browser tab: a home-screen icon
 * is read at a glance and from a distance, and three letters at that size are a smudge.
 */
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
          background: '#1f5d8c',
        }}
      >
        <svg viewBox={DUB_MARK.viewBox} width={92} height={108} fill="#efe7d9" fillRule="evenodd">
          <path d={DUB_MARK.d} />
        </svg>
      </div>
    ),
    size,
  )
}
