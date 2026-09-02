import type { InventoryItem, InventoryState, LearnerState } from '@/engine/learner'

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
function unionBy<T>(
  a: T[],
  b: T[],
  key: (x: T) => string,
  /** How to combine two rows that share an identity. Default: keep the first seen. */
  combine?: (x: T, y: T) => T,
): T[] {
  const out: T[] = []
  const at = new Map<string, number>()
  for (const item of [...a, ...b]) {
    const k = key(item)
    const found = at.get(k)
    if (found === undefined) {
      at.set(k, out.length)
      out.push(item)
      continue
    }
    if (combine) out[found] = combine(out[found], item)
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
 * Inventory: union by key, and on conflict keep everything the stronger copy knew.
 *
 * The version this replaces compared against a vocabulary DUB has never had —
 * ['seen','shaky','known','strong'] — while the real field is `latest_state` and the
 * real values are NEW / YOURS / STRONGER / SOLID / NEEDS ANOTHER LOOK. indexOf returned
 * −1 on both sides of every comparison, so the tie-break never fired and a plain object
 * spread let the remote copy win blindly: a phone that had been in a drawer since July
 * could demote a SOLID piece to NEW, erase its cross-world reinforcement history, and
 * inject `state: ""` and `acquired_at: undefined` into the record on the way past.
 *
 * Three rules now, and each one is a way a learner could lose something:
 *
 *   - state takes the strongest, on the real ladder
 *   - reinforced_sources UNION, because being reinforced in another world is a fact
 *     about what happened and cannot be undone by a stale copy
 *   - latest_recall_at takes the LATEST, because that one is genuinely a "most recent"
 *
 * NEEDS ANOTHER LOOK is deliberately not on the ladder. It is not a rung, it is a flag
 * about the last attempt, so it never wins a merge and never loses one — the copy that
 * knows more about the piece decides, and the flag rides along with whichever state won.
 */
const LADDER: InventoryState[] = ['NEW', 'YOURS', 'STRONGER', 'SOLID']

/** How much this copy knows. −1 for a value off the ladder, which loses to anything. */
function strength(state: unknown): number {
  return LADDER.indexOf(state as InventoryState)
}

/** The stronger of two states, treating the flag as "no information about rank". */
function strongerState(a: unknown, b: unknown): InventoryState {
  const [x, y] = [strength(a), strength(b)]
  if (x < 0 && y < 0) {
    // Both off the ladder — both are NEEDS ANOTHER LOOK, or one is junk from an older
    // build. Prefer a real InventoryState over anything else.
    const real = [a, b].find((v) => v === 'NEEDS ANOTHER LOOK')
    return (real as InventoryState) ?? 'NEW'
  }
  if (x < 0) return b as InventoryState
  if (y < 0) return a as InventoryState
  return (x > y ? a : b) as InventoryState
}

/** Latest wins — this one really is a "most recent". */
function latest(a: unknown, b: unknown): string | null {
  const xs = [a, b].filter((x): x is string => typeof x === 'string' && Boolean(x))
  if (!xs.length) return null
  return xs.sort()[xs.length - 1]
}

function mergeInventory(a: unknown, b: unknown): Record<string, InventoryItem> {
  const left = obj(a)
  const right = obj(b)
  const out: Record<string, InventoryItem> = {}
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const lo = left[key]
    const ro = right[key]
    if (lo === undefined) {
      out[key] = ro as InventoryItem
      continue
    }
    if (ro === undefined) {
      out[key] = lo as InventoryItem
      continue
    }
    const l = obj(lo)
    const r = obj(ro)
    out[key] = {
      target_id: (l.target_id ?? r.target_id ?? key) as InventoryItem['target_id'],
      // An acquisition source is the world it first came from. Whichever copy has one
      // is the one that was there.
      acquired_source: (l.acquired_source ??
        r.acquired_source ??
        null) as InventoryItem['acquired_source'],
      reinforced_sources: [
        ...new Set([...arr<string>(l.reinforced_sources), ...arr<string>(r.reinforced_sources)]),
      ] as InventoryItem['reinforced_sources'],
      latest_state: strongerState(l.latest_state, r.latest_state),
      latest_recall_at: latest(l.latest_recall_at, r.latest_recall_at),
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

/**
 * Answered beats unanswered, whichever side it came from.
 *
 * `skipped` is a set union rather than a preference: skipping is itself an answer — it
 * is how the product remembers not to ask again — and losing it re-asks a question
 * somebody has already declined, which is worse than losing the answer.
 */
function mergeProfile(l: Rec, r: Rec): Rec {
  const out: Rec = { ...l, ...r }
  for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) {
    if (key === 'skipped') continue
    out[key] = r[key] ?? l[key] ?? null
  }
  out.skipped = setUnion(l.skipped as unknown[], r.skipped as unknown[])
  return out
}

export function mergeLearner(local: Partial<LearnerState>, remote: Partial<LearnerState>): LearnerState {
  const l = local ?? {}
  const r = remote ?? {}

  /*
    Whose copies these are, decided before anything else is merged.

    The only rule in this file that can say NO. Every other one is chosen so a merge can
    only gain, and gaining is exactly the wrong behaviour when the two copies are two
    people — one shared laptop, or one phone handed to a friend to try, and Bob's account
    ends up holding sentences Alice said.

    Refusing rather than picking a winner, for the same reason assertCanOnlyGain refuses:
    writing the result destroys the only copy of what somebody can say and there is nowhere
    to restore it from. A refusal writes nothing, so a refusal loses nothing.

    Absent is anonymous, not an error. Every record already on a phone predates this field,
    and treating a missing owner as anything else would orphan the whole existing cohort.
  */
  const owner = mergeOwner(l.user_id ?? null, r.user_id ?? null)

  const merged = {
    ...l,
    ...r,

    user_id: owner,

    // Identity: the earliest record is the true one. A learner who signed in on a new
    // phone should not have their history restamped with today's date.
    learner_id: l.learner_id || r.learner_id,
    created_at: earliest(l.created_at, r.created_at) ?? new Date().toISOString(),
    deal_accepted_at: earliest(l.deal_accepted_at, r.deal_accepted_at),
    club_welcomed_at: earliest(l.club_welcomed_at, r.club_welcomed_at),
    // Seen once is seen. A second phone must not decide it has not happened yet.
    switch_seen_at: earliest(l.switch_seen_at, r.switch_seen_at),

    // Append-only. Union by identity, never replaced.
    /*
      One row per sentence-and-moment, and `clean` can only ever turn true.

      recordProof lets a learner upgrade a fumbled release by getting it right later.
      A plain union would let a stale copy of the same row carry the old false back —
      and `clean` is what rungReached counts, so that is a lost rung, not a cosmetic
      flag.
    */
    proof: unionBy(
      arr<Rec>(l.proof),
      arr<Rec>(r.proof),
      (p) => String(p.pt) + '|' + String(p.at),
      (x, y) => ({ ...x, clean: Boolean(x.clean) || Boolean(y.clean) }),
    ),
    /*
      Keyed on `timestamp`, which is the field LearningEvidence actually has.

      It used to key on `e.at` — undefined on every row, because that field belongs to
      ProofLine and never existed here. So the key degraded to target_id|""|event_type
      and every row sharing a target and a type collapsed into ONE. Three reinforcements
      of `água` plus two from another device merged to a single survivor.

      That is not a cosmetic loss. scoreFor, deriveState and weakestBlocks all COUNT
      evidence rows, so thinning the log silently demotes inventory state and corrupts
      deck selection — and restoreLearner writes the damaged copy straight back over
      localStorage, where there is nothing to restore it from.
    */
    evidence: unionBy(
      arr<Rec>(l.evidence),
      arr<Rec>(r.evidence),
      (e) =>
        String(e.target_id) +
        '|' +
        String(e.timestamp ?? '') +
        '|' +
        String(e.event_type ?? '') +
        '|' +
        String(e.latency_ms ?? ''),
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
    lines_seen: setUnion(l.lines_seen, r.lines_seen),
    /*
      The Legend.

      A card is a learner's own words about themselves, so an EDIT is a real intention
      and must win — unlike proof, which is append-only. The later `at` is the later
      edit. But rehearsal is append-only in spirit: the two devices each counted real
      cold deliveries, so the counts add rather than one replacing the other, and a card
      cleared on one device does not resurrect from the other's stale copy.
    */
    /*
      Accepted beats declined beats unseen.

      A learner who built a card on one phone has answered the question, so a stale
      "declined" from another must not re-open the offer — and a decline must not be
      undone by a device that simply never saw it.
    */
    legend_prompt: ([l.legend_prompt, r.legend_prompt].includes('accepted')
      ? 'accepted'
      : [l.legend_prompt, r.legend_prompt].includes('declined')
        ? 'declined'
        : 'unseen') as LearnerState['legend_prompt'],

    legend: unionBy(
      arr<Rec>(l.legend),
      arr<Rec>(r.legend),
      (a) => String(a.frame_id),
      (x, y) => {
        const newer = String(y.at ?? '') > String(x.at ?? '') ? y : x
        return {
          ...newer,
          said_cold: Number(x.said_cold ?? 0) + Number(y.said_cold ?? 0),
        }
      },
    ),
    // Finishing a section is not undoable, and the Club's welcome fired at whichever
    // moment came first — a learner who signs in on a new phone is not new.
    sections_completed: setUnion(l.sections_completed, r.sections_completed),
    osmosis_seen: setUnion(l.osmosis_seen, r.osmosis_seen),
    // A save is for the learner and has to survive a sync like anything else they made.
    saved: setUnion(l.saved, r.saved),
    liked: setUnion(l.liked, r.liked),
    finished_cards: setUnion(l.finished_cards, r.finished_cards),
    /*
      Kept sentences merge as a union on the Portuguese, oldest timestamp winning.

      Nobody may lose a sentence they decided to keep by signing in on a second phone —
      that is the whole promise the account makes. Two devices that kept the same line keep
      one copy of it, dated from the first time it was wanted.
    */
    /*
      The one field where the LATER answer wins.

      Everything else here merges as a union or keeps the earliest, because nothing a
      learner has done should be undone by picking up another phone. Purpose is different:
      it is a statement about the present, and somebody who has changed it on the device in
      their hand has not lost anything by having it respected.
    */
    purpose: r.purpose ?? l.purpose ?? null,
    /*
      First wins, unlike purpose.

      Purpose is a statement about the present so the later answer is the true one. This is
      a thing that was GIVEN, once, and a merge that moved it would either take back a room
      somebody has been reading or hand out a second one.
    */
    tasted: l.tasted ?? r.tasted ?? null,
    asked: [
      ...new Map(
        [...(r.asked ?? []), ...(l.asked ?? [])]
          .slice()
          .sort((a, b) => (a.at < b.at ? -1 : 1))
          .map((a) => [a.pt, a] as const),
      ).values(),
    ],
    missions_completed: setUnion(l.missions_completed, r.missions_completed),

    display_name: newerOf(l.display_name, r.display_name) || '',
    tester_label: l.tester_label || r.tester_label || '',

    /*
      An answered question stays answered.

      This was { ...local, ...remote }, which is last-writer-wins field by field — and a
      null is a value. A device that synced BEFORE the questions were asked put nulls on
      the server, and every sync afterwards spread those nulls back over the answers. The
      learner answered "how old are you", it was quietly unset, and the product asked
      again. And again.

      Answered beats unanswered on both sides, which is the same rule the rest of this
      file lives under: a merge may only ever gain. The gain check did not catch it
      because it counted proof and inventory, and a profile field is neither.
    */
    profile: mergeProfile(obj(l.profile) as Rec, obj(r.profile) as Rec),
    affinity: { ...obj(l.affinity), ...obj(r.affinity) },
    experiment: { ...obj(l.experiment), ...obj(r.experiment) },
  } as unknown as LearnerState

  assertCanOnlyGain(l, r, merged)
  return merged
}

/**
 * Whose record the result belongs to, or a refusal.
 *
 *   null   + null    → null     two anonymous copies of one device
 *   null   + Alice   → Alice    THE CLAIM — anonymous work becomes theirs at sign-in
 *   Alice  + null    → Alice    a stale anonymous copy cannot un-claim anything
 *   Alice  + Alice   → Alice    two devices, one person: the steady state
 *   Alice  + Bob     → throws
 *
 * The claim is what makes anonymous play worth doing: somebody who finishes a vibe and
 * then makes an account has to find it still there. The refusal is what stops that same
 * generosity handing one person another person's Portuguese.
 */
export function mergeOwner(a: string | null, b: string | null): string | null {
  if (a && b && a !== b) {
    throw new Error(
      'merge would combine two people: this copy belongs to ' +
        a +
        ' and the other to ' +
        b +
        '. Refusing to write.',
    )
  }
  return a ?? b ?? null
}

/**
 * The invariant, asserted rather than assumed.
 *
 * A merge may never reduce what the learner has. If it ever would, throwing is the
 * correct behaviour: writing the result back destroys the only copy of what they can
 * say, and there is nowhere to restore it from.
 *
 * This checked two things — proof length and inventory key presence — and BOTH of the
 * defects it was written to catch sailed straight past it. A safety net that certifies
 * the bug is worse than no safety net, because it is why nineteen fixtures passed while
 * the merge quietly demoted pieces on every sync.
 *
 * So it now checks everything a merge could take away: the proof count, the evidence
 * count, every inventory key, and — per item — the state and the reinforcement history.
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

  /*
    Evidence is append-only and counted, not just read. scoreFor, deriveState and
    weakestBlocks all measure the number of rows, so one lost row is a demoted piece.
  */
  const evidenceFloor = Math.max(arr(a.evidence).length, arr(b.evidence).length)
  if (merged.evidence.length < evidenceFloor) {
    throw new Error(
      'merge would lose evidence: ' +
        merged.evidence.length +
        ' < ' +
        evidenceFloor +
        '. Refusing to write.',
    )
  }

  for (const [side, source] of [
    ['local', obj(a.inventory)],
    ['remote', obj(b.inventory)],
  ] as const) {
    for (const [key, before] of Object.entries(source)) {
      const after = merged.inventory[key]
      if (!after) {
        throw new Error('merge would drop inventory key "' + key + '". Refusing to write.')
      }
      const was = obj(before)
      // A piece may be promoted by a merge and may never be demoted by one.
      if (strength(was.latest_state) > strength(after.latest_state)) {
        throw new Error(
          'merge would demote "' +
            key +
            '" from ' +
            String(was.latest_state) +
            ' to ' +
            String(after.latest_state) +
            ' (' +
            side +
            ' copy). Refusing to write.',
        )
      }
      // Being reinforced in another world is a fact about what happened. A stale copy
      // that has never heard of it must not be able to erase it.
      const lost = arr<string>(was.reinforced_sources).filter(
        (x) => !arr<string>(after.reinforced_sources).includes(x),
      )
      if (lost.length) {
        throw new Error(
          'merge would erase reinforcement of "' +
            key +
            '" in ' +
            lost.join(', ') +
            '. Refusing to write.',
        )
      }
    }
  }
}
