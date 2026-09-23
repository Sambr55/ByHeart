'use client'

import { useMemo } from 'react'
import { useLearner } from '@/engine/useLearner'
import { legendStatus } from '@/content/legend'
import { roadProgress } from '@/content/road'

/**
 * HOW FAR TO THE LEGEND, on every screen where somebody is working towards it.
 *
 * Sam: "I want to show a progress bar as you build towards your legend, it should be ever
 * present until you get there", and then, on the first version: "every time I bank a word
 * for my legend it progresses. This may be too subtle, but that was my intent."
 *
 * IT COUNTS WORDS, NOT SITTINGS, and the difference is whether it can move while somebody
 * is looking at it. The first version measured the door — the basics plus three vibes —
 * which is the right answer to "when does the Club open" and the wrong thing to put above
 * a lesson: you bank four words, the bar sits still, and then it jumps a quarter when the
 * session ends. A bar that only moves when you are not watching is a scoreboard.
 *
 * The ten words this learner's card is built from are a real, fixed, knowable distance,
 * and every KEPT moves it. Full means the card can be built.
 *
 * IT LEAVES WHEN IT IS DONE. A progress bar at 100% is a decoration, and worse, it keeps
 * measuring somebody against a thing they have finished.
 *
 * NOT A STREAK AND NOT A SCORE. The distance is fixed and nothing here ever goes down —
 * which is the opposite of the counters this product refuses.
 */
export function ToLegend() {
  const learner = useLearner()
  const status = legendStatus({
    rootsPlayed: learner.roots_played ?? [],
    sectionsCompleted: learner.sections_completed ?? [],
    sittings: learner.sittings ?? 0,
    purpose: learner.purpose ?? null,
  })

  /*
    THE WORDS THE CARD NEEDS, not the sittings it takes to get them.

    Sam: "every time I bank a word for my legend it progresses. This may be too subtle, but
    that was my intent."

    The first version counted sittings, which is the shape of the DOOR — the basics plus
    three vibes — and it is right about what opens the Club. It is the wrong thing to put
    in front of somebody mid-lesson, because it cannot move: you bank four words, the bar
    sits still, and then it jumps a quarter when the session ends. A bar that only moves
    when you are not looking at it is a scoreboard.

    This counts the ten words this learner's card is built from — chamo_me, sou, trabalho
    and the rest — against what is in their inventory. So it moves on every KEPT, inside
    the lesson, which is what Sam meant and what makes it worth having at the top of the
    screen at all.

    THE TEN ARE THEIRS, not a universal set. cardFor filters by purpose, so a visitor is
    measured against semana and a mover against anos, and neither is shown a word the
    other needs.
  */
  /*
    IT MEASURES THE DOOR, because that is what it is labelled TO YOUR LEGEND.

    Sam, with the most instructive screenshot of the session: "says 10 out of 10 at the
    top. Says three out of four basics done... and the legend is about to open."

    Both numbers were honest and neither was the door. This counted the ten WORDS the
    learner's card is built from, and every one of them is taught in the basics — so the
    bar reached 10 of 10 while the Legend stayed shut, because the door is basics plus
    three chosen vibes and the warm-up is only the first of those. A bar that says 10 of
    10 above a sentence saying one more session is not two views of progress, it is the
    product contradicting itself on one screen.

    So it counts what actually opens the Legend: the doorway roots and the chosen vibes,
    in one number. The card's vocabulary is a real quantity and it has its own screen —
    the Legend deck says which questions are answerable — but it is not the distance this
    bar is named after.

    Words still move it, because the doorway is counted in roots rather than sittings, so
    a lesson advances the bar as it is played rather than only when the session ends. That
    is the property the word count was chosen for in the first place; what changes is that
    reaching the end of it now means the door opens.
  */
  /*
    ONE NUMBER, READ FROM THE ROAD.

    This counted doorway roots plus chosen vibes, derived from three functions over
    overlapping inputs — which is how it came to read 10 of 10 above a sentence saying one
    more session. The road is a list, so the bar is a position on it and the door is its
    end: the same number, and nothing to keep in step. See content/road.ts.
  */
  const road = roadProgress({
    rootsPlayed: learner.roots_played ?? [],
    sectionsCompleted: learner.sections_completed ?? [],
    purpose: learner.purpose ?? null,
  })
  const have = road.done
  const total = road.total

  /*
    Gone once the door is open, for the reason the first version gave: a bar at 100% is a
    decoration that keeps measuring a finished thing.
  */
  if (road.open) return null
  /*
    And nothing before the first word. An empty bar on a first screen measures somebody
    who has not started, which reads as a debt rather than as progress.
  */
  if (have === 0) return null

  return (
    <div data-testid="to-legend" className="flex flex-col gap-1">
      <div className="flex items-baseline gap-3">
        <p className="eyebrow min-w-0 flex-1 truncate text-muted">TO YOUR LEGEND</p>
        {/*
          The count rather than a percentage. "14 of 22" is a thing somebody can hold;
          68% is not. tabular-nums so it does not shift as it climbs.
        */}
        <p className="text-xs tabular-nums text-muted">
          {have} of {total}
        </p>
      </div>
      <span className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-[420ms]"
          style={{ width: Math.round((have / Math.max(total, 1)) * 100) + '%' }}
        />
      </span>
    </div>
  )
}
