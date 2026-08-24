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
  /*
    The basics carry real grammar, which is the argument against calling them a syllabus.

    A crate that teaches hello and thank you looks like a word list until you notice that
    obrigado is an adjective agreeing with the speaker, and that Portuguese negates by
    putting não in front and then, very often, on the end as well. Both are absorbed
    before they are ever explained — which is exactly what this screen is for.
  */
  {
    id: 'obrigado-agrees-with-you',
    requires: ['obrigado'],
    headline: 'You have been describing yourself, not thanking them',
    body:
      '“Obrigado” is not a word for thanks — it is the word “obliged”, and it agrees with whoever is saying it. A man is obrigado, a woman is obrigada, whoever they are talking to. It is the first place Portuguese asks you to notice that adjectives have a gender, and you have already done it.',
    evidence: [
      { pt: 'Muito obrigado.', en: 'Thank you very much. — said by a man' },
      { pt: 'Obrigada, é muito simpático.', en: 'Thank you, that is very kind. — said by a woman' },
    ],
    proper_name: 'adjective agreement',
  },
  {
    id: 'nao-goes-in-front',
    requires: ['nao'],
    headline: 'You said no twice in one sentence, and it was right',
    body:
      'Portuguese negates by putting não immediately in front and leaving everything else exactly where it was — no do, does or did, and no rearranging. Then, in speech, it very often lands a second não on the end as well. It is not emphasis and it is not a mistake; it is how the sentence closes, and you have already done it without being told.',
    evidence: [
      { pt: 'Não, obrigado.', en: 'No, thank you.' },
      { pt: 'Não, no domingo não.', en: 'No, not on Sunday.' },
    ],
    proper_name: 'preverbal negation, and the tail',
  },
  {
    id: 'conditional-politeness',
    requires: ['gostava_de'],
    headline: 'You used a past tense to talk about something that has not happened',
    body:
      '“Gostava” and “queria” look like they are about yesterday. Portuguese uses them for “I would like”, because putting a want slightly out of reach is what makes it polite. It is the same word you order coffee with.',
    evidence: [
      { pt: 'Gostava de um café.', en: 'I’d like a coffee.' },
      { pt: 'Queria um café, por favor.', en: 'I’d like a coffee, please.' },
    ],
    proper_name: 'the imperfect as a conditional',
  },
  {
    id: 'clitic-moves',
    requires: ['pedir_te'],
    headline: 'The little word kept changing sides and you followed it',
    body:
      'It is “oferecer-te” but “para te pedir”. The pronoun sits behind the verb normally and jumps in front after words like para, que and não. You have now seen both without either being explained.',
    evidence: [
      { pt: 'Posso oferecer-te uma bebida?', en: 'Can I get you a drink?' },
      { pt: 'Vim aqui para te pedir uma coisa.', en: 'I came here to ask you something.' },
    ],
    proper_name: 'clitic placement',
  },
  {
    id: 'ser-estar-compliment',
    requires: ['engracado'],
    headline: 'You paid two different kinds of compliment and never mixed them up',
    body:
      '“Estás lindo” is about tonight. “És engraçado” is about him. Portuguese keeps the passing and the permanent in two different verbs, and choosing the wrong one turns a compliment into a declaration.',
    evidence: [
      { pt: 'Estás lindo.', en: 'You look wonderful.' },
      { pt: 'És muito engraçado.', en: 'You’re really funny.' },
    ],
    proper_name: 'ser and estar',
  },
  {
    id: 'diminutives',
    requires: ['beijinho'],
    headline: 'You made a word smaller and it came out friendlier',
    body:
      'Beijo becomes beijinho, café becomes cafezinho. The ending does not really mean “small” — it means “and I like you”. Portugal runs on it.',
    evidence: [
      { pt: 'Dois beijinhos.', en: 'Two little kisses.' },
      { pt: 'Apetece-te um cafezinho?', en: 'Fancy a little coffee?' },
    ],
    proper_name: 'diminutives',
  },
  {
    id: 'direction-reversal',
    requires: ['ligas_me'],
    headline: 'You turned a sentence around by changing two endings',
    body:
      '“Ligas-me” is you calling me. “Ligo-te” is me calling you. Same verb. The end of the verb says who acts, and the bit hooked on the back says who it lands on.',
    evidence: [
      { pt: 'Ligas-me logo?', en: 'Will you call me later?' },
      { pt: 'Ligo-te logo.', en: 'I’ll call you later.' },
    ],
    proper_name: 'person marking and clitic pronouns',
  },
  {
    id: 'clitics',
    requires: ['esqueci_me'],
    headline: 'You have been hooking little words onto the ends of verbs',
    body:
      '“Esqueci-me” is esqueci plus me, joined by a hyphen. Portuguese does this constantly — chamo-me, foda-se, senta-se. Once you can see that hyphen you can take almost any spoken sentence apart.',
    evidence: [
      { pt: 'Esqueci-me do telemóvel.', en: 'I forgot my phone.' },
      { pt: 'Foda-se, esqueci-me.', en: 'For f***’s sake, I forgot.' },
    ],
    proper_name: 'enclitic pronouns',
  },
  {
    id: 'ser-estar',
    requires: ['uma_merda'],
    headline: 'You used two different words for “is” and never once mixed them up',
    body:
      '“O filme é uma merda” — the film simply is. “Hoje estou uma merda” — today you happen to feel like it. Portuguese keeps permanent and temporary in separate verbs, and you picked the right one by ear.',
    evidence: [
      { pt: 'O filme é uma merda.', en: 'The film is crap.' },
      { pt: 'Hoje estou uma merda.', en: 'I feel like crap today.' },
    ],
    proper_name: 'ser and estar',
  },
  {
    id: 'gender-cabrao',
    requires: ['cabrao'],
    headline: 'You changed the end of a word to match who you were talking to',
    body:
      'Cabrão for a man, cabra for a woman — and um turns into uma to keep it company. That is the same rule that decides obrigado and obrigada, arriving from a considerably ruder direction.',
    evidence: [
      { pt: 'És um grande cabrão.', en: 'You absolute bastard.' },
      { pt: 'És uma grande cabra.', en: 'You’re an utter cow.' },
    ],
    proper_name: 'gender agreement',
  },
  {
    id: 'adjective-before',
    requires: ['grande'],
    headline: 'You moved one word in front of another and it stopped meaning what it meant',
    body:
      'Grande after a noun means big. Grande in front of it means utter. “És um grande amigo” is a compliment; “um amigo grande” is a remark about his size.',
    evidence: [
      { pt: 'És um grande amigo.', en: 'You’re a great friend.' },
      { pt: 'Que grande merda.', en: 'What an utter mess.' },
    ],
    proper_name: 'adjective position',
  },
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
  {
    id: 'adjective-after',
    requires: ['mundo', 'normal'],
    headline: 'You put the describing word after the thing, and it sounded right',
    body:
      'English says ordinary world. Portuguese says mundo normal — the description goes behind, almost every time. You have been doing it since the first title and nobody mentioned it.',
    evidence: [
      { pt: 'Um mundo normal.', en: 'An ordinary world.' },
      { pt: 'Uma vida nova.', en: 'A new life.' },
    ],
    proper_name: 'adjective position',
  },
  {
    id: 'ter-for-states',
    requires: ['tenho', 'fome'],
    headline: 'You said you had hunger, and that is genuinely how it works here',
    body:
      'English is hungry, is thirsty, is cold. Portuguese has all of them. Once you notice it you have fome, sede, frio, calor and razão in one go, because they all hang off the same verb.',
    evidence: [
      { pt: 'Tenho fome.', en: 'I’m hungry.' },
      { pt: 'Tenho sede.', en: 'I’m thirsty.' },
    ],
    proper_name: 'ter for physical states',
  },
  {
    id: 'latin-stress',
    requires: ['agua', 'ridiculo'],
    headline: 'You have been saying these words for years, in the wrong place',
    body:
      'Água is ÁH-gwa and ridículo is ri-DÍ-culo. The words came to Portuguese and to English from the same Latin, and Portuguese kept the beat where Latin put it while English moved it. Nobody taught you that — you have just been hearing it and copying it.',
    evidence: [
      { pt: 'Água sem gás.', en: 'Still water.' },
      { pt: 'Que ridículo!', en: 'How ridiculous!' },
    ],
    proper_name: 'Latin stress in Portuguese',
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
