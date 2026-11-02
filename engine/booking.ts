'use client'

import { DEFAULT_CHAPTER } from '@/content/chapters'
import { DEFAULT_PAIR } from '@/content/pairs'
import { hasBooking, parseBooking } from '@/lib/booking'
import { track } from '@/engine/analytics'
import {
  getLearner,
  resetLearnerCache,
  setChapter,
  setProfile,
  setPurpose,
  setWhenHere,
} from '@/engine/learner'
import { setPair } from '@/engine/pair'

/**
 * WRITE THE MARKETING SITE'S SEARCH TO THE LEARNER, ONCE (2026-11-02). See lib/booking.ts.
 *
 * Called after mount by /get and by set-up, so whichever the link lands on, the answers are
 * on the record before the WHY question could be drawn — SetUp reads the live record and
 * skips straight to the name once `profile.goal` is set.
 *
 * THE SAME WRITES THE "VISITING LISBON?" ANSWER MAKES (Visiting, components/Destination.tsx)
 * — pair, chapter, purpose, goal — so a learner who came through the search is
 * indistinguishable from one who tapped the answer. Plus the dates, to the fields the
 * calendar already reads (here_from / here_to, via setWhenHere).
 *
 * NEVER OVER AN ANSWER. A learner who has already said why they are here keeps their
 * answer; one who has already said when keeps their dates. A link is a suggestion and the
 * learner's own tap is a decision — and Settings is where a decision is changed.
 *
 * Returns whether anything was written, for the caller that wants to know.
 */
export function applyBookingFromUrl(search: string = window.location.search): boolean {
  const b = parseBooking(new URLSearchParams(search))
  if (!hasBooking(b)) return false
  const me = getLearner()
  let wrote = false
  if (b.purpose && b.goal && !me.profile?.goal) {
    setPair(DEFAULT_PAIR)
    resetLearnerCache()
    setChapter(DEFAULT_CHAPTER)
    setPurpose(b.purpose)
    setProfile('goal', b.goal)
    track('purpose_chosen', { purpose: b.purpose, goal: b.goal, via: 'booking' })
    wrote = true
  }
  if (b.from && !getLearner().profile?.here_said) {
    setWhenHere({ from: b.from, to: b.to })
    wrote = true
  }
  return wrote
}
