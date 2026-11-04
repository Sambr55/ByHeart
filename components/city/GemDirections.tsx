'use client'

import { useState } from 'react'
import { track } from '@/engine/analytics'
import type { Gem } from '@/content/gems'

/**
 * DIRECTIONS WITHOUT LEAVING DUB (Sam, 2026-11-04): "Do we have to context switch to Google
 * Maps on directions? Can we not load them in the app?"
 *
 * The Maps Embed API draws Google's own walking route inside the card, and it is free at
 * any volume. From where you are when the phone will say (asked on the tap, never before);
 * otherwise the venue's pin on the map. Turn-by-turn walking is the one thing an embedded
 * map cannot do, so the hand-off stays underneath as a small link rather than the button.
 *
 * The key is a BROWSER key — it is in the page — so it is a separate key from the Places
 * one, restricted to this website and to the Maps Embed API. Without it the button
 * behaves as it always did and opens Google Maps.
 */
const EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY

export function GemDirections({ gem }: { gem: Gem }) {
  const [src, setSrc] = useState<string | null>(null)
  const [finding, setFinding] = useState(false)
  const where = encodeURIComponent(gem.name + ', ' + gem.address + ', Lisboa')
  const outside = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + gem.lat + ',' + gem.lng

  if (!EMBED_KEY) {
    return (
      <a
        href={outside}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target eyebrow flex-1 rounded-2xl border border-line px-4 py-3 text-center text-fg"
      >
        Directions
      </a>
    )
  }

  const base = 'https://www.google.com/maps/embed/v1/'
  const pin = base + 'place?key=' + EMBED_KEY + '&q=' + where
  const route = (lat: number, lng: number) =>
    base + 'directions?key=' + EMBED_KEY + '&mode=walking&origin=' + lat + ',' + lng + '&destination=' + where

  const open = () => {
    if (src) return setSrc(null)
    track('gem_directions', { id: gem.id })
    if (!navigator.geolocation) return setSrc(pin)
    setFinding(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setFinding(false)
        setSrc(route(p.coords.latitude, p.coords.longitude))
      },
      () => {
        setFinding(false)
        setSrc(pin)
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 120_000 },
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      <button
        type="button"
        data-testid="gem-directions"
        aria-expanded={Boolean(src)}
        onClick={open}
        className="tap-target eyebrow w-full rounded-2xl border border-line px-4 py-3 text-center text-fg"
      >
        {finding ? 'Finding you…' : src ? 'Hide the map' : 'Directions'}
      </button>
      {src ? (
        <div className="animate-bank flex flex-col gap-2" data-testid="gem-map">
          <iframe
            title={'Walking to ' + gem.name}
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="aspect-[4/3] w-full rounded-2xl border border-line"
          />
          <a
            href={outside}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target self-center text-xs text-muted underline underline-offset-4"
          >
            Step by step in Google Maps
          </a>
        </div>
      ) : null}
    </div>
  )
}
