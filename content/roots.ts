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

export type RootType = 'quote' | 'title' | 'paraphrased_moment' | 'wisdom' | 'other'

export type SourceStatus =
  | 'verified'
  | 'paraphrased'
  | 'public-domain-derived'
  | 'needs-review'

export type RightsStatus = 'short-quote-review-required' | 'title-reference' | 'dub-authored'

export type QaStatus = 'pending-pt-pt-review' | 'reviewed'

/** A reusable piece. The learner's inventory is keyed by these ids. */
export interface Extract {
  id: string
  pt: string
  gloss: string
}

export interface Branch {
  pt: string
  en: string
}

/** §12 — two natural ways to say the same thing. Neither is scored. */
export interface VoiceOption {
  pt: string
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
  root_type: RootType
  source_label: string
  source_status: SourceStatus
  /** What the learner sees as the cultural trigger. */
  root_display: string
  meaning_en: string
  pt_natural: string
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

export const FAMILIES: {
  id: CultureFamily
  title: string
  blurb: string
  tone: string
  built: boolean
}[] = [
  { id: 'top_gun', title: 'TOP GUN QUOTES', blurb: 'Iconic lines. Direct language.', tone: 'kinetic', built: true },
  { id: 'james_bond', title: 'JAMES BOND FILM TITLES', blurb: 'Tiny titles. Surprisingly useful Portuguese.', tone: 'cool', built: true },
  { id: 'bridget_jones', title: 'BRIDGET JONES CRINGE MOMENTS', blurb: 'Awkwardness you can actually use.', tone: 'human', built: true },
  { id: 'pulp_fiction', title: 'PULP FICTION BANGER QUOTES', blurb: 'Punchy lines. Real conversational leverage.', tone: 'sharp', built: true },
  { id: 'audrey_hepburn', title: 'AUDREY HEPBURN MUSINGS', blurb: 'Elegance, warmth and things worth saying.', tone: 'warm', built: true },
  { id: 'marcus_aurelius', title: 'MARCUS AURELIUS WISDOM', blurb: 'Ancient ideas. Surprisingly useful modern language.', tone: 'reflective', built: true },
  { id: 'portuguese_swearing', title: 'HOW TO SWEAR IN PORTUGUESE', blurb: 'The subtitles were lying to you. Strong language throughout.', tone: 'blunt', built: true },
]

const q = (partial: Partial<Root> & Pick<Root, 'root_id' | 'culture_family' | 'root_display' | 'meaning_en' | 'pt_natural' | 'semantic_bridge' | 'subtext' | 'extracts' | 'branches' | 'transfer_prompt'>): Root => ({
  root_type: 'quote',
  source_label: '',
  source_status: 'needs-review',
  reinforces: [],
  rights_status: 'short-quote-review-required',
  qa_status: 'pending-pt-pt-review',
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
    source_label: 'Top Gun',
    root_display: 'Talk to me, Goose.',
    meaning_en: 'Say something. I need you with me.',
    pt_natural: 'Fala comigo, Goose.',
    semantic_bridge:
      'The urgency survives intact. Portuguese expresses “with me” as one fused word, COMIGO, attached straight onto the command FALA.',
    subtext: 'Direct, close, urgent. You reach for this when you genuinely need someone to engage.',
    extracts: [{ id: 'comigo', pt: 'comigo', gloss: 'with me' }],
    branches: [
      { pt: 'Vem comigo.', en: 'Come with me.' },
      { pt: 'Fica comigo.', en: 'Stay with me.' },
      { pt: 'Podes vir comigo?', en: 'Can you come with me?' },
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
    source_label: 'Top Gun',
    root_display: 'You can be my wingman anytime.',
    meaning_en: 'You can be my partner whenever you want.',
    pt_natural: 'Podes ser o meu parceiro quando quiseres.',
    semantic_bridge:
      'The aviation metaphor becomes ordinary human Portuguese. The useful pieces are PODES and QUANDO QUISERES — not the military noun.',
    subtext: 'Warm permission rather than formal ability. PODES is one of the highest-leverage pieces in the language.',
    extracts: [
      { id: 'podes', pt: 'podes', gloss: 'you can' },
      { id: 'quando_quiseres', pt: 'quando quiseres', gloss: 'whenever you want' },
    ],
    branches: [
      { pt: 'Podes vir comigo?', en: 'Can you come with me?' },
      { pt: 'Podes dizer outra vez?', en: 'Can you say it again?' },
      { pt: 'Quando quiseres.', en: 'Whenever you want.' },
    ],
    reinforces: ['comigo'],
    voice_options: [
      {
        pt: 'Podes repetir?', en: 'Can you repeat?', signal: 'direct',
        register: 'QUICK, BETWEEN FRIENDS',
        when: 'Someone you already call tu — a friend, a colleague you know, someone your own age.',
        risk: 'Fine with friends. To a stranger or anyone older, podes is the wrong word.',
      },
      {
        pt: 'Podes repetir, por favor?', en: 'Can you repeat, please?', signal: 'polite',
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
    source_label: 'Top Gun',
    root_display: 'What were you thinking?',
    meaning_en: 'What was going through your head?',
    pt_natural: 'Em que estavas a pensar?',
    literal_note: 'Literally “in what were you thinking?”',
    semantic_bridge:
      'Portuguese asks “in what were you thinking?”, because PENSAR EM means to think about. That EM is the whole difference between sounding translated and sounding Portuguese.',
    subtext: 'Curious, intimate or accusatory depending entirely on how you say it.',
    extracts: [
      { id: 'estavas_a', pt: 'estavas a…', gloss: 'you were …ing' },
      { id: 'em_que', pt: 'em que…?', gloss: 'what … about?' },
    ],
    branches: [
      { pt: 'Em que estás a pensar?', en: 'What are you thinking about?' },
      { pt: 'Estava a pensar…', en: 'I was thinking…' },
      { pt: 'Estava a pensar em ti.', en: 'I was thinking about you.' },
      { pt: 'Em que estavas a pensar?', en: 'What were you thinking about?' },
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
    source_label: 'Top Gun',
    root_display: 'I feel the need…',
    meaning_en: 'I need something, badly.',
    pt_natural: 'Sinto que preciso…',
    semantic_bridge:
      'Rather than carrying the English noun “need” across literally, Portuguese turns the idea into a verb: PRECISAR. “I feel that I need…”',
    subtext: 'Neutral, everyday, endlessly useful. This is the product beating subtitle literalism.',
    extracts: [{ id: 'preciso_de', pt: 'preciso de…', gloss: 'I need…' }],
    branches: [
      { pt: 'Preciso de ajuda.', en: 'I need help.' },
      { pt: 'Preciso de um táxi.', en: 'I need a taxi.' },
      { pt: 'Preciso de tempo.', en: 'I need time.' },
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
    source_label: 'Top Gun',
    root_display: 'I will not leave my wingman.',
    meaning_en: 'I am not going to abandon my partner.',
    pt_natural: 'Não vou deixar o meu parceiro.',
    semantic_bridge:
      'The cultural meaning is loyalty. The reusable Portuguese is the intention frame NÃO VOU + verb, which works for anything you have decided not to do.',
    subtext: 'Firm intention. More conversational than a formal future tense this early.',
    extracts: [
      { id: 'nao_vou', pt: 'não vou…', gloss: 'I’m not going to…' },
      { id: 'deixar', pt: 'deixar', gloss: 'to leave / to let' },
    ],
    branches: [
      { pt: 'Não vou sair.', en: 'I’m not going out.' },
      { pt: 'Não vou amanhã.', en: 'I’m not going tomorrow.' },
      { pt: 'Não vou fazer isso.', en: 'I’m not going to do that.' },
      { pt: 'Vou deixar isso.', en: 'I’m going to leave that.' },
    ],
    voice_options: [
      {
        pt: 'Não vou.', en: 'I’m not going.', signal: 'direct',
        register: 'A FLAT NO',
        when: 'When the answer really is no and you would rather not be talked round.',
        risk: 'A bare no lands colder in Portugal than it does in English.',
      },
      {
        pt: 'Acho que não vou.', en: 'I don’t think I’ll go.', signal: 'softened',
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
    root_type: 'quote',
    source_label: 'James Bond',
    root_display: 'My name is… James Bond.',
    meaning_en: 'The most famous introduction in film.',
    pt_natural: 'Chamo-me… James Bond.',
    literal_note: 'Literally “I call myself”.',
    semantic_bridge:
      'English says “my name is”. European Portuguese introduces you with CHAMO-ME — literally “I call myself” — and that reflexive is what you will actually hear in Portugal.',
    subtext: 'A perfect freebie: culturally unmistakable and useful within an hour of landing.',
    extracts: [{ id: 'chamo_me', pt: 'chamo-me…', gloss: 'my name is…' }],
    branches: [
      { pt: 'Chamo-me Sam.', en: 'My name is Sam.' },
      { pt: 'E tu, como te chamas?', en: 'And you, what’s your name?' },
      { pt: 'Como se chama?', en: 'What is it called?' },
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
    root_type: 'title',
    source_label: 'Tomorrow Never Dies',
    source_status: 'verified',
    root_display: 'Tomorrow Never Dies',
    meaning_en: 'Tomorrow never dies.',
    pt_natural: 'Amanhã nunca morre.',
    semantic_bridge:
      'The title is compact enough that both useful pieces survive the crossing intact: AMANHÃ and NUNCA are sitting there in plain sight.',
    subtext: 'Time and absolute frequency in one recognisable title — far more productive than a title that is only a place name.',
    extracts: [
      { id: 'amanha', pt: 'amanhã', gloss: 'tomorrow' },
      { id: 'nunca', pt: 'nunca', gloss: 'never' },
    ],
    branches: [
      { pt: 'Até amanhã.', en: 'See you tomorrow.' },
      { pt: 'Amanhã não posso.', en: 'I can’t tomorrow.' },
      { pt: 'Nunca mais.', en: 'Never again.' },
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
        pt: 'Amanhã.', en: 'Tomorrow.', signal: 'direct',
        register: 'ANSWERING “WHEN?”',
        when: '“When?” — “Tomorrow.” This is information, not a goodbye.',
      },
      {
        pt: 'Até amanhã!', en: 'See you tomorrow!', signal: 'warm',
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
    root_type: 'title',
    source_label: 'From Russia with Love',
    source_status: 'verified',
    root_display: 'From Russia with Love',
    meaning_en: 'From Russia, with love.',
    pt_natural: 'Da Rússia com amor.',
    semantic_bridge:
      'The engine hiding in the title is COM = with. And COM + MIM is exactly where COMIGO came from — the piece you already own is this word wearing a disguise.',
    subtext: 'A compact root that quietly explains a piece you already have while handing you the general form.',
    extracts: [
      { id: 'com', pt: 'com', gloss: 'with' },
      { id: 'amor', pt: 'amor', gloss: 'love' },
    ],
    branches: [
      { pt: 'Café com leite.', en: 'Coffee with milk.' },
      { pt: 'Com açúcar?', en: 'With sugar?' },
      { pt: 'Comigo.', en: 'With me.' },
      { pt: 'Com amor.', en: 'With love.' },
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
    root_type: 'title',
    source_label: 'Never Say Never Again',
    source_status: 'verified',
    root_display: 'Never Say Never Again',
    meaning_en: 'Don’t say “never” again.',
    pt_natural: 'Não digas “nunca” outra vez.',
    semantic_bridge:
      'Natural Portuguese renders the title as “don’t say ‘never’ again”, which hands you a negative command and the single most useful survival phrase in one thought.',
    subtext: 'Playful, and unusually practical: OUTRA VEZ is what rescues you when you did not catch something.',
    extracts: [
      { id: 'outra_vez', pt: 'outra vez', gloss: 'again' },
      { id: 'nao_digas', pt: 'não digas', gloss: 'don’t say' },
    ],
    branches: [
      { pt: 'Diz outra vez.', en: 'Say it again.' },
      { pt: 'Podes dizer outra vez?', en: 'Can you say it again?' },
      { pt: 'Nunca mais.', en: 'Never again.' },
      { pt: 'Não digas isso.', en: 'Don’t say that.' },
    ],
    reinforces: ['podes', 'nunca'],
    voice_options: [
      {
        pt: 'Outra vez?', en: 'Again?', signal: 'casual',
        register: 'TWO WORDS, ANYWHERE',
        when: 'You missed it. Two words and a raised eyebrow does the whole job.',
        risk: 'Said flatly to a stranger it can read as impatient — your face is doing half the work.',
      },
      {
        pt: 'Podes dizer outra vez, por favor?', en: 'Can you say it again, please?', signal: 'polite',
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
    root_type: 'title',
    source_label: 'No Time to Die',
    source_status: 'verified',
    root_display: 'No Time to Die',
    meaning_en: 'There is no time to die.',
    pt_natural: 'Sem tempo para morrer.',
    semantic_bridge:
      'SEM and TEMPO are visible in the title without any translation gymnastics, and PARA is the little word that introduces purpose — time for something, time to do something.',
    subtext: 'Genuinely useful travel language pulled out of a very dramatic title. Enjoy the contrast.',
    extracts: [
      { id: 'sem', pt: 'sem', gloss: 'without' },
      { id: 'tempo', pt: 'tempo', gloss: 'time' },
    ],
    branches: [
      { pt: 'Sem açúcar.', en: 'Without sugar.' },
      { pt: 'Sem gelo.', en: 'Without ice.' },
      { pt: 'Não tenho tempo.', en: 'I don’t have time.' },
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
]

// ---------------------------------------------------------------------------
// B5 — Bridget Jones Cringe Moments. Human, awkward, funny.
// Paraphrased social situations, not a screenplay quote bank.
// ---------------------------------------------------------------------------

export const BRIDGET_JONES: Root[] = [
  q({
    root_id: 'bj_overshare',
    culture_family: 'bridget_jones',
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You overshare. There is now a silence.',
    meaning_en: 'I said too much.',
    pt_natural: 'Falei demais.',
    semantic_bridge:
      'The whole cringe is “I said too much”, and Portuguese compresses that into two words. DEMAIS is the part you keep — it attaches to almost anything you overdid.',
    subtext: 'Self-aware, human, lightly comic. Said with a wince rather than an apology.',
    extracts: [
      { id: 'demais', pt: 'demais', gloss: 'too much' },
      { id: 'falei', pt: 'falei', gloss: 'I spoke / I said' },
    ],
    branches: [
      { pt: 'Desculpa, falei demais.', en: 'Sorry, I said too much.' },
      { pt: 'Comi demais.', en: 'I ate too much.' },
      { pt: 'Bebi demais.', en: 'I drank too much.' },
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
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You arrive late. Everyone is already there.',
    meaning_en: 'Sorry I’m late.',
    pt_natural: 'Desculpa o atraso.',
    semantic_bridge:
      'The useful move is not a literal description of being late. It is the phrase a Portuguese speaker actually reaches for: “sorry for the delay.”',
    subtext: 'Warm, everyday repair. How formal you go is a real choice, not a rule.',
    extracts: [
      { id: 'desculpa', pt: 'desculpa', gloss: 'sorry' },
      { id: 'atraso', pt: 'o atraso', gloss: 'the delay' },
    ],
    branches: [
      { pt: 'Desculpa.', en: 'Sorry.' },
      { pt: 'Desculpa o atraso.', en: 'Sorry I’m late.' },
      { pt: 'Peço desculpa.', en: 'I apologise.' },
    ],
    voice_options: [
      {
        pt: 'Desculpa.', en: 'Sorry.', signal: 'casual',
        register: 'EVERYDAY SORRY',
        when: 'Bumping into someone, being two minutes late, squeezing past on a bus.',
        risk: 'This is the tu form. To someone older or official you want desculpe, with an e.',
      },
      {
        pt: 'Peço desculpa.', en: 'I do apologise.', signal: 'polite',
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
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You forget the name of the person you are talking to.',
    meaning_en: 'Sorry… what’s your name?',
    pt_natural: 'Desculpa… como te chamas?',
    semantic_bridge:
      'The socially useful move is to apologise lightly and then just ask. And CHAMAS is the same verb as CHAMO-ME, pointed at the other person.',
    subtext: 'Embarrassing but entirely recoverable. Everyone has done it.',
    extracts: [{ id: 'como_te_chamas', pt: 'como te chamas?', gloss: 'what’s your name?' }],
    branches: [
      { pt: 'Chamo-me Ana.', en: 'My name is Ana.' },
      { pt: 'Como te chamas?', en: 'What’s your name?' },
      { pt: 'Como se chama?', en: 'What is it called?' },
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
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'You say the wrong thing while trying to impress someone.',
    meaning_en: 'Sorry. That’s not what I meant.',
    pt_natural: 'Desculpa. Não era isso que queria dizer.',
    semantic_bridge:
      'Portuguese repairs this exactly the way English does — “that wasn’t what I meant to say” — which makes QUERIA DIZER available for every time the wrong word comes out.',
    subtext: 'The most valuable language an imperfect speaker can own: it gives you permission to recover instead of freeze.',
    extracts: [
      { id: 'queria_dizer', pt: 'queria dizer…', gloss: 'I meant…' },
      { id: 'nao_era_isso', pt: 'não era isso', gloss: 'that wasn’t it' },
    ],
    branches: [
      { pt: 'Queria dizer…', en: 'I meant…' },
      { pt: 'Não era isso.', en: 'That wasn’t it.' },
      { pt: 'Desculpa, queria dizer outra coisa.', en: 'Sorry, I meant something else.' },
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
    root_type: 'paraphrased_moment',
    source_label: 'DUB-authored cringe moment',
    source_status: 'paraphrased',
    root_display: 'The joke does not land.',
    meaning_en: 'It was a joke.',
    pt_natural: 'Era uma piada.',
    semantic_bridge:
      'The rescue is a past frame you can point at anything: ERA UMA… = it was a… The joke is disposable; the frame is not.',
    subtext: '“Era uma piada” can sound sheepish. “Estou a brincar” is lighter and lands better in the moment.',
    extracts: [
      { id: 'era', pt: 'era…', gloss: 'it was…' },
      { id: 'piada', pt: 'uma piada', gloss: 'a joke' },
    ],
    branches: [
      { pt: 'Era uma piada.', en: 'It was a joke.' },
      { pt: 'Estou a brincar.', en: 'I’m joking.' },
      { pt: 'É uma piada?', en: 'Is it a joke?' },
    ],
    reinforces: ['estavas_a'],
    voice_options: [
      {
        pt: 'Era uma piada.', en: 'It was a joke.', signal: 'dry',
        register: 'RESCUING A JOKE THAT DIED',
        when: 'Past tense. The joke has already landed badly and you are explaining it. Slightly wry.',
      },
      {
        pt: 'Estou a brincar!', en: 'I’m only joking!', signal: 'warm',
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
]

// ---------------------------------------------------------------------------
// B6 — Pulp Fiction Banger Quotes. Sharp, irreverent, rhythmic.
// Keep exact quoted material tiny. Preserve the punch, then leave the film fast.
// ---------------------------------------------------------------------------

export const PULP_FICTION: Root[] = [
  q({
    root_id: 'pf_royale',
    culture_family: 'pulp_fiction',
    source_label: 'Pulp Fiction',
    root_display: 'Royale with Cheese.',
    meaning_en: 'A Royale with cheese.',
    pt_natural: 'Royale com queijo.',
    semantic_bridge:
      'The joke is entirely cultural. The useful word is the smallest one in the sentence: COM.',
    subtext: 'A fast wink, not a lesson. If you already have COM, this is a nod rather than a discovery.',
    extracts: [{ id: 'com', pt: 'com', gloss: 'with' }],
    branches: [
      { pt: 'Com açúcar.', en: 'With sugar.' },
      { pt: 'Com gelo.', en: 'With ice.' },
      { pt: 'Com queijo.', en: 'With cheese.' },
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
    source_label: 'Pulp Fiction',
    root_display: 'Say “what” again!',
    meaning_en: 'Say “what” one more time.',
    pt_natural: 'Diz “o quê” outra vez!',
    semantic_bridge:
      'The rhythm carries straight across, and every word in it is worth keeping: DIZ, O QUÊ, OUTRA VEZ.',
    subtext: 'The film gives this line menace. Keep the polite version — that is the one you will actually need.',
    extracts: [
      { id: 'diz', pt: 'diz', gloss: 'say' },
      { id: 'o_que', pt: 'o quê?', gloss: 'what?' },
    ],
    branches: [
      { pt: 'Diz outra vez.', en: 'Say it again.' },
      { pt: 'Podes dizer outra vez?', en: 'Can you say it again?' },
      { pt: 'O quê?', en: 'What?' },
    ],
    reinforces: ['outra_vez', 'podes'],
    voice_options: [
      {
        pt: 'O quê?', en: 'What?', signal: 'direct',
        register: 'WITH PEOPLE YOU KNOW',
        when: 'A friend says something surprising, or you simply did not hear it.',
        risk: 'On its own, to a stranger, this is close to “what?!” in English. It can sound aggressive.',
      },
      {
        pt: 'Desculpa, o quê?', en: 'Sorry, what?', signal: 'softened',
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
    source_label: 'Pulp Fiction',
    root_display: 'That’s a tasty burger.',
    meaning_en: 'That burger is really good.',
    pt_natural: 'Esse hambúrguer é mesmo bom.',
    literal_note: 'A literal “saboroso” is possible but sounds written, not spoken.',
    semantic_bridge:
      'Everyday European Portuguese reaches for “é mesmo bom” rather than a dictionary word for tasty. MESMO is the intensifier you will hear constantly.',
    subtext: 'A signature moment: natural speech beating dictionary fidelity.',
    extracts: [
      { id: 'mesmo', pt: 'mesmo', gloss: 'really' },
      { id: 'bom', pt: 'bom', gloss: 'good' },
    ],
    branches: [
      { pt: 'Isso é mesmo bom.', en: 'That is really good.' },
      { pt: 'Muito bom.', en: 'Very good.' },
      { pt: 'Esse é bom.', en: 'That one is good.' },
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
    source_label: 'Pulp Fiction',
    root_display: 'Be cool.',
    meaning_en: 'Calm down.',
    pt_natural: 'Tem calma.',
    semantic_bridge:
      'Portuguese does not translate “cool” here. It says “have calm” — and CALMA on its own does most of the work.',
    subtext: 'Register matters enormously. TEM CALMA can soothe or infuriate; CALMA alone is softer.',
    extracts: [{ id: 'calma', pt: 'calma', gloss: 'calm / easy' }],
    branches: [
      { pt: 'Calma.', en: 'Easy.' },
      { pt: 'Tem calma.', en: 'Calm down.' },
      { pt: 'Está tudo bem.', en: 'It’s all right.' },
    ],
    voice_options: [
      {
        pt: 'Calma.', en: 'Easy.', signal: 'dry',
        register: 'TAKING THE HEAT OUT',
        when: 'Someone is getting wound up. One word, said gently, is completely normal here.',
        risk: 'Said sharply it becomes a telling-off. Tone is doing all the work.',
      },
      {
        pt: 'Está tudo bem.', en: 'It’s all right.', signal: 'warm',
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
    root_type: 'paraphrased_moment',
    source_label: 'Pulp Fiction — paraphrased scene reference',
    source_status: 'paraphrased',
    root_display: 'The famous conversation about what they call it over there.',
    meaning_en: 'What is it called?',
    pt_natural: 'Como é que se chama?',
    literal_note: 'Literally “how is it called?”',
    semantic_bridge:
      'The whole scene is about what something is called, and Portuguese packages that as COMO É QUE SE CHAMA — the same CHAMAR you already met introducing yourself.',
    subtext: 'This is where the film unexpectedly turns into survival language.',
    extracts: [{ id: 'como_se_chama', pt: 'como se chama?', gloss: 'what is it called?' }],
    branches: [
      { pt: 'Como se chama isto?', en: 'What is this called?' },
      { pt: 'Como te chamas?', en: 'What’s your name?' },
      { pt: 'Chama-se…', en: 'It’s called…' },
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
]

// ---------------------------------------------------------------------------
// B7 — Audrey Hepburn Musings. Warm, aspirational, elegant.
// Musings rather than a quote archive: paraphrase by default.
// ---------------------------------------------------------------------------

export const AUDREY_HEPBURN: Root[] = [
  q({
    root_id: 'ah_paris',
    culture_family: 'audrey_hepburn',
    source_label: 'Audrey Hepburn — attribution requires review',
    source_status: 'needs-review',
    root_display: 'Paris is always a good idea.',
    meaning_en: 'Paris is always a good idea.',
    pt_natural: 'Paris é sempre uma boa ideia.',
    semantic_bridge:
      'The line maps across word for word, and hands over two pieces you will use constantly without ever mentioning Paris again.',
    subtext: 'Elegant, warm, instantly usable. BOA IDEIA is how you agree to almost anything.',
    extracts: [
      { id: 'sempre', pt: 'sempre', gloss: 'always' },
      { id: 'boa_ideia', pt: 'boa ideia', gloss: 'good idea' },
    ],
    branches: [
      { pt: 'É uma boa ideia.', en: 'It’s a good idea.' },
      { pt: 'Sempre.', en: 'Always.' },
      { pt: 'Acho que é uma boa ideia.', en: 'I think it’s a good idea.' },
    ],
    helpers: {
      'É': 'it is',
      'uma': 'a',
      'Acho': 'I think',
      'que': 'that',

    },
    voice_options: [
      {
        pt: 'Boa ideia.', en: 'Good idea.', signal: 'casual',
        register: 'QUICK AGREEMENT',
        when: 'Someone suggests something and you are in. Two words is entirely natural.',
      },
      {
        pt: 'Acho que é uma boa ideia.', en: 'I think it’s a good idea.', signal: 'softened',
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
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey theme',
    source_status: 'paraphrased',
    root_display: 'Enjoy your life.',
    meaning_en: 'Make the most of your life.',
    pt_natural: 'Aproveita a vida.',
    semantic_bridge:
      'The sentiment compresses into a single Portuguese imperative, and APROVEITA turns out to be one of the most-used words in the language — far beyond anything inspirational.',
    subtext: 'Positive without being saccharine. You will hear it shouted across a car park.',
    extracts: [
      { id: 'aproveita', pt: 'aproveita', gloss: 'enjoy / make the most of' },
      { id: 'vida', pt: 'vida', gloss: 'life' },
    ],
    branches: [
      { pt: 'Aproveita o dia.', en: 'Enjoy the day.' },
      { pt: 'Aproveita!', en: 'Enjoy it!' },
      { pt: 'Quero aproveitar.', en: 'I want to make the most of it.' },
      { pt: 'É a vida.', en: 'That’s life.' },
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
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of documented human-connection themes',
    source_status: 'paraphrased',
    root_display: 'People matter more than things.',
    meaning_en: 'People matter more than things.',
    pt_natural: 'As pessoas importam mais do que as coisas.',
    semantic_bridge:
      'The thought is a comparison, which makes MAIS DO QUE the engine — and that engine works for any two things you want to weigh against each other.',
    subtext: 'Warm and emotionally useful, rather than phrasebook language.',
    extracts: [
      { id: 'mais_do_que', pt: 'mais do que', gloss: 'more than' },
      { id: 'importa', pt: 'importa', gloss: 'it matters' },
    ],
    branches: [
      { pt: 'Tu importas.', en: 'You matter.' },
      { pt: 'Mais do que isso.', en: 'More than that.' },
      { pt: 'Isto importa.', en: 'This matters.' },
    ],
    helpers: {
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
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey sentiment',
    source_status: 'paraphrased',
    root_display: 'Look for the good in people.',
    meaning_en: 'Look for the good side of people.',
    pt_natural: 'Procura o lado bom das pessoas.',
    semantic_bridge:
      'Portuguese builds this around LADO BOM — the good side — and PROCURA, which is also just the ordinary word for looking for your keys.',
    subtext: 'Gentle but active. Warm language that still does everyday work.',
    extracts: [
      { id: 'procura', pt: 'procura', gloss: 'look for' },
      { id: 'lado_bom', pt: 'o lado bom', gloss: 'the good side' },
    ],
    branches: [
      { pt: 'Procura aqui.', en: 'Look here.' },
      { pt: 'O lado bom.', en: 'The good side.' },
      { pt: 'É uma boa pessoa.', en: 'They’re a good person.' },
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
    root_type: 'wisdom',
    source_label: 'DUB paraphrase of a documented Audrey sentiment',
    source_status: 'paraphrased',
    root_display: 'The most important thing is to be happy.',
    meaning_en: 'The most important thing is to be happy.',
    pt_natural: 'O mais importante é ser feliz.',
    semantic_bridge:
      'O MAIS IMPORTANTE É… is a frame you can put almost anything into, which makes it far more valuable than the sentiment it arrived in.',
    subtext: 'Aspirational on the surface, structurally very ordinary underneath.',
    extracts: [
      { id: 'o_mais_importante', pt: 'o mais importante', gloss: 'the most important thing' },
      { id: 'feliz', pt: 'feliz', gloss: 'happy' },
    ],
    branches: [
      { pt: 'É importante.', en: 'It’s important.' },
      { pt: 'O que é mais importante?', en: 'What is most important?' },
      { pt: 'Quero ser feliz.', en: 'I want to be happy.' },
      { pt: 'O mais importante é isto.', en: 'The most important thing is this.' },
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
        pt: 'É importante.', en: 'It’s important.', signal: 'direct',
        register: 'STATING A FACT',
        when: 'You are saying this matters, full stop, as though everyone already agrees.',
        risk: 'Stated flatly about someone else’s choices it can sound like a verdict.',
      },
      {
        pt: 'Para mim é importante.', en: 'It matters to me.', signal: 'warm',
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
    root_type: 'wisdom',
    source_label: 'DUB distillation of a recurring Meditations theme',
    source_status: 'public-domain-derived',
    root_display: 'Control what you can control.',
    meaning_en: 'Control what you can control.',
    pt_natural: 'Controla o que podes controlar.',
    semantic_bridge:
      'The thought and the Portuguese have nearly the same shape, which puts PODES right in the middle of the sentence where you cannot miss it.',
    subtext: 'Calm and practical. It sounds modern despite being nearly two thousand years old.',
    extracts: [
      { id: 'podes', pt: 'podes', gloss: 'you can' },
      { id: 'o_que', pt: 'o que', gloss: 'what / that which' },
    ],
    branches: [
      { pt: 'O que posso fazer?', en: 'What can I do?' },
      { pt: 'Não posso controlar isso.', en: 'I can’t control that.' },
      { pt: 'Podes controlar isto.', en: 'You can control this.' },
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
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'You do not control what happens. You control how you react.',
    meaning_en: 'You control your response, not the event.',
    pt_natural: 'Não controlas o que acontece. Controlas como reages.',
    semantic_bridge:
      'The idea splits cleanly into event and response, and both halves hand over an ordinary question you will use this week.',
    subtext: 'A reflection root that unexpectedly unlocks the most everyday questions there are.',
    extracts: [
      { id: 'o_que_acontece', pt: 'o que acontece', gloss: 'what happens' },
      { id: 'como', pt: 'como', gloss: 'how' },
    ],
    branches: [
      { pt: 'O que aconteceu?', en: 'What happened?' },
      { pt: 'Como reagiste?', en: 'How did you react?' },
      { pt: 'Não posso controlar isso.', en: 'I can’t control that.' },
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
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'The only moment you have is now.',
    meaning_en: 'Now is all you have.',
    pt_natural: 'O único momento que tens é agora.',
    semantic_bridge:
      'The philosophy makes AGORA impossible to forget, and quietly hands you TENS — the ordinary “you have” you need to ask anyone for anything.',
    subtext: 'The wisdom evaporates fast. AGORA and TENS stay for good.',
    extracts: [
      { id: 'agora', pt: 'agora', gloss: 'now' },
      { id: 'tens', pt: 'tens', gloss: 'you have' },
    ],
    branches: [
      { pt: 'Agora não.', en: 'Not now.' },
      { pt: 'E agora?', en: 'And now?' },
      { pt: 'Tens tempo?', en: 'Do you have time?' },
    ],
    reinforces: ['tempo'],
    voice_options: [
      {
        pt: 'Agora não.', en: 'Not now.', signal: 'direct',
        register: 'SHORT AND CLEAR',
        when: 'A shop, a street seller, anyone you owe no explanation to.',
        risk: 'To a friend or a colleague this can sound like you are annoyed with them.',
      },
      {
        pt: 'Agora não posso, desculpa.', en: 'I can’t right now, sorry.', signal: 'softened',
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
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'If it is not true, do not say it.',
    meaning_en: 'Don’t say it if it isn’t true.',
    pt_natural: 'Se não é verdade, não digas.',
    semantic_bridge:
      'The maxim is built from three pieces that convert straight into everyday conditionals: SE, É VERDADE and the negative command NÃO DIGAS.',
    subtext: 'Simple moral language that turns into ordinary reactions almost immediately.',
    extracts: [
      { id: 'se', pt: 'se', gloss: 'if' },
      { id: 'e_verdade', pt: 'é verdade', gloss: 'it is true' },
    ],
    branches: [
      { pt: 'É verdade?', en: 'Is it true?' },
      { pt: 'Se quiseres.', en: 'If you want.' },
      { pt: 'Não digas isso.', en: 'Don’t say that.' },
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
    root_type: 'wisdom',
    source_label: 'DUB source-derived wisdom',
    source_status: 'public-domain-derived',
    root_display: 'Accept what you cannot change.',
    meaning_en: 'Accept what you cannot change.',
    pt_natural: 'Aceita o que não podes mudar.',
    semantic_bridge:
      'Two reusable engines in one short line: NÃO PODES, and MUDAR — which is the verb you need the moment a booking goes wrong.',
    subtext: 'Reflective on the surface, extremely practical underneath.',
    extracts: [
      { id: 'nao_podes', pt: 'não podes', gloss: 'you can’t' },
      { id: 'mudar', pt: 'mudar', gloss: 'to change' },
    ],
    branches: [
      { pt: 'Posso mudar isto?', en: 'Can I change this?' },
      { pt: 'Não posso mudar isso.', en: 'I can’t change that.' },
      { pt: 'Quero mudar.', en: 'I want to change.' },
      { pt: 'Não podes mudar isso.', en: 'You can’t change that.' },
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
        pt: 'Não posso.', en: 'I can’t.', signal: 'direct',
        register: 'FINAL',
        when: 'It genuinely is not possible and you would rather not be asked twice.',
        risk: 'With no softener attached, expect the conversation to stop dead.',
      },
      {
        pt: 'Acho que não posso.', en: 'I don’t think I can.', signal: 'softened',
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Piss off. I have had enough.',
    meaning_en: 'Go away. I am fed up.',
    pt_natural: 'Vai à merda, estou farto.',
    literal_note: 'Literally “go to the shit”. Portuguese sends people to places.',
    semantic_bridge:
      'The whole insult is built from two ordinary bricks: VAI, the command “go”, and À, which is just “to the”. Swap the destination and the same frame becomes polite — vai para casa, vai com calma.',
    subtext: 'Final, not playful. This ends a conversation rather than seasoning one.',
    extracts: [
      { id: 'vai', pt: 'Vai', gloss: 'go (an order)' },
      { id: 'estou_farto', pt: 'estou farto', gloss: 'I’m fed up' },
    ],
    branches: [
      { pt: 'Vai para casa.', en: 'Go home.' },
      { pt: 'Estou farto disto.', en: 'I’m fed up with this.' },
      { pt: 'Vai com calma.', en: 'Take it easy.' },
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Oh for God’s sake — I forgot.',
    meaning_en: 'The all-purpose explosion, followed by the reason for it.',
    pt_natural: 'Foda-se, esqueci-me.',
    literal_note: 'FODA-SE is a verb with a pronoun stuck on the back of it. So is ESQUECI-ME. Same machinery, very different reputations.',
    semantic_bridge:
      'The famous half is FODA-SE. The half you will use every day is ESQUECI-ME. They are built identically — verb, hyphen, little pronoun — and once you can see that hyphen you can take apart half of spoken Portuguese.',
    subtext: 'Frustration at the situation, not at a person. Nobody is being insulted here.',
    extracts: [
      { id: 'foda_se', pt: 'Foda-se', gloss: 'for f***’s sake' },
      { id: 'esqueci_me', pt: 'esqueci-me', gloss: 'I forgot' },
    ],
    branches: [
      { pt: 'Esqueci-me do telemóvel.', en: 'I forgot my phone.' },
      { pt: 'Desculpa, esqueci-me.', en: 'Sorry, I forgot.' },
      { pt: 'Foda-se, outra vez!', en: 'For f***’s sake, again!' },
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
        pt: 'Foda-se!', en: 'For f***’s sake!', signal: 'direct',
        register: 'THE REAL ONE',
        when: 'Among friends, at the football, alone in the car when something goes wrong.',
        risk: 'This is as strong as Portuguese gets. Not at work, not with anyone’s parents, not in a shop.',
      },
      {
        pt: 'Fogo!', en: 'For crying out loud!', signal: 'softened',
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'Sod it. I’m going anyway.',
    meaning_en: 'Writing something off, and carrying on regardless.',
    pt_natural: 'Que se foda, vou na mesma.',
    literal_note: 'Notice the SE has moved. In “foda-se” it sits behind the verb; after QUE it jumps in front. That is a rule, not an accident.',
    semantic_bridge:
      'QUE SE FODA is a dismissal, and NA MESMA is the shrug that follows it — “all the same”, “anyway”. NA MESMA survives long after you stop wanting the first half.',
    subtext: 'Not anger. A decision, made out loud, that something no longer gets a vote.',
    extracts: [
      { id: 'que_se_foda', pt: 'Que se foda', gloss: 'sod it' },
      { id: 'na_mesma', pt: 'na mesma', gloss: 'anyway / all the same' },
    ],
    branches: [
      { pt: 'Vou na mesma.', en: 'I’m going anyway.' },
      { pt: 'Obrigado na mesma.', en: 'Thanks anyway.' },
      { pt: 'Que se foda, vamos.', en: 'Sod it, let’s go.' },
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'What the hell is this?',
    meaning_en: 'Genuine confusion, expressed at volume.',
    pt_natural: 'Que caralho é isto?',
    literal_note: 'The same word, with DO in front of it, means the exact opposite. Isto é do caralho = this is brilliant.',
    semantic_bridge:
      'QUE ___ É ISTO? is a fixed frame with one swappable slot. Drop in caralho and you are furious; drop in raio and you are merely baffled. ISTO — “this” — is the piece you will use hourly.',
    subtext: 'Aimed at the object, not the person. Pointed at a person it becomes a challenge.',
    extracts: [
      { id: 'que_caralho', pt: 'Que caralho', gloss: 'what the f***' },
      { id: 'isto', pt: 'isto', gloss: 'this' },
    ],
    branches: [
      { pt: 'O que é isto?', en: 'What is this?' },
      { pt: 'Isto é do caralho!', en: 'This is bloody brilliant!' },
      { pt: 'Que caralho estás a fazer?', en: 'What the f*** are you doing?' },
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
        pt: 'Que caralho é isto?', en: 'What the f*** is this?', signal: 'direct',
        register: 'ANGRY AND UNFILTERED',
        when: 'You are genuinely annoyed, among people who swear back at you.',
        risk: 'Pointed at a stranger this is the opening of a fight, not a question.',
      },
      {
        pt: 'Que raio é isto?', en: 'What on earth is this?', signal: 'softened',
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'I feel like crap today.',
    meaning_en: 'Today, specifically, you are not at your best.',
    pt_natural: 'Hoje estou uma merda.',
    literal_note: 'ESTOU, not É. É would mean you are permanently rubbish, which is a different and much sadder sentence.',
    semantic_bridge:
      'Portuguese has two words for “is”. ESTOU is how things happen to be right now; É is how things simply are. The same insult swings between them: hoje ESTOU uma merda is a bad day, o filme É uma merda is a review.',
    subtext: 'Ordinary, unremarkable complaining. This is closer to “rough” than to obscene.',
    extracts: [
      { id: 'uma_merda', pt: 'uma merda', gloss: 'crap / rubbish' },
      { id: 'hoje', pt: 'Hoje', gloss: 'today' },
    ],
    branches: [
      { pt: 'Hoje não.', en: 'Not today.' },
      { pt: 'O filme é uma merda.', en: 'The film is crap.' },
      { pt: 'Isto é uma merda.', en: 'This is rubbish.' },
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
    root_type: 'other',
    source_label: 'Portuguese television, with the subtitles on',
    source_status: 'paraphrased',
    root_display: 'You absolute bastard.',
    meaning_en: 'Said to a close friend, this is nearly affectionate. Said to anyone else, it is not.',
    pt_natural: 'És um grande cabrão.',
    literal_note: 'GRANDE means “big”, but in front of the noun it stops meaning size and starts meaning “utter”.',
    semantic_bridge:
      'Everything in this sentence agrees with who you are talking to. Um becomes uma, cabrão becomes cabra. The frame É S UM GRANDE ___ is the same one you use for compliments — és um grande amigo.',
    subtext: 'Register does all the work. Between friends it is warmth; anywhere else it is a genuine insult.',
    extracts: [
      { id: 'grande', pt: 'grande', gloss: 'utter / total (in front of the word)' },
      { id: 'cabrao', pt: 'cabrão', gloss: 'bastard' },
    ],
    branches: [
      { pt: 'És uma grande cabra.', en: 'You’re an utter cow.' },
      { pt: 'És um grande amigo.', en: 'You’re a great friend.' },
      { pt: 'Que grande merda.', en: 'What an utter mess.' },
      { pt: 'Que cabrão!', en: 'What a bastard!' },
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
        pt: 'És um grande cabrão.', en: 'You absolute bastard.', signal: 'direct',
        register: 'ONLY WITH PEOPLE WHO LAUGH',
        when: 'Between close friends, after something outrageous, this is almost a compliment.',
        risk: 'Misjudge the friendship and this one does not come back. There is no gentle version of it.',
      },
      {
        pt: 'És um grande chato.', en: 'You’re a total pain.', signal: 'warm',
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

export const ROOTS: Root[] = [
  ...TOP_GUN,
  ...JAMES_BOND,
  ...BRIDGET_JONES,
  ...PULP_FICTION,
  ...AUDREY_HEPBURN,
  ...MARCUS_AURELIUS,
  ...SWEARING,
]

export const ROOTS_BY_FAMILY: Record<CultureFamily, Root[]> = {
  top_gun: TOP_GUN,
  james_bond: JAMES_BOND,
  bridget_jones: BRIDGET_JONES,
  pulp_fiction: PULP_FICTION,
  audrey_hepburn: AUDREY_HEPBURN,
  marcus_aurelius: MARCUS_AURELIUS,
  portuguese_swearing: SWEARING,
}

export function rootById(id: string): Root | undefined {
  return ROOTS.find((r) => r.root_id === id)
}

/** Every distinct piece the graph can teach, and where it first comes from. */
export const PIECES: Record<string, { pt: string; gloss: string; family: CultureFamily }> =
  (() => {
    const out: Record<string, { pt: string; gloss: string; family: CultureFamily }> = {}
    for (const root of ROOTS) {
      for (const e of root.extracts) {
        out[e.id] ??= { pt: e.pt, gloss: e.gloss, family: root.culture_family }
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
]
