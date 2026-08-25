import { PIECES, type Rung } from './roots'

/**
 * Your Legend — the minute about yourself you can deliver without thinking.
 *
 * Not a feature with a tile. It is the answer to "what will this actually do for me",
 * which DUB has never had: Duolingo promises progress, whose unit of value is the day you
 * did not break; DUB promises READINESS, and readiness has an obvious test that progress
 * does not — can you do it, in a room, with a person, right now.
 *
 * The sequencing is the real argument. Confidence first, then receptivity. A learner who
 * has once got through a real exchange without switching to English will try the other
 * four hundred words they half-know. A learner who never speaks will not, however many
 * words they have banked.
 *
 * WHY IT BELONGS IN DUB SPECIFICALLY. Take one real legend apart word by word and half
 * of it is already taught, across eight different crates: `tenho` is a Duran Duran song
 * about being hungry, `chamam` is Pulp Fiction, `mudar` is Marcus Aurelius, and `estou
 * farto` — the exact phrase for fed up of England — is the swearing crate. That is the
 * compounding claim, which is the thing DUB exists to prove, demonstrated on the most
 * personal material a learner has. The Legend is not bolted to the side. It is what the
 * crates were for.
 *
 * Three traps this model exists to avoid:
 *
 *   It becomes an essay. Nobody delivers a paragraph at a bar, and a memorised speech
 *   collapses the moment you are asked something slightly different. So it is a DECK OF
 *   ANSWERS to questions you will actually be asked. Answers survive contact.
 *
 *   It becomes a form. Ten blank fields is a UCAS application. So it is one card at a
 *   time, each paying out immediately, with the same rhythm as a root.
 *
 *   It produces identical robots. So every card is a choice, not a blank.
 */

export type SlotKind = 'name' | 'number' | 'place' | 'pick'

export interface LegendSlot {
  key: string
  kind: SlotKind
  /** What to show in the empty field. Never a value — a shape. */
  hint: string
  /** For `pick`: the closed set. Gendered options carry both endings. */
  options?: { value: string; en: string; f?: string }[]
  /** True when the answer's ending depends on profile.gender. */
  gendered?: boolean
}

export interface LegendFrame {
  id: string
  /** The question this answers. Cards are ordered by the order you get asked. */
  card: number
  /** The Portuguese question you will actually hear. */
  ask: string
  ask_en: string
  /** Authored, lint-checked. `{slot}` marks where the learner's own words go. */
  frame: string
  en: string
  slots: LegendSlot[]
  /**
   * The piece ids this frame is built from.
   *
   * Load-bearing in three places: the provenance line ("TENHO came out of a Duran Duran
   * song about being hungry"), the unlock thread, and the lint that stops a frame
   * shipping with a piece that does not exist.
   */
  built_from: string[]
  rung: Rung
  /**
   * The scaffolding words, glossed — exactly as a root does it.
   *
   * A frame is short by design, but it still needs the small words that hold an answer
   * together, and the promise of the Legend is that it is made of language the learner
   * owns. So anything in the frame that no piece teaches is glossed here and shown on
   * the card, and lint:content fails a frame with an unglossed word in it.
   */
  helpers?: Record<string, string>
  /**
   * The lesson this card teaches, before it asks for anything.
   *
   * The builder used to require you to own the words before the card would open, which
   * made it a form: two text inputs and a set of chips. Now the card is a small root of
   * its own — here is the pattern, here is why Portuguese does it this way — and the
   * words arrive at the moment you need them rather than months earlier in a crate.
   *
   * Written like a semantic bridge, because that is what it is.
   */
  teaches: string
}

/**
 * The ten cards, in roughly the order you get asked them.
 *
 * Ten is the cap. A legend longer than a minute is one you will not deliver. And the deck
 * GROWS rather than arriving whole — you start with the cards your language already
 * reaches, which after one crate is one or two, and the rest unlock as crates feed them.
 * That is what makes the thread work, and it means the Legend is never a blank form and
 * never a finished thing.
 */
