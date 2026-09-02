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
  type Rung,
  type Root,
} from '@/content/roots'
import { DEMO_BEATS, NO_CUE_PROMPTS } from '@/content/front-door'
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
  /** What the room is, before anything about how to reach it. */
  | { kind: 'welcome' }
  /** How you get in — sets the demo up, so the Goose line arrives as an example. */
  | { kind: 'howin' }
  | { kind: 'demo'; i: number }
  /** Where it goes, and where the deal is accepted. Named for what it says. */
  | { kind: 'setup' }
  | { kind: 'theway' }
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

  /*
    Recognition and the reveal are ONE screen, not two.

    They were two, and the first was a title, a credit and a button — with the whole
    middle of the phone empty. Worse, the second screen opened by reprinting the first
    one as a caption, so a learner tapped through a screen to reach a screen that quoted
    it back to them.

    The demo settled this argument already and it was never applied here: "recognition,
    translation and extraction are one thought, so they belong on one screen with the
    translation animating in". The pause before the reveal is the point — that is where
    somebody tries to remember — so it survives as a tap on the same screen rather than
    as a screen of its own.
  */
  if (root.freebie_flag) {
    // §B10: a freebie is a ten-second wink. Portuguese -> takeaway.
    return [b('translate'), b('extract'), ...pieces, b('release')]
  }
  const beats = [b('translate'), b('extract'), ...pieces]
  // Bringing them back together only earns its place when there was more than one.
  if (root.extracts.length > 1) beats.push(b('branch'))
  beats.push(b('build'))
  if (root.voice_options?.length) beats.push(b('voice'))
  beats.push(b('release'))
  return beats
}

/**
 * How many roots one section may contain.
 *
 * Declared here since the first draft and never referenced, which is why a section was
 * whatever the crate happened to hold — 59 screens for world_of_wizardry against a
 * stated ten-minute promise. It is enforced in chooseFamily now. Four roots is roughly
 * eight to twelve minutes, and the remainder is what brings somebody back.
 */
const ROOTS_PER_SESSION = 4

/**
 * And the cap that actually matters.
 *
 * Roots are not the same size — the shortest is five beats and the longest is twelve —
 * so counting roots caps nothing. Twenty-four root beats plus the eight-screen tail
 * (osmosis, section-complete, three cold prompts, capability, proof, close) is around
 * thirty screens, which is the ten minutes the product promises.
 */
const BEATS_PER_SESSION = 24

/**
 * Except for the doorway, which has a promise written on it.
 *
 * The basics tile says "Hello, thank you, yes, no and counting to ten". At 24 beats the
 * section served exactly two roots — olá and não, obrigado — and stopped, so every
 * number in the crate sat behind a wall the learner had no way to know was there. The
 * tile was making a promise the session could not keep.
 *
 * The number is derived, not chosen: hello (7) + yes/no (9) + the first numbers (11) is
 * 27, and that is exactly the promise on the tile. It was 30 until recognition and the
 * reveal became one screen, and it came down with them — a budget that stays where it
 * was after the content shrank is just a bigger session wearing an old justification.
 *
 * If a root here grows, this has to grow with it or the promise silently breaks again.
 * first-session fails when it does, which is the only reason it is safe to hard-code.
 *
 * The REST of counting still arrives across later sessions — the cap is per session,
 * not per crate, and what is left over is what brings somebody back.
 */
const BEATS_BY_FAMILY: Partial<Record<CultureFamily, number>> = {
  the_basics: 27,
}

