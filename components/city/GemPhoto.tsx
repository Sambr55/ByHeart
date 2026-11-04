'use client'

import { useEffect, useRef, useState } from 'react'
import type { GemKind } from '@/content/gems'

/**
 * A venue's picture (2026-11-04) — the Google Places photo when there is one
 * (lib/places.ts, /api/gem-photo), and until then, or where there is none, a mark for the
 * kind of place on the card's own colours. The mark is drawn first and the photo fades in
 * over it, so the list never jumps.
 *
 * Asked for only when the card is near the screen: thirty cards is thirty requests, and a
 * learner who never scrolls past the first five should cost five.
 *
 * The photographer's name goes with the photo wherever it is shown — Google's terms, and
 * fair besides.
 */
export interface Photo {
  uri: string
  by: string | null
  byUrl: string | null
}

const MARK: Record<GemKind, string> = {
  cafe: '☕',
  tasca: '🍷',
  market: '🧺',
  bakery: '🥐',
  miradouro: '🌅',
  shop: '🛍️',
  venue: '🎶',
  workshop: '🧵',
  bar: '🍸',
  other: '✦',
}

/* One request per gem per visit, shared by every card that shows it. */
const seen = new Map<string, Promise<Photo | null>>()
function load(id: string, w: number): Promise<Photo | null> {
  const k = id + ':' + w
  let p = seen.get(k)
  if (!p) {
    p = fetch('/api/gem-photo/' + encodeURIComponent(id) + '?w=' + w)
      .then((r) => (r.ok ? (r.json() as Promise<Photo>) : null))
      .catch(() => null)
    seen.set(k, p)
  }
  return p
}

export function useGemPhoto(id: string, w = 400) {
  const ref = useRef<HTMLDivElement>(null)
  const [photo, setPhoto] = useState<Photo | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let gone = false
    const go = () => void load(id, w).then((p) => !gone && setPhoto(p))
    if (!('IntersectionObserver' in window)) {
      go()
      return () => {
        gone = true
      }
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect()
          go()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => {
      gone = true
      io.disconnect()
    }
  }, [id, w])
  return { ref, photo }
}

/** The picture itself: the kind's mark underneath, the photo over it once it arrives. */
export function GemPicture({
  kind,
  photo,
  className = '',
  big = false,
}: {
  kind: GemKind
  photo: Photo | null
  className?: string
  big?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span
      className={'relative block shrink-0 overflow-hidden bg-[#c66a4a]/12 ' + className}
      data-testid="gem-picture"
      data-photo={photo ? 'yes' : 'no'}
    >
      <span aria-hidden className={'absolute inset-0 flex items-center justify-center ' + (big ? 'text-5xl' : 'text-2xl')}>
        {MARK[kind]}
      </span>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.uri}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          className={'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ' + (loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : null}
    </span>
  )
}

/** "Photo: Ana Silva · Google Maps" — required with the photo, kept small. */
export function PhotoCredit({
  photo,
  className = '',
  link = true,
}: {
  photo: Photo | null
  className?: string
  /** Off inside a button: a link in a button is a tap with two meanings. */
  link?: boolean
}) {
  if (!photo) return null
  return (
    <span className={'block truncate text-[0.6rem] text-muted ' + className} data-testid="gem-photo-credit">
      Photo{photo.by ? ': ' : ''}
      {photo.by ? (
        photo.byUrl && link ? (
          <a href={photo.byUrl} target="_blank" rel="noreferrer" className="underline" onClick={(e) => e.stopPropagation()}>
            {photo.by}
          </a>
        ) : (
          photo.by
        )
      ) : null}{' '}
      · Google Maps
    </span>
  )
}
