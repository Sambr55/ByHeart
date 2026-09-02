import { say } from './numbers'
import { PIECES, type Rung } from './roots'
import type { Purpose } from './situations'

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

export type SlotKind = 'name' | 'number' | 'place' | 'pick' | 'children'

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
  /**
   * Who is asked this, or everybody when absent.
   *
   * What a stranger asks you genuinely differs by why you are here. "Onde moras?" is the
   * second thing anybody says to somebody who has moved and is meaningless to a person on
   * a four-day holiday; "Quanto tempo ficas?" is the reverse. A single set of seven has to
   * be the intersection of three lives, and the intersection of three lives is small talk.
   *
   * THE HARD CONSTRAINT: every purpose's card is exactly CARD_SIZE. Seven is promised on
   * the front door, in the explainer and on the deck, and a card that is six for a visitor
   * and eight for a mover breaks the only promise this product makes about how long the
   * work takes. scripts/purpose-check.mts fails if any set is not seven.
   */
  purposes?: Purpose[]
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
   * Only ask this if another card was answered a particular way.
   *
   * "E o que fazem?" — and what do they do — is a question about children, and it was
   * asked of everybody. Somebody with no children was handed a sentence about theirs.
   */
  requires?: { frame: string; slot: string; notOneOf: string[] }
  /**
   * The frame changes with the answer.
   *
   * "Tenho {n}. Chamam-se {names}." assumed you had children, and more than one of them.
   * A frame that only fits one shape of life is not a Legend, it is somebody else's.
   * When a slot's chosen value has its own `frame`, it replaces this one.
   */
  variants?: Record<string, { frame: string; en: string; slots?: LegendSlot[] }>
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
    /*
     Off the card, and still answerable.

     Seven is the promise, and two of the seven now depend on why somebody is here — so two
     universal frames had to give up their place. Age went first: it is asked, but nobody
     has ever failed a conversation in a bar for not knowing how to say how old they are,
     and it is the one question on the list a person might actively prefer not to answer.
    */
    purposes: [],
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
    /*
      Your children, not a count of them.

      This asked "how many" from a fixed list, and then only had names for one son or one
      daughter — so anybody with two got "Tenho dois filhos." and no names at all, and
      anybody with two girls got the masculine plural. A frame that only fits one shape of
      life is not a Legend, it is somebody else's, and a picker of counts is that same
      mistake wearing a smaller hat.

      So the answer is a list: a name, a boy or a girl, and an age if they want to give
      one. The sentence is composed from it — the count agrees (duas filhas, not dois
      filhos), the names are theirs, and every clause only appears when there is something
      to put in it. See `childrenSentence`.
    */
    frame: 'Não tenho filhos.',
    en: 'I do not have children.',
    slots: [{ key: 'kids', kind: 'children', hint: 'your children' }],
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
    /*
      The composed sentence brings its own words with it, and the lint caught two the card
      was about to use without teaching: `filhas` and `duas`.

      `duas` is the good one. Portuguese bends the NUMBER as well as the noun — two
      daughters is duas filhas, not dois — and a learner meeting that on a card about their
      own children will never need telling twice.
    */
    helpers: {
      'Chama-se': 'he is / she is called',
      'Chamam-se': 'they are called',
      filho: 'son',
      filha: 'daughter',
      filhos: 'children',
      filhas: 'daughters — when they all are',
      duas: 'two, when what you are counting is feminine',
      'Têm': 'they are',
    },
    teaches:
      'Tenho again, doing exactly what it did with your age: you HAVE children, you do not be them. Chamam-se is chamo-me turned round to point at other people — the same verb, aimed outwards.'
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
    /*
      A reason you pick, not a reason we picked.

      This was a fixed sentence with no slots — "because I want to do what I love" — put
      in the learner's mouth on the card that is meant to be most theirs. It also could
      never be answered, because isAnswered wants every slot filled and a frame with no
      slots never gets a values entry: the Club counted it as outstanding forever.
    */
    frame: 'Porque {reason}.',
    en: 'Because {reason}.',
    slots: [
      {
        key: 'reason',
        kind: 'pick',
        hint: 'your reason',
        options: [
          { value: 'quero fazer o que adoro', en: 'I want to do what I love' },
          { value: 'o trabalho trouxe-me cá', en: 'work brought me here' },
          { value: 'quero uma vida mais calma', en: 'I want a calmer life' },
          { value: 'alguém que amo está cá', en: 'someone I love is here' },
          { value: 'quero recomeçar', en: 'I want to start again' },
        ],
      },
    ],
    built_from: ['porque', 'quero', 'adoro'],
    rung: 2,
    helpers: { Porque: 'because' },
    teaches:
      'Porque without an accent starts an answer; porquê with one asks the question. Two spellings, one sound, and getting it right is the small thing that makes writing look native.'
  },
  {
    /*
      NOT REVIEWED — mine, unseen by a native speaker.

      And rebuilt once already, by the lint. The first version was "Fico cá uma semana",
      which needs `fico` and `cá`, and neither is a piece a learner owns at this rung: the
      frame would have sat on the card asking for language nobody had. That is exactly what
      built_from is for, and it is a better constraint than it looks — the natural answer to
      "quanto tempo ficas?" is not a sentence anyway. It is "uma semana."

      A fourth frame, `lives` — Moro em {area} — was written and then dropped for the same
      reason. There is no `moro` and no `em` in the inventory, and inventing a piece to prop
      up a frame would put the tail before the dog. It wants a root that hands over "moro",
      and that is a content job with the reviewer, not a tagging job here.
    */
    id: 'staying_for',
    /* The single most asked question of somebody who has just arrived. */
    purposes: ['visiting'],
    card: 11,
    ask: 'Quanto tempo ficas?',
    ask_en: 'How long are you staying?',
    frame: '{how_long}.',
    en: '{how_long}.',
    slots: [
      {
        key: 'how_long',
        kind: 'pick',
        hint: 'how long',
        options: [
          { value: 'Uns dias', en: 'A few days' },
          { value: 'Uma semana', en: 'A week' },
          { value: 'Duas semanas', en: 'Two weeks' },
          { value: 'Um mês', en: 'A month' },
        ],
      },
    ],
    built_from: ['um', 'semana'],
    rung: 2,
    helpers: { uma: 'a', semana: 'week' },
    teaches:
      'Nobody answers this with a sentence. "Uma semana" on its own is the whole reply, and trying to build a full one is the tell that you are translating in your head.',
  },
  {
    id: 'first_time',
    /* Asked of anybody who is plainly not from here, and never of a resident. */
    purposes: ['staying'],
    card: 12,
    ask: 'É a primeira vez?',
    ask_en: 'Is this your first time?',
    frame: '{answer}.',
    en: '{answer}.',
    slots: [
      {
        key: 'answer',
        kind: 'pick',
        hint: 'first time?',
        options: [
          { value: 'Sim, a primeira vez', en: 'Yes, my first time' },
          { value: 'Não, já cá estive', en: 'No, I have been here before' },
          { value: 'Não, venho todos os anos', en: 'No, I come every year' },
        ],
      },
    ],
    built_from: ['sim', 'nao'],
    rung: 2,
    helpers: { já: 'already', 'todos os anos': 'every year' },
    teaches:
      'Sim and não are the two words you already own, and this is the first question where the interesting answer is the long one — "não, já cá estive" is what turns a transaction into a conversation.',
  },
  {
    id: 'moved_when',
    /* Only somebody who has moved has an answer to this that is not a holiday. */
    purposes: ['moving'],
    card: 13,
    ask: 'Há quanto tempo estás cá?',
    ask_en: 'How long have you been here?',
    frame: 'Há {how_long}.',
    en: '{how_long} ago.',
    slots: [
      {
        key: 'how_long',
        kind: 'pick',
        hint: 'how long',
        options: [
          { value: 'uns meses', en: 'A few months' },
          { value: 'um ano', en: 'A year' },
          { value: 'dois anos', en: 'Two years' },
          { value: 'muitos anos', en: 'Many years' },
        ],
      },
    ],
    built_from: ['dois', 'anos'],
    rung: 2,
    helpers: { Há: 'for / ago', anos: 'years' },
    teaches:
      'Há is what Portuguese uses for elapsed time, and it is the answer on its own: "há dois anos" is both "two years ago" and "for two years". The language treats time gone by as something the world is holding.',
  },
  {
    id: 'portuguese',
    card: 10,
    ask: 'Falas português?',
    ask_en: 'Do you speak Portuguese?',
    /* Slotless for the same reason and with the same consequence: never answerable. */
    frame: 'Estou a aprender. {much}',
    en: 'I am learning. {much}',
    slots: [
      {
        key: 'much',
        kind: 'pick',
        hint: 'how it is going',
        options: [
          { value: 'Falo pouco, mas estou a tentar.', en: 'I speak little, but I am trying.' },
          { value: 'Ainda não falo muito.', en: 'I do not speak much yet.' },
          { value: 'Percebo mais do que falo.', en: 'I understand more than I speak.' },
        ],
      },
    ],
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

/** Seven, everywhere, for everybody. See LegendFrame.purposes. */
export const CARD_SIZE = 7

/** Applies to this learner: untagged frames are for everybody, as most of them are. */
export function frameForPurpose(f: LegendFrame, purpose: Purpose | null): boolean {
  return !f.purposes || !purpose || f.purposes.includes(purpose)
}

/**
 * The seven questions on this learner's card.
 *
 * Was `rung <= CARD_RUNG`, which was fine while every frame applied to everybody. Now that
 * two of the seven depend on why somebody is here, the card is the reachable frames that
 * apply to them — and it is asserted to be seven rather than assumed to be, because the
 * moment it silently becomes six the deck starts promising a finish line it will reach
 * early.
 *
 * A learner who has not answered the purpose question yet gets the visiting set. It is the
 * most universally true of the three — everybody is, at first, somebody who has recently
 * arrived — and it is replaced the moment they say otherwise.
 */
export function cardFor(purpose: Purpose | null): LegendFrame[] {
  const use = purpose ?? 'visiting'
  return LEGEND_FRAMES.filter((f) => f.rung <= CARD_RUNG && frameForPurpose(f, use))
}

/** The universal seven, for the places that ask before a purpose exists. */
export const LEGEND_CARD = cardFor(null)

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
/*
  Cards that do not apply are not outstanding.

  The Club said "two questions left" to somebody who had answered everything, because
  two frames had no slots at all — isAnswered wants every slot filled and a slotless
  frame never gets a values entry, so they could never be completed by anybody. Both have
  real choices now, and this skips any card whose condition is unmet so the same thing
  cannot happen again through a different door.
*/
export function cardDone(
  answeredFrameIds: string[],
  answers: { frame_id: string; values: Record<string, string> }[] = [],
  purpose: Purpose | null = null,
): boolean {
  return cardToGo(answeredFrameIds, answers, purpose) === 0
}

/**
 * How many of this learner's seven are still outstanding.
 *
 * Takes the purpose because the seven are not the same seven for everybody — see cardFor.
 * Defaulting to null keeps every existing caller correct rather than silently measuring a
 * mover against a visitor's card: null yields the universal set, which is what those
 * callers were asking for before there was a choice.
 */
export function cardToGo(
  answeredFrameIds: string[],
  answers: { frame_id: string; values: Record<string, string> }[] = [],
  purpose: Purpose | null = null,
): number {
  const done = new Set(answeredFrameIds)
  return cardFor(purpose).filter((f) => frameApplies(f, answers) && !done.has(f.id)).length
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
  /**
   * Which seven this learner's card is.
   *
   * Absent means the universal set, which is right for every caller that asks the question
   * before a purpose exists — and wrong to leave absent in the Club and the Legend, where
   * the learner has one and being measured against somebody else's card would either open
   * the door early or refuse to open it at all.
   */
  purpose?: Purpose | null
  /** The answers themselves, because a card can be conditional on another card's. */
  answers?: { frame_id: string; values: Record<string, string> }[]
  rung: number
  welcomedAt?: string | null
}): boolean {
  if (opts.welcomedAt) return true
  return (
    cardDone(opts.answeredFrameIds, opts.answers ?? [], opts.purpose ?? null) &&
    opts.rung >= CARD_RUNG
  )
}

