'use client'

/**
 * The learner, not the lesson.
 *
 * Missions come and go; this is what accumulates. Spec §8: cultural worlds are
 * sources, the inventory is the learner's capability. It therefore has to survive
 * Mission 01 → Mission 02 → the 24–72h recall, which for this prototype means the
 * tester's own phone plus a resume link that carries the whole state in the URL.
 */

import { drainEvents, returnEvents } from './analytics'
import type { MissionId, PropertyId } from '@/content/types'
import { BLOCK_ORDER, TARGETS } from '@/content/targets'

/**
 * A piece id. The two original missions used a closed PieceId union; the v0.6 root
 * graph mints pieces from content, so this is deliberately open.
 */
import { DEFAULT_PAIR, pairId, type Pair } from '@/content/pairs'
import { mergeLearner } from '@/lib/merge'
import { currentPair } from './pair'

export type PieceId = string

/**
 * One record per pair, namespaced: byheart.learner.v1:en-GB:pt-PT.
 *
 * This single change buys the multiple-identities model — EN→PT, EN→FR, PT→ES, each
 * with its own inventory, proof, stage and played history — without restructuring
 * LearnerState at all. Nesting progress under a pairs map inside one record would cost
 * far more and buy nothing extra.
 */
const LEGACY_KEY = 'byheart.learner.v1'

function keyFor(pair: Pair): string {
  return LEGACY_KEY + ':' + pairId(pair)
}

function currentKey(): string {
  return keyFor(currentPair())
}

/** The key this pair's record actually lives under. Exported for tooling and tests. */
export function learnerStorageKey(pair: Pair = currentPair()): string {
  return keyFor(pair)
}
const VERSION = 1

// ---------------------------------------------------------------------------
// §13 entities
// ---------------------------------------------------------------------------

export type InventoryState =
  | 'NEW'
  | 'YOURS'
  | 'STRONGER'
  | 'SOLID'
  | 'NEEDS ANOTHER LOOK'

export type EvidenceType =
  | 'encounter'
  | 'acquire'
  | 'transfer'
  | 'reinforce'
  | 'combine'
  | 'cold_recall'
  | 'checkpoint_recall'
  | 'crossover'
  | 'delayed_recall'

export interface LearningEvidence {
  target_id: PieceId
  event_type: EvidenceType
  correct_first_try: boolean
  hint_count: number
  /** True when the learner never produced it and the answer was shown. */
  revealed: boolean
  latency_ms: number
  /** The world the learner was inside when this happened; null once culture is gone. */
  culture_context: PropertyId | null
  mission_id: MissionId | null
  timestamp: string
}

/**
 * A sentence the learner produced with nothing on screen to copy from.
 *
 * This is the honest count, and it is deliberately narrow. Tapping through a lesson
 * does not qualify; recognising a line does not qualify. Only the beats where the
 * cultural source has been taken away — release, no-cue and collisions — put anything
 * in here, which is what makes the number worth showing to another person.
 */
export interface ProofLine {
  pt: string
  en: string
  /**
   * Where it was said with nothing on screen.
   *
   * release = the cultural cue removed. nocue = never had one. collision = two crates at
   * once. legend = a question about yourself, answered cold — which counts on exactly
   * the same terms as the rest, because it is exactly the same thing.
   */
  source: 'release' | 'nocue' | 'collision' | 'legend'
  /** Whether it came out right first time, with no hint taken. */
  clean: boolean
  at: string
}

/**
 * One card of somebody's Legend, filled in.
 *
 * Kept as a list rather than a map so the order a learner built them in survives.
 *
 * CLEARING A CARD LEAVES AN EMPTY ROW, and that is deliberate. Deleting it looked
 * cleaner and was wrong: the merge cannot tell "I never answered this" from "I cleared
 * it", and it must never let an empty side erase a full one — so a deleted card would
 * quietly resurrect from any device that still had it. An empty row is a tombstone with
 * a timestamp, so a clear made later beats an answer made earlier, and it carries no
 * personal data of its own.
 *
 * `isAnswered` is what everything else asks, so an empty row is invisible: not in the
 * run-through, not in the count, never rendered as a gap to be filled.
 */
