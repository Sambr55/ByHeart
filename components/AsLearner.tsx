'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { acceptDeal, rememberSetUp, resetLearner } from '@/engine/learner'

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
 *
 * It RESETS rather than patching, so what renders is the real thing rather than a record
 * that happens to look like one. That also makes /club-new destructive by design, which
 * is the same bargain /skip already makes and the reason neither is linked from anywhere.
 */
export function AsLearner({ mode }: { mode: 'new' | 'returning' }) {
  const router = useRouter()
  useEffect(() => {
    resetLearner()
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
        Setting this device up as {mode === 'new' ? 'a first-timer' : 'a returning learner'}…
      </p>
    </div>
  )
}
