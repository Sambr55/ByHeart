import { say } from './numbers'
import { PIECES, ROOTS_BY_FAMILY, type CultureFamily, type Rung } from './roots'
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
  /**
   * For `pick`: the closed set. Gendered options carry both endings.
   *
   * `f_en` FOR WHEN THE ENDING CHANGES WHO IS BEING DESCRIBED.
   *
   * `f` normally agrees an adjective with the SPEAKER — solteiro/solteira, casado/casada
   * — and the English is untouched, because "I am single" is true in either mouth. But
   * `namorado`/`namorada` is not agreement, it is a different person: the ending names the
   * PARTNER'S gender, not the speaker's. Rendering the base English against it told a woman
   * that "Tenho namorada" means "I have a boyfriend", and told anybody who had not given a
   * gender that the two chips they were choosing between meant the same thing.
   *
   * Absent means the English is the same for both forms, which is the usual case.
   */
  options?: { value: string; en: string; f?: string; f_en?: string }[]
  /** True when the answer's ending depends on profile.gender. */
  gendered?: boolean
  /**
   * Options on this slot whose `f` ending describes somebody OTHER than the speaker.
   *
   * A gendered slot filters to the one form that agrees with the learner, which is right
   * for an adjective about them and wrong for a noun about a third person: knowing a
   * learner is a woman tells you she says "solteira", and tells you nothing whatsoever
   * about whether she has a namorado or a namorada. Filtering it anyway took the choice
   * away and assumed the answer — so an option listed here always offers both forms,
   * each with its own English.
   *
   * Keyed by `value` so it names the option rather than a position in the list.
   */
  gendered_names_the_other?: string[]
  /**
   * For `pick`: the list is the common answers, not the only ones.
   *
   * A closed set is right for a nationality and wrong for a profession. Ten fields cover
   * most people and cannot cover everybody — advertising is nobody's nearest neighbour of
   * computers, design or sales — so a slot that says so gets a way to ask the translator
   * for the word and drop it straight in. The string is what the panel puts in its box.
   *
   * Absent means closed, which every other pick slot is.
   */
  open?: string
}

/**
 * The three parts of a Legend.
 *
 * A Legend used to be one flat list of eleven questions, which is fine while they are all
 * about you and stops being fine the moment they are not. "Tens filhos?" is not a question
 * about the learner; "Onde moras?" is a question about the city they are standing in. A
 * flat list makes those the same kind of thing, and they are not.
 *
 * So: who you are, who you are with, and where you are. It is the shape of a real
 * conversation — you introduce yourself, you talk about the people in your life, and then
 * you talk about the place you have both ended up in.
 *
 * THE CONTENT WAS ALREADY THIS SHAPE. Situations carry a `kind` — 20 errands and 8 places
 * are the city, 3 `person` situations and both flirting crates are the people. Nobody had
 * drawn the line between that and the Legend.
 *
 * `you` is the default rather than a required field: every frame that exists today is
 * about the learner, and a frame that forgets to say otherwise should land in the part
 * that asks least of it.
 */
/** A frame is one of the seven, or it is deeper than the seven. */
export type LegendDepth = 'card' | 'deeper'

export type LegendPart = 'you' | 'them' | 'city'

export const LEGEND_PARTS: { id: LegendPart; name: string; what: string; opens: string }[] = [
  /*
    `name` is what the deck calls the section. `what` is the one line under it — what this
    part of a Legend is FOR, in the register the RUNGS table uses: what you will be able to
    do, never what you have not done yet. `opens` is what a part says while it is still
    shut, and it names a conversation rather than a stage.
  */
  {
    id: 'you',
    name: 'About you',
    what: 'The first minute. Who you are, where you are from, what you do.',
    opens: 'The part everybody starts with.',
  },
  {
    id: 'them',
    name: 'About them',
    what: 'The people in your life, and the person opposite you.',
    opens: 'Opens once you can talk about somebody who is not you.',
  },
  {
    id: 'city',
    /*
      {NAME} AND THE CITY — and the braces are the point.

      This was "About the city", which is geography. Sam's: "it's not About the City, it's
      You and the City — we could even play on Sex and the City and frame it as Sam and the
      City, Claire and the City."

      That is the cultural hook the part was missing, and it does something the other two
      names cannot: it puts the learner in the title. Nobody's Legend is about Lisbon. It is
      about what Lisbon is like for them — which café is theirs, how they get about, where
      they ended up living. The name says so before the questions do.

      Filled by the deck from `display_name`, which set-up collects and which a learner may
      decline to give. `nameFor` below handles that honestly rather than rendering a brace
      or an apology.
    */
    name: '{name} and the city',
    what: 'Where you live, how you get about, and what you do here.',
    opens: 'Opens once you can say where you are and how you got there.',
  },
]

/**
 * A part's name, with the learner in it where the name asks for one.
 *
 * Only `city` carries a brace today. A part whose name has no placeholder is returned
 * unchanged, so this is safe to call on all three and there is no second list of which
 * parts are personal.
 *
 * NO NAME IS A REAL STATE. Set-up asks but does not insist, and a learner who declined
 * should not meet a brace, an empty gap, or a nudge to go and fill something in. "You and
 * the city" is true of everybody and reads as deliberate rather than as a fallback.
 */
/**
 * The authored stand-in for a learner's own name, and the one place it is written down.
 *
 * Two branches introduce somebody — "Chamo-me Ana." on tb_introduce and bj_forgot_name —
 * and Sam met his own introduction under a stranger's name: "Thus should be Sam not ana,
 * drawn from my profile."
 *
 * WHY THE NAME IS AUTHORED RATHER THAN A BRACE. '{name}' in the branch was the first
 * attempt and lint-content refused it five times: a branch is not a template. It is a
 * reviewed Portuguese sentence that goes into the audio manifest, the daily line and the
 * QA sheet a native speaker reads, and a placeholder in any of those is not language. Ana
 * has a recording; {name} could never have one.
 *
 * So the swap happens on the way to the screen, and this constant is what makes it safe:
 * one name, stated once, so the renderer is not guessing which words in a sentence are a
 * person. Changing the authored name means changing it here and in the two branches, and
 * the check in scripts/lint-content.ts holds them together.
 */
