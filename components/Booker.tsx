'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_CHAPTER } from '@/content/chapters'
import { DEFAULT_PAIR } from '@/content/pairs'
import { GOAL_QUESTION } from '@/content/profile'
import { track } from '@/engine/analytics'
import { resetLearnerCache, setChapter, setCompany, setProfile, setPurpose, setWhenHere } from '@/engine/learner'
import { setPair } from '@/engine/pair'
import { useLearner } from '@/engine/useLearner'

/**
 * THE BOOKER — set-up as an airline search (Sam, 2026-11-03: "This card needs to be removed
 * on the way in and replaced with the 'airline' booker which needs to be majorly sexed up so
 * it feels more like an airline booker with some sort of animation like a plane flying left
 * to right").
 *
 * One boarding pass: EN → LIS, the reason for travel, the dates, who with. The same three
 * things the website's header asks (dub-site components/BookingBar.tsx), so somebody who
 * filled that in arrives with this answered and skips it. "Find my route" flies the plane
 * across the arc, then hands on. Reduced motion gets the stamp without the flight.
 *
 * The reasons are GOAL_QUESTION's, unchanged, so purpose routing is exactly what it was:
 * trip → visiting; someone, work → staying; moving → moving; just because → none.
 */
const REASON_LABEL: Record<string, { label: string; icon: string }> = {
  trip: { label: 'A trip', icon: 'M2 16l20-6-20-6v5l14 1-14 1z' },
  someone: { label: 'Someone I love', icon: 'M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z' },
  moving: { label: 'Moving there', icon: 'M3 11l9-7 9 7v9h-6v-6H9v6H3z' },
  work: { label: 'Work', icon: 'M4 8h16v11H4zM9 8V5h6v3' },
  curious: { label: 'Just because', icon: 'M12 3l2.5 6 6.5.5-5 4.3 1.6 6.2L12 16.6 6.4 20l1.6-6.2-5-4.3L9.5 9z' },
}

const COMPANY = [
  { id: 'solo', label: 'Just me' },
  { id: 'partner', label: 'Partner' },
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'work', label: 'Colleagues' },
] as const
type Company = (typeof COMPANY)[number]['id']

const iso = (d: Date) => d.toISOString().slice(0, 10)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/* The arc the plane flies, in the 320×90 box of the route strip. */
const ARC = 'M 34 70 Q 160 -18 286 70'

