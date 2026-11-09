'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { InviteSheet } from '@/components/invite/InviteSheet'
import { SpokenLine } from '@/components/Opener'
import { CORNERS, HOLIDAY_PRIZE, type CornerId } from '@/content/board'
import { rowsFor } from '@/content/calendar'
import { CHEATS } from '@/content/cheats'
import { bairroById, gemsHomeFirst, KIND_LABEL, type Gem } from '@/content/gems'
import { IDIOMS } from '@/content/idioms'
import { CRATES, entryRung } from '@/content/roots'
import { WALKS } from '@/content/walks'
import { panelArt } from '@/content/panel'
import type { ChapterId } from '@/content/chapters'
import type { Purpose } from '@/content/situations'
import { markBoardMet, takeHoliday } from '@/engine/learner'
import { track } from '@/engine/analytics'
import type { PathNode, PathView } from './progress'
import { milestoneHref, onHoliday } from './progress'
import { UNLOCK_HREF } from './locks'
import { KindIcon, LockIcon } from './icons'
import { driftOf } from './Panel'
import { lapOf, type Lap, type Square } from './lap'
import { awayText, headliners, roomsAway, stopLabel } from './stop-label'
import { tileVerb, tileWord } from '@/content/panel'
import { CheckIn } from '@/components/city/CheckIn'
import { GemPicture, PhotoCredit, useGemPhoto } from '@/components/city/GemPhoto'
import { AddToCalendar } from '@/components/AddToCalendar'
import { eventOfRow } from '@/content/cal-event'
import { useVenues } from '@/components/city/useVenues'

/**
 * THE BOARD — one level, one lap (Sam, 2026-11-05). What it is: content/board.ts. Where
 * everything sits and how far round you are: lap.ts. This file only draws it, in the
 * Panel's own glaze — cream squares, azulejo blue, gold for said cold — so the three views
 * read as one set.
 *
 *   room        the Panel's tile: blank until laid, blue when laid, gold edge when said
 *               cold, tilted when it has drifted. Tap: the room, or its sheet once laid.
 *   stop        face down (the frieze) until the token has passed it, then turned over:
 *               a postcard, a venue or what's on. A dot until it has been looked at.
 *   corner      Partida, Miradouro, Férias, A mesa — always face up, opened once reached.
 *   token       a gold counter on the square you have reached.
 *
 * The middle of the board is the level's picture, coming through as the rooms are laid.
 */
const SEEN_KEY = 'dub.board.seen'
/** The corners in English, over their Portuguese (Sam, 2026-11-09: "the Portuguese words mean nothing to me"). */
const CORNER_EN: Record<CornerId, string> = { start: 'Start', miradouro: 'Look back', ferias: 'Week off', mesa: 'Your table' }

/* The corners on the warm-up lap: what each will do on every board after it, not an offer now. */
const WARM_UP: Record<Exclude<CornerId, 'start'>, { title: string; body: string }> = {
  miradouro: {
    title: 'Look back, any time',
    body: 'Every board has a viewpoint. From here you can always see — and hear — everything you can already say. It is all kept in Yours.',
  },
  ferias: {
    title: 'A week off, from Board 2',
    body: 'Halfway round every board there is a week off: take it and nothing on your path slips while you are away. On the warm-up lap there is nothing to pause yet — your first is on the next board.',
  },
  mesa: {
    title: 'A real table, later',
    body: 'Every board ends near a table: one dinner with friends where you use what you have learned, out loud. After a board or two you will have enough to host one.',
  },
}

/* What each kind of stop is for, said once on the warm-up lap. */
const STOP_EXPLAINED: Partial<Record<Square['kind'], string>> = {
  vibe: 'Surprises turn over as you lay rooms — the fun stuff, like how to swear. Anything you open is kept in Yours.',
  postcard: 'Surprises turn over as you lay rooms — hacks, bluffs and idioms that hand you words for free. Anything you open is kept in Yours.',
  venue: 'Places are real spots in the city. Each has one line to say there, to a real person. Every board brings new ones.',
  neighbour: 'What is on in the city, with the Portuguese for going. Every board brings what is on that week.',
}

