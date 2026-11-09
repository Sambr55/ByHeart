'use client'

import { Ground } from '@/components/Native'

import { useEffect, useRef, useState } from 'react'
import { chapterById, type ChapterId } from '@/content/chapters'
import { cityReady } from '@/content/gems'
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

/*
  THE ROUTES (Sam, 2026-11-03: "It now seems to be hard coded EN > LIS"). The same languages
  and cities the website's booker offers (dub-site content/routes.ts, markets.ts): English to
  Lisbon is open; every other pair says when, and takes an email for the day it opens —
  the app's own /api/waitlist, noted with the route, as the website does.
*/
const FROM = [
  { code: 'EN', name: 'English', native: 'English', open: true },
  { code: 'PT', name: 'Portuguese', native: 'Português', open: false },
  { code: 'ES', name: 'Spanish', native: 'Español', open: false },
  { code: 'DE', name: 'German', native: 'Deutsch', open: false },
  { code: 'FR', name: 'French', native: 'Français', open: false },
] as const
/*
  SINTRA & CASCAIS (Sam, 2026-11-05: "consolidate Cascais and Sintra into one 'City'"). One
  more Portuguese destination beside Lisbon — two towns, the hills and the sea, one line on
  the pass. The same language and every room shared; its own places, walks and venues
  (content/towns/). It boards once it has places a person has checked (cityReady), so on the
  live app it says "coming soon" until then.
*/
/*
  Whether a town boards is asked when the pass is DRAWN, not when this file loads: turning
  drafts on in Settings (content/gems.ts draftsOn) has to open it on the next screen.
*/
const boarding = (t: { open: boolean; town: string | null }) => t.open && (!t.town || cityReady(t.town as ChapterId))

const TO = [
  { code: 'LIS', id: 'lisbon', city: 'Lisboa', lang: 'Português', speaks: 'PT', open: true, town: null },
  { code: 'SCS', id: 'sintra-cascais', city: 'Sintra & Cascais', lang: 'Português · hills & sea', speaks: 'PT', open: true, town: 'sintra-cascais' },
  { code: 'MAD', id: 'madrid', city: 'Madrid', lang: 'Español', speaks: 'ES', open: false, town: null },
  { code: 'BER', id: 'berlin', city: 'Berlin', lang: 'Deutsch', speaks: 'DE', open: false, town: null },
  { code: 'PAR', id: 'paris', city: 'Paris', lang: 'Français', speaks: 'FR', open: false, town: null },
  { code: 'LON', id: 'london', city: 'London', lang: 'English', speaks: 'EN', open: false, town: null },
] as const
type FromCode = (typeof FROM)[number]['code']
type ToCode = (typeof TO)[number]['code']

/* The arc the plane flies, in the 320×90 box of the route strip. */
const ARC = 'M 34 70 Q 160 -18 286 70'