export const CRATES_TO_UNLOCK_LEGEND = 5

export function legendUnlocked(sectionsCompleted: string[]): boolean {
  return new Set(sectionsCompleted).size >= CRATES_TO_UNLOCK_LEGEND
}

/** How far off it is, for the one line that says so. */
export function cratesToGo(sectionsCompleted: string[]): number {
  return Math.max(0, CRATES_TO_UNLOCK_LEGEND - new Set(sectionsCompleted).size)
}

/**
 * Where somebody stands with their Legend. The ONLY answer to that question.
 *
 * There were two, and they disagreed. The Legend used to open card by card, on owning
 * the specific words a card is built from — deliberately deleted, because every one of
 * the eighteen words was taught in exactly one vibe, so "unlock your Legend" quietly
 * meant "play these eight particular vibes", and two cards hung on a word that only
 * exists inside a drop. It counts vibes now, and every card opens at once.
 *
 * The session screen and the Club were never told. They kept announcing cards unlocked
 * by WORDS — "two Legend cards just opened" — which the Legend had no concept of, so a
 * learner tapped through to a wall. Both screens were internally correct and they were
 * running different products.
 *
 * So it is answered in one place, and framesUnlockedBy/framesReachable are deleted
 * rather than deprecated. A model nobody can call is a model that cannot come back.
 */
