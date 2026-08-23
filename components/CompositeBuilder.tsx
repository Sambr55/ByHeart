'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CompositePart, CompositeScreen } from '@/content/types'
import { canonicalPhrase, slugFor } from '@/content/audio-manifest'
import { TARGETS } from '@/content/targets'
import { track } from '@/engine/analytics'
import { evaluateTiles, nextHintLevel, outcomeFor, scaffoldFor, type HintLevel, type Verdict } from '@/engine/hints'
import { useHighlight } from '@/engine/highlight'
import { useSession } from '@/engine/session'
import { AudioButton } from './AudioButton'
import { Continue, FeedbackNote } from './MissionShell'
import { Prompt } from './Prompt'

interface PartState {
  attempts: number
  hintLevel: HintLevel
  solved: boolean
  revealed: boolean
  feedback: string | null
  placed: string[]
}

const fresh = (): PartState => ({
  attempts: 0,
  hintLevel: 0,
  solved: false,
  revealed: false,
  feedback: null,
  placed: [],
})

function answerTextFor(part: CompositePart): string {
  if (part.kind === 'choice') return part.options.find((o) => o.correct)!.pt
  const built = part.answer
    .map((id) => part.tiles.find((t) => t.id === id)!.text)
    .join(' ')
    .replace(/ \?$/, '?')
    .replace(/, ,/, ',')
  return canonicalPhrase(built)
}

function audioSlugFor(part: CompositePart): string {
  if (part.kind === 'choice') return slugFor(part.options.find((o) => o.correct)!.pt)
  return slugFor(
    part.answer
      .map((id) => part.tiles.find((t) => t.id === id)!.text)
      .join(' ')
      .replace(/ \?$/, '?'),
  )
}

/**
 * Sequential construction, scored per part.
 *
 * The rule that matters: a part answered correctly locks and is never reset by a
 * later mistake (spec §7 B23, §10 C04). Coaching addresses only the part that
 * failed — losing correct work to fix a different sentence is the fastest way to
 * make a learner stop trusting the product.
 */