export interface LegendAnswer {
  frame_id: string
  values: Record<string, string>
  /** Times said cold, with nothing on screen. A rehearsal count, never a score. */
  said_cold: number
  at: string
}

export interface InventoryItem {
  target_id: PieceId
  acquired_source: PropertyId | null
  reinforced_sources: PropertyId[]
  latest_state: InventoryState
  latest_recall_at: string | null
}

export interface CultureAffinity {
  categories_ranked: string[]
  free_text_favourite: string
  next_world_pre: string | null
  next_world_post: string | null
  source_familiarities: Partial<Record<PropertyId, number>>
}

export interface Experiment {
  test_variant: 'culture_full' | 'culture_neutral'
  same_or_delayed: 'same_session' | 'delayed_24_72h' | 'unknown'
  cohort_tag: string
}

export interface VoiceSignal {
  signal: string
  pt: string
  at: string
}

export interface LearnerState {
  version: number
  learner_id: string
  /**
   * Who this is, for multi-user testing. Set from ?tester= on the link the facilitator
   * sends, or typed on the way in. Never used for anything but joining a session to a
   * feedback form.
   */
  tester_label: string
  /** §12 — collected invisibly through meaningful choices, never a personality quiz. */
  voice_signals: VoiceSignal[]
  /** Grammar points already surfaced, so no section repeats another section's. */
  osmosis_seen: string[]
  /**
   * What they told us about themselves, and what it is for. `gender` is grammatical —
   * which endings they use — not an identity claim. Every field is optional because
   * every question is skippable, and a skip is recorded as a skip rather than a blank.
   */
  profile: {
    gender: 'm' | 'f' | null
    age_band: string | null
    goal: string | null
    skipped: string[]
  }
  created_at: string
  missions_completed: MissionId[]
  /** ISO timestamp each mission finished, for previous_session_age_hours. */
  mission_completed_at: Partial<Record<MissionId, string>>
  inventory: Record<string, InventoryItem>
  /** Everything they have said cold. The number on the proof card. */
  proof: ProofLine[]
  /**
   * Which roots and collisions have been through a session.
   *
   * Kept with the learner rather than in the journey's own state, which lives only as
   * long as the tab: a crate that reported itself finished and then forgot the moment
   * somebody refreshed made the picker lie about where they had been.
   *
   * It is a record of what has been SEEN, not a lock. Re-entering a crate is allowed —
   * nothing downstream double-counts, because recordProof dedupes by sentence and the
   * osmosis screen has a state for having nothing new to say.
   */
  roots_played: string[]
  collisions_played: string[]
  /**
   * Cold prompts already answered. Without this, indexing the filtered list by step
   * number meant every section ended with the same three sentences — which makes the
   * proof card look like it is measuring the same thing over and over.
   */
  nocue_done: string[]
  /**
   * Daily lines already shown, so the same sentence never arrives twice.
   *
   * On the LEARNER rather than on the push subscription, because both halves of the
   * feature have to read it: the cron picks from a `sent` column and the /line page
   * passed no seen list at all, so the page happily re-showed a sentence the
   * notification had already delivered — and the docblock claimed the two were always
   * the same line.
   */
  lines_seen: string[]
  /**
   * The Legend — the most personal data in the product.
   *
   * Names of children, ages, marital status, why somebody left a country. Three
   * obligations follow from that and all three are honoured: it is in the export, it is
   * destroyed by account deletion, and it never reaches a share image unless the learner
   * puts it there deliberately.
   *
   * `said_cold` is a rehearsal count and is never rendered as a score. It exists so the
   * run-through can offer the cards somebody has practised least, and for nothing else —
   * the moment a number is attached to being put on the spot, the feature becomes the
   * anxiety it exists to remove.
   */
  legend: LegendAnswer[]
  /**
   * Whether the Legend has been offered, taken up, or turned down.
   *
   * The honesty rule the whole thread depends on: never say "this goes in your Legend"
   * to somebody who has never seen one. The first mention OFFERS it; after that the line
   * is quiet reinforcement. And if a learner declines, it stops entirely — a goal you did
   * not choose is a nag.
   */
  legend_prompt: 'unseen' | 'accepted' | 'declined'
  /**
   * Crates whose section has been carried all the way to the end.
   *
   * roots_played says what was opened; this says what was FINISHED, and only the second
   * one can answer "has this person been through DUB once". It is what unlocks the Club
   * and what the welcome ceremony fires on, so it has to survive a refresh, a new phone
   * and a sign-in — hence a learner field rather than journey state.
   *
   * A set, not a count. Finishing Bond twice is one section finished, and a number that
   * can be inflated by repetition is the beginning of a streak.
   */
  sections_completed: string[]
  /** When the Club welcomed them. Fires once, ever. Earliest wins on a merge. */
  club_welcomed_at: string | null
  /**
   * When the deal was accepted, or null. Kept per pair rather than globally, because
   * the deal screen speaks about the language being learned — "your Portuguese" — and
   * somebody arriving at a second pair has not been told that deal.
   */
  deal_accepted_at: string | null
  evidence: LearningEvidence[]
  affinity: CultureAffinity
  experiment: Experiment
  /** The learner's own name, if they gave one — used in the introduction screens. */
  display_name: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'l_' + Math.abs(Math.floor(performance.now() * 1000)).toString(36)
}

