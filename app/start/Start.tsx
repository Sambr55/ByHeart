'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SetUp } from '@/components/SetUp'
import { PathReveal } from '@/components/path/PathReveal'
import { clubOpenFor } from '@/content/legend'
import { loadLearner, welcomeToClub } from '@/engine/learner'

/**
 * THE FIRST RUN, IN UNDER A MINUTE (Sam, 2026-11-03: "I get lost in my own app in seconds").
 *
 * It was COME IN → a nineteen-card swipe deck of explainers (several twice) with the one
 * question buried at card eight → a welcome ceremony → Yours with a walkthrough on top —
 * and no room anywhere in it. Now: COME IN → why you are here and your name → straight
 * into the first room, the save ("Desculpe, não percebi.") → home, with that tile laid.
 *
 * The welcome is stamped here so the old ceremony (Club.tsx) never hijacks the way home:
 * the first room IS the welcome. The explainers' content belongs on the website.
 */
/* The first tile of Basics — hello, goodbye, thank you (2026-11-03). */
export const FIRST_ROOM = 'lisbon_ola'

export function Start() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  /* After set-up and before the first room: the path, said back and shown (PathReveal). */
  const [reveal, setReveal] = useState(false)
  useEffect(() => {
    /* Somebody already set up has nothing to answer: home. */
    if (clubOpenFor(loadLearner())) router.replace('/club')
    else setReady(true)
  }, [router])

  if (!ready) return <div className="min-h-svh bg-bg" aria-hidden />
  if (reveal) return <PathReveal first={FIRST_ROOM} />
  return (
    <main data-testid="start" className="booker mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pt-6 text-fg">
      <SetUp
        onDone={() => {
          welcomeToClub()
          setReveal(true)
          window.scrollTo(0, 0)
        }}
      />
    </main>
  )
}