function readList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function Board({
  view,
  purpose,
  chapter,
  current,
  now,
  holidays,
  saidHere,
  gender,
  onLaid,
  beckon = false,
  rung = 1,
  children,
}: {
  view: PathView
  purpose: Purpose
  chapter: ChapterId
  /** The level you are on, 0-based. The board opens there; the arrows go either way. */
  current: number
  now: Date
  holidays: string[]
  /** walk_stops: a venue said there carries its mark. */
  saidHere: string[]
  gender: 'm' | 'f' | null
  onLaid: (n: PathNode) => void
  /** First visit after set-up: the next room's tile says "Start here" (PathHome, ?start=1). */
  beckon?: boolean
  /** How far up the ladder this learner is (rungReached) — whether a vibe square opens yet. */
  rung?: number
  /* Up next, under the board. */
  children?: ReactNode
}) {
  const [index, setIndex] = useState(current)
  useEffect(() => setIndex(current), [current])
  const [seen, setSeen] = useState<string[] | null>(null)
  useEffect(() => {
    setSeen(readList(SEEN_KEY))
  }, [])
  const markSeen = useCallback((key: string) => {
    setSeen((had) => {
      const list = had ?? []
      if (list.includes(key)) return had
      const next = [...list, key]
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(next))
      } catch {
        /* Then the dot stays, which is the quieter failure. */
      }
      return next
    })
  }, [])

  const gems = useMemo(() => gemsHomeFirst(chapter), [chapter])
  const rows = useMemo(() => rowsFor(chapter, now), [chapter, now])
  const lap = useMemo(
    () => (view.units[index] ? lapOf(view, index, purpose, { gems, rows, walks: WALKS, chapter }) : null),
    [view, index, purpose, gems, rows],
  )
  /*
    WHAT THE BOARD TURNED OVER, KEPT (2026-11-05). A postcard, place or what's on is met once
    the token passes it; the level recap and Yours list them after the board has moved on.
    content/level.ts. A record of meeting, never a score.
  */
  useEffect(() => {
    if (!lap) return
    const keys = lap.squares.filter((s) => s.reached && (s.kind === 'postcard' || s.kind === 'venue' || s.kind === 'neighbour' || s.kind === 'vibe')).map((s) => s.key)
    if (keys.length) markBoardMet(keys)
  }, [lap])
  const [open, setOpen] = useState<Square | null>(null)
  const [inviting, setInviting] = useState(false)
  const away = onHoliday({ holidays }, now)
  if (!lap) return null
  const art = panelArt(chapter, purpose)
  const unit = view.units[index]
  const pct = lap.open ? lap.done / lap.open : 1
  const level = index + 1

  const tap = (s: Square) => {
    if (s.kind === 'room') return // rooms are links or open their sheet, as on the Panel
    track('board_square', { kind: s.kind, reached: s.reached })
    if (s.reached) markSeen(s.key)
    setOpen(s)
  }

  return (
    <section aria-labelledby="board-caption" data-testid="board" className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="The board before"
          className="tap-target rounded-full border border-line px-3 py-1 text-muted disabled:opacity-30"
          data-testid="board-prev"
        >
          ←
        </button>
        <p id="board-caption" className="min-w-0 flex-1 text-center text-sm leading-snug text-muted">
          <span className="font-semibold text-fg">
            Board {level} of {view.units.length}
          </span>
          {index === current ? '' : index < current ? ' · done' : ' · ahead'}
        </p>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(view.units.length - 1, i + 1))}
          disabled={index >= view.units.length - 1}
          aria-label="The next board"
          className="tap-target rounded-full border border-line px-3 py-1 text-muted disabled:opacity-30"
          data-testid="board-next"
        >
          →
        </button>
      </div>

      {/*
        ON THIS BOARD (Sam, 2026-11-09: "there is no excitement or sell as to what is on the
        board"). Its headliners, named — the surprises first, then a place and what's on.
      */}
      {headliners(lap).length ? (
        <div className="flex flex-col items-center gap-1.5" data-testid="board-headliners">
          <span className="eyebrow text-[0.65rem] text-accent">On this board</span>
          <ul className="flex flex-wrap justify-center gap-1.5">
            {headliners(lap).map((h) => (
              <li key={h} className="rounded-full border border-line px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide">
                {h}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="panel-frame rounded-[1.25rem] p-2.5">
        <ol
          className="board-grid relative grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${lap.w}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${lap.h}, minmax(0, 1fr))`,
            aspectRatio: `${lap.w} / ${lap.h}`,
          }}
          aria-label={`Board ${level}, ${unit.unit.title}: ${lap.done} of ${lap.open} rooms laid. Start bottom left and go round.`}
          data-w={lap.w}
          data-h={lap.h}
        >
          {lap.squares.map((s) => (
            <li key={s.at} style={{ gridColumn: s.col + 1, gridRow: s.row + 1 }} className="relative [container-type:inline-size]">
              <Cell
                s={s}
                lap={lap}
                purpose={purpose}
                fresh={seen !== null && s.reached && s.kind !== 'room' && !(s.kind === 'corner' && s.corner === 'start') && !seen.includes(s.key)}
                onTap={tap}
                onLaid={onLaid}
                beckon={beckon}
              />
            </li>
          ))}
          <li
            className="board-middle relative overflow-hidden rounded-md [container-type:inline-size]"
            style={{ gridColumn: `2 / ${lap.w}`, gridRow: `2 / ${lap.h}` }}
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${art.src})`, opacity: 0.18 + 0.82 * pct, filter: `saturate(${0.3 + 0.7 * pct})` }}
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#14243a]/80 via-[#14243a]/25 to-transparent" />
            {/*
              TWO CARDS IN THE MIDDLE (Sam, 2026-11-05: "two small cards laid diagonally at the
              centre of the board … Invite a friend and Start a Table"). The two things on the
              Path that need another person, set down across the picture like cards waiting to
              be drawn. In DUB's own glaze — cream, azulejo blue, gold — and named in
              Portuguese first, because every ask teaches. Sized in container units, so they
              are the same cards on a 2×2 middle and a 4×4 one.
            */}
            {/* The invite opens its own sheet here rather than sending people to the foot of Yours (Sam, 2026-11-05). */}
            <BoardCard
              onOpen={() => setInviting(true)}
              pt="Convida um amigo"
              en="Invite a friend"
              icon="friend"
              testid="board-card-invite"
              style={{ left: '7%', top: '9%', transform: 'rotate(-14deg)' }}
            />
            <BoardCard
              href="/table/new"
              pt="Junta uma mesa"
              en="Start a table"
              icon="table"
              testid="board-card-table"
              style={{ right: '7%', top: '30%', transform: 'rotate(10deg)' }}
            />
            <span className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-col text-white">
              <span className="eyebrow text-[0.6rem] opacity-80">Level {level}</span>
              <span className="display text-lg leading-tight sm:text-xl">{unit.unit.title}</span>
              <span className="text-[0.7rem] opacity-80">
                {lap.complete ? 'Laid. Partida opens the next board.' : `${lap.done} of ${lap.open} rooms laid`}
              </span>
            </span>
          </li>
        </ol>
      </div>

      {/*
        THE KEY, ON THE WARM-UP LAP (2026-11-09): which squares teach and which explain.
      */}
      {lap.index === 0 ? (
        <p className="text-center text-xs leading-relaxed text-muted" data-testid="board-key">
          <span className="font-semibold text-fg">Your warm-up lap.</span> The squares that say <span className="font-semibold text-fg">say / count / at the…</span> are your lessons — lay them to go round.
          ✦ surprises · 📍 places · 🎟 what’s on · the corners are the board’s rules. Tap any of them to see how it works.
        </p>
      ) : null}

      {away ? (
        <p className="text-center text-sm text-muted" data-testid="board-away">
          <span className="font-semibold text-fg">On holiday</span> until {dayOf(away)}: nothing slips while you’re away.
        </p>
      ) : null}

      {/*
        "MOVE FURTHER BY VOICE" WENT (Sam, 2026-11-09). An extra square only turned over a stop a
        room early — nothing kept, nothing unlocked — behind a switch few people found. Saying a
        room out loud is rewarded where it shows: the tile's gold edge, the gold mark in Yours,
        the understood count.
      */}

      {children}

      {inviting ? <InviteSheet onClose={() => setInviting(false)} /> : null}

      {open ? (
        <StopSheet
          s={open}
          lap={lap}
          purpose={purpose}
          gender={gender}
          rung={rung}
          away={away}
          holidays={holidays}
          saidHere={saidHere}
          practiceHref={milestoneHref(unit.unit.milestone.cheat)}
          nextLevel={index + 2 <= view.units.length ? index + 2 : null}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  )
}

function dayOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* ------------------------------------------------------------------ one square */

function Cell({
  s,
  lap,
  purpose,
  fresh,
  onTap,
  onLaid,
  beckon = false,
}: {
  s: Square
  lap: Lap
  purpose: Purpose
  fresh: boolean
  onTap: (s: Square) => void
  onLaid: (n: PathNode) => void
  beckon?: boolean
}) {
  const here = lap.token === s.at
  const token = here ? <span aria-hidden className="board-token" data-testid="board-token" /> : null

  if (s.kind === 'room') {
    const { node } = s
    const { room, state, cold, slipping } = node
    const laid = state === 'done'
    const d = slipping ? driftOf(room.id) : null
    const label =
      room.title +
      (laid ? (cold ? ' — laid and glazed: said cold' : ' — laid') : '') +
      (slipping ? ', slid out of place' : '') +
      (state === 'next' ? ' — up next' : '') +
      (state === 'paid' ? ' — locked, unlock with membership' : '') +
      (here ? ' — you are here' : '')
    const cls =
      'board-sq board-room' +
      (laid ? ' is-laid' : '') +
      (cold ? ' is-cold' : '') +
      (d ? ' is-drifted' : '') +
      (state === 'next' ? ' panel-next' : '')
    const style = d ? ({ '--rot': d.rot + 'deg', '--dx': d.dx + 'px', '--dy': d.dy + 'px' } as CSSProperties) : undefined
    const inner = (
      <>
        {/*
          A ROOM SAYS ITS WORD (2026-11-09). It was the kind's icon — a calendar for a moment, a
          pin for a place — the same marks as an event and a place stop, so a lesson read as a
          gig. Its word (content/panel.ts tileWord) says what it is: Hello, 1–20, Airport.
        */}
        <span className="board-kicker">{tileVerb(room)}</span>
        <span className={'board-main' + (longest(tileWord(room)) > 9 ? ' is-long' : '')} data-testid="board-room-word">{tileWord(room)}</span>
        {state === 'paid' ? (
          <span aria-hidden className="absolute right-0.5 top-0.5 rounded-full bg-[#fbfaf6]/90 p-0.5 text-[#14243a]">
            <LockIcon className="h-2.5 w-2.5" />
          </span>
        ) : null}
        {token}
        {/* THE FIRST TILE, NAMED (Sam, 2026-11-09: "show the board before level one starts"). */}
        {beckon && state === 'next' ? (
          <span
            aria-hidden
            data-testid="board-start-here"
            className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#e5b04a] px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-[#14243a] shadow-md"
          >
            Start here
          </span>
        ) : null}
      </>
    )
    const common = { 'aria-label': (beckon && state === 'next' ? 'Start here: ' : '') + label, 'data-testid': 'board-square', 'data-kind': 'room', 'data-state': cold ? 'glazed' : state, 'data-room': room.id, className: cls, style }
    return laid ? (
      <button type="button" onClick={() => onLaid(node)} {...common}>
        {inner}
      </button>
    ) : (
      <Link href={state === 'paid' ? UNLOCK_HREF : '/errand/' + room.id} {...common}>
        {inner}
      </Link>
    )
  }

  if (s.kind === 'corner') {
    const c = CORNERS[purpose][s.corner]
    const finish = s.corner === 'start' && lap.complete
    return (
      <button
        type="button"
        onClick={() => onTap(s)}
        aria-label={(finish ? 'Partida — the practice session, and the next board' : c.title) + (s.reached ? '' : ' — ahead')}
        data-testid="board-square"
        data-kind="corner"
        data-corner={s.corner}
        data-reached={s.reached ? 'true' : undefined}
        className={'board-sq board-corner' + (s.reached ? ' is-reached' : '') + (finish ? ' is-finish' : '')}
      >
        <CornerMark corner={s.corner} />
        {/* English first — what it is to you — and the Portuguese under it, to learn (2026-11-09). */}
        <span className="board-main">{CORNER_EN[s.corner]}</span>
        <span className="board-kicker board-pt" lang="pt-PT">
          {c.pt.toLowerCase()}
        </span>
        {fresh ? <span aria-hidden className="board-new" /> : null}
        {token}
      </button>
    )
  }

  /*
    A STOP SAYS WHAT IT IS, REACHED OR NOT (Sam, 2026-11-09: "name them on the board"). Its
    mark, its kind in English and its name; ahead of the token, greyed with how many rooms
    away. A place is its kind and its bairro — the photo is for its sheet, not the board.
  */
  const l = stopLabel(s)
  const away = roomsAway(s, lap)
  return (
    <button
      type="button"
      onClick={() => onTap(s)}
      aria-label={(l ? l.kind + ': ' + l.title : 'A stop') + (s.reached ? '' : ', ' + awayText(away))}
      data-testid="board-square"
      data-kind={s.kind}
      data-reached={s.reached ? 'true' : undefined}
      className={'board-sq board-stop is-' + s.kind + (s.reached ? ' is-up' : ' is-ahead')}
    >
      {l ? (
        <>
          <span aria-hidden className="board-stop-mark">{l.mark}</span>
          <span className="board-kicker board-stop-kind">{l.kind.toLowerCase()}</span>
          <span className={'board-main board-stop-title' + (longest(l.title) > 9 ? ' is-long' : '')}>{l.title}</span>
          {s.reached ? null : <span className="board-stop-away">{awayText(away)}</span>}
        </>
      ) : null}
      {s.reached && s.kind === 'venue' ? <VenueBadge gem={s.gem.id} /> : null}
      {fresh ? <span aria-hidden className="board-new" /> : null}
      {token}
    </button>
  )
}

/* A venue's count in the corner of its square, and a tick once you've checked in. */
function VenueBadge({ gem }: { gem: string }) {
  const v = useVenues()
  const n = v.counts[gem] ?? 0
  if (v.mine.includes(gem)) return <span aria-hidden className="board-badge is-mine" data-testid="venue-mine">✓</span>
  return n ? (
    <span aria-hidden className="board-badge" data-testid="venue-count">
      {n}
    </span>
  ) : null
}

function CornerMark({ corner }: { corner: CornerId }) {
  const d: Record<CornerId, string> = {
    start: 'M5 19V5m0 0h11l-2 3.5L16 12H5',
    miradouro: 'M3 18h18M6 18l4-7 3 4 2-3 3 6M17 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
    ferias: 'M12 21V9m0 0C9 6 5 6.5 3.5 9 6 8 9 8.5 12 9zm0 0c3-3 7-2.5 8.5 0C18 8 15 8.5 12 9zm0 0c-1-3.5 1-6 3-6.5M6 21h12',
    mesa: 'M4 10h16M6 10l-1 9m13-9 1 9M9 10V7m6 3V7M8 7h8',
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[42%] w-[42%]">
      <path d={d[corner]} />
    </svg>
  )
}

function StopMark({ kind }: { kind: 'postcard' | 'venue' | 'neighbour' | 'vibe' }) {
  const d = {
    postcard: 'M4 6h16v12H4zM4 6l8 6 8-6',
    venue: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    neighbour: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 4v4M16 4v4',
    /* A sparkle: the surprise-and-delight square — swearing, flirting, the films. */
    vibe: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  }[kind]
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[46%] w-[46%]">
      <path d={d} />
    </svg>
  )
}

/* ------------------------------------------------------------------ what a square holds */

function StopSheet({
  s,
  lap,
  purpose,
  gender,
  away,
  holidays,
  saidHere,
  practiceHref,
  nextLevel,
  onClose,
  rung,
}: {
  s: Square
  lap: Lap
  purpose: Purpose
  gender: 'm' | 'f' | null
  rung: number
  away: string | null
  holidays: string[]
  saidHere: string[]
  practiceHref: string
  nextLevel: number | null
  onClose: () => void
}) {
  const close = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const boardKey = purpose + ':' + lap.unitId
  /* The real holiday shows only with a sponsor's prize set AND HOLIDAY_DRAW on (Sam: "put the holiday behind a switch"). */
  const holidayLive = useVenues().holiday
  const taken = holidays.some((h) => h.startsWith(boardKey + '@'))
  const btn = 'tap-target eyebrow block w-full rounded-full bg-accent px-6 py-3 text-center text-accent-ink'
  let eyebrow = ''
  let title = ''
  let body: ReactNode = null

  const ahead = !s.reached
  /*
    THE WARM-UP LAP (Sam, 2026-11-09: "the first board is confused between introductory and
    basics… it needs to be clear the difference between explaining and learning"). On Board 1
    the rooms are the lessons and everything else explains how a board works: each sheet says
    HOW IT WORKS, the corners explain rather than offer — no week off before there is anything
    to pause — and the stops say what they will be on every board after this one.
  */
  const warmUp = lap.index === 0
  if (s.kind === 'corner' && warmUp && s.corner !== 'start') {
    const c = CORNERS[purpose][s.corner]
    eyebrow = 'How it works · ' + c.pt
    title = WARM_UP[s.corner].title
    body = (
      <>
        <p className="text-base leading-relaxed">{WARM_UP[s.corner].body}</p>
        {s.corner === 'miradouro' && !ahead ? (
          <Link href="/profile" className="tap-target eyebrow block w-full rounded-full border border-accent px-6 py-3 text-center text-accent">
            See what I can say
          </Link>
        ) : null}
      </>
    )
  } else if (s.kind === 'corner') {
    const c = CORNERS[purpose][s.corner]
    eyebrow = (warmUp ? 'How it works · ' : '') + (ahead ? 'Ahead' : c.pt)
    title = c.title
    if (s.corner === 'start') {
      body = lap.complete ? (
        <>
          <p className="text-base leading-relaxed">Every room on this board, laid. One practice session, said cold, and you’re round.</p>
          <Link href={practiceHref} className={btn} data-testid="board-practice">
            {nextLevel ? 'Practise · then board ' + nextLevel : 'Practise'}
          </Link>
          <DrawEntry board={purpose + ':' + lap.unitId} />
        </>
      ) : (
        <>
          <p className="text-base leading-relaxed">{c.body}</p>
          {/*
            THE LEVEL'S PRACTICE, ANY TIME — as the Panel's and the Road's keystones always
            offered it (2026-11-09: the three views draw the same content).
          */}
          <Link href={practiceHref} className="tap-target eyebrow block w-full rounded-full border border-accent px-6 py-3 text-center text-accent" data-testid="board-practice-early">
            Practise this level’s shape
          </Link>
        </>
      )
    } else if (ahead) {
      body = <p className="text-base leading-relaxed text-muted">Lay more rooms to get here. {c.body}</p>
    } else if (s.corner === 'miradouro') {
      body = (
        <>
          <p className="text-base leading-relaxed">{c.body}</p>
          <Link href="/profile" className={btn}>
            What I can say
          </Link>
        </>
      )
    } else if (s.corner === 'ferias') {
      body = (
        <>
          <p className="text-base leading-relaxed">{c.body}</p>
          {away ? (
            <p className="text-sm text-muted" data-testid="ferias-away">
              You’re on holiday until {dayOf(away)}.
            </p>
          ) : taken ? (
            <p className="text-sm text-muted">You’ve had this board’s week off. The next one is on the next board.</p>
          ) : (
            <button
              type="button"
              className={btn}
              data-testid="ferias-take"
              onClick={() => {
                takeHoliday(boardKey)
                track('board_holiday', { board: boardKey })
              }}
            >
              Take my week off
            </button>
          )}
          {HOLIDAY_PRIZE && holidayLive ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-[#c9973b] px-4 py-3" data-testid="ferias-prize">
              <p className="eyebrow text-[#c9973b]">And a real one</p>
              <p className="display text-xl">{HOLIDAY_PRIZE.title}</p>
              <p className="text-sm leading-relaxed">{HOLIDAY_PRIZE.body}</p>
              <a href={HOLIDAY_PRIZE.href} className="eyebrow text-accent underline">
                Enter
              </a>
              <p className="text-xs text-muted">{HOLIDAY_PRIZE.terms}</p>
            </div>
          ) : null}
        </>
      )
    } else {
      const tasca = lap.squares.find((x) => x.kind === 'venue' && x.gem.kind === 'tasca')
      body = (
        <>
          <p className="text-base leading-relaxed">{c.body}</p>
          <Link href={'/table/new' + (tasca && tasca.kind === 'venue' ? '?gem=' + tasca.gem.id : '')} className={btn} data-testid="board-table">
            {purpose === 'visiting' ? 'Set the table' : 'Host a table'}
          </Link>
        </>
      )
    }
  } else if (ahead) {
    /* Named, as its square is: what it is and how many rooms until it turns over. */
    const l = stopLabel(s)
    eyebrow = (warmUp ? 'How it works · ' : '') + (l ? l.kind : 'Ahead')
    title = l?.title ?? 'Further round'
    body = (
      <>
        <p className="text-base leading-relaxed">
          {awayText(roomsAway(s, lap)).replace('away', 'more')} and it turns over. {warmUp ? STOP_EXPLAINED[s.kind] ?? '' : ''}
        </p>
      </>
    )
  } else if (s.kind === 'postcard' && s.card.kind === 'cheat') {
    const cheat = CHEATS.find((x) => x.id === s.card.id)!
    eyebrow = 'Postcard · ' + (cheat.kind === 'bluff' ? 'a bluff' : cheat.kind === 'hack' ? 'a hack' : 'a cheat')
    title = cheat.shape
    body = (
      <>
        <p className="text-base leading-relaxed">{cheat.does}</p>
        {cheat.says[0] ? <SpokenLine pt={cheat.says[0].pt} en={cheat.says[0].en} size="md" /> : null}
        <Link href={milestoneHref(cheat.id)} className={btn}>
          Try it out loud
        </Link>
      </>
    )
  } else if (s.kind === 'postcard') {
    const idiom = IDIOMS.find((x) => x.id === s.card.id)!
    eyebrow = 'Postcard · lost in translation'
    title = '“' + idiom.literal + '”'
    body = (
      <>
        <p className="text-base leading-relaxed text-muted">{idiom.wtf} It’s “{idiom.english}”. Portugal says:</p>
        <SpokenLine pt={idiom.equivalent} en={idiom.gloss} size="md" />
        <Link href={'/revise?kind=idiom&id=' + encodeURIComponent(idiom.id)} className={btn}>
          Play the card
        </Link>
      </>
    )
  } else if (s.kind === 'venue') {
    const g = s.gem
    const said = saidHere.includes('gem:' + g.id)
    /* The board's walk in full, whether this place is one of its stops, and whether any walk has been walked. */
    const walk = lap.walk ? WALKS.find((w) => w.id === lap.walk!.id) ?? null : null
    const onWalk = Boolean(walk?.stops.some((st) => st.gem === g.id))
    const walkedAny = saidHere.length > 0
    eyebrow = KIND_LABEL[g.kind] + ' · ' + bairroById(g.bairro).name
    title = g.name
    body = (
      <>
        <VenueHero gem={g} />
        <p className="text-base leading-relaxed">{g.why}</p>
        <SpokenLine pt={gender === 'f' && g.line.f ? g.line.f : g.line.pt} en={g.line.en} size="md" />
        {said ? <p className="text-sm font-semibold text-correct">You’ve said it here.</p> : null}
        {/*
          THE WALK, INTRODUCED BEFORE IT IS ASKED FOR (Sam, 2026-11-09: "directions and check in
          are premature here. I haven't discovered language walks, so I need to be introduced to
          the concept"). Somebody who has never walked one is told what a language walk is —
          this place is a stop on one — and offered it; once they have walked any stop, it is
          the one line it was. Check in waits for that too: it is the walk's own gesture.
        */}
        {walk && onWalk && !walkedAny ? (
          <div className="flex flex-col gap-2 rounded-2xl border-2 border-[#e5b04a] bg-[#e5b04a]/10 px-4 py-4" data-testid="board-walk-intro">
            <p className="eyebrow text-[0.65rem] text-accent">
              A language walk ·{' '}
              <span lang="pt-PT" className="pt normal-case tracking-normal">
                {walk.pt}
              </span>
            </p>
            <p className="display text-lg leading-tight">{walk.title}</p>
            <p className="text-sm leading-relaxed">
              {walk.stops.length} places in {bairroById(walk.bairro).name} · {walk.when}. At each one there is one line to say — to a real
              person, in the street. This place is one of them.
            </p>
            <Link href={'/walk/' + walk.id} className={btn} data-testid="board-walk">
              See the walk
            </Link>
          </div>
        ) : null}
        {walkedAny ? <CheckIn gem={g.id} /> : null}
        {walk && onWalk && walkedAny ? (
          <Link href={'/walk/' + walk.id} className="eyebrow self-center text-accent underline-offset-4 hover:underline" data-testid="board-walk">
            Part of {walk.title} →
          </Link>
        ) : null}
        <Link href={'/city?gem=' + g.id} className="self-center text-sm text-muted underline underline-offset-4" data-testid="board-venue">
          Where it is, and more about it
        </Link>
      </>
    )
  } else if (s.kind === 'vibe') {
    /*
      JUST FOR FUN, ON ITS LEVEL (2026-11-09, content/surprises.ts). The vibes that had a row
      of their own under the path — swearing, flirting, the films — are dealt onto the board.
      Opens when the ladder says so (entryRung, the sitting's own gate); until then it says how.
    */
    const crate = CRATES.find((x) => x.id === s.crate)
    const open = crate ? entryRung(crate) <= rung : false
    eyebrow = 'Just for fun'
    title = crate?.title ?? s.crate
    body = (
      <>
        {crate?.blurb ? <p className="text-base leading-relaxed">{crate.blurb}</p> : null}
        {open ? (
          <Link href={'/vibes?open=' + encodeURIComponent(s.crate)} className={btn} data-testid="board-vibe-open">
            Open it
          </Link>
        ) : (
          <p className="text-sm leading-relaxed text-muted" data-testid="board-vibe-locked">
            Say one of this level’s rooms out loud, with nothing on screen, and it opens.
          </p>
        )}
      </>
    )
  } else if (s.kind === 'neighbour') {
    const r = s.event
    eyebrow = 'What’s on'
    title = r.name
    body = (
      <>
        <p className="text-base leading-relaxed">
          {dayOf(r.on + 'T12:00:00Z')}
          {r.where ? ' · ' + r.where.name : ''}
        </p>
        {/* Sam, 2026-11-05: "Anytime there is an event on a board … add it to calendar". */}
        <AddToCalendar event={eventOfRow(r)} up className="self-start" />
        <Link href="/calendar" className={btn}>
          See what’s on
        </Link>
      </>
    )
  }

  /* On the warm-up lap every stop also says what it is for, on every board after this one. */
  if (warmUp && s.kind !== 'corner' && !ahead) {
    eyebrow = 'How it works · ' + eyebrow
    body = (
      <>
        <p className="rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed" data-testid="board-how-it-works">
          {STOP_EXPLAINED[s.kind]}
        </p>
        {body}
      </>
    )
  }

  /* On document.body, as the TileSheet is drawn after the nav: a sheet under the tab bar is half a sheet. */
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" data-testid="board-sheet">
      <button type="button" aria-label="Back to the board" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-sheet-title"
        className="sheet-up relative flex max-h-[88svh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-3xl bg-bg-elev px-5 pt-4 text-fg"
        style={{ paddingBottom: 'calc(2rem + var(--safe-bottom, 0px))' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="eyebrow text-muted">{eyebrow}</p>
            <h2 id="board-sheet-title" className="display text-balance text-2xl">
              {title}
            </h2>
          </div>
          {/* Back to the board, said as where it goes (Sam, 2026-11-09: "Close buttons should read back to Board"). */}
          <button ref={close} type="button" onClick={onClose} aria-label="Back to the board" className="tap-target eyebrow shrink-0 rounded-full border border-line px-3 py-1 text-muted">
            ‹ Board
          </button>
        </div>
        {body}
      </div>
    </div>,
    document.body,
  )
}

/**
 * A FINISHED BOARD IN THE PRIZE DRAW (Sam, 2026-11-05) — only while PRIZE_DRAW is on, and
 * checked on the server against the learner's own record (app/api/draw). Off: nothing shows.
 */
function DrawEntry({ board }: { board: string }) {
  const v = useVenues()
  const [state, setState] = useState<{ result: string; entries?: number; venuesToGo?: number } | null>(null)
  useEffect(() => {
    if (!v.draw || !v.signedIn || state) return
    void fetch('/api/draw', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ board }) })
      .then((r) => r.json())
      .then((j) => {
        setState(j)
        if (j.result === 'in') track('draw_entered', { board })
      })
      .catch(() => setState({ result: 'error' }))
  }, [v.draw, v.signedIn, board, state])
  if (!v.draw) return null
  if (!v.signedIn) {
    return (
      <Link href={'/signin?next=' + encodeURIComponent('/club')} className="text-center text-sm font-semibold text-accent" data-testid="draw-signin">
        Sign in to be entered in this month’s prize draw →
      </Link>
    )
  }
  if (state?.result !== 'in') return null
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#c9973b] px-4 py-3 text-center" data-testid="draw-in">
      <p className="eyebrow text-[#c9973b]">You’re in the draw</p>
      <p className="text-sm">
        {state.entries === 1 ? '1 entry' : state.entries + ' entries'} this month.
        {state.venuesToGo ? ` Say it at the ${state.venuesToGo === 1 ? 'last place' : state.venuesToGo + ' places'} on this board for another.` : ''}
      </p>
      <Link href="/draw" className="text-xs text-muted underline">
        How the draw works
      </Link>
    </div>
  )
}

/**
 * A card waiting on the middle of the board: a cream card with a blue frame, an icon, the
 * Portuguese and the English. A link, so it is reachable by keyboard and says where it goes.
 */
function BoardCard({
  href,
  onOpen,
  pt,
  en,
  icon,
  testid,
  style,
}: {
  href?: string
  onOpen?: () => void
  pt: string
  en: string
  icon: 'friend' | 'table'
  testid: string
  style: CSSProperties
}) {
  const cls =
    'absolute flex aspect-[3/2] w-[40%] flex-col items-center justify-center gap-[3%] rounded-[6%] border-[0.35cqw] border-[#1f5d8c] bg-[#fbf6ec] p-[3%] text-center text-[#14243a] shadow-[0_6px_14px_rgba(10,20,40,0.35)] outline outline-1 outline-offset-[-3cqw] outline-[#1f5d8c]/40 transition hover:-translate-y-0.5'
  const face = (
    <>
      <svg aria-hidden viewBox="0 0 24 24" className="h-[28%] w-auto text-[#1f5d8c]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        {icon === 'friend' ? (
          <>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19a5.5 5.5 0 0111 0" />
            <path d="M18 8v6M15 11h6" />
          </>
        ) : (
          <>
            <path d="M3 9h18M5 9v10M19 9v10M8 9l1-4h6l1 4" />
          </>
        )}
      </svg>
      <span lang="pt-PT" className="pt font-semibold leading-tight text-[#1f5d8c]" style={{ fontSize: 'clamp(0.5rem, 5.4cqw, 0.95rem)' }}>
        {pt}
      </span>
      <span className="eyebrow leading-none text-[#14243a]/70" style={{ fontSize: 'clamp(0.4rem, 3.4cqw, 0.6rem)' }}>
        {en}
      </span>
    </>
  )
  const tap = () => track('board_card', { card: icon })
  return onOpen ? (
    <button
      type="button"
      data-testid={testid}
      aria-haspopup="dialog"
      onClick={() => {
        tap()
        onOpen()
      }}
      className={cls}
      style={style}
    >
      {face}
    </button>
  ) : (
    <Link href={href ?? '/'} data-testid={testid} onClick={tap} className={cls} style={style}>
      {face}
    </Link>
  )
}

/** The place, seen, at the top of its sheet — with the photographer's credit, as Google requires. */
function VenueHero({ gem }: { gem: Gem }) {
  const { ref, photo } = useGemPhoto(gem.id, 640)
  return (
    <div ref={ref} className="flex flex-col gap-1">
      <GemPicture kind={gem.kind} photo={photo} big className="h-40 w-full rounded-2xl" />
      <PhotoCredit photo={photo} />
    </div>
  )
}

/** The longest single word in a label: what decides whether it fits a square at full size. */
function longest(text: string): number {
  return Math.max(0, ...text.split(/\s+/).map((w) => w.length))
}
