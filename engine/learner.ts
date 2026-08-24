'use client'

/**
 * The learner, not the lesson.
 *
 * Missions come and go; this is what accumulates. Spec §8: cultural worlds are
 * sources, the inventory is the learner's capability. It therefore has to survive
 * Mission 01 → Mission 02 → the 24–72h recall, which for this prototype means the
 * tester's own phone plus a resume link that carries the whole state in the URL.
 */

import type { MissionId, PropertyId } from '@/content/types'
import { BLOCK_ORDER, TARGETS } from '@/content/targets'

/**
 * A piece id. The two original missions used a closed PieceId union; the v0.6 root
 * graph mints pieces from content, so this is deliberately open.
 */
export type PieceId = string

const KEY = 'byheart.learner.v1'
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
  /** release = the film removed. nocue = never had one. collision = two worlds at once. */
  source: 'release' | 'nocue' | 'collision'
  /** Whether it came out right first time, with no hint taken. */
  clean: boolean
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
    window.localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full quota. The in-memory copy still drives the session.
  }
}

export function loadLearner(): LearnerState {
  if (state) return state
  if (typeof window === 'undefined') return emptyLearner()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LearnerState
      if (parsed.version === VERSION) {
        // Fields added after a tester started are backfilled rather than version-bumped:
        // a bump throws away a session that is still running, which is a worse bug than
        // a missing array.
        parsed.proof ??= []
        state = parsed
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
export function recordProof(line: Omit<ProofLine, 'at'>) {
  const s = loadLearner()
  if (s.proof.some((p) => p.pt === line.pt)) return
  s.proof = [...s.proof, { ...line, at: new Date().toISOString() }]
  save()
  emit()
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
        user_agent: navigator.userAgent,
      }),
    })
    const body = await res.json()
    return Boolean(body?.stored)
  } catch {
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
