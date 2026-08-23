'use client'

import { useCallback, useEffect, useState } from 'react'
import { BRAND } from '@/content/brand'
import { QUESTIONS, type FeedbackSubmission } from '@/content/feedback'
import { PageShell } from '@/components/PageShell'
import { flushFeedback, pendingFeedback } from '@/engine/feedback'

/**
 * Collation. Every tester's answers in one table, grouped by question rather than by
 * person — reading twelve people's answer to "what is the strongest argument against
 * this?" in a column is a different experience from reading twelve separate forms,
 * and it is the one that changes a decision.
 */
export default function AdminPage() {
  const [key, setKey] = useState('')
  const [rows, setRows] = useState<FeedbackSubmission[] | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(0)
  const [view, setView] = useState<'by-question' | 'by-tester'>('by-question')

  useEffect(() => {
    setKey(sessionStorage.getItem('dub.admin.key') ?? '')
    setPending(pendingFeedback().length)
  }, [])

  const load = useCallback(async (k: string) => {
    setError('')
    try {
      const res = await fetch('/api/feedback?key=' + encodeURIComponent(k))
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? 'request failed')
        return
      }
      sessionStorage.setItem('dub.admin.key', k)
      setRows(body.submissions ?? [])
      if (!body.stored) setError(body.reason ?? 'no store configured')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'network error')
    }
  }, [])

  function csv() {
    if (!rows?.length) return
    const cols = [
      'submission_id',
      'submitted_at',
      'learner_id',
      'test_variant',
      'cohort_tag',
      'missions_completed',
      ...QUESTIONS.map((q) => q.id),
    ]
    const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const lines = [cols.join(',')]
    for (const r of rows) {
      lines.push(
        [
          r.submission_id,
          r.submitted_at,
          r.learner_id,
          r.test_variant,
          r.cohort_tag,
          r.missions_completed.join(' '),
          ...QUESTIONS.map((q) => r.answers[q.id]),
        ]
          .map(esc)
          .join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dub-feedback.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell eyebrow={BRAND.name + ' · FEEDBACK'} stage="PRE-FLIGHT">
      <h1 className="display text-3xl">Collated feedback</h1>

      <div className="mt-4 flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          type="password"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-fg outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => load(key)}
          className="tap-target eyebrow rounded-lg bg-accent px-4 text-accent-ink"
        >
          LOAD
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-coach">{error}</p> : null}

      {pending ? (
        <button
          type="button"
          onClick={async () => {
            const n = await flushFeedback()
            setPending(pendingFeedback().length)
            if (n) load(key)
          }}
          className="tap-target eyebrow mt-3 w-full rounded-lg border border-coach/50 px-3 py-3 text-coach"
        >
          RETRY {pending} UNSENT SUBMISSION{pending === 1 ? '' : 'S'} ON THIS DEVICE
        </button>
      ) : null}

      {rows ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted">{rows.length} submissions</p>
            <div className="flex gap-2">
              <Toggle on={view === 'by-question'} onClick={() => setView('by-question')}>
                by question
              </Toggle>
              <Toggle on={view === 'by-tester'} onClick={() => setView('by-tester')}>
                by tester
              </Toggle>
            </div>
          </div>

          {view === 'by-question' ? (
            <div className="mt-4 space-y-8">
              {QUESTIONS.map((q) => (
                <section key={q.id}>
                  <h2 className="text-balance text-sm font-semibold">{q.prompt}</h2>
                  <ul className="mt-2 space-y-2">
                    {rows
                      .map((r) => ({ r, a: r.answers[q.id] }))
                      .filter((x) => String(x.a ?? '').trim())
                      .map((x) => (
                        <li
                          key={x.r.submission_id + q.id}
                          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                        >
                          <span className="block text-[0.6rem] uppercase tracking-wider text-muted">
                            {x.r.learner_id.slice(0, 6)} · {x.r.test_variant}
                            {x.r.cohort_tag ? ' · ' + x.r.cohort_tag : ''}
                          </span>
                          <span className="mt-1 block">{String(x.a)}</span>
                        </li>
                      ))}
                    {rows.every((r) => !String(r.answers[q.id] ?? '').trim()) ? (
                      <li className="text-xs text-muted">No answers yet.</li>
                    ) : null}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {rows.map((r) => (
                <details
                  key={r.submission_id}
                  className="rounded-xl border border-line bg-surface p-3"
                >
                  <summary className="cursor-pointer text-sm">
                    {r.learner_id.slice(0, 6)} · {r.test_variant} ·{' '}
                    {r.submitted_at.slice(0, 16).replace('T', ' ')}
                  </summary>
                  <dl className="mt-3 space-y-3">
                    {QUESTIONS.map((q) => (
                      <div key={q.id}>
                        <dt className="text-xs text-muted">{q.prompt}</dt>
                        <dd className="mt-0.5 text-sm">
                          {String(r.answers[q.id] ?? '—')}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={csv}
            className="tap-target eyebrow mt-8 w-full rounded-xl border border-line px-5 py-4 text-fg"
          >
            DOWNLOAD CSV
          </button>
        </>
      ) : null}
    </PageShell>
  )
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-wider ' +
        (on ? 'border-accent bg-accent/10 text-accent' : 'border-line text-muted')
      }
    >
      {children}
    </button>
  )
}
