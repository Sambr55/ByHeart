'use client'

import { useMemo } from 'react'
import { useLearner } from '@/engine/useLearner'
import { cardFor, legendStatus } from '@/content/legend'

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
  const card = cardFor(learner.purpose ?? null)
  const need = useMemo(() => [...new Set(card.flatMap((f) => f.built_from))], [card])
  const have = need.filter((id) => (learner.inventory ?? {})[id]).length

  /*
    Gone once the door is open, for the reason the first version gave: a bar at 100% is a
    decoration that keeps measuring a finished thing.
  */
  if (status.open) return null
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
          {have} of {need.length}
        </p>
      </div>
      <span className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <span
          className="block h-full rounded-full bg-accent transition-[width] duration-[420ms]"
          style={{ width: Math.round((have / need.length) * 100) + '%' }}
        />
      </span>
    </div>
  )
}
