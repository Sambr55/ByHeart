'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { StudyForm } from '@/components/StudyForm'
import { FEEDBACK_COPY, FEEDBACK_FEEL, FEEDBACK_WHERE, HELP } from '@/content/help'
import { track } from '@/engine/analytics'
import { buildSubmission, submitFeedback } from '@/engine/feedback'
import { hydrateFromUrl, loadLearner } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { PIECES, RUNGS, rungReached } from '@/content/roots'

/**
 * Helpful, humble, practical — and answering what it can before it asks for anything.
 *
 * A feedback form is a product asking for a favour. This one gives something back first,
 * which is also how you get better feedback: somebody who has just been helped writes
 * more than somebody who has just been interrogated.
 *
 * Three rules it is built on. Answer first, ask second — the top of the page is the six
 * things people actually get stuck on. One box, always, because a required six-question
 * survey is a wall and one honest question collects more than six required fields. And
 * say what happens next, because vague gratitude reads as a black hole.
 *
 * The old research questions are not deleted — they are a good instrument for a
 * facilitated session and the wrong one for somebody reporting a typo, so they live
 * behind ?study=1 where a moderator sends them deliberately.
 */
export default function FeedbackPage() {
  return (
    <Suspense fallback={null}>
      <FeedbackRouter />
    </Suspense>
  )
}

function FeedbackRouter() {
  const params = useSearchParams()
  if (params.get('study') === '1') return <StudyForm />
  return <OpenFeedback />
}

function OpenFeedback() {
  const learner = useLearner()
  const [open, setOpen] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [where, setWhere] = useState<string | null>(null)
  const [feel, setFeel] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'editing' | 'sending' | 'done'>('editing')

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
  }, [])

  // Answering from live state beats reciting policy: this learner's actual stage, and
  // what they actually have, are both knowable right here.
  const stage = rungReached(learner.proof ?? [])
  const kept = Object.keys(learner.inventory ?? {}).filter((id) => PIECES[id]).length

  async function send() {
    setState('sending')
    track('feedback_open', { where: where ?? 'unsaid', feel: feel ?? 'unsaid' })
    await submitFeedback(
      buildSubmission(
        { what_did_not_land: text, where: where ?? '', feel: feel ?? '', email },
        { stage, kept },
      ),
    )
    setState('done')
  }

  if (state === 'done') {
    return (
      <PageShell eyebrow="THANK YOU">
        <div className="flex flex-1 flex-col justify-center gap-3">
          <h1 className="display text-balance text-3xl">{FEEDBACK_COPY.sent_head}</h1>
          <p className="text-sm leading-relaxed text-muted">{FEEDBACK_COPY.sent_body}</p>
        </div>
        <Link
          href="/vibes"
          className="tap-target eyebrow mt-auto block w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          {FEEDBACK_COPY.sent_cta}
        </Link>
      </PageShell>
    )
  }

  return (
    <PageShell eyebrow={FEEDBACK_COPY.eyebrow}>
      <div className="flex flex-col gap-6 pb-3">
      <div>
        <h1 className="display text-balance text-2xl">{FEEDBACK_COPY.headline}</h1>
        <p className="mt-3 text-xs text-muted">
          You are at stage {stage}, {RUNGS[stage - 1].name.toLowerCase()}, with {kept}{' '}
          {kept === 1 ? 'piece' : 'pieces'} kept.
        </p>
      </div>

      {/* Answers, at the top. The form is underneath. */}
      <ul className="flex flex-col gap-3">
        {HELP.map((h) => {
          const isOpen = open === h.id
          return (
            <li key={h.id}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : h.id)}
                className={
                  'tap-target flex w-full items-baseline justify-between gap-3 rounded border px-4 py-3 text-left transition ' +
                  (isOpen
                    ? 'border-accent bg-accent/10'
                    : 'border-line bg-bg-elev hover:border-accent/50')
                }
              >
                <span className="min-w-0 text-sm font-semibold">{h.q}</span>
                <span className="shrink-0 text-[0.55rem] uppercase tracking-wider text-muted">
                  {isOpen ? 'close' : 'answer'}
                </span>
              </button>
              {isOpen ? (
                <div className="mt-1 rounded border border-line bg-bg-elev px-4 py-3">
                  <p className="text-sm leading-relaxed text-fg/85">{h.a}</p>
                  {h.link ? (
                    <Link
                      href={h.link.href}
                      className="eyebrow mt-3 inline-block text-accent underline underline-offset-4"
                    >
                      {h.link.label}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <section className="flex flex-col gap-3 border-t border-line pt-6">
        <div>
          <p className="eyebrow text-accent">{FEEDBACK_COPY.form_head}</p>
          <label htmlFor="what" className="mt-3 block text-sm font-semibold">
            {FEEDBACK_COPY.prompt}
          </label>
          <p className="mt-1 text-xs text-muted">{FEEDBACK_COPY.hint}</p>
          <textarea
            id="what"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            data-testid="feedback-text"
            className="mt-3 w-full rounded border border-line bg-surface px-4 py-3 text-base text-fg outline-none focus:border-accent"
          />
        </div>

        <div>
          <p className="text-xs text-muted">{FEEDBACK_COPY.where}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {FEEDBACK_WHERE.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWhere(where === w ? null : w)}
                className={
                  'tap-target rounded border px-3 py-3 text-xs transition ' +
                  (where === w
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-muted')
                }
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted">{FEEDBACK_COPY.feel}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {FEEDBACK_FEEL.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setFeel(feel === w ? null : w)}
                className={
                  'tap-target rounded border px-3 py-3 text-xs transition ' +
                  (feel === w
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-line text-muted')
                }
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-muted">
            {FEEDBACK_COPY.email}
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-3 w-full rounded border border-line bg-surface px-4 py-3 text-base text-fg outline-none focus:border-accent"
          />
        </div>

        {/* Shown, not hidden. A product that says "anonymous" and attaches a device id
            is lying, and this one attaches a device id. */}
        <p className="text-xs leading-relaxed text-muted">{FEEDBACK_COPY.attached}</p>

        <button
          type="button"
          data-testid="feedback-send"
          onClick={send}
          disabled={state === 'sending' || !text.trim()}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-accent-ink disabled:border disabled:border-line-strong disabled:bg-transparent disabled:text-muted"
        >
          {FEEDBACK_COPY.send}
        </button>
      </section>
      </div>
    </PageShell>
  )
}
