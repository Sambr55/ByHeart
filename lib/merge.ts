import type { LearnerState } from '@/engine/learner'

/**
 * Merging two copies of a learner.
 *
 * A user can have several `learners` rows — one per device. Last-write-wins would
 * silently destroy a session; taking the server copy would destroy an offline one. So
 * every field merges by a rule chosen so that it can only ever GAIN.
 *
 * This is the one piece of code in DUB where a bug is unrecoverable. The learner's
 * record of what they can say IS the product: lose a proof line and there is nothing
 * anywhere to restore it from. Hence the invariant at the bottom, which is asserted on
 * every merge rather than trusted, and the fixtures in scripts/merge-test.mts.
 */

type Rec = Record<string, unknown>

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const obj = (v: unknown): Rec =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : {}

/** Append-only records. A merge can only add, so union on a stable identity. */
function unionBy<T>(a: T[], b: T[], key: (x: T) => string): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  for (const item of [...a, ...b]) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}

const setUnion = (a: unknown, b: unknown): string[] => [
  ...new Set([...arr<string>(a), ...arr<string>(b)]),
]

/** Earliest wins — the first time something happened is the true time. */
function earliest(a: unknown, b: unknown): string | null {
  const xs = [a, b].filter((x): x is string => typeof x === 'string' && Boolean(x))
  if (!xs.length) return null
  return xs.sort()[0]
}

/**
 * Inventory: union by key, and on conflict keep the stronger state and the earlier
 * acquisition. Strength only ever goes up, so taking the max cannot demote a learner
 * for having opened the app on an older phone.
 */
const STRENGTH = ['seen', 'shaky', 'known', 'strong']

function mergeInventory(a: unknown, b: unknown): Rec {
  const left = obj(a)
  const right = obj(b)
  const out: Rec = { ...left }
  for (const [k, rv] of Object.entries(right)) {
    const lv = out[k]
    if (lv === undefined) {
      out[k] = rv
      continue
    }
    if (typeof lv === 'string' && typeof rv === 'string') {
      out[k] = STRENGTH.indexOf(rv) > STRENGTH.indexOf(lv) ? rv : lv
      continue
    }
    const lo = obj(lv)
    const ro = obj(rv)
    const ls = typeof lo.state === 'string' ? lo.state : ''
    const rs = typeof ro.state === 'string' ? ro.state : ''
    out[k] = {
      ...lo,
      ...ro,
      state: STRENGTH.indexOf(rs) > STRENGTH.indexOf(ls) ? rs : ls || rs,
      acquired_at: earliest(lo.acquired_at, ro.acquired_at) ?? ro.acquired_at ?? lo.acquired_at,
    }
  }
  return out
}

/** Most recently written non-null wins, falling back to whichever exists. */
function newerOf<T>(a: T | null | undefined, b: T | null | undefined, aAt?: string, bAt?: string): T | null {
  if (a == null) return (b ?? null) as T | null
  if (b == null) return a
  if (aAt && bAt) return bAt > aAt ? b : a
  return b
}

export function mergeLearner(local: Partial<LearnerState>, remote: Partial<LearnerState>): LearnerState {
  const l = local ?? {}
  const r = remote ?? {}

  const merged = {
    ...l,
    ...r,

    // Identity: the earliest record is the true one. A learner who signed in on a new
    // phone should not have their history restamped with today's date.
    learner_id: l.learner_id || r.learner_id,
    created_at: earliest(l.created_at, r.created_at) ?? new Date().toISOString(),
    deal_accepted_at: earliest(l.deal_accepted_at, r.deal_accepted_at),

    // Append-only. Union by identity, never replaced.
    proof: unionBy(arr<Rec>(l.proof), arr<Rec>(r.proof), (p) => String(p.pt) + '|' + String(p.at)),
    evidence: unionBy(
      arr<Rec>(l.evidence),
      arr<Rec>(r.evidence),
      (e) => String(e.target_id) + '|' + String(e.at ?? '') + '|' + String(e.event_type ?? ''),
    ),
    voice_signals: unionBy(
      arr<Rec>(l.voice_signals),
      arr<Rec>(r.voice_signals),
      (v) => String(v.pt) + '|' + String(v.at),
    ),

    inventory: mergeInventory(l.inventory, r.inventory),

    // Set union — having played something is not undoable.
    roots_played: setUnion(l.roots_played, r.roots_played),
    collisions_played: setUnion(l.collisions_played, r.collisions_played),
    nocue_done: setUnion(l.nocue_done, r.nocue_done),
    osmosis_seen: setUnion(l.osmosis_seen, r.osmosis_seen),
    missions_completed: setUnion(l.missions_completed, r.missions_completed),

    display_name: newerOf(l.display_name, r.display_name) || '',
    tester_label: l.tester_label || r.tester_label || '',

    profile: { ...obj(l.profile), ...obj(r.profile), skipped: setUnion(
      (obj(l.profile) as Rec).skipped,
      (obj(r.profile) as Rec).skipped,
    ) },
    affinity: { ...obj(l.affinity), ...obj(r.affinity) },
    experiment: { ...obj(l.experiment), ...obj(r.experiment) },
  } as unknown as LearnerState

  assertCanOnlyGain(l, r, merged)
  return merged
}

/**
 * The invariant, asserted rather than assumed.
 *
 * A merge may never reduce proof.length, and may never drop an inventory key. If it
 * ever does, throwing is the correct behaviour: writing the result back would destroy
 * the only copy of what the learner can say, and there is nowhere to restore it from.
 */
export function assertCanOnlyGain(
  a: Partial<LearnerState>,
  b: Partial<LearnerState>,
  merged: LearnerState,
) {
  const floor = Math.max(arr(a.proof).length, arr(b.proof).length)
  if (merged.proof.length < floor) {
    throw new Error(
      'merge would lose proof: ' + merged.proof.length + ' < ' + floor + '. Refusing to write.',
    )
  }
  for (const key of [...Object.keys(obj(a.inventory)), ...Object.keys(obj(b.inventory))]) {
    if (!(key in merged.inventory)) {
      throw new Error('merge would drop inventory key "' + key + '". Refusing to write.')
    }
  }
}
