'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/content/brand'
import { QUESTIONS, type Question } from '@/content/feedback'
import { PageShell } from '@/components/PageShell'
import { track } from '@/engine/analytics'
import {
  buildSubmission,
  downloadFeedback,
  submitFeedback,
} from '@/engine/feedback'
import { hydrateFromUrl, loadLearner } from '@/engine/learner'

/**
 * The falsification study, for a facilitated session.
 *
 * Six research questions written for the Mission 02 study — "in one sentence, what do
 * you think this product is?". They are the right instrument for an observed session
 * with a moderator and entirely the wrong one to put in front of somebody on their sofa
 * who just hit something confusing, which is why they now live behind ?study=1 and the
 * open feedback page lives at /feedback.
 *
 * Free text is deliberate even though the missions ban keyboard entry: this is not a
 * language task, and a menu would supply the answers we are trying to hear.
 */
export function StudyForm() {
  const [ready, setReady] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [state, setState] = useState<'editing' | 'sending' | 'done'>('editing')
  const [stored, setStored] = useState<boolean | null>(null)
  const [reason, setReason] = useState<string>('')

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    setReady(true)
  }, [])

  if (!ready) return <PageShell eyebrow={BRAND.name}>{null}</PageShell>

  const missing = QUESTIONS.filter(
    (q) => q.required && !String(answers[q.id] ?? '').trim(),
  )

  async function send() {
    setState('sending')
    const submission = buildSubmission(answers)
    track('interview_tag', {
      feedback_version: submission.feedback_version,
      answered: Object.keys(answers).length,
      of: QUESTIONS.length,
    })
    const result = await submitFeedback(submission)
    setStored(result.stored)
    setReason(result.reason ?? '')
    if (!result.stored) downloadFeedback(submission)
    setState('done')
  }

  if (state === 'done') {
    return (
      <PageShell eyebrow={BRAND.name + ' · FEEDBACK'}>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="display text-3xl">Thank you. Genuinely.</h1>
          <p className="mt-3 text-sm text-muted">
            {stored
              ? 'Your answers are saved.'
              : 'Your answers could not reach the server, so a copy has been downloaded to this phone. Hand it to the facilitator — nothing is lost.'}
          </p>
          {!stored && reason ? (
            <p className="mt-2 font-mono text-[0.6rem] text-muted">{reason}</p>
          ) : null}
          <Link
            href="/deck"
            className="tap-target eyebrow mt-6 block w-full rounded bg-accent px-5 py-4 text-center text-accent-ink"
          >
            OPEN MY DECK
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow={BRAND.name + ' · FEEDBACK'}>
      <h1 className="display text-balance text-3xl">Now take it apart.</h1>
      <p className="mt-3 text-sm text-muted">
        Be as critical as you can be. Praise is pleasant and useless; the sharpest
        thing you say is the most valuable thing on this page.
      </p>

      <div className="mt-8 space-y-8">
        {QUESTIONS.map((q, i) => (
          <Field
            key={q.id}
            index={i + 1}
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          />
        ))}
      </div>

      {missing.length ? (
        <p className="mt-6 text-xs text-coach">
          {missing.length} question{missing.length === 1 ? '' : 's'} still to answer.
        </p>
      ) : null}

      <button
        type="button"
        disabled={Boolean(missing.length) || state === 'sending'}
        onClick={send}
        className="tap-target eyebrow mt-4 w-full rounded bg-accent px-5 py-4 text-accent-ink disabled:bg-chip disabled:text-muted"
      >
        {state === 'sending' ? 'SENDING…' : 'SEND MY FEEDBACK'}
      </button>
    </PageShell>
  )
}

function Field({
  index,
  question,
  value,
  onChange,
}: {
  index: number
  question: Question
  value: string | number | undefined
  onChange: (v: string | number) => void
}) {
  return (
    <section>
      <div className="flex gap-3">
        <span className="display shrink-0 text-sm text-accent">{index}</span>
        <div className="flex-1">
          <label htmlFor={question.id} className="block text-balance text-base font-semibold">
            {question.prompt}
            {question.required ? <span className="text-accent"> *</span> : null}
          </label>
          {question.hint ? (
            <p className="mt-1 text-xs text-muted">{question.hint}</p>
          ) : null}

          {question.kind === 'text' ? (
            <textarea
              id={question.id}
              rows={3}
              value={String(value ?? '')}
              onChange={(e) => onChange(e.target.value)}
              className="mt-3 w-full rounded border border-line bg-surface p-3 text-sm text-fg outline-none focus:border-accent"
            />
          ) : null}

          {question.kind === 'scale' ? (
            <div className="mt-3 space-y-2">
              {question.points?.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={value === p.value}
                  onClick={() => onChange(p.value)}
                  className={
                    'tap-target flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left text-sm transition ' +
                    (value === p.value
                      ? 'border-accent bg-accent/10'
                      : 'border-line bg-surface')
                  }
                >
                  <span className="display w-4 text-accent">{p.value}</span>
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
