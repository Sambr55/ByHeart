/**
 * CHEATS, HACKS AND BLUFFS — the second pass over words you already own.
 *
 * Sam, handing over three lists: "Cheats = shortcuts to how Portuguese works. Hacks =
 * tricks that let you say much more Portuguese than you actually know. Bluffs = sound
 * better than you are." And then the question that decided the shape of this file: "I'm
 * not sure what grid they should appear in or their own?"
 *
 * ONE DECK, THREE KINDS. They are one drawer because they are one idea — a mechanism
 * rather than a word — and because the library already has seven drawers and Sam has
 * already said that is near the limit. The kind is a tag on the card, which is enough to
 * tell them apart and cheaper than three counts nobody asked for.
 *
 * WHY THIS IS NOT MORE VOCABULARY, which is the whole argument for the deck existing:
 * six of the seven Cheats and ten of the twelve Hacks are built from pieces DUB ALREADY
 * TEACHES. They are not new content, they are a second look at content a learner has
 * already paid for — "you own não and you own quero, so you can already say Não quero."
 * That is the most valuable sentence this product can say to somebody at rung 2, and
 * nothing in it said that before.
 *
 * Bluffs are the exception and are authored as new words, because they are new: only
 * pronto and talvez exist today. They are also a different ACT — not constructing a
 * sentence but staying in the room while somebody else does — which is why they are
 * tagged rather than hidden among the others.
 *
 * WHAT A CARD COSTS, and why it is not free:
 *
 *   locked    the learner does not own the ingredients yet. The card says which.
 *   unlocked  they own them. The card says what they can now do, with three examples.
 *   filled    they have said one of those examples cold — see content/collection.ts.
 *
 * The unlock is `needs`, and every id in it is a real piece. A gate on a word DUB does
 * not teach is a card nobody can ever open, which is the dead-word fault this codebase
 * has unpicked twice; scripts/cheats-check.mts holds every id to that.
 *
 * NOTHING HERE IS A GRAMMAR LESSON. Each card is a shape with a name — NÃO + VERB — and
 * three sentences that are that shape. The explanation is one line, because a learner who
 * needs three paragraphs about clitic placement is being taught the wrong product.
 */
import type { Shelf } from '@/content/roots'

export type CheatKind = 'cheat' | 'hack' | 'bluff'

export interface Cheat {
  id: string
  kind: CheatKind
  /** The shape, as it goes on the card. Short enough to be an eyebrow. */
  shape: string
  /** What it does, in one line and in the learner's language. */
  does: string
  /**
   * The pieces somebody must own before this is offered.
   *
   * Every id is checked against PIECES — a gate naming a word DUB does not teach is a
   * card that can never open. Empty means available from the start, which is true of the
   * Bluffs: they are their own ingredient.
   */
  needs: string[]
  /**
   * The three examples behind the card. Sam: "three sentence picker examples behind."
   *
   * Three because it is enough to show a PATTERN and few enough to read — one is a
   * specimen, and a list is a reference table. The learner says one of them cold to fill
   * the card.
   */
  says: { pt: string; en: string }[]
  /** Where a Bluff's own words belong in the library, when it teaches one. */
  shelf?: Shelf
  /** The one thing worth knowing that the shape itself does not say. */
  note?: string
}