interface JourneyState {
  steps: Step[]
  index: number
  /**
   * The step this URL actually started at.
   *
   * `canGoBack` was `index > 0`, which is true of every step after the landing — and
   * arriving at /crates jumps straight to the picker at index 5. So the back arrow
   * rewound a returning member through the deal, the language pair and the whole Goose
   * demo: a tour of the onboarding they finished weeks ago, reachable in four taps from
   * their own home screen. Back means back within this visit, never before it.
   */
  entryIndex: number
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
    { kind: 'welcome' },
    // Before the demo, so the demo is the example rather than the argument.
    { kind: 'howin' },
    ...DEMO_BEATS.map((_, i) => ({ kind: 'demo' as const, i })),
    /*
      The route, then the language.

      The pair used to sit here because the route said "in Portugal" and could not be
      written truthfully until the answer was known. It does not any more — "every time you
      meet somebody new" is true in Lisbon and true in the next city — so the one piece of
      setup admin in the intro comes after the story rather than interrupting it.
    */
    { kind: 'theway' },
    /*
      Set-up stands where the pair step used to, and asks three things instead of one.

      The pair step asked for a language on its own screen, and every chapter in CHAPTERS
      carries the same pair — so choosing Lisbon already chooses pt-PT. Two screens asking
      for one answer is a form, and it was the second of them a person actually hit.

      IT MUST BE IN THIS ARRAY, not only in the switch. A jump looks the kind up in steps
      and returns the state unchanged when it is missing, so dispatching to a step that
      exists only as a case is a silent no-op — the gate would let somebody through rather
      than stop them, which is the worst way for a gate to fail.
    */
    { kind: 'setup' },
    { kind: 'picker' },
  ],
  index: 0,
  entryIndex: 0,
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

/**
 * What is actually in one section.
 *
 * Exported, and the only implementation, because `npm run first` simulates a beginner's
 * first session and a simulator that reimplements this would eventually be simulating a
 * different product. Pure: no dispatch, no learner reads, so it can run in a script.
 *
 * Three rules, in order.
 *
 * Nothing above the stage they have reached. The ladder used to gate the DOOR and then
 * nothing behind it — the final fallback was the whole crate, so a rung-1 learner could
 * be handed rung-6 roots the moment their stage had nothing in this crate. It falls back
 * to the crate's LOWEST rung instead.
 *
 * Nothing new at this stage means going through it again, not an empty section.
 * Replaying costs nothing: recordProof dedupes by sentence so the honest count cannot be
 * inflated, and the osmosis screen already knows how to say there is nothing new.
 *
 * And it is capped by SCREENS, not by roots. ROOTS_PER_SESSION was declared and never
 * referenced, so sections were unbounded — world_of_wizardry was a 59-screen first
 * session against a stated ten-minute promise. Roots are not the same size, so counting
 * them is the wrong cap: four short roots and four long ones differ by twenty screens.
 * Whatever is left over is what brings somebody back.
 */
