'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'
import { useEntitlements } from '@/engine/useEntitlements'
import { hasFullAccess } from '@/lib/entitlements'
import { PATH_NAMES, pathPurpose, pathUnits } from '@/content/path'
import {
  activityTimes,
  dayStreak,
  milestoneHref,
  pathView,
  understoodCheer,
  understoodMilestone,
} from './progress'
import { roomLock } from './locks'
import { RoomCard } from './RoomCard'
import { WindingPath } from './WindingPath'
import { CardRail } from './CardRail'
import { DoorIcon, FlameIcon, SpeechIcon } from './icons'

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

  /*
    THE PATH FOLLOWS THE REASON GIVEN AT SET-UP — a trip, a season, or moving here — see
    content/path.ts. Settings can change it, and the path changes with it.
  */
  const purpose = learner.purpose ?? null
  const name = PATH_NAMES[pathPurpose(purpose)]
  const units = useMemo(() => pathUnits(undefined, undefined, purpose), [purpose])
  const view = useMemo(
    () => pathView(learner, units, (id) => roomLock(id, member, purpose)),
    [learner, units, member, purpose],
  )
  const streak = useMemo(
    () => (now ? dayStreak(activityTimes(learner), now) : { days: 0, today: false }),
    [learner, now],
  )

  const understood = learner.understood ?? 0

  /* Practice goes to the milestone of the unit you are in. */
  const practiceUnit =
    view.units.find((u) => u.unit.id === view.next?.unit.id)?.unit ?? view.units[0]?.unit
  const practiceHref = practiceUnit ? milestoneHref(practiceUnit.milestone.cheat) : '/revise'

  return (
    <div data-stage="LISBON" className="min-h-svh bg-bg text-fg">
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 md:max-w-6xl">
          <Wordmark mark="club" className="h-7 text-white" />
          <Link
            href="/settings#purpose"
            className="flex min-w-0 flex-1 flex-col leading-tight"
            aria-label={'Lisboa · ' + name.title + ' — change in settings'}
          >
            <span className="eyebrow truncate opacity-90">Lisboa</span>
            <span className="needs-learner truncate text-[0.7rem] font-semibold opacity-75">{name.short}</span>
          </Link>
          <p className="eyebrow rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1" aria-label={view.done + ' of ' + view.total + ' rooms done'}>
            <span className="needs-learner">{view.done}</span> / {view.total}
          </p>
          <Link href="/club/feed" className="eyebrow tap-target inline-flex shrink-0 items-center rounded-full border border-[rgba(255,255,255,0.4)] px-3 py-1">
            On now
          </Link>
          {/*
            THE PROMINENT SPOT IS THE UNDERSTOOD TALLY NOW, NOT THE STREAK (2026-11-02).

            Sam: "Count the times you were understood, not your streak." A streak counts
            the days you opened the app, and it is a number you can only lose; this counts
            the times you said something out loud and it landed, and it can only grow. The
            streak is not deleted — some people like it — it is demoted to the small line
            under the tally, below.
          */}
          <UnderstoodChip count={understood} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-10 px-5 py-6 md:max-w-6xl md:px-6">
        <Understood
          count={understood}
          days={streak.days}
          today={streak.today}
        />

        <section aria-labelledby="up-next" className="needs-learner flex flex-col gap-3">
          <h1 id="up-next" className="eyebrow text-muted">
            {view.next ? 'Up next' : name.done}
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

/** In the header, where the flame used to be: the tally, as a glyph and a number. */
function UnderstoodChip({ count }: { count: number }) {
  const label = count === 0 ? 'Not understood out loud yet' : 'Understood ' + timesOf(count)
  return (
    <p className="needs-learner flex items-center gap-1 font-bold" aria-label={label} title={label} data-testid="understood-chip">
      <SpeechIcon filled={count > 0} className="h-6 w-6" />
      <span className="display text-lg tabular-nums">{count}</span>
    </p>
  )
}

function timesOf(n: number): string {
  return n === 1 ? 'once' : n + ' times'
}

/*
  The highest milestone already celebrated, on this device.

  DEVICE-LOCAL ON PURPOSE, and not on the learner record. The count is the learner's and
  syncs (see `understood` in engine/learner.ts); whether this phone has already said "your
  first time understood" is a fact about the screen, not about the person. The worst a
  second device can do is cheer once more, which is not a failure worth a merge rule.
*/
const MARKED_KEY = 'dub.understood.marked'

function readMarked(): number {
  try {
    return Number(window.localStorage.getItem(MARKED_KEY) ?? 0) || 0
  } catch {
    return 0
  }
}

/**
 * THE TALLY, IN WORDS, AND THE RESCUE BUTTON BESIDE IT (Sam, 2026-11-02).
 *
 * "A gentle tally of 'times you said it out loud' — the little wins of being understood
 * are phenomenal and confidence boosting." So: the number, in a sentence, with nothing
 * about what is missing. No "keep it going", no target, no countdown to the next
 * milestone. At zero it says what will count, not that nothing has.
 *
 * A milestone (1, 5, 10, 25, 50, 100 — see components/path/progress.ts) gets one small
 * moment: a line of warmth that rises in, and stays until it is tapped away. Marked when
 * it is DISMISSED rather than when it is drawn, for the reason Club's welcome learned: a
 * Strict Mode remount would otherwise spend the moment without anybody seeing it.
 *
 * THE STREAK LIVES HERE NOW, small and muted, after the tally rather than instead of it.
 *
 * And "My opening line": Sam, "I love the idea of an app rescue/reminder button. Perhaps
 * so you can remind yourself of your planned opening sentence as you walk into a
 * situation, on your home screen." It opens /opener — the next room's first line, and the
 * save under it, in type you can read at arm's length.
 */
function Understood({
  count,
  days,
  today,
}: {
  count: number
  days: number
  today: boolean
}) {
  /* Read after mount: the server has no localStorage, and a cheer must not flash on load. */
  const [marked, setMarked] = useState<number | null>(null)
  useEffect(() => setMarked(readMarked()), [])
  const cheer = marked === null ? null : understoodMilestone(count, marked)

  const dismiss = () => {
    if (cheer === null) return
    try {
      window.localStorage.setItem(MARKED_KEY, String(cheer))
    } catch {
      /* Then it cheers again next time, which is the kinder of the two failures. */
    }
    setMarked(cheer)
  }

  const streakLabel =
    days === 0 ? null : days + (days === 1 ? ' day' : ' days') + ' in a row'

  return (
    <section aria-labelledby="understood" className="needs-learner flex flex-col gap-4 md:max-w-xl">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="understood" className="display text-2xl" data-testid="understood-tally">
          {count === 0 ? 'Say it out loud' : 'Understood ' + timesOf(count)}
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          {count === 0 ? 'Every time you say a line and it lands, it counts here.' : 'Out loud, in Portuguese.'}
          {streakLabel ? (
            <span className="ml-2 inline-flex items-center gap-1 whitespace-nowrap align-middle text-xs" data-testid="streak">
              <FlameIcon filled={today} className="h-3.5 w-3.5" />
              {streakLabel}
            </span>
          ) : null}
        </p>
      </div>

      {cheer !== null ? (
        <button
          type="button"
          onClick={dismiss}
          data-testid="understood-cheer"
          className="animate-rise flex items-start gap-3 rounded-2xl border border-correct bg-correct/10 px-4 py-3 text-left"
        >
          <SpeechIcon filled className="mt-0.5 h-5 w-5 shrink-0 text-correct" />
          <span className="min-w-0 flex-1 text-base leading-snug">{understoodCheer(cheer)}</span>
          <span className="eyebrow shrink-0 self-center text-muted">Boa!</span>
        </button>
      ) : null}

      {/* Always there: with every room done, the card still has the save on it. */}
      <Link
        href="/opener"
        data-testid="opener-button"
        className="tap-target flex items-center gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3"
      >
        <DoorIcon className="h-6 w-6 shrink-0 text-accent" />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="eyebrow text-accent">My opening line</span>
          <span className="text-sm text-muted">For walking in — and the save, if it goes wrong.</span>
        </span>
      </Link>
    </section>
  )
}
