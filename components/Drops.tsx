'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CRATES, ROOTS_BY_FAMILY, daysLeft, isLive } from '@/content/roots'
import { Menu } from '@/components/Menu'

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
  const gone = now ? drops.filter((c) => !isLive(c, now)) : []

  return (
    <main
      data-stage="CHOICE"
      className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg text-fg"
    >
      <header className="bar sticky top-0 z-10 flex items-center gap-3 px-5 py-2.5">
        <Link href="/" className="eyebrow opacity-80 transition hover:opacity-100">
          ← DUB
        </Link>
        <span className="eyebrow flex-1">Drops</span>
        <Menu />
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pb-12 pt-7">
        <div>
          <h1 className="display text-balance text-2xl">Pegged to something real.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A crate sits there forever. A drop is tied to something actually happening in
            Portugal and goes the morning after it. Whatever you learn inside one stays
            yours — the drop disappears, the language does not.
          </p>
        </div>

        {live.map((c) => {
          const left = now ? daysLeft(c, now) : null
          const d = c.drop!
          const gone_on = new Date(d.on + 'T00:00:00Z')
          gone_on.setUTCDate(gone_on.getUTCDate() + 1)
          return (
            <section
              key={c.id}
              className="rounded border border-accent/45 bg-accent/[0.04] px-5 py-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="eyebrow text-accent">
                  GONE {gone_on.getUTCDate()} {MONTHS[gone_on.getUTCMonth()]}
                </span>
                {left !== null ? (
                  <span className="shrink-0 rounded-full border border-accent/60 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-accent">
                    {left <= 1 ? 'last day' : left + ' days left'}
                  </span>
                ) : null}
              </div>
              <h2 className="display mt-2 text-lg">{c.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {d.event} · {d.place}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {(ROOTS_BY_FAMILY[c.id] ?? []).length} lines. {c.blurb}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/"
                  className="eyebrow text-accent underline underline-offset-4"
                >
                  Open it
                </Link>
                {d.link ? (
                  <a
                    href={d.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.6rem] uppercase tracking-wider text-muted underline underline-offset-4 transition hover:text-accent"
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
          <section className="flex flex-col gap-2">
            <span className="eyebrow text-muted">Gone</span>
            {gone.map((c) => (
              <p key={c.id} className="text-xs text-muted/70">
                {c.title} — {c.drop!.event}, {c.drop!.place}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  )
}