export function Booker({ onDone }: { onDone: () => void }) {
  const learner = useLearner()
  const [reason, setReason] = useState<string>(learner.profile?.goal ?? 'trip')
  const [from, setFrom] = useState(learner.profile?.here_from ?? '')
  const [to, setTo] = useState(learner.profile?.here_to ?? '')
  const [company, pick] = useState<Company | null>((learner.profile?.company as Company | undefined) ?? null)
  const [flying, setFlying] = useState(false)
  const route = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState(false)
  useEffect(() => setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches), [])
  /*
    THE ROUTE IS AT THE TOP OF THE PASS, and the button is at the bottom, so bring the route
    into view for the flight. After the re-render rather than in the tap: called inside the
    handler, the scroll was cancelled by the button turning disabled under the finger.
  */
  useEffect(() => {
    if (!flying) return
    const id = requestAnimationFrame(() => route.current?.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' }))
    return () => cancelAnimationFrame(id)
  }, [flying, still])

  const option = GOAL_QUESTION.options.find((o) => o.id === reason)
  const moving = option?.purpose === 'moving'
  const today = iso(new Date())

  const book = () => {
    if (flying || !option) return
    setPair(DEFAULT_PAIR)
    resetLearnerCache()
    setChapter(DEFAULT_CHAPTER)
    if (option.purpose) setPurpose(option.purpose)
    setProfile('goal', option.id)
    if (from) setWhenHere({ from, to: moving ? null : to && to >= from ? to : null })
    else setWhenHere({ unknown: true })
    if (company) setCompany(company)
    track('chapter_chosen', { chapter: DEFAULT_CHAPTER, locale: DEFAULT_PAIR.target_locale })
    track('purpose_chosen', { purpose: option.purpose ?? 'none', goal: option.id, via: 'booker' })
    track('trip_set', { dates: Boolean(from), company: company ?? 'none', via: 'booker' })
    setFlying(true)
    window.setTimeout(onDone, still ? 600 : 2600)
  }

  return (
    <div data-testid="booker" className="booker -mx-5 -mt-6 min-h-svh px-5 pb-10 pt-8 text-white">
      <p className="eyebrow text-white/60">DUB · Departures</p>
      <h1 className="display mt-2 text-3xl leading-tight">Where are we taking you?</h1>
      <p className="mt-2 text-sm text-white/70">Tell us like you would an airline. We build your path around it.</p>

      {/* THE BOARDING PASS */}
      <div ref={route} className="booker-pass mt-6 scroll-mt-4 overflow-hidden rounded-3xl bg-[#fbf8f2] text-[#14243a] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
        <div className="relative px-5 pb-3 pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow text-[0.6rem] text-[#14243a]/50">From</p>
              <p className="display text-4xl leading-none tracking-tight">EN</p>
              <p className="text-xs text-[#14243a]/60">English</p>
            </div>
            <div className="text-right">
              <p className="eyebrow text-[0.6rem] text-[#14243a]/50">To</p>
              <p className="display text-4xl leading-none tracking-tight text-[#1f5c8f]">LIS</p>
              <p className="text-xs text-[#14243a]/60">Lisboa · Português</p>
            </div>
          </div>
          {/* The route, and the plane on it. */}
          <svg viewBox="0 0 320 90" className="pointer-events-none -mt-6 h-20 w-full" aria-hidden="true">
            <path d={ARC} fill="none" stroke="#14243a" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
            <path d={ARC} fill="none" stroke="#1f5c8f" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className={'booker-trail ' + (flying ? 'is-flying' : '')} />
            <circle cx="34" cy="70" r="4" fill="#14243a" />
            <circle cx="286" cy="70" r="4" fill="#1f5c8f" />
            <g className={'booker-plane ' + (flying && !still ? 'is-flying' : '')} style={{ offsetPath: `path('${ARC}')` }}>
              <path d="M14 0 Q13 -1.6 10 -1.6 L2 -1.6 L-5 -10 L-8.5 -10 L-3 -1.6 L-10 -1.6 L-13 -5.5 L-15.5 -5.5 L-14 -1 L-14 1 L-15.5 5.5 L-13 5.5 L-10 1.6 L-3 1.6 L-8.5 10 L-5 10 L2 1.6 L10 1.6 Q13 1.6 14 0 Z" fill="#1f5c8f" />
            </g>
          </svg>
        </div>

        {/* The tear line. */}
        <div className="relative flex items-center" aria-hidden="true">
          <span className="absolute -left-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
          <span className="mx-4 h-px flex-1 border-t-2 border-dashed border-[#14243a]/15" />
          <span className="absolute -right-3 h-6 w-6 rounded-full bg-[#0f1f33]" />
        </div>

        <div className="flex flex-col gap-5 px-5 pb-6 pt-4">
          <fieldset>
            <legend className="eyebrow mb-2 text-[0.6rem] text-[#14243a]/50">Reason for travel</legend>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_QUESTION.options.map((o) => {
                const r = REASON_LABEL[o.id] ?? { label: o.label, icon: '' }
                const on = reason === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    data-testid={'booker-why-' + o.id}
                    onClick={() => setReason(o.id)}
                    className={
                      'tap-target flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 text-center text-xs font-semibold transition ' +
                      (on ? 'border-[#1f5c8f] bg-[#1f5c8f] text-white' : 'border-[#14243a]/15 bg-white text-[#14243a]')
                    }
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d={r.icon} />
                    </svg>
                    {r.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className={'grid gap-2 ' + (moving ? 'grid-cols-1' : 'grid-cols-2')}>
            <DateField label={moving ? 'Moving' : 'Depart'} value={from} min={today} onChange={setFrom} testid="booker-from" />
            {moving ? null : <DateField label="Return" value={to} min={from || today} onChange={setTo} testid="booker-to" />}
          </div>

          <fieldset>
            <legend className="eyebrow mb-2 text-[0.6rem] text-[#14243a]/50">Travelling with</legend>
            <div className="flex flex-wrap gap-1.5">
              {COMPANY.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={company === c.id}
                  data-testid={'booker-with-' + c.id}
                  onClick={() => pick(company === c.id ? null : c.id)}
                  className={
                    'tap-target rounded-full border px-3 py-1.5 text-xs font-semibold transition ' +
                    (company === c.id ? 'border-[#1f5c8f] bg-[#1f5c8f] text-white' : 'border-[#14243a]/15 bg-white text-[#14243a]')
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* The stub: a barcode, and the stamp once it is booked. */}
        <div className="relative flex items-center justify-between bg-[#14243a] px-5 py-3 text-white">
          <span className="booker-barcode h-8 w-40" aria-hidden="true" />
          <span className={'eyebrow text-[0.65rem] text-white/70 transition-opacity ' + (flying ? 'opacity-0' : '')}>Gate 1 · Basics</span>
          {flying ? (
            <span className="booker-stamp eyebrow absolute right-4 top-1/2 -translate-y-1/2 rounded border-2 border-[#e5b04a] px-2 py-1 text-[0.7rem] text-[#e5b04a]">
              Booked
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        data-testid="booker-go"
        onClick={book}
        disabled={flying}
        className="tap-target eyebrow mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e5b04a] px-5 py-4 text-base text-[#14243a] shadow-[0_6px_0_0_rgba(0,0,0,0.35)] transition active:translate-y-[4px] active:shadow-none disabled:opacity-80"
      >
        {flying ? 'Finding your route…' : 'Find my route'}
        <svg viewBox="-16 -11 31 22" className="h-5 w-7" aria-hidden="true">
          <path d="M14 0 Q13 -1.6 10 -1.6 L2 -1.6 L-5 -10 L-8.5 -10 L-3 -1.6 L-10 -1.6 L-13 -5.5 L-15.5 -5.5 L-14 -1 L-14 1 L-15.5 5.5 L-13 5.5 L-10 1.6 L-3 1.6 L-8.5 10 L-5 10 L2 1.6 L10 1.6 Q13 1.6 14 0 Z" fill="currentColor" />
        </svg>
      </button>
      <p className="mt-3 text-center text-xs text-white/50">Dates and company are optional. Change any of it later in settings.</p>
    </div>
  )
}

function DateField({ label, value, min, onChange, testid }: { label: string; value: string; min: string; onChange: (v: string) => void; testid: string }) {
  const d = value ? new Date(value + 'T12:00:00Z') : null
  return (
    <label className="relative flex flex-col rounded-2xl border border-[#14243a]/15 bg-white px-3 py-2.5">
      <span className="eyebrow text-[0.6rem] text-[#14243a]/50">{label}</span>
      {d ? (
        <span className="flex items-baseline gap-1.5">
          <span className="display text-2xl leading-none">{d.getUTCDate()}</span>
          <span className="text-sm font-semibold">{MONTHS[d.getUTCMonth()]}</span>
          <span className="text-xs text-[#14243a]/50">{WEEKDAYS[d.getUTCDay()]}</span>
        </span>
      ) : (
        <span className="text-sm font-semibold text-[#14243a]/40">Add date</span>
      )}
      {/* The real input sits over the face, invisible, so the phone's own date picker opens. */}
      <input
        type="date"
        data-testid={testid}
        aria-label={label}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  )
}
