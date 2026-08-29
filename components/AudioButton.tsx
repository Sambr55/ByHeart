'use client'

import { useRef, useState } from 'react'
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
  /*
    Hold it down for slow, rather than tapping twice.

    The slow reading has existed since the audio did, behind a rule nobody could see: the
    SECOND tap of a given button plays it slowly. That is undiscoverable, and it is also
    the wrong gesture — tapping twice means "again", and people who want a word slowed down
    are already holding their thumb on the screen and leaning in.
    
    Holding does not cancel the tap, it replaces it: `long` is checked in the click that
    follows so the sentence is not played twice, once at each speed, over itself.
  */
  const held = useRef<ReturnType<typeof setTimeout> | null>(null)
  const long = useRef(false)

  const start = () => {
    long.current = false
    held.current = setTimeout(() => {
      long.current = true
      play({ slug, text }, { slow: true, screenId })
      setPlayed(true)
    }, 420)
  }
  const end = () => {
    if (held.current) clearTimeout(held.current)
    held.current = null
  }

  return (
    <button
      type="button"
      data-testid="audio"
      aria-label={played ? 'Play ' + text + ' slowly' : 'Play ' + text}
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      onClick={(e) => {
        e.stopPropagation()
        end()
        // The hold already played it, slowly. A click on top would play it twice at once.
        if (long.current) {
          long.current = false
          return
        }
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
