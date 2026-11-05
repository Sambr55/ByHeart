'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PageShell } from '@/components/PageShell'
import { useVenues } from '@/components/city/useVenues'
import type { DRAW_TERMS, HOLIDAY_PRIZE } from '@/content/board'

/**
 * THE PRIZE DRAW, explained, with the free way in (2026-11-05). Every finished board is an
 * entry, and saying it at every place on that board is another. Some rooms are for members,
 * so there is also one free entry a month for anybody — a draw you could only enter by paying
 * would be a lottery. Nothing here shows until PRIZE_DRAW is on AND the terms are approved.
 */
export function DrawPage({ live, terms, holiday }: { live: boolean; terms: typeof DRAW_TERMS; holiday: typeof HOLIDAY_PRIZE }) {
  const v = useVenues()
  const [msg, setMsg] = useState<string | null>(null)
  if (!live || !terms)
    return (
      <PageShell eyebrow="PRIZE DRAW" back="/club" backLabel="PATH">
        <p className="text-base" data-testid="draw-off">There’s no prize draw running right now.</p>
      </PageShell>
    )
  return (
    <PageShell eyebrow="PRIZE DRAW" back="/club" backLabel="PATH">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-bg-elev px-5 py-6" data-testid="draw-live">
        <h1 className="display text-2xl">Finish a board, go in the draw.</h1>
        <p className="text-base leading-relaxed">{terms.prizes}</p>
        {holiday ? <p className="text-base font-semibold">{holiday.title}</p> : null}
        <p className="text-sm leading-relaxed text-muted">
          One entry for every board you finish, and one more when you’ve said it at every place on it. Closes {terms.closes}. Run by {terms.promoter}.
        </p>
        {v.signedIn ? (
          <button
            type="button"
            className="tap-target eyebrow rounded-full border border-accent px-6 py-3 text-accent"
            onClick={async () => {
              const j = await fetch('/api/draw', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ free: true }) })
                .then((r) => r.json())
                .catch(() => ({}))
              setMsg(j.result === 'in' ? 'You’re in this month’s draw.' : 'That didn’t work. Try again later.')
            }}
          >
            Enter free this month
          </button>
        ) : (
          <Link href="/signin?next=%2Fdraw" className="tap-target eyebrow rounded-full bg-accent px-6 py-3 text-center text-accent-ink">
            Sign in to enter
          </Link>
        )}
        {msg ? <p className="text-sm">{msg}</p> : null}
        <p className="whitespace-pre-line text-xs leading-relaxed text-muted">{terms.body}</p>
      </div>
    </PageShell>
  )
}