export function emptyLearner(): LearnerState {
  return {
    version: VERSION,
    learner_id: uid(),
    tester_label: '',
    voice_signals: [],
    osmosis_seen: [],
    profile: { gender: null, age_band: null, goal: null, skipped: [] },
    created_at: new Date().toISOString(),
    missions_completed: [],
    mission_completed_at: {},
    inventory: {},
    proof: [],
    roots_played: [],
    collisions_played: [],
    nocue_done: [],
    lines_seen: [],
    legend: [],
    legend_prompt: 'unseen',
    sections_completed: [],
    club_welcomed_at: null,
    deal_accepted_at: null,
    evidence: [],
    affinity: {
      categories_ranked: [],
      free_text_favourite: '',
      next_world_pre: null,
      next_world_post: null,
      source_familiarities: {},
    },
    experiment: {
      test_variant: 'culture_full',
      same_or_delayed: 'unknown',
      cohort_tag: '',
    },
    display_name: '',
  }
}

let state: LearnerState | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function save() {
  if (typeof window === 'undefined' || !state) return
  try {
    window.localStorage.setItem(currentKey(), JSON.stringify(state))
  } catch {
    // Private mode or a full quota. The in-memory copy still drives the session.
  }
}

export function loadLearner(): LearnerState {
  if (state) return state
  if (typeof window === 'undefined') return emptyLearner()
  try {
    // A record written before pairs existed belongs to the default pair. Read it
    // across rather than abandoning it — and leave the original in place, because a
    // migration that deletes its own source has no way back if it turns out to be wrong.
    const key = currentKey()
    let raw = window.localStorage.getItem(key)
    if (!raw && pairId(currentPair()) === pairId(DEFAULT_PAIR)) {
      const legacy = window.localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        raw = legacy
        try {
          window.localStorage.setItem(key, legacy)
        } catch {
          // Out of room. The record still loads for this session.
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LearnerState>
      if (parsed.version === VERSION) {
        // Fields added after a tester started are backfilled rather than version-bumped:
        // a bump throws away a session that is still running, which is a worse bug than
        // a missing array.
        //
        // Backfilling one field at a time was the bug — every field added since a
        // record was written came back undefined, and the first component to reach
        // for .length or spread it died. So a saved record is merged onto a complete
        // one, and anything that must be an array or an object is checked rather than
        // trusted: this data has been through a schema change, a JSON round trip and
        // sometimes a hand edit in devtools.
        const base = emptyLearner()
        const arr = <T>(v: unknown, fallback: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fallback)
        const obj = <T extends object>(v: unknown, fallback: T): T =>
          v && typeof v === 'object' && !Array.isArray(v) ? { ...fallback, ...(v as T) } : fallback
        state = {
          ...base,
          ...parsed,
          learner_id: parsed.learner_id || base.learner_id,
          created_at: parsed.created_at || base.created_at,
          tester_label: parsed.tester_label ?? base.tester_label,
          display_name: parsed.display_name ?? base.display_name,
          voice_signals: arr(parsed.voice_signals, []),
          osmosis_seen: arr(parsed.osmosis_seen, []),
          missions_completed: arr(parsed.missions_completed, []),
          proof: arr(parsed.proof, []),
          roots_played: arr(parsed.roots_played, []),
          nocue_done: arr(parsed.nocue_done, []),
          lines_seen: arr(parsed.lines_seen, []),
          legend: arr(parsed.legend, []),
          legend_prompt:
            parsed.legend_prompt === 'accepted' || parsed.legend_prompt === 'declined'
              ? parsed.legend_prompt
              : 'unseen',
          sections_completed: arr(parsed.sections_completed, []),
          club_welcomed_at: parsed.club_welcomed_at ?? null,
          deal_accepted_at: parsed.deal_accepted_at ?? null,
          collisions_played: arr(parsed.collisions_played, []),
          evidence: arr(parsed.evidence, []),
          inventory: obj(parsed.inventory, {}),
          mission_completed_at: obj(parsed.mission_completed_at, {}),
          profile: {
            ...obj(parsed.profile, base.profile),
            skipped: arr(parsed.profile?.skipped, []),
          },
          affinity: {
            ...obj(parsed.affinity, base.affinity),
            categories_ranked: arr(parsed.affinity?.categories_ranked, []),
            source_familiarities: obj(parsed.affinity?.source_familiarities, {}),
          },
          experiment: obj(parsed.experiment, base.experiment),
        }
        return state
      }
    }
  } catch {
    // Corrupt record — start clean rather than trap the tester on a broken session.
  }
  state = emptyLearner()
  save()
  return state
}

export function subscribeLearner(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getLearner(): LearnerState {
  return state ?? loadLearner()
}

function update(fn: (s: LearnerState) => void) {
  const s = getLearner()
  fn(s)
  state = { ...s }
  save()
  emit()
}

export function setExperiment(patch: Partial<Experiment>) {
  update((s) => {
    s.experiment = { ...s.experiment, ...patch }
  })
}

export function setAffinity(patch: Partial<CultureAffinity>) {
  update((s) => {
    s.affinity = { ...s.affinity, ...patch }
  })
}

export function setFamiliarity(property: PropertyId, value: number) {
  update((s) => {
    s.affinity.source_familiarities = {
      ...s.affinity.source_familiarities,
      [property]: value,
    }
  })
}

export function setTester(label: string) {
  update((s) => {
    s.tester_label = label.trim().slice(0, 60)
  })
}

/** §12 — after three to five signals the product may reflect something back. */
/**
 * Record a sentence produced cold.
 *
 * Deduplicated on the Portuguese, because saying the same line twice is revision
 * rather than a second capability, and a count that inflates on repetition is exactly
 * the kind of number this product exists to avoid.
 */
/**
 * A sentence produced with nothing on screen to copy from.
 *
 * Two things this gets right that the first version did not.
 *
 * A fumble is not permanent. It used to return early on any sentence already in the
 * log, so a release got wrong once was stored clean:false FOREVER — replaying the root
 * could not fix it, and the rung it would have earned was gone. Worst case was live: a
 * learner who picked Bridget Jones got a section containing exactly one release, the
 * longest rung-1 build in the graph, and one slip left them still on rung 1 having spent
 * one of three free crates. The dedupe stays for the COUNT — a sentence said twice is
 * one sentence — and drops for the flag.
 *
 * And it goes through update(). It was the only mutator in this file that mutated the
 * state object in place, so useSyncExternalStore compared the same reference with
 * Object.is, decided nothing had changed, and never re-rendered a subscriber. The proof
 * card and the ladder could both sit a whole session behind.
 *
 * `at` is deliberately not restamped on an upgrade: the merge dedupes proof on pt|at,
 * so moving it would turn one sentence into two the next time a device synced.
 */
export function recordProof(line: Omit<ProofLine, 'at'>) {
  update((s) => {
    const found = s.proof.findIndex((p) => p.pt === line.pt)
    if (found < 0) {
      s.proof = [...s.proof, { ...line, at: new Date().toISOString() }]
      return
    }
    if (line.clean && !s.proof[found].clean) {
      s.proof = s.proof.map((p, i) => (i === found ? { ...p, clean: true } : p))
    }
  })
}

export function recordVoiceSignal(signal: string, pt: string) {
  update((s) => {
    s.voice_signals = [...s.voice_signals, { signal, pt, at: new Date().toISOString() }]
  })
}

export function markOsmosisSeen(ids: string[]) {
  update((s) => {
    s.osmosis_seen = [...new Set([...(s.osmosis_seen ?? []), ...ids])]
  })
}

export function setProfile(field: 'gender' | 'age_band' | 'goal', value: string | null) {
  update((s) => {
    s.profile = { ...(s.profile ?? { gender: null, age_band: null, goal: null, skipped: [] }) }
    if (value === null) {
      s.profile.skipped = [...new Set([...s.profile.skipped, field])]
    } else {
      ;(s.profile as Record<string, unknown>)[field] = value
    }
  })
}

export function voiceLean(): { lean: string; count: number } | null {
  const signals = getLearner().voice_signals
  if (signals.length < 3) return null
  const tally: Record<string, number> = {}
  for (const s of signals) tally[s.signal] = (tally[s.signal] ?? 0) + 1
  const [lean] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  return { lean, count: signals.length }
}

/**
 * Push the whole session somewhere a facilitator can read it. Multi-user testing on
 * twelve phones is unreadable if each phone keeps its own record — but a failed POST
 * must never cost the tester anything, so this is fire-and-forget and the local copy
 * stays authoritative.
 */
export async function syncSession(reason: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const s = getLearner()
  const pending = drainEvents()
  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session_id: s.learner_id,
        tester_label: s.tester_label,
        recorded_at: new Date().toISOString(),
        reason,
        experiment: s.experiment,
        affinity: s.affinity,
        profile: s.profile,
        inventory: s.inventory,
        voice_signals: s.voice_signals,
        evidence: s.evidence.slice(-400),
        missions_completed: s.missions_completed,
        /**
         * proof was missing, and it is the only number the product counts — the
         * sentences said cold, the thing on the share card, and what rungReached is
         * derived from. Without it the server could not say how many learners had said
         * anything or what stage anyone had reached, which makes every question you
         * would ask before pricing unanswerable.
         */
        proof: s.proof,
        display_name: s.display_name,
        osmosis_seen: s.osmosis_seen,
        roots_played: s.roots_played,
        sections_completed: s.sections_completed,
        club_welcomed_at: s.club_welcomed_at,
        collisions_played: s.collisions_played,
        nocue_done: s.nocue_done,
        lines_seen: s.lines_seen,
        legend: s.legend,
        legend_prompt: s.legend_prompt,
        deal_accepted_at: s.deal_accepted_at,
        created_at: s.created_at,
        user_agent: navigator.userAgent,
        /*
          The events, at last.

          /api/session has accepted an `events` array and written it to the events table
          since it was built, and nothing had ever sent one — so DUB had no analytics
          egress whatsoever. Every event a tester generated lived in sessionStorage until
          they closed the tab, which means every question you would ask before pricing
          was unanswerable from data that was being collected the whole time.

          Piggy-backed on the sync rather than given its own beacon: the sync already
          runs at every meaningful moment, already carries the device identity, and a
          second endpoint is a second thing to fail.
        */
        events: pending.map((e) => ({ name: e.name, payload: e.props, at: new Date(Date.now() - 0).toISOString() })),
      }),
    })
    const body = await res.json()
    if (!body?.stored) returnEvents(pending.length)
    return Boolean(body?.stored)
  } catch {
    // Handed back rather than dropped. Losing telemetry is cheap; double-counting is not.
    returnEvents(pending.length)
    return false
  }
}

