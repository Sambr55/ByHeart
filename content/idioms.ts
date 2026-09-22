import type { PieceId } from '@/engine/learner'

/**
 * WHAT YOUR LOT SAY, AND WHAT THIS LOT SAY INSTEAD.
 *
 * Sam: "Famous phrases from (your) country translated into your chosen language. They have
 * big cards with big words initially in teh destination language and then you tap to
 * reveal... show literal translation → WTF? → actual local equivalent → reusable building
 * blocks."
 *
 * THE MIDDLE BEAT IS THE TEACHING, and it is the one a flashcard cannot do. "Bob's your
 * uncle" rendered word for word into Portuguese is nonsense — o Bob é teu tio — and the
 * nonsense is not a failure of the exercise, it IS the exercise. A learner who has just
 * watched an English idiom fall apart in translation has understood, in one beat and
 * without being told, that idiom does not cross languages intact. Everything the product
 * teaches afterwards about e pronto lands on ground that has already been broken up.
 *
 * So the order is fixed and it is not negotiable: the English, then the literal wreckage,
 * then what a Portuguese person would actually say, then the pieces of that worth keeping.
 * Reversing the middle two — equivalent first, literal as a footnote — turns it back into
 * a phrasebook, which is the thing it is meant to be better than.
 *
 * THE EQUIVALENT IS WHAT SOMEBODY SAYS, NOT WHAT A DICTIONARY OFFERS. This is where a file
 * like this goes wrong: there is almost always a textbook rendering that is defensible and
 * dead. "Não é a minha chávena de chá" is comprehensible and no Portuguese person has ever
 * said it. `equivalent` is the line you would actually hear; where the honest answer is
 * that Portuguese simply does not have one, `equivalent` says the nearest real thing and
 * `note` admits the gap rather than inventing a proverb to fill it.
 *
 * THE BLOCKS ARE THE POINT OF IT BEING IN A LANGUAGE APP. An idiom you can only deploy
 * whole is a party trick. `blocks` names the bits that detach and go elsewhere — não faz
 * mal, calma, logo se vê — which is what turns a joke card into vocabulary. Every id here
 * is checked against PIECES by scripts/lint-content.ts, so a block cannot name a word the
 * product does not teach.
 *
 * NOTHING HERE IS SCORED BY BEING READ. See `idioms` on the learner record for the tick,
 * what it counts, and the argument for why a tally is allowed on this card when it is
 * refused on a Legend one.
 */
export interface Idiom {
  id: string
  /** The English, as somebody would actually say it. */
  english: string
  /**
   * Word for word into Portuguese, and it is meant to be wrong.
   *
   * Not "a bad translation" — a faithful one, which is what makes the joke. The learner
   * reads it, it does not work, and that is the lesson landing before the answer arrives.
   */
  literal: string
  /** Why the literal fails, in one line. The WTF, said out loud. */
  wtf: string
  /** What a Portuguese person says in the same moment. */
  equivalent: string
  /** The equivalent, back into English, so nobody has to guess what they just learned. */
  gloss: string
  /**
   * The honest footnote: register, region, or the admission that there is no real match.
   *
   * Optional, because most idioms need no caveat and a note on every card is noise.
   */
  note?: string
  /**
   * Pieces worth keeping out of the equivalent, which is what makes this vocabulary.
   *
   * Checked against PIECES. An idiom that teaches no detachable word is still allowed —
   * some are simply funny — but most should carry at least one.
   */
  blocks: PieceId[]
  /**
   * Rude enough that somebody would not want it read over their shoulder.
   *
   * Sam put the whole list in the Club deliberately: "all of them in the feed". The flag
   * does not hide anything — it exists so the card can warn before the reveal, which is a
   * different thing from censoring it. A person on a bus gets to choose the moment they
   * turn over "for fuck's sake"; they do not get to choose whether it is in the deck.
   */
  blue?: true
}

