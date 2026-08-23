'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import type { BlockId } from '@/content/types'
import { FINAL_TEST_ITEMS, SCREENS } from '@/content/topgun-pt'
import { BLOCK_ORDER } from '@/content/targets'
import { initAnalytics, track } from './analytics'
import type { HintLevel } from './hints'

export type Familiarity = 'high' | 'medium' | 'low'
export type Outcome = 'first-try' | 'self-corrected' | 'with-hint' | 'revealed'

export interface ItemRecord {
  screenId: string
  attempts: number
  /** Highest ladder rung reached. */
  hintLevel: HintLevel
  outcome: Outcome
  responseMs: number
  isFinalTest: boolean
}

export interface SessionState {
  sessionId: string
  index: number
  familiarity?: Familiarity
  inventory: BlockId[]
  items: Record<string, ItemRecord>
  nextWorlds: string[]
  continueIntent?: 'yes' | 'maybe' | 'no'
  feedbackText: string
  complete: boolean
}

type Action =
  | { type: 'init'; sessionId: string }
  | { type: 'familiarity'; value: Familiarity }
  | { type: 'acquire'; blocks: BlockId[] }
  | { type: 'record'; record: ItemRecord }
  | { type: 'next' }
  | { type: 'goto'; index: number }
  | { type: 'worlds'; ids: string[] }
  | { type: 'intent'; value: 'yes' | 'maybe' | 'no' }
  | { type: 'feedback'; value: string }
  | { type: 'complete' }

const initialState: SessionState = {
  sessionId: '',
  index: 0,
  inventory: [],
  items: {},
  nextWorlds: [],
  feedbackText: '',
  complete: false,
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'init':
      return { ...state, sessionId: action.sessionId }
    case 'familiarity':
      return { ...state, familiarity: action.value }
    case 'acquire': {
      const added = action.blocks.filter((b) => !state.inventory.includes(b))
      if (!added.length) return state
      // Keep the chip rail in curriculum order rather than acquisition order.
      const next = BLOCK_ORDER.filter(
        (b) => state.inventory.includes(b) || added.includes(b),
      )
      return { ...state, inventory: next }
    }
    case 'record':
      return {
        ...state,
        items: { ...state.items, [action.record.screenId]: action.record },
      }
    case 'next':
      return { ...state, index: Math.min(state.index + 1, SCREENS.length - 1) }
    case 'goto':
      return { ...state, index: action.index }
    case 'worlds':
      return { ...state, nextWorlds: action.ids }
    case 'intent':
      return { ...state, continueIntent: action.value }
    case 'feedback':
      return { ...state, feedbackText: action.value }
    case 'complete':
      return { ...state, complete: true }
    default:
      return state
  }
}

export interface Scores {
  /** X — Lisbon items completed without the answer being revealed. */
  transferred: number
  /** Y — Lisbon items correct on the first attempt with no assistance. */
  firstTry: number
  /** Z — Lisbon items that needed a scaffolded hint or a reveal. */
  assisted: number
  total: number
  /** Teaching items (everything before Lisbon) answered right first time. */
  firstTryAcquisition: number
  teachingItems: number
  checkpoint1: number
  checkpoint2: number
}

export function computeScores(state: SessionState): Scores {
  const finals = FINAL_TEST_ITEMS.map((id) => state.items[id]).filter(Boolean)
  const teaching = Object.values(state.items).filter(
    (i) => !i.isFinalTest && !i.screenId.startsWith('S15') && !i.screenId.startsWith('S34'),
  )
  const cp = (id: string) => {
    const rec = state.items[id]
    return rec ? (rec.outcome === 'first-try' ? 1 : 0) : 0
  }
  return {
    transferred: finals.filter((i) => i.outcome !== 'revealed').length,
    firstTry: finals.filter((i) => i.outcome === 'first-try').length,
    assisted: finals.filter((i) => i.outcome === 'with-hint' || i.outcome === 'revealed')
      .length,
    total: FINAL_TEST_ITEMS.length,
    firstTryAcquisition: teaching.filter((i) => i.outcome === 'first-try').length,
    teachingItems: teaching.length,
    checkpoint1: cp('S15'),
    checkpoint2: cp('S34'),
  }
}

interface SessionApi {
  state: SessionState
  screen: (typeof SCREENS)[number]
  scores: Scores
  next: () => void
  setFamiliarity: (value: Familiarity) => void
  acquire: (blocks: BlockId | BlockId[]) => void
  record: (record: ItemRecord) => void
  setWorlds: (ids: string[]) => void
  setIntent: (value: 'yes' | 'maybe' | 'no') => void
  setFeedback: (value: string) => void
  finish: () => void
}

const Ctx = createContext<SessionApi | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const id = initAnalytics()
    dispatch({ type: 'init', sessionId: id })
    track('session_start', { session_id: id, mission: 'top_gun_pt_pt_v1' })
  }, [])

  const screen = SCREENS[state.index]

  useEffect(() => {
    if (!state.sessionId) return
    track('screen_view', { screen: screen.id, name: screen.name, stage: screen.stage })
    if (screen.id === 'L01') track('lisbon_test_start', {})
  }, [screen.id, screen.name, screen.stage, state.sessionId])

  const acquire = useCallback((blocks: BlockId | BlockId[]) => {
    const list = Array.isArray(blocks) ? blocks : [blocks]
    dispatch({ type: 'acquire', blocks: list })
    list.forEach((b) => track('block_acquired', { block: b }))
  }, [])

  const api = useMemo<SessionApi>(
    () => ({
      state,
      screen,
      scores: computeScores(state),
      next: () => dispatch({ type: 'next' }),
      setFamiliarity: (value) => {
        dispatch({ type: 'familiarity', value })
        track('top_gun_familiarity', { familiarity: value })
      },
      acquire,
      record: (record) => {
        dispatch({ type: 'record', record })
        if (record.isFinalTest) {
          track('final_item_result', {
            screen: record.screenId,
            outcome: record.outcome,
            first_try: record.outcome === 'first-try',
            hint_level: record.hintLevel,
            response_ms: record.responseMs,
          })
        }
      },
      setWorlds: (ids) => {
        dispatch({ type: 'worlds', ids })
        track('next_world_interest', { worlds: ids })
      },
      setIntent: (value) => {
        dispatch({ type: 'intent', value })
        track('continue_intent', { intent: value })
      },
      setFeedback: (value) => dispatch({ type: 'feedback', value }),
      finish: () => {
        dispatch({ type: 'complete' })
        track('session_complete', {})
      },
    }),
    [state, screen, acquire],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useSession(): SessionApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