export function setDisplayName(name: string) {
  update((s) => {
    s.display_name = name.trim()
  })
}

export function completeMission(id: MissionId) {
  update((s) => {
    if (!s.missions_completed.includes(id)) s.missions_completed.push(id)
    s.mission_completed_at[id] = new Date().toISOString()
  })
}

/** Hours since the most recent completed mission, for previous_session_age_hours. */
export function hoursSinceLastMission(): number | null {
  const s = getLearner()
  const stamps = Object.values(s.mission_completed_at).filter(Boolean) as string[]
  if (!stamps.length) return null
  const latest = stamps.map((t) => Date.parse(t)).sort((a, b) => b - a)[0]
  return Math.round(((Date.now() - latest) / 36e5) * 10) / 10
}

// ---------------------------------------------------------------------------
// Inventory state machine — spec §8
// ---------------------------------------------------------------------------

/**
 * Evidence scoring, kept deliberately dumb: +1 acquired outside its source culture,
 * +1 recalled later, +1 reinforced in another world, +1 transferred with no hint,
 * −1 when the answer had to be revealed. The events are stored, not just the total,
 * so a better model can be fitted later without re-running any tester.
 */
export function scoreFor(target: PieceId): number {
  const evidence = getLearner().evidence.filter((e) => e.target_id === target)
  let score = 0
  for (const e of evidence) {
    if (e.event_type === 'acquire' || e.event_type === 'transfer') score += 1
    if (e.event_type === 'cold_recall' || e.event_type === 'delayed_recall') score += 1
    if (e.event_type === 'reinforce') score += 1
    if (
      (e.event_type === 'transfer' || e.event_type === 'crossover') &&
      e.correct_first_try &&
      e.hint_count === 0
    ) {
      score += 1
    }
    if (e.revealed) score -= 1
  }
  return score
}