/**
 * Thirty, which is enough that two or three in a session never repeats within a fortnight.
 *
 * Ordered roughly by how often an English speaker would reach for them rather than by
 * theme: the feed takes them in its own order anyway, and a list grouped by topic tempts
 * an editor to complete the set rather than to keep each one good.
 */
export const IDIOMS: Idiom[] = [
  {
    id: 'bobs_your_uncle',
    english: "Bob's your uncle",
    literal: 'O Bob é teu tio',
    wtf: 'There is no Bob. There has never been a Bob. Portuguese is now waiting to hear about your uncle.',
    equivalent: 'E pronto',
    gloss: 'And there you go.',
    note: 'Two words, and one of the most useful in the language — it closes an explanation, a story, or an argument. You will hear it forty times a day.',
    blocks: [],
  },
  {
    id: 'not_my_cup_of_tea',
    english: 'Not my cup of tea',
    literal: 'Não é a minha chávena de chá',
    wtf: 'Perfectly grammatical, perfectly understood, and nobody has ever said it. Portugal runs on coffee and the metaphor never arrived.',
    equivalent: 'Não faz o meu género',
    gloss: "It's not my sort of thing.",
    blocks: [],
  },
  {
    id: 'piece_of_cake',
    english: 'Piece of cake',
    literal: 'Um pedaço de bolo',
    wtf: 'You have ordered dessert.',
    equivalent: 'É canja',
    gloss: "It's chicken soup.",
    note: 'Canja is the broth you are given when you are ill — so easy that a sick person manages it. Portugal swapped the cake for soup and kept the idea.',
    blocks: [],
  },
  {
    id: 'hold_your_horses',
    english: 'Hold your horses',
    literal: 'Segura os teus cavalos',
    wtf: 'Nobody has horses. You sound like you are about to sell them some.',
    equivalent: 'Calma',
    gloss: 'Calm.',
    note: 'One word does the whole job, and it is the single most useful thing on this list — it works on a queue, a driver, a child and an argument.',
    blocks: ['calma'],
  },
  {
    id: 'keep_your_hair_on',
    english: 'Keep your hair on',
    literal: 'Mantém o teu cabelo posto',
    wtf: 'You have told a stranger to hang on to their hair.',
    equivalent: 'Não te passes',
    gloss: "Don't lose it.",
    blocks: [],
  },
  {
    id: 'storm_in_a_teacup',
    english: 'A storm in a teacup',
    literal: 'Uma tempestade numa chávena de chá',
    wtf: 'The tea again. It survives translation and still lands on nothing.',
    equivalent: 'Muito barulho para nada',
    gloss: 'A lot of noise for nothing.',
    blocks: [],
  },
  {
    id: 'the_penny_dropped',
    english: 'The penny dropped',
    literal: 'A moeda caiu',
    wtf: 'A coin has fallen. Somebody will look for it.',
    equivalent: 'Caiu a ficha',
    gloss: 'The token dropped.',
    note: 'Almost the same picture from a different machine — the ficha is the token in an old payphone. Portugal got there by another route.',
    blocks: [],
  },
  {
    id: 'plenty_more_fish',
    english: "There's plenty more fish in the sea",
    literal: 'Há muito mais peixe no mar',
    wtf: 'This one nearly works, which is the trap — it is understood and it is not what gets said.',
    equivalent: 'Há mais marés que marinheiros',
    gloss: 'There are more tides than sailors.',
    note: 'A country that has always gone to sea has the better version of this.',
    blocks: [],
  },
  {
    id: 'break_a_leg',
    english: 'Break a leg',
    literal: 'Parte uma perna',
    wtf: 'You have instructed someone to injure themselves before a performance.',
    equivalent: 'Boa sorte',
    gloss: 'Good luck.',
    note: 'The superstition about not saying good luck is an English theatre thing. Here you just wish them luck.',
    blocks: [],
  },
  {
    id: 'bite_the_bullet',
    english: 'Bite the bullet',
    literal: 'Morde a bala',
    wtf: 'Nobody is being operated on in a field hospital.',
    equivalent: 'Fazer das tripas coração',
    gloss: 'To make a heart out of your guts.',
    note: 'More violent than the English and far more common. Portuguese does not flinch from a body part.',
    blocks: [],
  },
  {
    id: 'the_last_straw',
    english: 'The last straw',
    literal: 'A última palha',
    wtf: 'A stray piece of straw. Nobody can see the camel you are thinking of.',
    equivalent: 'Foi a gota de água',
    gloss: 'It was the drop of water.',
    note: 'The glass that finally overflows rather than the camel that finally breaks — same moment, better picture.',
    blocks: ['agua'],
  },
  {
    id: 'speak_of_the_devil',
    english: 'Speak of the devil',
    literal: 'Fala do diabo',
    wtf: 'This one actually survives, which almost never happens.',
    equivalent: 'Falar no diabo e ele aparece',
    gloss: 'Speak of the devil and he appears.',
    note: 'One of the very few that crosses intact. Enjoy it.',
    blocks: [],
  },
  {
    id: 'elephant_in_the_room',
    english: 'The elephant in the room',
    literal: 'O elefante na sala',
    wtf: 'Increasingly this one is understood, because it has been imported — but it still reads as translated.',
    equivalent: 'Ninguém quer falar disso',
    gloss: 'Nobody wants to talk about it.',
    note: 'Portuguese usually just says the thing rather than reaching for a picture of it.',
    blocks: ['quero'],
  },
  {
    id: 'writings_on_the_wall',
    english: "The writing's on the wall",
    literal: 'A escrita está na parede',
    wtf: 'A statement about interior decoration.',
    equivalent: 'Já se via',
    gloss: 'You could already see it coming.',
    blocks: [],
  },
  {
    id: 'blessing_in_disguise',
    english: 'A blessing in disguise',
    literal: 'Uma bênção disfarçada',
    wtf: 'Understandable, and it sounds like a translation, because it is one.',
    equivalent: 'Há males que vêm por bem',
    gloss: 'There are bad things that come for good.',
    blocks: [],
  },
  {
    id: 'better_late_than_never',
    english: 'Better late than never',
    literal: 'Melhor tarde do que nunca',
    wtf: 'Straight through, word for word, and correct. It happens.',
    equivalent: 'Mais vale tarde do que nunca',
    gloss: 'Better late than never.',
    note: 'Mais vale rather than melhor — the one word that makes it sound native instead of translated.',
    blocks: [],
  },
  {
    id: 'it_is_what_it_is',
    english: 'It is what it is',
    literal: 'É o que é',
    wtf: 'Correct, and said — but Portugal has a better one it reaches for first.',
    equivalent: 'É o que temos',
    gloss: "It's what we've got.",
    note: 'Resigned, shared, and very Portuguese: not a fact about the universe, a fact about what is on the table.',
    blocks: [],
  },
  {
    id: 'what_goes_around',
    english: 'What goes around comes around',
    literal: 'O que vai à volta vem à volta',
    wtf: 'You have described a roundabout.',
    equivalent: 'Cá se fazem, cá se pagam',
    gloss: 'Here they are done, here they are paid for.',
    blocks: [],
  },
  {
    id: 'once_in_a_blue_moon',
    english: 'Once in a blue moon',
    literal: 'Uma vez numa lua azul',
    wtf: 'The moon is not blue and nobody knows what you are waiting for.',
    equivalent: 'De vez em quando',
    gloss: 'Every now and then.',
    note: 'Flatter than the English and much more common. If you want the rare version: uma vez por outra.',
    blocks: [],
  },
  {
    id: 'touch_wood',
    english: 'Touch wood',
    literal: 'Toca madeira',
    wtf: 'This one nearly makes it — the superstition exists, the phrasing does not.',
    equivalent: 'Bate na madeira',
    gloss: 'Knock on the wood.',
    blocks: [],
  },
  {
    id: 'fingers_crossed',
    english: 'Fingers crossed',
    literal: 'Dedos cruzados',
    wtf: 'The gesture is the same. The phrase is not the one that gets said.',
    equivalent: 'Tomara',
    gloss: "Let's hope so.",
    note: 'One word, enormously useful, and almost untranslatable — somewhere between hopefully and if only.',
    blocks: [],
  },
  {
    id: 'god_knows',
    english: 'God knows',
    literal: 'Deus sabe',
    wtf: 'Perfectly fine, and slightly more devout than you intended.',
    equivalent: 'Sabe-se lá',
    gloss: 'Who knows.',
    note: 'Sabe-se lá keeps God out of it and is what you will actually hear.',
    blocks: [],
  },
  {
    id: 'so_far_so_good',
    english: 'So far, so good',
    literal: 'Tão longe, tão bom',
    wtf: 'You have said something about distance and quality. Nobody knows what.',
    equivalent: 'Para já, tudo bem',
    gloss: 'For now, all good.',
    blocks: ['tudo'],
  },
  {
    id: 'here_we_go_again',
    english: 'Here we go again',
    literal: 'Aqui vamos nós outra vez',
    wtf: 'Understandable, a bit long, and it lands as a translation.',
    equivalent: 'Lá vamos nós',
    gloss: 'There we go.',
    note: 'Lá rather than aqui — pointing away from yourself is what carries the weariness.',
    blocks: ['outra_vez'],
  },
  {
    id: 'shit_happens',
    english: 'Shit happens',
    literal: 'Merda acontece',
    wtf: 'Understood, imported, and it still sounds translated.',
    equivalent: 'São coisas que acontecem',
    gloss: 'These are things that happen.',
    note: 'The clean version is the common one. If you want it blunt: merda acontece does get said, mostly by people under thirty.',
    blocks: ['coisa'],
    blue: true,
  },
  {
    id: 'taking_the_piss',
    english: 'Taking the piss',
    literal: 'A tirar o chichi',
    wtf: 'You have described a medical procedure.',
    equivalent: 'Estás a gozar comigo?',
    gloss: 'Are you having me on?',
    note: 'Gozar is the workhorse here — mocking, teasing, winding somebody up. Not rude in itself.',
    blocks: ['estas'],
    blue: true,
  },
  {
    id: 'youre_having_a_laugh',
    english: "You're having a laugh",
    literal: 'Estás a ter uma risada',
    wtf: 'You have observed that somebody is laughing. They were not.',
    equivalent: 'Estás a brincar',
    gloss: "You're joking.",
    blocks: ['estas'],
  },
  {
    id: 'for_fucks_sake',
    english: "For fuck's sake",
    literal: 'Pelo amor da foda',
    wtf: 'Grammatically constructed, never uttered, and genuinely baffling.',
    equivalent: 'Foda-se',
    gloss: 'For fuck sake.',
    note: 'The single most common Portuguese swear word, and much softer in practice than its English translation — closer to "oh for God’s sake" in weight. You will hear it in offices.',
    blocks: [],
    blue: true,
  },
  {
    id: 'bloody_hell',
    english: 'Bloody hell',
    literal: 'Inferno sangrento',
    wtf: 'You have named a heavy metal album.',
    equivalent: 'Caramba',
    gloss: 'Blimey.',
    note: 'Caramba is the safe one. Bolas is softer still. Both are what you want in front of somebody’s parents.',
    blocks: [],
  },
  {
    id: 'over_my_dead_body',
    english: 'Over my dead body',
    literal: 'Sobre o meu cadáver',
    wtf: 'This one travels, and is just as dramatic in both.',
    equivalent: 'Só por cima do meu cadáver',
    gloss: 'Only over my dead body.',
    note: 'Só por cima is the bit that makes it idiomatic rather than literal.',
    blocks: [],
  },
]

/** One idiom by id, for a deep link or a check. */
export function idiomById(id: string): Idiom | undefined {
  return IDIOMS.find((i) => i.id === id)
}
