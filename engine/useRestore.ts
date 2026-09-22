'use client'

import { useEffect, useRef } from 'react'
import { loadLearner, restoreLearner } from '@/engine/learner'

/**
 * Ask the server what it is holding for this person, once, on any screen.
 *
 * THIS ONLY RAN INSIDE JourneyProvider, which is on `/` and `/vibes` and nowhere else.
 * Everything a learner does lives in this browser's storage; signing in is what joins that
 * to an account, and `restoreLearner` is the call that pulls the account's copy back. So
 * anybody who signed in and landed on Yours, the Club or their Legend — which is where the
 * email link sends them — merged NOTHING, and the screen showed a device that had never
 * seen them. Sam, arriving from Mail: "I got here without a legend, cant click through to
 * legend, cant get back to vibes... I keep getting the soft gateway sign-up even though I
 * have done it."
 *
 * Every one of those is this: signed in, and the work still on the server.
 *
 * Safe to call from anywhere, which is the point. It only ever GAINS — see mergeLearner —
 * it refuses when the device holds somebody else's cache, and a failure leaves the local
 * copy exactly as it was. Once per mount, because two calls would merge the same rows
 * twice for nothing.
 */
export function useRestore(): void {
  const asked = useRef(false)
  useEffect(() => {
    if (asked.current) return
    asked.current = true
    loadLearner()
    void restoreLearner()
  }, [])
}
