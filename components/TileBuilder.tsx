'use client'

import { useState } from 'react'
import type { TilesScreen } from '@/content/types'
import { canonicalPhrase, slugFor } from '@/content/audio-manifest'
import { evaluateTiles } from '@/engine/hints'
import { useExercise } from '@/engine/useExercise'
import { track } from '@/engine/analytics'
import { useSession } from '@/engine/session'
import { AudioButton } from './AudioButton'
import { Continue, FeedbackNote } from './MissionShell'
import { Prompt } from './Prompt'

/**
 * Ordered phrase construction. Distractor tiles are offered but never required —
 * leaving one unused is correct behaviour, using one is a diagnosable error.
 * Production, not recognition: this is what the Lisbon test leans on.
 */
export function TileBuilder({ screen }: { screen: TilesScreen }) {
  const { next } = useSession()
  const { feedback, solved, revealed, submit } = useExercise(screen)
  const [placed, setPlaced] = useState<string[]>([])

  const built = screen.answer
    .map((id) => screen.tiles.find((t) => t.id === id)!.text)
    .join(' ')
    .replace(/ \?$/, '?')
  const answerText = canonicalPhrase(built)

  const shown = revealed ? screen.answer : placed
  const pool = screen.tiles.filter((t) => !shown.includes(t.id))

  return (
    <>
      <Prompt screen={screen} />

      {/* Construction line */}
      <div
        data-testid="tile-line"
        className="mt-6 min-h-[4.5rem] rounded border border-dashed border-line bg-bg-elev/60 p-3"
        aria-label="Your sentence"
      >
        {shown.length ? (
          <div className="flex flex-wrap gap-3">
            {shown.map((id, i) => {
              const tile = screen.tiles.find((t) => t.id === id)!
              return (
                <button
                  key={id + i}
                  type="button"
                  disabled={solved}
                  onClick={() => setPlaced((p) => p.filter((x) => x !== id))}
                  className={
                    'tap-target rounded border px-3 py-2 transition active:scale-95 ' +
                    (solved
                      ? 'border-correct/50 bg-correct/10'
                      : 'border-accent/50 bg-chip')
                  }
                >
                  <span className="pt text-lg">{tile.text}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="px-1 py-3 text-sm text-muted">
            Tap the pieces below in order.
          </p>
        )}
      </div>

      {/* Pool */}
      {solved ? null : (
        <div data-testid="tile-pool" className="mt-3 flex flex-wrap gap-3">
          {pool.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlaced((p) => [...p, t.id])}
              className="tap-target rounded border border-line bg-bg-elev px-3 py-2 transition hover:border-accent/50 active:scale-95"
            >
              <span className="pt text-lg">{t.text}</span>
            </button>
          ))}
        </div>
      )}

      {feedback ? (
        <FeedbackNote tone={feedback.tone}>
          {revealed ? (
            <span>
              <span className="pt">{answerText}</span> — {feedback.text}
            </span>
          ) : (
            feedback.text || screen.reveal
          )}
        </FeedbackNote>
      ) : null}

      {solved ? (
        <div className="mt-3 flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3">
          <AudioButton
            slug={slugFor(built)}
            text={answerText}
            screenId={screen.id}
          />
          <span className="pt text-lg">{answerText}</span>
        </div>
      ) : null}

      {solved ? (
        <Continue onClick={next} />
      ) : (
        <Continue
          label="CHECK"
          disabled={!placed.length}
          onClick={() => {
            track('tile_order_submitted', { screen: screen.id, order: placed })
            submit(evaluateTiles(screen, placed), { order: placed })
          }}
        />
      )}
    </>
  )
}
