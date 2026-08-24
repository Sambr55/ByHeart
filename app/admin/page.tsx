'use client'

import { useCallback, useEffect, useState } from 'react'
import { QUESTIONS, type FeedbackSubmission } from '@/content/feedback'
import { PIECES, rootById } from '@/content/roots'
import { PageShell } from '@/components/PageShell'
import { flushFeedback, pendingFeedback } from '@/engine/feedback'

interface SessionRecord {
  session_id: string
  tester_label?: string
  recorded_at?: string
  reason?: string
  experiment?: { test_variant?: string; cohort_tag?: string }
  affinity?: { free_text_favourite?: string; next_world_pre?: string }
  inventory?: Record<string, { latest_state?: string }>
  voice_signals?: { signal: string }[]
  evidence?: { target_id: string; event_type: string; correct_first_try: boolean }[]
}

interface Row {
  key: string
  tester: string
  session?: SessionRecord
  feedback?: FeedbackSubmission
}

/**
 * Who tested, what they did, and what they said — in one table.
 *
 * Behaviour and opinion are stored separately because they arrive at different moments,
 * but they are unreadable apart: "it was confusing" from someone who transferred 6/6 is
 * a different finding from the same sentence out of someone who transferred none. The
 * join key is the tester label from their link, falling back to the learner id.
 */
export default function AdminPage() {
  const [key, setKey] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(0)
  const [view, setView] = useState<'testers' | 'by-question'>('testers')

  useEffect(() => {
    setKey(sessionStorage.getItem('dub.admin.key') ?? '')
    setPending(pendingFeedback().length)
  }, [])

  const load = useCallback(async (k: string) => {
    setError('')
    try {
      const [s, f] = await Promise.all([
        fetch('/api/session?key=' + encodeURIComponent(k)).then((r) => r.json()),
        fetch('/api/feedback?key=' + encodeURIComponent(k)).then((r) => r.json()),
      ])
      if (s.error || f.error) {
        setError(s.error ?? f.error)
        return
      }
      sessionStorage.setItem('dub.admin.key', k)
      const sessions: SessionRecord[] = s.sessions ?? []
      const feedback: FeedbackSubmission[] = f.submissions ?? []
      const byKey = new Map<string, Row>()
      const label = (t?: string, id?: string) => (t?.trim() ? t.trim() : (id ?? '').slice(0, 8))
      for (const sess of sessions) {
        const k2 = label(sess.tester_label, sess.session_id)
        byKey.set(k2, { key: k2, tester: k2, session: sess })
      }
      for (const fb of feedback) {
        const k2 = label(fb.tester_label, fb.learner_id)
        const existing = byKey.get(k2)
        byKey.set(k2, { key: k2, tester: k2, session: existing?.session, feedback: fb })
      }
      setRows([...byKey.values()])
      if (!s.stored || !f.stored) setError(s.reason ?? f.reason ?? 'no store configured')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'network error')
    }
  }, [])

  function csv() {
    if (!rows?.length) return
    const cols = ['tester', 'variant', 'cohort', 'started_with', 'typed', 'pieces', 'roots', ...QUESTIONS.map((q) => q.id)]
    const esc = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
    const lines = [cols.join(',')]
    for (const r of rows) {
      lines.push(
        [
          r.tester,
          r.session?.experiment?.test_variant,
          r.session?.experiment?.cohort_tag,
          r.session?.affinity?.next_world_pre,
          r.session?.affinity?.free_text_favourite,
          Object.keys(r.session?.inventory ?? {}).length,
          new Set((r.session?.evidence ?? []).map((e) => e.target_id)).size,
          ...QUESTIONS.map((q) => r.feedback?.answers[q.id]),
        ]
          .map(esc)
          .join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dub-testers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell eyebrow="DUB · TESTERS" stage="CHOICE">
      <h1 className="display text-3xl">Who tested, and what they said</h1>

      <div className="mt-4 flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          type="password"
          className="flex-1 rounded border border-line bg-surface px-3 py-2 font-mono text-xs text-fg outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => load(key)}
          className="tap-target eyebrow rounded bg-accent px-4 text-accent-ink"
        >
          LOAD
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-coach">{error}</p> : null}

      {pending ? (
        <button
          type="button"
          onClick={async () => {
            await flushFeedback()
            setPending(pendingFeedback().length)
            load(key)
          }}
          className="tap-target eyebrow mt-3 w-full rounded border border-coach/50 px-3 py-3 text-coach"
        >
          RETRY {pending} UNSENT SUBMISSION{pending === 1 ? '' : 'S'} ON THIS DEVICE
        </button>
      ) : null}

      {rows ? (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted">{rows.length} testers</p>
            <div className="flex gap-2">
              <Toggle on={view === 'testers'} onClick={() => setView('testers')}>
                by tester
              </Toggle>
              <Toggle on={view === 'by-question'} onClick={() => setView('by-question')}>
                by question
              </Toggle>
            </div>
          </div>

          {view === 'testers' ? (
            <div className="mt-4 space-y-3">
              {rows.map((r) => (
                <details key={r.key} className="rounded border border-line bg-surface p-3">
                  <summary className="cursor-pointer text-sm">
                    <span className="font-semibold">{r.tester}</span>
                    <span className="ml-2 text-xs text-muted">
                      {r.session ? '· session' : ''} {r.feedback ? '· feedback' : '· no feedback yet'}
                    </span>
                  </summary>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Line k="Started with" v={familyLabel(r.session?.affinity?.next_world_pre)} />
                    <Line k="Typed" v={r.session?.affinity?.free_text_favourite || '—'} />
                    <Line k="Pieces owned" v={String(Object.keys(r.session?.inventory ?? {}).length)} />
                    <Line k="Voice signals" v={(r.session?.voice_signals ?? []).map((v) => v.signal).join(', ') || '—'} />
                    <Line k="Arm" v={r.session?.experiment?.test_variant ?? '—'} />
                    {QUESTIONS.map((q) => (
                      <Line key={q.id} k={q.prompt} v={String(r.feedback?.answers[q.id] ?? '—')} />
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-8">
              {QUESTIONS.map((q) => (
                <section key={q.id}>
                  <h2 className="text-balance text-sm font-semibold">{q.prompt}</h2>
                  <p className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
                    closes: {q.closes}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {rows
                      .filter((r) => String(r.feedback?.answers[q.id] ?? '').trim())
                      .map((r) => (
                        <li
                          key={r.key + q.id}
                          className="rounded border border-line bg-surface px-3 py-2 text-sm"
                        >
                          <span className="block text-[0.6rem] uppercase tracking-wider text-muted">
                            {r.tester} · started with {familyLabel(r.session?.affinity?.next_world_pre)}
                          </span>
                          <span className="mt-1 block">{String(r.feedback!.answers[q.id])}</span>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={csv}
            className="tap-target eyebrow mt-8 w-full rounded border border-line px-5 py-4 text-fg"
          >
            DOWNLOAD CSV
          </button>
        </>
      ) : null}
    </PageShell>
  )
}

function familyLabel(id?: string) {
  if (!id) return '—'
  return id.replace(/_/g, ' ')
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-line/50 pb-2 last:border-0">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-0.5">{v}</dd>
    </div>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
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