export const LEGEND_FRAMES: LegendFrame[] = [
  {
    id: 'name',
    card: 1,
    ask: 'Como te chamas?',
    ask_en: 'What are you called?',
    frame: 'Chamo-me {name}.',
    en: 'My name is {name}.',
    slots: [{ key: 'name', kind: 'name', hint: 'your name' }],
    built_from: ['chamo_me'],
    rung: 1,
    teaches:
      'Chamo-me is literally “I call myself”, which is how Portuguese introduces people — the verb hangs on you rather than on your name. It works everywhere, from a doorstep to a dinner table.'
  },
  {
    id: 'origin',
    card: 2,
    ask: 'De onde és?',
    ask_en: 'Where are you from?',
    frame: 'Sou {nationality}. Sou de {place}.',
    en: 'I am {nationality}. I am from {place}.',
    slots: [
      {
        key: 'nationality',
        kind: 'pick',
        hint: 'where you are from',
        gendered: true,
        options: [
          { value: 'inglês', f: 'inglesa', en: 'English' },
          { value: 'escocês', f: 'escocesa', en: 'Scottish' },
          { value: 'galês', f: 'galesa', en: 'Welsh' },
          { value: 'irlandês', f: 'irlandesa', en: 'Irish' },
          { value: 'americano', f: 'americana', en: 'American' },
        ],
      },
      { key: 'place', kind: 'place', hint: 'your town or city' },
    ],
    built_from: ['sou', 'ingles'],
    rung: 1,
    helpers: { de: 'from' },
    teaches:
      'Sou is the permanent one: what you are and where you are from, the things that do not change by Tuesday. Nationalities take an ending like every other description — inglês if you are a man, inglesa if you are a woman.'
  },
  {
    id: 'age',
    card: 3,
    ask: 'Que idade tens?',
    ask_en: 'How old are you?',
    frame: 'Tenho {n} anos.',
    en: 'I am {n} years old.',
    slots: [{ key: 'n', kind: 'number', hint: 'your age' }],
    built_from: ['tenho', 'anos'],
    rung: 2,
    teaches:
      'The one every English speaker gets wrong exactly once. Portuguese does not BE an age, it HAS one — tenho cinquenta e seis anos, “I have fifty-six years”. Say sou and you have said “I am fifty-six”, which means nothing at all.'
  },
  {
    id: 'married',
    card: 4,
    ask: 'És casado?',
    ask_en: 'Are you married?',
    frame: 'Sou {status}.',
    en: 'I am {status}.',
    slots: [
      {
        key: 'status',
        kind: 'pick',
        hint: 'how things stand',
        gendered: true,
        options: [
          { value: 'casado', f: 'casada', en: 'married' },
          { value: 'divorciado', f: 'divorciada', en: 'divorced' },
          { value: 'solteiro', f: 'solteira', en: 'single' },
          { value: 'separado', f: 'separada', en: 'separated' },
        ],
      },
    ],
    built_from: ['sou', 'casado'],
    rung: 2,
    teaches:
      'All three answers are descriptions, so all three take an ending: casado or casada, solteiro or solteira, divorciado or divorciada. And they go with sou rather than estou — Portuguese files this under what you are, not how you are today.'
  },
  {
    id: 'children',
    card: 5,
    ask: 'Tens filhos?',
    ask_en: 'Do you have children?',
    frame: 'Tenho {n}. Chamam-se {names}.',
    en: 'I have {n}. They are called {names}.',
    slots: [
      { key: 'n', kind: 'number', hint: 'how many' },
      { key: 'names', kind: 'name', hint: 'their names' },
    ],
    /*
      The showcase card, and the reason its rung is honest rather than convenient.

      TENHO came out of a Duran Duran song about being hungry and CHAMAM came out of Pulp
      Fiction — neither was ever about the learner's children. That is the compounding
      claim on the most personal material there is, and it is worth the card arriving
      later than the ones around it. Frames unlock on OWNED PIECES, not on rung, so this
      opens the moment somebody has been through Pulp Fiction.
    */
    built_from: ['tenho', 'filhos', 'chamam'],
    rung: 5,
    helpers: { 'Chamam-se': 'they are called' },
    teaches:
      'Tenho again, doing exactly what it did with your age: you HAVE children, you do not be them. Chamam-se is chamo-me turned round to point at other people — the same verb, aimed outwards.'
  },
  {
    id: 'children_doing',
    card: 6,
    ask: 'E o que fazem?',
    ask_en: 'And what do they do?',
    frame: 'O {name} está na universidade. Os outros ainda andam na {place}.',
    en: '{name} is at university. The others are still at {place}.',
    slots: [
      { key: 'name', kind: 'name', hint: 'one of them' },
      { key: 'place', kind: 'place', hint: 'school, or work' },
    ],
    built_from: ['esta_', 'o_meu', 'ainda', 'escola'],
    rung: 3,
    helpers: { universidade: 'university', outros: 'the others', andam: 'go / are' },
    teaches:
      'Ser and estar side by side on your own family, which is the one example nobody forgets. Está na universidade is where somebody is RIGHT NOW; it would be é if it were what they are forever.'
  },
  {
    id: 'work',
    card: 7,
    ask: 'O que fazes?',
    ask_en: 'What do you do?',
    frame: 'Trabalho com {thing}.',
    en: 'I work with {thing}.',
    slots: [{ key: 'thing', kind: 'place', hint: 'what your work is' }],
    built_from: ['trabalho'],
    rung: 2,
    teaches:
      'Trabalho is both the verb and the noun — I work, and the work. Portuguese leaves context to sort it out and context always does. Trabalho com is the natural way in: I work WITH, rather than I work as.'
  },
  {
    id: 'how_long',
    card: 8,
    ask: 'Há quanto tempo estás cá?',
    ask_en: 'How long have you been here?',
    frame: 'Mudei-me há {n} meses.',
    en: 'I moved here {n} months ago.',
    slots: [{ key: 'n', kind: 'number', hint: 'how many months' }],
    built_from: ['mudar'],
    rung: 6,
    helpers: { 'Mudei-me': 'I moved', 'há': 'ago', meses: 'months' },
    teaches:
      'Há is what Portuguese uses for time gone by: há dois meses is “two months ago”. It looks like the verb to have, and historically it is — the language treats elapsed time as something the world is holding.'
  },
  {
    id: 'why_here',
    card: 9,
    ask: 'Porquê Portugal?',
    ask_en: 'Why Portugal?',
    /*
      Shorter than the worked example on purpose. "Porque quero fazer as coisas que
      adoro" is lovely and needs a rung-5 piece; this says the same thing, arrives three
      rungs earlier, and is easier to deliver — which is the entire point of a Legend.
    */
    frame: 'Porque quero fazer o que adoro.',
    en: 'Because I want to do what I love.',
    slots: [],
    built_from: ['porque', 'quero', 'adoro'],
    rung: 2,
    helpers: { fazer: 'to do', 'o que': 'what' },
    teaches:
      'Porque without an accent starts an answer; porquê with one asks the question. Two spellings, one sound, and getting it right is the small thing that makes writing look native.'
  },
  {
    id: 'portuguese',
    card: 10,
    ask: 'Falas português?',
    ask_en: 'Do you speak Portuguese?',
    frame: 'Estou a aprender. Falo pouco, mas estou a tentar.',
    en: 'I am learning. I speak little, but I am trying.',
    slots: [],
    built_from: ['aprender'],
    rung: 1,
    helpers: { Falo: 'I speak', pouco: 'little', mas: 'but', tentar: 'to try' },
    teaches:
      'Estou a aprender is how European Portuguese builds an ongoing action — estou a plus the verb. Brazil says estou aprendendo; here it is estou a aprender, and using the Portuguese one is itself a signal you are learning the right language.'
  },
]

