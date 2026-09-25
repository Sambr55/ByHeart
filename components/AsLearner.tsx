'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  answerLegend,
  markSetUpComplete,
  resetLearner,
  resetLearnerCache,
  setDisplayName,
  setPurpose,
} from '@/engine/learner'
import { setPair } from '@/engine/pair'
import { DEFAULT_PAIR } from '@/content/pairs'
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
    /*
      THE PAIR AND THE REST OF SET-UP, on every route including 'new'.

      Sam reached the Legend and was asked for a language and city again, while everything
      else he had answered was still there. The Club's set-up card asks the record for
      three things — a pair, the deal and a goal — and these routes wrote only the deal,
      so the card came back on a device whose Legend was full.

      'new' gets the pair too. A first-timer on a real device has already chosen one at
      the front door before they ever reach the Club, so a test route that omits it is
      not reproducing a new learner — it is reproducing a state no learner is ever in.

      The cache goes with it, exactly as SetUp's finish() does: the pair decides WHICH
      learner record is read, so a stale cached one lands the work in the wrong place.
    */
    setPair(DEFAULT_PAIR)
    resetLearnerCache()
    if (mode === 'member') {
      /*
        A COMPLETE CARD, built from the frames themselves.

        Every slot filled with the first option the frame offers, so the seven are
        genuinely answered rather than a record that looks answered — clubOpen reads the
        values, not a flag. Written through answerLegend for the same reason: it is what
        the Legend screen calls, so this cannot drift from what a real member's record
        looks like.
      */
      markSetUpComplete({ goal: 'visiting' })
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
        Everything that ends the showcase, asked for rather than assembled — see
        markSetUpComplete. This used to be two calls under a comment claiming they were
        what set-up writes; they were two of the four, and the card that reads all four
        kept re-asking.
      */
      markSetUpComplete()
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
