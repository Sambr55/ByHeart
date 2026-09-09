'use client'

import { useMemo } from 'react'
import { clubOpen } from '@/content/legend'
import { rungReached, type Rung } from '@/content/roots'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'

/**
 * Is this person in the Club yet?
 *
 * ONE DOOR, ASKED IN ONE PLACE. The Club, the calendar, the translator and Yours are all
 * behind the same threshold, and each of them was deciding for itself — which is to say
 * three of them were not deciding at all. /calendar and /profile rendered fully for a
 * device that had been reset four seconds earlier, and the translator opened on any
 * screen, so the bottom bar offered four doors into a building somebody had not entered.
 *
 * The rule is not new and is not invented here: `clubOpen` already is the door, and its
 * terms are the Legend — your seven answered, at rung 2 — or having been welcomed once.
 * Entry to the Club was always predicated on completing your Legend; what was missing was
 * anything outside Club.tsx asking.
 *
 * `mounted` resolves to OUTSIDE rather than inside, and that is the opposite of the
 * choice Club.tsx makes for itself. Club.tsx is right for Club.tsx: it renders the room
 * to a member and a flash of the door would be worse. Here the answer decides whether a
 * whole tab is content or an explainer, and showing a member a moment of explainer is a
 * blink, while showing a stranger a moment of the Club gives away the thing the door is
 * for. When in doubt, the door.
 */
export function useClub(): { open: boolean; mounted: boolean } {
  const learner = useLearner()
  const mounted = useNowAfterMount() !== null

  const answeredIds = useMemo(
    () =>
      (learner.legend ?? [])
        .filter((a) => Object.keys(a.values).length > 0)
        .map((a) => a.frame_id),
    [learner.legend],
  )

  const rung: Rung = mounted ? rungReached(learner.proof ?? []) : 1

  const open = useMemo(
    () =>
      mounted &&
      clubOpen({
        answeredFrameIds: answeredIds,
        answers: learner.legend ?? [],
        rung,
        welcomedAt: learner.club_welcomed_at,
        /* Measured against THIS learner's seven — see cardFor. */
        purpose: learner.purpose ?? null,
      }),
    [mounted, answeredIds, learner.legend, rung, learner.club_welcomed_at, learner.purpose],
  )

  return { open, mounted }
}