/**
 * The repair kit — the part that actually builds confidence.
 *
 * What ends a conversation is not running out of things to say. It is the moment they
 * answer, you understand nothing, and you switch to English. These four are worth more
 * than the ten cards above, so they are fixed, non-optional, and present for every
 * learner whether or not they have built anything else.
 *
 * The last one is the most important line in the feature. Said early it changes the whole
 * encounter: the other person slows down, drops to simpler Portuguese, and stays IN
 * Portuguese rather than switching to English to be kind.
 */
export const REPAIR_KIT: { pt: string; en: string; why: string; built_from: string[] }[] = [
  {
    pt: 'Desculpe, pode falar mais devagar?',
    en: 'Sorry, could you speak more slowly?',
    why: 'Buys you every sentence after this one, not just the last one.',
    built_from: ['desculpe', 'devagar'],
  },
  {
    pt: 'Não percebi.',
    en: 'I did not catch that.',
    why: 'Says the sentence went past you — friendlier, and truer, than "I do not understand".',
    built_from: ['nao_percebi'],
  },
  {
    pt: 'Como se diz…?',
    en: 'How do you say…?',
    why: 'Turns the person you are talking to into the dictionary. They will always answer.',
    built_from: ['como_se_chama'],
  },
  {
    pt: 'Estou a aprender. Tenha paciência.',
    en: 'I am learning. Bear with me.',
    why: 'The single highest-leverage sentence a beginner owns: it keeps them in Portuguese instead of switching to English to be kind.',
    built_from: ['aprender', 'paciencia'],
  },
]

