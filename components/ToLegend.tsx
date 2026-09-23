'use client'

import { useLearner } from '@/engine/useLearner'
import { legendStatus } from '@/content/legend'

/**
 * HOW FAR TO THE LEGEND, on every screen until you get there.
 *
 * Sam: "I also want to show a progress bar as you build towards your legend, it should be
 * ever present until you get there."
 *
 * The distance was knowable and never shown. legendStatus has always reported both halves
 * — the doorway sittings and the three vibes — and the only places that rendered them were
 * the session-done screen and the Legend deck, which are the two places somebody has
 * already arrived. In between, a learner doing their fourth vibe had no way to tell whether
 * they were nearly there or nowhere.
 *
 * TWO HALVES, ONE BAR, because that is what the door actually asks for. The basics and
 * three vibes of your own are AND, not OR, so a single percentage would average two things
 * that cannot substitute for each other — somebody who has done five vibes and no basics is
 * not five-eighths of the way in. The bar is split, each half fills on its own, and the
 * door opens when both are full.
 *
 * IT LEAVES WHEN IT IS DONE, which is the whole of "until you get there". A progress bar
 * that stays at 100% is a decoration, and worse, it keeps measuring somebody against a
 * thing they have finished. Once the Legend is open this renders nothing at all.
 *
 * NOT A STREAK AND NOT A SCORE. It counts sittings towards a door, and the door is a fixed
 * distance that does not move — which is the opposite of the counters this product refuses.
 * There is nothing to lose by stopping, and nothing here goes down.
 */
export function ToLegend() {
  const learner = useLearner()
  const status = legendStatus({
    rootsPlayed: learner.roots_played ?? [],
    sectionsCompleted: learner.sections_completed ?? [],
    sittings: learner.sittings ?? 0,
  })

  /* Arrived. See the note above: a finished bar is a decoration. */
  if (status.open) return null

  /*
    Nothing at all before the first sitting.

    An empty bar on the very first screen is a measurement of somebody who has not started,
    which reads as a debt rather than as progress. It appears once there is something in it.
  */
  const doorway = Math.min(status.sessionsDone, status.sessionsNeeded)
  const vibes = Math.min(status.vibesDone, status.vibesNeeded)
  if (doorway === 0 && vibes === 0) return null

  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

  return (
    <div
      data-testid="to-legend"
      className="flex flex-col gap-1 rounded border border-line bg-bg-elev px-4 py-3"
    >
      <div className="flex items-baseline gap-3">
        <p className="eyebrow min-w-0 flex-1 truncate text-muted">TO YOUR LEGEND</p>
        {/*
          The number that is actually left, rather than a percentage.

          "Two more sittings" is a thing somebody can decide about this evening; "68%" is
          not. tabular-nums so it does not shift as it counts down.
        */}
        <p className="text-xs tabular-nums text-muted">
          {status.sessionsNeeded - doorway + Math.max(0, status.vibesNeeded - vibes)} to go
        </p>
      </div>
      {/*
        Two bars, because the two halves are AND and cannot substitute for each other —
        see the note above. Sized by what each half is worth so the whole reads as one
        distance rather than as two unrelated meters.
      */}
      <div className="mt-1 flex gap-1" aria-hidden>
        <span
          className="h-1 overflow-hidden rounded-full bg-line"
          style={{ flex: status.sessionsNeeded }}
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-[420ms]"
            style={{ width: pct(doorway, status.sessionsNeeded) + '%' }}
          />
        </span>
        <span
          className="h-1 overflow-hidden rounded-full bg-line"
          style={{ flex: status.vibesNeeded }}
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-[420ms]"
            style={{ width: pct(vibes, status.vibesNeeded) + '%' }}
          />
        </span>
      </div>
      {/*
        What the two halves ARE, said once and quietly.

        A split bar with no labels is a puzzle. This is the one line that makes it legible,
        and it is also the answer to "what do I actually have to do" — which is the question
        the whole component exists to stop somebody having to ask.
      */}
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The basics {doorway} of {status.sessionsNeeded}, then {vibes} of {status.vibesNeeded}{' '}
        vibes of your own.
      </p>
    </div>
  )
}