export const AUTHORED_NAME = 'Ana'

/**
 * That sentence, as this learner would say it.
 *
 * Returns the line untouched when it does not contain the authored name, so it is safe on
 * every branch and there is no second list of which sentences are personal. A learner who
 * declined to give a name keeps Ana rather than meeting a blank — she is a real example
 * with a real recording, which is what she was always for.
 */
export function myName(line: string, displayName?: string | null): string {
  const who = (displayName ?? '').trim()
  return who ? line.replaceAll(AUTHORED_NAME, who) : line
}

/**
 * The question as it would actually be put TO THIS LEARNER.
 *
 * `ask` is what a stranger says to you, and a stranger says it with an ending. "És
 * casado?" is what a man is asked; a woman is asked "És casada?" — so every screen that
 * showed the bare `ask` was teaching a woman to recognise a question nobody will ask her,
 * and reading it aloud in the wrong agreement too.
 *
 * The frame's own answer has agreed with the speaker since the Legend was built. Only the
 * question never did, because nothing pointed at it: the slot machinery handles answers.
 *
 * Declared per frame via `ask_f` rather than derived — same argument as `address` on a
 * branch. Portuguese agreement is not a string transform, and the frames that need it are
 * few enough to write out.
 */
export function askFor(
  frame: { ask: string; ask_f?: string },
  gender?: string | null,
): string {
  return gender === 'f' && frame.ask_f ? frame.ask_f : frame.ask
}

export function nameFor(part: { name: string }, displayName?: string | null): string {
  const who = (displayName ?? '').trim()
  return part.name.replace('{name}', who || 'You')
}

