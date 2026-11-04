import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Gem } from '@/content/gems'

/**
 * A PHOTO OF THE PLACE, from Google Places (Sam, 2026-11-04: "are we able to pull through a
 * small picture of the venues?" … "Is there not a Google Maps API we could use?").
 *
 * Places API (New), three calls, two of them cached:
 *
 *   1. Text Search, IDs only — the gem's name and address, biased to its coordinates — to
 *      find Google's place ID. Place IDs are the one thing Google allows to be stored
 *      indefinitely, so this is cached for 30 days and re-checked after.
 *   2. Place Details, photos field — the first photo's resource name and who took it.
 *   3. Place Photo, with skipHttpRedirect — a short-lived image URL that carries no key, so
 *      it is safe to hand to the browser.
 *
 * 2 and 3 are cached for twelve hours, not stored: Google's terms do not let the photo be
 * kept, and its URL expires. The photographer's name travels with it, because the terms
 * require it shown wherever the photo is.
 *
 * GOOGLE_MAPS_API_KEY unset = no photos at all, and every card shows its kind's mark
 * instead. Same rule as push and billing: unconfigured is off, never broken.
 */
const KEY = () => process.env.GOOGLE_MAPS_API_KEY

export function placesConfigured(): boolean {
  return Boolean(KEY())
}

export interface GemPhoto {
  uri: string
  /** The photographer, as Google gives them. Must be shown with the photo. */
  by: string | null
  byUrl: string | null
}

async function findPlaceId(gem: Pick<Gem, 'name' | 'address' | 'lat' | 'lng'>): Promise<string | null> {
  const key = KEY()
  if (!key) return null
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      // IDs only: the cheapest search Google sells, and all this needs.
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({
      textQuery: gem.name + ', ' + gem.address + ', Lisboa',
      maxResultCount: 1,
      locationBias: { circle: { center: { latitude: gem.lat, longitude: gem.lng }, radius: 300 } },
    }),
    cache: 'no-store',
  })
  if (!res.ok) {
    console.error('[places] search ' + res.status)
    return null
  }
  const data = (await res.json()) as { places?: { id: string }[] }
  return data.places?.[0]?.id ?? null
}

const placeIdFor = (gem: Gem) =>
  unstable_cache(() => findPlaceId(gem), ['gem-place', gem.id], { revalidate: 60 * 60 * 24 * 30 })()

async function resolvePhoto(placeId: string, width: number): Promise<GemPhoto | null> {
  const key = KEY()
  if (!key) return null
  const details = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId), {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'photos' },
    cache: 'no-store',
  })
  if (!details.ok) {
    console.error('[places] details ' + details.status)
    return null
  }
  const d = (await details.json()) as {
    photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[]
  }
  const photo = d.photos?.[0]
  if (!photo) return null
  const media = await fetch(
    'https://places.googleapis.com/v1/' + photo.name + '/media?maxWidthPx=' + width + '&skipHttpRedirect=true',
    { headers: { 'X-Goog-Api-Key': key }, cache: 'no-store' },
  )
  if (!media.ok) {
    console.error('[places] photo ' + media.status)
    return null
  }
  const m = (await media.json()) as { photoUri?: string }
  if (!m.photoUri) return null
  const a = photo.authorAttributions?.[0]
  return { uri: m.photoUri, by: a?.displayName ?? null, byUrl: a?.uri ?? null }
}

/** The photo for a gem, or null when there is no key, no match or no photo. */
export async function gemPhoto(gem: Gem, width = 400): Promise<GemPhoto | null> {
  if (!placesConfigured()) return null
  try {
    const placeId = await placeIdFor(gem)
    if (!placeId) return null
    return await unstable_cache(() => resolvePhoto(placeId, width), ['gem-photo', placeId, String(width)], {
      revalidate: 60 * 60 * 12,
    })()
  } catch (err) {
    console.error('[places] ' + (err as Error).message)
    return null
  }
}
