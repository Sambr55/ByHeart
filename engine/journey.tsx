'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import {
  COLLISIONS,
  PIECES,
  ROOTS,
  ROOTS_BY_FAMILY,
  rungReached,
  rootById,
  type Collision,
  type CultureFamily,
  type Root,
} from '@/content/roots'
import { DEMO_BEATS } from '@/content/front-door'
import { initAnalytics, track } from './analytics'
import {
  getLearner,
  hasAcceptedDeal,
  hydrateFromUrl,
  loadLearner,
  recordVoiceSignal,
  rememberPlayed,
  restoreLearner,
  setAffinity,
  setExperiment,
  setTester,
  syncSession,
  rememberSection,
} from './learner'
import { chosenPair } from './pair'
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
  | { kind: 'pair' }
  | { kind: 'deal' }
  | { kind: 'picker' }
  | { kind: 'root'; rootId: string; beat: RootBeat; pieceIndex?: number }
  | { kind: 'collision'; collisionId: string }
  | { kind: 'osmosis' }
  | { kind: 'profile'; which: 'gender' | 'age' | 'goal' }
  | { kind: 'section-complete' }
  | { kind: 'nocue'; i: number }
  | { kind: 'cansay' }
  | { kind: 'proof' }
  | { kind: 'close' }

export type RootBeat =
  | 'recognise'
  | 'translate'
  | 'extract'
  | 'piece'
  | 'piece-branch'
  | 'branch'
  | 'build'
  | 'voice'
  | 'release'

/**
 * ROOT -> NATURAL PORTUGUESE -> SEMANTIC BRIDGE -> EXTRACT -> BUILD -> RELEASE.
 * §20.14 makes this order non-negotiable, so it is generated from the root rather
 * than hand-authored per screen — a root physically cannot skip its bridge.
 */
/**
 * Which branches belong to which extracted piece. A branch that contains the piece is a
 * demonstration of that piece; anything else is somebody else's example.
 */
export function branchesFor(root: Root, extractId: string) {
  const extract = root.extracts.find((e) => e.id === extractId)
  if (!extract) return []
  const stem = extract.target.replace(/[…?]/g, '').trim().toLowerCase()
  return root.branches.filter((b) => b.target.toLowerCase().includes(stem))
}

/**
 * The build should never be the place a learner meets a word for the first time as a
 * puzzle. Prefer a branch of two or more words with no trailing ellipsis.
 *
 * And never the same sentence as the release. The release exists to show that the line
 * survives without the film attached to it; if it is the sentence they tiled together
 * ninety seconds earlier it demonstrates that they remember the previous screen, which
 * is not the claim. It also simply reads as a bug — you are asked the same question
 * twice in a row.
 */
export function buildTargetFor(root: Root) {
  const usable = (b: { target: string }) => !b.target.includes('…') && b.target.split(' ').length > 1
  return (
    root.branches.find((b) => usable(b) && b.target !== root.transfer_prompt.answer) ??
    root.branches.find(usable) ??
    root.branches[0]
  )
}

export function beatsFor(root: Root): { beat: RootBeat; pieceIndex?: number }[] {
  const b = (beat: RootBeat) => ({ beat })
  /**
   * Each piece is unpacked completely — the piece itself, then what that piece alone
   * lets you say — before the next one starts. Only once every piece has had its turn
   * do they come back together under "one line, three things you can say".
   */
  const pieces = root.extracts.flatMap((e, pieceIndex) => {
    const own = branchesFor(root, e.id)
    const steps: { beat: RootBeat; pieceIndex?: number }[] = [{ beat: 'piece', pieceIndex }]
    if (own.length) steps.push({ beat: 'piece-branch', pieceIndex })
    return steps
  })

  if (root.freebie_flag) {
    // §B10: a freebie is a ten-second wink. Recognition -> Portuguese -> takeaway.
    return [b('recognise'), b('translate'), b('extract'), ...pieces, b('release')]
  }
  const beats = [b('recognise'), b('translate'), b('extract'), ...pieces]
  // Bringing them back together only earns its place when there was more than one.
  if (root.extracts.length > 1) beats.push(b('branch'))
  beats.push(b('build'))
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
  | {
      type: 'append'
      steps: Step[]
      rootId?: string
      rootIds?: string[]
      collisionId?: string
      /** Jump to the first appended step rather than nudging the index forward. */
      jump?: boolean
    }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; index: number }
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'complete' }
  | { type: 'hydrate'; rootIds: string[]; collisionIds: string[] }
  | { type: 'jump'; kind: Step['kind'] }

