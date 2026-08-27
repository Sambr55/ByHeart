'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { SHOWING_COPY } from '@/content/showing-copy'

interface Report {
  id: number
  showing_id: string | null
  reason: string
  created_at: string
  card: { count: number; lines: { pt: string; en: string }[] } | null
}

const LABEL = Object.fromEntries(SHOWING_COPY.report_reasons.map((r) => [r.id, r.label]))

/**
 * The queue, on its own page.
 *
 * Deliberately not a third tab on /admin. That page is research — who tested and what
 * they said — and a safety queue mixed into it becomes something you scroll past while
 * looking for something else. This one has a single job and is empty almost always, which
 * is the state it should be easy to confirm.
 *
 * The reported card is rendered here rather than linked, because the reader should not
 * have to open a showing to judge one, and opening it as an admin would make them the
 * recipient of an invitation addressed to somebody else.
 */
export default function ReportsPage() {
  const [key, setKey] = useState('')
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => setKey(sessionStorage.getItem('dub.admin.key') ?? ''), [])

  const load = useCallback(async (k: string) => {
    setError('')
    try {
      const res = await fetch('/api/showing/reports?key=' + encodeURIComponent(k))
      const body = (await res.json()) as { ok?: boolean; reports?: Report[]; error?: string }
      if (!body.ok) {
        setError(body.error ?? 'could not load')
        return
      }
      sessionStorage.setItem('dub.admin.key', k)
      setReports(body.reports ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error')
    }
  }, [])

  async function done(id: number) {
    await fetch('/api/showing/reports?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setReports((r) => (r ?? []).filter((x) => x.id !== id))
  }

  return (
    <PageShell eyebrow="DUB · REPORTS" stage="CHOICE" back="/admin" backLabel="TESTERS">
      <h1 className="display text-3xl">What people reported</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Showings somebody said were not okay. Marking one read takes it off this list and
        does nothing to the showing — blocking is the member’s own control and is already
        permanent when they use it.
      </p>

      <div className="mt-6 flex gap-3">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          type="password"
          className="flex-1 rounded border border-line bg-surface px-3 py-3 font-mono text-xs text-fg outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => load(key)}
          className="tap-target eyebrow rounded bg-accent px-4 text-accent-ink"
        >
          LOAD
        </button>
      </div>
      {error ? <p className="mt-3 text-xs text-coach">{error}</p> : null}

      {reports && !reports.length ? (
        <p className="mt-6 rounded border border-line bg-bg-elev px-4 py-3 text-sm text-muted">
          Nothing outstanding.
        </p>
      ) : null}

      {reports?.length ? (
        <ul className="mt-6 flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded border border-line bg-surface p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="eyebrow text-coach">{LABEL[r.reason] ?? r.reason}</span>
                <span className="text-xs text-muted">{r.created_at.slice(0, 10)}</span>
              </div>
              {r.card ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {r.card.lines.map((l) => (
                    <li key={l.pt} className="text-sm">
                      <span className="pt">{l.pt}</span>
                      <span className="ml-2 text-xs text-muted">{l.en}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">The card has gone.</p>
              )}
              <button
                type="button"
                onClick={() => done(r.id)}
                className="tap-target eyebrow mt-3 rounded border border-line px-4 py-3 text-muted"
              >
                MARK READ
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  )
}