export const CHEATS: Cheat[] = [
  /* ---------------------------------------------------------------- CHEATS */
  {
    id: 'nao_verb',
    kind: 'cheat',
    shape: 'NÃO + VERB',
    does: 'Any sentence you can say, you can now un-say.',
    /*
      não plus any verb this learner owns. The gate names não alone because the verbs are
      the variable — a learner with não and quero has the shape, and so does one with não
      and posso. Asking for a specific verb would lock the card on an accident of which
      vibe somebody played.
    */
    needs: ['nao'],
    says: [
      { pt: 'Não quero.', en: 'I don’t want to.' },
      { pt: 'Não posso.', en: 'I can’t.' },
      { pt: 'Não tenho.', en: 'I don’t have any.' },
    ],
    note: 'English needs a do or a don’t to hang the negative on. Portuguese just puts não in front of the verb and stops.',
  },
  {
    id: 'ha_time',
    kind: 'cheat',
    shape: 'HÁ + TIME',
    does: 'Say how long ago something was, with no past tense at all.',
    needs: ['ha'],
    says: [
      { pt: 'Há dois dias.', en: 'Two days ago.' },
      { pt: 'Há três anos.', en: 'Three years ago.' },
      { pt: 'Há uma semana.', en: 'A week ago.' },
    ],
    note: 'The same há as “there is” — Há um problema. With an amount of time after it, it means ago instead.',
  },
  {
    id: 'drop_the_eu',
    kind: 'cheat',
    shape: 'DROP THE EU',
    does: 'The verb already says who. Say the verb on its own.',
    needs: ['quero', 'tenho'],
    says: [
      { pt: 'Quero.', en: 'I want to.' },
      { pt: 'Tenho.', en: 'I have.' },
      { pt: 'Vamos.', en: 'Let’s go.' },
    ],
    note: 'Eu quero is not wrong, it is emphatic — “*I* want to”. Dropping it is the single fastest way to stop sounding translated.',
  },
  {
    id: 'estar_a',
    kind: 'cheat',
    shape: 'ESTOU A + VERB',
    does: 'Anything you can name, you can say you are doing right now.',
    /*
      estas_a is the piece the product teaches — the second person — and the shape is the
      same either way. A learner who has met "estás a fazer" has met this construction,
      which is what the gate is asking about.
    */
    needs: ['estas_a'],
    says: [
      { pt: 'Estou a trabalhar.', en: 'I’m working.' },
      { pt: 'Estou a aprender.', en: 'I’m learning.' },
      { pt: 'O que estás a fazer?', en: 'What are you doing?' },
    ],
    note: 'This is the European one. Brazil says estou trabalhando, and saying it here marks you out immediately.',
  },
  {
    id: 'tenho_de',
    kind: 'cheat',
    shape: 'TENHO DE + VERB',
    does: 'Turn any verb into something you have to do.',
    needs: ['tenho'],
    says: [
      { pt: 'Tenho de ir.', en: 'I have to go.' },
      { pt: 'Tenho de trabalhar.', en: 'I have to work.' },
      { pt: 'Temos de falar.', en: 'We have to talk.' },
    ],
    note: 'Stack it with the first cheat and you get Não tenho de ir — I don’t have to go.',
  },
  {
    id: 'ser_estar',
    kind: 'cheat',
    shape: 'SOU vs ESTOU',
    does: 'What you ARE, against how you are right now.',
    needs: ['sou', 'estas'],
    says: [
      { pt: 'Sou inglês.', en: 'I’m English.' },
      { pt: 'Estou cansado.', en: 'I’m tired.' },
      { pt: 'Estou em Portugal.', en: 'I’m in Portugal.' },
    ],
    note: 'Sou feliz is “I’m a happy person”. Estou feliz is “I’m happy right now”. English has one word for both and loses the difference.',
  },
  {
    id: 'verb_me',
    kind: 'cheat',
    shape: 'VERB + -ME',
    does: 'Stick the person on the end of the verb with a hyphen.',
    needs: ['diz', 'ajuda'],
    says: [
      { pt: 'Diz-me.', en: 'Tell me.' },
      { pt: 'Ajuda-me.', en: 'Help me.' },
      { pt: 'Liga-me.', en: 'Call me.' },
    ],
    note: 'Go negative and it jumps back in front: Não me digas. That move is the most visibly European thing in the language.',
  },

  /* ----------------------------------------------------------------- HACKS */
  {
    id: 'cao_hack',
    kind: 'hack',
    shape: '-TION → -ÇÃO',
    does: 'Hundreds of English words you already know, in Portuguese.',
    needs: [],
    says: [
      { pt: 'informação', en: 'information' },
      { pt: 'situação', en: 'situation' },
      { pt: 'confirmação', en: 'confirmation' },
    ],
    note: 'Not every one — reservation is reserva — but often enough that guessing is worth it.',
  },
  {
    id: 'mente_hack',
    kind: 'hack',
    shape: '-LY → -MENTE',
    does: 'Every adjective you own is nearly an adverb too.',
    needs: [],
    says: [
      { pt: 'normalmente', en: 'normally' },
      { pt: 'provavelmente', en: 'probably' },
      { pt: 'finalmente', en: 'finally' },
    ],
  },
  {
    id: 'quero_hack',
    kind: 'hack',
    shape: 'QUERO + ANYTHING',
    does: 'One opening, most of a holiday.',
    needs: ['quero'],
    says: [
      { pt: 'Quero comer.', en: 'I want to eat.' },
      { pt: 'Quero uma cerveja.', en: 'I want a beer.' },
      { pt: 'Quero ver.', en: 'I want to see.' },
    ],
  },
  {
    id: 'posso_hack',
    kind: 'hack',
    shape: 'POSSO …?',
    does: 'Turn any verb into “can I?”',
    needs: ['posso'],
    says: [
      { pt: 'Posso entrar?', en: 'Can I come in?' },
      { pt: 'Posso pagar?', en: 'Can I pay?' },
      { pt: 'Posso ver?', en: 'Can I see?' },
    ],
  },
  {
    id: 'pode_hack',
    kind: 'hack',
    shape: 'PODE …?',
    does: 'Turn any verb into a polite request.',
    needs: ['podes'],
    says: [
      { pt: 'Pode repetir?', en: 'Can you say that again?' },
      { pt: 'Pode ajudar-me?', en: 'Can you help me?' },
      { pt: 'Pode falar mais devagar?', en: 'Can you speak more slowly?' },
    ],
    note: 'Pode is the polite one. Podes is what you say to a friend, and it is the one the lessons teach first.',
  },
  {
    id: 'isto_hack',
    kind: 'hack',
    shape: 'ISTO',
    does: 'Do not know the word? Point at it.',
    needs: ['isto'],
    says: [
      { pt: 'Quero isto.', en: 'I want this.' },
      { pt: 'O que é isto?', en: 'What is this?' },
      { pt: 'Quanto custa isto?', en: 'How much is this?' },
    ],
    note: 'You can survive an alarming amount of Portugal on isto alone.',
  },
  {
    id: 'coisa_hack',
    kind: 'hack',
    shape: 'COISA',
    does: 'The emergency exit. Forgot the noun? Say thing.',
    needs: ['coisa'],
    says: [
      { pt: 'Aquela coisa.', en: 'That thing.' },
      { pt: 'Qualquer coisa.', en: 'Anything.' },
      { pt: 'Uma coisa pequena.', en: 'A small thing.' },
    ],
  },
  {
    id: 'question_hack',
    kind: 'hack',
    shape: 'THE SIX QUESTIONS',
    does: 'Six words plus what you already own reaches most of a conversation.',
    needs: ['onde', 'quanto', 'como'],
    says: [
      { pt: 'Onde fica?', en: 'Where is it?' },
      { pt: 'Quanto custa?', en: 'How much is it?' },
      { pt: 'Como se diz?', en: 'How do you say it?' },
    ],
    note: 'Onde, quando, quanto, como, quem, porquê. Tiny vocabulary, enormous reach.',
  },
  {
    id: 'e_hack',
    kind: 'hack',
    shape: 'É + ANYTHING',
    does: 'The cheapest sentence in the language. Nothing to conjugate.',
    needs: ['e_is'],
    says: [
      { pt: 'É bom.', en: 'It’s good.' },
      { pt: 'É caro?', en: 'Is it expensive?' },
      { pt: 'É aqui?', en: 'Is it here?' },
    ],
  },
  {
    id: 'muito_hack',
    kind: 'hack',
    shape: 'MUITO + ANYTHING',
    does: 'Amplify a simple word instead of learning a harder one.',
    needs: ['muito'],
    says: [
      { pt: 'Muito bom.', en: 'Very good.' },
      { pt: 'Muito caro.', en: 'Very expensive.' },
      { pt: 'Muito obrigado.', en: 'Thank you very much.' },
    ],
    note: 'Beats learning excellent, expensive and distant as three separate words.',
  },
  {
    id: 'opposites_hack',
    kind: 'hack',
    shape: 'LEARN THEM IN PAIRS',
    does: 'Ten little words give you twenty ideas.',
    needs: ['com', 'sem'],
    says: [
      { pt: 'com / sem', en: 'with / without' },
      { pt: 'mais / menos', en: 'more / less' },
      { pt: 'antes / depois', en: 'before / after' },
    ],
    note: 'Remembering one drags the other up with it, which is not true of words learned alone.',
  },
  {
    id: 'rescue_hack',
    kind: 'hack',
    shape: 'COMO SE DIZ …?',
    does: 'One sentence that turns English itself into a way to learn Portuguese.',
    needs: ['como'],
    says: [
      { pt: 'Como se diz isto em português?', en: 'How do you say this in Portuguese?' },
      { pt: 'Como se diz “ticket”?', en: 'How do you say “ticket”?' },
      { pt: 'O que quer dizer isso?', en: 'What does that mean?' },
    ],
    note: 'The one to memorise word for word. Every conversation becomes a lesson.',
  },

  /* ---------------------------------------------------------------- BLUFFS */
  /*
    BY FUNCTION, NOT AS THIRTY WORDS. Sam: "I'd actually teach these by function rather
    than as 30 vocabulary items" — and gave the five groups. Five cards rather than thirty
    is also the difference between a deck somebody finishes and a vocabulary list wearing
    a hat.
  */
  {
    id: 'bluff_time',
    kind: 'bluff',
    shape: 'BUY TIME',
    does: 'Two seconds to think, and it sounds completely natural.',
    needs: [],
    shelf: 'just_say',
    says: [
      { pt: 'Então…', en: 'So… / Well then…' },
      { pt: 'Pois…', en: 'Right… / Indeed…' },
      { pt: 'Enfim…', en: 'Anyway… / What can you do.' },
    ],
    note: 'Pois is the king of these. It can mean agreement, resignation, or simply that you are still in the conversation.',
  },
  {
    id: 'bluff_agree',
    kind: 'bluff',
    shape: 'AGREE',
    does: 'Somebody else did the hard speaking. You agree intelligently.',
    needs: [],
    shelf: 'just_say',
    says: [
      { pt: 'Exato.', en: 'Exactly.' },
      { pt: 'Claro.', en: 'Of course.' },
      { pt: 'É verdade.', en: 'That’s true.' },
    ],
  },
  {
    id: 'bluff_react',
    kind: 'bluff',
    shape: 'REACT',
    does: 'Be in the conversation without generating a sentence.',
    needs: [],
    shelf: 'just_say',
    says: [
      { pt: 'A sério?', en: 'Really?' },
      { pt: 'Que bom!', en: 'That’s great!' },
      { pt: 'Que pena.', en: 'What a shame.' },
    ],
  },
  {
    id: 'bluff_dodge',
    kind: 'bluff',
    shape: 'DON’T COMMIT',
    does: 'Say nothing, thoughtfully.',
    needs: [],
    shelf: 'just_say',
    says: [
      { pt: 'Depende.', en: 'It depends.' },
      { pt: 'Se calhar.', en: 'Maybe.' },
      { pt: 'Vamos ver.', en: 'We’ll see.' },
    ],
    note: 'Depende is the ultimate one — committed to nothing, and sounding considered about it.',
  },
  {
    id: 'bluff_move',
    kind: 'bluff',
    shape: 'KEEP IT MOVING',
    does: 'Close a subject, accept a plan, wave off a mistake.',
    needs: [],
    shelf: 'just_say',
    says: [
      { pt: 'Pronto.', en: 'Right. / There we go.' },
      { pt: 'Está bem.', en: 'Okay.' },
      { pt: 'Não faz mal.', en: 'Never mind.' },
    ],
    note: 'Pronto is Portuguese conversational WD-40. You will hear it a hundred times a day.',
  },
]

/** Everything, or one kind of it. */
export function cheatsOfKind(kind: CheatKind): Cheat[] {
  return CHEATS.filter((c) => c.kind === kind)
}

/**
 * Which of these a learner can open, and which are still waiting on a word.
 *
 * `needs` is checked against the inventory rather than against a rung, because a learner
 * reaches these words by whichever vibes they chose — and a gate on a level would open a
 * card for somebody who does not own its ingredients and hold one back from somebody who
 * does. The inventory is the only honest test.
 */
export function cheatUnlocked(cheat: Cheat, inventory: Record<string, unknown>): boolean {
  return cheat.needs.every((id) => Boolean(inventory?.[id]))
}

/** The word still missing, for a card that says why it is shut. */
export function cheatNeeds(cheat: Cheat, inventory: Record<string, unknown>): string[] {
  return cheat.needs.filter((id) => !inventory?.[id])
}