export interface LegendStatus {
  open: boolean
  /** Vibes still needed. Zero when open. */
  toGo: number
  /** Cards that can be built right now — all of them, or none. */
  openCards: number
}

export function legendStatus(opts: { sectionsCompleted: string[] }): LegendStatus {
  const open = legendUnlocked(opts.sectionsCompleted)
  return {
    open,
    toGo: cratesToGo(opts.sectionsCompleted),
    openCards: open ? LEGEND_FRAMES.length : 0,
  }
}

/** Every card the learner's language reaches, answered or not. Drives the count. */
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
/**
 * One child, as the learner gave them.
 *
 * `age` is optional and stays a string of digits, exactly as the age card does it: stored
 * unambiguously, said as a word. A child with no age given is not an incomplete record, it
 * is somebody who did not want to say.
 */
export interface Child {
  name: string
  g: 'm' | 'f'
  age?: string
}

/** Stored as JSON in one slot, because a repeating answer has no shape a template can hold. */
export function parseChildren(raw: string | undefined | null): Child[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((c): c is Child => Boolean(c) && typeof (c as Child).name === 'string')
      .map((c): Child => ({ name: c.name.trim(), g: c.g === 'f' ? 'f' : 'm', age: c.age }))
  } catch {
    return []
  }
}

/** "Oscar, Tilly e Ted" — the Portuguese list, and its English twin. */
function joinPt(xs: string[]): string {
  return xs.length < 2 ? (xs[0] ?? '') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]
}
function joinEn(xs: string[]): string {
  return xs.length < 2 ? (xs[0] ?? '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]
}

/**
 * The sentence, composed rather than filled.
 *
 * Every clause appears only when there is something to put in it, which is the whole
 * point: no count somebody did not give, no age somebody withheld, and the plural agreeing
 * with who the children actually are. Two girls is `duas filhas` — feminine on the number
 * as well as the noun, which is the mistake a fixed list of options cannot help making.
 */
export function childrenSentence(all: Child[]): { frame: string; en: string } {
  /*
    Filtered here rather than on the way in.

    An unnamed child is a row somebody is still typing into — dropping it at parse time
    meant the editor deleted every blank the moment it was added, so there was nothing to
    type in. It is the sentence that has no use for a child without a name, not the record.
  */
  const kids = all.filter((k) => k.name.trim())
  if (!kids.length) return { frame: 'Não tenho filhos.', en: 'I do not have children.' }
  const names = kids.map((k) => k.name)
  const aged = (k: Child) => Boolean(k.age && /^\d{1,2}$/.test(k.age))

  if (kids.length === 1) {
    const k = kids[0]
    const they = k.g === 'f' ? 'She' : 'He'
    const noun = k.g === 'f' ? 'uma filha' : 'um filho'
    const nounEn = k.g === 'f' ? 'one daughter' : 'one son'
    const age = aged(k) ? ' Tem ' + say(Number(k.age)) + ' anos.' : ''
    const ageEn = aged(k) ? ' ' + they + ' is ' + k.age + '.' : ''
    return {
      frame: 'Tenho ' + noun + '. Chama-se ' + k.name + '.' + age,
      en: 'I have ' + nounEn + '. ' + they + ' is called ' + k.name + '.' + ageEn,
    }
  }

  // Mixed goes masculine, which is what Portuguese does and worth meeting here rather
  // than as a rule: filhas only when every one of them is a girl.
  const girls = kids.every((k) => k.g === 'f')
  const noun = girls ? 'filhas' : 'filhos'
  const count = say(kids.length, girls ? 'f' : 'm')
  const ages = kids.every(aged)
    ? ' Têm ' + joinPt(kids.map((k) => say(Number(k.age)))) + ' anos.'
    : ''
  const agesEn = kids.every(aged)
    ? ' They are ' + joinEn(kids.map((k) => String(k.age))) + '.'
    : ''
  // Spelled out on both sides. "I have 2 daughters" is how a database talks.
  const EN_COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
  return {
    frame: 'Tenho ' + count + ' ' + noun + '. Chamam-se ' + joinPt(names) + '.' + ages,
    en:
      'I have ' + (EN_COUNT[kids.length] ?? String(kids.length)) + ' ' +
      (girls ? 'daughters' : 'children') +
      '. They are called ' + joinEn(names) + '.' + agesEn,
  }
}

export function fillFrame(
  frame: LegendFrame,
  values: Record<string, string>,
  gender: 'm' | 'f' | null,
): string {
  const shape = frameFor(frame, values)
  return shape.frame.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const raw = values[key]
    if (!raw) return whole
    /*
      A number is stored as digits and said as a word.

      The slot keeps "56" because that is unambiguous to store and to compare; every
      sentence it appears in reads "cinquenta e seis", because the point of the card is
      that somebody can SAY it. A Legend with a numeral in it is a Legend nobody can
      read out.
    */
    const numeric = shape.slots.find((s) => s.key === key)
    if (numeric?.kind === 'number' && /^\d+$/.test(raw)) return say(Number(raw))
    /*
      The learner's exact word, verbatim.

      The build screen stores the form they actually chose — which is the only way to be
      right when the profile question was skipped and both endings were offered. This
      mapping remains only as a fallback for a record written before that, where the
      masculine was stored and the profile says otherwise. It never overrides a feminine
      form the learner picked, because that lookup simply does not match.
    */
    const slot = shape.slots.find((s) => s.key === key)
    if (slot?.kind === 'pick' && slot.gendered && gender === 'f') {
      const option = slot.options?.find((o) => o.value === raw)
      return option?.f ?? raw
    }
    return raw
  })
}