export interface LegendFrame {
  id: string
  /**
   * Which part of the Legend this belongs to. Absent means `you`.
   *
   * Deliberately a tag on the frame rather than a separate list, for the same reason
   * `purposes` is: a frame knows what it is about, and a second structure naming which
   * frames go where is a second thing to keep in step.
   */
  part?: LegendPart
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
  /**
   * The same question put to a woman, where the ending changes.
   *
   * Absent on most frames because most questions do not agree — "Tens filhos?" and "O que
   * fazes?" are the same in any mouth. Present only where a stranger's own wording would
   * differ, and read through `askFor` rather than by any screen directly.
   */
  ask_f?: string
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
  /**
   * ON THE CARD, OR PAST IT. Not a difficulty.
   *
   * This was `rung: Rung`, the same field name a Root carries — and on a Root it means
   * difficulty, which this never did. Seven of the twelve frames declared a rung ABOVE
   * what their own words need (`age` said 5 for rung-2 vocabulary, `who_with` the same),
   * because the number was being used to push a frame off the seven-question card rather
   * than to describe how hard it is. lint-content allows that on purpose: it only fails a
   * frame that declares LOWER than its pieces, so the dial worked and only the name lied.
   *
   * Two values, because there were only ever two: the card you hand a stranger, and what
   * you build once you are inside.
   */
  depth: LegendDepth
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
 * The frames, in roughly the order you get asked them.
 *
 * Not a fixed number — it was "the ten cards" when there were ten, is eleven now, and
 * grows as ABOUT THEM and ABOUT THE CITY are written. Every count shown to a learner is
 * derived from this array or from their own card; none is typed.
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
    depth: 'card',
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
        /*
          The hint names the ANSWER, not the question.

          Both slots on this card said "where you are from" — one wanting a nationality and
          one wanting a town — so the screen asked the same thing twice and then took two
          different kinds of answer. A hint sits above the options a person is choosing
          between, so it has to describe those options rather than restate the ask, which is
          already at the top of the card in both languages.
        */
        hint: 'your nationality',
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
    depth: 'card',
    helpers: { de: 'from' },
    teaches:
      'Sou is the permanent one: what you are and where you are from, the things that do not change by Tuesday. Nationalities take an ending like every other description — inglês if you are a man, inglesa if you are a woman.'
  },
  {
    id: 'age',
    /*
     Off the card, and still answerable — WHICH IS NOW WHAT THE CODE DOES.

     Seven is the promise, and two of the seven now depend on why somebody is here — so two
     universal frames had to give up their place. Age went first: it is asked, but nobody
     has ever failed a conversation in a bar for not knowing how to say how old they are,
     and it is the one question on the list a person might actively prefer not to answer.

     The mechanism was `purposes: []`, and it did not mean what it reads as. frameForPurpose
     is `!f.purposes || !purpose || f.purposes.includes(purpose)` — an empty array is truthy,
     so the first clause passes it through to `includes`, which is false for everything. The
     frame was not off the card; it was off the product, for everybody who answered set-up.
     It rendered on the deck greyed and captioned NOT YET, so the learner was shown a price
     they could pay and a door that would never move.

     Rung 5 with no purposes instead, which is exactly how `children` already does this: a
     bonus frame is one at `depth: 'deeper'`, not one excluded from every purpose. cardFor
     filters on `depth === 'card'` and still returns seven; the deck shows it, and anybody who wants
     to say their age can.
    */
    card: 3,
    ask: 'Que idade tens?',
    ask_en: 'How old are you?',
    frame: 'Tenho {n} anos.',
    en: 'I am {n} years old.',
    slots: [{ key: 'n', kind: 'number', hint: 'your age' }],
    built_from: ['tenho', 'anos'],
    /*
      Above the card, with children. The teaching rung is still 2 — the sentence needs
      nothing a rung-2 learner lacks — but the CARD rung is what decides the seven, and
      this one is deliberately not among them.
    */
    depth: 'deeper',
    teaches:
      'The one every English speaker gets wrong exactly once. Portuguese does not BE an age, it HAS one — tenho cinquenta e seis anos, “I have fifty-six years”. Say sou and you have said “I am fifty-six”, which means nothing at all.'
  },
  {
    id: 'married',
    card: 4,
    ask: 'És casado?',
    /* What a woman is actually asked. See askFor. */
    ask_f: 'És casada?',
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
    depth: 'card',
    teaches:
      /*
        FOUR, because there are four. `separado` was added to the options and this line
        was not, so the card counted three answers, named three pairs, and offered a
        fourth underneath — on the one screen whose whole job is to be trusted about
        endings.
      */
      'Every answer here is a description, so every one takes an ending: casado or casada, divorciado or divorciada, solteiro or solteira, separado or separada. And they go with sou rather than estou — Portuguese files this under what you are, not how you are today.'
  },
  {
    id: 'children',
    /*
      The one frame today that is not about the learner. It is the seed of ABOUT THEM —
      the questions that are about the people in your life rather than about you — and it
      already behaves like one: it is `depth: 'deeper'`, so it is not on the seven, and it
      is what somebody builds after the introduction is finished.
    */
    part: 'them',
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
    depth: 'deeper',
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
    id: 'who_with',
    /*
      ABOVE `married`, NOT INSTEAD OF IT — and that was a real choice.

      "És casado?" is on the card and stays there: it is what a stranger actually opens
      with, it is one word of an answer, and replacing a card frame risks the seven that
      every purpose is promised. This is the fuller answer, for somebody who has more to
      say than yes or no — and making it `depth: 'deeper'` means the card is unchanged and
      this is what you build afterwards.

      NAMORADO IS NOT IN built_from, and the omission is deliberate rather than an
      oversight. VOUCHED is derived from the paradigm table, which holds verbs and
      agreements — a noun can never appear in it, so parts-check cannot tell a reviewed
      noun from a typo. Listing `namorado` there would either fail the build or force the
      check to stop distinguishing the two, and a check that cannot fail is worse than the
      gap it was guarding.

      So the frame declares the words it is BUILT from — sou and solteiro, both taught —
      and `namorado` rides along inside a pick option, where the lint already requires it
      to be taught or glossed. The chip carries its own English, which is what every other
      pick in the Legend does.
    */
    part: 'them',
    card: 8,
    ask: 'Estás com alguém?',
    ask_en: 'Are you with somebody?',
    frame: '{status}',
    en: '{status}',
    slots: [
      {
        key: 'status',
        kind: 'pick',
        hint: 'whichever is true',
        gendered: true,
        gendered_names_the_other: ['Tenho namorado.'],
        options: [
          { value: 'Sou solteiro.', en: 'I am single.', f: 'Sou solteira.' },
          {
            value: 'Tenho namorado.',
            en: 'I have a boyfriend.',
            f: 'Tenho namorada.',
            /*
              The one option on this card whose ending is not about the speaker.

              Both forms are offered to everybody rather than filtered by the learner's own
              gender, because who you are says nothing about who your partner is — see
              `gendered_names_the_other` below.
            */
            f_en: 'I have a girlfriend.',
          },
          { value: 'Sou casado.', en: 'I am married.', f: 'Sou casada.' },
        ],
      },
    ],
    built_from: ['sou', 'solteiro'],
    depth: 'deeper',
    teaches:
      'SOU for what you are and TENHO for what you have — Portuguese draws the line where English does not. You ARE single and you HAVE a boyfriend, and saying it the other way round is the kind of mistake that gets you a smile rather than a correction.',
  },
  {
    id: 'work',
    card: 7,
    ask: 'O que fazes?',
    ask_en: 'What do you do?',
    frame: 'Trabalho com {thing}.',
    en: 'I work with {thing}.',
    /*
      A PICK, BECAUSE A TEXT BOX HERE ASKED THE LEARNER TO DO THE TRANSLATING.

      This was `kind: 'place'` — a bare input whose contents drop straight into "Trabalho
      com {thing}" as the learner's own Portuguese. That is right for a town, which is a
      proper noun and does not translate, and wrong for a profession, which is the one word
      on the card somebody actually needs supplying. Reported as "it expects me to know the
      translation", which is exactly what it did.

      Deliberately "trabalho COM" rather than "sou": com takes a noun and needs no article
      and no gender agreement, so "trabalho com computadores" works for anybody, where "sou
      professor / professora" would need the gendered pair for every entry. The frame's own
      note already makes that argument; the options now honour it.

      NOT AN EXHAUSTIVE LIST, and it should not become one. These are the broad fields most
      people can point at, plus the two answers — retired, studying — that are not fields at
      all and are the commonest reasons this question gets an awkward reply. Somebody whose
      work is not here says the nearest one, which is what people do in a second language
      anyway. A hundred professions would be a dropdown, and a dropdown is a form.
    */
    slots: [
      {
        key: 'thing',
        kind: 'pick',
        hint: 'the closest one to your work',
        /*
          AND A WAY OUT OF THE LIST, because ten fields cannot hold everybody.

          The note above says somebody whose work is not here says the nearest one. That
          holds for a data analyst picking números; it does not hold for advertising, which
          is not near any of these — reported exactly that way: "it doesn't have advertising
          for instance so that is me stumped".

          A plain text box would put us back where this slot started: the frame is
          "Trabalho com {thing}" and typing into it asks the learner to do the translating,
          which is the complaint that made this a pick list. So the way out is the
          translator, which is the product's own answer to "what is the word for this" and
          is already mounted at the root — it opens over the Legend without navigating, so
          the half-built card is still there when the word comes back.
        */
        open: 'advertising',
        options: [
          { value: 'computadores', en: 'computers' },
          { value: 'design', en: 'design' },
          { value: 'crianças', en: 'children' },
          { value: 'pessoas', en: 'people' },
          { value: 'números', en: 'numbers' },
          { value: 'construção', en: 'building' },
          { value: 'restauração', en: 'restaurants' },
          { value: 'saúde', en: 'health' },
          { value: 'música', en: 'music' },
          { value: 'vendas', en: 'sales' },
        ],
      },
    ],
    built_from: ['trabalho'],
    depth: 'card',
    teaches:
      'Trabalho is both the verb and the noun — I work, and the work. Portuguese leaves context to sort it out and context always does. Trabalho com is the natural way in: I work WITH, rather than I work as — which is why none of these needs an article or a gender.'
  },
  /*
    ASKED TWICE, IN THE SAME WORDS, and this was the second copy.

    `how_long` and `moved_when` both asked "Há quanto tempo estás cá?" — same question, same
    answer shape, and near-identical `teaches` about há holding elapsed time. A learner who
    said they were moving got both, which is what was reported.

    This one went rather than moved_when for three reasons. It was untagged, so it was
    offered to everybody while its sentence — "Mudei-me há {n} meses", I MOVED HERE n months
    ago — is untrue of anybody on a four-day trip. It sat at rung 6, so the same question
    arrived far later and harder than the version already on a mover's card at rung 2. And
    the three purpose-scoped time questions are now one each: a visitor is asked how long
    they are staying, somebody here for a season whether it is their first time, and a mover
    how long they have been here.

    Nothing is lost from any card: this is `depth: 'deeper'`, so it was never one of
    anybody's seven.
  */
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
    /*
      WHAT THE FRAME NEEDS, not every word any option might use.

      This named `adoro`, which appears in exactly one of five options — "quero fazer o que
      adoro". A learner picking any of the other four never says it, yet the word held the
      whole frame hostage: `adoro` is taught only by Audrey Hepburn, so `why_here` forced
      that vibe on everybody.

      That mattered more than it looks. Every word the card needs was single-sourced, and
      with five forced vibes against a free allowance of five there were 792 ways to choose
      and exactly ONE that let a learner finish. Trimming this to what the frame actually
      requires — a reason, introduced by `porque` — is the difference between a promise and
      a trap.

      `quero` opens three of the five options and is now taught in the basics as well, which
      everybody does. The Audrey option still works for anybody who owns `adoro`; it is
      simply no longer the price of the question.
    */
    built_from: ['porque', 'quero'],
    depth: 'card',
    helpers: { Porque: 'because' },
    teaches:
      /*
        NOT ONE SOUND — and in European Portuguese, not even close.

        This said "two spellings, one sound", which is what the accent exists to deny.
        `porque` ends in the reduced vowel Portuguese puts on almost every unstressed
        final syllable; `porquê` carries the stress on that syllable and opens it. The
        accent is not a spelling convention laid over an identical word, it marks the
        difference a listener actually hears — and telling a learner the two sound alike
        trains them to say the answer when they mean the question.
      */
      'Porque without an accent starts an answer; porquê with one asks the question. And they do not sound the same — porque tails off, porquê lands on the end, which is exactly what the accent is telling you to do.'
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
    depth: 'card',
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
    depth: 'card',
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
    /*
      "FOR", NOT "AGO", and the difference is the whole answer.

      This read "{how_long} ago", which is what `há` means in "há dois anos" pointing at an
      event — I arrived two years ago. Asked "há quanto tempo estás cá?", the same words
      mean the span you have been here FOR, and the reply is about a state that is still
      running. Somebody reading the English would have learned the wrong one of the two.

      Written so the option leads, because every option is capitalised to stand alone in a
      chip: "For A few weeks" is what a prefix produces, and "A few weeks, so far" carries
      the still-running sense without fighting the label.
    */
    en: '{how_long}, so far.',
    slots: [
      {
        key: 'how_long',
        kind: 'pick',
        hint: 'how long',
        /*
          IT HAS TO START SHORTER THAN A FEW MONTHS.

          The range opened at "uns meses", so somebody who moved last week or last month had
          nothing true to choose and the shortest honest answer available was already an
          exaggeration. Reported by somebody in exactly that position.

          A mover's first weeks are also when this question gets asked MOST — it is what
          every neighbour, every colleague and every person behind a counter opens with when
          they place your accent — so the missing end of the range was the end that matters.
        */
        options: [
          { value: 'umas semanas', en: 'A few weeks' },
          { value: 'um mês', en: 'A month' },
          { value: 'uns meses', en: 'A few months' },
          { value: 'um ano', en: 'A year' },
          { value: 'dois anos', en: 'Two years' },
          { value: 'muitos anos', en: 'Many years' },
        ],
      },
    ],
    built_from: ['dois', 'anos'],
    depth: 'card',
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
    depth: 'card',
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
 * than the questions above, so they are fixed, non-optional, and present for every
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
/** Seven, everywhere, for everybody. See LegendFrame.purposes. */
export const CARD_SIZE = 7

