'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'
import { chosenPair } from '@/engine/pair'
import { loadLearner, type LearnerState } from '@/engine/learner'

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
/**
 * Has this person been here before?
 *
 * It used to ask only whether a SECTION had been completed, which is written by pressing
 * "I'm done" and then walking three cold prompts. So quitting mid-crate — the single
 * most likely way a first session ends — put the learner back through the proposition,
 * the Goose demo twice, the language pair and the entire deal screen the next time they
 * opened DUB. The most probable first-to-second-session experience in the product was
 * being sold to again.
 *
 * Any real evidence counts now: a root played, a piece owned, a sentence said. The deal
 * is still required, because somebody who has not accepted it has not started.
 */
function returning(s: LearnerState): boolean {
  if (!s.deal_accepted_at) return false
  return (
    s.sections_completed.length > 0 ||
    s.roots_played.length > 0 ||
    Object.keys(s.inventory).length > 0 ||
    s.proof.length > 0
  )
}

/**
 * Has the Legend actually been built?
 *
 * Not "unlocked" — built. Dub Club is where a Legend GROWS, so arriving there with an
 * empty one would be arriving at a room with nothing in it. Half the cards is the test:
 * enough that the thing exists and is worth returning to, short of demanding all ten
 * before anybody sees the room.
 */
function legendBuilt(s: LearnerState): boolean {
  return (s.legend ?? []).filter((a) => Object.keys(a.values).length > 0).length >= 5
}

export default function Page() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // No pair chosen is a front-door problem, and the pair decides which learner record
    // even gets read — so it is checked first, exactly as the deal gate does it.
    if (!chosenPair()) return
    const learner = loadLearner()
    if (!returning(learner)) return
    setLeaving(true)
    /*
      Two homes, and which one you get says where you are in the game.

      Dub Club is the graduation — it opens when the Legend is built, and it is where the
      Legend grows. Before that the picker is home, because the picker is where the work
      is: crates are how you earn the Legend. Sending a mid-game learner to a Club they
      have not reached would be the same mistake as sending them to the front door.
    */
    router.replace(legendBuilt(learner) ? '/club' : '/vibes')
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
