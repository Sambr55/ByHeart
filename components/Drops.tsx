'use client'

import Link from 'next/link'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { Wordmark } from '@/components/Wordmark'
import { useEffect, useState } from 'react'
import { type Drop } from '@/content/drops'
import { dropDaysLeft, dropLive, dropOpensOn, dropsFor, dropWhen } from '@/content/feed'
import { nextRecurring, recurringDrops } from '@/content/recurring'
import { generatedDrops } from '@/content/generated'
import { DROPS } from '@/content/drops'
import { useLearner } from '@/engine/useLearner'
import { DEFAULT_CHAPTER } from '@/content/chapters'
import type { Genre } from '@/content/calendar'
import { Back } from '@/components/Back'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

/**
 * Drops, on their own page.
 *
 * They were only ever visible as one row inside the picker, which is the wrong shape
 * for the thing that is supposed to make the country feel live. Here they get the
 * date, the venue and the way to actually go.
 *
 * The clock is read after mount so a countdown never differs between the server and
 * the browser.
 */
export function Drops() {
  const learner = useLearner()
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  /*
    Reading the real drops now, not vibes with a date on them.

    A drop used to be a crate that expired — six song titles, gone the morning after the
    gig — which was a fun idea about a band and no use to somebody who wants to go. It is a
    cluster of rooms pegged to the event now: where it is, whether there are tickets, how to
    get there, and how to ask somebody to come. The song titles stayed on the shelf, where
    they were always more use, because a band does not expire.
  */
  /*
    EVERY DROP THE PRODUCT HAS, NOT JUST THE HAND-WRITTEN ONE.

    This read `DROPS` — the one authored drop — while the Club served twelve, because
    content/feed.ts composes the authored ones with the generated and recurring ones and
    this page never did. So the screen named Drops was the most impoverished view of drops
    anywhere in the product: measured, one card against the Club's twelve.

    Ordered by the same function the Club uses rather than by a local sort, so the two
    cannot drift apart again — and that also brings the learner's own answers with it.
  */
  const chapter = learner.chapter ?? DEFAULT_CHAPTER
  const live: Drop[] = now
    ? dropsFor(
        chapter,
        now,
        false,
        (learner.profile?.genres ?? null) as Genre[] | null,
        learner.purpose ?? null,
      ).flatMap((c) => (c.kind === 'situation' && c.drop ? [c.drop] : []))
    : []
  /* The whole pool, for the COMING and GONE groups, which are about what is NOT open. */
  const pool = now
    ? [...DROPS, ...generatedDrops(chapter, now), ...recurringDrops(chapter, now)].filter(
        (d) => d.chapter === chapter,
      )
    : []
  /*
    Three states, not two.

    A drop used to be live from the moment it was authored, so "coming" could not exist —
    the countdown simply started shouting months early. Now that a drop has a window, one
    authored ahead of time is a real thing with a real date that is not open yet, and
    this is the page where saying so is worth more than hiding it: somebody who came here
    to see what is happening in Portugal should be told what is happening in Portugal.
  */
  /*
    WHAT IS COMING, AND NOT THE WHOLE OF NEXT YEAR.

    Recurring drops exist for this year AND next, so that the window can straddle New Year
    — which meant this list rendered eighteen cards, including Santo António twice, two
    Christmases and two Augusts. Seen in the browser at 390px it reads as a bug rather than
    as a diary: the same event listed twice is the product looking like it has lost count.

    So: the NEXT occurrence of each thing only, and a horizon of about four months. Beyond
    that is not news — "the Christmas lights, in two hundred days" tells nobody anything
    they wanted and buries the gig that is three weeks out.
  */
  const HORIZON_DAYS = 120
  const coming = now
    ? Object.values(
        pool
          .filter((d) => !dropLive(d, now) && now < new Date(d.on + 'T00:00:00Z'))
          .filter(
            (d) =>
              new Date(d.on + 'T00:00:00Z').getTime() - now.getTime() <
              HORIZON_DAYS * 86_400_000,
          )
          .sort((a, b) => a.on.localeCompare(b.on))
          /* Keyed on the thing rather than the occurrence, so a recurring drop appears
             once — as its soonest year — and a one-off appears as itself. */
          .reduce<Record<string, Drop>>((acc, d) => {
            const thing = d.id.replace(/_\d{4}$/, '')
            if (!acc[thing]) acc[thing] = d
            return acc
          }, {}),
      ).sort((a, b) => a.on.localeCompare(b.on))
    : []
  /* Gone, and recently — a recurring thing that happened eleven months ago is not news
     either, and listing last year's Santo António beside this year's is the same
     double-vision problem as COMING. */
  const gone = now
    ? pool
        .filter((d) => !dropLive(d, now) && now >= new Date(d.on + 'T00:00:00Z'))
        .filter(
          (d) => now.getTime() - new Date(d.on + 'T00:00:00Z').getTime() < 60 * 86_400_000,
        )
        .sort((a, b) => b.on.localeCompare(a.on))
    : []
  /* What the year does next, for the days when nothing is open. Never null. */
  const next = now ? nextRecurring(chapter, now) : null

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-30 flex items-center gap-3 px-5 py-3">
        <Back />
        <span className="eyebrow flex-1">Drops</span>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-10 pt-6">
        <div>
          <h1 className="display text-balance text-2xl">Pegged to something real.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A vibe sits there forever. A drop is tied to something actually happening in
            Portugal and goes the morning after it. Whatever you learn inside one stays
            yours — the drop disappears, the language does not.
          </p>
        </div>

        {coming.length ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="eyebrow min-w-0 text-accent">COMING</h2>
              <span className="h-px flex-1 bg-line" />
            </div>
            {coming.map((d) => (
              <div key={d.id} className="rounded border border-dashed border-line px-4 py-3">
                <p className="display text-base">{d.event}</p>
                <p className="mt-1 text-xs text-muted">
                  {d.place.name} · {d.place.area}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Opens{' '}
                  {dropOpensOn(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}, for{' '}
                  {new Date(d.on + 'T00:00:00Z').toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  .
                </p>
                {/* What is in it, before it opens. Somebody deciding whether to care is
                    owed the shape of the thing rather than a name and a date. */}
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {d.situations.map((x: Drop['situations'][number]) => x.title).join(' · ')}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {live.map((d) => {
          const left = now ? dropDaysLeft(d, now) : null
          const gone_on = new Date(d.on + 'T00:00:00Z')
          gone_on.setUTCDate(gone_on.getUTCDate() + 1)
          return (
            <section
              key={d.id}
              className="rounded border border-accent/45 bg-accent/[0.04] px-5 py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="eyebrow text-accent">
                  GONE {gone_on.getUTCDate()} {MONTHS[gone_on.getUTCMonth()]}
                </span>
                {left !== null ? (
                  <span className="shrink-0 rounded-full border border-accent/60 px-2 py-1 text-[0.55rem] uppercase tracking-wider text-accent">
                    {left <= 1 ? 'last day' : left + ' days left'}
                  </span>
                ) : null}
              </div>
              <h2 className="display mt-3 text-lg">{d.event}</h2>
              <p className="mt-1 text-sm text-muted">
                {d.place.name} · {d.place.area}
              </p>
              {/* The rooms, named. This is the whole change: a drop is not a set of song
                  titles any more, it is where it is, how to get in, how to get there, and
                  how to ask somebody to come with you. */}
              <ul className="mt-3 flex flex-col gap-1">
                {d.situations.map((x: Drop['situations'][number]) => (
                  <li key={x.id} className="text-xs leading-relaxed text-muted">
                    · {x.title}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/club"
                  className="tap-target eyebrow text-accent underline underline-offset-4"
                >
                  In the Club
                </Link>
                {d.link ? (
                  <a
                    href={d.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-target text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
                  >
                    {d.link.label} ↗
                  </a>
                ) : null}
              </div>
              {/* Where the facts came from. A drop that gives the wrong metro line is
                  somebody standing in the wrong place, so it says who told us. */}
              <p className="mt-6 border-t border-line/60 pt-3 text-[0.6rem] leading-relaxed text-muted">
                {d.sources.map((x) => x.where).join(' · ')}
              </p>
            </section>
          )
        })}

        {/*
          ONE EMPTY STATE, AND IT NAMES SOMETHING REAL.

          There were two of these, both gated on `!live.length && now`, so a day with
          nothing open rendered two different apologies stacked on top of each other above
          a dead gig. That was the screen this page would have shown every day from the 4th
          of November onwards.

          And an apology was the wrong content anyway. The year always has a next thing in
          it — Santo António, the 25th of April, the chestnut carts — so this says which
          one and when, which is the same promise the rest of the product makes: tell them
          what is true about the city. A countdown that has not started is still news.

          ONLY WHEN COMING IS ALSO EMPTY. Seen in the browser, this sat directly under a
          COMING list whose first card was the same event with its rooms named — so the
          page said São Martinho twice, the second time with less detail. COMING is the
          better answer wherever it has anything in it; this is the backstop beyond its
          four-month horizon.
        */}
        {!live.length && !coming.length && now ? (
          <div className="rounded border border-line-strong bg-bg-elev p-5">
            {next ? (
              <>
                <span className="eyebrow text-accent">NEXT UP</span>
                <p className="display mt-3 text-base">{next.event}</p>
                <p className="mt-1 text-xs text-muted">
                  {next.place.name} · {dropWhen(next)}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  It opens{' '}
                  {dropOpensOn(next).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  , a few weeks before, so the countdown means something when you see it.
                  Nothing you have already learned goes anywhere in the meantime.
                </p>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted">
                Nothing open right now. Drops arrive when something is actually on and go
                when it does.
              </p>
            )}
          </div>
        ) : null}

        {gone.length ? (
          <section className="flex flex-col gap-3">
            <span className="eyebrow text-muted">Gone</span>
            {gone.map((d) => (
              <p key={d.id} className="text-xs text-muted">
                {d.event} — {d.place.name}
              </p>
            ))}
          </section>
        ) : null}
      </div>
      <BottomNavSpace />
      <BottomNav />
    </main>
  )
}
