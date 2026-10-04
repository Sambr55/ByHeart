'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/content/brand'
import { QUESTIONS, type Question } from '@/content/feedback'
import { PageShell } from '@/components/PageShell'
import { track } from '@/engine/analytics'
import { buildSubmission, downloadFeedback, submitFeedback } from '@/engine/feedback'
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

  const missing = QUESTIONS.filter((q) => q.required && !String(answers[q.id] ?? '').trim())

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
          {/*
            The receipt gets the card, and the button stays outside it.

            What this says — saved, or not saved and here is the copy on your phone — is
            the one fact somebody came back for, and it was a headline and a grey line
            floating in the middle of an empty sand page. A card makes it a thing that was
            issued. The CTA below is a separate action rather than part of the receipt, so
            it keeps its own ground.
          */}
          <div className="rounded-2xl border border-line bg-bg-elev px-5 py-6">
            <h1 className="display text-3xl">Thank you. Genuinely.</h1>
            <p className="mt-3 text-sm text-muted">
              {stored
                ? 'Your answers are saved.'
                : 'Your answers could not reach the server, so a copy has been downloaded to this phone. Hand it to the facilitator — nothing is lost.'}
            </p>
            {!stored && reason ? (
              <p className="mt-3 font-mono text-[0.6rem] text-muted">{reason}</p>
            ) : null}
          </div>
          <Link
            href="/proof"
            className="tap-target eyebrow mt-6 block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            OPEN MY DECK
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow={BRAND.name + ' · FEEDBACK'}>
      {/*
        The ask gets a card too, so the instruction is an object and not a caption. It is
        the one thing on this page that is not a question, and six carded questions under
        two loose paragraphs would read as the heading having been left behind.
      */}
      <div className="rounded-2xl border border-line bg-bg-elev px-5 py-6">
        <h1 className="display text-balance text-3xl">Now take it apart.</h1>
        <p className="mt-3 text-sm text-muted">
          Be as critical as you can be. Praise is pleasant and useless; the sharpest thing you say
          is the most valuable thing on this page.
        </p>
      </div>

      <div className="mt-6 space-y-6">
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
        className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:bg-chip disabled:text-muted"
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
    /*
      ONE WHITE CARD PER QUESTION, because six of them ran together on the sand.

      This was a bare `<section>`: number, label, hint, then a field, repeated six times
      with nothing between them but a gap. On a sand ground the only thing separating one
      question from the next was whitespace, so the page read as a wall rather than as six
      things to answer — and the answer fields are bg-surface, which is DARKER than sand,
      so the holes were more visible than the questions they belonged to.

      A card each inverts that: the question is the object, the field is the hole in it.
      That is the relationship the inset token was chosen for, and it only works when
      there is something lifted for it to be inset into.
    */
    <section className="rounded-2xl border border-line bg-bg-elev px-5 py-6">
      <div className="flex gap-3">
        <span className="display shrink-0 text-sm text-accent">{index}</span>
        <div className="flex-1">
          <label htmlFor={question.id} className="block text-balance text-base font-semibold">
            {question.prompt}
            {question.required ? <span className="text-accent"> *</span> : null}
          </label>
          {question.hint ? <p className="mt-1 text-xs text-muted">{question.hint}</p> : null}

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
            <div className="mt-3 space-y-3">
              {question.points?.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={value === p.value}
                  onClick={() => onChange(p.value)}
                  className={
                    'tap-target flex w-full items-center gap-3 rounded border px-3 py-3 text-left text-sm transition ' +
                    (value === p.value ? 'border-accent bg-accent/10' : 'border-line bg-surface')
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
