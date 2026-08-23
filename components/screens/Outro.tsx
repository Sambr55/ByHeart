'use client'

import { useState } from 'react'
import type {
  ContinuationScreen,
  GenerativityScreen,
  PreferenceScreen,
  ResultScreen,
} from '@/content/types'
import { slugFor } from '@/content/audio-manifest'
import { track } from '@/engine/analytics'
import { setAffinity } from '@/engine/learner'
import { useSession } from '@/engine/session'
import { AudioButton } from '../AudioButton'
import { Continue, FeedbackNote } from '../MissionShell'
import { Prompt } from '../Prompt'

/**
 * Evidence of acquisition, not game points. No grades, no CEFR claims (spec §9).
 */
export function ResultView({ screen }: { screen: ResultScreen }) {
  const { next, scores } = useSession()
  const weak = scores.transferred < Math.ceil(scores.total / 2)

  return (
    <div className="flex min-h-[55dvh] flex-col justify-center">
      <h1 className="display text-balance text-3xl sm:text-4xl">{screen.headline}</h1>

      <p className="mt-6 text-balance text-lg font-semibold">
        You transferred {scores.transferred}/{scores.total} phrases into ordinary Lisbon
        situations.
      </p>
      <p className="mt-2 text-sm text-muted">
        {scores.firstTry}/{scores.total} came back first time. {scores.assisted} needed a
        hint.
      </p>

      {weak ? <FeedbackNote tone="correct">{screen.lowScoreCopy}</FeedbackNote> : null}

      <Continue
        label={screen.cta}
        onClick={() => {
          track('final_score', {
            transferred: scores.transferred,
            first_try: scores.firstTry,
            assisted: scores.assisted,
            total: scores.total,
            first_try_acquisition: scores.firstTryAcquisition,
            teaching_items: scores.teachingItems,
          })
          next()
        }}
      />
    </div>
  )
}

export function GenerativityView({ screen }: { screen: GenerativityScreen }) {
  const { next } = useSession()
  return (
    <>
      <h1 className="display text-balance text-3xl sm:text-4xl">{screen.headline}</h1>
      <ul className="mt-6 space-y-3">
        {screen.lines.map((l) => (
          <li
            key={l.pt}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3"
          >
            <AudioButton slug={slugFor(l.pt)} text={l.pt} screenId={screen.id} size="sm" />
            <span>
              <span className="pt block text-lg text-accent">{l.pt}</span>
              <span className="mt-0.5 block text-xs text-muted">{l.en}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm font-semibold">{screen.closing}</p>
      <Continue
        label={screen.cta}
        onClick={() => {
          track('generativity_view', { screen: screen.id })
          next()
        }}
      />
    </>
  )
}

export function PreferenceView({ screen }: { screen: PreferenceScreen }) {
  const { next } = useSession()
  const [picked, setPicked] = useState<string[]>([])
  return (
    <>
      <Prompt screen={screen} />
      <div className="mt-6 space-y-3">
        {screen.options.map((o) => {
          const on = picked.includes(o.id)
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setPicked((p) => (on ? p.filter((x) => x !== o.id) : [...p, o.id]))
              }
              className={
                'tap-target flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition ' +
                (on
                  ? 'border-accent bg-accent/10'
                  : 'border-line bg-surface hover:border-accent/50')
              }
            >
              <span>
                <span className="display block text-lg">{o.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{o.desc}</span>
              </span>
              {on ? (
                <span aria-hidden="true" className="text-accent">
                  ✓
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {picked.length ? <FeedbackNote tone="correct">{screen.reveal}</FeedbackNote> : null}
      <Continue
        label={screen.cta}
        disabled={!picked.length}
        onClick={() => {
          setAffinity({ next_world_pre: picked[0] ?? null })
          track('next_world_interest', { worlds: picked })
          next()
        }}
      />
    </>
  )
}

export function ContinuationView({ screen }: { screen: ContinuationScreen }) {
  const { state, answer, finish } = useSession()
  const [picked, setPicked] = useState<ContinuationScreen['options'][number] | null>(null)

  return (
    <div className="flex min-h-[55dvh] flex-col justify-center">
      <Prompt screen={screen} />
      <div className="mt-6 space-y-3">
        {screen.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setPicked(o)
              answer('continue_intent', o.id)
              track('continue_intent', { intent: o.id })
            }}
            className={
              'tap-target eyebrow w-full rounded-xl border px-4 py-5 text-left transition ' +
              (picked?.id === o.id
                ? 'border-accent bg-accent/10'
                : 'border-line bg-surface hover:border-accent/50')
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {picked ? (
        <>
          <FeedbackNote tone="correct">{picked.reply}</FeedbackNote>
          <label className="mt-5 block">
            <span className="text-sm text-muted">{screen.followUp}</span>
            <textarea
              rows={3}
              value={String(state.answers.qualitative_feedback ?? '')}
              onChange={(e) => answer('qualitative_feedback', e.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-surface p-3 text-sm text-fg outline-none focus:border-accent"
              placeholder="Optional"
            />
          </label>
          <Continue
            label="FINISH"
            onClick={() => {
              track('qualitative_feedback', {
                intent: picked.id,
                text: state.answers.qualitative_feedback ?? '',
              })
              finish()
            }}
          />
        </>
      ) : null}
    </div>
  )
}
