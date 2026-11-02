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
import { roomPieceIds } from '@/content/roots'

/*
  `inventory` is optional so every record written before the Wall — and every plain object
  in scripts/path-check.mts — still reads as a path. Without it nothing can be slipping,
  which is the right answer for a record that holds no words.
*/
export type PathRecord = Pick<
  LearnerState,
  'finished_cards' | 'proof' | 'evidence' | 'mission_completed_at'
> &
  Partial<Pick<LearnerState, 'inventory'>>

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
  /**
   * WORTH ANOTHER LOOK — a laid tile with a hairline crack (the Wall, Sam, 2026-11-02).
   *
   * Only ever true of a DONE room: a crack is something that happens to a tile already
   * laid, and an unlaid one has nothing to slip. See roomSlipping for what counts. It is
   * never shown in red and it never takes the tile away — a room you did is a room you
   * did, and a wall that lost bricks for not visiting would be a streak by another name.
   */
  slipping: boolean
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
  /* Injectable for the check script; slipping is the only thing that reads the clock. */
  now: Date = new Date(),
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
        return { room, state: 'done', cold, slipping: roomSlipping(r, room, now) }
      }
      if (lock(room.id) === 'paid') return { room, state: 'paid', cold: false, slipping: false }
      if (!next) {
        next = { room, unit }
        return { room, state: 'next', cold: false, slipping: false }
      }
      return { room, state: 'open', cold: false, slipping: false }
    })
    return { unit, nodes, done: unitDone, stars: milestoneStars(r, unit.milestone.cheat) }
  })
  return { units: out, next, done, total }
}

/**
 * How long a room's words can go untouched before the tile shows a hairline crack.
 *
 * Fourteen days, from the Wall's design (2026-11-02): long enough that one quiet week does
 * not crack anything, short enough that a crack still means the words have gone quiet.
 */
export const SLIP_DAYS = 14

/**
 * IS THIS LAID ROOM WORTH ANOTHER LOOK? (the Wall, Sam, 2026-11-02)
 *
 * Read from the words the room handed over (its `pieces`, via roomPieceIds) — never stored,
 * like everything else in this file. A room is slipping when ANY of its words is:
 *
 *   flagged     latest_state is NEEDS ANOTHER LOOK — the one honest signal, written by
 *               revealPieces when a sentence had to be shown (engine/learner.ts). It is
 *               rarely written, which is why there is a second rule;
 *   untouched   the last time the word was recalled is more than SLIP_DAYS ago.
 *
 * "Last recalled" is latest_recall_at first. It is null for most words — it is only set by
 * a cold, delayed or checkpoint recall — so it falls back to the newest evidence for the
 * word, and then to the newest clean proof of the room's own release line. Saying the room
 * cold again is the thing that should clear the crack, and this is what makes it.
 *
 * A word with no timestamp anywhere is NOT slipping: we do not know when it was met, and a
 * crack is a claim. Better to under-say than to crack a tile laid this morning.
 */
export function roomSlipping(r: PathRecord, room: Situation, now: Date = new Date()): boolean {
  const inventory = r.inventory ?? {}
  const ids = roomPieceIds(room).filter((id) => inventory[id])
  if (ids.length === 0) return false
  const cutoff = now.getTime() - SLIP_DAYS * 24 * 60 * 60 * 1000
  const releaseSaid = newest(
    (r.proof ?? []).filter((p) => p.clean && p.pt === room.release.answer).map((p) => p.at),
  )
  return ids.some((id) => {
    const item = inventory[id]
    if (item.latest_state === 'NEEDS ANOTHER LOOK') return true
    const last = newest([
      item.latest_recall_at,
      newest((r.evidence ?? []).filter((e) => e.target_id === id).map((e) => e.timestamp)),
      releaseSaid,
    ])
    return last !== null && new Date(last).getTime() < cutoff
  })
}

/** The latest of some ISO strings, ignoring junk; null when there are none. */
function newest(times: (string | null | undefined)[]): string | null {
  let best: string | null = null
  let bestT = -Infinity
  for (const t of times) {
    if (!t) continue
    const n = new Date(t).getTime()
    if (Number.isNaN(n)) continue
    if (n > bestT) {
      bestT = n
      best = t
    }
  }
  return best
}

/**
 * THE KEYSTONE'S GLAZE — the milestone's 0–3, without a single star (2026-11-02).
 *
 * The design review called stars the most Duolingo thing on the path, and they are: a row
 * of three gold shapes is a score, and a score is something you can be short of. The
 * keystone that caps each course says the same 0–3 as a material instead — the way a real
 * tile goes from bisque to glazed — so it reads as something being made, not marked:
 *
 *   0  outline       nothing said cold yet; the shape is drawn, waiting
 *   1  part-glazed   one of the three sentences said cold
 *   2  glazed        two of them
 *   3  gold-rimmed   all three — finished, and it looks it
 */
export type Glaze = 'outline' | 'part' | 'glazed' | 'gold'

export function keystoneGlaze(stars: number): Glaze {
  if (stars >= 3) return 'gold'
  if (stars === 2) return 'glazed'
  if (stars === 1) return 'part'
  return 'outline'
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

/**
 * THE UNDERSTOOD TALLY'S LITTLE MOMENTS (Sam, 2026-11-02).
 *
 * "Count the times you were understood, not your streak … the little wins of being
 * understood are phenomenal and confidence boosting." The count itself is
 * `understood` on the learner (engine/learner.ts); these are the totals worth a small
 * celebration on the home screen. The first one most of all — it is the moment somebody
 * finds out they can be understood at all.
 *
 * Deliberately sparse and deliberately not a ladder to the next one: nothing on screen
 * says how far away 25 is. A target is pressure, and this is a tally of wins.
 */
export const UNDERSTOOD_MILESTONES = [1, 5, 10, 25, 50, 100] as const

/**
 * The milestone to celebrate, if any: the highest one reached that has not been marked.
 * `marked` is the highest already celebrated on this device (0 for none). Null when there
 * is nothing new — which is almost always, because these are rare on purpose.
 */
export function understoodMilestone(count: number, marked: number): number | null {
  const reached = UNDERSTOOD_MILESTONES.filter((m) => count >= m && m > marked)
  return reached.length ? reached[reached.length - 1] : null
}

/**
 * What the moment says. Warm, short, and never about what is left to do.
 *
 * HONEST ABOUT WHAT WAS MEASURED (the Wall, 2026-11-02). These said "understood", and the
 * thing counting them cannot know that: engine/listen.ts returns `close`, never `correct`,
 * and says so — a recogniser hearing something near enough is not a Lisboeta nodding. So the
 * tally says what actually happened: you said it out loud, and it was heard. That is still
 * the whole thing, and it is a claim the code can stand behind.
 */
export function understoodCheer(milestone: number): string {
  if (milestone === 1) return 'Your first one: said out loud, in Portuguese, and heard. That is the whole thing.'
  if (milestone === 5) return 'Five times said out loud and heard. It is starting to sound like you.'
  if (milestone === 10) return 'Ten times said out loud and heard. Saying it out loud is a habit now.'
  if (milestone === 25) return 'Twenty-five times said out loud, and heard every one.'
  if (milestone === 50) return 'Fifty times said out loud and heard. You are ready for the counter.'
  return 'A hundred times said out loud and heard. Lisbon is going to like you.'
}
