'use client'

import { useMemo } from 'react'
import { clubOpenFor } from '@/content/legend'
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
 * The rule is not invented here: `clubOpen` is the door, and its terms are now SET-UP —
 * `set_up_at` written — or having been welcomed once. It used to be the Legend, said cold;
 * Sam moved the door when DUB became about the city rather than about introducing
 * yourself, and the Legend is an optional card inside. See clubOpen in content/legend.ts.
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

  const setUpAt = learner.set_up_at
  const welcomedAt = learner.club_welcomed_at
  const open = useMemo(
    () => mounted && clubOpenFor({ set_up_at: setUpAt, club_welcomed_at: welcomedAt }),
    [mounted, setUpAt, welcomedAt],
  )

  return { open, mounted }
}
