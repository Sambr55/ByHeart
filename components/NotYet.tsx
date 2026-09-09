'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cratesToGo, legendUnlocked } from '@/content/legend'
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
  const done = learner.sections_completed ?? []
  const open = legendUnlocked(done)
  const left = cratesToGo(done)

  return (
    <main data-stage="CHOICE" className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-5 pt-6">
      <p className="eyebrow text-accent">{what}</p>
      <h1 className="display text-balance text-3xl">Not yet — this opens with your Legend.</h1>
      <p className="text-sm leading-relaxed text-muted">{line}</p>
      <p className="text-sm leading-relaxed text-muted">
        {/*
          Where they actually are, not a generic "keep going". The number is the same one
          the Legend and the shelf quote, so the three screens cannot drift apart.
        */}
        Your Legend is seven things about yourself, said in Portuguese with nothing on
        screen.{' '}
        {open
          ? 'It is open now — build it and the Club is yours.'
          : left === 1
            ? 'One more vibe and it opens.'
            : left + ' more vibes and it opens.'}
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
