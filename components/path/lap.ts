/**
 * THE BOARD, AS DATA — one lap per level, worked out from pathView (2026-11-05).
 *
 * See content/board.ts for what the board is and why it is not anybody's famous game. This
 * file decides only the SHAPE: which square sits where, and how far round this learner is.
 * Pure — no React, no storage — so scripts/lap-check.mts runs it on plain objects, and the
 * Panel and the Road could draw the same stops tomorrow (face-down tiles, side-stops) from
 * the same function.
 *
 * ONE LEVEL, ONE BOARD. Three corners, the level's rooms, and a stop after every room
 * (one more at the end, since Férias went on 2026-11-10):
 *
 *   squares = 4 + 2n   →   a w × h rectangle with w + h = n + 4
 *
 * so 4 rooms are a 4×4 board, 5 a 4×5, 6 a 5×5, 8 a 6×6. Boards change shape level to
 * level, which is half of what keeps this from looking like a board everybody knows.
 *
 * THE LAP starts on Partida, bottom left, and goes up the left side, along the top, down
 * the right and back along the bottom: Partida → rooms → A mesa (top right, halfway) →
 * rooms → Até agora → home. Até agora — your trip so far — is the last square before
 * Partida (Sam, 2026-11-10: "the last time before next level"): with the level's rooms
 * laid, the token waits there until the level recap has been seen, then comes home.
 *
 * NO DICE (Sam, 2026-11-05). You move by laying rooms: when k of the level's rooms are done,
 * whichever ones they are (order is a suggestion, as on the Panel), the token stands on the
 * square AFTER the k-th room in lap order — so the stop behind a laid room is already turned. Every stop and corner behind the token is
 * reached. The level's rooms laid and the token comes home to Partida, which then opens the
 * practice session and the next board — the same rule as pathLevel.
 *
 * ONLY ROOMS MOVE YOU. An optional voice bonus (a square per room said cold) was removed on
 * 2026-11-09: it showed a stop a room early and gave nothing to keep. Speaking is rewarded by
 * the gold edge on the tile instead.
 */
import type { CalendarRow } from '@/content/calendar'
import { POSTCARDS, boardWalks, type CornerId, type PostcardRef } from '@/content/board'
import type { ChapterId } from '@/content/chapters'
import { chapterOfBairro } from '@/content/gems'
import type { Walk } from '@/content/walks'
import type { Gem } from '@/content/gems'
import type { Purpose } from '@/content/situations'
import { surprisesFor, type Surprise } from '@/content/surprises'
import { boardOrder } from '@/content/board-order'
import type { PathNode, PathView } from './progress'

type Base = { at: number; col: number; row: number; reached: boolean; key: string }

type Body =
  | { kind: 'corner'; corner: CornerId }
  | { kind: 'room'; node: PathNode }
  | { kind: 'postcard'; card: PostcardRef }
  | { kind: 'venue'; gem: Gem }
  | { kind: 'neighbour'; event: CalendarRow }
  /** A vibe sitting dealt onto this level (content/surprises.ts): swearing, flirting, the films. */
  | { kind: 'vibe'; crate: string }

export type Square = Base & Body

export interface Lap {
  /** Which level this is, 0-based, in view.units. */
  index: number
  unitId: string
  w: number
  h: number
  /** In lap order: squares[0] is Partida. */
  squares: Square[]
  /** The square the token stands on. 0 is Partida — the start, or home once complete. */
  token: number
  /**
   * The board finished: every open room laid AND every square on it opened (Sam, 2026-11-10,
   * "Every square"). Then So far turns over, and once it is seen Partida is the finish.
   */
  complete: boolean
  /** Every open room laid — the lessons are done, whatever is still to open. */
  roomsLaid: boolean
  /** Squares turned over and not yet opened, in lap order. Empty when the board is complete. */
  toOpen: Square[]
  /** The language walk this board's venues come from, if any. */
  walk: { id: string; title: string } | null
  /** Rooms of this level laid, and open (not paid-locked). */
  done: number
  open: number
}

/** The w × h of a board for n rooms. Never under 3×3, so there is always a middle. */
export function boardSize(n: number): { w: number; h: number } {
  const m = Math.max(2, n)
  const w = Math.floor((m + 4) / 2)
  return { w, h: m + 4 - w }
}

/** Where lap square i sits on a w × h grid, as [col, row] from the top left. */
export function cellOf(i: number, w: number, h: number): [number, number] {
  if (i === 0) return [0, h - 1]
  if (i < h - 1) return [0, h - 1 - i] //                 up the left
  if (i < h + w - 2) return [i - (h - 1), 0] //           along the top
  if (i < 2 * h + w - 3) return [w - 1, i - (h + w - 2)] // down the right
  return [w - 1 - (i - (2 * h + w - 3)), h - 1] //        back along the bottom
}