/** Applies to this learner: untagged frames are for everybody, as most of them are. */
export function frameForPurpose(f: LegendFrame, purpose: Purpose | null): boolean {
  return !f.purposes || !purpose || f.purposes.includes(purpose)
}

/**
 * The seven questions on this learner's card.
 *
 * Was a rung comparison, which was fine while every frame applied to everybody. Now that
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
  return LEGEND_FRAMES.filter((f) => f.depth === 'card' && frameForPurpose(f, use))
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
 * IT NO LONGER ASKS THE RUNG EITHER, and the reason is worth keeping.
 *
 * This used to argue that the door was honest because "the rung only moves on a clean
 * release with nothing on screen, so reaching the rung IS having said this kind of thing
 * cold". That stopped being true: rungReached deliberately dropped the `clean` test
 * (content/roots.ts — "a real run through the basics produces three releases and, quite
 * normally, zero clean ones"), so the rung had not measured cold speech for some time and
 * the argument outlived its mechanism.
 *
 * The clause it justified could never decide anything either. Stage 1 requires ZERO
 * releases ever, while finishing the card requires five completed vibes — which produce
 * releases — and any Club room banks rung 2 or higher on its own. Card-done and stage-1
 * cannot coexist, so `rung >= CARD_RUNG` was inert.
 *
 * So the door is what it always actually was: the card is finished, or you have been
 * welcomed already.
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
  welcomedAt?: string | null
}): boolean {
  if (opts.welcomedAt) return true
  return cardDone(opts.answeredFrameIds, opts.answers ?? [], opts.purpose ?? null)
}

/**
 * THE FREE ALLOWANCE. No longer the door — see legendUnlocked.
 *
 * This was `CRATES_TO_UNLOCK_LEGEND` and it was doing two jobs under one name: how many
 * vibes open the Legend, and how many a free learner may have at once. lib/entitlements
 * read it for the second while the Legend read it for the first, and its comment argued
 * that was a feature — "the free tier IS the whole path to the Legend".
 *
 * The door has moved to finishing the basics, and the allowance has deliberately NOT
 * moved. So the two are separate numbers now and this one keeps only the job it still
 * has. The offer is unchanged and reads better for it: reach your Legend free, plus four
 * more vibes chosen for the pleasure of them.
 */
