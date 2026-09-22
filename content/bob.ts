import type { Root } from '@/content/roots'

/**
 * BOB'S YOUR UNCLE — English idioms you can learn from.
 *
 * Sam: "create a pre-legend vibe that is called Bob's Your Uncle! — English idioms you can
 * learn from, that can feed the legend... Just pick ones you can unpack for the Bob vibe."
 *
 * THE SAME CONTENT IN TWO PLACES, DOING TWO DIFFERENT JOBS. All thirty idioms live in the
 * Club as cards, where the job is the joke: you guess, you turn it over, nothing is
 * extracted and nothing is owed. This is the other half — twelve of those thirty, the ones
 * whose Portuguese actually comes apart into words worth having, taught as roots so they
 * bank like any other vibe and count towards the Legend.
 *
 * WHICH TWELVE, AND WHY NOT ALL THIRTY. The test is whether the equivalent survives being
 * broken up. `É canja` is wonderful and teaches nothing — canja is chicken soup, the joke
 * is the swap, and there is no third sentence anywhere in Portuguese that wants it. `Mais
 * vale tarde do que nunca` is four separate pieces a learner will use for the rest of
 * their life: mais vale, tarde, do que, nunca. Eighteen idioms are the first kind. They
 * are not lesser — they are Club material, which is a different and equally real thing —
 * and forcing them into a lesson would mean inventing extracts nobody needs, which is the
 * exact padding content/idioms.ts refuses.
 *
 * PRE-LEGEND, at rung 1 with opens_at: 1, alongside the basics. That is deliberate and it
 * is the point of the whole idea: an idiom is the least intimidating way into a language
 * because the learner already owns the English half. Somebody who has never seen a
 * conjugation can meet "há males que vêm por bem" and take away `bem`, `mais`, `nunca` and
 * `tudo` without once being told they are studying.
 *
 * THE BRIDGE CARRIES THE WTF. Every other vibe's semantic_bridge explains a construction;
 * these explain a FAILURE first and then the construction — the literal wreckage, then what
 * Portugal says instead. That is the same four-beat shape as the Club card, compressed into
 * one paragraph, and it is why these roots read differently from every other vibe in the
 * product while teaching in exactly the same way.
 *
 * The `credit` on each root is the idiom itself rather than a film or a band, because that
 * is honestly where the line comes from: nobody wrote "hold your horses", which is what
 * makes it an idiom rather than a quotation.
 */
/**
 * The same defaults roots.ts gives every other root, applied locally.
 *
 * `q` there is module-private and exporting it would mean bob.ts and roots.ts importing
 * each other's values rather than only a type — a real cycle for the sake of saving nine
 * repeated lines. These roots are all rung 1, all idioms, all DUB's own Portuguese, so the
 * defaults are narrower than the general helper's and say so.
 */
const idiom = (
  r: Partial<Root> &
    Pick<
      Root,
      | 'root_id'
      | 'culture_family'
      | 'rung'
      | 'root_display'
      | 'source'
      | 'target'
      | 'semantic_bridge'
      | 'subtext'
      | 'extracts'
      | 'branches'
      | 'transfer_prompt'
    >,
): Root => ({
  root_type: 'other',
  source_label: '',
  source_status: 'verified',
  reinforces: [],
  /* An idiom has no author to clear, and the Portuguese beside it is ours. */
  rights_status: 'dub-authored',
  qa_status: 'pending-native-review',
  freebie_flag: false,
  starter_tags: [],
  next_root_hooks: [],
  ...r,
})

