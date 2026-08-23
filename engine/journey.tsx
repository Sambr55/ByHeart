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
  | { kind: 'picker' }
  | { kind: 'root'; rootId: string; beat: RootBeat; pieceIndex?: number }
  | { kind: 'collision'; collisionId: string }
  | { kind: 'section-complete' }
  | { kind: 'nocue'; i: number }
  | { kind: 'cansay' }
  | { kind: 'close' }

export type RootBeat =
  | 'recognise'
  | 'translate'
  | 'extract'
  | 'piece'
  | 'branch'
  | 'build'
  | 'voice'
  | 'release'

/**
 * ROOT -> NATURAL PORTUGUESE -> SEMANTIC BRIDGE -> EXTRACT -> BUILD -> RELEASE.
 * §20.14 makes this order non-negotiable, so it is generated from the root rather
 * than hand-authored per screen — a root physically cannot skip its bridge.
 */
export function beatsFor(root: Root): { beat: RootBeat; pieceIndex?: number }[] {
  const b = (beat: RootBeat) => ({ beat })
  // The useful bits are shown together inside the line, then unpacked one at a time.
  // Two pieces on one screen means the second is skimmed; PODES and QUANDO QUISERES
  // each deserve their own moment.
  const pieces = root.extracts.map((_, pieceIndex) => ({ beat: 'piece' as RootBeat, pieceIndex }))

  if (root.freebie_flag) {
    // §B10: a freebie is a ten-second wink. Recognition -> Portuguese -> takeaway.
    return [b('recognise'), b('translate'), b('extract'), ...pieces, b('release')]
  }
  const beats = [b('recognise'), b('translate'), b('extract'), ...pieces, b('branch'), b('build')]
  if (root.voice_options?.length) beats.push(b('voice'))
  beats.push(b('release'))
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
  | { type: 'append'; steps: Step[]; rootId?: string; rootIds?: string[]; collisionId?: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; index: number }
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'complete' }

const initial: JourneyState = {
  steps: [
    { kind: 'landing' },
    ...DEMO_BEATS.map((_, i) => ({ kind: 'demo' as const, i })),
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
  return beatsFor(root).map(({ beat, pieceIndex }) => ({
    kind: 'root' as const,
    rootId: root.root_id,
    beat,
    pieceIndex,
  }))
}

function reducer(state: JourneyState, action: Action): JourneyState {
  switch (action.type) {
    case 'choose-family':
      return { ...state, family: action.family }
    case 'append':
      return {
        ...state,
        steps: [...state.steps, ...action.steps],
        rootsPlayed: action.rootIds
          ? [...state.rootsPlayed, ...action.rootIds]
          : action.rootId
            ? [...state.rootsPlayed, action.rootId]
            : state.rootsPlayed,
        collisionsPlayed: action.collisionId
          ? [...state.collisionsPlayed, action.collisionId]
          : state.collisionsPlayed,
      }
    case 'next':
      return { ...state, index: Math.min(state.index + 1, state.steps.length) }
    case 'back':
      return { ...state, index: Math.max(state.index - 1, 0) }
    case 'goto':
      return { ...state, index: Math.max(0, Math.min(action.index, state.steps.length - 1)) }
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
  back: () => void
  goHome: () => void
  canGoBack: boolean
  chooseFamily: (family: CultureFamily) => void
  finishSection: (decision: 'another' | 'done') => void
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
      // A section is played whole. Offering "where next?" between every root turned the
      // choice into a tax; the learner picks an area, works through it, and then decides.
      const roots = ROOTS_BY_FAMILY[family].filter((r) => !state.rootsPlayed.includes(r.root_id))
      const steps: Step[] = roots.flatMap((r) => rootSteps(r))
      steps.push({ kind: 'section-complete' })
      dispatch({
        type: 'append',
        steps,
        rootIds: roots.map((r) => r.root_id),
      })
      dispatch({ type: 'next' })
    },
    [],
  )

  /** Finish here, or go back to the areas and pick another. */
  const finishSection = useCallback(
    (decision: 'another' | 'done') => {
      track('section_decision', { decision, roots: state.rootsPlayed.length })
      void syncSession('section_' + decision)
      if (decision === 'another') {
        const picker = state.steps.findIndex((s) => s.kind === 'picker')
        dispatch({ type: 'goto', index: picker < 0 ? 0 : picker })
        return
      }
      const steps: Step[] = []
      const collision = availableCollision(state.rootsPlayed, state.collisionsPlayed)
      if (collision) steps.push({ kind: 'collision', collisionId: collision.id })
      steps.push({ kind: 'nocue', i: 0 }, { kind: 'nocue', i: 1 }, { kind: 'nocue', i: 2 })
      steps.push({ kind: 'cansay' }, { kind: 'close' })
      dispatch({ type: 'append', steps, collisionId: collision?.id })
      dispatch({ type: 'next' })
    },
    [state.collisionsPlayed, state.rootsPlayed, state.steps],
  )

  const goHome = useCallback(() => {
    const picker = state.steps.findIndex((s) => s.kind === 'picker')
    track('return_home', { from: state.steps[state.index]?.kind })
    dispatch({ type: 'goto', index: picker < 0 ? 0 : picker })
  }, [state.index, state.steps])

  const api = useMemo<JourneyApi>(
    () => ({
      state,
      step,
      root,
      owned: Object.keys(learner.inventory),
      next: () => dispatch({ type: 'next' }),
      back: () => dispatch({ type: 'back' }),
      goHome,
      canGoBack: state.index > 0,
      chooseFamily,
      finishSection,
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
    [state, step, root, learner.inventory, chooseFamily, finishSection, goHome],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useJourney(): JourneyApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJourney must be used inside JourneyProvider')
  return ctx
}

export { PIECES }
