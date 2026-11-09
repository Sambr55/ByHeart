'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { PATH_NAMES, pathPurpose, pathUnits } from '@/content/path'
import { useLearner } from '@/engine/useLearner'

/**
 * YOUR PATH, BEFORE THE FIRST ROOM (Sam, 2026-11-03: "We then need to introduce the tile
 * wall or path before people get going so they see what they are doing, and make it very
 * clear we have registered their reason for being there and tailoring the content to them").
 *
 * Two jobs, in this order. First, say back what they told the booker — the reason, the
 * dates, who with — and what that changed: which levels they got, and why. Then show the
 * whole board, level by level, every tile a room they will stand in, so the first room is
 * the first tile of something they can see. One button: start Level 1.
 */
const REASON: Record<string, string> = {
  trip: 'a trip',
  someone: 'someone you love',
  moving: 'moving there',
  work: 'work',
  curious: 'the love of it',
}
const COMPANY: Record<string, string> = {
  solo: 'on your own',
  partner: 'with a partner',
  family: 'with family',
  friends: 'with friends',
  work: 'with colleagues',
}
const BECAUSE: Record<'visiting' | 'staying' | 'moving', string> = {
  visiting: 'the rooms a visitor actually stands in — arriving, coffee and food, getting about, seeing the city, and when it goes wrong.',
  staying: 'the rooms of a longer stay — settling in, the daily round, the same faces every week, and when it goes wrong.',
  moving: 'the rooms of a move — the paperwork, a place to live, everyday life, health and family, and becoming local.',
}
/*
  TO THE BOARD, NOT STRAIGHT INTO THE ROOM (Sam, 2026-11-09: "We should show the board before
  level one starts (first tile) so a user sees where they are going"). The Path opens on the
  board with the first tile saying "Start here" (PathHome, ?start=1); tapping it opens the room.
*/
const START = '/club?start=1'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const day = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z')
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()]
}

export function PathReveal({ first }: { first: string }) {
  const learner = useLearner()
  const purpose = pathPurpose(learner.purpose ?? null)
  const units = useMemo(() => pathUnits(undefined, undefined, learner.purpose ?? null), [learner.purpose])
  const name = PATH_NAMES[purpose]
  const p = learner.profile
  const total = units.reduce((n, u) => n + u.rooms.length, 0)

  const told = [
    p?.goal ? 'For ' + (REASON[p.goal] ?? 'your reason') : null,
    p?.here_from ? day(p.here_from) + (p.here_to ? ' – ' + day(p.here_to) : '') : null,
    p?.company ? COMPANY[p.company] : null,
  ].filter(Boolean) as string[]

  let tile = 0
  return (
    <main data-testid="path-reveal" className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-bg px-5 pb-10 text-fg" style={{ paddingTop: 'calc(2rem + var(--safe-top, env(safe-area-inset-top, 0px)))' }}>
      <p className="eyebrow text-telha">Your path is ready</p>
      <h1 className="display mt-2 text-4xl leading-tight">
        {name.title}
        {learner.display_name ? <span className="text-muted">, {learner.display_name}</span> : null}
      </h1>

      {/* WHAT THEY TOLD US, said back. */}
      {told.length ? (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="What you told us">
          {told.map((t) => (
            <li key={t} className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
              <span aria-hidden>✓</span>
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-base leading-relaxed">
        Because of what you told us, your path is built around {BECAUSE[purpose]}{' '}
        <span className="text-muted">
          {units.length} levels, {total} rooms — each one a tile.
          {p?.here_from ? ' What is on while you are there is waiting in the On tab.' : ''}
        </span>
      </p>

      {/* THE BOARD — every level, every tile, falling into place. */}
      <ol className="mt-6 flex flex-col gap-3">
        {units.map((u) => (
          <li key={u.id} className={'relative rounded-2xl border bg-bg-elev px-4 py-3 ' + (u.n === 1 ? 'border-accent/60' : 'border-line')}>
            {/*
              LEVEL 1 TAPS THROUGH (Sam, 2026-11-09: "level one needs to be tappable"). To the
              board, like the button: see where you are going before the first room.
            */}
            {u.n === 1 ? (
              <Link href={START} data-testid="reveal-level-1" aria-label={'Level 1 · ' + u.title + ' — see your board'} className="absolute inset-0 z-10 rounded-2xl" />
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <p className="display text-lg leading-tight">
                <span className="eyebrow mr-2 text-telha">Level {u.n}</span>
                {u.title}
              </p>
              <p className="shrink-0 text-xs text-muted">{u.rooms.length} rooms</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.rooms.map((r) => {
                const i = tile++
                return (
                  <span
                    key={r.id}
                    title={r.title}
                    className="reveal-tile relative h-9 w-9 overflow-hidden rounded-md bg-surface"
                    style={{ animationDelay: Math.min(i * 45, 1800) + 'ms' }}
                  >
                    {r.image ? <Image src={r.image.src} alt="" fill sizes="36px" className="object-cover" /> : null}
                  </span>
                )
              })}
            </div>
            {u.n === 1 ? (
              <p className="mt-2 text-xs text-muted">Hello and thank you, counting to twenty, the save, who you are — and a hack that hands you hundreds of words.</p>
            ) : null}
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Every room you play lays its tile. Lay a level’s tiles and you move up. A gold edge means
        you said it without looking. Change your reason any time in settings — the path changes with it.
      </p>

      <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-bg via-bg to-transparent px-5 pb-4 pt-6">
        <Link
          href={START}
          data-testid="reveal-start"
          className="tap-target eyebrow block w-full rounded-2xl bg-accent px-5 py-4 text-center text-base text-accent-ink shadow-[0_6px_0_0_rgba(0,0,0,0.25)]"
        >
          Start Level 1 · Basics
        </Link>
      </div>
    </main>
  )
}