/**
 * HOW MANY WORDS IS ENOUGH, and where the number comes from.
 *
 * Sam: "I do want to convert some sense of achievement here that in totality shows your
 * improvement without going all Dua Lingo. But that counts streaks right? I want to show
 * actual progress."
 *
 * The distinction he is drawing is the one this product is built on. A streak counts DAYS
 * — it goes up for turning up and to zero for a fortnight in hospital, which measures
 * attendance and calls it learning. This counts WORDS SOMEBODY OWNS: it moves when they
 * bank one and never otherwise, it cannot fall, and time does nothing to it.
 *
 * THE FIGURE IS NOT INVENTED, which is the only reason it is allowed on the screen. Corpus
 * frequency work puts the most common 800-1,000 word families at roughly 75% coverage of
 * everyday speech, and around 3,000 at 95% — the numbers behind every "2,000 words is
 * conversational" claim. 800 is the near end of that range, deliberately: it is where
 * somebody stops decoding and starts following, and a target that can be reached is worth
 * more than an honest one that cannot.
 *
 * A LEARNER IS NEVER TOLD THEY ARE FINISHED AT IT. The line says what the number covers,
 * not that the language is done — "you now speak Portuguese" is a claim no count can make,
 * and the product would be lying the moment somebody met a doctor.
 */
export const WORDS_FOR_MOST_OF_A_DAY = 800

/**
 * WHAT YOU CAN DO NOW, which is the thing a bar against 800 could never say.
 *
 * Sam: "Just because we only have 178 pieces doesn't mean more will be added. In fact they
 * WILL be added... This is not about attaining a nominal level of fluency it is about
 * growth. The user wants to see how much they have learned."
 *
 * THE BAR MEASURED THE WRONG THING. 800 is a real figure and it is a destination, not a
 * denominator — the product holds 178 pieces today and the calendar adds more every month,
 * so a learner who owned every word in DUB saw a bar 22% full and a fixed target receding
 * ahead of a growing library. A progress bar whose ceiling is unreachable by construction
 * is a worse lie than no bar.
 *
 * NAMED STAGES INSTEAD, because what changes as somebody learns is not a percentage, it is
 * what they can DO. The thresholds are measured against the content rather than chosen:
 *
 *   BASICS            the first sitting, before anything is finished
 *   GETTING AROUND    35 — the basics done. Hello, numbers, your name, where you are from
 *   BEING UNDERSTOOD  90 — the basics and roughly four vibes: the free tier's own shape
 *   CONVERSING        180 — every word in the product today, and where the Club begins
 *   LEADING           400 — the far end, reached as the calendar fills
 *
 * A stage is reached and never lost, exactly as the count was: it moves when a word is
 * banked and time does nothing to it. Nobody is told the language is finished at the end —
 * LEADING is a way of speaking, not a certificate, and the copy says what it covers rather
 * than what it completes.
 *
 * NOT A LEVEL, AND NOT A STREAK. There is no badge, no daily obligation and nothing to
 * fall out of. The stage is a description of what somebody can already do, which is the
 * only thing here that is theirs.
 */
export interface Stage {
  id: string
  name: string
  /** The count at which this stage begins. */
  at: number
  /** What somebody can do here, in their own terms. */
  can: string
}

/*
  THE THRESHOLDS, MEASURED AGAINST REAL MILESTONES rather than chosen as round numbers.

  They were word counts; the score is weighted now, so each one is re-derived from what a
  learner actually holds at that point. Modelled from the content:

      after the basics                            38
      basics and two vibes                        81
      the free tier finished                     159
      a Legend, and one night out                201
      everything in the product today            317

  So the stages sit just under each: a learner ARRIVES at a stage by doing the thing it
  describes, rather than grinding past an arbitrary figure. Leading stays beyond today's
  ceiling on purpose — the calendar adds drops every month, and a far end you can reach by
  exhausting the library is a finish line on a product that has not finished.
*/
export const STAGES: Stage[] = [
  { id: 'basics', name: 'Basics', at: 0, can: 'The first words, and the ones you will say every day.' },
  { id: 'around', name: 'Getting around', at: 35, can: 'Hello, numbers, your name and where you are from — enough to be somewhere.' },
  { id: 'understood', name: 'Being understood', at: 80, can: 'Enough to be understood in a room, and to say what you actually mean.' },
  { id: 'conversing', name: 'Conversing', at: 160, can: 'Enough to hold your end of it, and to follow the other end.' },
  { id: 'leading', name: 'Leading the conversation', at: 320, can: 'Enough to start it, steer it, and be the one who keeps it going.' },
]

/**
 * EVERYTHING THAT COUNTS AS GETTING BETTER, in one number.
 *
 * The stage was driven by banked words alone, which made four of the six things on Yours
 * decorative: you could take a cheat sheet apart, finish three rooms and answer your whole
 * Legend and the bar would not move. Sam: "I would like progress in each to be somehow
 * measured towards a collective goal."
 *
 * WHAT IS IN, and why each earns its place:
 *
 *   words      what you own outright. The base of everything else.
 *   through    vibes and rooms you have been through — where the words were used.
 *   legend     cards answered. The only thing here that is about YOU.
 *   drops      a night you took it to. Sam: "a completed drop is an achievement" — and he
 *              is right, the calendar expiring does not un-happen the evening.
 *   sheets     a group you can produce end to end, now that every member can be ticked.
 *
 * WHAT IS OUT, and why:
 *
 *   said cold  self-certified. The learner taps I SAID IT and the product records it as
 *              fact; nothing checks. Sam: "we have to take their word for it." The
 *              retrieval is the most valuable thing in the product and the COUNT adds
 *              nothing to it, so the mechanic stays and the number does not.
 *   put aside  a bookmark pile. More is not better — a big one is a backlog, and a score
 *              that rises when somebody saves things they never open is the exact
 *              attendance-measuring this product refuses.
 *
 * WEIGHTED, because these are not the same size of act. A word is one thing learned; a
 * room is several used together; a drop is an evening. The weights say that plainly rather
 * than pretending a bookmark and a night out are worth the same.
 */
export interface Progress {
  /** The single number the stages are read from. */
  score: number
  /** What each part contributed, for a screen that wants to show its working. */
  parts: { id: string; n: number; each: number; score: number }[]
}

export const PROGRESS_WEIGHTS = { words: 1, through: 3, legend: 4, drops: 6, sheets: 5 }