/** Has this card been filled in? A slot left empty means the card is not in the run. */
/**
 * The frame as it actually reads for this learner, after their own pick.
 *
 * A variant replaces the frame outright rather than patching it: "I have one son. He is
 * called…" is not "I have {n}. They are called…" with a number swapped in, it is a
 * different sentence with a different verb ending. Trying to express both as one string
 * is how the original ended up assuming three children.
 */
export function frameFor(
  frame: LegendFrame,
  values: Record<string, string> | undefined,
): { frame: string; en: string; slots: LegendSlot[] } {
  /*
    A repeating answer has no shape a template can hold, so this one is composed. Every
    other frame is still a string with slots in it, which is what keeps them lint-checkable.
  */
  const kids = frame.slots.find((s) => s.kind === 'children')
  if (kids) {
    const { frame: f, en } = childrenSentence(parseChildren(values?.[kids.key]))
    return { frame: f, en, slots: frame.slots }
  }
  const chosen = frame.slots.map((s) => values?.[s.key]).find((v) => v && frame.variants?.[v])
  const variant = chosen ? frame.variants?.[chosen] : undefined
  if (!variant) return { frame: frame.frame, en: frame.en, slots: frame.slots }
  // The slot that chose the variant stays — it is the answer — and the variant's own
  // slots follow it.
  const chooser = frame.slots.filter((s) => values?.[s.key] === chosen)
  return { frame: variant.frame, en: variant.en, slots: [...chooser, ...(variant.slots ?? [])] }
}

