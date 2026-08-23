'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import type { BlockId, Mission, Screen } from '@/content/types'
import { CULTURE_FREE_STAGES } from '@/content/types'
import { BLOCK_ORDER } from '@/content/targets'
import { initAnalytics, track } from './analytics'
import {
  completeMission,
  getLearner,
  hoursSinceLastMission,
  hydrateFromUrl,
  loadLearner,
  ownedBlocks,
  recordEvidence,
  setExperiment,
  type EvidenceType,
} from './learner'
import { useLearner } from './useLearner'
import type { HintLevel } from './hints'

export type Familiarity = 'high' | 'medium' | 'low'
export type Outcome = 'first-try' | 'self-corrected' | 'with-hint' | 'revealed'

export interface ItemRecord {
  screenId: string
  attempts: number
  hintLevel: HintLevel
  outcome: Outcome
  responseMs: number
  isFinalTest: boolean
}

export interface SessionState {
  sessionId: string
  index: number
  items: Record<string, ItemRecord>
  /** Answers the learner gives that are not exercises (scales, free text, picks). */
  answers: Record<string, unknown>
  complete: boolean
}

type Action =
  | { type: 'init'; sessionId: string }
  | { type: 'record'; record: ItemRecord }
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'next' }
  | { type: 'goto'; index: number }
  | { type: 'complete' }

const initialState: SessionState = {
  sessionId: '',
  index: 0,
  items: {},
  answers: {},
  complete: false,
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'init':
      return { ...state, sessionId: action.sessionId }
    case 'record':
      return {
        ...state,
        items: { ...state.items, [action.record.screenId]: action.record },
      }
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.key]: action.value } }
    case 'next':
      return { ...state, index: state.index + 1 }
    case 'goto':
      return { ...state, index: action.index }
    case 'complete':
      return { ...state, complete: true }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Which blocks a screen is evidence about, and what kind of evidence it is
// ---------------------------------------------------------------------------

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v]
}

export function targetsOf(screen: Screen): BlockId[] {
  const explicit = [
    ...asArray(screen.acquires),
    ...asArray(screen.reinforces),
    ...(screen.combines ?? []),
  ]
  if (explicit.length) return [...new Set(explicit)]
  if (screen.type === 'meaning-check') return [screen.target]
  if (screen.chipHint) return [screen.chipHint]
  if (screen.type === 'composite') {
    return [...new Set(screen.parts.map((p) => p.chipHint).filter(Boolean) as BlockId[])]
  }
  return []
}

function evidenceTypeFor(screen: Screen, mission: Mission): EvidenceType {
  if (mission.cold_recall_items?.includes(screen.id)) return 'cold_recall'
  if (mission.crossover_items?.includes(screen.id)) return 'crossover'
  if (mission.transfer_items.includes(screen.id)) return 'transfer'
  if (screen.type === 'recall-burst') return 'checkpoint_recall'
  if (screen.combines?.length) return 'combine'
  if (asArray(screen.reinforces).length) return 'reinforce'
  if (asArray(screen.acquires).length) return 'acquire'
  return 'transfer'
}

// ---------------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------------

export interface Scores {
  transferred: number
  firstTry: number
  assisted: number
  total: number
  firstTryAcquisition: number
  teachingItems: number
  coldRecallCorrect: number
  coldRecallTotal: number
  crossoverCorrect: number
  crossoverUnassisted: number
  crossoverTotal: number
}

export function computeScores(state: SessionState, mission: Mission): Scores {
  const get = (ids: string[]) => ids.map((id) => state.items[id]).filter(Boolean)
  const finals = get(mission.transfer_items)
  const cold = get(mission.cold_recall_items ?? [])
  const cross = get(mission.crossover_items ?? [])
  const special = new Set([
    ...mission.transfer_items,
    ...(mission.cold_recall_items ?? []),
    ...(mission.crossover_items ?? []),
  ])
  const teaching = Object.values(state.items).filter(
    (i) => !special.has(i.screenId) && !i.screenId.startsWith('S15') && !i.screenId.startsWith('S34'),
  )
  return {
    transferred: finals.filter((i) => i.outcome !== 'revealed').length,
    firstTry: finals.filter((i) => i.outcome === 'first-try').length,
    assisted: finals.filter((i) => i.outcome === 'with-hint' || i.outcome === 'revealed').length,
    total: mission.transfer_items.length,
    firstTryAcquisition: teaching.filter((i) => i.outcome === 'first-try').length,
    teachingItems: teaching.length,
    coldRecallCorrect: cold.filter((i) => i.outcome === 'first-try').length,
    coldRecallTotal: (mission.cold_recall_items ?? []).length,
    crossoverCorrect: cross.filter((i) => i.outcome !== 'revealed').length,
    crossoverUnassisted: cross.filter((i) => i.outcome === 'first-try').length,
    crossoverTotal: (mission.crossover_items ?? []).length,
  }
}

// ---------------------------------------------------------------------------

interface SessionApi {
  state: SessionState
  mission: Mission
  /** The sequence actually being played, after the control arm's removals. */
  screens: Screen[]
  screen: Screen
  scores: Scores
  inventory: BlockId[]
  /** Blocks banked during this mission, for "NEW" badging. */
  next: () => void
  acquire: (blocks: BlockId | BlockId[]) => void
  record: (record: ItemRecord) => void
  answer: (key: string, value: unknown) => void
  finish: () => void
  /** culture_neutral swaps the cultural setup only. */
  variant: 'culture_full' | 'culture_neutral'
}

const Ctx = createContext<SessionApi | null>(null)

