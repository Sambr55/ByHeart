// DUB — content model
// Implements the logical content objects from spec §12. Culture and curriculum are
// deliberately separated: a CulturalMoment is one possible hook for a LearningTarget,
// and the target can later be re-hooked from a different film, song or book.

/** Stage names are per-mission; the shell reads them from Mission.stages. */
export type Stage = string

/**
 * Stages where every cultural cue has been removed. Performance inside these is the
 * only performance that counts as transfer, so the evidence log tags it culture-free.
 */
export const CULTURE_FREE_STAGES = new Set<Stage>(['LISBON', 'REAL WORLD', 'CROSSOVER'])

export type BlockId =
  // Mission 01 — Top Gun
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
  // Mission 02 — James Bond
  | 'chamo_me'
  | 'queria'
  | 'posso'
  | 'onde_fica'
  | 'amanha'
  | 'outra_vez'

/** A cultural world. Sources are provenance, never ownership (spec §8). */
export type PropertyId = 'top_gun' | 'james_bond'

export type MissionId = 'mission_01' | 'mission_02'

/** §12 LearningTarget — the curriculum unit. Survives independently of the film. */
export interface LearningTarget {
  /** The world the memory started in. Provenance, not ownership. */
  source: PropertyId
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
  /** Fires target_reinforced — a block from an earlier world used again in this one. */
  reinforces?: BlockId | BlockId[]
  /** Fires cross_world_combo — blocks from two worlds used in one construction. */
  combines?: BlockId[]
  /**
   * culture_neutral control copy. Replaces ONLY the cultural setup; the Portuguese,
   * the interaction, the answer choices and the number of steps stay identical, or
   * the comparison means nothing (spec §4 control principle).
   */
  /**
   * Omitted entirely in culture_neutral. For screens that only exist because of the
   * cultural layer — asking a control tester how well they know Bond would introduce
   * the very cue the arm removes.
   */
  skipInNeutral?: boolean
  neutral?: {
    hook?: string
    context?: string
    headline?: string
    sub?: string
    eyebrow?: string
  }
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

/** Cold retrieval of a block's meaning, before any cue from its source world. */
export interface MeaningCheckScreen extends ScreenBase {
  type: 'meaning-check'
  target: BlockId
  /** The block as shown, e.g. "PRECISO DE…". */
  block: string
  lead: string
  options: { id: string; label: string; correct?: boolean }[]
  wrong: string
  hint: string
  /** Reinforced later in this mission, or held back as a control (spec §12 H3). */
  role: 'reinforced' | 'combined' | 'control'
}

export interface RetentionResultScreen extends ScreenBase {
  type: 'retention-result'
  cta: string
  lowScoreCopy: string
}

export interface CultureCategoriesScreen extends ScreenBase {
  type: 'culture-categories'
  cards: { id: string; title: string; examples: string }[]
  max: number
  cta: string
}

export interface FreeTextScreen extends ScreenBase {
  type: 'free-text'
  placeholder: string
  cta: string
  field: 'culture_free_text'
}

export interface ForcedChoiceScreen extends ScreenBase {
  type: 'forced-choice'
  cards: { id: string; title: string }[]
  /** Appended after the shuffle so it never occupies a random slot. */
  escapeHatch?: { id: string; title: string }
  field: 'next_world_pre' | 'next_world_post'
  cta: string
}

export interface ScaleScreen extends ScreenBase {
  type: 'scale'
  points: { value: number; label: string }[]
  field: 'bond_familiarity' | 'mental_model_transfer'
  cta: string
}

/**
 * Sequential construction where each part is scored independently. A part answered
 * correctly locks and is never reset by a later mistake (spec §7 B23, §10 C04).
 */
export interface CompositeScreen extends ScreenBase {
  type: 'composite'
  parts: CompositePart[]
  /** Source badges stay hidden until every part is done (spec §10 C09). */
  hideSourcesUntilDone?: boolean
}

export type CompositePart =
  | {
      kind: 'tiles'
      id: string
      prompt: string
      note?: string
      tiles: { id: string; text: string; distractor?: boolean }[]
      answer: string[]
      rules?: TileRule[]
      hint1?: string
      chipHint?: BlockId
    }
  | {
      kind: 'choice'
      id: string
      prompt: string
      note?: string
      options: { id: string; pt: string; correct?: boolean; feedback?: string }[]
      /** Options are English (a meaning check), so they carry no audio. */
      english?: boolean
      hint1?: string
      chipHint?: BlockId
    }

export interface CompoundInventoryScreen extends ScreenBase {
  type: 'compound-inventory'
  cta: string
  closing: string
}

export interface CrossoverResultScreen extends ScreenBase {
  type: 'crossover-result'
  cta: string
  lowScoreCopy: string
}

export interface PostIntentScreen extends ScreenBase {
  type: 'post-intent'
  options: { id: string; label: string }[]
  followUp: string
  cta: string
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
  | MeaningCheckScreen
  | RetentionResultScreen
  | CultureCategoriesScreen
  | FreeTextScreen
  | ForcedChoiceScreen
  | ScaleScreen
  | CompositeScreen
  | CompoundInventoryScreen
  | CrossoverResultScreen
  | PostIntentScreen

export type ExerciseScreen =
  | ChoiceScreen
  | TilesScreen
  | MatchScreen
  | RecallScreen
  | MeaningCheckScreen
  | CompositeScreen

export function isExercise(s: Screen): s is ExerciseScreen {
  return (
    s.type === 'choice' ||
    s.type === 'tiles' ||
    s.type === 'match' ||
    s.type === 'recall-burst' ||
    s.type === 'meaning-check' ||
    s.type === 'composite'
  )
}

/**
 * §13 Mission. An ordered set of targets, hooks, exercises, reuse references and
 * recall events. Missions are content; the learner's inventory is the product.
 */
export interface Mission {
  mission_id: MissionId
  property_id: PropertyId
  property_label: string
  locale: 'pt-PT'
  /** Blocks this mission teaches from zero. */
  targets_new: BlockId[]
  /** Blocks carried in from an earlier world and deliberately re-used. */
  targets_reinforced: BlockId[]
  /** Ordered stage rail for this mission. */
  stages: Stage[]
  screens: Screen[]
  /** Screens that make up the mission's headline transfer metric. */
  transfer_items: string[]
  /** Screens that make up the cross-world crossover score, if the mission has one. */
  crossover_items?: string[]
  /** Screens that cold-recall earlier learning before any cue from its world. */
  cold_recall_items?: string[]
}
