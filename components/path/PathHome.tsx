'use client'

import { chapterById } from '@/content/chapters'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { BottomNav, BottomNavSpace } from '@/components/BottomNav'
import { useLearner } from '@/engine/useLearner'
import { useNowAfterMount } from '@/engine/useNow'
import { useEntitlements } from '@/engine/useEntitlements'
import { hasFullAccess } from '@/lib/entitlements'
import { PATH_NAMES, pathPurpose, pathUnits } from '@/content/path'
import { levelKey } from '@/content/level'
import { rungReached } from '@/content/roots'
import {
  milestoneHref,
  pathLevel,
  recapWaiting,
  pathView,
  type PathLevel,
  understoodCheer,
  understoodMilestone,
  type PathNode,
} from './progress'
import { roomLock } from './locks'
import { RoomCard } from './RoomCard'
import { Panel } from './Panel'
import { Road } from './Road'
import { Board } from './Board'
import { KeepItAsk } from './KeepItAsk'
import { markFromBoard } from '@/components/BackToBoard'
import { useHomecoming } from './homecoming'
import { TileSheet } from './TileSheet'
import { DoorIcon, SpeechIcon } from './icons'
import { PushAsk } from '@/components/PushChoices'
import { track } from '@/engine/analytics'


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
  /* Lisboa, Cascais or Sintra — the city chosen on the boarding pass (2026-11-05). */
  const city = chapterById(learner.chapter)
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
  /* Rooms just put back on /revise: they come home with a flourish, once. homecoming.ts. */
  const homing = useHomecoming()
  /*
    THE BOARD IS THE DEFAULT (Sam, 2026-11-05: "the Board should be the default and tiles
    and road be options"). Anybody who already chose Panel or Road on this phone keeps it.
  */
  const [mode, setMode] = useState<PathMode>('board')
  /*
    ARRIVING FROM "YOUR PATH IS READY" (?start=1, 2026-11-09): the board first, whatever view
    this phone chose before, with the first tile marked — so the first room is the first tile
    of something they can see. Not saved as the view choice; the address is tidied after.
  */
  const [starting, setStarting] = useState(false)
  /* Remembered, because the address is tidied on the first run and an effect can run twice. */
  const cameFromReveal = useRef(false)
  useEffect(() => {
    const fromReveal = cameFromReveal.current || new URLSearchParams(window.location.search).get('start') === '1'
    cameFromReveal.current = fromReveal
    setStarting(fromReveal)
    setMode(fromReveal ? 'board' : readPathMode())
    if (fromReveal) window.history.replaceState(null, '', window.location.pathname)
  }, [])
  const chooseMode = useCallback((m: PathMode) => {
    setMode(m)
    try {
      window.localStorage.setItem(PATH_MODE_KEY, m)
    } catch {
      /* No storage: the choice lasts as long as the screen does. */
    }
  }, [])
  const closeSheet = useCallback(() => setSheet(null), [])
  /* THE ONE LADDER (2026-11-03) — see pathLevel. */
  const level = useMemo(() => pathLevel(view), [view])

  const understood = learner.understood ?? 0
  /* How far up the ladder: whether a vibe surprise opens yet (the sitting's own gate). */
  const rung = useMemo(() => rungReached(learner.proof ?? []), [learner.proof])

  /* Practice goes to the milestone of the unit you are in. */
  const practiceUnit =
    view.units.find((u) => u.unit.id === view.next?.unit.id)?.unit ?? view.units[0]?.unit
  const practiceHref = practiceUnit ? milestoneHref(practiceUnit.milestone.cheat) : '/revise'

  /*
    THE RECAP NOBODY HAS OPENED YET (2026-11-05). The last room of a level opens its recap
    (Errand), but a level can also be finished from elsewhere; so the latest finished level
    whose recap has not been seen waits here, above Up next, until it is opened.
  */
  const recapDue = useMemo(() => {
    const seen = learner.recaps_seen ?? []
    const i = recapWaiting(view, (id) => seen.includes(levelKey(purpose, id)))
    if (i === -1) return null
    const u = view.units[i]
    return { id: u.unit.id, n: i + 1, title: u.unit.title, last: i === view.units.length - 1 }
  }, [view, purpose, learner.recaps_seen])
  /*
    WHILE A BOARD WAITS ON SO FAR, IT IS THE LEVEL YOU ARE ON (review, 2026-11-10): the header
    chip, the bar, the board and Up next all name it, rather than the board after it.
  */
  const shown: PathLevel = useMemo(() => {
    if (!recapDue) return level
    const u = view.units[recapDue.n - 1]
    const open = u.nodes.filter((x) => x.state !== 'paid').length
    return { level: recapDue.n, unit: u.unit, toNext: 0, laid: u.done, open, complete: false }
  }, [recapDue, level, view])

  const task = (
    <section aria-labelledby="up-next" className="flex flex-col gap-3" data-testid="up-next">
      {/* Sign in, asked after rooms 2 and 4 and at Level 2 — skippable (KeepItAsk.tsx). */}
      {recapDue ? (
        <Link
          href={'/level/' + encodeURIComponent(recapDue.id)}
          data-testid="path-recap-due"
          className="tap-target flex items-center justify-between gap-3 rounded-2xl border-2 border-[#e2b450] bg-bg-elev px-5 py-4"
        >
          <span className="min-w-0">
            <span className="eyebrow block text-accent">Board {recapDue.n} done</span>
            <span className="block text-base">
              {recapDue.last ? 'See your trip so far — every board, laid' : 'See your trip so far, then the next board opens'}
            </span>
          </span>
          <span aria-hidden className="text-accent">→</span>
        </Link>
      ) : null}
      {/* With a board waiting on So far, that is what is next — not a room on the board after it. */}
      {/* After the reward, not before it (review, 2026-11-10). Sign in, asked after rooms 2 and 4 and at Level 2 — skippable (KeepItAsk.tsx). */}
      <KeepItAsk rooms={view.done} level={level.level} />
      {recapDue ? null : (
        <h2 id="up-next" className="eyebrow text-muted">
          {view.next ? 'Up next' : name.done}
        </h2>
      )}
      {recapDue ? null : view.next ? (
        <RoomCard room={view.next.room} tag={view.next.unit.title} state="next" big />
      ) : (
        <div className="flex flex-col gap-3 rounded-3xl border border-line bg-bg-elev p-5">
          <p className="display text-2xl">Every open room, played.</p>
          <p className="text-sm leading-relaxed text-muted">Keep them warm: the practice sessions ask for them back cold.</p>
          <Link href={practiceHref} className="tap-target eyebrow inline-flex justify-center rounded-full bg-accent px-6 py-3 text-accent-ink">
            Practise
          </Link>
        </div>
      )}
      <Understood count={understood} />
      {/* The morning line, offered where the path is — until this phone has it (Sam, 2026-11-04: "make this more prominent"). */}
      <PushAsk room="path" />
      {/*
        A TABLE, ONCE THERE IS ENOUGH TO SAY AT ONE (2026-11-04). The "Host one" card left
        Yours, where it showed to everybody from the first minute; it lives here from level 3
        — two levels of lines is an evening's worth — until they have sat at one.
      */}
      {(level.level >= 3 || level.complete) && !(learner.tables_sat ?? []).length ? (
        <Link
          href="/table/new"
          data-testid="path-table-nudge"
          onClick={() => track('path_table_nudge')}
          className="tap-target -mt-1 self-start py-1 text-sm text-muted"
        >
          Two levels in. <span className="font-semibold text-accent">Host a table with friends →</span>
        </Link>
      ) : null}
    </section>
  )

  return (
    <div
      data-stage="LISBON"
      className="min-h-svh bg-bg text-fg"
      /*
        Anything that leaves the Path from here — a square, a sheet (portalled, but still in this
        tree), a chip — marks the way back, so the next screen offers "‹ Back to board".
      */
      onClickCapture={(e) => {
        /* The tab bar is not "leaving through the board": the Path tab is already the way back (review, 2026-11-10). */
        if ((e.target as Element).closest?.('[data-testid=bottom-nav]')) return
        const a = (e.target as Element).closest?.('a[href]')
        const href = a?.getAttribute('href') ?? ''
        if (href && !href.startsWith('/club') && !href.startsWith('#')) markFromBoard()
      }}
    >
      <header className="bar safe-top sticky top-0 z-30 px-5 py-3">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 md:max-w-6xl">
          <Wordmark mark="club" className="h-7 text-white" />
          <Link
            href="/trip"
            data-testid="header-trip"
            className="flex min-w-0 flex-1 flex-col leading-tight"
            aria-label={city.pt + ' · ' + name.title + ' — change your destination'}
          >
            <span className="eyebrow truncate opacity-90">{city.pt} ▾</span>
            <span className="needs-learner truncate text-[0.7rem] font-semibold opacity-75">{name.short}</span>
          </Link>
          {/*
            ONE NUMBER IN THE HEADER, AND IT IS THE LEVEL (2026-11-03). The rooms-done
            fraction and the "On now" button went: the fraction is the level bar below, and
            what is on is the On tab — two doors to one room was half the maze.
          */}
          <p className="eyebrow needs-learner rounded-full bg-[rgba(255,255,255,0.14)] px-3 py-1" data-testid="level-chip">
            Level {Math.min(shown.level, view.units.length)}
          </p>
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

      {/*
        ONE COLUMN, IN THE ORDER YOU USE IT (2026-11-04). Sam: "I'm finding the path screens
        very busy and a bit confusing … is it all necessary? … the path/road toggle should
        always be at the top, then the tiles, then the task."

        So: where you are (level, and the Panel/Road toggle beside it), the picture you are
        building, and what to do next straight under it. Gone from here: "Lisbon, like a
        local" (the City tab already has Show what's near me), and the said-out-loud section,
        whose number is already the header chip — its milestone cheer and the opening-line
        card now sit under the task. The level appeared three times; the Up next tag no
        longer repeats it.
      */}
      <main className="mx-auto w-full max-w-md px-5 py-6 md:max-w-xl">
        <div className="needs-learner flex flex-col gap-6">
          <LevelBar level={shown} toggle={<ViewToggle mode={mode} onChange={chooseMode} />} />

          {/* The gold "Your first board" note went (review, 2026-11-10): the key above Board 1 says the same, and the first lesson has to be on the first screen. */}
          {mode === 'board' ? (
            <Board
              view={view}
              purpose={pathPurpose(purpose)}
              chapter={learner.chapter ?? 'lisbon'}
              /* A finished board stays until its trip-so-far is seen (lap.ts, Até agora). */
              current={recapDue ? recapDue.n - 1 : level.complete ? Math.max(0, view.units.length - 1) : level.level - 1}
              now={now ?? new Date(0)}
              recapsSeen={learner.recaps_seen ?? []}
              saidHere={learner.walk_stops ?? []}
              gender={learner.profile?.gender ?? null}
              onLaid={setSheet}
              beckon={starting && view.done === 0}
              rung={rung}
            >
              {task}
            </Board>
          ) : mode === 'road' ? (
            <Road
              view={view}
              inventory={learner.inventory ?? {}}
              purpose={pathPurpose(purpose)}
              chapter={learner.chapter ?? 'lisbon'}
              rung={rung}
              now={now ?? new Date(0)}
              onLaid={setSheet}
              openId={sheet?.room.id ?? null}
              homing={homing}
            >
              {task}
            </Road>
          ) : (
            <Panel
              view={view}
              purpose={pathPurpose(purpose)}
              chapter={learner.chapter ?? 'lisbon'}
              inventory={learner.inventory ?? {}}
              rung={rung}
              now={now ?? new Date(0)}
              onLaid={setSheet}
              openId={sheet?.room.id ?? null}
              homing={homing}
            >
              {task}
            </Panel>
          )}

          {/*
            NO SIDE ROWS (Sam, 2026-11-09: "should we only see content in a flow… declutter and
            making it as clear as possible to the user how they move through"). The Hacks,
            Bluffs & Cheats row and the Just for fun row are gone from here: their content is
            dealt onto each level's board as surprises (content/surprises.ts), the same in all
            three views, and everything opened lands in Yours.
          */}
        </div>
        <BottomNavSpace />
      </main>

      {/*
        THE APP'S OWN BAR (the prototype TabBar was deleted 2026-11-03; it was
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
export type PathMode = 'panel' | 'road' | 'board'
export const PATH_MODE_KEY = 'dub.path.view'

function readPathMode(): PathMode {
  try {
    const m = window.localStorage.getItem(PATH_MODE_KEY)
    return m === 'road' || m === 'panel' ? m : 'board'
  } catch {
    return 'board'
  }
}

/** Board | Panel | Road — three segments, small, above the picture; the Board first and the default (2026-11-05). */
function ViewToggle({ mode, onChange }: { mode: PathMode; onChange: (m: PathMode) => void }) {
  return (
    <div role="group" aria-label="How to show your path" className="view-toggle shrink-0" data-testid="view-toggle">
      <button type="button" aria-pressed={mode === 'board'} onClick={() => onChange('board')} data-mode="board">
        Board
      </button>
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
function Understood({ count }: { count: number }) {
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


  return (
    /* The tally itself is the header chip; here only its milestone cheer, when one is due. */
    <div className="flex flex-col gap-3">
      {/*
        ONE LINE, NOT A CARD (2026-11-04). Sam asked why the opening-line card sat on the
        Path on every visit; it is needed on a pavement, not every time the Path opens. So
        it is a line under Play — and still the home-screen shortcut (app/manifest.ts).
        Always there: with every room done, it still has the save on it.
      */}
      <Link
        href="/opener"
        data-testid="opener-button"
        className="tap-target -mt-1 flex items-center gap-2 self-start py-1 text-sm text-muted"
      >
        <DoorIcon className="h-4 w-4 shrink-0 text-accent" />
        <span>
          Walking in now? <span className="font-semibold text-accent">My opening line →</span>
        </span>
      </Link>

      {cheer !== null ? (
        /*
          BOA! IS THE HEADLINE (2026-11-04). Sam: "Boa gets lost". It sat as a grey eyebrow
          squeezed beside three lines of text. Now it leads, big and green, with the
          message under it and a close mark where people look for one.
        */
        <button
          type="button"
          onClick={dismiss}
          data-testid="understood-cheer"
          aria-label={'Boa! ' + understoodCheer(cheer) + ' Tap to close.'}
          className="animate-rise relative flex flex-col gap-1 rounded-2xl border border-correct bg-correct/10 px-5 py-4 text-left"
        >
          <span className="flex items-center gap-2 pr-8 text-correct">
            <SpeechIcon filled className="h-6 w-6 shrink-0" />
            <span className="display text-2xl leading-none" lang="pt-PT">
              Boa!
            </span>
          </span>
          <span className="text-base leading-snug">{understoodCheer(cheer)}</span>
          <span aria-hidden className="absolute right-4 top-3 text-xl leading-none text-muted">
            ×
          </span>
        </button>
      ) : null}
      {/*
        BRING A FRIEND, at the moment it lands (2026-11-04, the review of Yours): you have
        just been understood by a real person, and the next thing worth having is somebody
        to speak it with. Goes to Your people on Yours, which keeps the full invitation.
      */}
      {cheer !== null ? (
        <Link
          href="/profile#people"
          data-testid="cheer-bring-friend"
          className="tap-target -mt-1 self-start py-1 text-sm text-muted"
        >
          Got someone to practise with? <span className="font-semibold text-accent">Bring a friend in →</span>
        </Link>
      ) : null}

    </div>
  )
}

/**
 * WHERE YOU ARE, IN ONE LINE (Sam, 2026-11-03: "no idea how to … level up").
 *
 * The level, the district it is, and a bar of that district's rooms — so the next thing
 * to do and why it matters sit together. When every open room is laid it says so, and
 * points at the Foundations and the practice instead of a number that cannot move.
 */
function LevelBar({ level, toggle }: { level: PathLevel; toggle: ReactNode }) {
  if (level.complete || !level.unit) {
    return (
      <section aria-label="Your level" className="needs-learner flex flex-col gap-1" data-testid="level">
        <div className="flex items-center justify-between gap-3">
          <p className="display text-2xl leading-tight">Every open room, laid.</p>
          {toggle}
        </div>
        <p className="text-sm text-muted">Keep the tiles in place, and fill the Foundations below.</p>
      </section>
    )
  }
  const pct = level.open ? Math.round((level.laid / level.open) * 100) : 0
  return (
    <section aria-label="Your level" className="needs-learner flex flex-col gap-2" data-testid="level">
      <div className="flex items-center justify-between gap-3">
        <p className="display min-w-0 text-2xl leading-tight">
          <span className="eyebrow block text-telha">Level {level.level}</span>
          {level.unit.title}
        </p>
        {toggle}
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={level.open}
        aria-valuenow={level.laid}
        aria-label={level.laid + ' of ' + level.open + ' rooms laid'}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: pct + '%' }} />
      </div>
      <p className="text-sm text-muted" data-testid="level-next">
        {level.laid} of {level.open} rooms laid ·{' '}
        <span className="font-semibold text-fg">
          {level.toNext === 0 ? 'See your trip so far' : (level.toNext === 1 ? '1 room' : level.toNext + ' rooms') + ' to Level ' + (level.level + 1)}
        </span>
      </p>
    </section>
  )
}

