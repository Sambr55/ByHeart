'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { BlockId } from '@/content/types'
import { BRAND } from '@/content/brand'
import { BLOCK_CARDS } from '@/content/deck'
import { slugFor } from '@/content/audio-manifest'
import { AudioButton } from '@/components/AudioButton'
import { PageShell } from '@/components/PageShell'
import { downloadSession, initAnalytics, track } from '@/engine/analytics'
import { buildRecallSet } from '@/engine/deck'
import {
  getLearner,
  hoursSinceLastMission,
  hydrateFromUrl,
  loadLearner,
  ownedBlocks,
  recordEvidence,
} from '@/engine/learner'

interface Item {
  block: BlockId
  front: string
  answer: string
  options: string[]
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * The 24–72 hour recall (spec §13). No login: the resume link carries the learner.
 * Eight prompts, no cultural cue anywhere, finishing in well under five minutes.
 * This is the measurement that decides whether anything actually persisted.
 */
export default function RecallPage() {
  const [ready, setReady] = useState(false)
  const [i, setI] = useState(0)
  const [answered, setAnswered] = useState<string | null>(null)
  const [results, setResults] = useState<{ block: BlockId; first_try: boolean }[]>([])
  const started = useRef(0)

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    initAnalytics()
    started.current = performance.now()
    setReady(true)
  }, [])

  const items = useMemo<Item[]>(() => {
    if (!ready) return []
    const owned = ownedBlocks().filter((b): b is BlockId => b in BLOCK_CARDS)
    return buildRecallSet(8).map((block) => {
      const card = BLOCK_CARDS[block]
      const answer = card.reveal[0].pt
      const distractors = shuffle(owned.filter((b) => b !== block))
        .slice(0, 2)
        .map((b) => BLOCK_CARDS[b].reveal[0].pt)
      return { block, front: card.front, answer, options: shuffle([answer, ...distractors]) }
    })
  }, [ready])

  if (!ready) return <PageShell eyebrow={BRAND.name + " · RECALL"}>{null}</PageShell>

  if (!items.length) {
    return (
      <PageShell eyebrow={BRAND.name + " · RECALL"}>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="display text-3xl">Nothing to recall yet.</h1>
          <p className="mt-3 text-sm text-muted">
            This link opens a session that already exists. If you were sent one, open
            that exact link — it carries your Portuguese with it.
          </p>
          <Link
            href="/"
            className="tap-target eyebrow mt-6 rounded bg-accent px-5 py-4 text-center text-accent-ink"
          >
            START MISSION 01
          </Link>
        </div>
      </PageShell>
    )
  }

  if (i >= items.length) {
    const correct = results.filter((r) => r.first_try).length
    return (
      <PageShell eyebrow={BRAND.name + " · RECALL"}>
        <div className="flex flex-1 flex-col justify-center">
          <p className="display text-4xl">
            {correct}/{results.length}
          </p>
          <p className="mt-2 text-lg">came back with no film, and no lesson.</p>
          <p className="mt-4 text-sm text-muted">
            {correct >= Math.ceil(results.length * 0.55)
              ? 'That is the number that matters. Thank you.'
              : 'Some held, some faded. Both readings are useful. Thank you.'}
          </p>
          <button
            type="button"
            onClick={() =>
              downloadSession({
                kind: 'delayed_recall',
                learner: getLearner(),
                results,
                hours_since_last: hoursSinceLastMission(),
              })
            }
            className="tap-target eyebrow mt-6 w-full rounded border border-line px-5 py-4 text-muted"
          >
            DOWNLOAD RECALL JSON
          </button>
          <Link
            href="/deck"
            className="tap-target eyebrow mt-3 block w-full rounded bg-accent px-5 py-4 text-center text-accent-ink"
          >
            OPEN MY DECK
          </Link>
        </div>
      </PageShell>
    )
  }

  const item = items[i]

  function choose(option: string) {
    if (answered) return
    const correct = option === item.answer
    setAnswered(option)
    const hours = hoursSinceLastMission()
    if (correct) {
      recordEvidence({
        target_id: item.block,
        event_type: 'delayed_recall',
        correct_first_try: true,
        hint_count: 0,
        revealed: false,
        latency_ms: Math.round(performance.now() - started.current),
        culture_context: null,
        mission_id: null,
      })
      track('delayed_recall', {
        target_id: item.block,
        hours_since_last: hours,
        first_try: true,
        latency_ms: Math.round(performance.now() - started.current),
      })
      setResults((r) => [...r, { block: item.block, first_try: true }])
    } else {
      recordEvidence({
        target_id: item.block,
        event_type: 'delayed_recall',
        correct_first_try: false,
        hint_count: 0,
        revealed: true,
        latency_ms: Math.round(performance.now() - started.current),
        culture_context: null,
        mission_id: null,
      })
      track('delayed_recall', {
        target_id: item.block,
        hours_since_last: hours,
        first_try: false,
        latency_ms: Math.round(performance.now() - started.current),
      })
      setResults((r) => [...r, { block: item.block, first_try: false }])
    }
  }

  return (
    <PageShell eyebrow={BRAND.name + " · RECALL"}>
      <p className="text-xs tabular-nums text-muted">
        {i + 1} of {items.length}
      </p>
      <p className="mt-4 text-balance text-lg font-semibold">{item.front}</p>

      <div className="mt-6 space-y-3">
        {item.options.map((o) => {
          const isAnswer = o === item.answer
          return (
            <button
              key={o}
              type="button"
              disabled={Boolean(answered)}
              onClick={() => choose(o)}
              className={
                'tap-target flex w-full items-center justify-between rounded border px-4 py-4 text-left transition ' +
                (answered && isAnswer
                  ? 'border-correct bg-correct/10'
                  : answered && answered === o
                    ? 'border-coach bg-coach/10'
                    : 'border-line bg-surface') +
                (answered && !isAnswer && answered !== o ? ' opacity-45' : '')
              }
            >
              <span className="pt text-lg">{o}</span>
              {answered && isAnswer ? (
                <span aria-hidden="true" className="text-correct">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {answered ? (
        <>
          <div className="mt-5 flex items-center gap-3 rounded border border-line bg-surface px-4 py-3">
            <AudioButton slug={slugFor(item.answer)} text={item.answer} size="sm" />
            <span className="pt text-lg">{item.answer}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAnswered(null)
              started.current = performance.now()
              setI((n) => n + 1)
            }}
            className="tap-target eyebrow mt-auto w-full rounded bg-accent px-5 py-4 text-accent-ink"
          >
            NEXT
          </button>
        </>
      ) : null}
    </PageShell>
  )
}
