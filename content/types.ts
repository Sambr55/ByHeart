// BY HEART — content model
// Implements the logical content objects from spec §12. Culture and curriculum are
// deliberately separated: a CulturalMoment is one possible hook for a LearningTarget,
// and the target can later be re-hooked from a different film, song or book.

export type Stage =
  | 'PRE-FLIGHT'
  | 'TAKE-OFF'
  | 'CRUISE'
  | 'FINAL APPROACH'
  | 'LISBON'

export const STAGES: Stage[] = [
  'PRE-FLIGHT',
  'TAKE-OFF',
  'CRUISE',
  'FINAL APPROACH',
  'LISBON',
]

export type BlockId =
  | 'comigo'
  | 'podes'
  | 'preciso_de'
  | 'nao_consigo'
  | 'perdi'
  | 'nao_vou'
  | 'o_que_estas_a'
  | 'quando'
  | 'claro'
  | 'porque_nao'

/** §12 LearningTarget — the curriculum unit. Survives independently of the film. */
export interface LearningTarget {
  target_id: string
  locale: 'pt-PT'
  block: string
  /** Inventory chip label, e.g. "PRECISO DE…" */
  label: string
  gloss: string
  type: 'hinge' | 'chunk' | 'pattern' | 'booster'
  frequency_priority: number
  grammar_note_internal: string
  /** Immediate generativity, spec §4 session inventory table. */
  generativity: string[]
}

/** §12 CulturalMoment — the hook. Brief reference only; no dialogue reproduction. */
export interface CulturalMoment {
  property_id: string
  moment_id: string
  short_reference_hook: string
  familiarity_weight: 'high' | 'medium' | 'low'
  rights_status: 'brief-reference-prototype'
  thematic_tags: string[]
}

/** §12 Example — a usable utterance built from a target. Drives the QA sheet + audio manifest. */
export interface Example {
  example_id: string
  target_id: BlockId
  pt_text: string
  en_gloss: string
  audio_asset: string
  context_tag: 'hook' | 'manipulate' | 'transfer' | 'distractor' | 'booster'
  /** Appendix A "Role" column. */
  role: string
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

export interface ScreenBase {
  /** Spec screen id, e.g. "S05" or "L01". */
  id: string
  name: string
  stage: Stage
  timecode: string
  purpose: string
  /** Small label above the headline. */
  eyebrow?: string
  /** Brief cultural hook. Rendered in quotes; never more than one line. */
  hook?: string
  /** Scene-setting line above the prompt, e.g. "Taxi rank. No Maverick." */
  context?: string
  headline?: string
  /** Portuguese headline — rendered dominant over any English. */
  headlinePt?: string
  sub?: string
  /** Small supporting gloss, e.g. "água = water". */
  note?: string
  /** REVEAL / FEEDBACK copy shown after the interaction resolves. */
  reveal?: string
  /** Fires block_intro. */
  introduces?: BlockId | BlockId[]
  /** Fires block_acquired and adds the chip to Your Portuguese. */
  acquires?: BlockId | BlockId[]
  /** Semantic cue at hint level 1 when no diagnostic rule matches. */
  hint1?: string
  /** Inventory chip highlighted at hint level 2. */
  chipHint?: BlockId
  /** Extra analytics params named in the spec's CAPTURE rows. */
  capture?: string[]
}

export interface PromiseScreen extends ScreenBase {
  type: 'promise'
  wordmark: string
  cta: string
}

export interface CultureSelectScreen extends ScreenBase {
  type: 'culture-select'
  cards: { id: string; title: string; meta: string; active: boolean }[]
  cta: string
}

export interface FamiliarityScreen extends ScreenBase {
  type: 'familiarity'
  options: { id: 'high' | 'medium' | 'low'; label: string }[]
}

export interface BriefingScreen extends ScreenBase {
  type: 'briefing'
  cta: string
}

/** Reveals a block. Tapping it hears it, and banks it when `acquires` is set. */
export interface BlockIntroScreen extends ScreenBase {
  type: 'block-intro'
  phrase?: { pt: string; en?: string }
  blocks: { id: BlockId; pt: string; gloss: string }[]
  tapPrompt: string
  cta: string
  /** S32: every block must be tapped before continuing. */
  requireAllTaps?: boolean
}

export interface ChoiceScreen extends ScreenBase {
  type: 'choice'
  options: { id: string; pt: string; correct?: boolean; feedback?: string }[]
}

/** Ordered construction. Unused distractor tiles are allowed and are not errors in themselves. */
export interface TilesScreen extends ScreenBase {
  type: 'tiles'
  tiles: { id: string; text: string; distractor?: boolean }[]
  /** Tile ids in the correct order. */
  answer: string[]
  /** Diagnostic feedback, first match wins. */
  rules?: TileRule[]
}

export type TileRule =
  /** Learner included a tile that does not belong. */
  | { when: 'uses'; tile: string; message: string }
  /** Learner left out a required tile. */
  | { when: 'omits'; tile: string; message: string }
  /** Right tiles, wrong sequence. */
  | { when: 'order'; message: string }
  /** Sequence does not open with the required tile. */
  | { when: 'not-first'; tile: string; message: string }

export interface MatchScreen extends ScreenBase {
  type: 'match'
  pairs: { blockId: BlockId; pt: string; en: string }[]
  swapFeedback: string
}

export interface RecallScreen extends ScreenBase {
  type: 'recall-burst'
  checkpoint: 1 | 2
  cards: { cue: string; answer: BlockId; options: BlockId[] }[]
}

export interface InventoryScreen extends ScreenBase {
  type: 'inventory'
  view: 'inventory_view_1' | 'inventory_view_final'
  caption?: string
  cta: string
}

export interface ResultScreen extends ScreenBase {
  type: 'result'
  cta: string
  /** Shown instead of the standard sub when transfer is weak. */
  lowScoreCopy: string
}

export interface GenerativityScreen extends ScreenBase {
  type: 'generativity'
  lines: { pt: string; en: string }[]
  closing: string
  cta: string
}

export interface PreferenceScreen extends ScreenBase {
  type: 'preference'
  options: { id: string; title: string; desc: string }[]
  cta: string
}

export interface ContinuationScreen extends ScreenBase {
  type: 'continuation'
  options: { id: 'yes' | 'maybe' | 'no'; label: string; reply: string }[]
  followUp: string
}

export type Screen =
  | PromiseScreen
  | CultureSelectScreen
  | FamiliarityScreen
  | BriefingScreen
  | BlockIntroScreen
  | ChoiceScreen
  | TilesScreen
  | MatchScreen
  | RecallScreen
  | InventoryScreen
  | ResultScreen
  | GenerativityScreen
  | PreferenceScreen
  | ContinuationScreen

export type ExerciseScreen = ChoiceScreen | TilesScreen | MatchScreen | RecallScreen

export function isExercise(s: Screen): s is ExerciseScreen {
  return (
    s.type === 'choice' ||
    s.type === 'tiles' ||
    s.type === 'match' ||
    s.type === 'recall-burst'
  )
}

/** §12 Session. */
export interface SessionContent {
  session_id: string
  culture_property: string
  locale: 'pt-PT'
  targets: Record<BlockId, LearningTarget>
  moments: CulturalMoment[]
  examples: Example[]
  screens: Screen[]
  /** Ids of the L01–L08 items that make up the transfer score. */
  final_test_items: string[]
}
