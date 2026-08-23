'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import {
  COLLISIONS,
  PIECES,
  ROOTS,
  ROOTS_BY_FAMILY,
  rootById,
  type Collision,
  type CultureFamily,
  type Root,
} from '@/content/roots'
import { DEMO_BEATS } from '@/content/front-door'
import { initAnalytics, track } from './analytics'
import {
  getLearner,
  hydrateFromUrl,
  loadLearner,
  recordVoiceSignal,
  setAffinity,
  setExperiment,
  setTester,
  syncSession,
} from './learner'
import { useLearner } from './useLearner'

/**
 * The journey.
 *
 * v0.6 replaced two fixed missions with a graph: the front door is fixed for exactly
 * two beats, and from then on the learner chooses. So this is a queue that grows as
 * they choose rather than an array they are walked down — which is the only honest way
 * to build "there is no default cultural franchise" (§20.13).
 */

export type Step =
  | { kind: 'landing' }
  | { kind: 'demo'; i: number }
  | { kind: 'freetext' }
  | { kind: 'picker' }
  | { kind: 'root'; rootId: string; beat: RootBeat }
  | { kind: 'wherenext' }
  | { kind: 'collision'; collisionId: string }
  | { kind: 'nocue'; i: number }
  | { kind: 'cansay' }
  | { kind: 'close' }

export type RootBeat =
  | 'recognise'
  | 'translate'
  | 'extract'
  | 'branch'
  | 'build'
  | 'voice'
  | 'release'

/**
 * ROOT -> NATURAL PORTUGUESE -> SEMANTIC BRIDGE -> EXTRACT -> BUILD -> RELEASE.
 * §20.14 makes this order non-negotiable, so it is generated from the root rather
 * than hand-authored per screen — a root physically cannot skip its bridge.
 */
export function beatsFor(root: Root): RootBeat[] {
  if (root.freebie_flag) {
    // §B10: a freebie is a ten-second wink. Recognition -> Portuguese -> takeaway.
    return ['recognise', 'translate', 'extract', 'release']
  }
  const beats: RootBeat[] = ['recognise', 'translate', 'extract', 'branch', 'build']
  if (root.voice_options?.length) beats.push('voice')
  beats.push('release')
  return beats
}

const ROOTS_PER_SESSION = 4

interface JourneyState {
  steps: Step[]
  index: number
  family: CultureFamily | null
  rootsPlayed: string[]
  collisionsPlayed: string[]
  answers: Record<string, unknown>
  complete: boolean
}

type Action =
  | { type: 'choose-family'; family: CultureFamily }
  | { type: 'append'; steps: Step[]; rootId?: string; collisionId?: string }
  | { type: 'next' }
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'complete' }

const initial: JourneyState = {
  steps: [
    { kind: 'landing' },
    ...DEMO_BEATS.map((_, i) => ({ kind: 'demo' as const, i })),
    { kind: 'freetext' },
    { kind: 'picker' },
  ],
  index: 0,
  family: null,
  rootsPlayed: [],
  collisionsPlayed: [],
  answers: {},
  complete: false,
}

function rootSteps(root: Root): Step[] {
  return beatsFor(root).map((beat) => ({ kind: 'root' as const, rootId: root.root_id, beat }))
}

function reducer(state: JourneyState, action: Action): JourneyState {
  switch (action.type) {
    case 'choose-family':
      return { ...state, family: action.family }
    case 'append':
      return {
        ...state,
        steps: [...state.steps, ...action.steps],
        rootsPlayed: action.rootId
          ? [...state.rootsPlayed, action.rootId]
          : state.rootsPlayed,
        collisionsPlayed: action.collisionId
          ? [...state.collisionsPlayed, action.collisionId]
          : state.collisionsPlayed,
      }
    case 'next':
      return { ...state, index: Math.min(state.index + 1, state.steps.length) }
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.key]: action.value } }
    case 'complete':
      return { ...state, complete: true }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Choosing what comes next
// ---------------------------------------------------------------------------

export type WhereNext = 'stay' | 'mood' | 'surprise'

function ownedPieces(): string[] {
  return Object.keys(getLearner().inventory)
}

/**
 * §08 — the system may recommend contrast but must never force a franchise sequence,
 * and at least one option should reinforce something already owned. The curriculum
 * runs underneath; the learner sees a cultural choice.
 */
export function pickRoot(
  choice: WhereNext,
  family: CultureFamily | null,
  played: string[],
): Root {
  const owned = new Set(ownedPieces())
  const unplayed = ROOTS.filter((r) => !played.includes(r.root_id))
  const reinforcing = (r: Root) =>
    r.reinforces.filter((p) => owned.has(p)).length + (r.freebie_flag ? -1 : 0)

  if (choice === 'stay' && family) {
    const same = unplayed.filter((r) => r.culture_family === family)
    if (same.length) return same.sort((a, b) => reinforcing(b) - reinforcing(a))[0]
  }
  if (choice === 'mood') {
    const other = unplayed.filter((r) => r.culture_family !== family)
    const strengthens = other.filter((r) => reinforcing(r) > 0)
    const pool = strengthens.length ? strengthens : other
    if (pool.length) return pool.sort((a, b) => reinforcing(b) - reinforcing(a))[0]
  }
  const families = new Set(played.map((id) => rootById(id)?.culture_family))
  const fresh = unplayed.filter((r) => !families.has(r.culture_family))
  const pool = fresh.length ? fresh : unplayed
  return pool.sort((a, b) => b.branches.length - a.branches.length)[0] ?? ROOTS[0]
}

