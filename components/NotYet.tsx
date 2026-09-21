'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { legendStatus } from '@/content/legend'
import { useLearner } from '@/engine/useLearner'

/**
 * The three tabs, before there is a Club to put in them.
 *
 * WHAT THIS REPLACES. /club, /calendar and the translator each rendered in full to a
 * device that had never done anything — the Club showed its showcase, the calendar showed
 * a month of a city nobody had chosen, and ASK opened a translator on any screen. So the
 * bar offered four doors into a building the person had not entered, and three of them
 * gave away the thing the door is for.
 *
 * The door is the Legend, which it always was: `clubOpen` in content/legend.ts, asked
 * through useClub so all four tabs ask it once and in one place.
 *
 * TWO WAYS OUT, AND THEY GO TO THE SAME PLACE. Back, for somebody who tapped by mistake
 * and wants the screen they were on; and the way on, for somebody who has just been told
 * what this is and wants to start. Both land on the vibes, because the vibes are the only
 * thing to do before the Legend exists — a screen that explains a locked door and then
 * offers nothing is the dead end `forward-check` exists to catch.
 */
export function NotYet({
  what,
  line,
}: {
  /** The tab's own name, so the screen says what the person actually tapped. */
  what: string
  /** What is behind this particular door, in one sentence. */
  line: string
}) {
  const router = useRouter()
  const learner = useLearner()
  const played = learner.roots_played ?? []
  const sections = learner.sections_completed ?? []
  const status = legendStatus({ rootsPlayed: played, sectionsCompleted: sections })
  const open = status.open
  const left = status.toGo
  const vibesLeft = Math.max(0, status.vibesNeeded - status.vibesDone)

  return (
    <main data-stage="CHOICE" className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 pt-6">
      <p className="eyebrow text-accent">{what}</p>
      <h1 className="display text-balance text-3xl">Not yet — this opens with your Legend.</h1>
      <p className="text-sm leading-relaxed text-muted">{line}</p>
      <p className="text-sm leading-relaxed text-muted">
        {/*
          BOTH HALVES OF THE DOOR, named, in the order they are met.

          The door is the basics plus three vibes you chose, and this said only the first
          half — so somebody who had finished the basics was told "it opens now" by
          arithmetic that no longer decided anything, and somebody three vibes deep was
          told to play more lines of a vibe they had finished. Sam, having done exactly
          that: "I have just done multiple vibes but the legend isn't opening."

          One sentence per half, and only the half they are actually on: naming the vibes
          while the basics are unfinished is a second instruction nobody can act on yet.
        */}
        Your Legend is seven things about yourself, said with nothing on screen.{' '}
        {open
          ? 'It is open now — build it and the Club is yours.'
          : left > 0
            ? left === 1
              ? 'One more line of the basics, then three vibes of your own.'
              : left + ' more lines of the basics, then three vibes of your own.'
            : vibesLeft === 1
              ? 'The basics are done. One more vibe finished and it opens.'
              : 'The basics are done. ' + vibesLeft + ' more vibes finished and it opens.'}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <Link
          href="/vibes"
          data-testid="notyet-go"
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          GET GOING
        </Link>
        {/*
          Back, and it is a real back — router.back() returns the screen they came from
          rather than guessing at one. It falls to the vibes when there is no history,
          which is what happens on a cold open straight to /calendar.
        */}
        <button
          type="button"
          data-testid="notyet-back"
          onClick={() => {
            if (window.history.length > 1) router.back()
            else router.push('/vibes')
          }}
          className="tap-target eyebrow w-full rounded border border-line px-5 py-3 text-center text-muted"
        >
          BACK
        </button>
      </div>
    </main>
  )
}