/**
 * The thread — "you can use this in your Legend".
 *
 * The mechanic that turns a perceived goal into a real one, and it is one pure function
 * because every frame already declares what it is built from. Given what a learner owns
 * and what they have already answered, this is the set of cards their language now
 * reaches and they have not filled in.
 *
 * The ladder answers "what opens the next vibe?" and nothing answered "what is any of
 * this FOR". Now crates open Legend cards, and a Legend is a thing a person can picture
 * themselves using — the first goal in DUB that exists outside the app.
 */
/**
 * How many crates you have to have been through before the Legend opens.
 *
 * The Legend used to unlock card by card, on owning specific pieces — and every one of
 * the eighteen words it depended on was taught in exactly one crate. So "complete your
 * Legend" quietly meant "play these eight specific crates", which is the opposite of
 * picking freely, and two of the cards depended on a word that only exists inside a drop
 * and is therefore unobtainable most of the year.
 *
 * Counting crates instead deletes that entire class of problem rather than solving it.
 * And it is not a lower bar, it is a different one: five is more than the free tier
 * allows, so reaching it means somebody has decided DUB is worth paying for. One rule
 * does the work of a plan check and a vocabulary audit.
 *
 * The words are no longer a precondition. Building a card TEACHES them — which is better
 * pedagogy anyway, because the moment you need to say how old you are is the moment to
 * learn that Portuguese has an age rather than being one.
 */
/**
 * The Legend Card — the seven questions that are just "who are you".
 *
 * The ten frames were never one thing. Seven sit at rung 1–2 (your name, where you are
 * from, your age, married, what you do, why Portugal, whether you speak it) and three
 * need rung 3, 5 and 6. So "complete your Legend" meant "reach the top of the ladder",
 * which is finishing the entire product — far too high a bar for a door, and the reason
 * the Legend read as a destination that never arrived.
 *
 * The seven are the card you hand somebody. The other three are what you build once you
 * are inside.
 */
export const CARD_RUNG = 2
export const LEGEND_CARD = LEGEND_FRAMES.filter((f) => f.rung <= CARD_RUNG)

/**
 * Is the card finished?
 *
 * Deliberately NOT measured with said_cold. That counter is documented as a rehearsal
 * count that is never rendered as a score, because the moment a number is attached to
 * being put on the spot the feature becomes the anxiety it exists to remove — and a gate
 * is the strongest kind of score there is.
 *
 * Cold speech is still what opens the door; it is just measured where it is already
 * measured honestly. The rung only moves on a clean release with nothing on screen, so
 * "reached the rung these cards are written at" IS "has said this kind of thing cold".
 */
export function cardDone(answeredFrameIds: string[]): boolean {
  const done = new Set(answeredFrameIds)
  return LEGEND_CARD.every((f) => done.has(f.id))
}

export function cardToGo(answeredFrameIds: string[]): number {
  const done = new Set(answeredFrameIds)
  return LEGEND_CARD.filter((f) => !done.has(f.id)).length
}

/**
 * The door.
 *
 * `welcomedAt` grandfathers anybody already inside. The rule was attendance before this
 * and some people are in on it; taking membership back off an early member costs more
 * than it can ever earn, and it is the same rule the entitlements take — never remove
 * access somebody already has.
 */
export function clubOpen(opts: {
  answeredFrameIds: string[]
  rung: number
  welcomedAt?: string | null
}): boolean {
  if (opts.welcomedAt) return true
  return cardDone(opts.answeredFrameIds) && opts.rung >= CARD_RUNG
}

export const CRATES_TO_UNLOCK_LEGEND = 5

export function legendUnlocked(sectionsCompleted: string[]): boolean {
  return new Set(sectionsCompleted).size >= CRATES_TO_UNLOCK_LEGEND
}

/** How far off it is, for the one line that says so. */
export function cratesToGo(sectionsCompleted: string[]): number {
  return Math.max(0, CRATES_TO_UNLOCK_LEGEND - new Set(sectionsCompleted).size)
}

export function framesUnlockedBy(owned: string[], answered: string[]): LegendFrame[] {
  const have = new Set(owned)
  const done = new Set(answered)
  return LEGEND_FRAMES.filter(
    (f) => !done.has(f.id) && f.built_from.every((p) => have.has(p)),
  )
}