export function CompositeBuilder({ screen }: { screen: CompositeScreen }) {
  const { next, record, mission } = useSession()
  const { setHighlight } = useHighlight()
  const [states, setStates] = useState<Record<string, PartState>>(() =>
    Object.fromEntries(screen.parts.map((p) => [p.id, fresh()])),
  )
  const start = useRef(0)
  if (start.current === 0 && typeof performance !== 'undefined') {
    start.current = performance.now()
  }
  const recorded = useRef(false)

  const allSolved = screen.parts.every((p) => states[p.id].solved)

  const activeIndex = useMemo(
    () => screen.parts.findIndex((p) => !states[p.id].solved),
    [screen.parts, states],
  )

  function verdictFor(part: CompositePart, state: PartState, chosen?: string): Verdict {
    if (part.kind === 'choice') {
      const option = part.options.find((o) => o.id === chosen)!
      return { correct: Boolean(option.correct), message: option.feedback }
    }
    return evaluateTiles(
      { ...part, type: 'tiles' } as never,
      state.placed,
    )
  }

  /**
   * Runs from an event handler, and deliberately computes everything before touching
   * state. Reading `states` inside the updater looked tidier but meant calling
   * setHighlight — another component's state — from inside a render pass.
   */
  function submit(part: CompositePart, chosen?: string) {
    const state = states[part.id]
    if (state.solved) return

    const verdict = verdictFor(part, state, chosen)
    const attempts = state.attempts + 1
    const patch = (next: Partial<PartState>) =>
      setStates((prev) => ({ ...prev, [part.id]: { ...prev[part.id], ...next } }))

    track(verdict.correct ? 'answer_correct' : 'answer_incorrect', {
      screen: screen.id,
      part: part.id,
      attempts,
    })

    if (verdict.correct) {
      setHighlight(null)
      patch({ attempts, solved: true, feedback: null })
      return
    }

    if (attempts >= 3) {
      track('answer_revealed', { screen: screen.id, part: part.id })
      setHighlight(null)
      patch({
        attempts,
        hintLevel: 3,
        solved: true,
        revealed: true,
        feedback: 'Here it is. Say it once, then keep going.',
      })
      return
    }

    if (nextHintLevel(attempts) >= 2 && part.chipHint) {
      setHighlight(part.chipHint)
      track('hint_shown', { screen: screen.id, part: part.id, level: 2 })
      patch({
        attempts,
        hintLevel: 2,
        feedback:
          (verdict.message ? verdict.message + ' ' : '') +
          scaffoldFor(part.chipHint, TARGETS[part.chipHint].label),
      })
      return
    }

    track('hint_shown', { screen: screen.id, part: part.id, level: 1 })
    patch({
      attempts,
      hintLevel: 1,
      feedback: verdict.message ?? part.hint1 ?? 'Not quite. Look at the pieces again.',
    })
  }

  useEffect(() => {
    if (!allSolved || recorded.current) return
    recorded.current = true
    const attempts = screen.parts.reduce((n, p) => n + states[p.id].attempts, 0)
    const hintLevel = Math.max(
      ...screen.parts.map((p) => states[p.id].hintLevel),
    ) as HintLevel
    const anyRevealed = screen.parts.some((p) => states[p.id].revealed)
    setHighlight(null)
    record({
      screenId: screen.id,
      attempts,
      hintLevel,
      outcome: anyRevealed
        ? 'revealed'
        : outcomeFor(attempts === screen.parts.length ? 1 : attempts, hintLevel),
      responseMs: Math.round(performance.now() - start.current),
      isFinalTest: mission.transfer_items.includes(screen.id),
    })
  }, [allSolved, mission.transfer_items, record, screen.id, screen.parts, setHighlight, states])

  return (
    <>
      <Prompt screen={screen} />

      <div className="mt-6 space-y-4">
        {screen.parts.map((part, i) => {
          const state = states[part.id]
          const active = i === activeIndex
          const answer = answerTextFor(part)
          return (
            <section
              key={part.id}
              data-testid={'part-' + part.id}
              aria-current={active ? 'step' : undefined}
              className={
                'rounded-xl border p-4 transition ' +
                (state.solved
                  ? 'border-correct/40 bg-correct/5'
                  : active
                    ? 'border-line bg-surface'
                    : 'border-line/50 bg-surface/40 opacity-55')
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold">{part.prompt}</p>
                <span className="text-[0.65rem] tabular-nums text-muted">
                  {i + 1}/{screen.parts.length}
                </span>
              </div>
              {part.note ? (
                <p className="pt mt-1 text-sm text-accent/90">{part.note}</p>
              ) : null}

              {state.solved ? (
                <div className="mt-3 flex items-center gap-3">
                  {part.kind === 'choice' && part.english ? null : (
                    <AudioButton
                      slug={audioSlugFor(part)}
                      text={answer}
                      screenId={screen.id}
                      size="sm"
                    />
                  )}
                  <span className={part.kind === 'choice' && part.english ? 'text-lg' : 'pt text-lg'}>
                    {answer}
                  </span>
                  {state.revealed ? (
                    <span className="ml-auto text-[0.65rem] uppercase tracking-wider text-coach">
                      with help
                    </span>
                  ) : (
                    <span aria-hidden="true" className="ml-auto text-correct">
                      ✓
                    </span>
                  )}
                </div>
              ) : active ? (
                <PartInput
                  part={part}
                  state={state}
                  onPlace={(ids) =>
                    setStates((prev) => ({
                      ...prev,
                      [part.id]: { ...prev[part.id], placed: ids },
                    }))
                  }
                  onSubmit={(chosen) => submit(part, chosen)}
                />
              ) : (
                <p className="mt-3 text-xs text-muted">Waiting.</p>
              )}

              {state.feedback && !state.solved ? (
                <FeedbackNote tone="coach">{state.feedback}</FeedbackNote>
              ) : null}
            </section>
          )
        })}
      </div>

      {allSolved && screen.reveal ? (
        <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote>
      ) : null}

      {allSolved ? <Continue onClick={next} /> : null}
    </>
  )
}

function PartInput({
  part,
  state,
  onPlace,
  onSubmit,
}: {
  part: CompositePart
  state: PartState
  onPlace: (ids: string[]) => void
  onSubmit: (chosen?: string) => void
}) {
  if (part.kind === 'choice') {
    return (
      <div className="mt-3 space-y-2">
        {part.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onSubmit(o.id)}
            className="tap-target w-full rounded-lg border border-line bg-bg-elev px-3 py-3 text-left transition hover:border-accent/50 active:scale-[0.99]"
          >
            <span className={part.english ? 'text-lg' : 'pt text-lg'}>{o.pt}</span>
          </button>
        ))}
      </div>
    )
  }

  const pool = part.tiles.filter((t) => !state.placed.includes(t.id))
  return (
    <div className="mt-3">
      <div
        data-testid={'line-' + part.id}
        className="min-h-[3.25rem] rounded-lg border border-dashed border-line bg-bg-elev/60 p-2"
      >
        {state.placed.length ? (
          <div className="flex flex-wrap gap-2">
            {state.placed.map((id, i) => (
              <button
                key={id + i}
                type="button"
                onClick={() => onPlace(state.placed.filter((x) => x !== id))}
                className="tap-target rounded-lg border border-accent/50 bg-chip px-3 py-2 active:scale-95"
              >
                <span className="pt">{part.tiles.find((t) => t.id === id)!.text}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted">Tap the pieces in order.</p>
        )}
      </div>
      <div data-testid={'pool-' + part.id} className="mt-2 flex flex-wrap gap-2">
        {pool.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPlace([...state.placed, t.id])}
            className="tap-target rounded-lg border border-line bg-surface px-3 py-2 transition hover:border-accent/50 active:scale-95"
          >
            <span className="pt">{t.text}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!state.placed.length}
        onClick={() => onSubmit()}
        className="tap-target eyebrow mt-3 w-full rounded-lg border border-accent bg-accent/10 px-4 py-3 text-accent transition disabled:border-line disabled:bg-transparent disabled:text-muted"
      >
        CHECK
      </button>
    </div>
  )
}
