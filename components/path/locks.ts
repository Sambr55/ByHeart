/**
 * The paid lock, behind one adapter so the path never needs to know where it comes from.
 *
 * Owner's choice: a free starter set (the first-day visitor rooms plus the survival kit),
 * then pay. The list lives in lib/entitlements.ts (FREE_ROOMS); this file only adapts it.
 *
 * NOT AN ORDER LOCK. A free room is open whatever has or has not been played before it;
 * the only thing that closes a room is that it is paid and the learner is not a member.
 */
export { isFreeRoom } from '@/lib/entitlements'
import { isFreeRoom } from '@/lib/entitlements'

/** Where an UNLOCK goes. /pro is the existing "what the money is for" screen. */
export const UNLOCK_HREF = '/pro'

export function roomLock(
  id: string,
  member: boolean,
  purpose: 'visiting' | 'staying' | 'moving' | null = null,
): 'open' | 'paid' {
  return member || isFreeRoom(id, purpose) ? 'open' : 'paid'
}
