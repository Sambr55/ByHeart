/**
 * The paid lock, behind one adapter so the path never needs to know where it comes from.
 *
 * Owner's choice: a free starter set (five visitor rooms plus the survival kit), then pay.
 * The real list — `FREE_ROOMS` and `isFreeRoom(id)` — is being written in parallel in
 * lib/entitlements.ts (or content/free.ts) and does not exist on this branch yet.
 *
 * TODO(merge): delete the stub below and re-export the real one, e.g.
 *
 *   export { isFreeRoom } from '@/lib/entitlements'   // or '@/content/free'
 *
 * Nothing else in components/path imports anything but `isFreeRoom` and `roomLock` from
 * here, so that one line is the whole swap.
 *
 * NOT AN ORDER LOCK. A free room is open whatever has or has not been played before it;
 * the only thing that closes a room is that it is paid and the learner is not a member.
 */
import { pathRoomIds } from '@/content/path'

/** STUB: the first five rooms on the playable path (units 1–2) are free. */
const STUB_FREE = new Set(pathRoomIds().slice(0, 5))

export function isFreeRoom(id: string): boolean {
  return STUB_FREE.has(id)
}

/** Where an UNLOCK goes. /pro is the existing "what the money is for" screen. */
export const UNLOCK_HREF = '/pro'

export function roomLock(id: string, member: boolean): 'open' | 'paid' {
  return member || isFreeRoom(id) ? 'open' : 'paid'
}
