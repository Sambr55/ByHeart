'use client'

import { useState } from 'react'
import { setCompany, setWhenHere } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'
import { track } from '@/engine/analytics'

/**
 * WHEN, AND WHO WITH — the second line of the website's booking header, asked in set-up
 * the same way (Sam, 2026-11-03: "are we now following the flow as set out on the website —
 * airline style set-up …").
 *
 * The website asks why · when · who with; set-up now asks the same three, then the name.
 * Somebody who answered on the website arrives with these filled (engine/booking.ts) and
 * never sees this step. Everything is skippable: "Not sure yet" is an answer, the same one
 * the calendar's own card records (setWhenHere({ unknown: true })).
 *
 * The dates drive what's on (the On tab shows what happens while you are there); who with
 * is kept for the rooms and the Legend to use, and asks nothing more of anybody.
 */
const COMPANY = [
  { id: 'solo', label: 'Just me' },
  { id: 'partner', label: 'With a partner' },
  { id: 'family', label: 'With family' },
  { id: 'friends', label: 'With friends' },
  { id: 'work', label: 'For work' },
] as const
type Company = (typeof COMPANY)[number]['id']

const today = () => new Date().toISOString().slice(0, 10)

export function TripStep({ onDone }: { onDone: () => void }) {
  const learner = useLearner()
  const moving = learner.purpose === 'moving'
  const [from, setFrom] = useState(learner.profile?.here_from ?? '')
  const [to, setTo] = useState(learner.profile?.here_to ?? '')
  const [company, pick] = useState<Company | null>(learner.profile?.company ?? null)

  const go = (unknown = false) => {
    if (unknown || (!from && !to)) setWhenHere({ unknown: true })
    else setWhenHere({ from: from || null, to: moving ? null : to && to >= from ? to : null })
    if (company) setCompany(company)
    track('trip_set', { dates: Boolean(from), company: company ?? 'none', via: 'setup' })
    onDone()
  }

  const input =
    'tap-target w-full rounded border border-line bg-bg-elev px-3 py-3 text-base text-fg focus:border-accent focus:outline-none'

  return (
    <div data-testid="setup-trip" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="eyebrow text-accent">Your trip</p>
        <h2 className="display text-balance text-2xl">{moving ? 'When is the move?' : 'When are you there, and who with?'}</h2>
        <p className="text-sm leading-relaxed text-muted">
          So we can line up what is on while you are there — a gig, a match, a holiday that
          shuts the city — and the words for it.
        </p>
      </div>

      <div className={'grid gap-3 ' + (moving ? 'grid-cols-1' : 'grid-cols-2')}>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-muted">{moving ? 'Moving' : 'Arriving'}</span>
          <input type="date" data-testid="trip-from" min={today()} value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        {moving ? null : (
          <label className="flex flex-col gap-1">
            <span className="eyebrow text-muted">Leaving</span>
            <input type="date" data-testid="trip-to" min={from || today()} value={to} onChange={(e) => setTo(e.target.value)} className={input} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="eyebrow text-muted">Who with</p>
        <div className="flex flex-wrap gap-2">
          {COMPANY.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={company === c.id}
              data-testid={'trip-with-' + c.id}
              onClick={() => pick(company === c.id ? null : c.id)}
              className={
                'tap-target rounded-full border px-4 py-2 text-sm transition ' +
                (company === c.id ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-bg-elev text-fg')
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          type="button"
          data-testid="trip-go"
          onClick={() => go()}
          className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink"
        >
          CONTINUE
        </button>
        <button type="button" data-testid="trip-skip" onClick={() => go(true)} className="text-sm text-muted underline underline-offset-4">
          Not sure yet
        </button>
      </div>
    </div>
  )
}