export function progressFor(me: {
  words?: number
  through?: number
  legend?: number
  drops?: number
  sheets?: number
}): Progress {
  const parts = (Object.keys(PROGRESS_WEIGHTS) as (keyof typeof PROGRESS_WEIGHTS)[]).map(
    (id) => {
      const n = Math.max(0, me[id] ?? 0)
      const each = PROGRESS_WEIGHTS[id]
      return { id, n, each, score: n * each }
    },
  )
  return { score: parts.reduce((a, b) => a + b.score, 0), parts }
}

/** The stage a learner is in, by how far along they are. */
export function stageFor(words: number): Stage {
  let out = STAGES[0]
  for (const s of STAGES) if (words >= s.at) out = s
  return out
}

/** The stage after this one, or null at the far end. */
export function nextStage(words: number): Stage | null {
  return STAGES.find((s) => s.at > words) ?? null
}

export const FREE_CRATES = 5

/**
 * When the save offer is worth making, which is as soon as there is something to lose.
 *
 * IT USED TO WAIT FOR THE WHOLE BASICS PLUS TWO VIBES — eleven sittings or so. Everything
 * DUB knows lives in this browser's storage, and an INSTALLED app gets its own: add DUB to
 * the home screen before the offer has fired and it opens empty, with the work still in
 * the browser and nothing on screen saying so. Sam, having hit it: "is it correct or a
 * problem that a downloaded version of the site becomes completely different instances?"
 * Correct, and a problem — the design assumes a device is a person.
 *
 * So the offer moves to the first moment there is real work on the device. A learner who
 * has answered a Legend card has written something ABOUT THEMSELVES that exists nowhere
 * else; a learner who has finished a sitting has ten minutes in it. Either is enough to
 * be worth an email, and both happen long before the old floor.
 *
 * NOT AT SET-UP, deliberately. That is the one screen everybody passes through and the
 * one most optimised for getting out of the way, and an email field there is friction at
 * the exact point it costs most. This asks when the learner has something of their own,
 * which is also when they have a reason to say yes.
 *
 * Still once only — `save_prompt` records the answer and NOT NOW is an answer — and it
 * still never blocks.
 */
export function worthSaving(me: {
  legend?: { values: Record<string, string> }[]
  sittings?: number
  proof?: unknown[]
}): boolean {
  const answered = (me.legend ?? []).filter((a) => Object.keys(a.values ?? {}).length > 0)
  return answered.length > 0 || (me.sittings ?? 0) > 0 || (me.proof ?? []).length > 0
}

/** The vibe every learner is sent through first, and the one the Legend is built from. */
export const DOORWAY: CultureFamily = 'the_basics'

/**
 * THE DOOR: the basics, finished. Not five vibes, visited.
 *
 * It counted five distinct `sections_completed`, and a section is recorded after ONE
 * SITTING of 2–4 roots. So the gate measured turning up five times while the card needed
 * ten specific words, and those two never met. Measured on a real five-vibe run: 23
 * pieces owned and 3 of 7 questions answerable, which is exactly what Sam hit — the
 * Legend opened and could not be finished.
 *
 * Worse, the four other vibes were not helping. Every word the card needs is taught in
 * the basics (a fix for the five-vibe trap, which was real), so the other seven of twelve
 * vibes contribute NOTHING to the card. The requirement was four vibes of unrelated words
 * standing between a learner and a card that was waiting on a basics nobody asked them to
 * finish.
 *
 * THE DOOR IS THE BASICS PLUS THREE VIBES YOU CHOSE, which is a change.
 *
 * It was the basics alone. Sam: "Basics are essentially the first vibe and compulsory —
 * to which the user then adds a number of vibes in order to open the Legend." The basics
 * are not a choice, so opening the Legend on them alone asked nothing of the learner
 * except compliance, and the Legend is meant to be built out of things they picked.
 *
 * Three FINISHED, not started. `sections_completed` is written on finishing, and the
 * shelf already frees an allowance slot on the same fact — so a learner who finishes
 * three has spent none of their five and cannot be stranded. That deadlock is worth
 * naming because it existed before: "start five, finish three, wander off from two — and
 * you are at the limit with nothing left to open and no way to reach the Legend",
 * components/Journey.tsx. Counting finished vibes keeps that road walkable.
 *
 * Both halves are required. The basics carry the vocabulary the card is built from — a
 * Legend with no words in it is not a Legend — and the three chosen vibes are what make
 * it theirs.
 */
export const VIBES_FOR_LEGEND = 3

/**
 * SITTINGS OF VIBES THE LEARNER CHOSE, which is not the same as vibes finished.
 *
 * It counted `sections_completed` — distinct vibes sat through — and read it as "vibes
 * finished". Those are three different numbers and the code was conflating two of them:
 *
 *   sittings          one pass through a vibe, about ten minutes. What SESSION DONE marks.
 *   vibes sat through  sections_completed, deduped by family.
 *   vibes FINISHED    every root played. Nothing records this and nothing ever did.
 *
 * The cost of the difference: the basics hold 16 roots and a sitting serves about four,
 * so "basics + 3 vibes finished" is roughly ELEVEN sittings. Sam did five, watched five
 * SESSION DONE badges appear, and the door had not moved. "Why are we so disconnected
 * here."
 *
 * So the door counts sittings, which is the number the product is already showing him.
 * The basics ones are subtracted for the reason the old function excluded the basics: it
 * is compulsory, so it is not one of the vibes somebody chose.
 */
export function chosenVibesFinished(sectionsCompleted: string[], sittings = 0): number {
  const basicsSat = sectionsCompleted.includes(DOORWAY) ? 1 : 0
  /*
    A floor of the deduped count, so a record written before sittings existed is not
    punished for it — and never more than the sittings actually taken.
  */
  const chosen = new Set(sectionsCompleted.filter((id) => id !== DOORWAY)).size
  return Math.max(chosen, sittings - basicsSat)
}

export function legendUnlocked(
  rootsPlayed: string[],
  sectionsCompleted: string[],
  sittings = 0,
): boolean {
  return (
    doorwayToGo(rootsPlayed) === 0 &&
    chosenVibesFinished(sectionsCompleted, sittings) >= VIBES_FOR_LEGEND
  )
}

