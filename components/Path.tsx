'use client'

import { CRATES_TO_UNLOCK_LEGEND } from '@/content/legend'
import type { LearnerState } from '@/engine/learner'

/**
 * The journey, drawn — where you are and what is next.
 *
 * Two problems, one shape. The deal screen explained a six-stage ladder that the product
 * no longer shows anywhere, so a learner was briefed on a system they would never see;
 * and a learner who finished the basics and two crates hit a screen saying "nothing new
 * is open" with no link on it and no idea that a gate was the next thing.
 *
 * So the same five steps are drawn in both places, with the current one marked. It is
 * the answer to "what happens next", and it is worth more than any of the prose it
 * replaces.
 */
interface Step {
  id: string
  label: string
  note: string
  /** The one step that is a door rather than a place. Drawn differently. */
  gate?: boolean
}

export const PATH: Step[] = [
  { id: 'basics', label: 'The basics', note: 'Hello, thank you, yes, no, one to ten.' },
  { id: 'picking', label: 'Two crates you pick', note: 'Anything on the shelf. That is the free three.' },
  { id: 'gate', label: 'Membership', note: 'If you want to carry on.', gate: true },
  // The deal explains the Legend in full just above this, so the map only has to place
  // it. On the shelf, where there is no such block, the label still carries the idea.
  { id: 'legend', label: 'Your Legend opens', note: CRATES_TO_UNLOCK_LEGEND + ' crates in.' },
  { id: 'club', label: 'Dub Club', note: 'Where your Legend grows.' },
]

/**
 * Which step somebody is standing on.
 *
 * Deliberately derived rather than stored: it is a view of state that already exists, and
 * a second copy of it would be a second thing that can be wrong.
 */
export function whereOnPath(s: LearnerState, crates: number, capped: boolean): number {
  const built = (s.legend ?? []).filter((a) => Object.keys(a.values).length > 0).length
  if (built >= 5) return 4
  if (crates >= CRATES_TO_UNLOCK_LEGEND) return 3
  if (capped) return 2
  if ((s.sections_completed ?? []).includes('basics') || crates > 0) return 1
  return 0
}

export function Path({ at, className = '' }: { at: number; className?: string }) {
  return (
    <ol className={'flex flex-col ' + className} aria-label="Where you are">
      {PATH.map((step, i) => {
        const done = i < at
        const here = i === at
        return (
          <li key={step.id} className="flex gap-3">
            {/* The rail and the marker. Drawn with borders rather than an SVG so it
                scales with the text and needs no viewBox. */}
            <div className="flex w-3 shrink-0 flex-col items-center">
              <span
                aria-hidden
                className={
                  'mt-1 h-3 w-3 shrink-0 border-2 ' +
                  (step.gate ? 'rotate-45 ' : 'rounded-full ') +
                  (done
                    ? 'border-accent bg-accent'
                    : here
                      ? 'border-accent bg-bg'
                      : 'border-line-strong bg-bg')
                }
              />
              {i < PATH.length - 1 ? (
                <span
                  aria-hidden
                  className={'w-0.5 flex-1 ' + (done ? 'bg-accent' : 'bg-line')}
                />
              ) : null}
            </div>
            <div className={'flex flex-col gap-1 pb-6 ' + (here ? '' : 'opacity-70')}>
              <span className={'text-sm ' + (here ? 'font-semibold text-accent' : 'font-semibold')}>
                {step.label}
                {here ? <span className="ml-3 text-xs font-normal text-accent">you are here</span> : null}
              </span>
              <span className="text-xs leading-relaxed text-muted">{step.note}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
