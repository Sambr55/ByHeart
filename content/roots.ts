/**
 * The cultural root — the unit the whole product is built from (spec Appendix A).
 *
 * A root is a recognisable quote, title, moment, idea or piece of wisdom that gives the
 * learner an existing mental hook. Every root must visibly follow
 *
 *     ROOT -> NATURAL PORTUGUESE -> SEMANTIC BRIDGE -> EXTRACT -> BUILD -> RELEASE
 *
 * (§20.14), which is why `semantic_bridge`, `subtext`, `extracts`, `branches` and
 * `transfer_prompt` are all required rather than optional. A root with a weak bridge is
 * rejected, not shipped: "if removing the famous name leaves a weak or useless language
 * lesson, reject the root" (§10).
 */

export type CultureFamily =
  | 'top_gun'
  | 'james_bond'
  | 'bridget_jones'
  | 'pulp_fiction'
  | 'audrey_hepburn'
  | 'marcus_aurelius'
  | 'portuguese_swearing'
  | 'flirting_m2f'
  | 'flirting_f2m'
  | 'duran_duran_lisboa'

/**
 * The ladder — six rungs, named for what you can do in a room.
 *
 * Not levels and not XP. A rung is a capability, and they are ordered because
 * language is ordered: you cannot ask where the water is before you have the word
 * for water. A root's rung is its DOMINANT capability, not every capability it
 * touches — a line that names a thing and also happens to sit in the past is a
 * rung 1 root.
 *
 * Read as arrival readiness rather than grammar, the ladder is a trip: the menu,
 * the counter, the street, making a plan, standing in a group, sounding like
 * yourself.
 */
export type Rung = 1 | 2 | 3 | 4 | 5 | 6

export const RUNGS: { rung: Rung; name: string; what: string; opens: string; example: string }[] = [
  // `opens` is the line a dimmed crate shows. It says what you will be able to DO,
  // never what you have failed to do — a locked thing should read as an appointment,
  // not a telling-off.
  { rung: 1, name: 'Name it', what: 'The thing in front of you. Objects, food, numbers, prices.', opens: 'Opens once you can name what is in front of you.' , example: 'Um copo de água. · Sete euros.' },
  { rung: 2, name: 'Ask for it', what: 'Get what you want from another person.', opens: 'Opens once you can ask somebody for something.' , example: 'Preciso de ajuda.' },
  { rung: 3, name: 'Find it', what: 'Questions. Where, how much, who, what time.', opens: 'Opens once you can ask where and how much.' , example: 'Onde está a casa de banho?' },
  { rung: 4, name: 'Fit it in time', what: 'Plans, and saying when. Arranging to meet.', opens: 'Opens once you can say when.' , example: 'Até segunda-feira.' },
  { rung: 5, name: 'Talk about other people', what: 'Everyone who is not you or the person opposite.', opens: 'Opens once you can talk about somebody else.' , example: 'Ele gosta de ti.' },
  { rung: 6, name: 'Mean it', what: 'Register and nuance. The same thing said three ways, and choosing.', opens: 'Opens once you can choose how you sound.' , example: 'Tudo bem? · Está tudo bem?' },
]

export type RootType = 'quote' | 'title' | 'paraphrased_moment' | 'wisdom' | 'other'

export type SourceStatus =
  | 'verified'
  | 'paraphrased'
  | 'public-domain-derived'
  | 'needs-review'

export type RightsStatus = 'short-quote-review-required' | 'title-reference' | 'dub-authored'

export type QaStatus = 'pending-native-review' | 'reviewed'

/**
 * The nine shelves of the library.
 *
 * Named for what a person is reaching for, never for a part of speech. Somebody opening
 * the library wants a thing, a doing word, a way to ask — not a noun, a verb, an
 * interrogative. The stage a piece was taught at is a sequencing decision and makes a
 * useless shelf: it answers "when may this be taught", which is not a question anybody
 * looks a word up to settle.
 */
export type Shelf =
  | 'things'
  | 'doing'
  | 'describing'
  | 'people'
  | 'asking'
  | 'when'
  | 'how_much'
  | 'small_words'
  | 'just_say'

export const SHELVES: { id: Shelf; label: string; holds: string }[] = [
  { id: 'things', label: 'THINGS', holds: 'Nouns, with the gender you need to use them.' },
  { id: 'doing', label: 'DOING', holds: 'Verbs, gathered by the word they are a form of.' },
  { id: 'describing', label: 'DESCRIBING', holds: 'Adjectives, with both endings.' },
  { id: 'people', label: 'PEOPLE & POINTING', holds: 'Pronouns, this and that, yours and mine.' },
  { id: 'asking', label: 'ASKING', holds: 'Question words, and the frames they sit in.' },
  { id: 'when', label: 'WHEN', holds: 'Time. Now, today, tomorrow, Monday, never.' },
  { id: 'how_much', label: 'HOW MUCH', holds: 'Numbers and quantity.' },
  { id: 'small_words', label: 'THE SMALL WORDS', holds: 'The glue, and the shading.' },
  { id: 'just_say', label: 'THINGS YOU JUST SAY', holds: 'Set phrases, exclamations, swearing.' },
]

/** A reusable piece. The learner's inventory is keyed by these ids. */
export interface Extract {
  id: string
  target: string
  /**
   * MEANING ONLY. Short and consistent, and never a sentence — if it would follow a
   * comma or a dash it is a usage note, and it goes in `note`. The gloss column was
   * doing three jobs at once, which is most of why the library read as inconsistent.
   */
  gloss: string
  /** Where it lives in the library. No default and no inference. */
  shelf: Shelf
  /**
   * The word this is a form of — 'ser', 'ter', 'giro'. Absent means it is its own
   * lemma. This is the single biggest cause of the library reading as random: tenho
   * and tens were unrelated rows, stages apart, rather than one word.
   */
  lemma?: string
  /** Which form: 'I', 'you', 'he/she', 'we', 'they', 'feminine', 'past'. */
  form?: string
  /** How it behaves. The usage half that was jammed into gloss. */
  note?: string
  /** Nouns only, and required by the lint when shelf is 'things'. */
  gender?: 'm' | 'f'
  /** Only when it is not the regular +s. */
  plural?: string
  /** false for fome, tempo, amor — mass nouns, shown without an article. */
  countable?: boolean
  /**
   * A piece carries its own rung, which is often lower than the root teaching it:
   * `desculpa` falls out of a rung 6 apology but is week-one language, and `isto`
   * arrives inside swearing while being about as basic as a word gets. Omit it and
   * the piece inherits the root's rung, which is right most of the time.
   */
  rung?: Rung
}

export interface Branch {
  target: string
  en: string
  /**
   * Which pieces this line actually demonstrates.
   *
   * Declared rather than matched, because matching cannot be made correct: a substring
   * test files "Onde está o meu café?" under é, and tightening it to whole words then
   * loses "Dois copos de vinho" as a demonstration of copo. Only the author knows.
   * Absent falls back to a lemma-aware whole-word match, never a bare includes().
   */
  demonstrates?: string[]
}

/** §12 — two natural ways to say the same thing. Neither is scored. */
export interface VoiceOption {
  target: string
  en: string
  signal: 'direct' | 'softened' | 'dry' | 'warm' | 'casual' | 'polite'
  /** The chip: which room this one belongs in. */
  register: string
  /** Who you would say it to, and when. The reason this screen exists. */
  when: string
  /** Where the short version bites. Only the options that can misfire carry one. */
  risk?: string
  /** At most one per pair: reach for this if you cannot read the room. */
  safest?: boolean
}

export interface Root {
  root_id: string
  culture_family: CultureFamily
  /** Which rung of the ladder this root's dominant capability sits on. */
  rung: Rung
  root_type: RootType
  source_label: string
  source_status: SourceStatus
  /** What the learner sees as the cultural trigger. */
  root_display: string
  source: string
  target: string
  literal_note?: string
  /** Why this Portuguese is a natural expression of the root. Mandatory (§10). */
  semantic_bridge: string
  /** How it feels in use: direct, dry, warm, apologetic… (§07.2) */
  subtext: string
  extracts: Extract[]
  branches: Branch[]
  /** Extract ids from other roots this can strengthen. */
  reinforces: string[]
  voice_options?: VoiceOption[]
  /** The transferable rule the pair is really teaching (§12). */
  voice_rule?: string
  /**
   * Words that appear in a branch without being a learning target. §06: helper words
   * may appear, but with an English gloss — never quietly tested. Every word the
   * learner is asked to place must be one they have either been taught or been shown.
   */
  helpers?: Record<string, string>
  transfer_prompt: { context: string; ask: string; answer: string }
  rights_status: RightsStatus
  qa_status: QaStatus
  /** A 10–15 second cultural wink, not a full root (§B10). */
  freebie_flag: boolean
  starter_tags: string[]
  next_root_hooks: string[]
}

/**
 * A crate is permanent. A drop expires.
 *
 * That is the only difference, and it is the whole difference: a crate sits there
 * forever and you dig through it, while a drop is pegged to something actually
 * happening and goes when the thing goes. The urgency in a drop is real, which is
 * precisely what a streak's urgency is not.
 *
 * What was learned inside a drop never expires — it moves into the inventory like
 * anything else. The drop disappears; the language does not.
 */
export interface DropEvent {
  /** What is happening. */
  event: string
  place: string
  /** ISO date. The drop is gone the morning after. */
  on: string
  link?: string
  link_label?: string
}

export interface Crate {
  id: CultureFamily
  title: string
  blurb: string
  tone: string
  built: boolean
  /** Present on a drop, absent on a crate. */
  drop?: DropEvent
  /**
   * The rung at which this crate is meant to become available.
   *
   * Most crates open at the bottom and are expected to hold something a beginner can
   * use. A few are deliberately late — you should not be learning to swear before you
   * can order — and declaring that is how a crate says "I am dimmed on purpose"
   * rather than "I am missing my early content".
   */
  opens_at?: Rung
}

export const CRATES: Crate[] = [
  { id: 'top_gun', title: 'TOP GUN QUOTES', blurb: 'Iconic lines. Direct language.', tone: 'kinetic', built: true },
  { id: 'james_bond', title: 'JAMES BOND FILM TITLES', blurb: 'Tiny titles. Surprisingly useful Portuguese.', tone: 'cool', built: true },
  { id: 'bridget_jones', title: 'BRIDGET JONES CRINGE MOMENTS', blurb: 'Awkwardness you can actually use.', tone: 'human', built: true },
  { id: 'pulp_fiction', title: 'PULP FICTION BANGER QUOTES', blurb: 'Punchy lines. Real conversational leverage.', tone: 'sharp', built: true },
  { id: 'audrey_hepburn', title: 'AUDREY HEPBURN MUSINGS', blurb: 'Elegance, warmth and things worth saying.', tone: 'warm', built: true },
  { id: 'marcus_aurelius', title: 'MARCUS AURELIUS WISDOM', blurb: 'Ancient ideas. Surprisingly useful modern language.', tone: 'reflective', built: true },
  { id: 'portuguese_swearing', title: 'HOW TO SWEAR IN PORTUGUESE', blurb: 'The subtitles were lying to you. Strong language throughout.', tone: 'blunt', built: true, opens_at: 6 },
  { id: 'flirting_m2f', title: 'FLIRTING — HIM TO HER', blurb: 'The Love Actually problem. Said properly this time.', tone: 'warm', built: true },
  { id: 'flirting_f2m', title: 'FLIRTING — HER TO HIM', blurb: 'Warmer, funnier and considerably more effective.', tone: 'warm', built: true },
  {
    id: 'duran_duran_lisboa',
    title: 'DURAN DURAN, LISBOA',
    blurb: 'Six song titles. Gone the morning after the gig.',
    tone: 'kinetic',
    built: true,
    drop: {
      event: 'Duran Duran',
      place: 'Altice Arena, Lisboa',
      on: '2026-11-14',
      link: 'https://www.altice-arena.com',
      link_label: 'TICKETS',
    },
  },
]

/** Live now. A drop is gone the morning after the thing it was pegged to. */
export function isLive(crate: Crate, now: Date = new Date()): boolean {
  if (!crate.drop) return true
  const gone = new Date(crate.drop.on + 'T00:00:00Z')
  gone.setUTCDate(gone.getUTCDate() + 1)
  return now < gone
}

/** Whole days left, for the countdown. Null for a crate, which has no clock. */
export function daysLeft(crate: Crate, now: Date = new Date()): number | null {
  if (!crate.drop) return null
  const gone = new Date(crate.drop.on + 'T00:00:00Z')
  gone.setUTCDate(gone.getUTCDate() + 1)
  return Math.max(0, Math.ceil((gone.getTime() - now.getTime()) / 86_400_000))
}

const q = (partial: Partial<Root> & Pick<Root, 'root_id' | 'culture_family' | 'rung' | 'root_display' | 'source' | 'target' | 'semantic_bridge' | 'subtext' | 'extracts' | 'branches' | 'transfer_prompt'>): Root => ({
  root_type: 'quote',
  source_label: '',
  source_status: 'needs-review',
  reinforces: [],
  rights_status: 'short-quote-review-required',
  qa_status: 'pending-native-review',
  freebie_flag: false,
  starter_tags: [],
  next_root_hooks: [],
  ...partial,
})

// ---------------------------------------------------------------------------
// B3 — Top Gun Quotes. Kinetic, iconic, direct.
// ---------------------------------------------------------------------------

