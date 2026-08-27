'use client'

import { useEffect, useState } from 'react'
import { SHOWING_COPY } from '@/content/showing-copy'
import { track } from '@/engine/analytics'

interface Mine {
  id: string
  sent: boolean
  returned: boolean
}

/**
 * Show this to somebody, and the ones you have.
 *
 * Sits under the public share button rather than replacing it, because they are two
 * different acts. SHARE THIS puts a card somewhere anybody can see it; this makes a link
 * addressed to one person, which is the only kind that can be shown back.
 *
 * The list underneath is a list and never a number. There is no count of who has shown
 * you anything — that is a score with extra steps, and the entire product exists because
 * scores are the wrong fuel.
 */
export function ShowThis({ mint }: { mint: () => Promise<string | null> }) {
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [mine, setMine] = useState<Mine[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetch('/api/showing')
      .then((r) => r.json())
      .then((b: { ok: boolean; showings?: Mine[] }) => {
        if (live && b.ok) setMine(b.showings ?? [])
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [link])

  async function make() {
    setBusy(true)
    setError(null)
    try {
      const cardId = await mint()
      if (!cardId) throw new Error('Could not make a card.')
      const res = await fetch('/api/showing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ card_id: cardId }),
      })
      const body = (await res.json()) as { ok: boolean; path?: string; reason?: string }
      if (!body.ok || !body.path) throw new Error(body.reason ?? 'Could not make a link.')
      const full = window.location.origin + body.path
      setLink(full)
      track('showing_sent', {})
      // Straight into the share sheet: the link is worthless sitting on this screen, and
      // the whole act is handing it to one specific person.
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: 'DUB', text: SHOWING_COPY.sent_head, url: full })
        } catch {
          // Dismissed. The link is on screen either way.
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not make a link.')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        data-testid="show-somebody"
        onClick={make}
        disabled={busy}
        className="tap-target w-full rounded-full border border-line-strong px-5 py-3 text-xs tracking-widest disabled:opacity-60"
      >
        {busy ? SHOWING_COPY.sending : SHOWING_COPY.send_label}
      </button>
      <p className="text-center text-xs leading-relaxed text-muted">{SHOWING_COPY.send_note}</p>
      {error ? <p className="text-center text-sm text-telha">{error}</p> : null}

      {link ? (
        <div className="rounded border border-line bg-bg-elev px-4 py-3">
          <p className="display text-base">{SHOWING_COPY.sent_head}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{SHOWING_COPY.sent_body}</p>
          <button
            type="button"
            onClick={copy}
            className="tap-target eyebrow mt-3 w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
          >
            {copied ? SHOWING_COPY.copied : SHOWING_COPY.copy}
          </button>
        </div>
      ) : null}

      {mine.length ? (
        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className="eyebrow text-muted">{SHOWING_COPY.mine_label}</p>
          <ul className="flex flex-col">
            {mine.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between gap-3 border-b border-line/60 py-3">
                <span className="min-w-0 text-sm text-muted">
                  {m.returned
                    ? m.sent
                      ? SHOWING_COPY.mine_returned
                      : SHOWING_COPY.mine_received
                    : SHOWING_COPY.mine_waiting}
                </span>
                <a href={'/s/' + m.id} className="eyebrow shrink-0 text-accent">
                  {SHOWING_COPY.mine_open}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
