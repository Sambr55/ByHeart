'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { AddToCalendar } from '@/components/AddToCalendar'
import { eventOfDrop } from '@/content/cal-event'
import { useMyCalendar, type MyCalendarStatus, type MyEvent } from '@/engine/gcal'
import { GENRES, genreFor } from '@/content/calendar'
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

/** For the date badge, Sunday-first like getUTCDay. */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
/*
  A NIGHT OPENS ITS FIRST ROOM (review, 2026-11-10). These went to /club/feed — the retired
  feed — and to /club?drop=, which the board ignores, so "Learn it" quietly did nothing.
*/
function nightHref(d: { situations?: { id: string }[] }): string {
  const first = d.situations?.[0]
  return first ? '/errand/' + first.id : '/calendar'
}

export function Calendar() {
  const club = useClub()
  /*
    The clock after mount, like every other date in this product.

    A month grid rendered on the server is a month grid in the server's timezone, and the
    highlighted day would flicker to a different one on hydration.
  */
  const [now, setNow] = useState<Date | null>(null)
  const [chapter, setChapter] = useState(chapterById(null))
  /* The trip, from set-up or the website's booking header (2026-11-03). */
  const [trip, setTrip] = useState<{ from: string; to: string | null } | null>(null)
  useEffect(() => {
    const t = new Date()
    setNow(t)
    const me = loadLearner()
    setChapter(chapterById(me.chapter))
    const from = me.profile?.here_from ?? null
    if (from) {
      setTrip({ from, to: me.profile?.here_to ?? null })
      /*
        OPEN ON THE TRIP, not on this week (2026-11-03). Somebody going in March was shown
        November. The fortnight holding their arrival is where the calendar starts; the
        arrows still go anywhere.
      */
      const day = 86_400_000
      const monday = (d: number) => d - ((new Date(d).getUTCDay() + 6) % 7) * day
      const today = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())
      const arrive = Date.parse(from + 'T00:00:00Z')
      if (arrive > today) {
        /* Whole weeks to the arrival's Monday: fortnights, plus a week's shift when it lands in the second half, so the trip starts the view. */
        const weeks = Math.round((monday(arrive) - monday(today)) / (7 * day))
        setOffset(Math.floor(weeks / 2))
        setShift(weeks % 2)
      }
    }
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
  /* 0 or 1: a week's nudge so a trip's first week leads its fortnight. */
  const [shift, setShift] = useState(0)

  const anchor = (() => {
    if (!now) return null
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    /* getUTCDay is Sunday-first; the grid is Monday-first. */
    const back = (new Date(midnight).getUTCDay() + 6) % 7
    return new Date(midnight - back * 86_400_000 + (offset * 14 + shift * 7) * 86_400_000)
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

  /*
    YOUR OWN CALENDAR, IF YOU SAY SO (Sam, 2026-11-05). Fetched by this browser from Google
    and drawn as dots on the same fortnight — see engine/gcal.ts for what is and is not kept.
  */
  const fromIso = days[0]?.toISOString().slice(0, 10) ?? null
  const toIso = days[13] ? new Date(days[13].getTime() + 86_400_000).toISOString().slice(0, 10) : null
  const mine = useMyCalendar(fromIso, toIso)
  const mineByDay = new Map<string, MyEvent[]>()
  for (const e of mine.events) for (const d of e.days) mineByDay.set(d, [...(mineByDay.get(d) ?? []), e])

  /* Only the genres actually on in this fortnight, so the key describes what is on the
     screen rather than advertising a taxonomy. */
  const keyed = GENRES.filter((g) => drops.some((d) => d.genre === g.id))

  /*
    The calendar is the city with a date on it, so it is behind the same door as the city.

    It rendered in full to a device that had been reset four seconds earlier: a month of
    events in a chapter nobody had chosen, under a header naming a city nobody had named.
    The door is set-up (it was the Legend — see clubOpen), asked through useClub so this
    screen and the Club cannot disagree about who is inside.
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
      {/*
        THE SAME HEADER AS PATH AND CITY (Sam, 2026-11-05: "missing its logo … in line with the
        path and city screens with the correct header"). The wordmark, the city in Portuguese
        over the screen's name, and the map one tap away — City's own header points here with
        "What's on →", so this points back. The BACK arrow went: this is a tab, and the bar
        under it is the way out.
      */}
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <Link href="/club" aria-label="DUB Club — your path" className="shrink-0">
            <Wordmark mark="club" className="h-7 text-white" />
          </Link>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="eyebrow truncate opacity-80">{chapter.pt}</p>
            <p className="display truncate text-lg">What’s on</p>
          </div>
          <Link
            href="/city"
            data-testid="cal-map"
            className="eyebrow tap-target inline-flex shrink-0 items-center rounded-full border border-[rgba(255,255,255,0.4)] px-3 py-1"
          >
            Map →
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        <div>
          <p lang="pt-PT" className="pt text-base text-accent">
            O que se passa em {chapter.pt}
          </p>
          <h1 className="display mt-1 text-balance text-3xl leading-tight">What is on, while you are here.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Everything pegged to a date in {chapter.city}. Tap one and you land in the
            Portuguese for it — where it is, how to get there, how to ask somebody to come.
          </p>
        </div>

        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-bg-elev p-4 shadow-sm">
          {trip ? (
            <p data-testid="cal-trip" className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-fg">
              <span className="eyebrow mr-2 text-accent">Your trip</span>
              {fmt(trip.from)}
              {trip.to && trip.to !== trip.from ? ' – ' + fmt(trip.to) : ''} · highlighted below
            </p>
          ) : null}
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="cal-prev"
              aria-label="The fortnight before"
              onClick={() => setOffset((o) => o - 1)}
              className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-lg text-accent"
            >
              ←
            </button>
            <h2 data-testid="cal-month" className="display min-w-0 flex-1 text-center text-lg">
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
              className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-lg text-accent"
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
              const inTrip = Boolean(trip && iso >= trip.from && iso <= (trip.to ?? trip.from))
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
                      'flex min-h-[3.5rem] flex-col items-center justify-start rounded-xl py-1 text-sm tabular-nums ' +
                      (isToday ? 'border border-line-strong text-fg' : 'text-muted') +
                      (inTrip ? ' bg-accent/10 font-semibold text-fg' : '')
                    }
                    aria-label={(mineByDay.get(iso) ?? []).length ? day + ': ' + (mineByDay.get(iso) ?? []).map((e) => e.title).join(', ') : undefined}
                  >
                    {day}
                    <Dots n={(mineByDay.get(iso) ?? []).length} />
                  </span>
                )
              }
              const g = genreFor(on[0].genre)
              return (
                <Link
                  key={iso}
                  href={nightHref(on[0])}
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
                    'flex min-h-[3.5rem] flex-col items-center gap-1 overflow-hidden rounded-xl px-1 py-1 text-white shadow-sm ' +
                    (isToday ? 'ring-1 ring-fg' : '') +
                    (inTrip ? ' outline outline-2 outline-offset-1 outline-accent' : '')
                  }
                  style={{ backgroundColor: g?.colour ?? 'var(--accent)' }}
                >
                  <span className="text-sm font-semibold tabular-nums">{day}</span>
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
                  <Dots n={(mineByDay.get(iso) ?? []).length} light />
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
          {/* Your own calendar beside DUB's, and DUB's into yours — the same card. */}
          <MyCalendar {...mine} days={days} mineByDay={mineByDay} />
          <Subscribe city={chapter.city} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="eyebrow min-w-0 text-accent">
              {offset === 0 ? 'NEXT TWO WEEKS' : 'THAT FORTNIGHT'}
            </h2>
            <span className="h-px flex-1 bg-line" />
            <span className="eyebrow shrink-0 tabular-nums text-muted">{drops.length}</span>
          </div>

          {!drops.length ? (
            <p className="rounded-2xl border border-line bg-bg-elev px-4 py-4 text-sm text-muted">
              Nothing pegged to a date this month. Try the month after — the big ones are
              usually in the diary long before they open.
            </p>
          ) : (
            drops.map((d) => {
              const on = new Date(d.on + 'T00:00:00Z')
              const open = now ? dropLive(d, now) : false
              /* A night already gone is not "opening nearer the time" — it said that about 3 Nov on 5 Nov. */
              const gone = Boolean(todayIso && d.on < todayIso)
              const g = genreFor(d.genre)
              const colour = g?.colour ?? 'var(--accent)'
              /* The first of its rooms with a picture is the night's picture. */
              const image = d.situations.find((x) => x.image)?.image
              return (
                /*
                  A NIGHT, NOT A LISTING ROW (Sam, 2026-11-05: "the layout of the events is
                  too bland"). The picture its rooms already carry, the date as a badge in the
                  genre's colour, what sort of night it is, where, the rooms inside it as
                  things you will be able to say, and whether it is open yet.
                */
                <article
                  key={d.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-bg-elev shadow-sm transition hover:border-accent/60"
                >
                <Link href={nightHref(d)} data-testid={'cal-drop-' + d.id} className="flex flex-col">
                  <span className="relative block h-36 w-full overflow-hidden" style={{ backgroundColor: colour }}>
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 448px) 100vw, 448px"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span aria-hidden className="panel-frieze absolute inset-0 opacity-25" />
                    )}
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span
                      className="absolute left-4 top-4 flex w-14 flex-col items-center rounded-2xl px-2 py-2 text-white shadow-md"
                      style={{ backgroundColor: colour }}
                    >
                      <span className="text-[0.55rem] font-semibold uppercase tracking-wider opacity-90">{WEEKDAYS[on.getUTCDay()]}</span>
                      <span className="display text-2xl leading-none tabular-nums">{on.getUTCDate()}</span>
                      <span className="text-[0.55rem] uppercase tracking-wider opacity-90">{MONTHS[on.getUTCMonth()].slice(0, 3)}</span>
                    </span>
                    {g ? (
                      <span className="eyebrow absolute bottom-3 left-4 rounded-full bg-black/40 px-3 py-1 text-[0.6rem] text-white backdrop-blur-sm">
                        {g.label}
                      </span>
                    ) : null}
                    <span
                      className={
                        'eyebrow absolute right-4 top-4 rounded-full px-3 py-1 text-[0.6rem] shadow-sm ' +
                        (open ? 'bg-accent text-accent-ink' : 'bg-bg-elev/95 text-muted')
                      }
                    >
                      {/* Honest about the one thing that would otherwise surprise them. */}
                      {open ? 'Open now' : gone ? 'Been and gone' : 'Opens nearer the time'}
                    </span>
                  </span>
                  <span className="flex flex-col gap-3 px-5 py-4">
                    <span>
                      <span className="display block text-balance text-xl leading-tight">{d.event}</span>
                      <span className="mt-1 flex items-center gap-1 text-sm text-muted">
                        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-telha" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z" />
                          <circle cx="12" cy="11" r="2.2" />
                        </svg>
                        <span className="truncate">
                          {d.place.name} · {d.place.area}
                        </span>
                      </span>
                    </span>
                    {/*
                      What is inside it, which is the only reason to tap. A calendar row
                      naming an event and nothing else is a listing; this says what you get.
                    */}
                    <span className="flex flex-col gap-2">
                      <span className="eyebrow text-[0.6rem] text-accent">The Portuguese for the night</span>
                      <span className="flex flex-wrap gap-2">
                        {d.situations.map((x) => (
                          <span key={x.id} className="rounded-full border border-line bg-surface px-3 py-1 text-xs">
                            {x.title}
                          </span>
                        ))}
                      </span>
                    </span>
                  </span>
                </Link>
                {/*
                  ADD TO CALENDAR, ON THE NIGHT ITSELF (Sam, 2026-11-05). Beside the link
                  rather than inside it — a button in a link is two taps fighting.
                */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line px-5 py-3">
                  {gone ? <span /> : <AddToCalendar event={eventOfDrop(d)} up />}
                  <Link href={nightHref(d)} className="tap-target eyebrow ml-auto inline-flex items-center gap-2 whitespace-nowrap text-[0.65rem] text-accent" aria-label={'Learn the Portuguese for ' + d.event}>
                    Learn it
                    <span aria-hidden className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
                </article>
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

/** "12 Dec" from an ISO day, in UTC like the grid. */
function fmt(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3)
}

/** Up to three dots for your own events on a day; the count is on the cell's label. */
function Dots({ n, light = false }: { n: number; light?: boolean }) {
  if (!n) return null
  return (
    <span aria-hidden className="mt-auto flex gap-0.5 pb-0.5" data-testid="cal-mine-dots">
      {Array.from({ length: Math.min(3, n) }, (_, i) => (
        <span key={i} className={'block h-1.5 w-1.5 rounded-full ' + (light ? 'bg-white' : 'bg-fg/60')} />
      ))}
    </span>
  )
}

/**
 * SHOW MY CALENDAR — the permission, what it is for, and once given, your own plans for these
 * two weeks under the grid, so a free evening and the night that fills it are on one screen.
 */
function MyCalendar({
  status,
  events,
  connect,
  disconnect,
  days,
  mineByDay,
}: {
  status: MyCalendarStatus
  events: MyEvent[]
  connect: () => void
  disconnect: () => void
  days: Date[]
  mineByDay: Map<string, MyEvent[]>
}) {
  if (status === 'unavailable') return null
  if (status === 'off' || status === 'tap' || status === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3" data-testid="cal-mine-off">
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
          <circle cx="12" cy="15" r="1.4" fill="currentColor" />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{status === 'tap' ? 'Show my calendar again' : 'See my own calendar here'}</span>
          <span className="block text-xs text-muted">
            {status === 'error'
              ? 'Google did not answer. Try again in a moment.'
              : status === 'tap'
                ? 'One tap — Google remembers you said yes.'
                : 'Your Google Calendar on these dates, so you can see when you are free. Read-only; it stays on this phone.'}
          </span>
        </span>
        <button
          type="button"
          onClick={connect}
          data-testid="cal-mine-connect"
          className="tap-target eyebrow shrink-0 rounded-full bg-accent px-4 py-2 text-[0.65rem] text-accent-ink"
        >
          {status === 'tap' ? 'Show' : 'Allow'}
        </button>
      </div>
    )
  }
  const shown = days
    .map((d) => d.toISOString().slice(0, 10))
    .flatMap((iso) => (mineByDay.get(iso) ?? []).map((e) => ({ iso, e })))
    .filter((x, i, all) => all.findIndex((y) => y.e.id === x.e.id) === i)
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-bg px-4 py-3" data-testid="cal-mine-on">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-2 w-2 rounded-full bg-fg/60" />
        <span className="min-w-0 flex-1 text-sm font-semibold">
          Your calendar{status === 'loading' ? '…' : ' · ' + events.length + (events.length === 1 ? ' thing' : ' things') + ' these two weeks'}
        </span>
        <button type="button" onClick={disconnect} className="tap-target text-xs text-muted underline underline-offset-4">
          Hide
        </button>
      </div>
      {shown.length ? (
        <ul className="flex flex-col gap-1 text-sm">
          {shown.slice(0, 8).map(({ iso, e }) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-16 shrink-0 tabular-nums text-muted">{shortDay(iso)}</span>
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
              <span className="shrink-0 tabular-nums text-muted">{e.time ?? 'all day'}</span>
            </li>
          ))}
          {shown.length > 8 ? <li className="text-xs text-muted">and {shown.length - 8} more</li> : null}
        </ul>
      ) : status === 'on' ? (
        <p className="text-xs text-muted">Nothing in your calendar these two weeks — every night here is free.</p>
      ) : null}
    </div>
  )
}

function shortDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()] + ' ' + d.getUTCDate()
}
