'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  type PathNode,
} from './progress'
import { roomLock } from './locks'
import { RoomCard } from './RoomCard'
import { Panel } from './Panel'
import { Road } from './Road'
import { TileSheet } from './TileSheet'
import { DoorIcon, SpeechIcon } from './icons'

/**
 * The Lisbon path, as a home screen.
 *
 * One obvious next action — the up-next card with one big PLAY — then the whole trip
 * below it: THE PANEL (components/path/Panel.tsx), at every width. Nothing is locked by
 * order; only paid rooms are, and they say UNLOCK.
 *
 * THE PANEL REPLACED THE WALL ON 2026-11-02, the same day the Wall arrived. Sam, on the
 * Wall: "it looks like a badly laid out PowerPoint" — he asked for "something much more
 * elegant and aspirational with some level of movement", was shown the Panel on the
 * website ("you surpassed yourself there") and chose it. Each path is one azulejo painting
 * and each room one square of it; the Wall's courses, cracks and plaster are gone, its
 * keystones, sheet and foundation kept. Everything below about the Wall's arrival still
 * stands for the Panel: it is the same slot, at the same widths.
 *
 * AND THE ROAD BESIDE IT (Sam, 2026-11-02): "I'm still seeing the Duo Lingo roadmap view in
 * the app and it is kinda cool … could we have a 'winding road' map view and a tile view and
 * a toggle." A small Panel | Road switch above the picture, remembered per device. Both are
 * drawn from the one pathView, so drifting, the sheet and "Put these back" are one game.
 *
 * THE WALL REPLACED THE WINDING PATH ON 2026-11-02. Sam approved it after a design review
 * found the path "too Duolingo" — the code's own comments called it "Duolingo's winding
 * line" and the bubble over the next node "Duolingo's START". With it went the rest of
 * the tells on this screen: the flame beside the streak, the bouncing START, the stars and
 * the chunky hard bottom shadows.
 *
 * AND ON DESKTOP TOO (Sam, 2026-11-02: "Yes, replace the old card rail with the Wall on
 * desktop."). The rail of big cards — CardRail, with its unit banners, its star rows and
 * the hard-shadowed practice circle — was the wide-screen copy of the same Duolingo
 * shape, so it is gone, and the one drawing serves every width. Wide screens get two calm
 * columns rather than a stretched phone: on the left what to do now (the tally, My
 * opening line, Up next), held in place while you scroll; on the right the Wall, at the
 * width a wall of tiles reads best, with its strip above and its foundation under it.
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
    content/path.ts. Settings can change it, and the path changes with it — and so does
    the painting on the panel (content/panel.ts).
  */
  const purpose = learner.purpose ?? null
  const name = PATH_NAMES[pathPurpose(purpose)]
  const units = useMemo(() => pathUnits(undefined, undefined, purpose), [purpose])
  /*
    `now` from useNowAfterMount, because slipping reads the clock and the server has none
    worth trusting — before mount nothing has drifted, which is the kinder first frame.
  */
  const view = useMemo(
    () => pathView(learner, units, (id) => roomLock(id, member, purpose), now ?? new Date(0)),
    [learner, units, member, purpose, now],
  )
  /* The laid tile whose sheet is open, if any. Unlaid tiles open the room, as ever. */
  const [sheet, setSheet] = useState<PathNode | null>(null)
  /*
    PANEL OR ROAD (Sam, 2026-11-02: "a 'winding road' map view and a tile view and a
    toggle"). The Panel by default; the choice is remembered on this device, read after
    mount so the server and the first frame agree.
  */
  const [mode, setMode] = useState<PathMode>('panel')
  useEffect(() => setMode(readPathMode()), [])
  const chooseMode = useCallback((m: PathMode) => {
    setMode(m)
    try {
      window.localStorage.setItem(PATH_MODE_KEY, m)
    } catch {
      /* No storage: the choice lasts as long as the screen does. */
    }
  }, [])
  const closeSheet = useCallback(() => setSheet(null), [])
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

      <main className="mx-auto w-full max-w-md px-5 py-6 md:max-w-6xl md:px-6">
        {/* One column on a phone; on anything wide, now on the left and the Panel on the right. */}
        <div className="flex flex-col gap-10 md:grid md:grid-cols-[minmax(0,24rem)_minmax(0,38rem)] md:items-start md:justify-center md:gap-12">
          <div className="flex flex-col gap-10 md:sticky md:top-24">
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
          </div>

          <div className="needs-learner flex flex-col gap-3">
            <ViewToggle mode={mode} onChange={chooseMode} />
            {mode === 'road' ? (
              <Road
                view={view}
                inventory={learner.inventory ?? {}}
                onLaid={setSheet}
                openId={sheet?.room.id ?? null}
              />
            ) : (
              <Panel
                view={view}
                purpose={pathPurpose(purpose)}
                chapter={learner.chapter ?? 'lisbon'}
                inventory={learner.inventory ?? {}}
                onLaid={setSheet}
                openId={sheet?.room.id ?? null}
              />
            )}
          </div>
        </div>
        <BottomNavSpace />
      </main>

      {/*
        THE APP'S OWN BAR, not the path's prototype TabBar (components/path/TabBar.tsx, kept
        for the left-rail idea). One bar everywhere: a home with different tabs from every
        other screen would be two apps.
      */}
      <BottomNav />
      {sheet ? <TileSheet node={sheet} gender={learner.profile?.gender ?? null} onClose={closeSheet} /> : null}
    </div>
  )
}

