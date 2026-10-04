'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Journey } from '@/components/Journey'
import { JourneyProvider } from '@/engine/journey'
import { chosenPair } from '@/engine/pair'
import { loadLearner, type LearnerState } from '@/engine/learner'
import { clubOpen } from '@/content/legend'

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
 * Is this person a member? The SAME question the Club's own door asks.
 *
 * There used to be two answers here and they disagreed. This file said five or more Legend
 * answers; `clubOpen()` — which the Club itself uses — says every applicable card on the
 * card, plus rung 2. So somebody with five or six was sent to the Club by the front door
 * and shown the closed door by the Club, one tap later. The most likely person to hit that
 * was somebody in the middle of building their Legend, which is exactly who this fork is
 * for.
 *
 * One function now, and it is the room's, because the room is the thing being opened.
 */
function isMember(s: LearnerState): boolean {
  const answers = s.legend ?? []
  return clubOpen({
    answeredFrameIds: answers.filter((a) => Object.keys(a.values).length > 0).map((a) => a.frame_id),
    answers,
    welcomedAt: s.club_welcomed_at,
    /* Said cold, which is what the door now asks for — see clubOpen. */
    proof: s.proof ?? [],
    rough: s.rough ?? [],
    purpose: s.purpose ?? null,
  })
}

export function HomeView() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  /*
    AND NOTHING IS PAINTED UNTIL THE QUESTION HAS BEEN ASKED.

    Sam: "the club always flashes on first card (so does first card on main home)."

    `leaving` already blanks the screen for a returning learner, and the note on it is
    right about why — "a returning member seeing the sales pitch flash past is worse than
    seeing nothing at all". It is set INSIDE the effect, though, and an effect runs after
    the first paint. So the pitch rendered, the effect decided, and the pitch was replaced:
    exactly the flash it exists to prevent, one frame earlier than it was looking.

    Measured by sampling the document every 50ms through a reload: "Find Yourself in
    Language" → blank → "THE BASICS, IN SONGS YOU KNOW". The first of those three is the
    frame this removes.

    So the hold starts BEFORE the decision rather than after it, and lifts only for
    somebody who is genuinely staying. The cost is one frame of dark for a first-time
    visitor, which is the same frame they already spend waiting for the photograph behind
    the hero.

    `decided` rather than reusing `leaving`, because the two are different facts: one means
    "we are going somewhere", the other means "we have looked". Collapsing them would leave
    a first-timer held forever, since nobody ever sets leaving for them.
  */
  const [decided, setDecided] = useState(false)

  useEffect(() => {
    /*
      Asked for the door, so the door is what they get.

      Everything below sends a returning learner onwards, which is right for somebody who
      opened the app and wrong for somebody who just tapped the logo to come back here. The
      redirect made the front door unreachable for anybody who had ever used DUB — the only
      way to see it again was to wipe the device, which is a poor way to look at your own
      product and an impossible one for a member.

      Read from the URL rather than kept in state: it survives the reload, it is honest in
      a shared link, and it cannot get stuck on.
    */
    /*
      Every way out of this effect says the looking is done — see `decided` above. A path
      that returned without saying so would hold a first-time visitor on a dark screen
      forever, which is a worse bug than the flash.
    */
    if (new URLSearchParams(window.location.search).get('door') === '1') return setDecided(true)
    // No pair chosen is a front-door problem, and the pair decides which learner record
    // even gets read — so it is checked first, exactly as the deal gate does it.
    if (!chosenPair()) return setDecided(true)
    const learner = loadLearner()
    if (!returning(learner)) return setDecided(true)
    setLeaving(true)
    /*
      Two homes, and which one you get says where you are in the game.

      Dub Club is the graduation — it opens on the Legend being finished AND said, which is
      what clubOpen asks. Before that the shelf is home, because the shelf is where the work
      is: vibes are how you earn the Legend. Sending a mid-game learner to a Club they have
      not reached would be the same mistake as sending them to the front door.
    */
    router.replace(isMember(learner) ? '/club' : '/vibes')
  }, [router])

  // Deliberately blank for the one frame between deciding and arriving. A returning
  // member seeing the sales pitch flash past is worse than seeing nothing at all.
  /*
    Dark, for the reason the Club's own hold is — see components/Club.tsx.

    This is the frame a returning learner sees between the front door and wherever they
    are sent, and it was sand between two dark screens. The redirect is fast and the flash
    was the only thing about it anybody could see.
  */
  if (leaving || !decided) return <div className="min-h-svh on-dark" aria-hidden />

  return (
    <JourneyProvider>
      <Journey />
    </JourneyProvider>
  )
}
