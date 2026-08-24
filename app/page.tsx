'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'
import { chosenPair } from '@/engine/pair'
import { loadLearner } from '@/engine/learner'

/**
 * The front door — or the Club, for somebody who has already been through it.
 *
 * DUB had exactly one entrance, so a returning learner met the proposition, the Goose
 * demo and the deal every single time. That is the difference between a demo and a
 * product: the door has to know whether it has met you.
 *
 * Decided after mount rather than during render, and for the usual reason — whether a
 * section has been finished comes out of localStorage, which the server does not have,
 * and branching on it while rendering is the /line hydration mismatch again. So the
 * front door renders server-side every time and a member is moved on once there is
 * something true to read. `loadLearner()` explicitly rather than the reactive snapshot,
 * because an unread store is indistinguishable from a learner who has finished nothing.
 *
 * replace(), not push(): a member who taps back should leave DUB, not be dropped at a
 * pitch for the thing they already use.
 */
export default function Page() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // No pair chosen is a front-door problem, and the pair decides which learner record
    // even gets read — so it is checked first, exactly as the deal gate does it.
    if (!chosenPair()) return
    if (!loadLearner().sections_completed.length) return
    setLeaving(true)
    router.replace('/club')
  }, [router])

  // Deliberately blank for the one frame between deciding and arriving. A returning
  // member seeing the sales pitch flash past is worse than seeing nothing at all.
  if (leaving) return <div className="min-h-svh bg-bg" aria-hidden />

  return (
    <JourneyProvider>
      <Journey />
    </JourneyProvider>
  )
}