export const TOP_GUN: Root[] = [
  q({
    root_id: 'tg_goose',
    culture_family: 'top_gun',
    rung: 2,
    source_label: 'Top Gun',
    root_display: 'Talk to me, Goose.',
    source: 'Say something. I need you with me.',
    target: 'Fala comigo, Goose.',
    semantic_bridge:
      'The urgency survives intact. Portuguese expresses “with me” as one fused word, COMIGO, attached straight onto the command FALA.',
    subtext: 'Direct, close, urgent. You reach for this when you genuinely need someone to engage.',
    extracts: [{ id: 'comigo', target: 'comigo', gloss: 'with me', rung: 2, shelf: 'people', note: 'Com and mim, fused. Portuguese does this with me and you: comigo, contigo.' }],
    branches: [
      { target: 'Vem comigo.', en: 'Come with me.' },
      { target: 'Fica comigo.', en: 'Stay with me.' },
      { target: 'Podes vir comigo?', en: 'Can you come with me?' },
    ],
    helpers: {
      'Vem': 'come',
      'Fica': 'stay',
      'vir': 'to come',

    },
    transfer_prompt: { context: 'Your friend is walking away.', ask: 'Come with me.', answer: 'Vem comigo.' },
    freebie_flag: true,
    starter_tags: ['iconic', 'direct'],
    next_root_hooks: ['podes'],
  }),
  q({
    root_id: 'tg_wingman',
    culture_family: 'top_gun',
    rung: 4,
    source_label: 'Top Gun',
    root_display: 'You can be my wingman anytime.',
    source: 'You can be my partner whenever you want.',
    target: 'Podes ser o meu parceiro quando quiseres.',
    semantic_bridge:
      'The aviation metaphor becomes ordinary human Portuguese. The useful pieces are PODES and QUANDO QUISERES — not the military noun.',
    subtext: 'Warm permission rather than formal ability. PODES is one of the highest-leverage pieces in the language.',
    extracts: [
      { id: 'podes', target: 'podes', gloss: 'you can', rung: 2, shelf: 'doing', lemma: 'poder', form: 'you', note: 'Podes is allowed to, or could. When you mean physically managed it, Portugal reaches for consegui — não consegui abrir a porta is I could not get it open, not I was not permitted.' },
      { id: 'quando_quiseres', target: 'quando quiseres', gloss: 'whenever you want', shelf: 'when' },
    ],
    branches: [
      { target: 'Podes vir comigo?', en: 'Can you come with me?' },
      { target: 'Podes dizer outra vez?', en: 'Can you say it again?' },
      { target: 'Quando quiseres.', en: 'Whenever you want.' },
    ],
    reinforces: ['comigo'],
    voice_options: [
      {
        target: 'Podes repetir?', en: 'Can you repeat?', signal: 'direct',
        register: 'QUICK, BETWEEN FRIENDS',
        when: 'Someone you already call tu — a friend, a colleague you know, someone your own age.',
        risk: 'Fine with friends. To a stranger or anyone older, podes is the wrong word.',
      },
      {
        target: 'Podes repetir, por favor?', en: 'Can you repeat, please?', signal: 'polite',
        register: 'THE POLITE VERSION',
        when: 'Same friend, but you are interrupting, or you have already asked once.',
        safest: true,
      },
    ],
    voice_rule: 'Both of these are the friendly tu form. For a stranger or someone older you swap podes for pode — same sentence, one letter, a completely different level of respect.',
    helpers: {
      'vir': 'to come',
      'dizer': 'to say',

    },
    transfer_prompt: { context: 'A friend asks when they can call you.', ask: 'Whenever you want.', answer: 'Quando quiseres.' },
    starter_tags: ['iconic', 'permission'],
    next_root_hooks: ['outra_vez', 'comigo'],
  }),
  q({
    root_id: 'tg_thinking',
    culture_family: 'top_gun',
    rung: 3,
    source_label: 'Top Gun',
    root_display: 'What were you thinking?',
    source: 'What was going through your head?',
    target: 'Em que estavas a pensar?',
    literal_note: 'Literally “in what were you thinking?”',
    semantic_bridge:
      'Portuguese asks “in what were you thinking?”, because PENSAR EM means to think about. That EM is the whole difference between sounding translated and sounding Portuguese.',
    subtext: 'Curious, intimate or accusatory depending entirely on how you say it.',
    extracts: [
      { id: 'estavas_a', target: 'estavas a…', gloss: 'you were …ing', shelf: 'doing', lemma: 'estar', form: 'you, past' },
      { id: 'em_que', target: 'em que…?', gloss: 'what … about?', shelf: 'asking' },
    ],
    branches: [
      { target: 'Em que estás a pensar?', en: 'What are you thinking about?' },
      { target: 'Estava a pensar…', en: 'I was thinking…', demonstrates: ['estavas_a'] },
      { target: 'Estava a pensar em ti.', en: 'I was thinking about you.', demonstrates: ['estavas_a'] },
      { target: 'Em que estavas a pensar?', en: 'What were you thinking about?' },
    ],
    helpers: {
      'estás': 'you are',
      'pensar': 'to think',
      'Estava': 'I was',
      'ti': 'you',

    },
    transfer_prompt: { context: 'Someone goes quiet.', ask: 'What are you thinking about?', answer: 'Em que estás a pensar?' },
    starter_tags: ['question', 'intimate'],
    next_root_hooks: ['agora'],
  }),
  q({
    root_id: 'tg_need',
    culture_family: 'top_gun',
    rung: 2,
    source_label: 'Top Gun',
    root_display: 'I feel the need…',
    source: 'I need something, badly.',
    target: 'Sinto que preciso…',
    semantic_bridge:
      'Rather than carrying the English noun “need” across literally, Portuguese turns the idea into a verb: PRECISAR. “I feel that I need…”',
    subtext: 'Neutral, everyday, endlessly useful. This is the product beating subtitle literalism.',
    extracts: [{ id: 'preciso_de', target: 'preciso de…', gloss: 'I need…', shelf: 'doing', lemma: 'precisar', form: 'I' }],
    branches: [
      { target: 'Preciso de ajuda.', en: 'I need help.' },
      { target: 'Preciso de um táxi.', en: 'I need a taxi.' },
      { target: 'Preciso de tempo.', en: 'I need time.' },
    ],
    helpers: {
      'ajuda': 'help',
      'um': 'a',
      'táxi': 'taxi',

    },
    transfer_prompt: { context: 'You are at a hotel reception.', ask: 'I need a taxi.', answer: 'Preciso de um táxi.' },
    starter_tags: ['survival', 'travel'],
    next_root_hooks: ['tempo', 'sem'],
  }),
  q({
    root_id: 'tg_wingman_leave',
    culture_family: 'top_gun',
    rung: 4,
    source_label: 'Top Gun',
    root_display: 'I will not leave my wingman.',
    source: 'I am not going to abandon my partner.',
    target: 'Não vou deixar o meu parceiro.',
    semantic_bridge:
      'The cultural meaning is loyalty. The reusable Portuguese is the intention frame NÃO VOU + verb, which works for anything you have decided not to do.',
    subtext: 'Firm intention. More conversational than a formal future tense this early.',
    extracts: [
      { id: 'nao_vou', target: 'não vou…', gloss: 'I’m not going to…', shelf: 'doing', lemma: 'ir', form: 'I, negative' },
      { id: 'deixar', target: 'deixar', gloss: 'to leave / to let', shelf: 'doing' },
    ],
    branches: [
      { target: 'Não vou sair.', en: 'I’m not going out.' },
      { target: 'Não vou amanhã.', en: 'I’m not going tomorrow.' },
      { target: 'Não vou fazer isso.', en: 'I’m not going to do that.' },
      { target: 'Vou deixar isso.', en: 'I’m going to leave that.' },
    ],
    voice_options: [
      {
        target: 'Não vou.', en: 'I’m not going.', signal: 'direct',
        register: 'A FLAT NO',
        when: 'When the answer really is no and you would rather not be talked round.',
        risk: 'A bare no lands colder in Portugal than it does in English.',
      },
      {
        target: 'Acho que não vou.', en: 'I don’t think I’ll go.', signal: 'softened',
        register: 'THE SOFT NO',
        when: 'Turning down an invitation without closing the door. Literally “I think I’m not going” — everyone hears it as no.',
        safest: true,
      },
    ],
    voice_rule: 'Acho que in front of anything turns a statement into an opinion. It is the cheapest politeness in Portuguese.',
    helpers: {
      'Vou': 'I’m going to',
      'deixar': 'to leave',
      'sair': 'to go out',
      'fazer': 'to do',
      'isso': 'that',

    },
    transfer_prompt: { context: 'Someone asks if you are going out tonight.', ask: 'I’m not going.', answer: 'Não vou.' },
    starter_tags: ['intention', 'refusal'],
    next_root_hooks: ['amanha', 'agora'],
  }),
  // Rung 3. The crate had no question in it that locates anything.
  q({
    root_id: 'tg_where',
    culture_family: 'top_gun',
    rung: 3,
    root_type: 'paraphrased_moment',
    source_label: 'Top Gun — looking for your wingman',
    source_status: 'paraphrased',
    root_display: 'Where\u2019s my wingman?',
    source: 'Where is my wingman?',
    target: 'Onde est\u00e1 o meu parceiro?',
    semantic_bridge:
      'English hides the verb inside \u201cwhere\u2019s\u201d. Portuguese keeps them apart, and the pair ONDE + EST\u00c1 will locate anything you can already name \u2014 which is the entire reason naming came first.',
    subtext: 'The question you will ask on your first afternoon, and every afternoon after it.',
    extracts: [
      { id: 'parceiro', target: 'parceiro', gloss: 'partner', shelf: 'things', gender: 'm' },
      { id: 'onde', target: 'onde', gloss: 'where', shelf: 'asking' },
      { id: 'esta_', target: 'est\u00e1', gloss: 'is', shelf: 'doing', lemma: 'estar', form: 'he/she/it', note: 'The right-now one. É is the permanent one.' },
    ],
    branches: [
      { target: 'Onde est\u00e1 a casa de banho?', en: 'Where\u2019s the toilet?' },
      { target: 'Onde est\u00e1 o meu caf\u00e9?', en: 'Where\u2019s my coffee?' },
      { target: 'Est\u00e1 aqui.', en: 'It\u2019s here.' },
      { target: 'Este é o meu parceiro.', en: 'This is my partner.', demonstrates: ['parceiro'] },
    ],
    helpers: {
      'Este': 'this one',
      'é': 'is',
      'a': 'the',
      'o': 'the',
      'casa': 'house',
      'de': 'of',
      'banho': 'bath',
      'meu': 'my',
      'caf\u00e9': 'coffee',
      'aqui': 'here',
      'parceiro': 'partner / wingman',
    },
    transfer_prompt: {
      context: 'You have put your coffee down somewhere and it is gone.',
      ask: 'Where\u2019s my coffee?',
      answer: 'Onde est\u00e1 o meu caf\u00e9?',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['first-day', 'questions'],
    next_root_hooks: ['quanto'],
  }),
]

// ---------------------------------------------------------------------------
// B4 — James Bond Film Titles. Cool, concise, cinematic.
// Title-led, with one deliberate freebie at the front. Skyfall is deliberately
// absent: §10 removes it for having almost no linguistic leverage.
// ---------------------------------------------------------------------------

export const JAMES_BOND: Root[] = [
  q({
    root_id: 'jb_name',
    culture_family: 'james_bond',
    rung: 1,
    root_type: 'quote',
    source_label: 'James Bond',
    root_display: 'My name is… James Bond.',
    source: 'The most famous introduction in film.',
    target: 'Chamo-me… James Bond.',
    literal_note: 'Literally “I call myself”.',
    semantic_bridge:
      'English says “my name is”. European Portuguese introduces you with CHAMO-ME — literally “I call myself” — and that reflexive is what you will actually hear in Portugal.',
    subtext: 'A perfect freebie: culturally unmistakable and useful within an hour of landing.',
    extracts: [{ id: 'chamo_me', target: 'chamo-me…', gloss: 'my name is…', shelf: 'just_say' }],
    branches: [
      { target: 'Chamo-me Sam.', en: 'My name is Sam.' },
      { target: 'E tu, como te chamas?', en: 'And you, what’s your name?', demonstrates: ['chamo_me', 'como_te_chamas'] },
      { target: 'Como se chama?', en: 'What is it called?', demonstrates: ['chamo_me', 'como_se_chama'] },
    ],
    helpers: {
      'Sam': 'a name',
      'tu': 'you',
      'E': 'and',
      'se': 'themselves',

    },
    transfer_prompt: { context: 'You meet someone new.', ask: 'My name is Sam.', answer: 'Chamo-me Sam.' },
    freebie_flag: true,
    rights_status: 'short-quote-review-required',
    starter_tags: ['introduction', 'iconic'],
    next_root_hooks: ['como_te_chamas'],
  }),
  q({
    root_id: 'jb_tomorrow',
    culture_family: 'james_bond',
    rung: 4,
    root_type: 'title',
    source_label: 'Tomorrow Never Dies',
    source_status: 'verified',
    root_display: 'Tomorrow Never Dies',
    source: 'Tomorrow never dies.',
    target: 'Amanhã nunca morre.',
    semantic_bridge:
      'The title is compact enough that both useful pieces survive the crossing intact: AMANHÃ and NUNCA are sitting there in plain sight.',
    subtext: 'Time and absolute frequency in one recognisable title — far more productive than a title that is only a place name.',
    extracts: [
      { id: 'amanha', target: 'amanhã', gloss: 'tomorrow', shelf: 'when', note: 'A and manhã — literally to the morning.' },
      { id: 'nunca', target: 'nunca', gloss: 'never', shelf: 'when' },
    ],
    branches: [
      { target: 'Até amanhã.', en: 'See you tomorrow.' },
      { target: 'Amanhã não posso.', en: 'I can’t tomorrow.' },
      { target: 'Nunca mais.', en: 'Never again.' },
    ],
    reinforces: ['podes'],
    helpers: {
      'Até': 'until / see you',
      'não': 'not',
      'posso': 'I can',
      'mais': 'more / again',

    },
    voice_options: [
      {
        target: 'Amanhã.', en: 'Tomorrow.', signal: 'direct',
        register: 'ANSWERING “WHEN?”',
        when: '“When?” — “Tomorrow.” This is information, not a goodbye.',
      },
      {
        target: 'Até amanhã!', en: 'See you tomorrow!', signal: 'warm',
        register: 'LEAVING',
        when: 'Said on the way out the door. You will use this one most days.',
      },
    ],
    voice_rule: 'These do different jobs. Até means “until”, so até amanhã, até logo, até já — that is how Portuguese says goodbye with a time attached.',
    transfer_prompt: { context: 'Someone asks whether today works.', ask: 'Tomorrow.', answer: 'Amanhã.' },
    rights_status: 'title-reference',
    starter_tags: ['time', 'compact'],
    next_root_hooks: ['outra_vez', 'tempo'],
  }),
  q({
    root_id: 'jb_russia',
    culture_family: 'james_bond',
    rung: 1,
    root_type: 'title',
    source_label: 'From Russia with Love',
    source_status: 'verified',
    root_display: 'From Russia with Love',
    source: 'From Russia, with love.',
    target: 'Da Rússia com amor.',
    semantic_bridge:
      'The engine hiding in the title is COM = with. And COM + MIM is exactly where COMIGO came from — the piece you already own is this word wearing a disguise.',
    subtext: 'A compact root that quietly explains a piece you already have while handing you the general form.',
    extracts: [
      { id: 'com', target: 'com', gloss: 'with', shelf: 'small_words' },
      { id: 'amor', target: 'amor', gloss: 'love', shelf: 'things', gender: 'm', countable: false },
    ],
    branches: [
      { target: 'Café com leite.', en: 'Coffee with milk.' },
      { target: 'Com açúcar?', en: 'With sugar?' },
      { target: 'Comigo.', en: 'With me.', demonstrates: ['com', 'comigo'] },
      { target: 'Com amor.', en: 'With love.' },
    ],
    reinforces: ['comigo'],
    helpers: {
      'amor': 'love',
      'Café': 'coffee',
      'leite': 'milk',
      'açúcar': 'sugar',

    },
    transfer_prompt: { context: 'You are ordering coffee.', ask: 'Coffee with milk.', answer: 'Café com leite.' },
    rights_status: 'title-reference',
    starter_tags: ['ordering', 'compact'],
    next_root_hooks: ['sem'],
  }),
  q({
    root_id: 'jb_never_again',
    culture_family: 'james_bond',
    rung: 4,
    root_type: 'title',
    source_label: 'Never Say Never Again',
    source_status: 'verified',
    root_display: 'Never Say Never Again',
    source: 'Don’t say “never” again.',
    target: 'Não digas “nunca” outra vez.',
    semantic_bridge:
      'Natural Portuguese renders the title as “don’t say ‘never’ again”, which hands you a negative command and the single most useful survival phrase in one thought.',
    subtext: 'Playful, and unusually practical: OUTRA VEZ is what rescues you when you did not catch something.',
    extracts: [
      { id: 'outra_vez', target: 'outra vez', gloss: 'again', rung: 3, shelf: 'when' },
      { id: 'nao_digas', target: 'não digas', gloss: 'don’t say', shelf: 'doing', lemma: 'dizer', form: 'you, don’t' },
    ],
    branches: [
      { target: 'Diz outra vez.', en: 'Say it again.' },
      { target: 'Podes dizer outra vez?', en: 'Can you say it again?' },
      { target: 'Nunca mais.', en: 'Never again.', demonstrates: ['nunca'] },
      { target: 'Não digas isso.', en: 'Don’t say that.' },
    ],
    reinforces: ['podes', 'nunca'],
    voice_options: [
      {
        target: 'Outra vez?', en: 'Again?', signal: 'casual',
        register: 'TWO WORDS, ANYWHERE',
        when: 'You missed it. Two words and a raised eyebrow does the whole job.',
        risk: 'Said flatly to a stranger it can read as impatient — your face is doing half the work.',
      },
      {
        target: 'Podes dizer outra vez, por favor?', en: 'Can you say it again, please?', signal: 'polite',
        register: 'THE FULL ASK',
        when: 'When you want to be unmistakably polite, or you are already asking a second time.',
        safest: true,
      },
    ],
    voice_rule: 'Portuguese lets you be very short, as long as your tone is friendly. When you cannot rely on tone — on the phone, or with someone official — use the whole sentence.',
    helpers: {
      'isso': 'that',
      'Diz': 'say',
      'dizer': 'to say',
      'mais': 'more / again',

    },
    transfer_prompt: { context: 'You did not hear the waiter.', ask: 'Can you say it again?', answer: 'Podes dizer outra vez?' },
    rights_status: 'title-reference',
    starter_tags: ['survival', 'repair'],
    next_root_hooks: ['desculpa'],
  }),
  q({
    root_id: 'jb_no_time',
    culture_family: 'james_bond',
    rung: 4,
    root_type: 'title',
    source_label: 'No Time to Die',
    source_status: 'verified',
    root_display: 'No Time to Die',
    source: 'There is no time to die.',
    target: 'Sem tempo para morrer.',
    semantic_bridge:
      'SEM and TEMPO are visible in the title without any translation gymnastics, and PARA is the little word that introduces purpose — time for something, time to do something.',
    subtext: 'Genuinely useful travel language pulled out of a very dramatic title. Enjoy the contrast.',
    extracts: [
      { id: 'sem', target: 'sem', gloss: 'without', rung: 1, shelf: 'small_words' },
      { id: 'tempo', target: 'tempo', gloss: 'time', shelf: 'things', gender: 'm', countable: false },
    ],
    branches: [
      { target: 'Sem açúcar.', en: 'Without sugar.' },
      { target: 'Sem gelo.', en: 'Without ice.' },
      { target: 'Não tenho tempo.', en: 'I don’t have time.' },
    ],
    reinforces: ['com'],
    helpers: {
      'açúcar': 'sugar',
      'gelo': 'ice',
      'Não': 'not',
      'tenho': 'I have',

    },
    transfer_prompt: { context: 'At the bar.', ask: 'Without ice.', answer: 'Sem gelo.' },
    rights_status: 'title-reference',
    starter_tags: ['ordering', 'travel'],
    next_root_hooks: ['agora', 'tens'],
  }),
  // Rung 1. The most famous number in film, doing an unglamorous job.
  q({
    root_id: 'jb_007',
    culture_family: 'james_bond',
    rung: 1,
    root_type: 'title',
    source_label: '007',
    source_status: 'verified',
    root_display: 'Bond. 007.',
    source: 'Double-oh-seven.',
    target: 'Zero zero sete.',
    semantic_bridge:
      'Portugal reads the digits out one at a time, so the most famous number in film is already correct Portuguese. Numbers are a closed set of ten \u2014 the only vocabulary in the language you can finish in an afternoon and never revisit.',
    subtext: 'The least glamorous thing in this crate, and the first thing you will need at a till.',
    extracts: [
      { id: 'zero', target: 'zero', gloss: 'zero', shelf: 'how_much' },
      { id: 'sete', target: 'sete', gloss: 'seven', shelf: 'how_much' },
    ],
    branches: [
      { target: 'Sete euros.', en: 'Seven euros.' },
      { target: 'Mesa sete.', en: 'Table seven.' },
      { target: 'Zero problemas.', en: 'No problems at all.' },
    ],
    helpers: {
      'euros': 'euros',
      'Mesa': 'table',
      'problemas': 'problems',
    },
    transfer_prompt: {
      context: 'The waiter has just told you the total.',
      ask: 'Seven euros.',
      answer: 'Sete euros.',
    },
    rights_status: 'title-reference',
    starter_tags: ['numbers', 'first-day'],
    next_root_hooks: ['quanto'],
  }),
  // Rung 3. Latin for \u201chow much\u201d, and Portuguese never stopped using it.
  q({
    root_id: 'jb_quantum',
    culture_family: 'james_bond',
    rung: 3,
    root_type: 'title',
    source_label: 'Quantum of Solace',
    source_status: 'verified',
    root_display: 'Quantum of Solace',
    source: 'A quantum is an amount \u2014 a measure of how much.',
    target: 'Quanto custa?',
    semantic_bridge:
      'Quantum is Latin for \u201chow much\u201d, and Portuguese never stopped using the word: QUANTO. The one Bond title nobody understands turns out to be the question you need in every shop in the country.',
    subtext: 'Asked flatly, without apology. Nobody in Portugal thinks it is rude to ask a price.',
    extracts: [
      { id: 'quanto', target: 'quanto', gloss: 'how much', shelf: 'asking' },
      { id: 'custa', target: 'custa', gloss: 'it costs', shelf: 'doing', lemma: 'custar', form: 'it' },
    ],
    branches: [
      { target: 'Quanto custa isto?', en: 'How much is this?' },
      { target: 'Quanto \u00e9?', en: 'How much is it?' },
      { target: 'Custa sete euros.', en: 'It costs seven euros.' },
    ],
    reinforces: ['isto', 'sete'],
    helpers: {
      '\u00e9': 'is',
      'euros': 'euros',
    },
    transfer_prompt: {
      context: 'A market stall with no price on anything.',
      ask: 'How much is it?',
      answer: 'Quanto \u00e9?',
    },
    rights_status: 'title-reference',
    starter_tags: ['questions', 'shopping'],
    next_root_hooks: ['onde'],
  }),
]

// ---------------------------------------------------------------------------
// B5 — Bridget Jones Cringe Moments. Human, awkward, funny.
// Paraphrased social situations, not a screenplay quote bank.
// ---------------------------------------------------------------------------

export const BRIDGET_JONES: Root[] = [
  q({
    root_id: 'bj_overshare',
    culture_family: 'bridget_jones',
    rung: 6,
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You overshare. There is now a silence.',
    source: 'I said too much.',
    target: 'Falei demais.',
    semantic_bridge:
      'The whole cringe is “I said too much”, and Portuguese compresses that into two words. DEMAIS is the part you keep — it attaches to almost anything you overdid.',
    subtext: 'Self-aware, human, lightly comic. Said with a wince rather than an apology.',
    extracts: [
      { id: 'demais', target: 'demais', gloss: 'too much', shelf: 'how_much' },
      { id: 'falei', target: 'falei', gloss: 'I spoke / I said', shelf: 'doing', lemma: 'falar', form: 'I, past' },
    ],
    branches: [
      { target: 'Desculpa, falei demais.', en: 'Sorry, I said too much.' },
      { target: 'Comi demais.', en: 'I ate too much.' },
      { target: 'Bebi demais.', en: 'I drank too much.' },
    ],
    helpers: {
      'Desculpa,': 'sorry,',
      'Comi': 'I ate',
      'Bebi': 'I drank',

    },
    transfer_prompt: { context: 'You look down at an empty plate that was not small.', ask: 'I ate too much.', answer: 'Comi demais.' },
    freebie_flag: true,
    rights_status: 'dub-authored',
    starter_tags: ['awkward', 'recovery'],
    next_root_hooks: ['desculpa'],
  }),
  q({
    root_id: 'bj_late',
    culture_family: 'bridget_jones',
    rung: 6,
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You arrive late. Everyone is already there.',
    source: 'Sorry I’m late.',
    target: 'Desculpa o atraso.',
    semantic_bridge:
      'The useful move is not a literal description of being late. It is the phrase a Portuguese speaker actually reaches for: “sorry for the delay.”',
    subtext: 'Warm, everyday repair. How formal you go is a real choice, not a rule.',
    extracts: [
      { id: 'desculpa', target: 'desculpa', gloss: 'sorry', rung: 2, shelf: 'just_say' },
      { id: 'atraso', target: 'o atraso', gloss: 'the delay', shelf: 'things', gender: 'm' },
    ],
    branches: [
      { target: 'Desculpa.', en: 'Sorry.' },
      { target: 'Desculpa o atraso.', en: 'Sorry I’m late.' },
      { target: 'Peço desculpa.', en: 'I apologise.' },
    ],
    voice_options: [
      {
        target: 'Desculpa.', en: 'Sorry.', signal: 'casual',
        register: 'EVERYDAY SORRY',
        when: 'Bumping into someone, being two minutes late, squeezing past on a bus.',
        risk: 'This is the tu form. To someone older or official you want desculpe, with an e.',
      },
      {
        target: 'Peço desculpa.', en: 'I do apologise.', signal: 'polite',
        register: 'WHEN YOU MEAN IT',
        when: 'A real apology — properly late, genuinely wrong, or talking to a stranger or a boss.',
        safest: true,
      },
    ],
    voice_rule: 'Desculpa for small things, peço desculpa for real ones. And watch the last letter: desculpa to a friend, desculpe to anyone you would call “sir”.',
    helpers: {
      'Peço': 'I ask for',
      'sempre': 'always',
      'o': 'the',

    },
    transfer_prompt: { context: 'You bump into someone in a doorway.', ask: 'Sorry.', answer: 'Desculpa.' },
    rights_status: 'dub-authored',
    starter_tags: ['apology', 'social'],
    next_root_hooks: ['outra_vez'],
  }),
  q({
    root_id: 'bj_forgot_name',
    culture_family: 'bridget_jones',
    rung: 3,
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You forget the name of the person you are talking to.',
    source: 'Sorry… what’s your name?',
    target: 'Desculpa… como te chamas?',
    semantic_bridge:
      'The socially useful move is to apologise lightly and then just ask. And CHAMAS is the same verb as CHAMO-ME, pointed at the other person.',
    subtext: 'Embarrassing but entirely recoverable. Everyone has done it.',
    extracts: [{ id: 'como_te_chamas', target: 'como te chamas?', gloss: 'what’s your name?', shelf: 'asking', note: 'To somebody your own age. Como se chama? is the polite one.' }],
    branches: [
      { target: 'Chamo-me Ana.', en: 'My name is Ana.', demonstrates: ['chamo_me'] },
      { target: 'Como te chamas?', en: 'What’s your name?' },
      { target: 'Como se chama?', en: 'What is it called?', demonstrates: ['como_se_chama'] },
    ],
    reinforces: ['chamo_me', 'desculpa'],
    helpers: {
      'Ana': 'a name',
      'se': 'themselves',
      'Chamo-me': 'my name is',

    },
    transfer_prompt: { context: 'You meet someone and want their name.', ask: 'What’s your name?', answer: 'Como te chamas?' },
    rights_status: 'dub-authored',
    starter_tags: ['introduction', 'recovery'],
    next_root_hooks: ['chamo_me'],
  }),
  q({
    root_id: 'bj_wrong_thing',
    culture_family: 'bridget_jones',
    rung: 6,
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You say the wrong thing while trying to impress someone.',
    source: 'Sorry. That’s not what I meant.',
    target: 'Desculpa. Não era isso que queria dizer.',
    semantic_bridge:
      'Portuguese repairs this exactly the way English does — “that wasn’t what I meant to say” — which makes QUERIA DIZER available for every time the wrong word comes out.',
    subtext: 'The most valuable language an imperfect speaker can own: it gives you permission to recover instead of freeze.',
    extracts: [
      { id: 'queria_dizer', target: 'queria dizer…', gloss: 'I meant…', shelf: 'just_say' },
      { id: 'nao_era_isso', target: 'não era isso', gloss: 'that wasn’t it', shelf: 'just_say' },
    ],
    branches: [
      { target: 'Queria dizer…', en: 'I meant…' },
      { target: 'Não era isso.', en: 'That wasn’t it.' },
      { target: 'Desculpa, queria dizer outra coisa.', en: 'Sorry, I meant something else.' },
    ],
    reinforces: ['desculpa'],
    helpers: {
      'Desculpa,': 'sorry,',
      'outra': 'another',
      'coisa': 'thing',
      'dizer': 'to say',

    },
    transfer_prompt: { context: 'You point at the wrong thing on the menu.', ask: 'That wasn’t it.', answer: 'Não era isso.' },
    rights_status: 'dub-authored',
    starter_tags: ['recovery', 'social'],
    next_root_hooks: ['outra_vez'],
  }),
  q({
    root_id: 'bj_joke',
    culture_family: 'bridget_jones',
    rung: 6,
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'The joke does not land.',
    source: 'It was a joke.',
    target: 'Era uma piada.',
    semantic_bridge:
      'The rescue is a past frame you can point at anything: ERA UMA… = it was a… The joke is disposable; the frame is not.',
    subtext: '“Era uma piada” can sound sheepish. “Estou a brincar” is lighter and lands better in the moment.',
    extracts: [
      { id: 'era', target: 'era…', gloss: 'it was…', shelf: 'doing', lemma: 'ser', form: 'it, past' },
      { id: 'piada', target: 'uma piada', gloss: 'a joke', shelf: 'things', gender: 'f' },
    ],
    branches: [
      { target: 'Era uma piada.', en: 'It was a joke.' },
      { target: 'Estou a brincar.', en: 'I’m joking.', demonstrates: ['piada'] },
      { target: 'É uma piada?', en: 'Is it a joke?' },
    ],
    reinforces: ['estavas_a'],
    voice_options: [
      {
        target: 'Era uma piada.', en: 'It was a joke.', signal: 'dry',
        register: 'RESCUING A JOKE THAT DIED',
        when: 'Past tense. The joke has already landed badly and you are explaining it. Slightly wry.',
      },
      {
        target: 'Estou a brincar!', en: 'I’m only joking!', signal: 'warm',
        register: 'BEFORE IT LANDS BADLY',
        when: 'Said immediately, while their face is still changing. Warmer, and it gets there first.',
        safest: true,
      },
    ],
    voice_rule: 'Estou a + verb is how European Portuguese says “I am ...-ing”. Estou a brincar, estou a falar, estou a pensar. Brazilians drop the a; in Portugal you keep it.',
    helpers: {
      'Estou': 'I am',
      'brincar': 'joking',
      'É': 'is',

    },
    transfer_prompt: { context: 'Your friend takes you seriously.', ask: 'I’m joking.', answer: 'Estou a brincar.' },
    rights_status: 'dub-authored',
    starter_tags: ['humour', 'recovery'],
    next_root_hooks: ['calma'],
  }),
  // Rung 1. This crate had nothing a beginner could open.
  q({
    root_id: 'bj_wine',
    culture_family: 'bridget_jones',
    rung: 1,
    root_type: 'paraphrased_moment',
    source_label: 'Bridget Jones\u2019s Diary \u2014 alone, with a very large glass',
    source_status: 'paraphrased',
    root_display: 'Bridget, alone, with an extremely large glass of wine',
    source: 'A glass of wine, please.',
    target: 'Um copo de vinho, por favor.',
    semantic_bridge:
      'Portuguese orders the container, not the drink \u2014 not \u201ca wine\u201d but a glass OF wine. That small DE does the same job in um copo de \u00e1gua and uma ch\u00e1vena de caf\u00e9, so the shape is worth more than the sentence.',
    subtext: 'The most reliable sentence in the language. Learn the shape once and swap the last word forever.',
    extracts: [
      { id: 'copo', target: 'copo', gloss: 'glass', shelf: 'things', gender: 'm' },
      { id: 'vinho', target: 'vinho', gloss: 'wine', shelf: 'things', gender: 'm', countable: false },
      { id: 'por_favor', target: 'por favor', gloss: 'please', shelf: 'just_say' },
    ],
    branches: [
      { target: 'Um copo de \u00e1gua, por favor.', en: 'A glass of water, please.' },
      { target: 'Dois copos de vinho.', en: 'Two glasses of wine.' },
      { target: 'Vinho tinto, por favor.', en: 'Red wine, please.' },
    ],
    helpers: {
      'Um': 'a',
      'de': 'of',
      '\u00e1gua': 'water',
      'Dois': 'two',
      'copos': 'glasses',
      'tinto': 'red (of wine)',
    },
    transfer_prompt: {
      context: 'You have found a table and the waiter has appeared.',
      ask: 'A glass of water, please.',
      answer: 'Um copo de \u00e1gua, por favor.',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['ordering', 'first-day'],
    next_root_hooks: ['cinco'],
  }),
  // Rung 5. The diary is entirely about a third person, so this is where he arrives.
  q({
    root_id: 'bj_does_he',
    culture_family: 'bridget_jones',
    rung: 5,
    root_type: 'paraphrased_moment',
    source_label: 'Bridget Jones\u2019s Diary \u2014 the whole diary, really',
    source_status: 'paraphrased',
    root_display: 'The entire diary, in one question',
    source: 'Does he like me?',
    target: 'Ele gosta de mim?',
    semantic_bridge:
      'Every sentence so far has been about you or the person in front of you. ELE is the moment somebody else walks into the conversation \u2014 and the verb ending is already telling you it is one other person, which is why Portuguese usually drops the pronoun entirely.',
    subtext: 'Asked at one in the morning, of a friend who has heard it before.',
    extracts: [
      { id: 'ele', target: 'ele', gloss: 'he', shelf: 'people', lemma: 'ele', form: 'he' },
      { id: 'gosta_de', target: 'gosta de', gloss: 'likes', shelf: 'doing', lemma: 'gostar', form: 'he/she', note: 'The DE never leaves. Gosto de ti, gosta de vinho — you like OF something. Drop it and it stops being Portuguese. You have said it with the de every time.' },
    ],
    branches: [
      { target: 'Ela gosta de ti.', en: 'She likes you.' },
      { target: 'Ele n\u00e3o gosta de vinho.', en: 'He doesn\u2019t like wine.' },
      { target: 'Eles gostam de ti.', en: 'They like you.', demonstrates: ['eles', 'gosta_de'] },
    ],
    reinforces: ['vinho'],
    helpers: {
      'Ela': 'she',
      'Eles': 'they',
      'gostam': 'they like',
      'ti': 'you',
      'mim': 'me',
      'n\u00e3o': 'not',
      'de': 'of',
    },
    transfer_prompt: {
      context: 'Your friend has been staring at the same person all evening.',
      ask: 'He likes you.',
      answer: 'Ele gosta de ti.',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['other-people', 'gossip'],
    next_root_hooks: ['eles'],
  }),
]

// ---------------------------------------------------------------------------
// B6 — Pulp Fiction Banger Quotes. Sharp, irreverent, rhythmic.
// Keep exact quoted material tiny. Preserve the punch, then leave the film fast.
// ---------------------------------------------------------------------------

export const PULP_FICTION: Root[] = [
  q({
    root_id: 'pf_royale',
    culture_family: 'pulp_fiction',
    rung: 1,
    source_label: 'Pulp Fiction',
    root_display: 'Royale with Cheese.',
    source: 'A Royale with cheese.',
    target: 'Royale com queijo.',
    semantic_bridge:
      'The joke is entirely cultural. The useful word is the smallest one in the sentence: COM.',
    subtext: 'A fast wink, not a lesson. If you already have COM, this is a nod rather than a discovery.',
    extracts: [
      { id: 'com', target: 'com', gloss: 'with', shelf: 'small_words' },
      { id: 'queijo', target: 'queijo', gloss: 'cheese', shelf: 'things', gender: 'm' },
    ],
    branches: [
      { target: 'Com açúcar.', en: 'With sugar.' },
      { target: 'Com gelo.', en: 'With ice.' },
      { target: 'Com queijo.', en: 'With cheese.' },
    ],
    reinforces: ['com', 'sem'],
    helpers: {
      'açúcar': 'sugar',
      'gelo': 'ice',
      'queijo': 'cheese',
      'Com': 'with',

    },
    transfer_prompt: { context: 'You are ordering.', ask: 'With cheese.', answer: 'Com queijo.' },
    freebie_flag: true,
    starter_tags: ['ordering', 'funny'],
    next_root_hooks: ['sem'],
  }),
  q({
    root_id: 'pf_say_what',
    culture_family: 'pulp_fiction',
    rung: 3,
    source_label: 'Pulp Fiction',
    root_display: 'Say “what” again!',
    source: 'Say “what” one more time.',
    target: 'Diz “o quê” outra vez!',
    semantic_bridge:
      'The rhythm carries straight across, and every word in it is worth keeping: DIZ, O QUÊ, OUTRA VEZ.',
    subtext: 'The film gives this line menace. Keep the polite version — that is the one you will actually need.',
    extracts: [
      { id: 'diz', target: 'diz', gloss: 'say', shelf: 'doing', lemma: 'dizer', form: 'you, an order' },
      { id: 'o_que', target: 'o quê?', gloss: 'what?', shelf: 'asking' },
    ],
    branches: [
      { target: 'Diz outra vez.', en: 'Say it again.' },
      { target: 'Podes dizer outra vez?', en: 'Can you say it again?', demonstrates: ['diz', 'outra_vez', 'podes'] },
      { target: 'O quê?', en: 'What?' },
    ],
    reinforces: ['outra_vez', 'podes'],
    voice_options: [
      {
        target: 'O quê?', en: 'What?', signal: 'direct',
        register: 'WITH PEOPLE YOU KNOW',
        when: 'A friend says something surprising, or you simply did not hear it.',
        risk: 'On its own, to a stranger, this is close to “what?!” in English. It can sound aggressive.',
      },
      {
        target: 'Desculpa, o quê?', en: 'Sorry, what?', signal: 'softened',
        register: 'WITH ANYONE',
        when: 'One word in front and the same question turns polite. Reach for this one by default.',
        safest: true,
      },
    ],
    voice_rule: 'Desculpa in front of a question is the Portuguese “sorry, ...”. It costs you one word and removes almost all of the risk.',
    helpers: {
      'Diz': 'say',
      'dizer': 'to say',
      'Podes': 'can you',

    },
    transfer_prompt: { context: 'You miss what someone said.', ask: 'Can you say it again?', answer: 'Podes dizer outra vez?' },
    starter_tags: ['survival', 'repair'],
    next_root_hooks: ['desculpa'],
  }),
  q({
    root_id: 'pf_burger',
    culture_family: 'pulp_fiction',
    rung: 1,
    source_label: 'Pulp Fiction',
    root_display: 'That’s a tasty burger.',
    source: 'That burger is really good.',
    target: 'Esse hambúrguer é mesmo bom.',
    literal_note: 'A literal “saboroso” is possible but sounds written, not spoken.',
    semantic_bridge:
      'Everyday European Portuguese reaches for “é mesmo bom” rather than a dictionary word for tasty. MESMO is the intensifier you will hear constantly.',
    subtext: 'A signature moment: natural speech beating dictionary fidelity.',
    extracts: [
      { id: 'mesmo', target: 'mesmo', gloss: 'really', shelf: 'small_words' },
      { id: 'bom', target: 'bom', gloss: 'good', shelf: 'describing', lemma: 'bom', form: 'masculine', note: 'The feminine is boa. Boa ideia, bom dia.' },
    ],
    branches: [
      { target: 'Isso é mesmo bom.', en: 'That is really good.' },
      { target: 'Muito bom.', en: 'Very good.' },
      { target: 'Esse é bom.', en: 'That one is good.' },
    ],
    helpers: {
      'Isso': 'that',
      'é': 'is',
      'Muito': 'very',
      'Esse': 'that one',

    },
    transfer_prompt: { context: 'You taste something excellent.', ask: 'That’s really good.', answer: 'Isso é mesmo bom.' },
    starter_tags: ['reaction', 'food'],
    next_root_hooks: ['boa_ideia'],
  }),
  q({
    root_id: 'pf_be_cool',
    culture_family: 'pulp_fiction',
    rung: 2,
    source_label: 'Pulp Fiction',
    root_display: 'Be cool.',
    source: 'Calm down.',
    target: 'Tem calma.',
    semantic_bridge:
      'Portuguese does not translate “cool” here. It says “have calm” — and CALMA on its own does most of the work.',
    subtext: 'Register matters enormously. TEM CALMA can soothe or infuriate; CALMA alone is softer.',
    extracts: [{ id: 'calma', target: 'calma', gloss: 'calm / easy', shelf: 'just_say' }],
    branches: [
      { target: 'Calma.', en: 'Easy.' },
      { target: 'Tem calma.', en: 'Calm down.' },
      { target: 'Está tudo bem.', en: 'It’s all right.', demonstrates: ['esta_', 'tudo'] },
    ],
    voice_options: [
      {
        target: 'Calma.', en: 'Easy.', signal: 'dry',
        register: 'TAKING THE HEAT OUT',
        when: 'Someone is getting wound up. One word, said gently, is completely normal here.',
        risk: 'Said sharply it becomes a telling-off. Tone is doing all the work.',
      },
      {
        target: 'Está tudo bem.', en: 'It’s all right.', signal: 'warm',
        register: 'REASSURING',
        when: '“It’s all fine.” You are not asking them to calm down, you are saying there is nothing to fix.',
        safest: true,
      },
    ],
    voice_rule: 'Calma manages the person. Está tudo bem manages the situation. The second one is almost never wrong.',
    helpers: {
      'Era': 'it was',
      'uma': 'a',
      'piada': 'a joke',
      'Tem': 'have',
      'Está': 'is',
      'tudo': 'all',
      'bem': 'well',

    },
    transfer_prompt: { context: 'A friend is panicking.', ask: 'Easy.', answer: 'Calma.' },
    starter_tags: ['reaction', 'social'],
    next_root_hooks: ['agora'],
  }),
  q({
    root_id: 'pf_what_do_they_call_it',
    culture_family: 'pulp_fiction',
    rung: 3,
    root_type: 'paraphrased_moment',
    source_label: 'Pulp Fiction — paraphrased scene reference',
    source_status: 'paraphrased',
    root_display: 'The famous conversation about what they call it over there.',
    source: 'What is it called?',
    target: 'Como é que se chama?',
    literal_note: 'Literally “how is it called?”',
    semantic_bridge:
      'The whole scene is about what something is called, and Portuguese packages that as COMO É QUE SE CHAMA — the same CHAMAR you already met introducing yourself.',
    subtext: 'This is where the film unexpectedly turns into survival language.',
    extracts: [{ id: 'como_se_chama', target: 'como se chama?', gloss: 'what is it called?', shelf: 'asking', note: 'Also how you ask what an object is called.' }],
    branches: [
      { target: 'Como se chama isto?', en: 'What is this called?' },
      { target: 'Como te chamas?', en: 'What’s your name?', demonstrates: ['como_te_chamas'] },
      { target: 'Chama-se…', en: 'It’s called…', demonstrates: ['como_se_chama'] },
    ],
    reinforces: ['chamo_me', 'como_te_chamas'],
    helpers: {
      'isto': 'this',
      'te': 'you',
      'Chama-se': 'it’s called',
      'Como': 'how',

    },
    transfer_prompt: { context: 'You point at an unfamiliar food.', ask: 'What is this called?', answer: 'Como se chama isto?' },
    starter_tags: ['survival', 'question'],
    next_root_hooks: ['chamo_me'],
  }),
  // Rung 1. The joke is the price, which makes the number the lesson.
  q({
    root_id: 'pf_shake',
    culture_family: 'pulp_fiction',
    rung: 1,
    root_type: 'quote',
    source_label: 'Pulp Fiction',
    source_status: 'verified',
    root_display: 'A five-dollar shake',
    source: 'A five-euro milkshake.',
    target: 'Um batido de cinco euros.',
    semantic_bridge:
      'The gag only works if you hear the price, so the number is the point. Portuguese puts the figure before the currency \u2014 cinco euros \u2014 and joins the thing to its price with the same DE that joined the glass to the wine.',
    subtext: 'Ordinary, transactional language, hiding inside the most quoted diner scene ever filmed.',
    extracts: [
      { id: 'euro', target: 'euro', gloss: 'euro', shelf: 'things', gender: 'm', plural: 'euros' },
      { id: 'cinco', target: 'cinco', gloss: 'five', shelf: 'how_much' },
      { id: 'batido', target: 'batido', gloss: 'milkshake', shelf: 'things', gender: 'm' },
    ],
    branches: [
      { target: 'Cinco euros.', en: 'Five euros.' },
      { target: 'Um batido, por favor.', en: 'A milkshake, please.' },
      { target: 'Dois batidos.', en: 'Two milkshakes.' },
    ],
    reinforces: ['por_favor'],
    helpers: {
      'euros': 'euros',
      'Um': 'a',
      'Dois': 'two',
      'de': 'of',
    },
    transfer_prompt: {
      context: 'The bill arrives for two coffees.',
      ask: 'Five euros.',
      answer: 'Cinco euros.',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['numbers', 'ordering'],
    next_root_hooks: ['quanto'],
  }),
  // Rung 5. \u201cThey call it\u201d \u2014 the line is already in the third person plural.
  q({
    root_id: 'pf_they_call_it',
    culture_family: 'pulp_fiction',
    rung: 5,
    root_type: 'quote',
    source_label: 'Pulp Fiction',
    source_status: 'verified',
    root_display: 'They call it a Royale with Cheese',
    source: 'They call it a Royale with cheese.',
    target: 'Eles chamam-lhe Royale com queijo.',
    semantic_bridge:
      'You have met chamo-me and como se chama. Here is the same verb with a third ending, and the giveaway is the M: a Portuguese verb ending in -M is nearly always about more than one other person. One letter, and the whole language opens up.',
    subtext: 'Said as though it were fascinating, which is exactly how you will use it.',
    extracts: [
      { id: 'eles', target: 'eles', gloss: 'they', shelf: 'people', lemma: 'ele', form: 'they' },
      { id: 'chamam', target: 'chamam', gloss: 'they call', shelf: 'doing', lemma: 'chamar', form: 'they' },
    ],
    branches: [
      { target: 'Eles chamam-me Sam.', en: 'They call me Sam.' },
      { target: 'Eles est\u00e3o aqui.', en: 'They\u2019re here.' },
      { target: 'Como \u00e9 que eles chamam isto?', en: 'What do they call this?' },
    ],
    reinforces: ['chamo_me', 'como_se_chama', 'isto'],
    helpers: {
      'chamam-me': 'they call me',
      'chamam-lhe': 'they call it',
      'est\u00e3o': 'they are',
      'aqui': 'here',
      'Como': 'how',
      '\u00e9': 'is',
      'que': 'that',
      'queijo': 'cheese',
      'com': 'with',
    },
    transfer_prompt: {
      context: 'Somebody asks what your friends call you.',
      ask: 'They call me Sam.',
      answer: 'Eles chamam-me Sam.',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['other-people', 'verb-endings'],
    next_root_hooks: ['fazem'],
  }),
  // Rung 3. The question the whole Zed sequence turns on.
  q({
    root_id: 'pf_zed',
    culture_family: 'pulp_fiction',
    rung: 3,
    root_type: 'quote',
    source_label: 'Pulp Fiction',
    source_status: 'verified',
    root_display: 'Who\u2019s Zed?',
    source: 'Who is Zed?',
    target: 'Quem \u00e9 o Zed?',
    semantic_bridge:
      'Two words and both are load-bearing. QUEM asks about a person where QUANTO asked about an amount and ONDE asked about a place \u2014 the question words are a small set, and you now have most of them.',
    subtext: 'Asked flatly, of somebody who very much does not want to answer.',
    extracts: [
      { id: 'quem', target: 'quem', gloss: 'who', shelf: 'asking' },
      { id: 'e_is', target: '\u00e9', gloss: 'is', shelf: 'doing', lemma: 'ser', form: 'he/she/it', note: 'É is what someone IS; está is how they are right now. És engraçado is about him. Estás gira is about tonight. It is the one an English speaker gets wrong most, and you have already used both correctly.' },
    ],
    branches: [
      { target: 'Quem \u00e9 este?', en: 'Who\u2019s this?' },
      { target: 'Quem \u00e9 ele?', en: 'Who is he?' },
      { target: '\u00c9 o meu parceiro.', en: 'He\u2019s my wingman.' },
    ],
    reinforces: ['como_se_chama', 'onde', 'quanto'],
    helpers: {
      'este': 'this one',
      'o': 'the',
      'meu': 'my',
      'parceiro': 'partner / wingman',
      'ele': 'he',
    },
    transfer_prompt: {
      context: 'Somebody you do not recognise has just walked in.',
      ask: 'Who\u2019s this?',
      answer: 'Quem \u00e9 este?',
    },
    rights_status: 'short-quote-review-required',
    starter_tags: ['questions', 'other-people'],
    next_root_hooks: ['eles'],
  }),
]

// ---------------------------------------------------------------------------
// B7 — Audrey Hepburn Musings. Warm, aspirational, elegant.
// Musings rather than a quote archive: paraphrase by default.
// ---------------------------------------------------------------------------

export const AUDREY_HEPBURN: Root[] = [
  q({
    root_id: 'ah_paris',
    culture_family: 'audrey_hepburn',
    rung: 4,
    source_label: 'Audrey Hepburn — attribution requires review',
    source_status: 'needs-review',
    root_display: 'Paris is always a good idea.',
    source: 'Paris is always a good idea.',
    target: 'Paris é sempre uma boa ideia.',
    semantic_bridge:
      'The line maps across word for word, and hands over two pieces you will use constantly without ever mentioning Paris again.',
    subtext: 'Elegant, warm, instantly usable. BOA IDEIA is how you agree to almost anything.',
    extracts: [
      { id: 'sempre', target: 'sempre', gloss: 'always', shelf: 'when' },
      { id: 'boa_ideia', target: 'boa ideia', gloss: 'good idea', shelf: 'just_say' },
    ],
    branches: [
      { target: 'É uma boa ideia.', en: 'It’s a good idea.' },
      { target: 'Sempre.', en: 'Always.' },
      { target: 'Acho que é uma boa ideia.', en: 'I think it’s a good idea.' },
    ],
    helpers: {
      'É': 'it is',
      'uma': 'a',
      'Acho': 'I think',
      'que': 'that',

    },
    voice_options: [
      {
        target: 'Boa ideia.', en: 'Good idea.', signal: 'casual',
        register: 'QUICK AGREEMENT',
        when: 'Someone suggests something and you are in. Two words is entirely natural.',
      },
      {
        target: 'Acho que é uma boa ideia.', en: 'I think it’s a good idea.', signal: 'softened',
        register: 'WEIGHING IN',
        when: 'A meeting, a decision, anywhere you would rather sound considered than eager.',
      },
    ],
    voice_rule: 'Acho que — “I think that” — is the most useful three syllables you can carry. It buys you a second to think and softens whatever comes after it.',
    transfer_prompt: { context: 'A friend suggests lunch outside.', ask: 'Good idea.', answer: 'Boa ideia.' },
    freebie_flag: true,
    starter_tags: ['warm', 'agreement'],
    next_root_hooks: ['acho_que'],
  }),
  q({
    root_id: 'ah_enjoy',
    culture_family: 'audrey_hepburn',
    rung: 2,
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey theme',
    source_status: 'paraphrased',
    root_display: 'Enjoy your life.',
    source: 'Make the most of your life.',
    target: 'Aproveita a vida.',
    semantic_bridge:
      'The sentiment compresses into a single Portuguese imperative, and APROVEITA turns out to be one of the most-used words in the language — far beyond anything inspirational.',
    subtext: 'Positive without being saccharine. You will hear it shouted across a car park.',
    extracts: [
      { id: 'aproveita', target: 'aproveita', gloss: 'enjoy / make the most of', shelf: 'doing', lemma: 'aproveitar', form: 'you, an order' },
      { id: 'vida', target: 'vida', gloss: 'life', rung: 1, shelf: 'things', gender: 'f' },
    ],
    branches: [
      { target: 'Aproveita o dia.', en: 'Enjoy the day.' },
      { target: 'Aproveita!', en: 'Enjoy it!' },
      { target: 'Quero aproveitar.', en: 'I want to make the most of it.', demonstrates: ['aproveita'] },
      { target: 'É a vida.', en: 'That’s life.' },
    ],
    helpers: {
      'a': 'the',
      'vida': 'life',
      'o': 'the',
      'dia': 'day',
      'Quero': 'I want',
      'aproveitar': 'to make the most of it',

    },
    transfer_prompt: { context: 'Your friend leaves for a holiday.', ask: 'Enjoy!', answer: 'Aproveita!' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'everyday'],
    next_root_hooks: ['sempre'],
  }),
  q({
    root_id: 'ah_people',
    culture_family: 'audrey_hepburn',
    rung: 5,
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of documented human-connection themes',
    source_status: 'paraphrased',
    root_display: 'People matter more than things.',
    source: 'People matter more than things.',
    target: 'As pessoas importam mais do que as coisas.',
    semantic_bridge:
      'The thought is a comparison, which makes MAIS DO QUE the engine — and that engine works for any two things you want to weigh against each other.',
    subtext: 'Warm and emotionally useful, rather than phrasebook language.',
    extracts: [
      { id: 'coisa', target: 'coisa', gloss: 'thing', shelf: 'things', gender: 'f' },
      { id: 'mais_do_que', target: 'mais do que', gloss: 'more than', shelf: 'how_much' },
      { id: 'importa', target: 'importa', gloss: 'it matters', shelf: 'doing', lemma: 'importar', form: 'it' },
    ],
    branches: [
      { target: 'Tu importas.', en: 'You matter.', demonstrates: ['importa'] },
      { target: 'Mais do que isso.', en: 'More than that.' },
      { target: 'Isto importa.', en: 'This matters.' },
      { target: 'As coisas mudam.', en: 'Things change.', demonstrates: ['coisa'] },
    ],
    helpers: {
      'As': 'the',
      'mudam': 'they change',
      'Tu': 'you',
      'importas': 'you matter',
      'isso': 'that',
      'Isto': 'this',

    },
    transfer_prompt: { context: 'Someone is doubting themselves.', ask: 'You matter.', answer: 'Tu importas.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'emotional'],
    next_root_hooks: ['o_mais_importante'],
  }),
  q({
    root_id: 'ah_good_side',
    culture_family: 'audrey_hepburn',
    rung: 5,
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey sentiment',
    source_status: 'paraphrased',
    root_display: 'Look for the good in people.',
    source: 'Look for the good side of people.',
    target: 'Procura o lado bom das pessoas.',
    semantic_bridge:
      'Portuguese builds this around LADO BOM — the good side — and PROCURA, which is also just the ordinary word for looking for your keys.',
    subtext: 'Gentle but active. Warm language that still does everyday work.',
    extracts: [
      { id: 'procura', target: 'procura', gloss: 'look for', shelf: 'doing', lemma: 'procurar', form: 'you, an order' },
      { id: 'lado_bom', target: 'o lado bom', gloss: 'the good side', shelf: 'things', gender: 'm' },
    ],
    branches: [
      { target: 'Procura aqui.', en: 'Look here.' },
      { target: 'O lado bom.', en: 'The good side.' },
      { target: 'É uma boa pessoa.', en: 'They’re a good person.', demonstrates: ['bom'] },
    ],
    reinforces: ['bom'],
    helpers: {
      'aqui': 'here',
      'É': 'is',
      'uma': 'a',
      'boa': 'good',
      'pessoa': 'person',
      'O': 'the',

    },
    transfer_prompt: { context: 'Someone asks what you like about a situation.', ask: 'The good side.', answer: 'O lado bom.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'perspective'],
    next_root_hooks: ['boa_ideia'],
  }),
  q({
    root_id: 'ah_happy',
    culture_family: 'audrey_hepburn',
    rung: 6,
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey sentiment',
    source_status: 'paraphrased',
    root_display: 'The most important thing is to be happy.',
    source: 'The most important thing is to be happy.',
    target: 'O mais importante é ser feliz.',
    semantic_bridge:
      'O MAIS IMPORTANTE É… is a frame you can put almost anything into, which makes it far more valuable than the sentiment it arrived in.',
    subtext: 'Aspirational on the surface, structurally very ordinary underneath.',
    extracts: [
      { id: 'o_mais_importante', target: 'o mais importante', gloss: 'the most important thing', shelf: 'just_say' },
      { id: 'feliz', target: 'feliz', gloss: 'happy', shelf: 'describing', note: 'Same for a man or a woman. Not every adjective changes.' },
    ],
    branches: [
      { target: 'É importante.', en: 'It’s important.', demonstrates: ['o_mais_importante'] },
      { target: 'O que é mais importante?', en: 'What is most important?', demonstrates: ['o_mais_importante', 'o_que'] },
      { target: 'Quero ser feliz.', en: 'I want to be happy.' },
      { target: 'O mais importante é isto.', en: 'The most important thing is this.' },
    ],
    reinforces: ['mais_do_que'],
    helpers: {
      'isto': 'this',
      'É': 'it is',
      'importante': 'important',
      'O': 'the',
      'que': 'what',
      'é': 'is',
      'Quero': 'I want',
      'ser': 'to be',

    },
    voice_options: [
      {
        target: 'É importante.', en: 'It’s important.', signal: 'direct',
        register: 'STATING A FACT',
        when: 'You are saying this matters, full stop, as though everyone already agrees.',
        risk: 'Stated flatly about someone else’s choices it can sound like a verdict.',
      },
      {
        target: 'Para mim é importante.', en: 'It matters to me.', signal: 'warm',
        register: 'MAKING IT YOURS',
        when: '“For me, it matters.” Same point, without telling anyone else what to think.',
        safest: true,
      },
    ],
    voice_rule: 'Para mim in front of an opinion is how you disagree politely in Portuguese. It turns a verdict into a view.',
    transfer_prompt: { context: 'You are explaining a decision.', ask: 'It’s important.', answer: 'É importante.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'identity'],
    next_root_hooks: ['agora'],
  }),
]

// ---------------------------------------------------------------------------
// B8 — Marcus Aurelius Wisdom. Reflective, calm, universal.
// Public-domain source meaning or DUB-authored distillation. Never a lifted modern
// translation.
// ---------------------------------------------------------------------------

export const MARCUS_AURELIUS: Root[] = [
  q({
    root_id: 'ma_control',
    culture_family: 'marcus_aurelius',
    rung: 6,
    root_type: 'wisdom',
    source_label: 'DUB distillation of a recurring Meditations theme',
    source_status: 'public-domain-derived',
    root_display: 'Control what you can control.',
    source: 'Control what you can control.',
    target: 'Controla o que podes controlar.',
    semantic_bridge:
      'The thought and the Portuguese have nearly the same shape, which puts PODES right in the middle of the sentence where you cannot miss it.',
    subtext: 'Calm and practical. It sounds modern despite being nearly two thousand years old.',
    extracts: [
      { id: 'podes', target: 'podes', gloss: 'you can', shelf: 'doing', lemma: 'poder', form: 'you' },
      { id: 'o_que', target: 'o que', gloss: 'what / that which', shelf: 'asking' },
    ],
    branches: [
      { target: 'O que posso fazer?', en: 'What can I do?' },
      { target: 'Não posso controlar isso.', en: 'I can’t control that.', demonstrates: ['podes', 'posso'] },
      { target: 'Podes controlar isto.', en: 'You can control this.' },
    ],
    reinforces: ['podes'],
    helpers: {
      'O': 'what',
      'posso': 'I can',
      'fazer': 'to do',
      'Não': 'not',
      'controlar': 'to control',
      'isso': 'that',
      'isto': 'this',

    },
    transfer_prompt: { context: 'You are stuck on something.', ask: 'What can I do?', answer: 'O que posso fazer?' },
    freebie_flag: true,
    rights_status: 'dub-authored',
    starter_tags: ['reflective', 'control'],
    next_root_hooks: ['agora'],
  }),
  q({
    root_id: 'ma_react',
    culture_family: 'marcus_aurelius',
    rung: 6,
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'You do not control what happens. You control how you react.',
    source: 'You control your response, not the event.',
    target: 'Não controlas o que acontece. Controlas como reages.',
    semantic_bridge:
      'The idea splits cleanly into event and response, and both halves hand over an ordinary question you will use this week.',
    subtext: 'A reflection root that unexpectedly unlocks the most everyday questions there are.',
    extracts: [
      { id: 'o_que_acontece', target: 'o que acontece', gloss: 'what happens', shelf: 'asking' },
      { id: 'como', target: 'como', gloss: 'how', shelf: 'asking' },
    ],
    branches: [
      { target: 'O que aconteceu?', en: 'What happened?', demonstrates: ['o_que_acontece'] },
      { target: 'Como reagiste?', en: 'How did you react?' },
      { target: 'Não posso controlar isso.', en: 'I can’t control that.', demonstrates: ['podes', 'posso'] },
    ],
    reinforces: ['o_que'],
    helpers: {
      'aconteceu': 'happened',
      'reagiste': 'you reacted',
      'Não': 'not',
      'posso': 'I can',
      'controlar': 'to control',
      'isso': 'that',
      'O': 'what',
      'Como': 'how',

    },
    transfer_prompt: { context: 'You walk in on something.', ask: 'What happened?', answer: 'O que aconteceu?' },
    rights_status: 'dub-authored',
    starter_tags: ['reflective', 'question'],
    next_root_hooks: ['como_se_chama'],
  }),
  q({
    root_id: 'ma_now',
    culture_family: 'marcus_aurelius',
    rung: 4,
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'The only moment you have is now.',
    source: 'Now is all you have.',
    target: 'O único momento que tens é agora.',
    semantic_bridge:
      'The philosophy makes AGORA impossible to forget, and quietly hands you TENS — the ordinary “you have” you need to ask anyone for anything.',
    subtext: 'The wisdom evaporates fast. AGORA and TENS stay for good.',
    extracts: [
      { id: 'agora', target: 'agora', gloss: 'now', shelf: 'when' },
      { id: 'tens', target: 'tens', gloss: 'you have', shelf: 'doing', lemma: 'ter', form: 'you' },
    ],
    branches: [
      { target: 'Agora não.', en: 'Not now.' },
      { target: 'E agora?', en: 'And now?' },
      { target: 'Tens tempo?', en: 'Do you have time?' },
    ],
    reinforces: ['tempo'],
    voice_options: [
      {
        target: 'Agora não.', en: 'Not now.', signal: 'direct',
        register: 'SHORT AND CLEAR',
        when: 'A shop, a street seller, anyone you owe no explanation to.',
        risk: 'To a friend or a colleague this can sound like you are annoyed with them.',
      },
      {
        target: 'Agora não posso, desculpa.', en: 'I can’t right now, sorry.', signal: 'softened',
        register: 'WITH A REASON ATTACHED',
        when: '“I can’t right now, sorry.” A reason and an apology in four words.',
        safest: true,
      },
    ],
    voice_rule: 'Portuguese expects a small reason alongside a refusal. Não posso plus desculpa is enough — you never have to explain what you are doing instead.',
    helpers: {
      'não': 'not',
      'E': 'and',
      'tempo': 'time',

    },
    transfer_prompt: { context: 'Someone asks if you can talk.', ask: 'Not now.', answer: 'Agora não.' },
    rights_status: 'dub-authored',
    starter_tags: ['reflective', 'time'],
    next_root_hooks: ['tempo', 'amanha'],
  }),
  q({
    root_id: 'ma_true',
    culture_family: 'marcus_aurelius',
    rung: 6,
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'If it is not true, do not say it.',
    source: 'Don’t say it if it isn’t true.',
    target: 'Se não é verdade, não digas.',
    semantic_bridge:
      'The maxim is built from three pieces that convert straight into everyday conditionals: SE, É VERDADE and the negative command NÃO DIGAS.',
    subtext: 'Simple moral language that turns into ordinary reactions almost immediately.',
    extracts: [
      { id: 'se', target: 'se', gloss: 'if', shelf: 'small_words' },
      { id: 'e_verdade', target: 'é verdade', gloss: 'it is true', shelf: 'just_say' },
    ],
    branches: [
      { target: 'É verdade?', en: 'Is it true?' },
      { target: 'Se quiseres.', en: 'If you want.' },
      { target: 'Não digas isso.', en: 'Don’t say that.', demonstrates: ['nao_digas'] },
    ],
    reinforces: ['nao_digas', 'quando_quiseres'],
    helpers: {
      'É': 'is',
      'quiseres': 'you want',
      'Não': 'don’t',
      'digas': 'say',
      'isso': 'that',
      'Se': 'if',

    },
    transfer_prompt: { context: 'Someone tells you something surprising.', ask: 'Is it true?', answer: 'É verdade?' },
    rights_status: 'dub-authored',
    starter_tags: ['reflective', 'reaction'],
    next_root_hooks: ['outra_vez'],
  }),
  q({
    root_id: 'ma_accept',
    culture_family: 'marcus_aurelius',
    rung: 6,
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'Accept what you cannot change.',
    source: 'Accept what you cannot change.',
    target: 'Aceita o que não podes mudar.',
    semantic_bridge:
      'Two reusable engines in one short line: NÃO PODES, and MUDAR — which is the verb you need the moment a booking goes wrong.',
    subtext: 'Reflective on the surface, extremely practical underneath.',
    extracts: [
      { id: 'nao_podes', target: 'não podes', gloss: 'you can’t', shelf: 'doing', lemma: 'poder', form: 'you, negative' },
      { id: 'mudar', target: 'mudar', gloss: 'to change', shelf: 'doing' },
    ],
    branches: [
      { target: 'Posso mudar isto?', en: 'Can I change this?' },
      { target: 'Não posso mudar isso.', en: 'I can’t change that.' },
      { target: 'Quero mudar.', en: 'I want to change.' },
      { target: 'Não podes mudar isso.', en: 'You can’t change that.' },
    ],
    reinforces: ['podes'],
    helpers: {
      'podes': 'you can',
      'Posso': 'can I',
      'mudar': 'to change',
      'isto': 'this',
      'Não': 'not',
      'posso': 'I can',
      'isso': 'that',
      'Quero': 'I want',

    },
    voice_options: [
      {
        target: 'Não posso.', en: 'I can’t.', signal: 'direct',
        register: 'FINAL',
        when: 'It genuinely is not possible and you would rather not be asked twice.',
        risk: 'With no softener attached, expect the conversation to stop dead.',
      },
      {
        target: 'Acho que não posso.', en: 'I don’t think I can.', signal: 'softened',
        register: 'LEAVING THE DOOR OPEN',
        when: 'Probably no, but you would rather not be blunt about it. Very common in Portugal.',
      },
    ],
    voice_rule: 'That is acho que for the third time. You have now watched it soften a plan, an opinion and a refusal. It goes in front of almost any sentence you own.',
    transfer_prompt: { context: 'You need to alter a booking.', ask: 'Can I change this?', answer: 'Posso mudar isto?' },
    rights_status: 'dub-authored',
    starter_tags: ['reflective', 'practical'],
    next_root_hooks: ['agora'],
  }),
  // Rung 2. This crate opened at rung 4, so a beginner could never enter it.
  q({
    root_id: 'ma_ask_help',
    culture_family: 'marcus_aurelius',
    rung: 2,
    root_type: 'wisdom',
    source_label: 'Meditations, Book VII',
    source_status: 'public-domain-derived',
    root_display: 'Do not be ashamed to need help',
    source: 'Don\u2019t be ashamed to ask for help.',
    target: 'N\u00e3o tenhas vergonha de pedir ajuda.',
    semantic_bridge:
      'Marcus wrote this to a soldier who could not do everything alone, and it is the most useful sentence anybody learning a language has been handed. AJUDA is also one of the few words you can shout on its own and be completely understood.',
    subtext: 'Practical rather than noble. He meant it as an instruction, not a comfort.',
    extracts: [
      { id: 'ajuda', target: 'ajuda', gloss: 'help', shelf: 'things', gender: 'f', countable: false },
      { id: 'pedir', target: 'pedir', gloss: 'to ask for', shelf: 'doing', lemma: 'pedir' },
    ],
    branches: [
      { target: 'Preciso de ajuda.', en: 'I need help.' },
      { target: 'Podes ajudar-me?', en: 'Can you help me?', demonstrates: ['ajuda', 'podes'] },
      { target: 'Vou pedir ajuda.', en: 'I\u2019m going to ask for help.' },
    ],
    reinforces: ['preciso_de', 'podes', 'pedir_te'],
    helpers: {
      'N\u00e3o': 'not',
      'tenhas': 'you have',
      'vergonha': 'shame',
      'de': 'of / to',
      'ajudar-me': 'help me',
      'Vou': 'I\u2019m going to',
    },
    transfer_prompt: {
      context: 'You are lost and the map has stopped being any use.',
      ask: 'I need help.',
      answer: 'Preciso de ajuda.',
    },
    rights_status: 'dub-authored',
    starter_tags: ['first-day', 'asking'],
    next_root_hooks: ['onde'],
  }),
  // Rung 5. Book II opens by telling you who you are about to meet.
  q({
    root_id: 'ma_people',
    culture_family: 'marcus_aurelius',
    rung: 5,
    root_type: 'wisdom',
    source_label: 'Meditations, Book II',
    source_status: 'public-domain-derived',
    root_display: 'When you wake, remember who you are about to meet',
    source: 'People do what they know how to do.',
    target: 'As pessoas fazem o que sabem.',
    semantic_bridge:
      'He wrote it to stop himself being surprised by anybody. It also does the ladder a favour: AS PESSOAS is the first time you have talked about a group rather than a person, and FAZEM carries the same -M that told you ELES were involved.',
    subtext: 'Not forgiveness exactly. More an instruction to stop expecting otherwise.',
    extracts: [
      { id: 'as_pessoas', target: 'as pessoas', gloss: 'people', shelf: 'things', gender: 'f', note: 'Already plural. One of them is uma pessoa, and it stays feminine even about a man.' },
      { id: 'fazem', target: 'fazem', gloss: 'they do', shelf: 'doing', lemma: 'fazer', form: 'they' },
    ],
    branches: [
      { target: 'As pessoas s\u00e3o assim.', en: 'People are like that.' },
      { target: 'Eles fazem o mesmo.', en: 'They do the same.' },
      { target: 'As pessoas aqui s\u00e3o boas.', en: 'People here are good.' },
    ],
    reinforces: ['eles', 'mesmo', 'bom'],
    helpers: {
      's\u00e3o': 'they are',
      'assim': 'like that',
      'o': 'the',
      'que': 'what',
      'sabem': 'they know',
      'aqui': 'here',
      'boas': 'good',
    },
    transfer_prompt: {
      context: 'Somebody has let you down in exactly the way they always do.',
      ask: 'They do the same.',
      answer: 'Eles fazem o mesmo.',
    },
    rights_status: 'dub-authored',
    starter_tags: ['other-people', 'verb-endings'],
    next_root_hooks: ['eles'],
  }),
  // Rung 5. The \u201cwe\u201d ending, from the man who argued for cooperation.
  q({
    root_id: 'ma_together',
    culture_family: 'marcus_aurelius',
    rung: 5,
    root_type: 'wisdom',
    source_label: 'Meditations, Book II',
    source_status: 'public-domain-derived',
    root_display: 'We were born to work with one another',
    source: 'We are made for one another.',
    target: 'N\u00f3s somos feitos uns para os outros.',
    semantic_bridge:
      'He meant it as an argument against sulking. Portuguese barely needs the N\u00d3S at all, because SOMOS has already said who \u2014 and that -MOS ending is the \u201cwe\u201d on very nearly every verb in the language.',
    subtext: 'Less warm than it sounds. He is telling himself to get on with it.',
    extracts: [
      { id: 'nos_', target: 'n\u00f3s', gloss: 'we', shelf: 'people' },
      { id: 'somos', target: 'somos', gloss: 'we are', shelf: 'doing', lemma: 'ser', form: 'we' },
    ],
    branches: [
      { target: 'N\u00f3s somos amigos.', en: 'We\u2019re friends.' },
      { target: 'Somos dois.', en: 'There are two of us.' },
      { target: 'N\u00e3o somos iguais.', en: 'We\u2019re not the same.' },
    ],
    reinforces: ['as_pessoas', 'eles'],
    helpers: {
      'amigos': 'friends',
      'dois': 'two',
      'iguais': 'the same',
      'N\u00e3o': 'not',
      'feitos': 'made',
      'uns': 'ones',
      'para': 'for',
      'os': 'the',
      'outros': 'others',
    },
    transfer_prompt: {
      context: 'Introducing the person standing next to you.',
      ask: 'We\u2019re friends.',
      answer: 'Somos amigos.',
    },
    rights_status: 'dub-authored',
    starter_tags: ['other-people', 'verb-endings'],
    next_root_hooks: ['as_pessoas'],
  }),
]

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// B9 — How To Swear In Portuguese.
//
// This family is not a novelty. Swearing is where a language keeps its most
// irregular and most frequent grammar: the clitic pronouns live here, so does the
// subjunctive, so does gender agreement, so does the ser/estar split that
// textbooks spend a chapter failing to explain. A learner who can hear the
// difference between "o filme É uma merda" and "hoje ESTOU uma merda" has
// understood something most beginners never get told.
//
// The cultural root is the subtitle. You read the polite English; this is what
// was actually said.
// ---------------------------------------------------------------------------

export const SWEARING: Root[] = [
  q({
    root_id: 'sw_vai_a_merda',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Piss off. I have had enough.',
    source: 'Go away. I am fed up.',
    target: 'Vai à merda, estou farto.',
    literal_note: 'Literally “go to the shit”. Portuguese sends people to places.',
    semantic_bridge:
      'The whole insult is built from two ordinary bricks: VAI, the command “go”, and À, which is just “to the”. Swap the destination and the same frame becomes polite — vai para casa, vai com calma.',
    subtext: 'Final, not playful. This ends a conversation rather than seasoning one.',
    extracts: [
      { id: 'vai', target: 'Vai', gloss: 'go', shelf: 'doing', lemma: 'ir', form: 'you, an order', note: 'An order. Vai à merda is not a suggestion.' },
      { id: 'estou_farto', target: 'estou farto', gloss: 'I’m fed up', shelf: 'just_say' },
    ],
    branches: [
      { target: 'Vai para casa.', en: 'Go home.' },
      { target: 'Estou farto disto.', en: 'I’m fed up with this.' },
      { target: 'Vai com calma.', en: 'Take it easy.' },
    ],
    reinforces: ['calma'],
    helpers: {
      'para': 'to',
      'casa': 'home',
      'disto': 'with this',
      'com': 'with',
      'calma': 'calm',
    },
    transfer_prompt: { context: 'You have been in the same queue for forty minutes.', ask: 'I’m fed up.', answer: 'Estou farto.' },
    rights_status: 'dub-authored',
    freebie_flag: true,
    starter_tags: ['blunt', 'iconic'],
    next_root_hooks: ['sw_foda_se'],
  }),
  q({
    root_id: 'sw_foda_se',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Oh for God’s sake — I forgot.',
    source: 'The all-purpose explosion, followed by the reason for it.',
    target: 'Foda-se, esqueci-me.',
    literal_note: 'FODA-SE is a verb with a pronoun stuck on the back of it. So is ESQUECI-ME. Same machinery, very different reputations.',
    semantic_bridge:
      'The famous half is FODA-SE. The half you will use every day is ESQUECI-ME. They are built identically — verb, hyphen, little pronoun — and once you can see that hyphen you can take apart half of spoken Portuguese.',
    subtext: 'Frustration at the situation, not at a person. Nobody is being insulted here.',
    extracts: [
      { id: 'foda_se', target: 'Foda-se', gloss: 'for f***’s sake', shelf: 'just_say' },
      { id: 'esqueci_me', target: 'esqueci-me', gloss: 'I forgot', shelf: 'doing', lemma: 'esquecer-se', form: 'I, past' },
    ],
    branches: [
      { target: 'Esqueci-me do telemóvel.', en: 'I forgot my phone.' },
      { target: 'Desculpa, esqueci-me.', en: 'Sorry, I forgot.' },
      { target: 'Foda-se, outra vez!', en: 'For f***’s sake, again!' },
    ],
    reinforces: ['desculpa', 'outra_vez'],
    helpers: {
      'do': 'of the',
      'telemóvel': 'mobile phone',
      'Desculpa': 'sorry',
      'outra': 'another',
      'vez': 'time',
    },
    voice_options: [
      {
        target: 'Foda-se!', en: 'For f***’s sake!', signal: 'direct',
        register: 'THE REAL ONE',
        when: 'Among friends, at the football, alone in the car when something goes wrong.',
        risk: 'This is as strong as Portuguese gets. Not at work, not with anyone’s parents, not in a shop.',
      },
      {
        target: 'Fogo!', en: 'For crying out loud!', signal: 'softened',
        register: 'THE CLEAN TWIN',
        when: 'The identical moment, in front of absolutely anybody. Literally “fire”, and nobody blinks.',
        safest: true,
      },
    ],
    voice_rule:
      'Every language keeps a clean twin for its worst word. Fogo means “fire” and does the same job as foda-se, in the same slot, with none of the fallout. Learn both, and learn which room you are standing in.',
    transfer_prompt: { context: 'You reach the car. The keys are on the kitchen table.', ask: 'I forgot.', answer: 'Esqueci-me.' },
    rights_status: 'dub-authored',
    starter_tags: ['blunt', 'everyday'],
    next_root_hooks: ['sw_que_se_foda'],
  }),
  q({
    root_id: 'sw_que_se_foda',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Sod it. I’m going anyway.',
    source: 'Writing something off, and carrying on regardless.',
    target: 'Que se foda, vou na mesma.',
    literal_note: 'Notice the SE has moved. In “foda-se” it sits behind the verb; after QUE it jumps in front. That is a rule, not an accident.',
    semantic_bridge:
      'QUE SE FODA is a dismissal, and NA MESMA is the shrug that follows it — “all the same”, “anyway”. NA MESMA survives long after you stop wanting the first half.',
    subtext: 'Not anger. A decision, made out loud, that something no longer gets a vote.',
    extracts: [
      { id: 'que_se_foda', target: 'Que se foda', gloss: 'sod it', shelf: 'just_say' },
      { id: 'na_mesma', target: 'na mesma', gloss: 'anyway / all the same', shelf: 'small_words' },
    ],
    branches: [
      { target: 'Vou na mesma.', en: 'I’m going anyway.' },
      { target: 'Obrigado na mesma.', en: 'Thanks anyway.' },
      { target: 'Que se foda, vamos.', en: 'Sod it, let’s go.' },
    ],
    helpers: {
      'Vou': 'I’m going',
      'Obrigado': 'thank you',
      'vamos': 'let’s go',
    },
    transfer_prompt: { context: 'The bus never came, but someone has offered you a lift.', ask: 'Thanks anyway.', answer: 'Obrigado na mesma.' },
    rights_status: 'dub-authored',
    starter_tags: ['blunt', 'decision'],
    next_root_hooks: ['sw_caralho'],
  }),
  q({
    root_id: 'sw_caralho',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'What the hell is this?',
    source: 'Genuine confusion, expressed at volume.',
    target: 'Que caralho é isto?',
    literal_note: 'The same word, with DO in front of it, means the exact opposite. Isto é do caralho = this is brilliant.',
    semantic_bridge:
      'QUE ___ É ISTO? is a fixed frame with one swappable slot. Drop in caralho and you are furious; drop in raio and you are merely baffled. ISTO — “this” — is the piece you will use hourly.',
    subtext: 'Aimed at the object, not the person. Pointed at a person it becomes a challenge.',
    extracts: [
      { id: 'que_caralho', target: 'Que caralho', gloss: 'what the f***', shelf: 'just_say' },
      { id: 'isto', target: 'isto', gloss: 'this', rung: 1, shelf: 'people' },
    ],
    branches: [
      { target: 'O que é isto?', en: 'What is this?' },
      { target: 'Isto é do caralho!', en: 'This is bloody brilliant!' },
      { target: 'Que caralho estás a fazer?', en: 'What the f*** are you doing?' },
    ],
    helpers: {
      'O que': 'what',
      'é': 'is',
      'do caralho': 'bloody brilliant',
      'estás a': 'are you',
      'fazer': 'doing',
    },
    voice_options: [
      {
        target: 'Que caralho é isto?', en: 'What the f*** is this?', signal: 'direct',
        register: 'ANGRY AND UNFILTERED',
        when: 'You are genuinely annoyed, among people who swear back at you.',
        risk: 'Pointed at a stranger this is the opening of a fight, not a question.',
      },
      {
        target: 'Que raio é isto?', en: 'What on earth is this?', signal: 'softened',
        register: 'BAFFLED, NOT OBSCENE',
        when: 'The same confusion, the same frame, safe in front of anyone at all.',
        safest: true,
      },
    ],
    voice_rule:
      'Raio means “lightning bolt” and caralho means something a great deal worse, but they occupy the identical slot: Que ___ é isto? Portuguese builds outrage out of a fixed frame and one swappable word, so you only ever learn the frame once.',
    transfer_prompt: { context: 'A plate arrives that you are certain you did not order.', ask: 'What is this?', answer: 'O que é isto?' },
    rights_status: 'dub-authored',
    starter_tags: ['blunt', 'survival'],
    next_root_hooks: ['sw_merda'],
  }),
  q({
    root_id: 'sw_merda',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'I feel like crap today.',
    source: 'Today, specifically, you are not at your best.',
    target: 'Hoje estou uma merda.',
    literal_note: 'ESTOU, not É. É would mean you are permanently rubbish, which is a different and much sadder sentence.',
    semantic_bridge:
      'Portuguese has two words for “is”. ESTOU is how things happen to be right now; É is how things simply are. The same insult swings between them: hoje ESTOU uma merda is a bad day, o filme É uma merda is a review.',
    subtext: 'Ordinary, unremarkable complaining. This is closer to “rough” than to obscene.',
    extracts: [
      { id: 'uma_merda', target: 'uma merda', gloss: 'crap / rubbish', shelf: 'just_say' },
      { id: 'hoje', target: 'Hoje', gloss: 'today', shelf: 'when' },
    ],
    branches: [
      { target: 'Hoje não.', en: 'Not today.' },
      { target: 'O filme é uma merda.', en: 'The film is crap.' },
      { target: 'Isto é uma merda.', en: 'This is rubbish.' },
    ],
    reinforces: ['isto'],
    helpers: {
      'não': 'no / not',
      'O filme': 'the film',
      'é': 'is (permanently)',
      'Isto': 'this',
    },
    transfer_prompt: { context: 'Someone asks what you thought of the film.', ask: 'The film is crap.', answer: 'O filme é uma merda.' },
    rights_status: 'dub-authored',
    starter_tags: ['blunt', 'everyday'],
    next_root_hooks: ['sw_cabrao'],
  }),
  q({
    root_id: 'sw_cabrao',
    culture_family: 'portuguese_swearing',
    rung: 6,
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'You absolute bastard.',
    source: 'Said to a close friend, this is nearly affectionate. Said to anyone else, it is not.',
    target: 'És um grande cabrão.',
    literal_note: 'GRANDE means “big”, but in front of the noun it stops meaning size and starts meaning “utter”.',
    semantic_bridge:
      'Everything in this sentence agrees with who you are talking to. Um becomes uma, cabrão becomes cabra. The frame É S UM GRANDE ___ is the same one you use for compliments — és um grande amigo.',
    subtext: 'Register does all the work. Between friends it is warmth; anywhere else it is a genuine insult.',
    extracts: [
      { id: 'grande', target: 'grande', gloss: 'utter / total', shelf: 'describing', note: 'Goes in front of the word, not after it — um grande cabrão. Behind it, it just means big.' },
      { id: 'cabrao', target: 'cabrão', gloss: 'bastard', shelf: 'just_say', note: 'Genuinely strong. Between friends it can be affectionate; to a stranger it is not.' },
    ],
    branches: [
      { target: 'És uma grande cabra.', en: 'You’re an utter cow.' },
      { target: 'És um grande amigo.', en: 'You’re a great friend.' },
      { target: 'Que grande merda.', en: 'What an utter mess.' },
      { target: 'Que cabrão!', en: 'What a bastard!' },
    ],
    reinforces: ['uma_merda'],
    helpers: {
      'És': 'you are',
      'um': 'a (for a man)',
      'uma': 'a (for a woman)',
      'cabra': 'the female version of cabrão',
      'amigo': 'friend',
      'Que': 'what a',
      'merda': 'shit',
    },
    voice_options: [
      {
        target: 'És um grande cabrão.', en: 'You absolute bastard.', signal: 'direct',
        register: 'ONLY WITH PEOPLE WHO LAUGH',
        when: 'Between close friends, after something outrageous, this is almost a compliment.',
        risk: 'Misjudge the friendship and this one does not come back. There is no gentle version of it.',
      },
      {
        target: 'És um grande chato.', en: 'You’re a total pain.', signal: 'warm',
        register: 'EXASPERATED, NOT RUDE',
        when: 'Same structure, same affection, and you can say it to a colleague.',
        safest: true,
      },
    ],
    voice_rule:
      'Grande in front of the noun means “utter”, not “big”. És um grande amigo is a compliment; um amigo grande is a large man. One word, two positions, two completely different sentences.',
    transfer_prompt: { context: 'A friend has just gone badly out of their way for you.', ask: 'You’re a great friend.', answer: 'És um grande amigo.' },
    rights_status: 'dub-authored',
    starter_tags: ['blunt', 'social'],
    next_root_hooks: ['sw_foda_se'],
  }),
]

// ---------------------------------------------------------------------------
// B10/B11 — Flirting, in both directions.
//
// Two crates rather than one because the language genuinely differs. Every
// adjective agrees with the person being described, so "you look lovely" is a
// different sentence depending on who is receiving it, and a learner given only one
// half will get it wrong in the one conversation where being wrong is expensive.
//
// The grammar underneath is the best in the product. Flirting is where Portuguese
// keeps its politeness machinery: the imperfect standing in for the conditional
// (gostava, queria — the same tense you order coffee with), clitic pronouns moving
// around the verb, diminutives, and the ser/estar split at its sharpest. "És linda"
// is a verdict on a person. "Estás linda" is a remark about tonight. One is a
// declaration; the other is a compliment, and the difference is one letter.
// ---------------------------------------------------------------------------

export const FLIRTING_M2F: Root[] = [
  q({
    root_id: 'fl_m_estas_gira',
    culture_family: 'flirting_m2f',
    rung: 6,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'You look great tonight.',
    source: 'A remark about this evening, not a verdict on her existence.',
    target: 'Estás muito gira hoje.',
    literal_note: 'ESTÁS, not és. És linda is a statement about her whole life; estás linda is about tonight.',
    semantic_bridge:
      'ESTÁS is the version of “are” that means right now. It is the difference between a compliment and a pronouncement, and it is also how you ask anybody how they are.',
    subtext: 'Light, unweighted, easy to say and easy to receive. Nothing rides on it.',
    extracts: [
      { id: 'estas', target: 'Estás', gloss: 'you are', shelf: 'doing', lemma: 'estar', form: 'you' },
      { id: 'gira', target: 'gira', gloss: 'lovely', shelf: 'describing', lemma: 'giro', form: 'feminine' },
    ],
    branches: [
      { target: 'Estás linda.', en: 'You look beautiful.' },
      { target: 'Estás bem?', en: 'Are you all right?' },
      { target: 'Hoje estás gira.', en: 'You look lovely today.' },
    ],
    helpers: { 'linda': 'beautiful (about a woman)', 'bem': 'well', 'Hoje': 'today', 'muito': 'very' },
    voice_options: [
      {
        target: 'Estás gira.', en: 'You look great.', signal: 'casual',
        register: 'EVERYDAY, NO WEIGHT',
        when: 'Said in passing, to someone you already know a little. It costs nothing to say or to hear.',
      },
      {
        target: 'Estás linda.', en: 'You look beautiful.', signal: 'warm',
        register: 'A STEP UP',
        when: 'Said properly, with eye contact, once. Twice in an evening and it stops meaning anything.',
      },
    ],
    voice_rule:
      'Gira is “good-looking” the way a friend would say it. Linda is “beautiful” and lands heavier. Both take estás, not és — the moment you say és you have stopped commenting on the evening and started making a claim.',
    transfer_prompt: { context: 'She has clearly made an effort and you have about three seconds.', ask: 'You look beautiful.', answer: 'Estás linda.' },
    rights_status: 'dub-authored',
    freebie_flag: true,
    starter_tags: ['warm', 'opener'],
    next_root_hooks: ['fl_m_posso_oferecer'],
  }),
  q({
    root_id: 'fl_m_posso_oferecer',
    culture_family: 'flirting_m2f',
    rung: 2,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'Can I get you a drink?',
    source: 'The oldest opening line there is, in a language that softens it.',
    target: 'Posso oferecer-te uma bebida?',
    literal_note: 'OFERECER-TE — offer to you. The little TE hooks onto the end of the verb, exactly as it does in esqueci-me.',
    semantic_bridge:
      'POSSO is “may I”, and it is the single most useful word for arriving somewhere polite. The -TE on the end is who you are doing it for.',
    subtext: 'Confident but asking. The question mark is doing real work.',
    extracts: [
      { id: 'posso', target: 'Posso', gloss: 'may I / can I', shelf: 'doing', lemma: 'poder', form: 'I' },
      { id: 'oferecer_te', target: 'oferecer-te', gloss: 'get you / offer you', shelf: 'doing', lemma: 'oferecer', form: 'with you attached' },
    ],
    branches: [
      { target: 'Posso sentar-me?', en: 'May I sit down?' },
      { target: 'Posso ajudar-te?', en: 'Can I help you?' },
      { target: 'Posso oferecer-te um café?', en: 'Can I get you a coffee?' },
    ],
    reinforces: ['podes'],
    helpers: { 'sentar-me': 'sit down', 'ajudar-te': 'help you', 'um': 'a', 'café': 'coffee', 'bebida': 'drink', 'uma': 'a', 'aqui': 'here' },
    transfer_prompt: { context: 'The only free seat in the café is at her table.', ask: 'May I sit here?', answer: 'Posso sentar-me aqui?' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'opener'],
    next_root_hooks: ['fl_m_gostava'],
  }),
  q({
    root_id: 'fl_m_gostava',
    culture_family: 'flirting_m2f',
    rung: 2,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'I would like to see you again.',
    source: 'Said at the end of an evening you do not want to be the last one.',
    target: 'Gostava de te ver outra vez.',
    literal_note: 'GOSTAVA is a past tense being used about the future. Portuguese softens a want by putting it slightly out of reach.',
    semantic_bridge:
      'GOSTAVA DE is “I would like to”, and it is the politest three syllables in the language. It works on a person, a coffee, or a table by the window.',
    subtext: 'Open, unpressured, and completely clear about what is being asked.',
    extracts: [
      { id: 'gostava_de', target: 'Gostava de', gloss: 'I’d like to', shelf: 'doing', lemma: 'gostar', form: 'I, softened' },
      { id: 'ver_te', target: 'te ver', gloss: 'see you', shelf: 'doing', lemma: 'ver', form: 'with you attached' },
    ],
    branches: [
      { target: 'Gostava de te conhecer melhor.', en: 'I’d like to get to know you better.' },
      { target: 'Gostava de um café.', en: 'I’d like a coffee.' },
      { target: 'Gostava de te ver amanhã.', en: 'I’d like to see you tomorrow.' },
    ],
    reinforces: ['outra_vez', 'amanha'],
    helpers: { 'conhecer': 'to get to know', 'melhor': 'better', 'um': 'a', 'café': 'coffee', 'amanhã': 'tomorrow', 'por': 'for', 'favor': 'favour', 'por favor': 'please' },
    voice_options: [
      {
        target: 'Gostava de te ver outra vez.', en: 'I’d like to see you again.', signal: 'warm',
        register: 'SAYING IT PLAINLY',
        when: 'You mean it and you would rather not spend a week pretending otherwise.',
      },
      {
        target: 'Dás-me o teu número?', en: 'Will you give me your number?', signal: 'direct',
        register: 'SKIPPING THE SPEECH',
        when: 'It is going well, the taxi is outside, and there is no time for a sentence.',
        safest: true,
      },
    ],
    voice_rule:
      'Gostava de puts the want one polite step away from you; dás-me asks for something outright. Portuguese lets you do either, but it notices which one you chose.',
    transfer_prompt: { context: 'You are at the counter, and the same tense turns out to work on coffee.', ask: 'I’d like a coffee, please.', answer: 'Gostava de um café, por favor.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'closing'],
    next_root_hooks: ['fl_m_vim_aqui'],
  }),
  q({
    root_id: 'fl_m_vim_aqui',
    culture_family: 'flirting_m2f',
    rung: 2,
    root_type: 'paraphrased_moment',
    source_label: 'Love Actually — the one who learns Portuguese',
    source_status: 'paraphrased',
    root_display: 'I came here to ask you something.',
    source: 'The whole point of learning the language in the first place.',
    target: 'Vim aqui para te pedir uma coisa.',
    literal_note: 'PARA + a verb is “in order to”. And notice the TE has moved in front of pedir — after para, it goes first.',
    semantic_bridge:
      'VIM AQUI PARA is how you explain why you are standing somewhere. The film made it a proposal; the sentence itself is just a reason.',
    subtext: 'Earnest, slightly exposed, and entirely deliberate. This one is meant to cost something.',
    extracts: [
      { id: 'vim_aqui', target: 'Vim aqui', gloss: 'I came here', shelf: 'doing', lemma: 'vir', form: 'I, past' },
      { id: 'pedir_te', target: 'te pedir', gloss: 'to ask you', shelf: 'doing', lemma: 'pedir', form: 'with you attached' },
    ],
    branches: [
      { target: 'Vim aqui para te ver.', en: 'I came here to see you.' },
      { target: 'Posso pedir-te uma coisa?', en: 'Can I ask you something?', demonstrates: ['pedir_te', 'posso'] },
      { target: 'Vim para ficar.', en: 'I came to stay.', demonstrates: ['vim_aqui'] },
      { target: 'Vim para te pedir ajuda.', en: 'I came to ask you for help.' },
    ],
    reinforces: ['posso'],
    helpers: { 'para': 'in order to', 'uma': 'a', 'coisa': 'thing', 'ficar': 'to stay', 'ver': 'to see', 'ajuda': 'help', 'pedir-te': 'ask you for' },
    transfer_prompt: { context: 'You have travelled a long way and she has no idea why.', ask: 'I came here to see you.', answer: 'Vim aqui para te ver.' },
    rights_status: 'title-reference',
    starter_tags: ['warm', 'iconic'],
    next_root_hooks: ['fl_m_nervoso'],
  }),
  q({
    root_id: 'fl_m_nervoso',
    culture_family: 'flirting_m2f',
    rung: 6,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'I’m nervous. I’m not good at this.',
    source: 'Admitting it, which works considerably better than not admitting it.',
    target: 'Estou nervoso, não sou bom nisto.',
    literal_note: 'NERVOSO with an O because a man is saying it. A woman says nervosa, and the sentence is otherwise identical.',
    semantic_bridge:
      'Both halves are ordinary sentences you will reuse constantly: how you feel right now, and what you are not good at. Neither is about romance.',
    subtext: 'Disarming rather than weak. Said lightly it is the most effective line here.',
    extracts: [
      { id: 'estou_nervoso', target: 'Estou nervoso', gloss: 'I’m nervous', shelf: 'just_say', note: 'A man saying it. A woman says estou nervosa.' },
      { id: 'nao_sou_bom', target: 'não sou bom', gloss: 'I’m not good', shelf: 'just_say', note: 'A woman says não sou boa.' },
    ],
    branches: [
      { target: 'Não sou bom a dançar.', en: 'I’m not a good dancer.' },
      { target: 'Estou nervoso, desculpa.', en: 'I’m nervous, sorry.' },
      { target: 'Não sou bom nisto, mas estou a tentar.', en: 'I’m not good at this, but I’m trying.' },
    ],
    reinforces: ['desculpa'],
    helpers: { 'a': 'at', 'dançar': 'dancing', 'nisto': 'at this', 'mas': 'but', 'estou': 'I am', 'tentar': 'trying' },
    transfer_prompt: { context: 'You have said something clumsy and she noticed.', ask: 'I’m nervous, sorry.', answer: 'Estou nervoso, desculpa.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'honest'],
    next_root_hooks: ['fl_m_numero'],
  }),
  q({
    root_id: 'fl_m_numero',
    culture_family: 'flirting_m2f',
    rung: 2,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'Will you give me your number?',
    source: 'The only question that matters at the end.',
    target: 'Dás-me o teu número?',
    literal_note: 'O TEU because número is a masculine word. Ask for her morada and it becomes A TUA.',
    semantic_bridge:
      'DÁS-ME is “will you give me”, with the ME hooked on the back. O TEU is “your”, and it changes shape to match whatever you are asking for.',
    subtext: 'Direct and unembarrassed. Hesitating here reads worse than asking.',
    extracts: [
      { id: 'das_me', target: 'Dás-me', gloss: 'will you give me', shelf: 'doing', lemma: 'dar', form: 'you' },
      { id: 'o_teu', target: 'o teu', gloss: 'your', shelf: 'people' },
    ],
    branches: [
      { target: 'Dás-me o teu Instagram?', en: 'Will you give me your Instagram?' },
      { target: 'Dás-me um minuto?', en: 'Will you give me a minute?' },
      { target: 'Este é o meu número.', en: 'This is my number.', demonstrates: ['o_teu'] },
    ],
    helpers: { 'um': 'a', 'minuto': 'minute', 'Este': 'this', 'é': 'is', 'meu': 'my', 'o': 'the', 'número': 'number', 'email': 'email' },
    transfer_prompt: { context: 'She would rather not hand over a phone number yet.', ask: 'Will you give me your email?', answer: 'Dás-me o teu email?' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'closing'],
    next_root_hooks: ['fl_m_estas_gira'],
  }),
]

export const FLIRTING_F2M: Root[] = [
  q({
    root_id: 'fl_f_estas_giro',
    culture_family: 'flirting_f2m',
    rung: 6,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'You look good tonight.',
    source: 'A remark about this evening, not a verdict on his existence.',
    target: 'Estás muito giro hoje.',
    literal_note: 'GIRO with an O because you are describing a man. The sentence is otherwise word for word the same.',
    semantic_bridge:
      'ESTÁS is “are” in the sense of right now. Say és instead and you have promoted a passing compliment into a permanent one.',
    subtext: 'Light and unweighted. Delivered in passing it does far more than delivered solemnly.',
    extracts: [
      { id: 'giro', target: 'giro', gloss: 'good-looking', shelf: 'describing', lemma: 'giro', form: 'masculine' },
      { id: 'hoje_estas', target: 'Estás', gloss: 'you are', shelf: 'doing', lemma: 'estar', form: 'you' },
    ],
    branches: [
      { target: 'Estás lindo.', en: 'You look wonderful.' },
      { target: 'Estás bem?', en: 'Are you all right?' },
      { target: 'Hoje estás giro.', en: 'You look good today.' },
    ],
    helpers: { 'lindo': 'wonderful (about a man)', 'bem': 'well', 'Hoje': 'today', 'muito': 'very' },
    voice_options: [
      {
        target: 'Estás giro.', en: 'You look good.', signal: 'casual',
        register: 'THROWN AWAY',
        when: 'Said over your shoulder, once, and then changing the subject. This is the effective version.',
      },
      {
        target: 'Estás lindo.', en: 'You look wonderful.', signal: 'warm',
        register: 'MEANT PROPERLY',
        when: 'Held eye contact, said slowly. Rare enough that it registers.',
      },
    ],
    voice_rule:
      'Giro is the everyday word and lindo is the one that stops a conversation. Both take estás — és lindo is a claim about him rather than a remark about tonight, and it is a much larger sentence than people realise.',
    transfer_prompt: { context: 'He has clearly made an effort, which he does not usually.', ask: 'You look wonderful.', answer: 'Estás lindo.' },
    rights_status: 'dub-authored',
    freebie_flag: true,
    starter_tags: ['warm', 'opener'],
    next_root_hooks: ['fl_f_apetece_te'],
  }),
  q({
    root_id: 'fl_f_apetece_te',
    culture_family: 'flirting_f2m',
    rung: 2,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'Do you fancy going for a drink?',
    source: 'An invitation with no weight on it, which is why it works.',
    target: 'Apetece-te ir beber qualquer coisa?',
    literal_note: 'Literally “does it appeal to you”. Portuguese asks the desire, not the person — so nobody has to be the one who wanted it.',
    semantic_bridge:
      'APETECE-TE is the most Portuguese way to invite anyone anywhere. QUALQUER COISA is “anything”, and it keeps the invitation deliberately vague.',
    subtext: 'Casual on purpose. The grammar itself removes the pressure.',
    extracts: [
      { id: 'apetece_te', target: 'Apetece-te', gloss: 'do you fancy', shelf: 'doing', lemma: 'apetecer', form: 'to you' },
      { id: 'qualquer_coisa', target: 'qualquer coisa', gloss: 'something / anything', shelf: 'small_words' },
    ],
    branches: [
      { target: 'Apetece-te um café?', en: 'Do you fancy a coffee?' },
      { target: 'Apetece-te dançar?', en: 'Do you fancy dancing?' },
      { target: 'Queres beber qualquer coisa?', en: 'Do you want a drink?' },
    ],
    helpers: { 'um': 'a', 'café': 'coffee', 'dançar': 'to dance', 'Queres': 'do you want', 'beber': 'to drink', 'ir': 'to go' },
    voice_options: [
      {
        target: 'Apetece-te ir beber qualquer coisa?', en: 'Do you fancy going for a drink?', signal: 'softened',
        register: 'NO PRESSURE ON ANYONE',
        when: 'You would like to, and you would like him to be able to say no without it costing anything.',
        safest: true,
      },
      {
        target: 'Vamos beber qualquer coisa?', en: 'Shall we go for a drink?', signal: 'direct',
        register: 'ALREADY DECIDED',
        when: 'Said standing up, with your coat already on. Assumes the answer.',
      },
    ],
    voice_rule:
      'Apetece-te asks whether the idea appeals; vamos assumes it does. Portuguese has a whole politeness system built on asking about the desire instead of the person, and this is the everyday example of it.',
    transfer_prompt: { context: 'He has been talking to you for an hour and neither of you has moved.', ask: 'Do you fancy a coffee?', answer: 'Apetece-te um café?' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'opener'],
    next_root_hooks: ['fl_f_queria'],
  }),
  q({
    root_id: 'fl_f_queria',
    culture_family: 'flirting_f2m',
    rung: 2,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'I’d like to get to know you better.',
    source: 'Interest, stated once, without a speech attached.',
    target: 'Queria conhecer-te melhor.',
    literal_note: 'QUERIA is a past tense doing a present job. Queria um café is how you order coffee — the same softening, in a café.',
    semantic_bridge:
      'QUERIA is “I would like”. It is the difference between quero — I want — and something a person can comfortably hear. You will use it every day, mostly about food.',
    subtext: 'Warm and unhurried. Said once and then left alone.',
    extracts: [
      { id: 'queria', target: 'Queria', gloss: 'I’d like', shelf: 'doing', lemma: 'querer', form: 'I, softened', note: 'Quero is I want. Queria is I would like, and it is a past tense doing politeness — which is exactly why you order with it. Queria um café lands softly; quero um café does not.' },
      { id: 'conhecer_te', target: 'conhecer-te', gloss: 'to get to know you', shelf: 'doing', lemma: 'conhecer', form: 'with you attached' },
    ],
    branches: [
      { target: 'Queria ver-te outra vez.', en: 'I’d like to see you again.' },
      { target: 'Queria um café, por favor.', en: 'I’d like a coffee, please.' },
      { target: 'Queria conhecer-te melhor.', en: 'I’d like to get to know you better.' },
    ],
    reinforces: ['outra_vez'],
    helpers: { 'ver-te': 'to see you', 'um': 'a', 'café': 'coffee', 'por': 'for', 'favor': 'favour', 'melhor': 'better', 'outra': 'another', 'vez': 'time' },
    transfer_prompt: { context: 'You are ordering, and the same tense turns out to work off the dance floor too.', ask: 'I’d like a coffee, please.', answer: 'Queria um café, por favor.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'everyday'],
    next_root_hooks: ['fl_f_engracado'],
  }),
  q({
    root_id: 'fl_f_engracado',
    culture_family: 'flirting_f2m',
    rung: 6,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'You’re really funny.',
    source: 'The most effective sentence in this entire crate.',
    target: 'És muito engraçado.',
    literal_note: 'ÉS this time, not estás. Funny is not something he is being tonight; it is something he is.',
    semantic_bridge:
      'ÉS is the permanent “are”. It is exactly the verb you avoided for estás lindo, and here it is the right one — which is what makes the pair worth having.',
    subtext: 'Sincere, and worth spending. Said about a joke that was not funny it does the opposite.',
    extracts: [
      { id: 'es', target: 'És', gloss: 'you are', shelf: 'doing', lemma: 'ser', form: 'you', note: 'The permanent one. És engraçado is about him; estás is about tonight.' },
      { id: 'engracado', target: 'engraçado', gloss: 'funny', shelf: 'describing', note: 'A woman is engraçada.' },
    ],
    branches: [
      { target: 'És muito simpático.', en: 'You’re really nice.' },
      { target: 'Não és nada engraçado.', en: 'You’re not funny at all.' },
      { target: 'És giro quando ris.', en: 'You’re cute when you laugh.' },
    ],
    helpers: { 'muito': 'really', 'simpático': 'nice', 'Não': 'not', 'nada': 'at all', 'quando': 'when', 'ris': 'you laugh', 'É': 'he is', 'giro': 'cute' },
    voice_options: [
      {
        target: 'És muito engraçado.', en: 'You’re really funny.', signal: 'warm',
        register: 'MEANT',
        when: 'He has made you laugh three times and should be told.',
        safest: true,
      },
      {
        target: 'Não és nada engraçado.', en: 'You’re not funny at all.', signal: 'dry',
        register: 'THE TEASE',
        when: 'Said smiling, immediately after laughing. Everyone understands it as the opposite.',
        risk: 'Said flat, or to someone who does not know you yet, it is simply an insult.',
      },
    ],
    voice_rule:
      'Portuguese is comfortable with saying the opposite of what you mean, but it leans entirely on your face to carry it. Não és nada engraçado works only while you are still laughing.',
    transfer_prompt: { context: 'A friend asks what you make of him.', ask: 'He’s really funny.', answer: 'É muito engraçado.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'social'],
    next_root_hooks: ['fl_f_beijinho'],
  }),
  q({
    root_id: 'fl_f_beijinho',
    culture_family: 'flirting_f2m',
    rung: 2,
    root_type: 'other',
    source_label: 'Every hello and goodbye in Portugal',
    source_status: 'paraphrased',
    root_display: 'Give me a little kiss.',
    source: 'And also, unremarkably, how the entire country says hello.',
    target: 'Dá-me um beijinho.',
    literal_note: 'BEIJO is a kiss. BEIJINHO is a small one — and in Portugal the small one is the greeting, given twice, to almost everybody.',
    semantic_bridge:
      'The -INHO ending makes a word smaller, and in doing so makes it friendlier. A cafezinho is not a small coffee; it is a coffee offered warmly.',
    subtext: 'Playful rather than forward. The diminutive is what takes the weight out of it.',
    extracts: [
      { id: 'beijinho', target: 'beijinho', gloss: 'a little kiss', shelf: 'things', gender: 'm', note: 'How Portugal says hello — two of them, one on each cheek. And the -inho ending is not really about size: beijo becomes beijinho, café becomes cafezinho, and what it adds is warmth. Portugal runs on it.' },
      { id: 'da_me', target: 'Dá-me', gloss: 'give me', shelf: 'doing', lemma: 'dar', form: 'you, an order' },
    ],
    branches: [
      { target: 'Dois beijinhos.', en: 'Two little kisses.' },
      { target: 'Dá-me um minuto.', en: 'Give me a minute.' },
      { target: 'Apetece-te um cafezinho?', en: 'Fancy a little coffee?', demonstrates: ['beijinho'] },
    ],
    reinforces: ['apetece_te'],
    helpers: { 'Dois': 'two', 'beijinhos': 'little kisses', 'um': 'a', 'minuto': 'minute', 'cafezinho': 'a friendly little coffee' },
    transfer_prompt: { context: 'You are saying goodbye to someone you have just met, Portuguese style.', ask: 'Two little kisses.', answer: 'Dois beijinhos.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'cultural'],
    next_root_hooks: ['fl_f_ligas_me'],
  }),
  q({
    root_id: 'fl_f_ligas_me',
    culture_family: 'flirting_f2m',
    rung: 4,
    root_type: 'other',
    source_label: 'Anywhere in Portugal, most evenings',
    source_status: 'paraphrased',
    root_display: 'Will you call me later?',
    source: 'Handing the next move over, deliberately.',
    target: 'Ligas-me logo?',
    literal_note: 'LIGAS-ME is you calling me. LIGO-TE is me calling you. Same verb, two endings, opposite directions.',
    semantic_bridge:
      'The ending of the verb says who is doing it and the pronoun on the back says who it lands on. Change both and the whole sentence turns around.',
    subtext: 'Confident. Asking him to call is a decision, not a hope.',
    extracts: [
      { id: 'ligas_me', target: 'Ligas-me', gloss: 'will you call me', shelf: 'doing', lemma: 'ligar', form: 'you' },
      { id: 'logo', target: 'logo', gloss: 'later on / in a bit', shelf: 'when' },
    ],
    branches: [
      { target: 'Ligo-te logo.', en: 'I’ll call you later.' },
      { target: 'Até logo.', en: 'See you later.' },
      { target: 'Ligas-me amanhã?', en: 'Will you call me tomorrow?' },
    ],
    reinforces: ['amanha'],
    helpers: { 'Ligo-te': 'I’ll call you', 'Até': 'until / see you', 'amanhã': 'tomorrow', 'logo': 'later' },
    transfer_prompt: { context: 'You said you would be in touch, and you meant it.', ask: 'I’ll call you tomorrow.', answer: 'Ligo-te amanhã.' },
    rights_status: 'dub-authored',
    starter_tags: ['warm', 'closing'],
    next_root_hooks: ['fl_f_estas_giro'],
  }),
]

// ---------------------------------------------------------------------------
// B12 — Duran Duran, Lisboa. A DROP, not a crate: pegged to the Altice Arena
// date and gone the morning after it.
//
// Held to exactly the standard a permanent crate is held to. An expiry date is
// not a licence for thin content — it is the reason the content has to be right
// first time, because there is no second pass at a drop.
//
// Two of these titles are deliberately built out of pieces the learner may
// already own (PRECISO DE from Top Gun, AMANHÃ from Bond). A drop is the best
// possible place to show compounding, because the learner arrived for the gig
// and leaves having been shown that they already knew half of it.
// ---------------------------------------------------------------------------

export const DURAN_DURAN: Root[] = [
  q({
    root_id: 'dd_wolf',
    culture_family: 'duran_duran_lisboa',
    rung: 1,
    root_type: 'title',
    source_label: 'Hungry Like the Wolf',
    source_status: 'verified',
    root_display: 'Hungry Like the Wolf',
    source: 'Hungry like the wolf.',
    target: 'Tenho uma fome de lobo.',
    literal_note: 'Literally “I have a hunger of wolf”.',
    semantic_bridge:
      'English IS hungry. Portuguese HAS hunger. And “uma fome de lobo” is a real expression in Portugal, not a translation of the song — which is why this title survives the crossing when most do not. That one swap, ter where English uses to be, carries fome, sede, frio, calor and razão with it.',
    subtext: 'Physical and unfussy. It is also the first thing you will say in a restaurant.',
    extracts: [
      { id: 'tenho', target: 'tenho', gloss: 'I have', shelf: 'doing', lemma: 'ter', form: 'I', note: 'Portuguese HAS hunger, thirst and cold where English is them. Tenho fome, tenho sede, tenho frio — and tenho trinta anos for your age. One verb, and five things you can suddenly say.' },
      { id: 'fome', target: 'fome', gloss: 'hunger', shelf: 'things', gender: 'f', countable: false },
    ],
    branches: [
      { target: 'Tenho fome.', en: 'I’m hungry.' },
      { target: 'Não tenho fome.', en: 'I’m not hungry.' },
      { target: 'Tenho sede.', en: 'I’m thirsty.' },
    ],
    helpers: {
      'sede': 'thirst',
      'Não': 'not',
      'uma': 'a',
      'de': 'of',
      'lobo': 'wolf',
    },
    voice_options: [
      {
        target: 'Tenho fome.', en: 'I’m hungry.', signal: 'direct',
        register: 'DECIDING WHERE TO EAT',
        when: 'Said to whoever is holding the menu. This is information, and nobody will find it dramatic.',
        safest: true,
      },
      {
        target: 'Estou cheio de fome.', en: 'I’m starving.', signal: 'casual',
        register: 'AMONG FRIENDS',
        when: 'Louder, funnier, and used constantly between people who know each other well.',
        risk: 'Cheio agrees with you, not with the hunger — a woman says cheia.',
      },
    ],
    voice_rule:
      'Because Portuguese has hunger rather than being hungry, everything that intensifies it attaches to the person: cheio de fome, morto de fome. That is why it has to agree with whoever is speaking.',
    transfer_prompt: {
      context: 'You have sat down and the waiter is already at the table.',
      ask: 'I’m hungry.',
      answer: 'Tenho fome.',
    },
    rights_status: 'title-reference',
    starter_tags: ['first-day', 'ordering'],
    next_root_hooks: ['tudo'],
  }),
  q({
    root_id: 'dd_monday',
    culture_family: 'duran_duran_lisboa',
    rung: 4,
    root_type: 'title',
    source_label: 'New Moon on Monday',
    source_status: 'verified',
    root_display: 'New Moon on Monday',
    source: 'New moon on Monday.',
    target: 'Lua nova na segunda-feira.',
    semantic_bridge:
      'Portugal does not name its weekdays after gods or planets — it counts them. Monday is segunda-feira, the second one. Get this single word and terça, quarta, quinta and sexta arrive free, because you are only counting.',
    subtext: 'Flat, practical admin language — the stuff that decides whether you can make a plan.',
    extracts: [
      { id: 'segunda_feira', target: 'segunda-feira', gloss: 'Monday', shelf: 'when', note: 'The second one. Portugal counts its weekdays rather than naming them.' },
      { id: 'nova', target: 'nova', gloss: 'new', rung: 1, shelf: 'describing', lemma: 'novo', form: 'feminine' },
    ],
    branches: [
      { target: 'Até segunda-feira.', en: 'See you Monday.' },
      { target: 'Na segunda-feira não posso.', en: 'I can’t on Monday.' },
      { target: 'Uma vida nova.', en: 'A new life.' },
    ],
    reinforces: ['amanha', 'vida', 'podes'],
    helpers: {
      'Até': 'until / see you',
      'Na': 'on the',
      'não': 'not',
      'posso': 'I can',
      'Lua': 'moon',
      'Uma': 'a',
    },
    transfer_prompt: {
      context: 'You are leaving and you will next see them at the start of the week.',
      ask: 'See you Monday.',
      answer: 'Até segunda-feira.',
    },
    rights_status: 'title-reference',
    starter_tags: ['time', 'plans'],
    next_root_hooks: ['amanha'],
  }),
  q({
    root_id: 'dd_know',
    culture_family: 'duran_duran_lisboa',
    rung: 3,
    root_type: 'title',
    source_label: 'Is There Something I Should Know?',
    source_status: 'verified',
    root_display: 'Is There Something I Should Know?',
    source: 'Is there something I should know?',
    target: 'Há alguma coisa que eu deva saber?',
    semantic_bridge:
      'English keeps changing shape — there is, there are, there was. Portuguese has HÁ, and it does not care how many of the thing there are. It is one syllable, it never agrees with anything, and it is also how Portuguese says “ago”.',
    subtext: 'The question you ask when you can feel something is being left out.',
    extracts: [
      { id: 'ha', target: 'há', gloss: 'there is / there are', shelf: 'doing', lemma: 'haver', form: 'there is', note: 'Never changes for plural. Há uma, há dois — same word.' },
      { id: 'alguma_coisa', target: 'alguma coisa', gloss: 'something', shelf: 'small_words' },
    ],
    branches: [
      { target: 'Há um problema.', en: 'There’s a problem.' },
      { target: 'Não há problema.', en: 'No problem.' },
      { target: 'Há alguma coisa boa?', en: 'Is there anything good?' },
    ],
    reinforces: ['bom', 'qualquer_coisa'],
    helpers: {
      'um': 'a',
      'problema': 'problem',
      'Não': 'not',
      'que': 'that',
      'eu': 'I',
      'deva': 'should',
      'saber': 'know',
      'boa': 'good',
    },
    voice_options: [
      {
        target: 'Não há problema.', en: 'No problem.', signal: 'casual',
        register: 'WAVING IT AWAY',
        when: 'The everyday answer to an apology, a delay, or someone squeezing past you.',
        safest: true,
      },
      {
        target: 'Não faz mal.', en: 'It doesn’t matter.', signal: 'warm',
        register: 'REASSURING SOMEONE',
        when: 'Softer, and aimed at the person rather than the problem — use it when they feel bad.',
      },
    ],
    voice_rule:
      'One answers the problem, the other answers the person. Portuguese lets you choose which of the two you are letting off the hook.',
    transfer_prompt: {
      context: 'Someone has just apologised for standing on your foot.',
      ask: 'No problem.',
      answer: 'Não há problema.',
    },
    rights_status: 'title-reference',
    starter_tags: ['questions', 'smoothing-things-over'],
    next_root_hooks: ['qualquer_coisa'],
  }),
  q({
    root_id: 'dd_prayer',
    culture_family: 'duran_duran_lisboa',
    rung: 2,
    root_type: 'title',
    source_label: 'Save a Prayer',
    source_status: 'verified',
    root_display: 'Save a Prayer (…till the morning after)',
    source: 'Save a prayer for the morning after.',
    target: 'Guarda uma oração para a manhã seguinte.',
    semantic_bridge:
      'Here is the good bit. If you have met AMANHÃ already, you have been carrying this word around without knowing: amanhã is a + manhã, “to the morning”. The song has just pulled your own vocabulary apart in front of you.',
    subtext: 'The one that quietly proves the whole compounding idea, using a word you already had.',
    extracts: [
      { id: 'guarda', target: 'guarda', gloss: 'keep / save', shelf: 'doing', lemma: 'guardar', form: 'you, an order' },
      { id: 'manha', target: 'manhã', gloss: 'morning', shelf: 'things', gender: 'f' },
    ],
    branches: [
      { target: 'Guarda isto.', en: 'Keep this.' },
      { target: 'Guarda-me um lugar.', en: 'Save me a seat.' },
      { target: 'De manhã.', en: 'In the morning.' },
    ],
    reinforces: ['amanha', 'isto'],
    helpers: {
      'Guarda-me': 'keep for me',
      'um': 'a',
      'lugar': 'seat / place',
      'De': 'in / of',
      'uma': 'a',
      'oração': 'prayer',
      'para': 'for',
      'a': 'the',
      'seguinte': 'next / following',
    },
    transfer_prompt: {
      context: 'The place is filling up and you are still at the bar.',
      ask: 'Save me a seat.',
      answer: 'Guarda-me um lugar.',
    },
    rights_status: 'title-reference',
    starter_tags: ['time', 'asking-a-favour'],
    next_root_hooks: ['amanha'],
  }),
  q({
    root_id: 'dd_now',
    culture_family: 'duran_duran_lisboa',
    rung: 2,
    root_type: 'title',
    source_label: 'All You Need Is Now',
    source_status: 'verified',
    root_display: 'All You Need Is Now',
    source: 'All you need is now.',
    target: 'Tudo o que precisas é agora.',
    semantic_bridge:
      'Two thirds of this title may already be yours. PRECISO DE came out of Top Gun and AGORA out of Marcus Aurelius — all that has changed is the ending on the verb, which moves the need from you to them: preciso, precisas.',
    subtext: 'Reads like a slogan, works like a lever: it is the “you” form of a verb you already use.',
    extracts: [
      { id: 'tudo', target: 'tudo', gloss: 'everything / all', shelf: 'how_much' },
      { id: 'precisas', target: 'precisas', gloss: 'you need', shelf: 'doing', lemma: 'precisar', form: 'you' },
    ],
    branches: [
      { target: 'Tudo bem?', en: 'All good?' },
      { target: 'Precisas de ajuda?', en: 'Do you need help?' },
      { target: 'É tudo.', en: 'That’s everything.' },
    ],
    reinforces: ['preciso_de', 'agora'],
    helpers: {
      'bem': 'well',
      'de': 'of',
      'ajuda': 'help',
      'É': 'is',
      'o': 'the',
      'que': 'that',
    },
    voice_options: [
      {
        target: 'Tudo bem?', en: 'All good?', signal: 'casual',
        register: 'HELLO, MOSTLY',
        when: 'Half greeting, half question. You will hear it forty times a day and it rarely wants a real answer.',
        safest: true,
      },
      {
        target: 'Está tudo bem?', en: 'Is everything all right?', signal: 'warm',
        register: 'YOU LOOK ROUGH',
        when: 'The same words with está in front, and now it is a genuine question about how they are.',
        risk: 'Ask this one casually and people will think something has happened.',
      },
    ],
    voice_rule:
      'Adding está turns a greeting into an enquiry. Portuguese does this a lot — the words stay, one small verb decides whether you actually want to know.',
    transfer_prompt: {
      context: 'Your friend has gone quiet and you want to check without making a scene.',
      ask: 'Do you need anything?',
      answer: 'Precisas de alguma coisa?',
    },
    rights_status: 'title-reference',
    starter_tags: ['everyday', 'checking-in'],
    next_root_hooks: ['agora'],
  }),
  q({
    root_id: 'dd_ordinary',
    culture_family: 'duran_duran_lisboa',
    rung: 1,
    root_type: 'title',
    source_label: 'Ordinary World',
    source_status: 'verified',
    root_display: 'Ordinary World',
    source: 'Ordinary world.',
    target: 'Um mundo normal.',
    semantic_bridge:
      'English stacks the description in front: ordinary world. Portuguese puts it behind, almost always — mundo normal, vida nova, café pequeno. Two words in a song title, and the default word order of the whole language is sitting in them.',
    subtext: 'Plain, slightly melancholy, and structurally the most useful thing in the drop.',
    extracts: [
      { id: 'mundo', target: 'mundo', gloss: 'world', shelf: 'things', gender: 'm' },
      { id: 'normal', target: 'normal', gloss: 'normal / ordinary', shelf: 'describing' },
    ],
    branches: [
      { target: 'Uma vida normal.', en: 'A normal life.' },
      { target: 'Não é normal.', en: 'That’s not normal.' },
      { target: 'O mundo é assim.', en: 'That’s the world for you.' },
    ],
    reinforces: ['vida', 'nova'],
    helpers: {
      'Uma': 'a',
      'Um': 'a',
      'Não': 'not',
      'é': 'is',
      'O': 'the',
      'assim': 'like that',
    },
    transfer_prompt: {
      context: 'Something has happened that absolutely should not have happened.',
      ask: 'That’s not normal.',
      answer: 'Não é normal.',
    },
    rights_status: 'title-reference',
    starter_tags: ['describing', 'word-order'],
    next_root_hooks: ['vida'],
  }),
]

export const ROOTS: Root[] = [
  ...TOP_GUN,
  ...JAMES_BOND,
  ...BRIDGET_JONES,
  ...PULP_FICTION,
  ...AUDREY_HEPBURN,
  ...MARCUS_AURELIUS,
  ...SWEARING,
  ...FLIRTING_M2F,
  ...FLIRTING_F2M,
  ...DURAN_DURAN,
]

export const ROOTS_BY_FAMILY: Record<CultureFamily, Root[]> = {
  top_gun: TOP_GUN,
  james_bond: JAMES_BOND,
  bridget_jones: BRIDGET_JONES,
  pulp_fiction: PULP_FICTION,
  audrey_hepburn: AUDREY_HEPBURN,
  marcus_aurelius: MARCUS_AURELIUS,
  portuguese_swearing: SWEARING,
  flirting_m2f: FLIRTING_M2F,
  flirting_f2m: FLIRTING_F2M,
  duran_duran_lisboa: DURAN_DURAN,
}

export function rootById(id: string): Root | undefined {
  return ROOTS.find((r) => r.root_id === id)
}

/** Every distinct piece the graph can teach, and where it first comes from. */
export interface Piece extends Omit<Extract, 'id'> {
  family: CultureFamily
  rung: Rung
}

export const PIECES: Record<string, Piece> = (() => {
  const out: Record<string, Piece> = {}
  // Lowest rung wins: a piece belongs to the earliest point a learner could have met
  // it, otherwise a rung 2 root would look as though it needed rung 6 knowledge.
  for (const root of ROOTS) {
    for (const e of root.extracts) {
      const rung = e.rung ?? root.rung
      const seen = out[e.id]
      if (!seen || rung < seen.rung) {
        const { id: _id, ...rest } = e
        out[e.id] = { ...rest, family: seen?.family ?? root.culture_family, rung }
      }
    }
  }
  return out
})()

/**
 * §11 — collisions. Each one must use pieces the learner has actually met, from at
 * least two different cultural families. The point is not fan fiction; it is the
 * moment unrelated memories start behaving like one language.
 */
export interface Collision {
  id: string
  requires: string[]
  context: string
  ask: string
  answer: string
  /** Surfaced after success, gently. */
  provenance: string
}

export const COLLISIONS: Collision[] = [
  {
    id: 'fl_tg_gostava_quiseres',
    requires: ['gostava_de', 'quando_quiseres'],
    context: 'She has said yes but not said when.',
    ask: 'I’d like to see you whenever you want.',
    answer: 'Gostava de te ver quando quiseres.',
    provenance: 'QUANDO QUISERES came out of a fighter jet. It has landed somewhere considerably better.',
  },
  {
    id: 'fl_jb_ver_amanha',
    requires: ['gostava_de', 'ver_te', 'amanha'],
    context: 'Tonight is over. Tomorrow is not.',
    ask: 'I’d like to see you tomorrow.',
    answer: 'Gostava de te ver amanhã.',
    provenance: 'A Bond title supplied AMANHÃ. Nothing about it was ever about Bond.',
  },
  {
    id: 'fl_bj_nervoso_desculpa',
    requires: ['estou_nervoso', 'desculpa'],
    context: 'You have said something clumsy and she heard all of it.',
    ask: 'Sorry — I’m nervous.',
    answer: 'Desculpa, estou nervoso.',
    provenance: 'Bridget’s apology, doing the job it was built for.',
  },
  {
    id: 'fl_pf_posso_chama',
    requires: ['posso', 'como_se_chama'],
    context: 'You have been talking for ten minutes and still do not know.',
    ask: 'May I ask what you are called?',
    answer: 'Posso perguntar como se chama?',
    provenance: 'Pulp Fiction gave you the polite way to ask a name. This is where it earns its keep.',
  },
  {
    id: 'fl_ah_estas_feliz',
    requires: ['estas', 'feliz'],
    context: 'Something has been on her mind all evening.',
    ask: 'Are you happy?',
    answer: 'Estás feliz?',
    provenance: 'Audrey’s FELIZ, with the temporary “are”. Ask it with és and you are asking about her whole life.',
  },
  {
    id: 'fl_ma_gostava_agora',
    requires: ['gostava_de', 'agora'],
    context: 'Neither of you wants to wait until tomorrow.',
    ask: 'I’d like to see you now.',
    answer: 'Gostava de te ver agora.',
    provenance: 'Marcus Aurelius on the only moment you have, repurposed without apology.',
  },
  {
    id: 'fl_sw_foda_nervoso',
    requires: ['estou_nervoso', 'foda_se'],
    context: 'Said to yourself, in the toilets, before going back out.',
    ask: 'For f***’s sake, I’m nervous.',
    answer: 'Foda-se, estou nervoso.',
    provenance: 'Two crates that had no business meeting, meeting.',
  },
  {
    id: 'fl_m2f_f2m_beijinho',
    requires: ['posso', 'beijinho'],
    context: 'The evening is over and neither of you has moved towards the door.',
    ask: 'Can I give you a kiss?',
    answer: 'Posso dar-te um beijinho?',
    provenance: 'One crate taught the asking, the other taught the kiss.',
  },
  {
    id: 'fl_f_tg_apetece_comigo',
    requires: ['apetece_te', 'comigo'],
    context: 'You are leaving and would rather he came too.',
    ask: 'Do you fancy coming with me?',
    answer: 'Apetece-te vir comigo?',
    provenance: 'COMIGO came from Top Gun. It has never once been needed on a runway.',
  },
  {
    id: 'fl_f_jb_ligas_amanha',
    requires: ['ligas_me', 'amanha'],
    context: 'He is going home and you would like a reason to expect a phone call.',
    ask: 'Will you call me tomorrow?',
    answer: 'Ligas-me amanhã?',
    provenance: 'Tomorrow Never Dies. Tomorrow, in this case, had better not.',
  },
  {
    id: 'fl_f_bj_desculpa_engracado',
    requires: ['engracado', 'desculpa'],
    context: 'He has said something ridiculous and you laughed far too loudly.',
    ask: 'Sorry — you’re funny.',
    answer: 'Desculpa, és engraçado.',
    provenance: 'Bridget’s apology and a compliment, which is very nearly her entire character.',
  },
  {
    id: 'fl_f_pf_mesmo_engracado',
    requires: ['engracado', 'mesmo'],
    context: 'He has done it again and you have stopped pretending not to laugh.',
    ask: 'You really are funny.',
    answer: 'És mesmo engraçado.',
    provenance: 'MESMO came out of Pulp Fiction, where it was doing something considerably less kind.',
  },
  {
    id: 'fl_f_ah_es_feliz',
    requires: ['es', 'feliz'],
    context: 'It is late, and the conversation has gone somewhere neither of you planned.',
    ask: 'Are you happy?',
    answer: 'És feliz?',
    provenance: 'The same three words as the other crate, with the permanent “are”. A much bigger question.',
  },
  {
    id: 'fl_f_ma_apetece_agora',
    requires: ['apetece_te', 'agora'],
    context: 'The party is dying and the city is still open.',
    ask: 'Do you fancy going now?',
    answer: 'Apetece-te ir agora?',
    provenance: 'AGORA arrived by way of Roman stoicism. It is doing fine.',
  },
  {
    id: 'fl_f_sw_grande_engracado',
    requires: ['engracado', 'grande'],
    context: 'He is being funny about something he really should not be.',
    ask: 'Aren’t you the comedian.',
    answer: 'És um grande engraçado.',
    provenance: 'GRANDE was learned as an insult. In front of engraçado it is doing exactly the same job.',
  },
  {
    id: 'sw_tg_hoje_nao_vou',
    requires: ['hoje', 'nao_vou'],
    context: 'A friend asks whether you are coming out later.',
    ask: 'I’m not going today.',
    answer: 'Hoje não vou.',
    provenance: 'HOJE came out of a complaint. NÃO VOU came out of Top Gun. Neither of them noticed.',
  },
  {
    id: 'sw_jb_isto_outra_vez',
    requires: ['isto', 'outra_vez'],
    context: 'The same problem has now come back for the third time.',
    ask: 'This again?',
    answer: 'Isto outra vez?',
    provenance: 'A Bond title and a swear word, welded into the most useful two words of your week.',
  },
  {
    id: 'sw_bj_desculpa_farto',
    requires: ['estou_farto', 'desculpa'],
    context: 'You need to leave a party that is going nowhere.',
    ask: 'Sorry, I’m fed up.',
    answer: 'Desculpa, estou farto.',
    provenance: 'Bridget supplied the apology. The other place supplied the honesty.',
  },
  {
    id: 'sw_pf_vai_com_calma',
    requires: ['vai', 'calma'],
    context: 'Your friend is winding themselves up to do something stupid.',
    ask: 'Take it easy.',
    answer: 'Vai com calma.',
    provenance: 'VAI was learned as an insult. Pointed somewhere kinder it becomes advice.',
  },
  {
    id: 'sw_ah_vida_merda',
    requires: ['uma_merda', 'vida'],
    context: 'Your friend has had the worst week you can remember.',
    ask: 'Life is crap.',
    answer: 'A vida é uma merda.',
    provenance: 'Audrey gave you VIDA. Portuguese television gave you UMA MERDA. The sentence does not care.',
  },
  {
    id: 'sw_ma_nao_podes_mudar_isto',
    requires: ['isto', 'nao_podes', 'mudar'],
    context: 'Someone is raging about a decision that was made without them.',
    ask: 'You can’t change this.',
    answer: 'Não podes mudar isto.',
    provenance: 'Marcus Aurelius, delivered with a word you learned from swearing at a television.',
  },
  {
    id: 'comigo_amanha',
    requires: ['comigo', 'amanha', 'podes'],
    context: 'You want to see someone, but not today.',
    ask: 'Can you come with me tomorrow?',
    answer: 'Podes vir comigo amanhã?',
    provenance: 'You met COMIGO in one world. AMANHÃ came from another. Now they work together.',
  },
  {
    id: 'desculpa_outra_vez',
    requires: ['desculpa', 'outra_vez'],
    context: 'You missed what someone said, and you feel bad about it.',
    ask: 'Sorry. Can you say it again?',
    answer: 'Desculpa. Podes dizer outra vez?',
    provenance: 'An apology from one world, a repair from another. Together they are a whole social move.',
  },
  {
    id: 'mesmo_boa_ideia',
    requires: ['mesmo', 'boa_ideia'],
    context: 'Someone suggests something and you genuinely like it.',
    ask: 'That is really a good idea.',
    answer: 'Isso é mesmo uma boa ideia.',
    provenance: 'The intensifier came from a diner in Los Angeles. The phrase it is intensifying did not.',
  },
  {
    id: 'agora_nao_vou',
    requires: ['agora', 'nao_vou'],
    context: 'You have decided, and the timing matters.',
    ask: 'I’m not going now.',
    answer: 'Não vou agora.',
    provenance: 'An intention from one world and a time word from another, in four syllables.',
  },
  {
    id: 'calma_outra_vez',
    requires: ['calma', 'outra_vez'],
    context: 'Someone is flustered and talking far too fast.',
    ask: 'Easy. Say it again.',
    answer: 'Calma. Diz outra vez.',
    provenance: 'One word from a crime film, one from a spy title, and together they defuse a real conversation.',
  },
  {
    id: 'chamo_como_se_chama',
    requires: ['chamo_me', 'como_se_chama'],
    context: 'You are introducing yourself and pointing at something at once.',
    ask: 'My name is Sam. What is this called?',
    answer: 'Chamo-me Sam. Como se chama isto?',
    provenance: 'The same Portuguese verb, learned twice from two unrelated films.',
  },
  {
    id: 'desculpa_preciso',
    requires: ['desculpa', 'preciso_de'],
    context: 'You need help, and you are interrupting someone to ask for it.',
    ask: 'Sorry, I need help.',
    answer: 'Desculpa, preciso de ajuda.',
    provenance: 'An apology from one world, a need from another. Most real sentences are made this way.',
  },
  {
    id: 'agora_desculpa',
    requires: ['agora', 'desculpa'],
    context: 'Someone wants you, and you cannot right this second.',
    ask: 'Sorry, not now.',
    answer: 'Desculpa, agora não.',
    provenance: 'Stoic philosophy supplied the timing. A romantic comedy supplied the manners.',
  },
  {
    id: 'calma_nao_vou',
    requires: ['calma', 'nao_vou'],
    context: 'Someone is pushing, and you have already decided.',
    ask: 'Easy. I’m not going.',
    answer: 'Calma. Não vou.',
    provenance: 'Two very different films, one very ordinary refusal.',
  },
  {
    id: 'boa_ideia_amanha',
    requires: ['boa_ideia', 'amanha'],
    context: 'They suggest a day and you like it.',
    ask: 'Tomorrow? Good idea.',
    answer: 'Amanhã? Boa ideia.',
    provenance: 'A film title gave you the day. Somewhere else entirely gave you the enthusiasm.',
  },
  {
    id: 'mesmo_podes',
    requires: ['mesmo', 'podes'],
    context: 'Someone offers something you did not expect.',
    ask: 'Can you really?',
    answer: 'Podes mesmo?',
    provenance: 'One word of attitude, one of permission, from opposite ends of cinema.',
  },
  {
    id: 'podes_sempre',
    requires: ['podes', 'sempre'],
    context: 'You are telling someone the door is open.',
    ask: 'You can always come.',
    answer: 'Podes vir sempre.',
    provenance: 'Permission from one world, warmth from another.',
  },
  {
    id: 'calma_piada',
    requires: ['calma', 'piada'],
    context: 'It did not land, and they have taken it badly.',
    ask: 'Easy. It was a joke.',
    answer: 'Calma. Era uma piada.',
    provenance: 'A crime film supplied the calm. A romantic comedy supplied the excuse.',
  },
  {
    id: 'sempre_desculpa',
    requires: ['sempre', 'desculpa'],
    context: 'You are owning up to a habit.',
    ask: 'I always apologise.',
    answer: 'Peço sempre desculpa.',
    provenance: 'One word of grace, one of embarrassment. They get on well.',
  },
  {
    id: 'mesmo_verdade',
    requires: ['mesmo', 'e_verdade'],
    context: 'Someone tells you something you were not expecting.',
    ask: 'Is it really true?',
    answer: 'É mesmo verdade?',
    provenance: 'Ancient philosophy asked the question. A diner conversation sharpened it.',
  },
  {
    id: 'aproveita_agora',
    requires: ['aproveita', 'agora'],
    context: 'Something good is happening and it will not wait.',
    ask: 'Make the most of now.',
    answer: 'Aproveita agora.',
    provenance: 'Two thousand years apart, and they finish each other’s sentence.',
  },
  {
    id: 'tens_tempo',
    requires: ['tens', 'tempo'],
    context: 'You want a moment of someone’s time.',
    ask: 'Do you have time?',
    answer: 'Tens tempo?',
    provenance: 'Ancient philosophy supplied the verb. A spy film supplied the noun.',
  },

  // --- the drop, colliding with all nine permanent crates --------------------
  // A drop that touches nothing is a novelty. These are what make the Duran Duran
  // date leave something behind after it expires.
  {
    id: 'dd_tg_precisas_comigo',
    requires: ['precisas', 'comigo'],
    context: 'He is standing outside the venue working up to going in alone.',
    ask: 'Do you need to come with me?',
    answer: 'Precisas de vir comigo?',
    provenance: 'PRECISO DE came out of a fighter jet. Move the ending and it stops being about you.',
  },
  {
    id: 'dd_jb_amanha_manha',
    requires: ['amanha', 'manha'],
    context: 'You are saying goodnight and fixing the time in the same breath.',
    ask: 'See you tomorrow morning.',
    answer: 'Até amanhã de manhã.',
    provenance: 'A Bond title gave you AMANHÃ. A Duran Duran chorus opened it up: a + manhã.',
  },
  {
    id: 'dd_bj_desculpa_ha',
    requires: ['desculpa', 'ha'],
    context: 'You have arrived late again and something is clearly wrong.',
    ask: 'Sorry — is there a problem?',
    answer: 'Desculpa, há um problema?',
    provenance: 'Bridget supplied the apology. The song supplied the one word Portuguese uses for “there is”.',
  },
  {
    id: 'dd_pf_calma_tudo',
    requires: ['calma', 'tudo'],
    context: 'He is spiralling and none of it is actually that serious.',
    ask: 'Calm down — everything’s fine.',
    answer: 'Calma, está tudo bem.',
    provenance: 'Pulp Fiction taught you to say CALMA without sounding sarcastic. Now it has something to be calm about.',
  },
  {
    id: 'dd_ah_tudo_sempre',
    requires: ['tudo', 'sempre'],
    context: 'The gig is over, and so is the drop it came in.',
    ask: 'Not everything lasts forever.',
    answer: 'Nem tudo dura sempre.',
    provenance: 'Audrey supplied SEMPRE. The drop it landed in did not last, which was rather the point.',
  },
  {
    id: 'dd_ma_tudo_mudar',
    requires: ['tudo', 'mudar'],
    context: 'He is annoyed that the drop has gone from his picker.',
    ask: 'Everything changes.',
    answer: 'Tudo muda.',
    provenance: 'Marcus Aurelius on impermanence, arriving via a pop song. He would have been fine with that.',
  },
  {
    id: 'dd_sw_foda_fome',
    requires: ['foda_se', 'fome'],
    context: 'Four hours in the queue and not one food stall has opened.',
    ask: 'For fuck’s sake, I’m starving.',
    answer: 'Foda-se, tenho uma fome de lobo.',
    provenance: 'The swearing crate and a Duran Duran chorus, in complete agreement.',
  },
  {
    id: 'dd_fm_oferecer_alguma_coisa',
    requires: ['oferecer_te', 'alguma_coisa'],
    context: 'The bar is three deep and you are going anyway.',
    ask: 'Can I get you something?',
    answer: 'Posso oferecer-te alguma coisa?',
    provenance: 'Flirting gave you OFERECER-TE. The drop gave you the thing you are offering.',
  },
  {
    id: 'dd_ff_ligas_segunda',
    requires: ['ligas_me', 'segunda_feira'],
    context: 'The gig is on the Saturday. She is not leaving the rest of it to chance.',
    ask: 'Call me on Monday.',
    answer: 'Ligas-me na segunda-feira?',
    provenance: 'LIGAS-ME was hers. SEGUNDA-FEIRA came out of a song about a Monday. Together they are a plan.',
  },
]

/** Every root at or below a rung — what a crate may serve at that point. */
export function rootsUpTo(rung: Rung, family?: CultureFamily): Root[] {
  return ROOTS.filter((r) => r.rung <= rung && (!family || r.culture_family === family))
}

/** How much of a crate is still above the learner. Drives the dimmed state. */
export function lockedIn(family: CultureFamily, rung: Rung): number {
  return (ROOTS_BY_FAMILY[family] ?? []).filter((r) => r.rung > rung).length
}

/**
 * The rung a crate can first be entered at — what it declares, or failing that the
 * lowest thing actually in it.
 */
export function entryRung(crate: Crate): Rung {
  const rs = ROOTS_BY_FAMILY[crate.id] ?? []
  if (crate.opens_at) return crate.opens_at
  return (rs.length ? (Math.min(...rs.map((r) => r.rung)) as Rung) : 1)
}

/**
 * How far up the ladder a learner has opened.
 *
 * You move by demonstrating, never by attending: the release beat takes the culture
 * away and asks for the line cold, and doing that cleanly at rung N opens rung N+1
 * everywhere at once — in every crate, not just the one you were standing in.
 *
 * Derived from the proof lines rather than stored, so it cannot drift out of step
 * with what the learner has actually done, and so it survives anybody arriving with
 * progress saved before the ladder existed.
 */
export function rungReached(
  // ProofLine keeps its own `pt`: it is a record of what the learner said, not a field
  // of the content graph, and renaming it here would have been the rename escaping its
  // own scope.
  proof: { pt: string; source: string; clean: boolean }[],
): Rung {
  let top = 0
  for (const line of proof) {
    if (line.source !== 'release' || !line.clean) continue
    const root = ROOTS.find((r) => r.transfer_prompt.answer === line.pt)
    if (root && root.rung > top) top = root.rung
  }
  return Math.min(6, Math.max(1, top + 1)) as Rung
}

/** The root that first taught a piece — where the learner met it. */
export function sourceOf(pieceId: string): Root | undefined {
  return ROOTS.find((r) => r.extracts.some((e) => e.id === pieceId))
}

/** Accent-folded and lowercased, so procura matches Procurá and PROCURA alike. */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Does this line actually show this piece?
 *
 * A declared `demonstrates` is the answer and no matching happens. Otherwise it is a
 * whole-word match against the piece's own surface form and its declared plural —
 * never a bare includes(), which is what filed "Onde está o meu café?" under é, and
 * never a lemma-wide match, which would let ele claim "Eles gostam de ti". `copos` is
 * a declared form of copo; `eles` is a different piece with an id of its own.
 */
export function branchShows(branch: Branch, pieceId: string): boolean {
  if (branch.demonstrates) return branch.demonstrates.includes(pieceId)
  const piece = PIECES[pieceId]
  if (!piece) return false
  const hay = fold(branch.target)
  // The declared plural wins; otherwise a noun gets the regular +s, so `copos` is
  // caught without every regular plural in the graph having to be authored by hand.
  const regular =
    piece.shelf === 'things' && !piece.plural && !/s$/i.test(piece.target)
      ? piece.target + 's'
      : undefined
  const forms = [piece.target, piece.plural ?? regular]
    .filter((f): f is string => Boolean(f))
    .map((f) => fold(f.replace(/[…?]/g, '').trim()))
    .filter(Boolean)
  return forms.some((f) =>
    new RegExp('(^|[^\\p{L}])' + escapeRe(f) + '($|[^\\p{L}])', 'u').test(hay),
  )
}

/**
 * Everything a piece lets you say, gathered from every root that demonstrates it.
 *
 * Deliberately drawn across the whole graph rather than the one root it came from:
 * the point of the library is that COMIGO stopped belonging to Top Gun the moment it
 * turned up somewhere else. Lines from crates the learner has actually opened come
 * first, because a demonstration you recognise is worth more than one you do not.
 */
export function linesFor(pieceId: string, limit = 6, ownCrates: CultureFamily[] = []): Branch[] {
  if (!PIECES[pieceId]) return []
  const own = new Set(ownCrates)
  const hits: { branch: Branch; mine: boolean }[] = []
  for (const r of ROOTS) {
    for (const b of r.branches) {
      if (!branchShows(b, pieceId)) continue
      if (hits.some((h) => h.branch.target === b.target)) continue
      hits.push({ branch: b, mine: own.has(r.culture_family) })
    }
  }
  return hits
    .sort((a, b) => Number(b.mine) - Number(a.mine))
    .slice(0, limit)
    .map((h) => h.branch)
}

/** Every piece that is a form of the same word, the lemma's own entry included. */
export function formsOf(lemma: string): { id: string; piece: Piece }[] {
  return Object.entries(PIECES)
    .filter(([, p]) => p.lemma === lemma)
    .map(([id, piece]) => ({ id, piece }))
}

/**
 * How a noun should be shown: with its article, never as a bare stem, because the
 * article is the gender and the gender is what makes the word usable.
 *
 * Some are taught with an article already attached — "o atraso", "as pessoas" — and
 * those keep the one they were taught with rather than collecting a second.
 */
const ARTICLE = /^(o|a|os|as|um|uma|uns|umas)\s/i

export function displayForm(piece: Piece): string {
  if (piece.shelf !== 'things' || !piece.gender) return piece.target
  if (piece.countable === false || ARTICLE.test(piece.target)) return piece.target
  return (piece.gender === 'f' ? 'uma ' : 'um ') + piece.target
}