const initial: JourneyState = {
  steps: [
    { kind: 'landing' },
    ...DEMO_BEATS.map((_, i) => ({ kind: 'demo' as const, i })),
    // After the demo, before the deal. The demo is the argument for choosing at all,
    // and the deal can only say "your Portuguese" truthfully once the pair is known.
    { kind: 'pair' },
    { kind: 'deal' },
    { kind: 'picker' },
  ],
  index: 0,
  family: null,
  rootsPlayed: [],
  collisionsPlayed: [],
  answers: {},
  complete: false,
}

/** Gender first, then age, then why. Skipped counts as answered — we do not re-ask. */
export function nextProfileQuestion(): 'gender' | 'age' | 'goal' | null {
  const p = getLearner().profile ?? { gender: null, age_band: null, goal: null, skipped: [] }
  if (!p.gender && !p.skipped.includes('gender')) return 'gender'
  if (!p.age_band && !p.skipped.includes('age_band')) return 'age'
  if (!p.goal && !p.skipped.includes('goal')) return 'goal'
  return null
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
    /**
     * Land straight on a step rather than walking to it.
     *
     * Only ever used to skip front-door beats somebody has already been through. It
     * cannot invent a step: if the kind is not in the queue the index does not move.
     */
    case 'jump': {
      const to = state.steps.findIndex((st) => st.kind === action.kind)
      return to === -1 ? state : { ...state, index: to }
    }
    // What earlier sessions already covered, read back out of the learner record.
    case 'hydrate':
      return { ...state, rootsPlayed: action.rootIds, collisionsPlayed: action.collisionIds }
    case 'choose-family':
      return { ...state, family: action.family }
    case 'append':
      return {
        ...state,
        // Appending and then incrementing only works when you happen to be standing on
        // the last step. Coming back from the areas screen you are not, and the nudge
        // lands you on whatever followed the picker the first time round — which is why
        // every section was opening on "Talk to me, Goose".
        index: action.jump ? state.steps.length : state.index,
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

/**
 * The same list, keeping what it hangs on.
 *
 * capabilities() throws the piece away, which is why the best list in the product was
 * inert: a learner reads "ask what happened" and cannot see what they would actually
 * say. Two pieces can share one act — com and sem both make "order something the way
 * you like it" — so an act carries a list, not a piece.
 */
export function capabilityEntries(pieces: string[]): { act: string; pieces: string[] }[] {
  const out: { act: string; pieces: string[] }[] = []
  for (const p of pieces) {
    const act = SPEECH_ACTS[p]
    if (!act) continue
    const found = out.find((e) => e.act === act)
    if (found) found.pieces.push(p)
    else out.push({ act, pieces: [p] })
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

export function JourneyProvider({
  children,
  /**
   * Where this URL is trying to start. 'crates' means the learner asked for the picker
   * directly — from the menu, or a bookmark — rather than arriving at the front door.
   */
  enter = 'front-door',
}: {
  children: React.ReactNode
  enter?: 'front-door' | 'crates'
}) {
  const [state, dispatch] = useReducer(reducer, initial)
  const learner = useLearner()

  /**
   * The no-bypass rule, and the reason it runs in an effect rather than during render.
   *
   * Whether the deal has been accepted comes out of localStorage, which the server does
   * not have. Branching on it while rendering reproduces exactly the /line hydration
   * mismatch fixed in 4683827 — the server renders one step and the browser another.
   * So the landing step renders server-side every time and the jump happens after
   * mount, once there is something true to read.
   *
   * Order matters: the pair decides which learner record to load, and that record is
   * what says whether the deal has been accepted.
   */
  const jumped = useRef(false)
  useEffect(() => {
    if (jumped.current || enter !== 'crates') return
    jumped.current = true
    // Load explicitly rather than reading the reactive snapshot. The store returns an
    // empty learner until it has read storage, and an empty learner is indistinguishable
    // from one that has never accepted — so deciding off the snapshot sent everybody who
    // HAD accepted back to the deal. Doing it here also makes the order the spec
    // requires literal: pair, then that pair's record, then the step.
    // No pair chosen is a front-door problem, not a picker one, and it is checked
    // first: the pair decides which learner record even gets read.
    if (!chosenPair()) {
      dispatch({ type: 'jump', kind: 'pair' })
      return
    }
    loadLearner()
    dispatch({ type: 'jump', kind: hasAcceptedDeal() ? 'picker' : 'deal' })
  }, [enter])
  /**
   * Keep the journey's idea of what has been played in step with the learner record.
   *
   * Not a one-shot on mount: the stored learner is read in a later effect, so on the
   * first pass there is nothing to seed from yet — latching a "done" flag there meant
   * a returning learner was permanently treated as brand new. Syncing on length
   * converges instead, and covers the store growing mid-session as well as arriving
   * late.
   */
  useEffect(() => {
    const rootIds = learner.roots_played ?? []
    const collisionIds = learner.collisions_played ?? []
    if (
      rootIds.length === state.rootsPlayed.length &&
      collisionIds.length === state.collisionsPlayed.length
    ) {
      return
    }
    dispatch({ type: 'hydrate', rootIds, collisionIds })
  }, [
    learner.roots_played,
    learner.collisions_played,
    state.rootsPlayed.length,
    state.collisionsPlayed.length,
  ])

  useEffect(() => {
    hydrateFromUrl()
    loadLearner()
    // Ask the server what it is holding for this person and merge it in. Fire and
    // forget: it can only add, and if it fails the local copy was already correct.
    void restoreLearner()
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
      /**
       * Lowest stage first, and never above the one they have reached.
       *
       * Without this the ladder only gated which crates could be opened, and inside
       * one the learner got the whole thing in authoring order — which put counting
       * and the everyday nouns sixth, behind register and nuance. The fundamentals
       * were in the product and effectively unreachable.
       *
       * Sorting is stable, so within a stage the authored order still holds.
       */
      const reached = rungReached(learner.proof)
      const all = ROOTS_BY_FAMILY[family]
      const fresh = all.filter(
        (r) => r.rung <= reached && !state.rootsPlayed.includes(r.root_id),
      )
      // Nothing new at this stage means going through it again, not an empty section.
      // Replaying costs nothing: recordProof dedupes by sentence so the honest count
      // cannot be inflated, and the osmosis screen already knows how to say that there
      // is nothing new to point out.
      const replay = all.filter((r) => r.rung <= reached)
      const roots = (fresh.length ? fresh : replay.length ? replay : all).sort(
        (a, b) => a.rung - b.rung,
      )
      rememberPlayed(roots.map((r) => r.root_id), null)
      const steps: Step[] = []

      /**
       * Arriving in a second world is exactly the moment to show that the first one is
       * still working. Holding every collision back until the end meant a learner who
       * took two areas saw the compounding claim once, at the finish, if at all.
       */
      const bridging =
        state.rootsPlayed.length > 0
          ? availableCollision(state.rootsPlayed, state.collisionsPlayed)
          : null
      if (bridging) {
        steps.push({ kind: 'collision', collisionId: bridging.id })
        rememberPlayed([], bridging.id)
      }

      steps.push(...roots.flatMap((r) => rootSteps(r)))
      steps.push({ kind: 'osmosis' })
      // One question between sections, never two, and only once the learner has
      // something to show for the time they have given us.
      const due = nextProfileQuestion()
      if (due) steps.push({ kind: 'profile', which: due })
      steps.push({ kind: 'section-complete' })
      dispatch({
        type: 'append',
        steps,
        rootIds: roots.map((r) => r.root_id),
        collisionId: bridging?.id,
        jump: true,
      })
    },
    [state.collisionsPlayed, state.rootsPlayed],
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
      // The Club opens on a section carried all the way to the end, which is the only
      // membership test there is — so this is the moment it is recorded, and it is
      // recorded against the learner rather than the tab.
      if (state.family) rememberSection(state.family)
      const steps: Step[] = []
      const collision = availableCollision(state.rootsPlayed, state.collisionsPlayed)
      if (collision) steps.push({ kind: 'collision', collisionId: collision.id })
      steps.push({ kind: 'nocue', i: 0 }, { kind: 'nocue', i: 1 }, { kind: 'nocue', i: 2 })
      steps.push({ kind: 'cansay' }, { kind: 'proof' }, { kind: 'close' })
      rememberPlayed([], collision?.id ?? null)
      dispatch({ type: 'append', steps, collisionId: collision?.id, jump: true })
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