/**
 * Is this card even for this learner?
 *
 * "And what do they do?" is a question about children and it was asked of everybody.
 * A card whose condition is unmet is not locked or skipped — it is not a card.
 */
export function frameApplies(
  frame: LegendFrame,
  answers: { frame_id: string; values: Record<string, string> }[],
): boolean {
  if (!frame.requires) return true
  const on = answers.find((a) => a.frame_id === frame.requires!.frame)
  if (!on) return false
  const value = on.values[frame.requires.slot]
  return Boolean(value) && !frame.requires.notOneOf.includes(value)
}

export function isAnswered(frame: LegendFrame, values: Record<string, string> | undefined): boolean {
  if (!values) return false
  // The variant's slots, not the base frame's: "none" answers the children card
  // completely, and asking it for the names of children somebody does not have would
  // leave the card permanently outstanding.
  return frameFor(frame, values).slots.every((s) => Boolean(values[s.key]?.trim()))
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
  /** Progress is counted in vibes, because that is what the Legend actually counts. */
  open_head: 'Your Legend is open.',
  one_more: 'One more vibe and your Legend opens.',
  more_to_go: 'more vibes and your Legend opens.',
  banked_note_one: 'They open after one more vibe.',
  banked_note_many: 'They open once you have done five vibes.',
  banked_cta: 'SEE WHAT IS WAITING',
  /**
   * The last step, which did not exist.
   *
   * Somebody finished the seven questions and the Legend said nothing about it, while
   * the Club sat behind a door those seven answers had just opened. The goal of the
   * product had no final move.
   */
  card_done_eyebrow: 'THAT IS YOUR CARD',
  card_done_head: 'You can introduce yourself in Portuguese.',
  card_done_body: 'Which is the whole membership test, and the thing most people never get to. Dub Club — Lisbon is open.',
  card_done_cta: 'GO IN',
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