function deriveState(target: PieceId): InventoryState {
  const evidence = getLearner().evidence.filter((e) => e.target_id === target)
  if (!evidence.length) return 'NEW'

  const latest = evidence[evidence.length - 1]
  // The label describes the most recent retrieval, so a fresh failure outranks history.
  if (latest.revealed || (!latest.correct_first_try && latest.hint_count >= 2)) {
    return 'NEEDS ANOTHER LOOK'
  }

  const cleanLate = evidence.some(
    (e) =>
      (e.event_type === 'crossover' || e.event_type === 'delayed_recall') &&
      e.correct_first_try &&
      e.hint_count === 0,
  )
  if (cleanLate) return 'SOLID'

  if (evidence.some((e) => e.event_type === 'reinforce')) return 'STRONGER'
  if (evidence.some((e) => e.event_type === 'transfer' && !e.revealed)) return 'YOURS'
  return 'NEW'
}

export function recordEvidence(
  ev: Omit<LearningEvidence, 'timestamp'> & { timestamp?: string },
) {
  update((s) => {
    const entry: LearningEvidence = {
      ...ev,
      timestamp: ev.timestamp ?? new Date().toISOString(),
    }
    s.evidence = [...s.evidence, entry]

    const existing: InventoryItem = s.inventory[ev.target_id]
      ? { ...s.inventory[ev.target_id], reinforced_sources: [...s.inventory[ev.target_id].reinforced_sources] }
      : {
          target_id: ev.target_id,
          acquired_source: null,
          reinforced_sources: [],
          latest_state: 'NEW',
          latest_recall_at: null,
        }

    if (ev.event_type === 'acquire' && !existing.acquired_source) {
      existing.acquired_source =
        ev.culture_context ?? TARGETS[ev.target_id as keyof typeof TARGETS]?.source ?? null
    }
    if (
      ev.event_type === 'reinforce' &&
      ev.culture_context &&
      ev.culture_context !== existing.acquired_source &&
      !existing.reinforced_sources.includes(ev.culture_context)
    ) {
      existing.reinforced_sources.push(ev.culture_context)
    }
    if (
      ev.event_type === 'cold_recall' ||
      ev.event_type === 'delayed_recall' ||
      ev.event_type === 'checkpoint_recall'
    ) {
      existing.latest_recall_at = entry.timestamp
    }

    s.inventory = { ...s.inventory, [ev.target_id]: { ...existing } }
  })

  // deriveState reads the freshly-written evidence, so it runs after the update.
  update((s) => {
    const item = s.inventory[ev.target_id]
    if (!item) return
    s.inventory = {
      ...s.inventory,
      [ev.target_id]: { ...item, latest_state: deriveState(ev.target_id) },
    }
  })
}

