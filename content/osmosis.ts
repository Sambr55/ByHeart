/**
 * What the learner absorbed without being taught it.
 *
 * The point of this screen is reassurance, not instruction. They have just used a
 * reflexive verb, a gender agreement and a conjugation without anyone saying those
 * words out loud — and being shown that, gently, is the moment the thing stops feeling
 * like a party trick and starts feeling like language.
 *
 * Rules for the copy here:
 *   - No grammar jargon in the headline. Ever.
 *   - Always quote the actual line they saw, not an invented example.
 *   - End on "you already did this", never on "now learn the rule".
 *   - Nothing here is ever tested. Say so.
 */

export interface Insight {
  id: string
  /** Pieces the learner must own for this to be honestly true of their session. */
  requires: string[]
  /** Plain English. A person who hated school should not flinch at this. */
  headline: string
  /** One or two sentences. The science, without the vocabulary of the science. */
  body: string
  /** Lines they actually saw. Evidence, not examples. */
  evidence: { pt: string; en: string }[]
  /** The technical name, shown small and last — for the people who want it. */
  proper_name: string
}

export const INSIGHTS: Insight[] = [
  {
    id: 'conjugation',
    requires: ['podes'],
    headline: 'Verbs change their ending depending on who is doing it',
    body:
      'You read “podes” as you can and “posso” as I can without stopping. Same verb, different tail. Portuguese does this constantly, and you handled it on sight.',
    evidence: [
      { pt: 'Podes vir comigo?', en: 'Can you come with me?' },
      { pt: 'O que posso fazer?', en: 'What can I do?' },
    ],
    proper_name: 'verb conjugation',
  },
  {
    id: 'gender',
    requires: ['boa_ideia'],
    headline: 'Some words are treated as feminine, some as masculine',
    body:
      'It is “boa ideia”, not “bom ideia” — because ideia is a feminine word, so the word describing it changes to match. You copied that without being told.',
    evidence: [
      { pt: 'uma boa ideia', en: 'a good idea' },
      { pt: 'o lado bom', en: 'the good side' },
    ],
    proper_name: 'grammatical gender and agreement',
  },
  {
    id: 'gender-outra',
    requires: ['outra_vez'],
    headline: 'That “outra” had to be “outra”',
    body:
      '“Outra vez” means another time. Not “outro” — because vez is one of the feminine words. You have already met this pattern twice without it being explained.',
    evidence: [{ pt: 'outra vez', en: 'again / another time' }],
    proper_name: 'grammatical gender',
  },
  {
    id: 'fused-pronoun',
    requires: ['comigo'],
    headline: 'Portuguese glues little words together',
    body:
      '“With me” is not two words. It is comigo — com and mim fused into one. English would never do that, and you did not blink.',
    evidence: [
      { pt: 'comigo', en: 'with me' },
      { pt: 'com', en: 'with' },
    ],
    proper_name: 'prepositional pronoun contraction',
  },
  {
    id: 'verb-plus-de',
    requires: ['preciso_de'],
    headline: 'Some verbs drag a little word along behind them',
    body:
      'It is never just “preciso”. It is “preciso de” — the de comes with it, every time. You learned it as one lump, which is exactly how a Portuguese child learns it.',
    evidence: [
      { pt: 'Preciso de um táxi.', en: 'I need a taxi.' },
      { pt: 'Preciso de tempo.', en: 'I need time.' },
    ],
    proper_name: 'verb + preposition government',
  },
  {
    id: 'estar-a',
    requires: ['estavas_a'],
    headline: 'This is how Portugal says “-ing”',
    body:
      'Not one word, but two: estar plus a plus the verb. Brazil does it differently. You have been using the Portugal version from the start.',
    evidence: [
      { pt: 'Em que estás a pensar?', en: 'What are you thinking about?' },
      { pt: 'Estou a brincar.', en: 'I’m joking.' },
    ],
    proper_name: 'the European Portuguese progressive',
  },
  {
    id: 'past-i',
    requires: ['falei'],
    headline: 'You have been talking about the past',
    body:
      'Falei. Comi. Bebi. That little -i on the end is Portuguese for “I did this, and it is done”. Four words in and you already have a tense.',
    evidence: [
      { pt: 'Falei demais.', en: 'I said too much.' },
      { pt: 'Comi demais.', en: 'I ate too much.' },
    ],
    proper_name: 'the preterite',
  },
  {
    id: 'negation',
    requires: ['nao_vou'],
    headline: 'Saying no is one word, in one place',
    body:
      'Não goes straight in front of the verb and that is the whole job. No helper words, no rearranging the sentence.',
    evidence: [
      { pt: 'Não vou.', en: 'I’m not going.' },
      { pt: 'Não posso.', en: 'I can’t.' },
    ],
    proper_name: 'pre-verbal negation',
  },
  {
    id: 'future',
    requires: ['nao_vou'],
    headline: 'You can talk about tomorrow without a future tense',
    body:
      '“Vou” plus a verb is going to. Portuguese has a proper future tense and almost nobody uses it in conversation. You skipped straight to the one people say.',
    evidence: [
      { pt: 'Não vou sair.', en: 'I’m not going out.' },
      { pt: 'Não vou fazer isso.', en: 'I’m not going to do that.' },
    ],
    proper_name: 'the periphrastic future',
  },
  {
    id: 'reflexive',
    requires: ['chamo_me'],
    headline: 'You introduced yourself by talking about yourself in the mirror',
    body:
      'Chamo-me is literally “I call myself”. Como te chamas is “how do you call yourself”. Portuguese loves this shape, and you now have both ends of it.',
    evidence: [
      { pt: 'Chamo-me Ana.', en: 'My name is Ana.' },
      { pt: 'Como te chamas?', en: 'What’s your name?' },
    ],
    proper_name: 'reflexive verbs with enclitic pronouns',
  },
  {
    id: 'questions',
    requires: ['podes'],
    headline: 'Questions need nothing added',
    body:
      'English bolts a “do” onto the front — do you have time? Portuguese just says it and lifts the voice at the end. Tens tempo?',
    evidence: [
      { pt: 'Tens tempo?', en: 'Do you have time?' },
      { pt: 'É verdade?', en: 'Is it true?' },
    ],
    proper_name: 'intonation questions',
  },
  {
    id: 'imperative',
    requires: ['aproveita'],
    headline: 'You have been giving people instructions',
    body:
      'Aproveita. Procura. Diz. Calma. Telling someone to do something is usually just the verb, stripped back. It sounds blunter in English than it feels in Portuguese.',
    evidence: [
      { pt: 'Aproveita!', en: 'Enjoy it!' },
      { pt: 'Diz outra vez.', en: 'Say it again.' },
    ],
    proper_name: 'the imperative',
  },
  {
    id: 'adjective-after',
    requires: ['bom'],
    headline: 'Describing words usually come after the thing',
    body:
      'English puts good in front of burger. Portuguese mostly does it the other way round — and when it does not, like “boa ideia”, that carries a slightly different weight. You have seen both orders already.',
    evidence: [
      { pt: 'Esse hambúrguer é mesmo bom.', en: 'That burger is really good.' },
      { pt: 'O lado bom.', en: 'The good side.' },
    ],
    proper_name: 'post-nominal adjectives',
  },
  {
    id: 'com-sem',
    requires: ['com', 'sem'],
    headline: 'Two tiny words that order half of everything',
    body:
      'Com and sem — with and without. Between them they cover coffee, ice, sugar, cheese and most of what you will ever ask for across a counter.',
    evidence: [
      { pt: 'Café com leite.', en: 'Coffee with milk.' },
      { pt: 'Sem gelo.', en: 'Without ice.' },
    ],
    proper_name: 'prepositions of accompaniment',
  },
  {
    id: 'comparison',
    requires: ['mais_do_que'],
    headline: 'You can already weigh two things against each other',
    body:
      '“Mais do que” is more than, and it slots between any two things at all. That is a whole comparison built out of three small words.',
    evidence: [
      { pt: 'As pessoas importam mais do que as coisas.', en: 'People matter more than things.' },
      { pt: 'Mais do que isso.', en: 'More than that.' },
    ],
    proper_name: 'comparative constructions',
  },
  {
    id: 'articles',
    requires: ['atraso', 'vida'],
    headline: '“The” comes in two flavours',
    body:
      'O atraso. A vida. Same word in English, two in Portuguese — and which one you use depends on the noun, not on you. You have been picking correctly by copying.',
    evidence: [
      { pt: 'Desculpa o atraso.', en: 'Sorry I’m late.' },
      { pt: 'É a vida.', en: 'That’s life.' },
    ],
    proper_name: 'definite articles',
  },
  {
    id: 'this-that',
    requires: ['como_se_chama'],
    headline: 'Portuguese is fussier than English about this and that',
    body:
      'Isto, isso, esse — English makes do with two words and Portuguese has more, depending on how near the thing is to you or to them. You have been using them by ear.',
    evidence: [
      { pt: 'Isso é mesmo bom.', en: 'That is really good.' },
      { pt: 'Como se chama isto?', en: 'What is this called?' },
    ],
    proper_name: 'demonstratives',
  },
]

/** Pick what is honestly true of this learner, newest ideas first, never repeating. */
export function insightsFor(owned: string[], alreadySeen: string[], limit = 3): Insight[] {
  const has = new Set(owned)
  return INSIGHTS.filter(
    (i) => !alreadySeen.includes(i.id) && i.requires.every((p) => has.has(p)),
  )
    .sort((a, b) => b.requires.length - a.requires.length)
    .slice(0, limit)
}
