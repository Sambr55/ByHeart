/**
 * THE SAME SEVEN, SAID BETTER.
 *
 * Sam: "I also feel there could be an advanced legend where you learn more things to say
 * about yourself"— and then, choosing between the two readings of that: "same seven said
 * better."
 *
 * The other reading was more questions, and it is the one most products take: favourite
 * food, where you have travelled, what you do at weekends. It makes the Legend longer and
 * leaves every sentence in it exactly as short as it was. What the five levels actually
 * promise is the opposite — being understood, then saying what you MEAN, then holding
 * your end of it — and none of that is a new question.
 *
 * SO EACH OF THE SEVEN GETS A SECOND WAY TO SAY IT, and the second way is longer because
 * it does more work rather than because it is decorated. "Trabalho com computadores" is
 * four words and finished; "Trabalho com computadores, mas estou a mudar de área" is the
 * same fact with a person behind it, and the difference is one conjunction and a clause.
 *
 * WHAT MAKES A GOOD SECOND LAYER, and it is the whole authoring brief:
 *
 *   - It answers the SAME question. A longer answer to a different question is a new
 *     frame, which is the other product.
 *   - It is one step, not a paragraph. Somebody who can say four words is not helped by
 *     twenty; they are helped by eight that land.
 *   - It carries the connective. mas, porque, desde — the words that turn two facts into
 *     a sentence are the actual content here, and they are what a beginner never reaches
 *     for because nothing has ever asked them to.
 *   - It is still TRUE of the learner. Every slot is theirs, exactly as the first layer's
 *     are, so this is their sentence said better rather than a specimen to memorise.
 *
 * NOT A GATE. A learner who never touches this has a finished Legend, and the door does
 * not move — these are offered from the Club once the seven are answered, and their own
 * frames stay exactly as they are. The Legend is the floor, not the ceiling.
 */
import type { LegendSlot } from '@/content/legend'

export interface Fluent {
  /** The frame this is a better way of saying. */
  frame: string
  /**
   * Which level it belongs to.
   *
   * Two rungs above the basics, because that is what these sentences ARE: the first is
   * "enough to be understood in a room, and to say what you actually mean", the second
   * "enough to hold your end of it". A learner meets them when the grid says they are
   * there, which is the level the card lands in — see content/collection.ts.
   */
  level: 'understood' | 'conversing'
  /** The longer sentence, with the same slots the frame already uses. */
  frame_pt: string
  en: string
  /** Only where the longer form needs a choice the short one did not. */
  slots?: LegendSlot[]
  /**
   * The word that does the work, named so the card can say what was learned.
   *
   * Every one of these turns two facts into a sentence, and that is the thing being
   * taught — the vocabulary is incidental and the join is not.
   */
  hinge: { pt: string; en: string; note: string }
}