/**
 * How much of the doorway is left, in roots.
 *
 * A truer progress line than a vibe count ever was: it moves every time somebody plays
 * something, rather than once per sitting.
 */
export function doorwayToGo(rootsPlayed: string[]): number {
  const played = new Set(rootsPlayed)
  return doorwayRoots().filter((r) => !played.has(r.root_id)).length
}

/**
 * The same distance, in sittings — the unit somebody can decide to spend.
 *
 * A sitting is capped by SCREENS, not by roots, so what it delivers is not a constant:
 * the first one spends a slot on the vibe's freebie and lands two doorway roots, and
 * later ones land two or three. Measured against the real budget, the six roots close in
 * three sittings.
 *
 * DOORWAY_PER_SESSION is therefore the conservative figure rather than the average. A
 * count that promised two and took three would be the same broken promise in a nicer
 * unit, and P2 exists to catch exactly that. Rounding up means the number can only ever
 * come in early, which is the direction a learner forgives.
 */
const DOORWAY_PER_SESSION = 2

export function doorwaySessions(rootsLeft: number): number {
  return Math.ceil(rootsLeft / DOORWAY_PER_SESSION)
}

/**
 * THE DOORWAY IS WHAT THE CARD NEEDS, not every root in the vibe.
 *
 * A first version counted all 16 basics roots, and that made the entire Legend hang on
 * ONE of them: `tb_why` ("Why Do Fools Fall in Love") is the only root in the product that
 * teaches `porque`, and it is rung 2. So a learner at rung 1 could play every other line
 * in the basics and never open their Legend — measured, 15 roots and 29 pieces with the
 * door still shut, which is the same class of dead end the five-vibe trap was.
 *
 * It counts the roots that actually carry card vocabulary instead. Those are the ones the
 * promise depends on; the rest of the basics is lovely and is not load-bearing, so
 * finishing it is not made a condition of the thing the product is for.
 *
 * `tb_why` is still in the set, because `porque` genuinely is needed — what changes is
 * that the count is derived from the card rather than from a vibe's length, so adding a
 * sixteenth song to the basics can never again move the door.
 */
export function doorwayRoots(): { root_id: string }[] {
  /*
    EVERY CARD, NOT THE VISITING ONE.

    LEGEND_CARD is cardFor(null), which is the visiting set — so the doorway was computed
    from one learner's seven and applied to all three. The cards differ in two questions:

      visiting  … um, semana      (how long are you here)
      staying   … sim, nao        (is it your first time)
      moving    … dois, anos      (how long have you been here)

    So a learner who said MOVING finished the doorway, was told "Your Legend is open" and
    "Seven things about you", and found `moved_when` permanently unanswerable — `anos` is
    taught by tb_six_seven, which is not in the doorway and which the front-loading rule
    pushes to the back of the basics. Measured against Sam's own record: 6 of 7 openable
    at the door, and the seventh unreachable without playing the whole vibe.

    The union is the honest set: a door that opens the Legend has to open ALL of it, and
    which seven that is depends on an answer given before any of this was reached.

    Cheap enough to compute per call — three cards of seven frames against sixteen roots —
    and the alternative is a second constant that has to be kept in step with cardFor,
    which is the fault this fixes rather than a different one.
  */
  const need = new Set(
    (['visiting', 'staying', 'moving'] as const).flatMap((p) =>
      cardFor(p).flatMap((f) => f.built_from),
    ),
  )
  return (ROOTS_BY_FAMILY[DOORWAY] ?? []).filter((r) =>
    r.extracts.some((e) => need.has(e.id)),
  )
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
  /** Roots of the doorway still to play. Zero when the basics are done. */
  toGo: number
  /** Cards that can be built right now — all of them, or none. */
  openCards: number
  /*
    THE SECOND HALF OF THE DOOR, so a screen can show a progress line rather than a wall.

    Sam: "we need to do a better job of showing progress towards opening the Legend." A
    single boolean cannot be shown as progress — every screen that had one could only say
    open or not, which is why a learner three vibes deep saw the same message as somebody
    who had just arrived. These two numbers are what a progress line is made of.
  */
  vibesDone: number
  vibesNeeded: number
  /*
    THE DOORWAY IN THE UNIT SOMEBODY CAN ACTUALLY SPEND.

    Sam, looking at a shelf that said "5 more lines of the basics" after he had played
    the whole session he was handed: "I just dont understadn... where is that
    communicated? It's totally unclear."

    He was right, and the fault was the unit. `toGo` counts ROOTS, which nobody chooses
    — you cannot decide to do five roots. You decide to open the basics, and the product
    hands you a sitting. So the number moved by two while the learner did one thing, and
    the only screen that mentioned the door at all was contradicted by a SESSION DONE
    badge on the tile right underneath it.

    These two say the same fact in sessions: how many more times you press the button.
    Derived from the doorway and the sitting budget rather than typed, because a "3"
    written into prose is the exact failure that left "five vibes" in three files two
    rules after it stopped being true.
  */
  sessionsDone: number
  sessionsNeeded: number
}

export function legendStatus(opts: {
  rootsPlayed: string[]
  /** Sittings taken, which is what the door counts. See chosenVibesFinished. */
  sittings?: number
  /*
    REQUIRED, not optional, and that is the point of the change.

    An optional second half would compile everywhere and quietly report "0 vibes done" at
    every call site that had not been updated — which is the same class of fault as the
    one this rewrite exists to fix, where the Club and the Legend ran different products
    and neither knew. Making it required turns eight silent wrong answers into eight
    compiler errors.
  */
  sectionsCompleted: string[]
}): LegendStatus {
  const sections = opts.sectionsCompleted
  const open = legendUnlocked(opts.rootsPlayed, sections, opts.sittings ?? 0)
  const toGo = doorwayToGo(opts.rootsPlayed)
  return {
    open,
    toGo,
    vibesDone: chosenVibesFinished(sections, opts.sittings ?? 0),
    vibesNeeded: VIBES_FOR_LEGEND,
    sessionsNeeded: doorwaySessions(doorwayRoots().length),
    sessionsDone: doorwaySessions(doorwayRoots().length) - doorwaySessions(toGo),
    openCards: open ? LEGEND_FRAMES.length : 0,
  }
}