/** Blocks the learner has met at all, in curriculum order then arrival order. */
export function ownedBlocks(): PieceId[] {
  const s = getLearner()
  const known = BLOCK_ORDER.filter((b) => s.inventory[b])
  const rest = Object.keys(s.inventory).filter((b) => !known.includes(b as never))
  return [...known, ...rest]
}

/** Bank a piece from the root graph. */
export function acquirePiece(id: PieceId, family: string) {
  recordEvidence({
    target_id: id,
    event_type: 'acquire',
    correct_first_try: true,
    hint_count: 0,
    revealed: false,
    latency_ms: 0,
    culture_context: family as PropertyId,
    mission_id: null,
  })
}

export function itemFor(target: PieceId): InventoryItem | undefined {
  return getLearner().inventory[target]
}

/** Weakest first: reveals, then hints, then slow. Drives deck selection (§9). */
export function weakestBlocks(limit: number, pool?: PieceId[]): PieceId[] {
  const s = getLearner()
  const candidates = pool ?? ownedBlocks()
  return [...candidates]
    .map((b) => {
      const ev = s.evidence.filter((e) => e.target_id === b)
      const reveals = ev.filter((e) => e.revealed).length
      const hints = ev.reduce((n, e) => n + e.hint_count, 0)
      const latency = ev.length
        ? ev.reduce((n, e) => n + e.latency_ms, 0) / ev.length
        : 0
      return { b, weakness: reveals * 100 + hints * 10 + latency / 1000 }
    })
    .sort((a, b) => b.weakness - a.weakness)
    .filter((x) => x.weakness > 0)
    .slice(0, limit)
    .map((x) => x.b)
}

