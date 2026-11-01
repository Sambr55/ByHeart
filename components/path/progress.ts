/**
 * Where the learner is on the path — derived, never stored.
 *
 * Everything here reads records the product already writes, so the path needs no storage
 * of its own and cannot disagree with the rest of DUB:
 *
 *   a room is DONE        when its id is in `finished_cards`. Errand's bank() writes that
 *                         on both the cold claim and the reveal (components/Errand.tsx).
 *   a room is SAID COLD   when `proof` holds its release answer with `clean: true` — the
 *                         same line, the same flag the proof card counts.
 *   a milestone's STARS   are how many of its cheat's three sentences are in `proof` clean.
 *                         /revise?kind=cheat records each one it hears cold.
 *   the STREAK            is consecutive local days with any proof line, any evidence or
 *                         any mission finished. See dayStreak.
 *
 * Pure: no React, no localStorage. scripts/path-check.mts runs it on plain objects.
 */
import type { LearnerState } from '@/engine/learner'
import type { ResolvedUnit } from '@/content/path'
import type { Situation } from '@/content/situations'
import { CHEATS } from '@/content/cheats'

export type PathRecord = Pick<
  LearnerState,
  'finished_cards' | 'proof' | 'evidence' | 'mission_completed_at'
>

export function roomDone(r: PathRecord, id: string): boolean {
  return (r.finished_cards ?? []).includes(id)
}

export function roomSaidCold(r: PathRecord, room: Situation): boolean {
  return (r.proof ?? []).some((p) => p.pt === room.release.answer && p.clean)
}

/** 0–3: the cheat's sentences said clean. */
export function milestoneStars(r: PathRecord, cheatId: string): number {
  const cheat = CHEATS.find((c) => c.id === cheatId)
  if (!cheat) return 0
  const clean = new Set((r.proof ?? []).filter((p) => p.clean).map((p) => p.pt))
  return Math.min(3, cheat.says.filter((l) => clean.has(l.pt)).length)
}

export function milestoneHref(cheatId: string): string {
  return '/revise?kind=cheat&id=' + encodeURIComponent(cheatId)
}

export type NodeState = 'done' | 'next' | 'open' | 'paid'

export interface PathNode {
  room: Situation
  state: NodeState
  cold: boolean
}

export interface PathView {
  units: { unit: ResolvedUnit; nodes: PathNode[]; done: number; stars: number }[]
  /** The one suggested room: first on the path that is open and not done. */
  next: { room: Situation; unit: ResolvedUnit } | null
  done: number
  total: number
}

/**
 * The whole path, with each node's state.
 *
 * `lock` answers whether a room is paid-locked for this learner. Order never locks
 * anything: `next` only decides which open room gets the glow.
 */
export function pathView(
  r: PathRecord,
  units: ResolvedUnit[],
  lock: (id: string) => 'open' | 'paid',
): PathView {
  let next: PathView['next'] = null
  let done = 0
  let total = 0
  const out = units.map((unit) => {
    let unitDone = 0
    const nodes = unit.rooms.map((room): PathNode => {
      total++
      const isDone = roomDone(r, room.id)
      const cold = isDone && roomSaidCold(r, room)
      if (isDone) {
        done++
        unitDone++
        return { room, state: 'done', cold }
      }
      if (lock(room.id) === 'paid') return { room, state: 'paid', cold: false }
      if (!next) {
        next = { room, unit }
        return { room, state: 'next', cold: false }
      }
      return { room, state: 'open', cold: false }
    })
    return { unit, nodes, done: unitDone, stars: milestoneStars(r, unit.milestone.cheat) }
  })
  return { units: out, next, done, total }
}

/** A local calendar day, YYYY-MM-DD. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}

/** Every moment the learner did something, as ISO strings. */
export function activityTimes(r: PathRecord): string[] {
  return [
    ...(r.proof ?? []).map((p) => p.at),
    ...(r.evidence ?? []).map((e) => e.timestamp),
    ...Object.values(r.mission_completed_at ?? {}).filter((t): t is string => Boolean(t)),
  ]
}

/**
 * Consecutive days with activity, ending today — or ending yesterday, because a streak
 * is not broken at midnight, only by a whole day missed.
 *
 * `today` says whether today already counts, so the flame can say "keep it going" rather
 * than pretend the day is done.
 */
export function dayStreak(
  times: string[],
  now = new Date(),
  day: (d: Date) => string = localDay,
): { days: number; today: boolean } {
  const days = new Set(
    times
      .map((t) => new Date(t))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map(day),
  )
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  const today = days.has(day(cursor))
  if (!today) cursor.setDate(cursor.getDate() - 1)
  let n = 0
  while (days.has(day(cursor))) {
    n++
    cursor.setDate(cursor.getDate() - 1)
  }
  return { days: n, today }
}
