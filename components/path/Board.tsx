'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SpokenLine } from '@/components/Opener'
import { CORNERS, HOLIDAY_PRIZE, type CornerId } from '@/content/board'
import { rowsFor } from '@/content/calendar'
import { CHEATS } from '@/content/cheats'
import { bairroById, gemsHomeFirst, KIND_LABEL } from '@/content/gems'
import { IDIOMS } from '@/content/idioms'
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
import { CheckIn } from '@/components/city/CheckIn'
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
const VOICE_KEY = 'dub.board.voice'

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
  /* Up next, under the board. */
  children?: ReactNode
}) {
  const [index, setIndex] = useState(current)
  useEffect(() => setIndex(current), [current])
  /*
    VOICE, OFF UNLESS ASKED (Sam: "Voice progression needs to be optional"). A preference
    about the game on this phone, like the Panel | Road choice, so it lives in localStorage.
  */
  const [voice, setVoice] = useState(false)
  const [seen, setSeen] = useState<string[] | null>(null)
  useEffect(() => {
    setVoice(readList(VOICE_KEY)[0] === 'on')
    setSeen(readList(SEEN_KEY))
  }, [])
  const chooseVoice = (on: boolean) => {
    setVoice(on)
    track('board_voice', { on })
    try {
      window.localStorage.setItem(VOICE_KEY, JSON.stringify([on ? 'on' : 'off']))
    } catch {
      /* The choice lasts as long as the screen. */
    }
  }
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
    () => (view.units[index] ? lapOf(view, index, purpose, { gems, rows, voice, walks: WALKS, chapter }) : null),
    [view, index, purpose, gems, rows, voice],
  )
  /*
    WHAT THE BOARD TURNED OVER, KEPT (2026-11-05). A postcard, place or what's on is met once
    the token passes it; the level recap and Yours list them after the board has moved on.
    content/level.ts. A record of meeting, never a score.
  */
  useEffect(() => {
    if (!lap) return
    const keys = lap.squares.filter((s) => s.reached && (s.kind === 'postcard' || s.kind === 'venue' || s.kind === 'neighbour')).map((s) => s.key)
    if (keys.length) markBoardMet(keys)
  }, [lap])
  const [open, setOpen] = useState<Square | null>(null)
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
            <li key={s.at} style={{ gridColumn: s.col + 1, gridRow: s.row + 1 }} className="relative">
              <Cell
                s={s}
                lap={lap}
                purpose={purpose}
                fresh={seen !== null && s.reached && s.kind !== 'room' && !(s.kind === 'corner' && s.corner === 'start') && !seen.includes(s.key)}
                onTap={tap}
                onLaid={onLaid}
              />
            </li>
          ))}
          <li
            aria-hidden
            className="board-middle relative overflow-hidden rounded-md"
            style={{ gridColumn: `2 / ${lap.w}`, gridRow: `2 / ${lap.h}` }}
          >
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${art.src})`, opacity: 0.18 + 0.82 * pct, filter: `saturate(${0.3 + 0.7 * pct})` }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#14243a]/80 via-[#14243a]/25 to-transparent" />
            <span className="absolute inset-x-2 bottom-2 flex flex-col text-white">
              <span className="eyebrow text-[0.6rem] opacity-80">Level {level}</span>
              <span className="display text-lg leading-tight sm:text-xl">{unit.unit.title}</span>
              <span className="text-[0.7rem] opacity-80">
                {lap.complete ? 'Laid. Partida opens the next board.' : `${lap.done} of ${lap.open} rooms laid`}
              </span>
            </span>
          </li>
        </ol>
      </div>

      {away ? (
        <p className="text-center text-sm text-muted" data-testid="board-away">
          <span className="font-semibold text-fg">On holiday</span> until {dayOf(away)}: nothing slips while you’re away.
        </p>
      ) : null}

      <label className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-bg-elev px-4 py-3" data-testid="board-voice">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Move further by voice</span>
          <span className="block text-xs text-muted">Every room said out loud, with nothing on screen, moves you one more square.</span>
        </span>
        <input
          type="checkbox"
          checked={voice}
          onChange={(e) => chooseVoice(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-[#1f5d8c]"
        />
      </label>

      {children}

      {open ? (
        <StopSheet
          s={open}
          lap={lap}
          purpose={purpose}
          gender={gender}
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
}: {
  s: Square
  lap: Lap
  purpose: Purpose
  fresh: boolean
  onTap: (s: Square) => void
  onLaid: (n: PathNode) => void
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
        <KindIcon kind={room.kind} className="h-[46%] w-[46%]" />
        {state === 'paid' ? (
          <span aria-hidden className="absolute right-0.5 top-0.5 rounded-full bg-[#fbfaf6]/90 p-0.5 text-[#14243a]">
            <LockIcon className="h-2.5 w-2.5" />
          </span>
        ) : null}
        {token}
      </>
    )
    const common = { 'aria-label': label, 'data-testid': 'board-square', 'data-kind': 'room', 'data-state': cold ? 'glazed' : state, 'data-room': room.id, className: cls, style }
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
        <span className="board-corner-word" lang="pt-PT">
          {c.pt}
        </span>
        {fresh ? <span aria-hidden className="board-new" /> : null}
        {token}
      </button>
    )
  }

  /* A stop: face down until reached. */
  const what = s.kind === 'postcard' ? 'A postcard' : s.kind === 'venue' ? 'A place' : 'What’s on'
  return (
    <button
      type="button"
      onClick={() => onTap(s)}
      aria-label={s.reached ? what : 'A surprise, ahead'}
      data-testid="board-square"
      data-kind={s.kind}
      data-reached={s.reached ? 'true' : undefined}
      className={'board-sq board-stop' + (s.reached ? ' is-up' : ' panel-frieze')}
    >
      {s.reached ? <StopMark kind={s.kind} /> : null}
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

function StopMark({ kind }: { kind: 'postcard' | 'venue' | 'neighbour' }) {
  const d = {
    postcard: 'M4 6h16v12H4zM4 6l8 6 8-6',
    venue: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    neighbour: 'M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 10h16M8 4v4M16 4v4',
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
}: {
  s: Square
  lap: Lap
  purpose: Purpose
  gender: 'm' | 'f' | null
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
  if (s.kind === 'corner') {
    const c = CORNERS[purpose][s.corner]
    eyebrow = ahead ? 'Ahead' : c.pt
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
        <p className="text-base leading-relaxed">{c.body}</p>
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
    eyebrow = 'Face down'
    title = 'A surprise, further round'
    body = <p className="text-base leading-relaxed text-muted">Lay the rooms before it and it turns over.</p>
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
    eyebrow = KIND_LABEL[g.kind] + ' · ' + bairroById(g.bairro).name
    title = g.name
    body = (
      <>
        <p className="text-base leading-relaxed">{g.why}</p>
        <SpokenLine pt={gender === 'f' && g.line.f ? g.line.f : g.line.pt} en={g.line.en} size="md" />
        {said ? <p className="text-sm font-semibold text-correct">You’ve said it here.</p> : null}
        <CheckIn gem={g.id} />
        <Link href={'/city?gem=' + g.id} className={btn} data-testid="board-venue">
          Directions and more
        </Link>
        {lap.walk ? (
          <Link href={'/walk/' + lap.walk.id} className="eyebrow self-center text-accent underline-offset-4 hover:underline" data-testid="board-walk">
            Part of {lap.walk.title} →
          </Link>
        ) : null}
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

  /* On document.body, as the TileSheet is drawn after the nav: a sheet under the tab bar is half a sheet. */
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" data-testid="board-sheet">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/45" />
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
          <button ref={close} type="button" onClick={onClose} className="tap-target eyebrow shrink-0 rounded-full border border-line px-3 py-1 text-muted">
            Close
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
