'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Back } from '@/components/Back'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { chapterById } from '@/content/chapters'
import type { Drop } from '@/content/drops'
import { dropLive, dropsInMonth } from '@/content/feed'
import { loadLearner } from '@/engine/learner'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Monday first, because Portugal's week does. */
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * What is on in your city this month.
 *
 * WHY A CALENDAR AND NOT A LIST. Drops already had a list — /drops, grouped into live,
 * coming and gone — and a list answers "what can I open right now". It cannot answer the
 * question somebody actually has in a city they are visiting, which is "what is happening
 * while I am here". That question has a shape, and the shape is a month.
 *
 * IT SHOWS THINGS THAT ARE NOT OPEN YET, which the feed must never do. A drop opens a few
 * weeks out so that a countdown means something; a gig ninety days away is not a drop yet.
 * But it is on, and the calendar exists to say what is on — telling somebody there is
 * nothing this month while a stadium show sits in the diary is the only way this screen
 * could really fail.
 *
 * TAPPING GOES WHERE THE LANGUAGE IS. Not to a description of the event: to the drop's own
 * card in the Club, opened, which is the same place a swipe right would have put them. A
 * calendar that ends in a paragraph about a concert is a listings site.
 */
export function Calendar() {
  /*
    The clock after mount, like every other date in this product.

    A month grid rendered on the server is a month grid in the server's timezone, and the
    highlighted day would flicker to a different one on hydration.
  */
  const [now, setNow] = useState<Date | null>(null)
  const [chapter, setChapter] = useState(chapterById(null))
  useEffect(() => {
    setNow(new Date())
    setChapter(chapterById(loadLearner().chapter))
  }, [])

  /** How many months forward or back of this one we are looking at. */
  const [offset, setOffset] = useState(0)

  const anchor = now ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)) : null
  const year = anchor?.getUTCFullYear() ?? 0
  const month = anchor?.getUTCMonth() ?? 0

  const drops = anchor ? dropsInMonth(chapter.id, year, month, now ?? undefined) : []

  /*
    Which days have something on, as a lookup rather than a search per cell.

    Thirty-one cells each scanning the month's drops is thirty-one scans of a list that is
    almost always shorter than the scan — correct, and the kind of thing that stops being
    correct the week a chapter has forty of them.
  */
  const byDay = new Map<number, Drop[]>()
  for (const d of drops) {
    const day = new Date(d.on + 'T00:00:00Z').getUTCDate()
    byDay.set(day, [...(byDay.get(day) ?? []), d])
  }

  const daysInMonth = anchor ? new Date(Date.UTC(year, month + 1, 0)).getUTCDate() : 0
  /* getUTCDay is Sunday-first; the grid is Monday-first, so Sunday becomes the seventh. */
  const firstWeekday = anchor ? (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7 : 0
  const today =
    now && now.getUTCFullYear() === year && now.getUTCMonth() === month ? now.getUTCDate() : null

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-30 flex items-center gap-3 px-5 py-3">
        <Back />
        <span className="eyebrow flex-1">{chapter.city}</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        <div>
          <h1 className="display text-balance text-2xl">What is on, while you are here.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Everything pegged to a date in {chapter.city}. Tap one and you land in the
            Portuguese for it — where it is, how to get there, how to ask somebody to come.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="cal-prev"
              aria-label="The month before"
              onClick={() => setOffset((o) => o - 1)}
              className="tap-target eyebrow rounded border border-line px-3 py-3"
            >
              ←
            </button>
            <h2 data-testid="cal-month" className="display min-w-0 flex-1 text-center text-lg">
              {anchor ? MONTHS[month] + ' ' + year : ' '}
            </h2>
            <button
              type="button"
              data-testid="cal-next"
              aria-label="The month after"
              onClick={() => setOffset((o) => o + 1)}
              className="tap-target eyebrow rounded border border-line px-3 py-3"
            >
              →
            </button>
          </div>

          <div aria-hidden className="grid grid-cols-7 gap-1">
            {DAYS.map((d, i) => (
              <span key={i} className="py-1 text-center text-[0.6rem] uppercase tracking-wider text-muted">
                {d}
              </span>
            ))}
          </div>

          <div data-testid="cal-grid" className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={'pad' + i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const on = byDay.get(day) ?? []
              const isToday = today === day
              /*
                A day with something on is a LINK; a day without is not a control at all.

                An empty square that responds to a tap and does nothing is the commonest way
                a calendar feels broken, and greying out thirty tappable things to make four
                stand out is the same mistake the shelf made with dimmed vibes.
              */
              if (!on.length) {
                return (
                  <span
                    key={day}
                    className={
                      'flex aspect-square items-center justify-center rounded text-sm tabular-nums ' +
                      (isToday ? 'border border-line-strong text-fg' : 'text-muted')
                    }
                  >
                    {day}
                  </span>
                )
              }
              return (
                <Link
                  key={day}
                  href={'/club?drop=' + on[0].id}
                  data-testid={'cal-day-' + day}
                  aria-label={on.map((d) => d.event).join(', ') + ' on the ' + day + 'th'}
                  className={
                    'tap-target flex aspect-square flex-col items-center justify-center rounded bg-accent text-sm tabular-nums text-accent-ink ' +
                    (isToday ? 'ring-1 ring-fg' : '')
                  }
                >
                  {day}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="eyebrow min-w-0 text-accent">
              {anchor ? MONTHS[month].toUpperCase() : ''}
            </h2>
            <span className="h-px flex-1 bg-line" />
            <span className="eyebrow shrink-0 tabular-nums text-muted">{drops.length}</span>
          </div>

          {!drops.length ? (
            <p className="rounded border border-line bg-bg-elev px-4 py-3 text-sm text-muted">
              Nothing pegged to a date this month. Try the month after — the big ones are
              usually in the diary long before they open.
            </p>
          ) : (
            drops.map((d) => {
              const on = new Date(d.on + 'T00:00:00Z')
              const open = now ? dropLive(d, now) : false
              return (
                <Link
                  key={d.id}
                  href={'/club?drop=' + d.id}
                  data-testid={'cal-drop-' + d.id}
                  className="tap-target flex items-start gap-3 rounded border border-line px-4 py-3 transition hover:border-accent/60"
                >
                  <span className="flex w-10 shrink-0 flex-col items-center">
                    <span className="display text-lg tabular-nums leading-none">
                      {on.getUTCDate()}
                    </span>
                    <span className="text-[0.55rem] uppercase tracking-wider text-muted">
                      {MONTHS[on.getUTCMonth()].slice(0, 3)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="display block text-base">{d.event}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {d.place.name} · {d.place.area}
                    </span>
                    {/*
                      What is inside it, which is the only reason to tap. A calendar row
                      naming an event and nothing else is a listing; this says what you get.
                    */}
                    <span className="mt-3 block text-xs leading-relaxed text-muted">
                      {d.situations.map((x) => x.title).join(' · ')}
                    </span>
                    {!open ? (
                      /* Honest about the one thing that would otherwise surprise them. */
                      <span className="mt-3 block text-[0.6rem] uppercase tracking-wider text-muted">
                        opens nearer the time
                      </span>
                    ) : null}
                  </span>
                </Link>
              )
            })
          )}
        </section>
      </div>

      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