export function sectionRoots(
  family: CultureFamily,
  reached: Rung,
  alreadyPlayed: string[],
): Root[] {
  const all = ROOTS_BY_FAMILY[family] ?? []
  if (!all.length) return []
  const fresh = all.filter((r) => r.rung <= reached && !alreadyPlayed.includes(r.root_id))
  const replay = all.filter((r) => r.rung <= reached)
  const floor = Math.min(...all.map((r) => r.rung))
  const lowest = all.filter((r) => r.rung === floor)
  /*
    Open with the banger.

    Sorting by rung alone meant a vibe opened with whatever happened to be authored first
    at the lowest rung — Pulp Fiction started on "What? — Say what again", with "Royale
    with Cheese" sitting unused two roots below it. The first thing somebody meets in a
    vibe they chose for the culture should be the line they chose it FOR.

    The freebie is already that root and always was: one per vibe, described in the spec
    as a ten-second wink, no puzzle. It was marked and never used for ordering.

    The banger goes first outright, not merely first within its rung. Ordering by rung
    first meant it only ever led when it happened to be the lowest thing in the vibe,
    which was true for four vibes and false for six — Bridget Jones opened on "Sorry.
    Sorry. Sorry." even at rung 6, with the best line in it further down the list.

    Safe because of what a freebie IS: no puzzle, ten seconds, a wink. Leading with one
    cannot serve difficulty out of order, and everything after it goes back to lowest
    rung first, so the fundamentals still come before register and nuance.

    It is still filtered by the ladder above, so an unreachable banger is simply not in
    this list and the vibe opens on the next best thing.
  */
  const eligible = (fresh.length ? fresh : replay.length ? replay : lowest).sort(
    (a, b) =>
      Number(Boolean(b.freebie_flag)) - Number(Boolean(a.freebie_flag)) || a.rung - b.rung,
  )

  const out: Root[] = []
  let screens = 0
  for (const root of eligible) {
    const cost = beatsFor(root).length
    // Always take the first, however long it is — a section of nothing is worse than a
    // section that runs a little over.
    const budget = BEATS_BY_FAMILY[family] ?? BEATS_PER_SESSION
    if (out.length && (out.length >= ROOTS_PER_SESSION || screens + cost > budget)) break
    out.push(root)
    screens += cost
  }
  return out
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
      // A jump IS the entry: it is the URL saying where this visit begins.
      const to = state.steps.findIndex((st) => st.kind === action.kind)
      return to === -1 ? state : { ...state, index: to, entryIndex: to }
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
/*
  What owning a piece lets somebody DO.

  This mapped 25 of 149 pieces and covered almost no rung-1 piece, which is why the
  capability screen — the best screen in the product — rendered the sentence "You can
  now ." for three of the five crates a beginner could open. A map this thin is not a
  design decision, it is an unfinished one.

  Written as verbs a person would use about themselves, never as grammar.
*/
const SPEECH_ACTS: Record<string, string> = {
  // The basics, and the everyday pieces a first section actually hands over.
  ola: 'say hello to anybody',
  adeus: 'say goodbye',
  sim: 'say yes and mean it',
  nao: 'turn something down',
  talvez: 'keep your options open',
  obrigado: 'thank somebody properly',
  obrigada: 'thank somebody properly',
  desculpe: 'apologise, and get past people',
  por_favor: 'ask for things politely',
  sabado: 'make plans for the weekend',
  domingo: 'make plans for the weekend',
  noite: 'talk about the time of day',
  copo: 'order a drink',
  vinho: 'order a drink',
  queijo: 'order food the way you like it',
  agua: 'ask for water',
  euro: 'handle money',
  cinco: 'count out loud',
  sete: 'count out loud',
  nove: 'count out loud',
  tres: 'count out loud',
  silencio: 'ask for quiet',
  fome: 'say what you need',
  amor: 'be affectionate',
  luz: 'talk about what is around you',
  porta: 'talk about what is around you',
  normal: 'say how things are going',
  mundo: 'say how things are going',
  bom: 'say something is good',
  batido: 'order food the way you like it',

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
   * Where this URL is trying to start. 'vibes' means the learner asked for the picker
   * directly — from the menu, or a bookmark — rather than arriving at the front door.
   */
  enter = 'front-door',
}: {
  children: React.ReactNode
  enter?: 'front-door' | 'vibes'
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
    if (jumped.current || enter !== 'vibes') return
    jumped.current = true
    // Load explicitly rather than reading the reactive snapshot. The store returns an
    // empty learner until it has read storage, and an empty learner is indistinguishable
    // from one that has never accepted — so deciding off the snapshot sent everybody who
    // HAD accepted back to the deal. Doing it here also makes the order the spec
    // requires literal: pair, then that pair's record, then the step.
    /*
      No pair chosen SHOWS set-up, rather than a screen that asks something else.

      THIS WAS THE LEAK. Set-up moved into the Club as a card carrying where, why and who,
      and its whole promise is that you may swipe past it forever because every call to
      action that needs an answer brings the question back. This line did not: somebody who
      swiped past set-up and then tapped TRY YOUR FIRST THREE VIBES on any explainer landed
      on the old full-screen language list — the exact question set-up had stopped asking,
      in the exact place the restructure existed to remove.

      The first fix redirected to /club?setup=1, and bouncing somebody back to the feed one
      tap after they asked to start reads as a rejection. It also raced every check that
      seeds a device on /vibes: a hard navigation mid-evaluate destroys the execution
      context, which is how shelf-check found it.

      So the same component renders here instead. One question, one component, two places.
    */
    if (!chosenPair()) {
      dispatch({ type: 'jump', kind: 'setup' })
      return
    }
    loadLearner()
    dispatch({ type: 'jump', kind: hasAcceptedDeal() ? 'picker' : 'theway' })
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
      // Read fresh rather than off the closure. `learner` was absent from this
      // callback's deps, so a section queued after the first release of the session
      // could gate on a stage the learner had already left behind — the ladder running
      // a whole session late.
      const reached = rungReached(loadLearner().proof)
      const roots = sectionRoots(family, reached, state.rootsPlayed)
      const steps: Step[] = []

      /**
       * Arriving in a second world is exactly the moment to show that the first one is
       * still working. Holding every collision back until the end meant a learner who
       * took two areas saw the compounding claim once, at the finish, if at all.
       *
       * But it went FIRST, which is worse than either. You tap Audrey Hepburn and the
       * screen says "Olá, chamo-me Sam." — a sentence built out of the basics and a
       * Beatles single, with nothing of Hepburn in it. And because the collision served is
       * whichever one is next undone, opening the same vibe twice gives two different
       * openers, so the vibe has no character at all at the moment it most needs one.
       *
       * A vibe opens with its own banger. The collision lands after it, which keeps the
       * whole point — it is still early, it is still the moment of arriving somewhere new
       * — while the thing you chose is the thing you get.
       */
      const bridging =
        state.rootsPlayed.length > 0
          ? availableCollision(state.rootsPlayed, state.collisionsPlayed)
          : null

      const [opener, ...rest] = roots
      if (opener) steps.push(...rootSteps(opener))
      if (bridging) {
        steps.push({ kind: 'collision', collisionId: bridging.id })
        rememberPlayed([], bridging.id)
      }
      steps.push(...rest.flatMap((r) => rootSteps(r)))
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
      /*
        The section is finished either way. The decision is only about what happens next.

        This used to record it on the "I'm done" path alone, which was harmless while
        nothing depended on it — and became a deadlock the moment the shelf opened on a
        completed basics section. A learner who finished the basics and tapped ANOTHER
        CRATE had, as far as the record was concerned, finished nothing, so every other
        crate stayed shut and the only button that could free them was the one they had
        not pressed.
      */
      if (state.family) rememberSection(state.family)
      if (decision === 'another') {
        const picker = state.steps.findIndex((s) => s.kind === 'picker')
        dispatch({ type: 'goto', index: picker < 0 ? 0 : picker })
        return
      }
      const steps: Step[] = []
      const collision = availableCollision(state.rootsPlayed, state.collisionsPlayed)
      if (collision) steps.push({ kind: 'collision', collisionId: collision.id })
      /*
        Three cold prompts, or as many as the learner can actually answer.

        This pushed three unconditionally, and NO_CUE_PROMPTS filters by what they own —
        so a learner owning nothing any prompt asked for met three consecutive identical
        filler screens at the emotional high point of the section. It was the state for
        four of the five crates a beginner could open.

        The prompts are rung-1 now, so this rarely bites; it stays because a screen that
        can render empty must not be queued on the assumption that it will not.
      */
      const owned = ownedPieces()
      const answerable = NO_CUE_PROMPTS.filter((p) => owned.includes(p.requires)).length
      /*
        The capability screen comes BEFORE the cold prompts, and that is a reordering
        rather than a tidy-up.

        rungReached counts clean releases and nothing else. The release is the sole beat
        that moves the ladder, in every crate at once, and the only beat in a crate that
        produces a proof line. The three no-cue screens sitting at the tail of a section
        FELT like the summit and moved nothing at all — so the emotional peak and the
        meaningful peak were in different places, four times a session.

        Putting "here is what you can now do" first makes the cold prompts what they
        actually are: three more goes, after the point has been made.
      */
      steps.push({ kind: 'cansay' })
      for (let i = 0; i < Math.min(3, answerable); i++) steps.push({ kind: 'nocue', i })
      steps.push({ kind: 'proof' }, { kind: 'close' })
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
      canGoBack: state.index > state.entryIndex,
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