export function MissionProvider({
  mission,
  children,
}: {
  mission: Mission
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const learner = useLearner()

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    const params = new URLSearchParams(window.location.search)
    const variant = params.get('variant') === 'neutral' ? 'culture_neutral' : 'culture_full'
    const cohort = params.get('cohort') ?? ''
    const age = hoursSinceLastMission()
    setExperiment({
      test_variant: variant,
      cohort_tag: cohort,
      same_or_delayed:
        age === null ? 'unknown' : age < 6 ? 'same_session' : 'delayed_24_72h',
    })
    const id = initAnalytics()
    dispatch({ type: 'init', sessionId: id })
    track('session_start', {
      session_id: id,
      learner_id: getLearner().learner_id,
      mission: mission.mission_id,
      property: mission.property_id,
      test_variant: variant,
      cohort_tag: cohort,
      previous_session_age_hours: age,
      prior_missions: getLearner().missions_completed,
      no_prior_mission01:
        mission.mission_id === 'mission_02' &&
        !getLearner().missions_completed.includes('mission_01'),
    })
  }, [mission.mission_id, mission.property_id])

  const variant = learner.experiment.test_variant
  /**
   * The control arm is a different door to identical Portuguese. Screens that exist
   * only because of the cultural layer are removed rather than reworded, so the two
   * arms never differ in vocabulary, difficulty or number of interactions.
   */
  const screens = useMemo(
    () =>
      variant === 'culture_full'
        ? mission.screens
        : mission.screens.filter((s) => !s.skipInNeutral),
    [mission.screens, variant],
  )
  const screen = screens[Math.min(state.index, screens.length - 1)]

  useEffect(() => {
    if (!state.sessionId) return
    track('screen_view', {
      screen: screen.id,
      name: screen.name,
      stage: screen.stage,
      mission: mission.mission_id,
    })
  }, [screen.id, screen.name, screen.stage, state.sessionId, mission.mission_id])

  const acquire = useCallback(
    (blocks: BlockId | BlockId[]) => {
      const list = Array.isArray(blocks) ? blocks : [blocks]
      list.forEach((b) => {
        track('block_acquired', { block: b, mission: mission.mission_id })
        recordEvidence({
          target_id: b,
          event_type: 'encounter',
          correct_first_try: true,
          hint_count: 0,
          revealed: false,
          latency_ms: 0,
          culture_context: mission.property_id,
          mission_id: mission.mission_id,
        })
      })
    },
    [mission.mission_id, mission.property_id],
  )

  const record = useCallback(
    (rec: ItemRecord) => {
      dispatch({ type: 'record', record: rec })
      const evType = evidenceTypeFor(screen, mission)
      const cultureFree = CULTURE_FREE_STAGES.has(screen.stage)
      for (const target of targetsOf(screen)) {
        recordEvidence({
          target_id: target,
          event_type: evType,
          correct_first_try: rec.outcome === 'first-try',
          hint_count: rec.hintLevel >= 2 ? 1 : 0,
          revealed: rec.outcome === 'revealed',
          latency_ms: rec.responseMs,
          culture_context: cultureFree ? null : mission.property_id,
          mission_id: mission.mission_id,
        })
      }
      if (evType === 'reinforce') {
        for (const target of asArray(screen.reinforces)) {
          track('target_reinforced', {
            target_id: target,
            prior_source: getLearner().inventory[target]?.acquired_source ?? null,
            current_source: mission.property_id,
            first_try: rec.outcome === 'first-try',
          })
        }
      }
      if (screen.combines?.length) {
        track('cross_world_combo', {
          target_ids: screen.combines,
          first_try: rec.outcome === 'first-try',
          hint_count: rec.hintLevel >= 2 ? 1 : 0,
          latency_ms: rec.responseMs,
        })
      }
      if (mission.cold_recall_items?.includes(screen.id)) {
        track('cold_recall', {
          target_id: targetsOf(screen)[0],
          first_try: rec.outcome === 'first-try',
          correct: rec.outcome !== 'revealed',
          latency_ms: rec.responseMs,
          hint_count: rec.hintLevel,
        })
      }
      if (mission.crossover_items?.includes(screen.id)) {
        track('crossover_item', {
          item_id: screen.id,
          target_ids: targetsOf(screen),
          first_try: rec.outcome === 'first-try',
          hint_count: rec.hintLevel,
          latency_ms: rec.responseMs,
        })
      }
      if (mission.transfer_items.includes(screen.id)) {
        track('final_item_result', {
          screen: screen.id,
          outcome: rec.outcome,
          first_try: rec.outcome === 'first-try',
          hint_level: rec.hintLevel,
          response_ms: rec.responseMs,
        })
      }
    },
    [mission, screen],
  )

  const inventory = useMemo(() => {
    const owned = new Set(Object.keys(learner.inventory))
    return BLOCK_ORDER.filter((b) => owned.has(b))
  }, [learner.inventory])

  const api = useMemo<SessionApi>(
    () => ({
      state,
      mission,
      screens,
      screen,
      scores: computeScores(state, mission),
      inventory,
      variant,
      next: () => dispatch({ type: 'next' }),
      acquire,
      record,
      answer: (key, value) => dispatch({ type: 'answer', key, value }),
      finish: () => {
        dispatch({ type: 'complete' })
        completeMission(mission.mission_id)
        track('session_complete', { mission: mission.mission_id })
      },
    }),
    [state, mission, screens, screen, inventory, variant, acquire, record],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useSession(): SessionApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSession must be used inside MissionProvider')
  return ctx
}

/** Cultural setup swapped for the control variant; the Portuguese never changes. */
export function useCopy(screen: Screen) {
  const { variant } = useSession()
  if (variant === 'culture_full' || !screen.neutral) return screen
  return { ...screen, ...screen.neutral }
}

export { ownedBlocks }