// ---------------------------------------------------------------------------
// Resume link — the whole learner in a URL, so a cleared browser or a second
// device is not a lost tester. No backend, no account, nothing sent anywhere.
// ---------------------------------------------------------------------------

export function encodeLearner(s: LearnerState = getLearner()): string {
  const json = JSON.stringify(s)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeLearner(token: string): LearnerState | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as LearnerState
    return parsed.version === VERSION ? parsed : null
  } catch {
    return null
  }
}

export function adoptLearner(next: LearnerState) {
  state = next
  save()
  emit()
}

/** Read ?t= on load so a resume link restores the learner before anything renders. */
export function hydrateFromUrl(): boolean {
  if (typeof window === 'undefined') return false
  const token = new URLSearchParams(window.location.search).get('t')
  if (!token) return false
  const next = decodeLearner(token)
  if (!next) return false
  adoptLearner(next)
  return true
}

export function resetLearner() {
  state = emptyLearner()
  save()
  emit()
}

/**
 * Remember a section that has been played. Unions rather than replaces, so it cannot
 * be wiped by a caller that happens to hold a stale list.
 */
export function rememberPlayed(rootIds: string[], collisionId?: string | null) {
  update((s) => {
    if (rootIds.length) s.roots_played = [...new Set([...s.roots_played, ...rootIds])]
    if (collisionId) s.collisions_played = [...new Set([...s.collisions_played, collisionId])]
  })
}

/**
 * Drop the in-memory record so the next read loads the pair that is now current.
 *
 * Called when somebody switches pair. Kept here rather than inside setPair so that
 * engine/pair.ts stays pure storage and the two modules do not import each other.
 */
/**
 * Everything this device holds about a learner, gone.
 *
 * Only for account deletion, and it is what the deletion flow was missing entirely: the
 * server wiped the account and the client kept every byte, so somebody who closed their
 * account landed on their own Club page with their whole history intact and the redirect
 * to it working perfectly. It looked exactly like the deletion had failed, on the one
 * flow where trust IS the product.
 *
 * Every namespaced key, not just the current pair's — a learner may have started more
 * than one — plus the legacy unnamespaced record, the analytics buffer, the chosen pair
 * and the remembered library scope. Deliberately enumerated by prefix rather than by
 * calling localStorage.clear(), so a future key that belongs to something else on the
 * same origin is not swept up by accident.
 */
export function wipeLearner() {
  if (typeof window === 'undefined') return
  try {
    const doomed: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('byheart.')) doomed.push(key)
    }
    doomed.forEach((k) => window.localStorage.removeItem(k))
    window.sessionStorage.removeItem('byheart.events.v1')
    window.sessionStorage.removeItem('byheart.session.v1')
  } catch {
    /* private mode, or storage blocked. Nothing to clear. */
  }
  resetLearnerCache()
}

export function resetLearnerCache() {
  state = null
  emit()
}

