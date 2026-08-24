'use client'

import type { ChoiceScreen } from '@/content/types'
import { slugFor } from '@/content/audio-manifest'
import { useExercise } from '@/engine/useExercise'
import { track } from '@/engine/analytics'
import { useSession } from '@/engine/session'
import { AudioButton } from './AudioButton'
import { Continue, FeedbackNote } from './MissionShell'
import { Prompt } from './Prompt'

/**
 * 2–4 answer cards with diagnostic feedback. Every option stays visible and tappable
 * after a wrong answer — nothing is hidden or greyed into uselessness (spec §5).
 */
export function ChoiceExercise({ screen }: { screen: ChoiceScreen }) {
  const { next } = useSession()
  const { feedback, solved, revealed, submit } = useExercise(screen)
  const correct = screen.options.find((o) => o.correct)!

  return (
    <>
      <Prompt screen={screen} />

      <div className="mt-6 space-y-3">
        {screen.options.map((o) => {
          const isCorrect = Boolean(o.correct)
          const state = solved
            ? isCorrect
              ? 'right'
              : 'idle'
            : 'idle'
          return (
            <button
              key={o.id}
              type="button"
              disabled={solved}
              onClick={() => {
                track('choice_submitted', { screen: screen.id, option: o.id })
                submit(
                  { correct: isCorrect, message: o.feedback },
                  { option: o.id },
                )
              }}
              className={
                'tap-target flex w-full items-center justify-between gap-3 rounded border px-4 py-4 text-left transition active:scale-[0.99] ' +
                (state === 'right'
                  ? 'border-correct bg-correct/10'
                  : 'border-line bg-bg-elev hover:border-accent/50') +
                (solved && !isCorrect ? ' opacity-45' : '')
              }
            >
              <span className="pt text-lg">{o.pt}</span>
              {state === 'right' ? (
                <span aria-hidden="true" className="text-correct">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {feedback ? (
        <FeedbackNote tone={feedback.tone}>
          {revealed ? (
            <span>
              <span className="pt">{correct.pt}</span> — {feedback.text}
            </span>
          ) : (
            feedback.text || screen.reveal
          )}
        </FeedbackNote>
      ) : null}

      {solved ? (
        <div className="mt-4 flex items-center gap-3 rounded border border-line bg-bg-elev px-4 py-3">
          <AudioButton
            slug={slugFor(correct.pt)}
            text={correct.pt}
            screenId={screen.id}
          />
          <span className="pt text-lg">{correct.pt}</span>
        </div>
      ) : null}

      {solved ? <Continue onClick={next} /> : null}
    </>
  )
}