export const FLUENT: Fluent[] = [
  {
    frame: 'name',
    level: 'understood',
    /*
      The name, with the thing everybody actually adds to it.

      "Chamo-me Ana" is complete and slightly formal — a stranger at a counter says it and
      stops. What a person says at a table is the short form of their own name, and
      Portuguese has a construction for exactly that which English does not: podes
      tratar-me por, "you can call me".
    */
    frame_pt: 'Chamo-me {name}, mas podes tratar-me por {short}.',
    en: 'My name is {name}, but you can call me {short}.',
    slots: [{ key: 'short', kind: 'name', hint: 'what your friends call you' }],
    hinge: {
      pt: 'mas',
      en: 'but',
      note: 'The one word that turns two sentences into one. It does the same job it does in English and sits in the same place, which is not true of most of them.',
    },
  },
  {
    frame: 'origin',
    level: 'understood',
    /*
      Where you are from, with how long that has been true — which is the question a
      Portuguese person asks next, every time, and the one that turns a nationality into
      a story.
    */
    frame_pt: 'Sou {nationality}, de {place}, mas vivo aqui há {how_long}.',
    en: 'I am {nationality}, from {place}, but I have lived here for {how_long}.',
    slots: [
      {
        key: 'how_long',
        kind: 'pick',
        hint: 'how long you have been here',
        options: [
          { value: 'uns meses', en: 'a few months' },
          { value: 'um ano', en: 'a year' },
          { value: 'dois anos', en: 'two years' },
          { value: 'muito tempo', en: 'a long time' },
          { value: 'pouco tempo', en: 'not long' },
        ],
      },
    ],
    hinge: {
      pt: 'há',
      en: 'for',
      note: 'Portuguese counts backwards from now with há, where English says "for". Vivo aqui há dois anos is "I have lived here two years" — present tense, because you still do.',
    },
  },
  {
    frame: 'married',
    level: 'understood',
    /*
      The status, with the detail that makes it a person rather than a form field. Every
      option on the first layer is one word; this is that word plus the thing somebody
      would actually say after it.
    */
    frame_pt: 'Sou {status}, e temos {children} filhos.',
    en: 'I am {status}, and we have {children} children.',
    slots: [
      {
        key: 'children',
        kind: 'pick',
        hint: 'how many',
        options: [
          { value: 'um', en: 'one' },
          { value: 'dois', en: 'two' },
          { value: 'três', en: 'three' },
        ],
      },
    ],
    hinge: {
      pt: 'temos',
      en: 'we have',
      note: 'The first time you say WE rather than I. Temos is tenho with somebody else in it, and it is the verb that makes a couple out of two people.',
    },
  },
  {
    frame: 'work',
    level: 'conversing',
    /*
      The job, with what is actually going on with it. "Trabalho com computadores" is
      finished and says nothing; the same sentence with a `mas` after it is a conversation
      somebody can take up.
    */
    frame_pt: 'Trabalho com {thing}, mas {change}.',
    en: 'I work with {thing}, but {change}.',
    slots: [
      {
        key: 'change',
        kind: 'pick',
        hint: 'what is going on with it',
        options: [
          { value: 'estou a mudar de área', en: 'I am changing field' },
          { value: 'trabalho a partir de casa', en: 'I work from home' },
          { value: 'gosto mais de cozinhar', en: 'I prefer cooking' },
          { value: 'estou entre empregos', en: 'I am between jobs' },
          { value: 'trabalho por conta própria', en: 'I work for myself' },
        ],
      },
    ],
    hinge: {
      pt: 'estou a',
      en: 'I am -ing',
      note: 'European Portuguese says estou A MUDAR where Brazil says estou mudando. It is the difference between "I am changing" and "I change", and it is the tense a conversation actually runs in.',
    },
  },
  {
    frame: 'why_here',
    level: 'conversing',
    /*
      The reason, with what it has turned into. The first layer answers why you came; this
      answers how it is going, which is what somebody actually wants to know.
    */
    frame_pt: 'Porque {reason}, e até agora {going}.',
    en: 'Because {reason}, and so far {going}.',
    slots: [
      {
        key: 'going',
        kind: 'pick',
        hint: 'how it is going',
        options: [
          { value: 'não me arrependo', en: 'I have no regrets' },
          { value: 'tem corrido bem', en: 'it has gone well' },
          { value: 'ainda estou a habituar-me', en: 'I am still getting used to it' },
          { value: 'adoro isto', en: 'I love it here' },
        ],
      },
    ],
    hinge: {
      pt: 'até agora',
      en: 'so far',
      note: 'Two words that put a sentence in time without a tense. Até agora says "this is where things stand", which is how anybody answers a question about a decision they are still living.',
    },
  },
  {
    frame: 'staying_for',
    level: 'understood',
    /*
      How long, with what happens after — which is the half of the answer that makes it a
      plan rather than a duration.
    */
    frame_pt: '{how_long}, e depois {after}.',
    en: '{how_long}, and then {after}.',
    slots: [
      {
        key: 'after',
        kind: 'pick',
        hint: 'what happens then',
        options: [
          { value: 'volto para casa', en: 'I go home' },
          { value: 'vou para o Porto', en: 'I go to Porto' },
          { value: 'logo se vê', en: 'we will see' },
          { value: 'espero ficar', en: 'I hope to stay' },
        ],
      },
    ],
    hinge: {
      pt: 'depois',
      en: 'then',
      note: 'The word that puts two things in order. Portuguese uses it exactly where English uses "then", and it is the cheapest way to make a sentence sound planned rather than listed.',
    },
  },
  {
    frame: 'portuguese',
    level: 'conversing',
    /*
      The one where the second layer is the actual lesson: saying you are learning is easy
      and useless on its own, and what rescues a conversation is the ASK that follows it.
      Straight out of the repair kit, which is already in every learner's Legend.
    */
    frame_pt: 'Estou a aprender. {much} Pode falar mais devagar?',
    en: 'I am learning. {much} Could you speak more slowly?',
    hinge: {
      pt: 'pode falar mais devagar',
      en: 'could you speak more slowly',
      note: 'The sentence that keeps a conversation alive. Saying you are learning invites somebody to switch to English; asking them to slow down invites them not to.',
    },
  },
]

/** The better way of saying one frame, if there is one. */
export function fluentFor(frameId: string): Fluent | undefined {
  return FLUENT.find((f) => f.frame === frameId)
}