/** Recorded once. Re-accepting does not move the date. */
export function acceptDeal() {
  update((s) => {
    if (!s.deal_accepted_at) s.deal_accepted_at = new Date().toISOString()
  })
}

export function hasAcceptedDeal(): boolean {
  return Boolean(getLearner().deal_accepted_at)
}

/**
 * Pull the server's copy down and merge it into this device's.
 *
 * The half of sync that did not exist. Progress uploaded and never came back, so
 * signing in on a new phone started you at zero and clearing the browser lost work the
 * server was already holding.
 *
 * Merge, never replace — in either direction. Taking the server copy would destroy an
 * offline session; taking the local one would destroy whatever the other device did.
 * mergeLearner asserts that neither can happen before this writes anything.
 *
 * Silent by design: an unprovisioned deployment, an offline phone and a 401 all mean
 * the same thing here, which is that the local copy stays authoritative and the learner
 * notices nothing.
 */
export async function restoreLearner(): Promise<'merged' | 'nothing' | 'failed'> {
  if (typeof window === 'undefined') return 'nothing'
  try {
    const res = await fetch('/api/session?mine=1', { headers: { accept: 'application/json' } })
    if (!res.ok) return 'failed'
    const body = (await res.json()) as { found?: boolean; state?: Partial<LearnerState> }
    if (!body?.found || !body.state) return 'nothing'
    const local = getLearner()
    const merged = mergeLearner(local, body.state)
    // Nothing changed is worth knowing about: it means the round trip is working and
    // the two copies already agreed, which is the steady state.
    const gained =
      merged.proof.length !== local.proof.length ||
      Object.keys(merged.inventory).length !== Object.keys(local.inventory).length
    state = merged
    save()
    emit()
    if (gained) void syncSession('restore')
    return 'merged'
  } catch {
    // Offline, or no store configured. The local copy is untouched.
    return 'failed'
  }
}

/** One more cold prompt answered. Union, like everything else that only ever grows. */
export function rememberNoCue(id: string) {
  update((s) => {
    if (!s.nocue_done.includes(id)) s.nocue_done = [...s.nocue_done, id]
  })
}

/**
 * A Legend card, answered — or emptied.
 *
 * Emptying is a real action, not an oversight: some people have no children and some will
 * not say why they left. Clearing every slot removes the card from the record entirely,
 * so it drops out of the run-through without ever appearing as a gap to be filled.
 */
export function answerLegend(frameId: string, values: Record<string, string>) {
  update((s) => {
    const before = s.legend.find((a) => a.frame_id === frameId)
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()))
    s.legend = [
      ...s.legend.filter((a) => a.frame_id !== frameId),
      {
        frame_id: frameId,
        values: filled,
        said_cold: before?.said_cold ?? 0,
        // Every write restamps, because the merge decides between two edits by which is
        // later. This is the field that makes clearing a card stick.
        at: new Date().toISOString(),
      },
    ]
  })
}

/** Taken up, or turned down. Turned down is a decision and it is respected forever. */
export function setLegendPrompt(value: 'accepted' | 'declined') {
  update((s) => {
    // Accepting is not reversible by a later decline elsewhere: somebody who has built a
    // card has answered the question, and re-offering would be the product forgetting.
    if (s.legend_prompt === 'accepted') return
    s.legend_prompt = value
  })
}

/** One clean cold delivery. The count drives rehearsal order and is never shown. */
export function rehearsedLegend(frameId: string) {
  update((s) => {
    s.legend = s.legend.map((a) =>
      a.frame_id === frameId ? { ...a, said_cold: a.said_cold + 1 } : a,
    )
  })
}

/** A daily line shown. Recorded wherever it was shown — the page or a notification. */
export function rememberLine(id: string) {
  update((s) => {
    if (!s.lines_seen.includes(id)) s.lines_seen = [...s.lines_seen, id]
  })
}

/** A section carried to the end. The thing that unlocks the Club. */
export function rememberSection(family: string) {
  update((s) => {
    if (!s.sections_completed.includes(family)) {
      s.sections_completed = [...s.sections_completed, family]
    }
  })
}

/** The welcome fires once, ever, and the first time is the true time. */
export function welcomeToClub() {
  update((s) => {
    s.club_welcomed_at ??= new Date().toISOString()
  })
}