/** Every card the learner's language reaches, answered or not. Drives the count. */
export function framesReachable(owned: string[]): LegendFrame[] {
  const have = new Set(owned)
  return LEGEND_FRAMES.filter((f) => f.built_from.every((p) => have.has(p)))
}

/**
 * Which crates a frame's words came from — the line that makes this DUB.
 *
 * "TENHO came out of a Duran Duran song about being hungry. CHAMAM came out of Pulp
 * Fiction. Neither was ever about you." It writes itself from built_from, and it is the
 * collision mechanic pointed at the learner's own family.
 */
export function provenanceOf(frame: LegendFrame): { piece: string; family: string }[] {
  const out: { piece: string; family: string }[] = []
  for (const id of frame.built_from) {
    const piece = PIECES[id]
    if (!piece) continue
    if (out.some((o) => o.family === piece.family)) continue
    out.push({ piece: piece.target, family: piece.family })
  }
  return out
}

/** The learner's own words in the frame, with the endings agreeing where they must. */
export function fillFrame(
  frame: LegendFrame,
  values: Record<string, string>,
  gender: 'm' | 'f' | null,
): string {
  return frame.frame.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const raw = values[key]
    if (!raw) return whole
    /*
      The learner's exact word, verbatim.

      The build screen stores the form they actually chose — which is the only way to be
      right when the profile question was skipped and both endings were offered. This
      mapping remains only as a fallback for a record written before that, where the
      masculine was stored and the profile says otherwise. It never overrides a feminine
      form the learner picked, because that lookup simply does not match.
    */
    const slot = frame.slots.find((s) => s.key === key)
    if (slot?.kind === 'pick' && slot.gendered && gender === 'f') {
      const option = slot.options?.find((o) => o.value === raw)
      return option?.f ?? raw
    }
    return raw
  })
}

/** Has this card been filled in? A slot left empty means the card is not in the run. */
export function isAnswered(frame: LegendFrame, values: Record<string, string> | undefined): boolean {
  if (!values) return false
  return frame.slots.every((s) => Boolean(values[s.key]?.trim()))
}

export const LEGEND_COPY = {
  name: 'Your Legend',
  /*
    The spy framing earns exactly one line and then gets out of the way. Played straight
    it is a good idea; played for laughs it is a gimmick, and the learner is doing
    something genuinely difficult. Dry, not jokey — and it says plainly, once, that yours
    is true, or the metaphor curdles.
  */
  what: 'The minute about yourself you can say without thinking.',
  spy: 'An operative learns a legend until it comes out without being assembled — because hesitation is what gives you away. Yours is the same idea and all of it is true.',
  offer_head: 'You have enough Portuguese to start your Legend.',
  offer_body:
    'Not a form and not a speech — a handful of answers to the questions you will actually be asked. One at a time, and any of them can stay empty.',
  offer_repair:
    'It also comes with the four lines that keep a conversation going when you have not understood a word — those are yours straight away, whether or not you fill anything in.',
  offer_cta: 'START MY LEGEND',
  /**
   * Before the Legend can be built, cards are BANKED, not opened.
   *
   * Two different things were both called unlocked: having the vocabulary for a card,
   * and having done the five crates that make the Legend usable. The session screen used
   * the first and said "2 Legend cards just opened", with a button reading FILL THEM IN
   * — and the Legend itself then said "one more vibe and these open". The product
   * contradicted itself one tap apart, and the tap was the reward moment.
   *
   * Banking is the honest word and it is also the better hook: you can see what you have
   * earned without being told you can spend it.
   */
  banked_one: 'One more Legend card banked.',
  banked_many: 'Legend cards banked.',
  banked_note_one: 'They open after one more vibe.',
  banked_note_many: 'They open once you have done five vibes.',
  banked_cta: 'SEE WHAT IS WAITING',
  offer_later: 'Not now',
  repair_head: 'The four that keep a conversation going',
  repair_body:
    'What ends a conversation is not running out of things to say. It is the moment they answer, you catch nothing, and you switch to English. These are yours whether or not you build anything else.',
  cold_head: 'No warning.',
  cold_body: 'One question, and a beat of silence. That silence is the thing you are practising.',
  locked_head: 'Ten questions a stranger will ask you.',
  locked_body:
    'They are not a form — each one is a short lesson built round your own answer, and you keep what it teaches. The vibes are where you get the language to build them.',
  empty_head: 'Nothing here yet.',
  empty_body:
    'Your Legend fills up as the vibes feed it. Open one and the first cards will be waiting.',
} as const