/** The lap index of each corner on a w × h board. */
export function cornerAt(w: number, h: number): Record<CornerId, number> {
  return { start: 0, mesa: h + w - 2, trip: 2 * (w + h) - 5 }
}


export function lapOf(
  view: PathView,
  index: number,
  purpose: Purpose,
  opts: {
    /** Gems to draw venues from, in the city's own rotation (content/gems.ts gemRotation). */
    gems: Gem[]
    /** What is on, already filtered to live rows (content/calendar.ts rowsFor). */
    rows: CalendarRow[]
    /** The language walks (content/walks.ts). The board's walk supplies its venues first. */
    walks?: Walk[]
    /** Which city or town (content/chapters.ts). Its own walks come first; absent is Lisbon. */
    chapter?: ChapterId
    /**
     * Whether this level's recap has been seen (recaps_seen). Until it has, a finished board
     * keeps its token on Até agora instead of going home. Absent counts as seen, for the
     * scripts and views that only want the squares.
     */
    recapSeen?: boolean
    /**
     * Lap keys this learner has opened (board_opened). When given, a board is complete only
     * once every square on it is opened; absent, rooms alone decide (scripts, listings).
     */
    opened?: string[]
  },
): Lap {
  const u = view.units[index]
  const nodes = u.nodes
  const n = nodes.length
  const { w, h } = boardSize(n)
  const L = 2 * (w + h) - 4
  const corners = cornerAt(w, h)
  const cornerOf = new Map(Object.entries(corners).map(([k, v]) => [v, k as CornerId]))

  /*
    THE STOPS, TAILORED. Postcards from this reason's own list, carried on across levels so
    the next board does not repeat the last. Venues are the gems these very rooms train for
    (a gem names its room), then the city's rotation. What's on is filtered to this reason
    for being here — a match for a visitor, a deadline for somebody moving.
  */
  const cards = POSTCARDS[purpose]
  const rooms = new Set(nodes.map((x) => x.room.id))
  const trained = opts.gems.filter((g) => rooms.has(g.room))
  const rest = opts.gems.filter((g) => !rooms.has(g.room))
  const k = index % Math.max(1, rest.length)
  /*
    THE BOARD'S WALK FIRST (2026-11-05): its stops in walking order, then the places these
    rooms train for, then the rotation. Only gems that are visible (in opts.gems) count.
  */
  const chapter = opts.chapter ?? 'lisbon'
  const own = (opts.walks ?? []).filter((x) => chapterOfBairro(x.bairro) === chapter).map((x) => x.id)
  const order = boardWalks(chapter, purpose, own)
  const walk = (opts.walks ?? []).find((x) => x.id === order[index % Math.max(1, order.length)]) ?? null
  const byId = new Map(opts.gems.map((g) => [g.id, g]))
  const walked = (walk?.stops ?? []).flatMap((st) => (byId.has(st.gem) ? [byId.get(st.gem)!] : []))
  const venues = [...walked, ...trained, ...rest.slice(k), ...rest.slice(0, k)]
  const rows = opts.rows.filter((r) => r.purposes.includes(purpose))
  let pc = index * 3
  let vn = 0
  let nb = index
  const usedGems = new Set<string>()
  /*
    THE SURPRISES FIRST, SPREAD ROUND THE BOARD (2026-11-09, content/surprises.ts). The level's
    curated surprises — a hack, a bluff, an idiom, a vibe like swearing — take evenly spaced
    stops; the rest are the city's places and what's on, with a postcard only if a town has
    neither. A big level gets more places, not more surprises.
  */
  const nStops = Math.max(0, L - 3 - n)
  const curated = surprisesFor(purpose, index).slice(0, nStops)
  const surpriseAt = new Map<number, Surprise>()
  curated.forEach((x, k) => surpriseAt.set(Math.floor(((k + 0.5) * nStops) / curated.length), x))
  let city = 0
  const stop = (j: number): Body => {
    const sur = surpriseAt.get(j)
    if (sur) return sur.kind === 'vibe' ? { kind: 'vibe', crate: sur.id } : { kind: 'postcard', card: { kind: sur.kind, id: sur.id } }
    const k = city++
    /* While the walk still has places, they come in walking order; otherwise place and what's on alternate. */
    const want = walked.length && k < walked.length * 2 ? (k % 2 === 0 ? 'venue' : 'neighbour') : k % 2 === 0 ? 'venue' : 'neighbour'
    const venue = (): Body | null => {
      while (vn < venues.length && usedGems.has(venues[vn].id)) vn++
      const gem = venues[vn]
      if (!gem) return null
      usedGems.add(gem.id)
      vn++
      return { kind: 'venue', gem }
    }
    const neighbour = (): Body | null => (rows.length ? { kind: 'neighbour', event: rows[nb++ % rows.length] } : null)
    return (want === 'venue' ? venue() ?? neighbour() : neighbour() ?? venue()) ?? { kind: 'postcard', card: cards[pc++ % cards.length] }
  }

  /* The edge: room, stop, room, stop … — padded with stops when a level is one room. */
  const edge: Body[] = []
  const slots = L - 3
  for (let j = 0, r = 0, s = 0; j < slots; j++) {
    if (j % 2 === 0 && r < n) edge.push({ kind: 'room', node: nodes[r++] })
    else edge.push(stop(s++))
  }

  const idOf = (body: Body): string =>
    body.kind === 'corner'
      ? body.corner
      : body.kind === 'room'
        ? body.node.room.id
        : body.kind === 'postcard'
          ? body.card.id
          : body.kind === 'venue'
            ? body.gem.id
            : body.kind === 'vibe'
              ? body.crate
              : body.event.id
  /* Dealt round the lap: corners at their places, the edge between them. */
  let bodies: Body[] = []
  for (let i = 0, e = 0; i < L; i++) {
    const corner = cornerOf.get(i)
    bodies.push(corner ? { kind: 'corner' as const, corner } : edge[e++])
  }
  /*
    OR IN THE ORDER SET BY HAND (content/board-order.ts, from Sam's board map). Named squares
    first, in order; a rotated place or what's on takes the next of its kind; anything left
    over keeps its order, before So far.
  */
  const handOrder = boardOrder(purpose, u.unit.id)
  if (handOrder) {
    const pool = [...bodies]
    const take = (pick: (b: Body) => boolean) => {
      const i = pool.findIndex(pick)
      return i === -1 ? null : pool.splice(i, 1)[0]
    }
    const placed: Body[] = []
    for (const entry of handOrder) {
      const [kind, ...rest] = entry.split(':')
      const id = rest.join(':')
      const b = take((x) => x.kind === kind && idOf(x) === id) ?? (kind === 'venue' || kind === 'neighbour' ? take((x) => x.kind === kind) : null)
      if (b) placed.push(b)
    }
    const trip = placed.findIndex((x) => x.kind === 'corner' && x.corner === 'trip')
    const rest = pool
    if (trip === -1) placed.push(...rest)
    else placed.splice(trip, 0, ...rest)
    if (placed.length === L) bodies = placed
  }
  const squares: Square[] = bodies.map((body, i) => {
    const [col, row] = cellOf(i, w, h)
    return { ...body, at: i, col, row, reached: false, key: purpose + ':' + u.unit.id + ':' + body.kind + ':' + idOf(body) } as Square
  })
  const tripAt = squares.findIndex((x) => x.kind === 'corner' && x.corner === 'trip')

  /* How far round: the k-th room square. */
  const laid = nodes.filter((x) => x.state === 'done').length
  const open = nodes.filter((x) => x.state !== 'paid').length
  /* A board of only paid rooms is never laid: nothing of yours is on it (content/level.ts levelComplete). */
  const roomsLaid = open > 0 && laid >= open
  const roomSquares = squares.filter((s) => s.kind === 'room')
  /*
    EVERY SQUARE (Sam, 2026-11-10: "board two is closing before I have completed it"). What a
    board asks to be opened: every stop — surprise, place, what's on. Not the corners: So far
    is the reward for the rest, and A mesa is an offer the Panel and the Road do not draw.
  */
  const opened = opts.opened ? new Set(opts.opened) : null
  const asked = squares.filter((s) => s.kind !== 'room' && s.kind !== 'corner')
  const toOpenAll = opened ? asked.filter((s) => !opened.has(s.key)) : []
  const complete = roomsLaid && toOpenAll.length === 0
  /*
    YOU LAND ON THE SQUARE AFTER THE ROOM YOU LAID (Sam, 2026-11-05, on his phone: "Shouldn't
    that third tile turn over, as the first two are done?"). A room laid turns over the stop
    that follows it at once — the surprise is the room's reward, not the next room's.
  */
  let token = laid === 0 ? 0 : roomSquares[Math.min(laid, roomSquares.length) - 1].at + 1
  token = Math.min(token, L - 1)
  if (!roomsLaid) {
    for (const s of squares) s.reached = s.at <= token
  } else {
    /* Lessons done: everything is face up but So far, which turns over when the rest is opened. */
    for (const s of squares) s.reached = !(s.kind === 'corner' && s.corner === 'trip') || complete
    /* The token walks to the next square still to open; then So far until it is seen; then home. */
    token = complete ? (opts.recapSeen === false ? tripAt : 0) : toOpenAll[0].at
  }
  const toOpen = toOpenAll.filter((s) => s.reached)

  return { index, unitId: u.unit.id, w, h, squares, token, complete, roomsLaid, toOpen, walk: walk ? { id: walk.id, title: walk.title } : null, done: laid, open }
}
