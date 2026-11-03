'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SetUp } from '@/components/SetUp'
import { Wordmark } from '@/components/Wordmark'
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
export const FIRST_ROOM = 'lisbon_save'

export function Start() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    /* Somebody already set up has nothing to answer: home. */
    if (clubOpenFor(loadLearner())) router.replace('/club')
    else setReady(true)
  }, [router])

  if (!ready) return <div className="min-h-svh bg-bg" aria-hidden />
  return (
    <main data-testid="start" className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg px-5 pb-10 pt-6 text-fg">
      <SetUp
        onDone={() => {
          welcomeToClub()
          router.replace('/errand/' + FIRST_ROOM + '?first=1')
        }}
      />
      <div className="mt-auto flex justify-center pt-8 opacity-60">
        <Wordmark className="h-5" />
      </div>
    </main>
  )
}
