'use client'

import type { ReactNode } from 'react'
import { STAGES, type Stage } from '@/content/types'
import { SCREENS } from '@/content/topgun-pt'
import { useSession } from '@/engine/session'
import { InventoryRail } from './Inventory'

/**
 * Stage, progress and transitions. Progress reads as mission stages, never XP
 * (spec §5). data-stage drives the palette, so LANDING IN LISBON is a real visual
 * break rather than a restyled cockpit.
 */
export function MissionShell({ children }: { children: ReactNode }) {
  const { state, screen } = useSession()
  const stage = screen.stage

  return (
    <div
      data-stage={stage}
      data-screen={screen.id}
      className="flex min-h-dvh flex-col bg-bg text-fg transition-colors duration-700"
    >
      <StageRail current={stage} index={state.index} />

      <main className="instrument-field flex-1">
        <div key={screen.id} className="animate-rise mx-auto w-full max-w-md px-5 py-6">
          {children}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-line bg-bg-elev/95 px-5 py-3 backdrop-blur">
        <InventoryRail blocks={state.inventory} />
        {state.inventory.length ? null : (
          <p className="text-xs text-muted">Your Portuguese fills up as you go.</p>
        )}
      </footer>
    </div>
  )
}

function StageRail({ current, index }: { current: Stage; index: number }) {
  const currentPos = STAGES.indexOf(current)
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto w-full max-w-md px-5 pb-2 pt-3">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-accent">{current}</p>
          <p className="text-[0.65rem] tabular-nums text-muted">
            {index + 1} / {SCREENS.length}
          </p>
        </div>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {STAGES.map((s, i) => {
            const screensInStage = SCREENS.filter((sc) => sc.stage === s)
            const doneInStage = SCREENS.slice(0, index + 1).filter(
              (sc) => sc.stage === s,
            ).length
            const pct =
              i < currentPos
                ? 100
                : i > currentPos
                  ? 0
                  : Math.round((doneInStage / screensInStage.length) * 100)
            return (
              <div key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: pct + '%' }}
                />
              </div>
            )
          })}
        </div>
        <p className="sr-only" role="status">
          Stage {currentPos + 1} of {STAGES.length}: {current}
        </p>
      </div>
    </header>
  )
}

export function Continue({
  label = 'CONTINUE',
  onClick,
  disabled,
}: {
  label?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      data-testid="continue"
      onClick={onClick}
      disabled={disabled}
      className="tap-target eyebrow mt-6 w-full rounded-xl bg-accent px-5 py-4 text-accent-ink transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-chip disabled:text-muted"
    >
      {label}
    </button>
  )
}

/**
 * Feedback never uses colour alone (spec §11) — the marker glyph and the copy carry
 * the state too. Wrong answers coach; they never say FAIL.
 */
export function FeedbackNote({
  tone,
  children,
}: {
  tone: 'coach' | 'correct'
  children: ReactNode
}) {
  const correct = tone === 'correct'
  return (
    <div
      role="status"
      className={
        'animate-bank mt-5 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ' +
        (correct
          ? 'border-correct/40 bg-correct/10 text-fg'
          : 'border-coach/40 bg-coach/10 text-fg')
      }
    >
      <span
        aria-hidden="true"
        className={
          'mt-0.5 shrink-0 font-bold ' + (correct ? 'text-correct' : 'text-coach')
        }
      >
        {correct ? '✓' : '→'}
      </span>
      <div>{children}</div>
    </div>
  )
}