/**
 * Does this learner have the words for this question?
 *
 * THE ONE PLACE THAT ANSWERS IT, and the reason that matters is on record. The Legend
 * used to open card by card on exactly this test, and it was deleted — because the
 * session screen announced "two Legend cards just opened" while the Legend itself said
 * "one more vibe and these open". Two screens, internally correct, running different
 * products, and the learner tapped through to a wall.
 *
 * It comes back because the thing that made it dishonest is fixed. Every word the card
 * needs is now taught in the basics as well as wherever it came from, so "you have the
 * words" can no longer secretly mean "you happened to pick the right five vibes". The
 * card is finishable from any five; what a word now decides is whether the DEEPER
 * questions — the ones above the card — are ready.
 *
 * Both consumers ask this function. The deck renders `not yet` from it and the end of a
 * vibe announces from it, so the announcement and the destination cannot disagree again.
 */
export function frameReady(frame: LegendFrame, owned: Iterable<string>): boolean {
  const have = owned instanceof Set ? owned : new Set(owned)
  return frame.built_from.every((id) => have.has(id))
}

/**
 * The questions a session just made answerable.
 *
 * `before` is the inventory as it was; `after` includes what the vibe handed over. A frame
 * counts only if it crossed — already-ready frames are not news, and an answered one is
 * not an unlock.
 *
 * Ordered by the frame's own `card` number so a learner meets them in the order a stranger
 * asks them, rather than in whatever order the inventory happened to grow.
 */
export function framesJustOpened(opts: {
  before: Iterable<string>
  after: Iterable<string>
  answered: string[]
  purpose: Purpose | null
  answers: { frame_id: string; values: Record<string, string> }[]
}): LegendFrame[] {
  const before = opts.before instanceof Set ? opts.before : new Set(opts.before)
  const after = opts.after instanceof Set ? opts.after : new Set(opts.after)
  return LEGEND_FRAMES.filter(
    (f) =>
      !opts.answered.includes(f.id) &&
      frameForPurpose(f, opts.purpose) &&
      frameApplies(f, opts.answers) &&
      frameReady(f, after) &&
      !frameReady(f, before),
  ).sort((a, b) => a.card - b.card)
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
  /*
    TRIMMED, BECAUSE A TRAILING SPACE BECOMES A WORD.

    Every free-text slot goes into the sentence verbatim, and MiniBuild builds its tiles by
    splitting that sentence on spaces. So "Advertising " — one stray space, which a phone
    keyboard adds without anybody noticing — turned "Trabalho com {thing}." into four tiles
    with a lone FULL STOP among them, and the learner was asked to place a piece of
    punctuation in a sentence about their job. Reported with a screenshot of exactly that.

    Fixed here rather than in the builder: the sentence is also what gets recorded as proof,
    read aloud, and compared against later, so a phantom space is wrong everywhere and not
    only where it happens to be visible. Trimming at the point the sentence is MADE fixes
    all of them at once.
  */
  return shape.frame.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const raw = values[key]?.trim()
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
 * The same sentence, in English, filled with the same answers.
 *
 * WHY THIS EXISTS. The cold-recall screen showed the Portuguese question and a pile of
 * Portuguese tiles and nothing else — so a learner was asked to build a sentence with no
 * statement anywhere of what the sentence was supposed to MEAN. On a card asking "tens
 * filhos?" that is guessable; on "falas português?", where the answer is a shape nobody
 * would predict, it is a memory test with the question removed. Reported as "on all of
 * these legend cards we need the English sentence we are translating".
 *
 * It goes through frameFor for the same reason fillFrame does: a variant or a children
 * answer changes BOTH sentences together, and reading `frame.en` directly would show the
 * English of a shape the Portuguese is no longer using.
 *
 * Numbers stay as digits here. "I am fifty-six" is not how anybody reads their own age in
 * their own language, and this line exists to be understood at a glance rather than said.
 */
export function fillEnglish(
  frame: LegendFrame,
  values: Record<string, string>,
): string {
  const shape = frameFor(frame, values)
  return shape.en.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const raw = values[key]?.trim()
    if (!raw) return whole
    const slot = shape.slots.find((sl) => sl.key === key)
    /* A pick shows its English label; a typed answer is already the learner's own words. */
    const option = slot?.options?.find((o) => o.value === raw || o.f === raw)
    return option?.en ?? raw
  })
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
  /*
    Three, not five, and the number is no longer written into a sentence.

    This said "once you have done five vibes" — which was the rule two rules ago, and was
    still on screen while the door counted basics roots and then while it counted three
    chosen vibes. A number in prose is a number that goes stale silently, so the sentence
    stops naming one and the panel above it says how many are left, from legendStatus.
  */
  banked_note_many: 'They open once you have finished a few vibes of your own.',
  /*
    THE SOFT GATE, one vibe from the door.

    Sam: "the gateway comes with first a soft — would you like to register so you don't
    lose all your learnings at some point mid-vibes." Placed at one vibe out rather than
    earlier: by then there is real work to lose and the Legend is close enough that
    keeping it is an obvious want rather than an interruption.

    It asks rather than blocks. Everything DUB knows lives in localStorage — a cleared
    browser or a new phone loses all of it — and that is a true thing worth saying once,
    at the moment it would hurt most to find out. Saying it twice would be nagging, which
    is why it is bound to the single vibe before the door.
  */
  save_head: 'Keep this, in case of a new phone.',
  save_body:
    'Everything you have done lives on this device and nowhere else. One tap on a link we email you and it follows you — no password, and nothing else changes.',
  save_cta: 'EMAIL ME A LINK',
  save_skip: 'NOT NOW',
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
  /*
    No number. It said "Ten questions" against a table of eleven, and it will be wrong
    again the moment a frame is added — which is the point of the parts. A count that has
    to be maintained by hand is a count that will lie.
  */
  locked_head: 'The questions a stranger will ask you.',
  locked_body:
    'They are not a form — each one is a short lesson built round your own answer, and you keep what it teaches. The vibes are where you get the language to build them.',
  empty_head: 'Nothing here yet.',
  empty_body:
    'Your Legend fills up as the vibes feed it. Open one and the first cards will be waiting.',
} as const
