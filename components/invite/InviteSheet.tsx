'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { INVITE } from '@/content/invite'
import { useInvites } from './useInvites'

/**
 * CONVIDA UM AMIGO, as a sheet over the board (Sam, 2026-11-05: "link to a modal overlay
 * rather than deep link to the Yours page where it gets lost").
 *
 * The card in the middle of the board used to send people to /profile#people, the foot of
 * a long screen, where the ask sat under everything else they own. Now the ask happens
 * where they tapped: the line in Portuguese, one button to the share sheet, the people
 * already asked, and what it earns — last and small, as on Yours (content/invite.ts).
 *
 * On document.body like the board's StopSheet, so the bottom nav never covers it.
 */
export function InviteSheet({ onClose }: { onClose: () => void }) {
  const { invites, busy, note, link, bring } = useInvites('board')
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const s = INVITE.sheet
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" data-testid="invite-sheet">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-sheet-title"
        className="sheet-up relative flex max-h-[88svh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-3xl bg-bg-elev px-5 pt-4 text-fg"
        style={{ paddingBottom: 'calc(2rem + var(--safe-bottom, 0px))' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p lang="pt-PT" className="eyebrow pt text-accent">
              {s.eyebrow}
            </p>
            <h2 id="invite-sheet-title" className="display text-balance text-2xl">
              {s.title}
            </h2>
          </div>
          <button ref={close} type="button" onClick={onClose} className="tap-target eyebrow shrink-0 rounded-full border border-line px-3 py-1 text-muted">
            Close
          </button>
        </div>

        <p className="text-base leading-relaxed text-muted">{s.body}</p>

        {/* The ask, to say as well as send. */}
        <div className="flex flex-col gap-1 rounded-2xl border border-line bg-surface px-4 py-3">
          <p lang="pt-PT" className="pt text-lg font-semibold text-accent" data-testid="invite-sheet-line">
            “{s.line.pt}”
          </p>
          <p className="text-sm text-muted">{s.line.en}</p>
        </div>

        <button
          type="button"
          data-testid="invite-sheet-bring"
          onClick={bring}
          disabled={busy}
          className="tap-target eyebrow block w-full rounded-full bg-accent px-6 py-3 text-center text-accent-ink disabled:opacity-60"
        >
          {busy ? 'MAKING A LINK' : INVITE.cta}
        </button>

        {link && note ? (
          <p className="break-all rounded-xl border border-line bg-surface px-3 py-2 text-xs text-muted" data-testid="invite-sheet-link">
            {note} {link}
          </p>
        ) : note ? (
          <p className="text-xs text-muted" role="status">
            {note}
          </p>
        ) : null}

        {/* A list and never a count, as on Yours. */}
        {invites?.length ? (
          <ul className="flex flex-col gap-1" data-testid="invite-sheet-list">
            {invites.slice(0, 5).map((i) => (
              <li
                key={i.code}
                className={
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ' +
                  (i.landed_at ? 'border-accent bg-accent/10' : 'border-line bg-surface')
                }
              >
                <span>{i.landed_at ? INVITE.state.landed : i.accepted_at ? INVITE.state.accepted : INVITE.state.waiting}</span>
                <span className={'eyebrow shrink-0 ' + (i.landed_at ? 'text-accent' : 'text-muted')}>
                  {i.landed_at ? 'LANDED' : i.accepted_at ? 'STARTED' : 'SENT'}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-xs leading-relaxed text-muted">{INVITE.reward}</p>

        <Link href="/profile#people" onClick={onClose} className="eyebrow text-center text-muted underline-offset-2 hover:underline">
          {s.all} →
        </Link>
      </div>
    </div>,
    document.body,
  )
}
