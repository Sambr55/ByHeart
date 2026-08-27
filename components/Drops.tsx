'use client'

import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { useEffect, useState } from 'react'
import { CRATES, ROOTS_BY_FAMILY, daysLeft, dropOpens, isLive } from '@/content/roots'
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
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  const drops = CRATES.filter((c) => c.drop)
  const live = drops.filter((c) => (now ? isLive(c, now) : true))
  /*
    Three states, not two.

    A drop used to be live from the moment it was authored, so "coming" could not exist —
    the countdown simply started shouting months early. Now that a drop has a window, one
    authored ahead of time is a real thing with a real date that is not open yet, and
    this is the page where saying so is worth more than hiding it: somebody who came here
    to see what is happening in Portugal should be told what is happening in Portugal.
  */
  const coming = now
    ? drops.filter((c) => !isLive(c, now) && now < new Date(c.drop!.on + 'T00:00:00Z'))
    : []
  const gone = now
    ? drops.filter((c) => !isLive(c, now) && now >= new Date(c.drop!.on + 'T00:00:00Z'))
    : []

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

        {now && !live.length ? (
          <div className="rounded border border-line-strong bg-bg-elev px-4 py-3">
            <p className="text-sm font-semibold">Nothing live right now.</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Drops only open a few weeks before the thing they are about, so that a
              countdown means something when you see one. Your vibes are not going
              anywhere in the meantime.
            </p>
          </div>
        ) : null}

        {coming.length ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <h2 className="eyebrow min-w-0 text-accent">COMING</h2>
              <span className="h-px flex-1 bg-line" />
            </div>
            {coming.map((c) => (
              <div key={c.id} className="rounded border border-dashed border-line px-4 py-3">
                <p className="display text-base">{c.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {c.drop!.event} · {c.drop!.place}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Opens{' '}
                  {dropOpens(c.drop!).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                  })}
                  , for {c.drop!.on}.
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {live.map((c) => {
          const left = now ? daysLeft(c, now) : null
          const d = c.drop!
          const gone_on = new Date(d.on + 'T00:00:00Z')
          gone_on.setUTCDate(gone_on.getUTCDate() + 1)
          return (
            <section
              key={c.id}
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
              <h2 className="display mt-3 text-lg">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {d.event} · {d.place}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {(ROOTS_BY_FAMILY[c.id] ?? []).length} lines. {c.blurb}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={"/vibes?open=" + c.id}
                  className="tap-target eyebrow text-accent underline underline-offset-4"
                >
                  {/* Into the drop itself. This was href="/" — the one call to action
                      on the page was a loop back to the front door. */}
                  Open it
                </Link>
                {d.link ? (
                  <a
                    href={d.link}
                    target="_blank"
                    rel="noreferrer"
                    className="tap-target text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
                  >
                    {d.link_label ?? 'TICKETS'} ↗
                  </a>
                ) : null}
              </div>
            </section>
          )
        })}

        {!live.length && now ? (
          <div className="rounded border border-line bg-bg-elev p-5">
            <p className="text-sm leading-relaxed text-muted">
              Nothing live right now. Drops arrive when something is actually on — a gig, a
              festival, a match — and go when it does.
            </p>
          </div>
        ) : null}

        {gone.length ? (
          <section className="flex flex-col gap-3">
            <span className="eyebrow text-muted">Gone</span>
            {gone.map((c) => (
              <p key={c.id} className="text-xs text-muted">
                {c.title} — {c.drop!.event}, {c.drop!.place}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
