'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHECKIN_ERRORS, checkIn, useVenues } from './useVenues'
import { countLine, pairOffered } from '@/lib/venue-rules'
import { PAIR_REWARD, PAIR_WINDOW_H } from '@/content/board'

/**
 * I'M HERE — the check-in, on the venue card and the board's venue square (2026-11-05).
 *
 * The count is for everybody, partner or not ("37 DUB learners have said it here"); at a
 * partner it says how far off the next reward is. Checking in needs an account. At a
 * partner the better way is the card: ask for it in Portuguese, scan its QR with the camera.
 */
/** What a check-in that made a Bica a dois says. */
const PAIR_DONE = 'Boa! You’re both checked in — ' + PAIR_REWARD.name + ' is in your rewards.'

export function CheckIn({ gem }: { gem: string }) {
  const v = useVenues()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const count = v.counts[gem] ?? 0
  const partner = v.partners[gem] ?? null
  const been = v.mine.includes(gem)
  const next = typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search

  return (
    <div className="flex flex-col gap-2" data-testid="checkin">
      <p className="text-sm text-muted" data-testid="checkin-count">
        {count ? countLine(count, partner) : 'Be the first DUB learner to say it here.'}
      </p>
      {been ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-correct" data-testid="checkin-done">
          <span aria-hidden>✓</span> You’re checked in here.
          {partner ? (
            <Link href="/rewards" className="font-semibold text-accent">
              Your rewards →
            </Link>
          ) : null}
        </p>
      ) : !v.signedIn ? (
        <Link
          href={'/signin?next=' + encodeURIComponent(next)}
          className="tap-target eyebrow w-full rounded-2xl border border-accent/60 px-4 py-3 text-center text-accent"
          data-testid="checkin-signin"
        >
          Sign in to check in here
        </Link>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            setMsg(null)
            const r = await checkIn(gem)
            setBusy(false)
            setMsg(r.ok ? (r.pair ? PAIR_DONE : 'Boa! You’re checked in.') : CHECKIN_ERRORS[r.error])
          }}
          className="tap-target eyebrow w-full rounded-2xl border border-correct/50 bg-correct/5 px-4 py-3 text-center text-correct disabled:opacity-60"
          data-testid="checkin-here"
        >
          {busy ? 'Finding you…' : 'I’m here — check in'}
        </button>
      )}
      {partner && !been ? (
        <p className="text-xs leading-snug text-muted" data-testid="checkin-card-hint">
          A DUB venue: ask at the counter <span lang="pt-PT" className="pt font-semibold text-accent">“Tem o cartão DUB?”</span> and scan it with
          your camera.
        </p>
      ) : null}
      {pairOffered(partner) && !been ? (
        <p className="text-xs leading-snug text-muted" data-testid="checkin-pair-hint">
          <span lang="pt-PT" className="pt font-semibold text-accent">
            {PAIR_REWARD.name}
          </span>
          : come with the friend you brought to DUB and both check in within {PAIR_WINDOW_H} hours — {(partner?.pair_item?.trim() || PAIR_REWARD.fallback).replace(/^./, (c) => c.toLowerCase())}.
        </p>
      ) : null}
      {msg ? (
        <p className="text-sm" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  )
}