export function Booker({ onDone }: { onDone: () => void }) {
  const learner = useLearner()
  const [reason, setReason] = useState<string>(learner.profile?.goal ?? 'trip')
  const [from, setFrom] = useState(learner.profile?.here_from ?? '')
  const [to, setTo] = useState(learner.profile?.here_to ?? '')
  const [company, pick] = useState<Company | null>((learner.profile?.company as Company | undefined) ?? null)
  const [flying, setFlying] = useState(false)
  const [fromLang, setFromLang] = useState<FromCode>('EN')
  /* Starts on the city already chosen, when there is one — changing it in settings comes back here. */
  const [dest, setDest] = useState<ToCode>(() => (TO.find((t) => t.id === learner.chapter)?.code ?? 'LIS') as ToCode)
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)
  const origin = FROM.find((f) => f.code === fromLang)!
  const place = TO.find((t) => t.code === dest)!
  /* Open only where both ends are: English speakers, to Lisbon — today. */
  const routeOpen = origin.open && boarding(place)
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
    /* The destination IS the chapter for the Portuguese ones; anything else never reaches here (routeOpen). */
    const chapter = chapterById(place.id as ChapterId).id
    setChapter(chapter)
    if (option.purpose) setPurpose(option.purpose)
    setProfile('goal', option.id)
    if (from) setWhenHere({ from, to: moving ? null : to && to >= from ? to : null })
    else setWhenHere({ unknown: true })
    if (company) setCompany(company)
    track('chapter_chosen', { chapter, locale: DEFAULT_PAIR.target_locale })
    track('purpose_chosen', { purpose: option.purpose ?? 'none', goal: option.id, via: 'booker' })
    track('trip_set', { dates: Boolean(from), company: company ?? 'none', via: 'booker' })
    setFlying(true)
    window.setTimeout(onDone, still ? 600 : 2600)
  }

  return (
    /*
      THE NOTCH (Sam, 2026-11-09: "fix the top of screen 2 (behind clock)"). The card is pulled
      up to the screen's edge so the blue runs behind the status bar, and nothing then made room
      for the clock — "DUB · Departures" sat under 19:22. The inset is added to the padding, not
      as .safe-top: that is a margin and would undo the -mt-6 that takes the blue to the edge.
    */
    <div
      data-testid="booker"
      className="booker -mx-5 -mt-6 min-h-svh px-5 pb-10 text-white"
      style={{ paddingTop: 'calc(2rem + var(--safe-top, env(safe-area-inset-top, 0px)))' }}
    >
      {/* The strip under the page, this navy rather than the root's own — components/Native.tsx. */}
      <Ground color="#0f1f33" />
      <p className="eyebrow text-white/60">DUB · Departures</p>
      <h1 className="display mt-2 text-3xl leading-tight">Where are we taking you?</h1>
      <p className="mt-2 text-sm text-white/70">Tell us like you would an airline. We build your path around it.</p>

      {/* THE BOARDING PASS */}
      <div ref={route} className="booker-pass mt-6 scroll-mt-4 overflow-hidden rounded-3xl bg-[#fbf8f2] text-[#14243a] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]">
        <div className="relative px-5 pb-3 pt-5">
          <div className="relative z-10 flex items-start justify-between">
            <button type="button" data-testid="booker-pick-from" onClick={() => setPicking('from')} disabled={flying} className="tap-target -m-2 rounded-2xl p-2 text-left transition hover:bg-[#14243a]/5" aria-label={'From ' + origin.name + ' — change'}>
              <span className="eyebrow block text-[0.6rem] text-[#14243a]/50">From ▾</span>
              <span className="display block text-4xl leading-none tracking-tight">{origin.code}</span>
              <span className="block text-xs text-[#14243a]/60">{origin.native}</span>
            </button>
            <button type="button" data-testid="booker-pick-to" onClick={() => setPicking('to')} disabled={flying} className="tap-target -m-2 rounded-2xl p-2 text-right transition hover:bg-[#14243a]/5" aria-label={'To ' + place.city + ' — change'}>
              <span className="eyebrow block text-[0.6rem] text-[#14243a]/50">To ▾</span>
              <span className="display block text-4xl leading-none tracking-tight text-[#1f5c8f]">{place.code}</span>
              <span className="block text-xs text-[#14243a]/60">{place.city} · {place.lang}</span>
            </button>
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

        {routeOpen ? null : <Soon origin={origin.name} city={place.city} lang={place.lang} route={origin.code + '>' + place.id} />}
        <div className={'flex flex-col gap-5 px-5 pb-6 pt-4 ' + (routeOpen ? '' : 'hidden')}>
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

      {picking ? (
        <RoutePicker
          which={picking}
          from={fromLang}
          to={dest}
          onPick={(code) => {
            if (picking === 'from') setFromLang(code as FromCode)
            else setDest(code as ToCode)
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      ) : null}

      {routeOpen ? (
      <>
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
      </>
      ) : (
        <button
          type="button"
          onClick={() => {
            setFromLang('EN')
            setDest('LIS')
          }}
          className="mt-6 w-full text-center text-sm text-white/70 underline underline-offset-4"
        >
          Or start with English → Lisboa, open now
        </button>
      )}
    </div>
  )
}

/** The departures board: choose where you are from, or where you are going. */
function RoutePicker({
  which,
  from,
  to,
  onPick,
  onClose,
}: {
  which: 'from' | 'to'
  from: FromCode
  to: ToCode
  onPick: (code: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  const rows =
    which === 'from'
      ? FROM.map((f) => ({ code: f.code, title: f.native, sub: f.name === f.native ? '' : f.name, open: f.open, same: false }))
      : TO.map((t) => ({ code: t.code, title: t.city, sub: t.lang, open: boarding(t), same: t.speaks === from }))
  const current = which === 'from' ? from : to
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={which === 'from' ? 'You speak' : 'Where to'}
        data-testid="booker-picker"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise w-full max-w-md rounded-t-3xl bg-[#0f1f33] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] text-white sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <p className="eyebrow text-white/60">{which === 'from' ? 'Departures · you speak' : 'Arrivals · where to'}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            ✕
          </button>
        </div>
        <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5">
          {rows.map((r) => (
            <li key={r.code}>
              <button
                type="button"
                disabled={r.same}
                data-testid={'booker-option-' + r.code}
                onClick={() => onPick(r.code)}
                className={'tap-target flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-white/5 disabled:opacity-35 ' + (current === r.code ? 'bg-white/10' : '')}
              >
                <span className="display w-14 text-2xl leading-none tracking-tight text-[#9cc6ea]">{r.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.title}</span>
                  {r.sub ? <span className="block text-xs text-white/60">{r.sub}</span> : null}
                </span>
                <span
                  className={
                    'eyebrow shrink-0 rounded px-2 py-1 text-[0.6rem] ' +
                    (r.same ? 'text-white/50' : r.open ? 'bg-[#2c6b4a] text-white' : 'bg-[#e5b04a]/15 text-[#e5b04a]')
                  }
                >
                  {r.same ? 'Your language' : r.open ? 'Boarding' : 'Coming soon'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * A ROUTE THAT IS NOT OPEN YET, said like a departures board says it, with the one useful
 * thing to do: leave an email for the day it opens. Posted to the app's /api/waitlist with
 * the route in the note, the same shape the website sends.
 */
function Soon({ origin, city, lang, route }: { origin: string; city: string; lang: string; route: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  useEffect(() => setState('idle'), [route])
  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState('error')
    setState('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), note: 'route:' + route + '; via:app-booker' }),
      })
      setState(res.ok ? 'done' : 'error')
      track('waitlist_joined', { route, via: 'booker' })
    } catch {
      setState('error')
    }
  }
  return (
    <div data-testid="booker-soon" className="flex flex-col gap-3 px-5 pb-6 pt-4">
      <p className="eyebrow self-start rounded bg-[#e5b04a]/20 px-2 py-1 text-[0.6rem] text-[#9a6b12]">Coming soon</p>
      <p className="display text-2xl leading-tight">
        {city} {origin === 'English' ? '' : 'for ' + origin + ' speakers '}is not boarding yet.
      </p>
      <p className="text-sm text-[#14243a]/65">
        {lang.startsWith('Português')
          ? 'Somebody who knows ' + city + ' is checking its places before it opens. Leave your email and we will tell you the day it does — nothing else.'
          : 'We are building ' + lang + ' the way we built Portuguese for Lisbon. Leave your email and we will tell you the day it opens — nothing else.'}
      </p>
      {state === 'done' ? (
        <p className="rounded-2xl bg-[#2c6b4a]/10 px-4 py-3 text-sm font-semibold text-[#2c6b4a]">You are on the list for {city}.</p>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Your email"
            className="tap-target min-w-0 flex-1 rounded-2xl border border-[#14243a]/15 bg-white px-4 py-3 text-base text-[#14243a] focus:border-[#1f5c8f] focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={state === 'sending'}
            className="tap-target eyebrow shrink-0 rounded-2xl bg-[#14243a] px-4 text-xs text-white"
          >
            {state === 'sending' ? '…' : 'Tell me'}
          </button>
        </div>
      )}
      {state === 'error' ? <p className="text-xs text-[#b5523a]">That email did not go through. Check it and try again.</p> : null}
    </div>
  )
}

function DateField({ label, value, min, onChange, testid }: { label: string; value: string; min: string; onChange: (v: string) => void; testid: string }) {
  const d = value ? new Date(value + 'T12:00:00Z') : null
  const input = useRef<HTMLInputElement>(null)
  /*
    THE WHOLE BOX OPENS THE PICKER (Sam, 2026-11-03: "the depart and return dates aren't
    clickable"). An invisible date input laid over the face is ignored by iPhone Safari and
    by desktop Chrome away from its little calendar icon, so a tap on the box asks for the
    picker outright — showPicker() — and focuses the input where that is not available.
  */
  const open = () => {
    const el = input.current
    if (!el) return
    try {
      if (typeof el.showPicker === 'function') el.showPicker()
      else el.focus()
    } catch {
      el.focus()
    }
  }
  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={open}
      className="tap-target relative flex cursor-pointer flex-col rounded-2xl border border-[#14243a]/15 bg-white px-3 py-2.5 transition hover:border-[#1f5c8f]/50"
    >
      <span className="eyebrow text-[0.6rem] text-[#14243a]/50">{label}</span>
      {d ? (
        <span className="flex items-baseline gap-1.5">
          <span className="display text-2xl leading-none">{d.getUTCDate()}</span>
          <span className="text-sm font-semibold">{MONTHS[d.getUTCMonth()]}</span>
          <span className="text-xs text-[#14243a]/50">{WEEKDAYS[d.getUTCDay()]}</span>
        </span>
      ) : (
        <span className="text-sm font-semibold text-[#1f5c8f]">Add date</span>
      )}
      {/* The real input: over the box, invisible, 16px so iOS does not zoom, and reachable by keyboard. */}
      <input
        ref={input}
        type="date"
        data-testid={testid}
        aria-label={label}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none text-base opacity-0"
      />
    </div>
  )
}