export function availableCollision(played: string[], done: string[]): Collision | null {
  const owned = new Set(ownedPieces())
  return (
    COLLISIONS.find(
      (c) => !done.includes(c.id) && c.requires.every((p) => owned.has(p)),
    ) ?? null
  )
}

/** §13 — what the learner can now do, in speech acts rather than counts. */
const SPEECH_ACTS: Record<string, string> = {
  comigo: 'invite someone along',
  podes: 'ask someone for something',
  preciso_de: 'explain what you need',
  nao_vou: 'refuse, without being rude',
  amanha: 'make a plan for tomorrow',
  outra_vez: 'ask someone to repeat themselves',
  desculpa: 'apologise',
  chamo_me: 'introduce yourself',
  como_te_chamas: 'ask who someone is',
  como_se_chama: 'ask what something is called',
  com: 'order something the way you like it',
  sem: 'order something the way you like it',
  boa_ideia: 'agree warmly',
  calma: 'calm someone down',
  agora: 'talk about right now',
  tens: 'ask for someone’s time',
  o_que_acontece: 'ask what happened',
  mudar: 'ask to change something',
  e_verdade: 'question what you are told',
  mesmo: 'react to something you like',
  demais: 'admit you overdid it',
  queria_dizer: 'take back what you just said',
  o_mais_importante: 'say what matters',
  importa: 'tell someone they matter',
  aproveita: 'wish someone well',
}

export function capabilities(pieces: string[]): string[] {
  const out: string[] = []
  for (const p of pieces) {
    const act = SPEECH_ACTS[p]
    if (act && !out.includes(act)) out.push(act)
  }
  return out
}

// ---------------------------------------------------------------------------

interface JourneyApi {
  state: JourneyState
  step: Step
  root: Root | null
  next: () => void
  chooseFamily: (family: CultureFamily) => void
  chooseNext: (choice: WhereNext) => void
  answer: (key: string, value: unknown) => void
  recordVoice: (signal: string, pt: string) => void
  finish: () => void
  owned: string[]
}

const Ctx = createContext<JourneyApi | null>(null)

export function JourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const learner = useLearner()

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    const params = new URLSearchParams(window.location.search)
    const tester = params.get('tester')
    if (tester) setTester(tester)
    setExperiment({
      test_variant: params.get('variant') === 'neutral' ? 'culture_neutral' : 'culture_full',
      cohort_tag: params.get('cohort') ?? '',
      same_or_delayed: 'unknown',
    })
    const id = initAnalytics()
    track('session_start', {
      session_id: id,
      learner_id: getLearner().learner_id,
      tester: getLearner().tester_label,
      journey: 'v0.6',
    })
  }, [])

  const step = state.steps[Math.min(state.index, state.steps.length - 1)]
  const root = step?.kind === 'root' ? rootById(step.rootId) ?? null : null

  useEffect(() => {
    if (!step) return
    track('screen_view', { step: step.kind, ...(step.kind === 'root' ? { root: step.rootId, beat: step.beat } : {}) })
  }, [state.index, step])

  const chooseFamily = useCallback(
    (family: CultureFamily) => {
      dispatch({ type: 'choose-family', family })
      setAffinity({ next_world_pre: family })
      track('culture_start_choice', { family, offered: Object.keys(ROOTS_BY_FAMILY) })
      void syncSession('culture_chosen')
      const first = ROOTS_BY_FAMILY[family][0]
      dispatch({
        type: 'append',
        steps: [...rootSteps(first), { kind: 'wherenext' }],
        rootId: first.root_id,
      })
      dispatch({ type: 'next' })
    },
    [],
  )

  const chooseNext = useCallback(
    (choice: WhereNext) => {
      const played = [...state.rootsPlayed]
      const next = pickRoot(choice, state.family, played)
      track('next_root_choice', { choice, root: next.root_id, family: next.culture_family })
      void syncSession('root_' + (state.rootsPlayed.length + 1))
      const steps: Step[] = [...rootSteps(next)]
      const collision = availableCollision(played, state.collisionsPlayed)
      const rootCount = played.length + 1
      if (collision && (rootCount === 2 || rootCount === 4)) {
        steps.push({ kind: 'collision', collisionId: collision.id })
      }
      if (rootCount >= ROOTS_PER_SESSION) {
        steps.push({ kind: 'nocue', i: 0 }, { kind: 'nocue', i: 1 }, { kind: 'nocue', i: 2 })
        steps.push({ kind: 'cansay' }, { kind: 'close' })
      } else {
        steps.push({ kind: 'wherenext' })
      }
      dispatch({
        type: 'append',
        steps,
        rootId: next.root_id,
        collisionId: collision && (rootCount === 2 || rootCount === 4) ? collision.id : undefined,
      })
      dispatch({ type: 'next' })
    },
    [state.collisionsPlayed, state.family, state.rootsPlayed],
  )

  const api = useMemo<JourneyApi>(
    () => ({
      state,
      step,
      root,
      owned: Object.keys(learner.inventory),
      next: () => dispatch({ type: 'next' }),
      chooseFamily,
      chooseNext,
      answer: (key, value) => dispatch({ type: 'answer', key, value }),
      recordVoice: (signal, pt) => {
        recordVoiceSignal(signal, pt)
        track('voice_choice', { signal, pt })
      },
      finish: () => {
        dispatch({ type: 'complete' })
        track('session_complete', { roots: state.rootsPlayed.length })
        void syncSession('journey_complete')
      },
    }),
    [state, step, root, learner.inventory, chooseFamily, chooseNext],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useJourney(): JourneyApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJourney must be used inside JourneyProvider')
  return ctx
}

export { PIECES }
