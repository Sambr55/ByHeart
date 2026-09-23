'use client'

import { useState } from 'react'
import { GENRES, type Genre } from '@/content/calendar'
import { track } from '@/engine/analytics'
import { setGenres } from '@/engine/learner'
import { useLearner } from '@/engine/useLearner'

/**
 * Put what is on into the calendar somebody already looks at.
 *
 * THE ARGUMENT FOR THIS BEING A SUBSCRIPTION rather than a notification is in lib/ics.ts:
 * a push arrives once and is gone, a calendar entry sits next to the things somebody has
 * actually decided to do. What matters here is that the ask is honest about it — this is
 * asking for space in somebody's diary, which is a bigger thing than a toggle, and the
 * screen should sound like it knows that.
 *
 * TWO QUESTIONS AND NO MORE. What do you care about, and how much is too much. Sam:
 * "selecting which type of drop events they are interested in and how many event drop
 * notifications they want to receive per week or month". Anything else — reminders,
 * times, per-venue rules — is a settings page, and a settings page is where a feature
 * like this goes to be abandoned before it is switched on.
 *
 * NOTHING SELECTED MEANS EVERYTHING, which is the opposite of the usual default and the
 * right one here: somebody who taps subscribe without opening the filters has asked for
 * "what is on", not for nothing. An empty calendar would read as broken.
 */
export function Subscribe({ city }: { city: string }) {
  /*
    Seeded from the learner rather than starting blank.

    The choice is stored now — see setGenres — so somebody returning to this page should
    find their answer still ticked. It was useState from empty, which lost the preference
    on every unmount and made the page look like it had forgotten them.
  */
  const learner = useLearner()
  const [picked, setPicked] = useState<Genre[]>(
    ((learner.profile?.genres ?? []) as Genre[]).filter((g) => GENRES.some((x) => x.id === g)),
  )
  const [perWeek, setPerWeek] = useState(3)
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  const toggle = (g: Genre) =>
    setPicked((p) => {
      const next = p.includes(g) ? p.filter((x) => x !== g) : [...p, g]
      /*
        Written on the tap rather than on submit, because the Club reads it and somebody
        may never press the button. The .ics feed needs the POST; the feed they are
        standing in does not.
      */
      setGenres(next)
      return next
    })

  const subscribe = async () => {
    setBusy(true)
    setFailed(null)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ genres: picked, perWeek }),
      })
      const body = (await res.json()) as { ok: boolean; subscribe?: string; reason?: string }
      if (!body.ok || !body.subscribe) {
        setFailed(body.reason ?? 'That did not work. Try again in a moment.')
        return
      }
      track('calendar_subscribed', { genres: picked.length, per_week: perWeek })
      setLink(body.subscribe)
      /*
        webcal:// is what makes a phone OFFER TO SUBSCRIBE rather than download a file
        once. Same URL, and the scheme is the whole difference between a calendar that
        keeps up and a snapshot of today that never changes again.
      */
      window.location.href = body.subscribe
    } catch {
      setFailed('That did not work. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section data-testid="subscribe" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="eyebrow min-w-0 text-accent">YOUR CALENDAR</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="text-sm leading-relaxed text-muted">
        Put what is on in {city} into the calendar you already look at. Tap one and it opens
        the Portuguese for being there.
      </p>

      {/*
        The genres, as things somebody wants rather than as a taxonomy. Each one wears its
        own colour when chosen, which is the same colour it has on the grid above — so the
        filter and the calendar are visibly the same idea.
      */}
      <ul className="flex flex-wrap gap-1">
        {GENRES.map((g) => {
          const on = picked.includes(g.id)
          return (
            <li key={g.id}>
              <button
                type="button"
                data-testid={'genre-' + g.id}
                aria-pressed={on}
                onClick={() => toggle(g.id)}
                className={
                  'tap-target rounded border px-3 py-1 text-xs transition ' +
                  (on ? 'border-transparent text-white' : 'border-line text-muted')
                }
                style={on ? { backgroundColor: g.colour } : undefined}
              >
                {g.label}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        {picked.length ? 'Only these.' : 'Nothing chosen, so everything.'}
      </p>

      {/*
        HOW MUCH IS TOO MUCH, asked in the unit the cap is enforced in.

        A calendar is somebody's own space and the fastest way to lose it is to fill it, so
        this is a real limit rather than a preference: lib/ics.ts trims week by week and
        keeps the soonest. Three is the default because it is about one thing every other
        evening, which is a full week without being a busy one.
      */}
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 text-sm">At most, a week</span>
        <div className="flex shrink-0 gap-1">
          {[1, 3, 7].map((n) => (
            <button
              key={n}
              type="button"
              data-testid={'perweek-' + n}
              aria-pressed={perWeek === n}
              onClick={() => setPerWeek(n)}
              className={
                'tap-target rounded border px-3 py-1 text-sm tabular-nums transition ' +
                (perWeek === n ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        data-testid="subscribe-go"
        disabled={busy}
        onClick={subscribe}
        className="tap-target eyebrow w-full rounded bg-accent px-5 py-3 text-center text-accent-ink disabled:opacity-60"
      >
        {busy ? 'ONE MOMENT' : 'ADD TO MY CALENDAR'}
      </button>

      {failed ? <p className="text-xs leading-relaxed text-accent">{failed}</p> : null}
      {link ? (
        /*
          The address, for the case the handoff did not take. webcal:// is handled by the
          operating system and a browser that does not know it does nothing visible at all
          — so the link stays on screen rather than leaving somebody looking at a button
          that appeared to do nothing.
        */
        <p className="text-xs leading-relaxed text-muted">
          If nothing happened, your calendar app can subscribe to this address:{' '}
          <span className="break-all text-fg">{link}</span>
        </p>
      ) : null}
    </section>
  )
}
