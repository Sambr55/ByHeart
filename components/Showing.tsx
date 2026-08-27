'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { SHOWING_COPY } from '@/content/showing-copy'
import { PIECES } from '@/content/roots'
import { showableLines } from '@/engine/showable'
import { track } from '@/engine/analytics'
import { useLearner } from '@/engine/useLearner'

/**
 * Showing one back, and the two things that have to exist before anybody sends one.
 *
 * The card being returned is minted here, on the device, from the same filter the proof
 * card publishes through — the recipient's sentences never existed on the server until
 * they decided to send them, and the Legend is excluded before anything leaves.
 */
export function Showing({ id, state }: { id: string; state: 'open' | 'paired' }) {
  const learner = useLearner()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(state === 'paired')
  const [error, setError] = useState<string | null>(null)

  /*
    The denominator for the only number that matters.

    "Returned" is the real measure — the difference between an artefact worth sending and
    a link that gets ignored — and it means nothing without knowing how many people opened
    one at all. Fired here rather than on the server so a preview fetch by a chat app does
    not count as a person looking.
  */
  useEffect(() => {
    if (state === 'open') track('showing_opened', {})
  }, [state])

  const lines = useMemo(() => showableLines(learner.proof ?? []), [learner.proof])
  const worlds = useMemo(() => {
    const set = new Set<string>()
    for (const pieceId of Object.keys(learner.inventory ?? {})) {
      const family = PIECES[pieceId]?.family
      if (family) set.add(family)
    }
    return set.size || 1
  }, [learner.inventory])

  async function showBack() {
    setBusy(true)
    setError(null)
    try {
      // Two steps on purpose: /api/share is the only thing that mints a card, so the cap
      // and the Legend filter live in exactly one place rather than in every caller.
      const minted = await fetch('/api/share', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          count: (learner.proof ?? []).length,
          worlds,
          lines: lines.map((l) => ({ pt: l.pt, en: l.en })),
        }),
      })
      const card = (await minted.json()) as { ok: boolean; id?: string; reason?: string }
      if (!card.ok || !card.id) throw new Error(card.reason ?? 'no card')

      const res = await fetch('/api/showing/return', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ showing_id: id, card_id: card.id }),
      })
      const body = (await res.json()) as { ok: boolean; reason?: string }
      if (!body.ok) throw new Error(body.reason ?? 'could not')
      track('showing_returned', {})
      setDone(true)
      // Server-rendered above, so the pair only appears after a reload.
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not show it back.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <section className="flex flex-col gap-3">
        <div className="rounded border border-line bg-bg-elev px-4 py-3">
          <p className="display text-base">{SHOWING_COPY.returned_head}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{SHOWING_COPY.returned_body}</p>
        </div>
        <Safety id={id} />
      </section>
    )
  }

  // Nothing cold yet: there is genuinely nothing to send, and offering the button anyway
  // would mint an empty card and fail at the far end.
  if (!lines.length) {
    return (
      <section className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-muted">{SHOWING_COPY.nothing_yet}</p>
        <Link
          href="/vibes"
          className="tap-target eyebrow rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          {SHOWING_COPY.nothing_cta}
        </Link>
        <Safety id={id} />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        data-testid="show-back"
        onClick={showBack}
        disabled={busy}
        className="tap-target eyebrow rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:opacity-60"
      >
        {busy ? SHOWING_COPY.returning : SHOWING_COPY.return_label}
      </button>
      <p className="text-xs leading-relaxed text-muted">{SHOWING_COPY.return_note}</p>
      {error ? <p className="text-sm text-telha">{error}</p> : null}
      <Safety id={id} />
    </section>
  )
}

/**
 * Report and block, shipped before the first showing is sent rather than after the first
 * time somebody needs them.
 *
 * Folded shut by default. A safety control that is the loudest thing on the page tells
 * everybody who opens an ordinary link from a friend that they should be worried.
 */
function Safety({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)

  async function report(reason: string) {
    await fetch('/api/showing/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ showing_id: id, reason }),
    })
    setSaid(SHOWING_COPY.reported)
  }

  async function block() {
    await fetch('/api/showing/block', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ showing_id: id }),
    })
    setBlocked(true)
  }

  if (blocked) {
    return (
      <div className="rounded border border-line bg-bg-elev px-4 py-3">
        <p className="display text-base">{SHOWING_COPY.blocked_head}</p>
        <p className="mt-1 text-sm text-muted">{SHOWING_COPY.blocked_body}</p>
      </div>
    )
  }

  return (
    <div className="border-t border-line pt-6">
      <button
        type="button"
        data-testid="safety"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="tap-target eyebrow text-muted"
      >
        {SHOWING_COPY.safety_label}
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          {said ? (
            <p className="text-sm text-muted">{said}</p>
          ) : (
            <>
              <p className="eyebrow text-muted">{SHOWING_COPY.report_label}</p>
              <div className="flex flex-wrap gap-3">
                {SHOWING_COPY.report_reasons.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    data-testid={'report-' + r.id}
                    onClick={() => report(r.id)}
                    className="tap-target rounded border border-line px-3 py-3 text-xs text-muted"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            data-testid="block"
            onClick={block}
            className="tap-target eyebrow rounded border border-line-strong px-5 py-3 text-telha"
          >
            {SHOWING_COPY.block_label}
          </button>
          <p className="text-xs leading-relaxed text-muted">{SHOWING_COPY.block_note}</p>
        </div>
      ) : null}
    </div>
  )
}