export const BOB: Root[] = [
  idiom({
    root_id: 'bob_hold_your_horses',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'Hold your horses',
    source_label: 'Hold your horses — English, and nobody has had a horse in a century',
    source_status: 'verified',
    root_display: 'Hold your horses',
    source: 'Hold your horses.',
    target: 'Calma.',
    semantic_bridge:
      'Segura os teus cavalos gets you a baffled look and a question about livestock. Portuguese does the whole job with one word — calma — and it is the most useful word on this shelf: it works on a queue, a driver, a child and an argument, and it is a complete sentence on its own.',
    subtext: 'Four English words, one Portuguese one, and the Portuguese one is better.',
    freebie_flag: true,
    extracts: [
      { id: 'calma', target: 'calma', gloss: 'calm', shelf: 'just_say', note: 'A whole sentence on its own. Also the adjective, and the noun.' },
    ],
    branches: [
      { target: 'Calma, não há pressa.', en: 'Easy, there is no rush.', demonstrates: ['calma'] },
      { target: 'Tem calma.', en: 'Take it easy.', demonstrates: ['calma'] },
      { target: 'Está tudo calmo.', en: 'Everything is quiet.', demonstrates: ['calma'] },
    ],
    helpers: {
      'não há': 'there is not',
      'pressa': 'rush',
      'tem': 'have',
      'está': 'is',
      'tudo': 'everything',
      'calmo': 'calm',
    },
    transfer_prompt: {
      context: 'Somebody is getting worked up in a queue ahead of you.',
      ask: 'Easy, there is no rush.',
      answer: 'Calma, não há pressa.',
    },
    starter_tags: ['first-day'],
  }),
  idiom({
    root_id: 'bob_better_late',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'Better late than never',
    source_label: 'Better late than never — and it survives the crossing almost intact',
    source_status: 'verified',
    root_display: 'Better late than never',
    source: 'Better late than never.',
    target: 'Mais vale tarde do que nunca.',
    semantic_bridge:
      'This one nearly translates straight, which is the trap: melhor tarde do que nunca is correct and sounds like a translation. MAIS VALE is what makes it native — literally "more is worth", the Portuguese way of saying one thing beats another. Four pieces here and you will use every one of them for the rest of your life.',
    subtext: 'The one on this shelf that comes apart into the most useful parts.',
    extracts: [
      { id: 'mais_vale', target: 'mais vale', gloss: 'better to', shelf: 'small_words', note: 'Literally "worth more". The native way to say one thing beats another.' },
      { id: 'tarde', target: 'tarde', gloss: 'late', shelf: 'when', note: 'Also the word for afternoon — boa tarde is good afternoon.' },
      { id: 'nunca', target: 'nunca', gloss: 'never', shelf: 'when' },
    ],
    branches: [
      { target: 'Mais vale agora.', en: 'Better now.', demonstrates: ['mais_vale'] },
      { target: 'Chego tarde.', en: 'I am arriving late.', demonstrates: ['tarde'] },
      { target: 'Nunca mais.', en: 'Never again.', demonstrates: ['nunca'] },
    ],
    helpers: {
      'do que': 'than',
      'agora': 'now',
      'chego': 'I arrive',
    },
    transfer_prompt: {
      context: 'A friend finally replies to a message you sent in March.',
      ask: 'Never again.',
      answer: 'Nunca mais.',
    },
  }),
  idiom({
    root_id: 'bob_bobs_your_uncle',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: "Bob's your uncle",
    source_label: "Bob's your uncle — the phrase this whole shelf is named after",
    source_status: 'verified',
    root_display: "Bob's your uncle",
    source: "And Bob's your uncle.",
    target: 'E pronto.',
    semantic_bridge:
      'There is no Bob, there has never been a Bob, and o Bob é teu tio leaves a Portuguese person waiting to hear about your uncle. E PRONTO is the equivalent and it is two of the most useful words in the language — it closes an explanation, a story or an argument, and you will hear it forty times a day.',
    subtext: 'The name on the door, and the phrase that shuts it.',
    extracts: [
      { id: 'pronto', target: 'pronto', gloss: 'ready', shelf: 'just_say', note: 'On its own it closes a thing: right, done, there you go. You will hear it constantly.' },
    ],
    branches: [
      { target: 'Estou pronto.', en: 'I am ready.', demonstrates: ['pronto'] },
      { target: 'Pronto, já está.', en: 'Right, it is done.', demonstrates: ['pronto'] },
      { target: 'Estás pronto?', en: 'Are you ready?', demonstrates: ['pronto'], address: 'tu', formal: 'Está pronto?' },
    ],
    helpers: {
      'estou': 'I am',
      'já': 'already',
      'está': 'it is',
      'estás': 'you are',
    },
    transfer_prompt: {
      context: 'Somebody is waiting at the door with their coat on.',
      ask: 'I am ready.',
      answer: 'Estou pronto.',
    },
    starter_tags: ['first-day'],
  }),
  idiom({
    root_id: 'bob_so_far_so_good',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'So far, so good',
    source_label: 'So far, so good — which goes nowhere word for word',
    source_status: 'verified',
    root_display: 'So far, so good',
    source: 'So far, so good.',
    target: 'Para já, tudo bem.',
    semantic_bridge:
      'Tão longe, tão bom says something about distance and quality and nothing about how it is going. PARA JÁ is the piece worth having — "for now", the hedge Portuguese puts in front of any answer it is not ready to commit to. TUDO BEM you will meet twenty times a day as a greeting, a question and an answer.',
    subtext: 'The two phrases Portugal uses to avoid promising anything.',
    extracts: [
      { id: 'para_ja', target: 'para já', gloss: 'for now', shelf: 'when' },
      { id: 'tudo_bem', target: 'tudo bem', gloss: 'all good', shelf: 'just_say', note: 'A greeting, a question and an answer, depending only on your tone.' },
    ],
    branches: [
      { target: 'Para já, não.', en: 'Not for now.', demonstrates: ['para_ja'] },
      { target: 'Tudo bem?', en: 'All good?', demonstrates: ['tudo_bem'] },
      { target: 'Está tudo bem.', en: 'Everything is fine.', demonstrates: ['tudo_bem'] },
    ],
    helpers: {
      'não': 'no / not',
      'está': 'is',
    },
    transfer_prompt: {
      context: 'You pass a neighbour on the stairs.',
      ask: 'All good?',
      answer: 'Tudo bem?',
    },
    starter_tags: ['first-day'],
  }),
  idiom({
    root_id: 'bob_storm_teacup',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'A storm in a teacup',
    source_label: 'A storm in a teacup — the tea does not travel',
    source_status: 'verified',
    root_display: 'A storm in a teacup',
    source: 'It is a storm in a teacup.',
    target: 'É muito barulho para nada.',
    semantic_bridge:
      'Uma tempestade numa chávena de chá is grammatical, comprehensible, and has never been said by anybody — Portugal runs on coffee and the metaphor never arrived. What it says instead gives you MUITO and NADA, the two ends of the scale, which between them cover most of what you will need to say about quantity.',
    subtext: 'A lot of noise for nothing, which is also a fair description of the English.',
    extracts: [
      { id: 'muito', target: 'muito', gloss: 'a lot / very', shelf: 'how_much' },
      { id: 'nada', target: 'nada', gloss: 'nothing', shelf: 'how_much' },
    ],
    branches: [
      { target: 'Muito obrigado.', en: 'Thank you very much.', demonstrates: ['muito'] },
      { target: 'Não é nada.', en: 'It is nothing.', demonstrates: ['nada'] },
      { target: 'Muito bem.', en: 'Very good.', demonstrates: ['muito'] },
    ],
    helpers: {
      'barulho': 'noise',
      'para': 'for',
      'obrigado': 'thank you',
    },
    transfer_prompt: {
      context: 'Somebody has just carried your bag up three flights of stairs.',
      ask: 'Thank you very much.',
      answer: 'Muito obrigado.',
    },
  }),
  idiom({
    root_id: 'bob_here_we_go',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'Here we go again',
    source_label: 'Here we go again — and Portuguese points the other way',
    source_status: 'verified',
    root_display: 'Here we go again',
    source: 'Here we go again.',
    target: 'Lá vamos nós.',
    semantic_bridge:
      'Aqui vamos nós outra vez is understandable and lands as a translation. The native version points AWAY from you — lá, there — and that is what carries the weariness: it is happening over there, to us, again. VAMOS is the piece that goes everywhere, and it is how Portugal says both "we go" and "let us go".',
    subtext: 'Pointing away from yourself is the whole joke.',
    extracts: [
      { id: 'vamos', target: 'vamos', gloss: 'we go / let us go', shelf: 'doing' },
      { id: 'la', target: 'lá', gloss: 'there', shelf: 'people' },
    ],
    branches: [
      { target: 'Vamos embora.', en: 'Let us go.', demonstrates: ['vamos'] },
      { target: 'Está lá?', en: 'Are you there?', demonstrates: ['la'] },
      { target: 'Vamos lá.', en: 'Come on then.', demonstrates: ['vamos', 'la'] },
    ],
    helpers: {
      'embora': 'away',
      'nós': 'we / us',
    },
    transfer_prompt: {
      context: 'Everybody has their coat on and nobody is moving.',
      ask: 'Come on then.',
      answer: 'Vamos lá.',
    },
  }),
  idiom({
    root_id: 'bob_once_in_blue_moon',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'Once in a blue moon',
    source_label: 'Once in a blue moon — no moon, and no blue',
    source_status: 'verified',
    root_display: 'Once in a blue moon',
    source: 'Once in a blue moon.',
    target: 'De vez em quando.',
    semantic_bridge:
      'Uma vez numa lua azul leaves somebody waiting to hear what the moon has to do with it. Portuguese is flatter and far more useful: de vez em quando, every now and then. VEZ is the counting word for occasions — uma vez, outra vez, às vezes — and QUANDO is simply "when", which you will need on your first day.',
    subtext: 'Less romantic, and you will say it every week.',
    extracts: [
      { id: 'vez', target: 'vez', gloss: 'occasion', shelf: 'when', note: 'The counting word for times something happens: uma vez, outra vez, às vezes.' },
      { id: 'quando', target: 'quando', gloss: 'when', shelf: 'when' },
    ],
    branches: [
      { target: 'Outra vez, por favor.', en: 'Again, please.', demonstrates: ['vez'] },
      { target: 'Quando chegas?', en: 'When do you arrive?', demonstrates: ['quando'] },
      { target: 'Às vezes.', en: 'Sometimes.', demonstrates: ['vez'] },
    ],
    helpers: {
      'de': 'of',
      'em': 'in',
      'por favor': 'please',
      'chegas': 'you arrive',
      'às': 'at the',
      'vezes': 'times',
    },
    transfer_prompt: {
      context: 'You did not catch what somebody said.',
      ask: 'Again, please.',
      answer: 'Outra vez, por favor.',
    },
    starter_tags: ['first-day'],
  }),
  idiom({
    root_id: 'bob_youre_having_a_laugh',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: "You're having a laugh",
    source_label: "You're having a laugh — an observation nobody asked for",
    source_status: 'verified',
    root_display: "You're having a laugh",
    source: 'You are having a laugh.',
    target: 'Estás a brincar.',
    semantic_bridge:
      'Estás a ter uma risada observes that somebody is laughing, which they were not. BRINCAR is the word — to play, to joke, to mess about — and the construction underneath it is the one that unlocks the whole language: estás a + verb is how Portuguese says you are doing something right now.',
    subtext: 'The joke is a bonus. The construction is the lesson.',
    extracts: [
      { id: 'estas_a', target: 'estás a', gloss: 'you are', shelf: 'doing', note: 'Followed by a verb it makes the right-now tense: estás a brincar, you are joking.' },
      { id: 'brincar', target: 'brincar', gloss: 'to joke', shelf: 'doing', note: 'Also to play. A child brinca; so does somebody winding you up.' },
    ],
    branches: [
      { target: 'Estás a brincar comigo?', en: 'Are you joking with me?', demonstrates: ['estas_a', 'brincar'], address: 'tu', formal: 'Está a brincar comigo?' },
      { target: 'Estás a falar comigo?', en: 'Are you talking to me?', demonstrates: ['estas_a'], address: 'tu', formal: 'Está a falar comigo?' },
      { target: 'Não estou a brincar.', en: 'I am not joking.', demonstrates: ['brincar'] },
    ],
    helpers: {
      'comigo': 'with me',
      'falar': 'to talk',
      'não estou': 'I am not',
      'está': 'you are',
    },
    transfer_prompt: {
      context: 'Somebody insists they are serious and you do not believe them.',
      ask: 'I am not joking.',
      answer: 'Não estou a brincar.',
    },
  }),
  idiom({
    root_id: 'bob_it_is_what_it_is',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'It is what it is',
    source_label: 'It is what it is — and Portugal has a better one',
    source_status: 'verified',
    root_display: 'It is what it is',
    source: 'It is what it is.',
    target: 'É o que temos.',
    semantic_bridge:
      'É o que é is correct and gets said. What gets reached for first is é o que temos — "it is what we have" — which is resigned, shared and very Portuguese: not a fact about the universe, a fact about what is on the table. TEMOS is the piece, and it is the verb you will use for everything you own, need and have to do.',
    subtext: 'A shrug, with the whole country in it.',
    extracts: [
      { id: 'temos', target: 'temos', gloss: 'we have', shelf: 'doing' },
    ],
    branches: [
      { target: 'Não temos mais.', en: 'We have no more.', demonstrates: ['temos'] },
      { target: 'Temos tempo.', en: 'We have time.', demonstrates: ['temos'] },
      { target: 'Temos uma mesa.', en: 'We have a table.', demonstrates: ['temos'] },
    ],
    helpers: {
      'o que': 'what',
      'mais': 'more',
      'tempo': 'time',
      'uma': 'a',
      'mesa': 'table',
    },
    transfer_prompt: {
      context: 'Somebody is worrying that you will miss the last train.',
      ask: 'We have time.',
      answer: 'Temos tempo.',
    },
  }),
  idiom({
    root_id: 'bob_god_knows',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'God knows',
    source_label: 'God knows — rather more devout than you intended',
    source_status: 'verified',
    root_display: 'God knows',
    source: 'God knows.',
    target: 'Sabe-se lá.',
    semantic_bridge:
      'Deus sabe is perfectly fine and brings God into a conversation about bus timetables. Sabe-se lá keeps him out of it — literally "it is known there", which is Portuguese for nobody has the faintest idea. SABER is the verb for knowing a fact, and it is one of the two most useful verbs you will learn this month.',
    subtext: 'The shrug that does not involve a deity.',
    extracts: [
      { id: 'sabe', target: 'sabe', gloss: 'knows / do you know', shelf: 'asking' },
    ],
    branches: [
      { target: 'Sabe onde é?', en: 'Do you know where it is?', demonstrates: ['sabe'] },
      { target: 'Não sabe.', en: 'He does not know.', demonstrates: ['sabe'] },
      { target: 'Sabe a que horas abre?', en: 'Do you know what time it opens?', demonstrates: ['sabe'] },
    ],
    helpers: {
      'onde': 'where',
      'é': 'is',
      'se': 'one',
      'sabe-se': 'it is known',
      'a que horas': 'at what time',
      'abre': 'opens',
    },
    transfer_prompt: {
      context: 'You are outside a museum with no opening hours on the door.',
      ask: 'Do you know what time it opens?',
      answer: 'Sabe a que horas abre?',
    },
  }),
  idiom({
    root_id: 'bob_last_straw',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'The last straw',
    source_label: 'The last straw — a camel nobody can see',
    source_status: 'verified',
    root_display: 'The last straw',
    source: 'That was the last straw.',
    target: 'Foi a gota de água.',
    semantic_bridge:
      'A última palha is a stray piece of straw and the camel it belongs to is nowhere in the sentence. Portugal uses the glass that finally overflows instead — the drop of water — which is the better picture and hands you ÁGUA, the first noun anybody needs, and FOI, the past of "to be".',
    subtext: 'The same moment, drawn better.',
    extracts: [
      { id: 'gota', target: 'gota', gloss: 'drop', shelf: 'things', gender: 'f' },
      { id: 'agua', target: 'água', gloss: 'water', shelf: 'things', gender: 'f' },
    ],
    branches: [
      { target: 'Uma água, por favor.', en: 'A water, please.', demonstrates: ['agua'] },
      { target: 'Água sem gás.', en: 'Still water.', demonstrates: ['agua'] },
      { target: 'Nem uma gota.', en: 'Not a drop.', demonstrates: ['gota'] },
    ],
    helpers: {
      'foi': 'it was',
      'de': 'of',
      'sem': 'without',
      'gás': 'gas',
      'nem': 'not even',
    },
    transfer_prompt: {
      context: 'You are at a counter and thirsty.',
      ask: 'A water, please.',
      answer: 'Uma água, por favor.',
    },
    starter_tags: ['first-day'],
  }),
  idiom({
    root_id: 'bob_speak_of_the_devil',
    culture_family: 'bobs_your_uncle',
    rung: 1,
    root_type: 'other',
    credit: 'Speak of the devil',
    source_label: 'Speak of the devil — one of the very few that crosses intact',
    source_status: 'verified',
    root_display: 'Speak of the devil',
    source: 'Speak of the devil.',
    target: 'Falar no diabo e ele aparece.',
    semantic_bridge:
      'This one survives, which almost never happens on this shelf — the superstition is the same and so is the wording. Enjoy it, and take FALAR away with you: it is the verb for talking, the one you will need in order to say that you do not yet speak very much.',
    subtext: 'The exception that makes the rest of the shelf make sense.',
    extracts: [
      { id: 'falar', target: 'falar', gloss: 'to speak / to talk', shelf: 'doing' },
    ],
    branches: [
      { target: 'Não falo português.', en: 'I do not speak Portuguese.', demonstrates: ['falar'] },
      { target: 'Pode falar devagar?', en: 'Can you speak slowly?', demonstrates: ['falar'] },
      { target: 'Quero falar contigo.', en: 'I want to talk to you.', demonstrates: ['falar'], address: 'tu', formal: 'Quero falar consigo.' },
    ],
    helpers: {
      'não falo': 'I do not speak',
      'falo': 'I speak',
      'português': 'Portuguese',
      'pode': 'can you',
      'devagar': 'slowly',
      'ele': 'he',
      'aparece': 'appears',
      'diabo': 'devil',
      'quero': 'I want',
      'contigo': 'with you',
      'consigo': 'with you',
    },
    transfer_prompt: {
      context: 'Somebody at a counter is talking far too fast for you.',
      ask: 'Can you speak slowly?',
      answer: 'Pode falar devagar?',
    },
  }),
]
