'use client'

import { useMemo, useRef, useState } from 'react'
import type { BlockId, RecallScreen } from '@/content/types'
import { TARGETS } from '@/content/targets'
import { track } from '@/engine/analytics'
import { useSession } from '@/engine/session'
import { Continue, FeedbackNote } from './MissionShell'
import { Prompt } from './Prompt'

/**
 * Delayed retrieval with no film cue. Its ladder is shorter than the teaching
 * ladder by design (spec §8): first miss re-shows the English cue plus the first
 * letter, second miss reveals and records "with help".
 */
export function RecallBurst({ screen }: { screen: RecallScreen }) {
  const { next, record } = useSession()
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [locked, setLocked] = useState<BlockId | null>(null)
  const [done, setDone] = useState(false)
  const results = useRef<
    { cue: string; answer: BlockId; misses: number; assisted: boolean; ms: number }[]
  >([])
  const cardStart = useRef<number>(0)
  const start = useRef<number>(0)

  if (start.current === 0 && typeof performance !== 'undefined') {
    start.current = performance.now()
    cardStart.current = start.current
  }

  const card = screen.cards[i]
  const hint = misses >= 1
  const revealed = misses >= 2

  const cards = useMemo(() => screen.cards, [screen.cards])

  function finishCard(assisted: boolean) {
    results.current.push({
      cue: card.cue,
      answer: card.answer,
      misses,
      assisted,
      ms: Math.round(performance.now() - cardStart.current),
    })
    if (i + 1 < cards.length) {
      setI(i + 1)
      setMisses(0)
      setLocked(null)
      cardStart.current = performance.now()
      return
    }
    const rows = results.current
    const firstTry = rows.filter((r) => r.misses === 0).length
    track('checkpoint_result', {
      checkpoint: screen.checkpoint,
      screen: screen.id,
      items: rows.length,
      first_try: firstTry,
      accuracy: Math.round((firstTry / rows.length) * 100) / 100,
      hints: rows.filter((r) => r.misses >= 1).length,
      assisted: rows.filter((r) => r.assisted).length,
      per_item: rows,
    })
    record({
      screenId: screen.id,
      attempts: rows.reduce((n, r) => n + r.misses + 1, 0),
      hintLevel: rows.some((r) => r.assisted) ? 3 : rows.some((r) => r.misses) ? 2 : 0,
      outcome:
        firstTry === rows.length
          ? 'first-try'
          : rows.some((r) => r.assisted)
            ? 'revealed'
            : 'with-hint',
      responseMs: Math.round(performance.now() - start.current),
      isFinalTest: false,
    })
    setDone(true)
  }

  function choose(option: BlockId) {
    if (locked) return
    const right = option === card.answer
    track(right ? 'answer_correct' : 'answer_incorrect', {
      screen: screen.id,
      checkpoint: screen.checkpoint,
      cue: card.cue,
      option,
    })
    if (right) {
      setLocked(option)
      setTimeout(() => finishCard(false), 500)
      return
    }
    const m = misses + 1
    setMisses(m)
    if (m >= 2) {
      track('answer_revealed', { screen: screen.id, cue: card.cue })
      setLocked(card.answer)
      setTimeout(() => finishCard(true), 900)
    } else {
      track('hint_shown', { screen: screen.id, level: 1, cue: card.cue })
    }
  }

  if (done) {
    return (
      <>
        <Prompt screen={screen} />
        <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote>
        <Continue onClick={next} />
      </>
    )
  }

  return (
    <>
      <Prompt screen={screen} />

      <p className="mt-6 text-xs tabular-nums text-muted">
        {i + 1} of {cards.length}
      </p>

      <p className="display mt-3 text-3xl text-fg sm:text-4xl">{card.cue}</p>
      {hint ? (
        <p className="pt mt-3 text-lg text-accent">
          Starts with “{TARGETS[card.answer].block.charAt(0).toUpperCase()}”
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {card.options.map((o) => {
          const isAnswer = o === card.answer
          const chosen = locked === o
          return (
            <button
              key={o}
              type="button"
              disabled={Boolean(locked)}
              onClick={() => choose(o)}
              className={
                'tap-target flex w-full items-center justify-between rounded border px-4 py-4 text-left transition active:scale-[0.99] ' +
                (chosen && isAnswer
                  ? 'border-correct bg-correct/10'
                  : 'border-line bg-bg-elev hover:border-accent/50')
              }
            >
              <span className="pt text-lg">{TARGETS[o].label}</span>
              {chosen && isAnswer ? (
                <span aria-hidden="true" className="text-correct">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {revealed ? (
        <FeedbackNote tone="coach">
          <span className="pt">{TARGETS[card.answer].label}</span> — {TARGETS[card.answer].gloss}.
          Noted with help; it will come back.
        </FeedbackNote>
      ) : misses === 1 ? (
        <FeedbackNote tone="coach">
          Not that one. The cue is “{card.cue}”.
        </FeedbackNote>
      ) : null}
    </>
  )
}
