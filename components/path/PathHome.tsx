'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'
import { useEntitlements } from '@/engine/useEntitlements'
import { hasFullAccess } from '@/lib/entitlements'
import { pathUnits } from '@/content/path'
import { activityTimes, dayStreak, milestoneHref, pathView } from './progress'
import { roomLock } from './locks'
import { RoomCard } from './RoomCard'
import { WindingPath } from './WindingPath'
import { CardRail } from './CardRail'
import { FlameIcon } from './icons'

/**
 * The Lisbon path, as a home screen.
 *
 * One obvious next action — the up-next card with one big PLAY — then the whole trip
 * below it: a winding path on a phone, a rail of big cards on anything wide. Nothing is
 * locked by order; only paid rooms are, and they say UNLOCK.
 *
 * Built to be dropped into the Club home at merge: it takes no props and reads only the
 * learner, the clock and the entitlements.
 */
export function PathHome() {
  const learner = useLearner()
  const now = useNowAfterMount()
  const access = useEntitlements()
  /* The same rule the feed asks: billing not configured, not yet answered, or paid. */
  const member = hasFullAccess(access) || access.comped

  const units = useMemo(() => pathUnits(), [])
  const view = useMemo(
    () => pathView(learner, units, (id) => roomLock(id, member)),
    [learner, units, member],
  )
  const streak = useMemo(
    () => (now ? dayStreak(activityTimes(learner), now) : { days: 0, today: false }),
    [learner, now],
  )

  /* Practice goes to the milestone of the unit you are in. */
  const practiceUnit =
    view.units.find((u) => u.unit.id === view.next?.unit.id)?.unit ?? view.units[0]?.unit
  const practiceHref = practiceUnit ? milestoneHref(practiceUnit.milestone.cheat) : '/revise'

  return (
    <div data-stage="LISBON" className="min-h-svh bg-bg text-fg">
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 md:max-w-6xl">
          <Wordmark mark="club" className="h-7 text-white" />
          <p className="eyebrow flex-1 truncate opacity-90">Lisboa</p>
          <p className="eyebrow rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1" aria-label={view.done + ' of ' + view.total + ' rooms done'}>
            <span className="needs-learner">{view.done}</span> / {view.total}
          </p>
          <Link href="/club/feed" className="eyebrow tap-target inline-flex shrink-0 items-center rounded-full border border-[rgba(255,255,255,0.4)] px-3 py-1">
            On now
          </Link>
          <Streak days={streak.days} today={streak.today} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-10 px-5 py-6 md:max-w-6xl md:px-6">
        <section aria-labelledby="up-next" className="needs-learner flex flex-col gap-3">
          <h1 id="up-next" className="eyebrow text-muted">
            {view.next ? 'Up next' : 'The whole trip, done'}
          </h1>
          {view.next ? (
            <div className="md:max-w-xl">
              <RoomCard
                room={view.next.room}
                tag={'Unit ' + view.next.unit.n + ' · ' + view.next.unit.title}
                state="next"
                big
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-3xl border border-line bg-bg-elev p-5 md:max-w-xl">
              <p className="display text-2xl">Every open room, played.</p>
              <p className="text-sm leading-relaxed text-muted">
                Keep them warm: the practice sessions ask for them back cold.
              </p>
              <Link
                href={practiceHref}
                className="tap-target eyebrow inline-flex justify-center rounded-full bg-accent px-6 py-3 text-accent-ink"
              >
                Practise
              </Link>
            </div>
          )}
        </section>

        <div className="needs-learner md:hidden">
          <WindingPath view={view} />
        </div>
        <div className="needs-learner hidden md:block">
          <CardRail view={view} />
        </div>
        <BottomNavSpace />
      </main>

      {/*
        THE APP'S OWN BAR, not the path's prototype TabBar (components/path/TabBar.tsx, kept
        for the left-rail idea). One bar everywhere: a home with different tabs from every
        other screen would be two apps.
      */}
      <BottomNav />
    </div>
  )
}

function Streak({ days, today }: { days: number; today: boolean }) {
  const label =
    days === 0
      ? 'No days in a row yet'
      : days + (days === 1 ? ' day' : ' days') + ' in a row' + (today ? '' : ' — say something today to keep it')
  return (
    <p className="needs-learner flex items-center gap-1 font-bold" aria-label={label} title={label}>
      <FlameIcon filled={today && days > 0} className="h-6 w-6" />
      <span className="display text-lg tabular-nums">{days}</span>
    </p>
  )
}
