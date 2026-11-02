/**
 * THE SAVE — the room that comes before every other room (2026-11-02).
 *
 * Sam, 2026-11-02: English people are lazy about languages — "everybody speaks English",
 * they'll "get around to it", or they speak LOUDER. But being understood is how you are
 * accepted and how you respect the people who live here: "it feels great when you are
 * understood, and when you come up against someone who can't (or won't) speak a word of
 * English, at the very least you can say 'I am sorry I don't understand, I am English' in
 * Portuguese."
 *
 * So this is the floor under every other room. A coffee can go wrong, a NIF can go wrong,
 * a lease can go wrong — and when it does, these four lines are what keep you standing in
 * the conversation instead of walking out of it. That is why it is FIRST on all three
 * paths (content/path.ts) and free on all three (FREE_BY_PURPOSE in lib/entitlements.ts):
 * it is part of the survival kit, like the emergency room, not a feature to sell.
 *
 * And it is the sentence on the rescue card — /opener, "My opening line" — underneath
 * whatever room is next, because the moment you need it is the moment you have walked
 * into a shop and the reply came back faster than you expected.
 *
 * ASKING, NOT ASSUMING. "Fala inglês?" is the last line on purpose, and it is a question.
 * Starting in English is the habit this room exists to break; asking whether they speak
 * it, in Portuguese, after you have tried, is a different thing entirely — it is polite,
 * and it is usually answered kindly.
 *
 * GENDER. Rooms do not have the gendered mechanism the Legend frames do (askFor / fillFrame
 * with `f` forms, components/Legend.tsx) — a SituationLine is one pt string. So the line is
 * written in the masculine and the `when` note teaches both endings, exactly as jb_english
 * in content/roots.ts does with its `ingles` / `inglesa` pieces. The rescue card is the one
 * place the learner's own gender is read: see `saveSentence` below, which is what /opener
 * shows.
 *
 * NOT REVIEWED, and one decision is explicitly the reviewer's. "Desculpe, não percebo"
 * (I don't understand — present: a state) and "Desculpe, não percebi" (I didn't catch that
 * — past: one sentence went past you) are both real pt-PT. Sam's brief said "I don't
 * understand", so this says percebo. But the rest of DUB teaches percebi — the nao_percebi
 * piece in content/roots.ts and the repair lines in every moving room — on the argument
 * that it is friendlier and truer. A native reviewer must choose one, and if it is percebi,
 * change the line, the release, and SAVE_SENTENCE together.
 */
import type { Situation } from '@/content/situations'

/**
 * The save, as one sentence — the room's release and the rescue card's second half.
 *
 * Both endings, so /opener can show the one the learner would actually say. The room
 * itself carries the masculine (see GENDER above); `saveSentence` picks.
 */
export const SAVE_SENTENCE = {
  m: 'Desculpe, não percebo. Sou inglês.',
  f: 'Desculpe, não percebo. Sou inglesa.',
  en: 'Sorry, I don’t understand. I’m English.',
} as const

/** The save in the learner's own ending. No gender known reads as the room does. */
export function saveSentence(gender: 'm' | 'f' | null | undefined): { pt: string; en: string } {
  return { pt: gender === 'f' ? SAVE_SENTENCE.f : SAVE_SENTENCE.m, en: SAVE_SENTENCE.en }
}

export const LISBON_SAVE: Situation[] = [
  {
    id: 'lisbon_save',
    chapter: 'lisbon',
    kind: 'moment',
    /*
      All three, written out rather than left absent. Absent means everybody too, but this
      room's whole claim is that it is for every reason somebody is here, and saying so is
      cheaper than a reader wondering whether it was forgotten.
    */
    purposes: ['visiting', 'staying', 'moving'],
    title: 'When you don’t understand',
    why: 'Somebody answers fast, or does not speak English, and you are about to fall back on English or on saying it louder. Four lines that keep you in the conversation instead.',
    lines: [
      {
        pt: 'Desculpe, não percebo.',
        en: 'Sorry, I don’t understand.',
        when: 'The first thing to say when it goes past you. Not an apology for being foreign — a request for another go.',
      },
      {
        pt: 'Sou inglês.',
        en: 'I’m English.',
        when: 'A woman says Sou inglesa — nationalities take an ending like every other description. Said straight after the first line, it explains everything without a speech.',
      },
      {
        pt: 'Pode falar mais devagar?',
        en: 'Could you speak more slowly?',
        when: 'The one that keeps it in Portuguese. People almost always will, and they like being asked.',
      },
      {
        pt: 'Fala inglês?',
        en: 'Do you speak English?',
        when: 'Last, and asked rather than assumed. Trying first, in Portuguese, is the respect; asking is the polite way out.',
      },
    ],
    release: {
      ask: 'Sorry, I don’t understand. I’m English.',
      answer: SAVE_SENTENCE.m,
    },
    /*
      From the bank rather than commissioned: the "Portuguese" frame's picture — a chalk
      menu board half rubbed out, nobody reading it — is what not quite understanding looks
      like, and it already has its alt text and rights record. See content/images.ts.
    */
    image: {
      src: '/bank/frame-portuguese.jpg',
      alt: 'A chalk menu board outside a Lisbon tasca, half rubbed out, nobody reading it.',
      rights_status: 'generated',
    },
    /*
      Rung 1: it is the first room on every path and assumes nothing. Desculpe and devagar
      are rung-1 courtesy words the library already holds; nothing here waits on a film.
    */
    rung: 1,
    qa_status: 'pending-native-review',
    /* Named, not authored — the library already owns all three. */
    pieces: ['desculpe', 'devagar', 'ingles'],
  },
]