/**
 * In the header, where the flame used to be: the tally, as a glyph and a number.
 *
 * THE WORDS ARE HONEST ABOUT THE MICROPHONE (2026-11-02). engine/listen.ts says a result
 * is "close", never "correct" — a recogniser is not a person nodding — so the tally says
 * what it can know: said out loud, and heard. The chip stays a number with a speech icon.
 */
function UnderstoodChip({ count }: { count: number }) {
  const label = count === 0 ? 'Nothing said out loud yet' : 'Said out loud, and heard ' + timesOf(count)
  return (
    <p className="needs-learner flex items-center gap-1 font-bold" aria-label={label} title={label} data-testid="understood-chip">
      <SpeechIcon filled={count > 0} className="h-6 w-6" />
      <span className="display text-lg tabular-nums">{count}</span>
    </p>
  )
}

/*
  THE VIEW, PER DEVICE. A preference about a screen, not a fact about the learner — the same
  reasoning as MARKED_KEY below — so it lives in localStorage and never syncs.
*/
export type PathMode = 'panel' | 'road'
export const PATH_MODE_KEY = 'dub.path.view'

function readPathMode(): PathMode {
  try {
    return window.localStorage.getItem(PATH_MODE_KEY) === 'road' ? 'road' : 'panel'
  } catch {
    return 'panel'
  }
}

/** Panel | Road — two segments, small, above the picture. */
function ViewToggle({ mode, onChange }: { mode: PathMode; onChange: (m: PathMode) => void }) {
  return (
    <div role="group" aria-label="How to show your path" className="view-toggle self-start" data-testid="view-toggle">
      <button type="button" aria-pressed={mode === 'panel'} onClick={() => onChange('panel')} data-mode="panel">
        Panel
      </button>
      <button type="button" aria-pressed={mode === 'road'} onClick={() => onChange('road')} data-mode="road">
        Road
      </button>
    </div>
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
          {count === 0 ? 'Say it out loud' : 'Said out loud, and heard ' + timesOf(count)}
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          {count === 0 ? 'Every time you say a line out loud and it is heard, it counts here.' : 'In Portuguese.'}
          {/*
            THE STREAK, AS WORDS ONLY (the Wall, 2026-11-02). The flame was the last
            Duolingo tell on the home screen; the line stays for the people who like it.
          */}
          {streakLabel ? (
            <span
              className="ml-2 inline-flex items-center gap-1 whitespace-nowrap align-middle text-xs"
              data-testid="streak"
              data-today={today ? 'true' : undefined}
            >
              · {streakLabel}
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
