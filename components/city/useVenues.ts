'use client'

import { useEffect, useState } from 'react'
import { markWalkStop } from '@/engine/learner'
import { track } from '@/engine/analytics'
import type { SecondOffer } from '@/content/board'

/**
 * Venue counts, partner offers and this learner's check-ins, fetched once per visit and
 * shared by every square and card that shows them (lib/venues.ts venueBoard).
 */
export interface VenueState {
  counts: Record<string, number>
  partners: Record<string, { offer_first: boolean; offer_second: SecondOffer; second_item: string | null; paused: boolean; offer_pair?: boolean; pair_item?: string | null }>
  mine: string[]
  signedIn: boolean
  draw: boolean
  holiday: boolean
}

const EMPTY: VenueState = { counts: {}, partners: {}, mine: [], signedIn: false, draw: false, holiday: false }
let cached: Promise<VenueState> | null = null
const listeners = new Set<(s: VenueState) => void>()

function load(force = false): Promise<VenueState> {
  if (!cached || force) {
    cached = fetch('/api/venues', { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<VenueState>) : EMPTY))
      .catch(() => EMPTY)
    void cached.then((s) => listeners.forEach((l) => l(s)))
  }
  return cached
}

export function useVenues(): VenueState {
  const [s, setS] = useState<VenueState>(EMPTY)
  useEffect(() => {
    let live = true
    const on = (x: VenueState) => live && setS(x)
    listeners.add(on)
    void load().then(on)
    return () => {
      live = false
      listeners.delete(on)
    }
  }, [])
  return s
}

export type CheckInResult =
  | { ok: true; count: number; first: boolean; /** Bica a dois: this check-in, with a friend's, made a voucher each. */ pair: boolean }
  | { ok: false; error: 'signin' | 'far' | 'denied' | 'nogeo' | 'card' | 'unavailable' | 'other' }

/** I'm here: by the venue's card code, or by where the phone is. */
export async function checkIn(gem: string | null, card?: string): Promise<CheckInResult> {
  let body: Record<string, unknown>
  if (card) body = { card }
  else {
    if (!('geolocation' in navigator)) return { ok: false, error: 'nogeo' }
    const pos = await new Promise<GeolocationPosition | 'denied' | 'nogeo'>((done) =>
      navigator.geolocation.getCurrentPosition(
        (p) => done(p),
        (e) => done(e.code === e.PERMISSION_DENIED ? 'denied' : 'nogeo'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      ),
    )
    if (pos === 'denied' || pos === 'nogeo') return { ok: false, error: pos }
    body = { gem, lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
  }
  const r = await fetch('/api/venues/checkin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
  if (!r) return { ok: false, error: 'unavailable' }
  const j = (await r.json().catch(() => ({}))) as { gem?: string; count?: number; first?: boolean; pair?: boolean; error?: string }
  if (!r.ok) {
    const e = j.error
    return { ok: false, error: e === 'signin' || e === 'far' || e === 'card' || e === 'unavailable' ? e : 'other' }
  }
  /* The local record agrees, so Yours and the walk see it without waiting for a sync. */
  if (j.gem) markWalkStop('gem:' + j.gem)
  track('venue_checkin', { gem: j.gem, method: card ? 'card' : 'geo', first: j.first, pair: Boolean(j.pair) })
  void load(true)
  return { ok: true, count: j.count ?? 0, first: Boolean(j.first), pair: Boolean(j.pair) }
}

export const CHECKIN_ERRORS: Record<Exclude<CheckInResult, { ok: true }>['error'], string> = {
  signin: 'Sign in to check in — it’s how your visits count towards rewards.',
  far: 'You don’t seem to be there yet. Try again at the door.',
  denied: 'Location is off for DUB. At a DUB venue you can ask for the card instead.',
  nogeo: 'Your phone couldn’t say where it is. Try again in a moment, or ask for the DUB card.',
  card: 'That card isn’t one we know. Ask again, or check in by location.',
  unavailable: 'Check-ins aren’t available right now. Try again later.',
  other: 'That didn’t work. Try again in a moment.',
}
