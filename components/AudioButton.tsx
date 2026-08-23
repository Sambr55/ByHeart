'use client'

import { useState } from 'react'
import { play } from '@/engine/audio'

/**
 * Speaker control. First tap plays at natural pace; a second tap plays slowly.
 * No phonetic English spelling is ever shown (spec §7).
 */
export function AudioButton({
  slug,
  text,
  screenId,
  size = 'md',
}: {
  slug: string
  text: string
  screenId?: string
  size?: 'sm' | 'md'
}) {
  const [played, setPlayed] = useState(false)
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-12 w-12'

  return (
    <button
      type="button"
      aria-label={played ? 'Play ' + text + ' slowly' : 'Play ' + text}
      onClick={(e) => {
        e.stopPropagation()
        play({ slug, text }, { slow: played, screenId })
        setPlayed(true)
      }}
      className={
        dim +
        ' tap-target inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-chip text-accent transition active:scale-95'
      }
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4z"
          fill="currentColor"
        />
        <path
          d="M15.5 9.2a4 4 0 0 1 0 5.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        {played ? null : (
          <path
            d="M18.2 6.8a7.6 7.6 0 0 1 0 10.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        )}
      </svg>
      {played ? (
        <span className="sr-only">Slow playback available on the next tap</span>
      ) : null}
    </button>
  )
}
