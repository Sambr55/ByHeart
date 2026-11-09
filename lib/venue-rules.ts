import { GEO_ACCURACY_M, GEO_RADIUS_M, PAIR_WINDOW_H, REWARD_TIERS, type SecondOffer } from '@/content/board'
import { distanceM, type Gem } from '@/content/gems'

/**
 * THE RULES OF REWARDS ON THE GROUND, with no database (2026-11-05) — so
 * scripts/venues-check.mts can hold them still. lib/venues.ts applies them. No node:crypto
 * here: the check-in button draws countLine in the browser. The PIN hash is lib/venue-pin.ts.
 */

/** Close enough to the venue, by a phone that knows where it is. */
export function nearEnough(gem: Pick<Gem, 'lat' | 'lng'>, at: { lat: number; lng: number; accuracy: number }): boolean {
  if (![at.lat, at.lng, at.accuracy].every(Number.isFinite)) return false
  if (at.accuracy > GEO_ACCURACY_M) return false
  return distanceM([gem.lat, gem.lng], [at.lat, at.lng]) <= GEO_RADIUS_M
}

export interface VenueOffer {
  offer_first: boolean
  offer_second: SecondOffer
  paused: boolean
}

/**
 * The tiers a learner holds at a venue: the venue must have signed up and not be paused,
 * and the count of learners must have reached the tier. Everyone checked in gets them —
 * the first fifty too, who made it happen. A monthly draw is not a voucher.
 */
export function tiersHeld(count: number, v: VenueOffer | null): (1 | 2)[] {
  if (!v || v.paused) return []
  const out: (1 | 2)[] = []
  if (v.offer_first && count >= REWARD_TIERS.first) out.push(1)
  if ((v.offer_second === 'meal_all' || v.offer_second === 'small_item') && count >= REWARD_TIERS.second) out.push(2)
  return out
}

/** What a venue square says about its count, for anybody. */
export function countLine(count: number, v: VenueOffer | null): string {
  const said = count === 1 ? '1 DUB learner has said it here' : count + ' DUB learners have said it here'
  if (!v || v.paused) return said + '.'
  if (v.offer_first && count < REWARD_TIERS.first) {
    const left = REWARD_TIERS.first - count
    return said + '. ' + left + ' more and everyone gets 25% off.'
  }
  if ((v.offer_second === 'meal_all' || v.offer_second === 'small_item' || v.offer_second === 'meal_draw') && count < REWARD_TIERS.second) {
    const left = REWARD_TIERS.second - count
    return said + '. ' + left + ' more and the next reward unlocks.'
  }
  return said + '.'
}

/** Bica a dois: two check-ins close enough in time to have been made together. */
export function together(a: Date | string, b: Date | string, hours: number = PAIR_WINDOW_H): boolean {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime())
  return Number.isFinite(ms) && ms <= hours * 3_600_000
}

/** Bica a dois is given only by a venue that signed up, chose it, and is not paused. */
export const pairOffered = (v: { offer_pair?: boolean; paused: boolean } | null): boolean => Boolean(v && v.offer_pair && !v.paused)

export const validPin = (pin: unknown): pin is string => typeof pin === 'string' && /^\d{4}$/.test(pin)

/** Wrong PINs before a voucher locks: 4 digits are 10,000 guesses, so five is plenty. */
export const MAX_WRONG_PINS = 5

/* Both switches start off. The draw also needs DRAW_TERMS, the holiday HOLIDAY_PRIZE (content/board.ts). */
export const drawOn = () => process.env.PRIZE_DRAW === 'on'
export const holidayOn = () => process.env.HOLIDAY_DRAW === 'on'
