'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  acceptDeal,
  answerLegend,
  rememberSetUp,
  resetLearner,
  setDisplayName,
  setPurpose,
} from '@/engine/learner'
import { cardFor } from '@/content/legend'

/**
 * Put the device into one known state and open the Club in it.
 *
 * Sam: "give me an easy url to go to 1) Club-new 2) Club-ret (returning)." Looking at the
 * showcase meant resetting the phone and walking the whole front door — minutes of set-up
 * to judge a screen in seconds, every time.
 *
 * TWO STATES, because the Club shows a different thing to each and the difference is the
 * one being tested:
 *
 *   new        nothing has happened. The nine intro cards, which is what a first-timer
 *              meets on the CLUB tab.
 *   returning  set-up finished, no Legend. The explainer, because the door is shut and
 *              the argument has already been made. This is where most learners spend
 *              most of their time.
 *   member     the seven answered and never welcomed, which is the ONE state that shows
 *              the Club's own welcome — the ceremony, YOU ARE IN. Sam: "club-new took me
 *              to the main intro not the CLUB intro." It is gated on clubOpen and on
 *              club_welcomed_at being unset, so reaching it by hand means building an
 *              entire Legend first and then never opening the Club again.
 *
 * It RESETS rather than patching, so what renders is the real thing rather than a record
 * that happens to look like one. That also makes /club-new destructive by design, which
 * is the same bargain /skip already makes and the reason neither is linked from anywhere.
 */
export function AsLearner({ mode }: { mode: 'new' | 'returning' | 'member' }) {
  const router = useRouter()
  useEffect(() => {
    resetLearner()
    if (mode === 'member') {
      /*
        A COMPLETE CARD, built from the frames themselves.

        Every slot filled with the first option the frame offers, so the seven are
        genuinely answered rather than a record that looks answered — clubOpen reads the
        values, not a flag. Written through answerLegend for the same reason: it is what
        the Legend screen calls, so this cannot drift from what a real member's record
        looks like.
      */
      acceptDeal()
      rememberSetUp()
      setPurpose('visiting')
      setDisplayName('Jane')
      for (const frame of cardFor('visiting')) {
        const values: Record<string, string> = {}
        for (const slot of frame.slots) {
          values[slot.key] =
            slot.kind === 'name'
              ? 'Jane'
              : slot.kind === 'place'
                ? 'Glasgow'
                : (slot.options?.[0]?.value ?? 'x')
        }
        answerLegend(frame.id, values)
      }
    }
    if (mode === 'returning') {
      /*
        The two facts that end the showcase, written the way set-up writes them — see
        SetUp's finish(). Anything less is a learner who has not been through it, which is
        the other route.
      */
      acceptDeal()
      rememberSetUp()
    }
    /*
      No ?in=1. The front door's marker forces the showcase whatever the record says, so
      using it here would make both routes show the same screen and prove nothing. This
      arrives the way a learner arrives: by tapping CLUB.
    */
    router.replace('/club')
  }, [mode, router])

  return (
    <div className="app-frame safe-top bg-bg text-fg">
      <p className="mx-auto w-full max-w-md px-5 py-6 text-sm text-muted">
        Setting this device up as{' '}
        {mode === 'new'
          ? 'a first-timer'
          : mode === 'member'
            ? 'a new member'
            : 'a returning learner'}
        …
      </p>
    </div>
  )
}
