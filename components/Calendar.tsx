'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GENRES, genreFor } from '@/content/calendar'
import { Back } from '@/components/Back'
import { Subscribe } from '@/components/Subscribe'
import { NotYet } from '@/components/NotYet'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { chapterById } from '@/content/chapters'
import type { Drop } from '@/content/drops'
import { dropLive, dropsInMonth, dropsInFortnight } from '@/content/feed'
import { loadLearner } from '@/engine/learner'
import { useClub } from '@/engine/useClub'

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
  const club = useClub()
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

  /*
    TWO WEEKS, NOT A MONTH — and the reason is that the month could not say anything.

    Thirty-one cells across a phone is about forty pixels a day: room for a number and a
    colour, and not for what is actually on. So the calendar could tell somebody that
    Tuesday had something and never what, which makes it a thing you tap to find out
    rather than a thing you read. Sam: "we will show a biweekly, rather than monthly view,
    this giving us space to actually name the Drop events in the calendar."

    Fourteen days is two rows of the same Monday-first seven, so the shape people already
    know is unchanged and every cell has room for a name.

    ANCHORED TO THIS MONDAY rather than to today, because a fortnight that starts on a
    Wednesday has no columns — the weekday headers would be lying, and "the week after
    next" stops being a thing anybody can point at.
  */
  const [offset, setOffset] = useState(0)

  const anchor = (() => {
    if (!now) return null
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    /* getUTCDay is Sunday-first; the grid is Monday-first. */
    const back = (new Date(midnight).getUTCDay() + 6) % 7
    return new Date(midnight - back * 86_400_000 + offset * 14 * 86_400_000)
  })()

  const drops = anchor ? dropsInFortnight(chapter.id, anchor, now ?? undefined) : []

  /*
    Which days have something on, as a lookup rather than a search per cell.

    Thirty-one cells each scanning the month's drops is thirty-one scans of a list that is
    almost always shorter than the scan — correct, and the kind of thing that stops being
    correct the week a chapter has forty of them.
  */
  /* Keyed by ISO date rather than day-of-month, because a fortnight crosses months. */
  const byDay = new Map<string, Drop[]>()
  for (const d of drops) byDay.set(d.on, [...(byDay.get(d.on) ?? []), d])

  const days = anchor
    ? Array.from({ length: 14 }, (_, i) => new Date(anchor.getTime() + i * 86_400_000))
    : []
  const todayIso = now
    ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
        .toISOString()
        .slice(0, 10)
    : null

  /* Only the genres actually on in this fortnight, so the key describes what is on the
     screen rather than advertising a taxonomy. */
  const keyed = GENRES.filter((g) => drops.some((d) => d.genre === g.id))

  /*
    The calendar is the city with a date on it, so it is behind the same door as the city.

    It rendered in full to a device that had been reset four seconds earlier: a month of
    events in a chapter nobody had chosen, under a header naming a city nobody had named.
    The door is the Legend, asked through useClub so this screen and the Club cannot
    disagree about who is inside.
  */
  if (!club.open) {
    return (
      <NotYet
        what="WHAT IS ON"
        line="Drops are pegged to real dates in your city — a market, a match, a festival — and each one opens the words for being there. They start arriving once you are in the Club."
      />
    )
  }

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-30 flex items-center gap-3 px-5 py-3">
        {/*
          BACK TO THE CLUB, because that is what is behind this.

          Back defaults to Yours, and Calendar took the default — but Calendar is a tab
          of its own on the bottom bar ("On"), so nobody arrives here from Yours. The
          arrow was pointing at a sibling tab and announcing it as the way back. Drops
          are Club content and the Club feed is what surfaces them, so that is the one
          honest answer for a screen that is not itself inside Yours.
        */}
        <Back href="/club" label="CLUB" />
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
              aria-label="The fortnight before"
              onClick={() => setOffset((o) => o - 1)}
              className="tap-target eyebrow rounded border border-line px-3 py-3"
            >
              ←
            </button>
            <h2 data-testid="cal-month" className="display min-w-0 flex-1 text-center text-base">
              {anchor
                ? anchor.getUTCDate() +
                  ' ' +
                  MONTHS[anchor.getUTCMonth()].slice(0, 3) +
                  ' – ' +
                  days[13].getUTCDate() +
                  ' ' +
                  MONTHS[days[13].getUTCMonth()].slice(0, 3)
                : ' '}
            </h2>
            <button
              type="button"
              data-testid="cal-next"
              aria-label="The fortnight after"
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
            {days.map((d) => {
              const iso = d.toISOString().slice(0, 10)
              const on = byDay.get(iso) ?? []
              const isToday = todayIso === iso
              const day = d.getUTCDate()
              /*
                A day with something on is a LINK; a day without is not a control at all.

                An empty square that responds to a tap and does nothing is the commonest way
                a calendar feels broken, and greying out thirty tappable things to make four
                stand out is the same mistake the shelf made with dimmed vibes.
              */
              if (!on.length) {
                return (
                  <span
                    key={iso}
                    className={
                      'flex min-h-[3.5rem] flex-col items-center justify-start rounded py-1 text-sm tabular-nums ' +
                      (isToday ? 'border border-line-strong text-fg' : 'text-muted')
                    }
                  >
                    {day}
                  </span>
                )
              }
              const g = genreFor(on[0].genre)
              return (
                <Link
                  key={iso}
                  href={'/club?drop=' + on[0].id}
                  data-testid={'cal-day-' + day}
                  aria-label={on.map((x) => x.event).join(', ') + ' on the ' + day + 'th'}
                  /*
                    NO tap-target HERE, and that is the opposite of the usual advice.

                    .tap-target forces a 44px minimum WIDTH, and these sit in seven grid
                    tracks that are 36.6px wide on a 320px phone — so adjacent days
                    physically overlapped and the right-hand edge of one day opened the
                    next day's drop. The min-height gives the cell a real target, and a day
                    is a cell in a grid rather than a button in a row.
                  */
                  className={
                    'flex min-h-[3.5rem] flex-col items-center gap-1 overflow-hidden rounded px-1 py-1 text-white ' +
                    (isToday ? 'ring-1 ring-fg' : '')
                  }
                  style={{ backgroundColor: g?.colour ?? 'var(--accent)' }}
                >
                  <span className="text-sm tabular-nums">{day}</span>
                  {/*
                    THE NAME, WHICH IS THE WHOLE POINT OF THE FORTNIGHT.

                    Clamped to two lines, broken on words. break-all was splitting
                    "Gilberto G / il" mid-name, which reads as a rendering fault rather
                    than a truncation — and a column this narrow cannot fit a name anyway,
                    so the question is only whether the fragment it shows is a word. The
                    full name is on the aria-label and on the card a tap away.
                  */}
                  <span className="line-clamp-2 w-full hyphens-auto break-words text-center text-[0.5rem] leading-tight opacity-95">
                    {on[0].event}
                  </span>
                </Link>
              )
            })}
          </div>

          {/*
            THE KEY, and only for what is actually on.

            Seven colours listed against a fortnight holding two of them is a taxonomy
            rather than a legend — it describes the product instead of the screen. This
            names what somebody is looking at, so the colours mean something the moment
            they are read.
          */}
          {keyed.length ? (
            <ul data-testid="cal-key" className="flex flex-wrap gap-3">
              {keyed.map((g) => (
                <li key={g.id} className="flex items-center gap-1 text-xs text-muted">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: g.colour }}
                  />
                  {g.label}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="eyebrow min-w-0 text-accent">
              {offset === 0 ? 'NEXT TWO WEEKS' : 'THAT FORTNIGHT'}
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

        {/*
          THE SUBSCRIPTION, UNDER THE LIST rather than above it.

          Somebody arriving here wants to know what is on; the offer to put it in their own
          calendar makes sense once they have seen that there is something worth putting
          there. An ask that comes first is an ask about a thing they have not looked at.
        */}
        <Subscribe city={chapter.city} />
      </div>

      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
