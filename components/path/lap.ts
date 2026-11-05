/**
 * THE BOARD, AS DATA — one lap per level, worked out from pathView (2026-11-05).
 *
 * See content/board.ts for what the board is and why it is not anybody's famous game. This
 * file decides only the SHAPE: which square sits where, and how far round this learner is.
 * Pure — no React, no storage — so scripts/lap-check.mts runs it on plain objects, and the
 * Panel and the Road could draw the same stops tomorrow (face-down tiles, side-stops) from
 * the same function.
 *
 * ONE LEVEL, ONE BOARD. Four corners, the level's rooms, and one stop after every room:
 *
 *   squares = 4 + 2n   →   a w × h rectangle with w + h = n + 4
 *
 * so 4 rooms are a 4×4 board, 5 a 4×5, 6 a 5×5, 8 a 6×6. Boards change shape level to
 * level, which is half of what keeps this from looking like a board everybody knows.
 *
 * THE LAP starts on Partida, bottom left, and goes up the left side, along the top, down
 * the right and back along the bottom: Partida → rooms → Miradouro → rooms → Férias →
 * rooms → A mesa → rooms → home. Corners sit at the quarters, so the holiday is halfway.
 *
 * NO DICE (Sam, 2026-11-05). You move by laying rooms: when k of the level's rooms are done,
 * whichever ones they are (order is a suggestion, as on the Panel), the token stands on the
 * square AFTER the k-th room in lap order — so the stop behind a laid room is already turned. Every stop and corner behind the token is
 * reached. The level's rooms laid and the token comes home to Partida, which then opens the
 * practice session and the next board — the same rule as pathLevel.
 *
 * VOICE, IF YOU WANT IT ("Voice progression needs to be optional"): with it on, every room
 * said cold moves the token one square further. It can carry you to a surprise or the
 * holiday sooner; it can never lay a room for you or finish a level, because only the rooms
 * do that.
 */
import type { CalendarRow } from '@/content/calendar'
import { POSTCARDS, type CornerId, type PostcardRef } from '@/content/board'
import type { Gem } from '@/content/gems'
import type { Purpose } from '@/content/situations'
import type { PathNode, PathView } from './progress'

type Base = { at: number; col: number; row: number; reached: boolean; key: string }

type Body =
  | { kind: 'corner'; corner: CornerId }
  | { kind: 'room'; node: PathNode }
  | { kind: 'postcard'; card: PostcardRef }
  | { kind: 'venue'; gem: Gem }
  | { kind: 'neighbour'; event: CalendarRow }

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
  /** Every open room of the level laid: Partida is now the finish. */
  complete: boolean
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
  return { start: 0, miradouro: h - 1, ferias: h + w - 2, mesa: 2 * h + w - 3 }
}

const STOPS = ['postcard', 'venue', 'neighbour'] as const

export function lapOf(
  view: PathView,
  index: number,
  purpose: Purpose,
  opts: {
    /** Gems to draw venues from, in the city's own rotation (content/gems.ts gemRotation). */
    gems: Gem[]
    /** What is on, already filtered to live rows (content/calendar.ts rowsFor). */
    rows: CalendarRow[]
    voice?: boolean
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
  const venues = [...trained, ...rest.slice(k), ...rest.slice(0, k)]
  const rows = opts.rows.filter((r) => r.purposes.includes(purpose))
  let pc = index * 3
  let vn = 0
  let nb = index
  const usedGems = new Set<string>()
  const stop = (j: number): Body => {
    const want = STOPS[j % 3]
    if (want === 'venue') {
      while (vn < venues.length && usedGems.has(venues[vn].id)) vn++
      const gem = venues[vn]
      if (gem) {
        usedGems.add(gem.id)
        vn++
        return { kind: 'venue', gem }
      }
    }
    if (want === 'neighbour' && rows.length) return { kind: 'neighbour', event: rows[nb++ % rows.length] }
    return { kind: 'postcard', card: cards[pc++ % cards.length] }
  }

  /* The edge: room, stop, room, stop … — padded with stops when a level is one room. */
  const edge: Body[] = []
  const slots = L - 4
  for (let j = 0, r = 0, s = 0; j < slots; j++) {
    if (j % 2 === 0 && r < n) edge.push({ kind: 'room', node: nodes[r++] })
    else edge.push(stop(s++))
  }

  const squares: Square[] = []
  for (let i = 0, e = 0; i < L; i++) {
    const [col, row] = cellOf(i, w, h)
    const corner = cornerOf.get(i)
    const body = corner ? { kind: 'corner' as const, corner } : edge[e++]
    const id =
      body.kind === 'corner'
        ? body.corner
        : body.kind === 'room'
          ? body.node.room.id
          : body.kind === 'postcard'
            ? body.card.id
            : body.kind === 'venue'
              ? body.gem.id
              : body.event.id
    squares.push({ ...body, at: i, col, row, reached: false, key: purpose + ':' + u.unit.id + ':' + body.kind + ':' + id } as Square)
  }

  /* How far round: the k-th room square, plus a square for every room said cold if asked. */
  const laid = nodes.filter((x) => x.state === 'done').length
  const open = nodes.filter((x) => x.state !== 'paid').length
  const complete = open > 0 ? laid >= open : nodes.every((x) => x.state === 'paid')
  const roomSquares = squares.filter((s) => s.kind === 'room')
  /*
    YOU LAND ON THE SQUARE AFTER THE ROOM YOU LAID (Sam, 2026-11-05, on his phone: "Shouldn't
    that third tile turn over, as the first two are done?"). A room laid turns over the stop
    that follows it at once — the surprise is the room's reward, not the next room's.
  */
  let token = laid === 0 ? 0 : roomSquares[Math.min(laid, roomSquares.length) - 1].at + 1
  if (opts.voice) token += nodes.filter((x) => x.cold).length
  token = Math.min(token, L - 1)
  for (const s of squares) s.reached = complete || s.at <= token
  if (complete) token = 0

  return { index, unitId: u.unit.id, w, h, squares, token, complete, done: laid, open }
}
