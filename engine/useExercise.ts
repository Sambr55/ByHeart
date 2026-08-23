'use client'

import { useCallback, useRef, useState } from 'react'
import type { Screen } from '@/content/types'
import { FINAL_TEST_ITEMS } from '@/content/topgun-pt'
import { TARGETS } from '@/content/targets'
import { track } from './analytics'
import { useSession } from './session'
import { useHighlight } from './highlight'
import {
  nextHintLevel,
  outcomeFor,
  scaffoldFor,
  type HintLevel,
  type Verdict,
} from './hints'

export interface Feedback {
  tone: 'coach' | 'correct'
  text: string
}

/**
 * Shared exercise behaviour for choice / tiles / match: attempt counting, the hint
 * ladder, diagnostic feedback, silent latency measurement, and the item record.
 */
export function useExercise(screen: Screen, opts: { maxErrors?: number } = {}) {
  const { record, acquire } = useSession()
  const { setHighlight } = useHighlight()
  const [attempts, setAttempts] = useState(0)
  const [hintLevel, setHintLevel] = useState<HintLevel>(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [solved, setSolved] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const start = useRef<number>(0)
  const maxErrors = opts.maxErrors ?? 3

  if (start.current === 0 && typeof performance !== 'undefined') {
    start.current = performance.now()
  }

  const finish = useCallback(
    (finalAttempts: number, level: HintLevel) => {
      const responseMs = Math.round(performance.now() - start.current)
      setSolved(true)
      setHighlight(null)
      record({
        screenId: screen.id,
        attempts: finalAttempts,
        hintLevel: level,
        outcome: outcomeFor(finalAttempts, level),
        responseMs,
        isFinalTest: FINAL_TEST_ITEMS.includes(screen.id),
      })
      if (screen.acquires) acquire(screen.acquires)
    },
    [acquire, record, screen.acquires, screen.id, setHighlight],
  )

  const submit = useCallback(
    (verdict: Verdict, payload: Record<string, unknown> = {}) => {
      if (solved) return
      const n = attempts + 1
      setAttempts(n)

      if (verdict.correct) {
        track('answer_correct', { screen: screen.id, attempts: n, ...payload })
        setFeedback({ tone: 'correct', text: screen.reveal ?? '' })
        finish(n, hintLevel)
        return
      }

      track('answer_incorrect', { screen: screen.id, attempts: n, ...payload })
      const level = nextHintLevel(n)

      if (n >= maxErrors) {
        setRevealed(true)
        setHintLevel(3)
        setHighlight(null)
        track('answer_revealed', { screen: screen.id, attempts: n })
        setFeedback({ tone: 'coach', text: 'Here it is. Say it once, then keep going.' })
        finish(n, 3)
        return
      }

      if (level >= 2) {
        const label = screen.chipHint ? TARGETS[screen.chipHint].label : undefined
        setHintLevel(2)
        if (screen.chipHint) setHighlight(screen.chipHint)
        track('hint_shown', { screen: screen.id, level: 2 })
        setFeedback({
          tone: 'coach',
          text: verdict.message
            ? verdict.message + ' ' + scaffoldFor(screen.chipHint, label)
            : scaffoldFor(screen.chipHint, label),
        })
        return
      }

      setHintLevel(1)
      track('hint_shown', { screen: screen.id, level: 1 })
      setFeedback({
        tone: 'coach',
        text: verdict.message ?? screen.hint1 ?? 'Not that one. Look at the pieces again.',
      })
    },
    [attempts, finish, hintLevel, maxErrors, screen, setHighlight, solved],
  )

  const reset = useCallback(() => setFeedback(null), [])

  return { attempts, hintLevel, feedback, solved, revealed, submit, reset }
}
