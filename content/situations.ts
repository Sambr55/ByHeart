/**
 * Situations — what a City Club is made of.
 *
 * A Place, a Moment and an Errand are the same shape: a thing you will stand in front
 * of, with the language you need for it. Only the peg differs — a location, a date, a
 * task. So they are one type with optional pegs, and a Moment is simply a Situation
 * pegged to a date. Drops are not a separate feature to reconcile; they are the
 * time-pegged case of this one.
 *
 * `lines` and `release` deliberately mirror a root's branches and transfer_prompt, so a
 * Situation runs through the existing teach → take away → say-it-cold beats with no new
 * teaching code. The Club is a new kind of CONTENT, not a new kind of lesson.
 *
 * The rule everything here serves: non-judgemental support for something genuinely
 * difficult. Not praise — reducing the cost of being bad at it. A Situation that leaves
 * somebody informed but unable to say anything has failed, however useful it reads.
 */
import type { ChapterId } from '@/content/chapters'
import type { Rung } from '@/content/roots'

export type SituationKind = 'place' | 'person' | 'moment' | 'errand'

/**
 * A photograph of a real place is somebody's property, and a real place is a factual
 * claim. Mirrors the roots' own rights_status for exactly that reason: nothing ships
 * without one, and the lint says so.
 */
export interface SituationImage {
  src: string
  /** Required. Describes the evidence, not the mood. */
  alt: string
  credit?: string
  /**
   * 'generated' is not a hedge, it is the commonest answer and it needed a name.
   *
   * The enum had four values and every one of them assumed a photographer. Every image
   * in this product so far is generated, so the only honest option was missing — and an
   * enum that cannot express the truth gets filled in with whichever value is closest,
   * which is how rights records become fiction.
   */
  rights_status: 'generated' | 'owned' | 'licensed' | 'cc-by' | 'permission-given'
  /** Places rot, and a photograph has an age. */
  taken_at?: string
}

export interface SituationLine {
  pt: string
  en: string
  /** The moment in the encounter this line is for. Ordering is the teaching. */
  when: string
}

export interface Situation {
  id: string
  chapter: ChapterId
  kind: SituationKind
  title: string
  /** Why a member would open this, in their words rather than ours. */
  why: string
  /** Pegs. A moment has `on`; a place has `where`; an errand has neither. */
  on?: string
  from?: string
  where?: { name: string; area: string }
  lines: SituationLine[]
  /** What they must be able to say cold at the end. Never optional. */
  release: { ask: string; answer: string }
  image?: SituationImage
  rung: Rung
  /** Past this date it is hidden rather than wrong. Silence beats a lie. */
  review_by?: string
}

export const SITUATIONS: Situation[] = [
  {
    id: 'lisbon_farmacia',
    chapter: 'lisbon',
    kind: 'errand',
    title: 'The pharmacy',
    // Written for the person who is actually going to open this: not a tourist browsing,
    // somebody who feels rough and would rather not do it in English.
    why: 'You feel rough, you want something for it, and you would rather not have the whole exchange in English.',
    lines: [
      {
        pt: 'Boa tarde. Preciso de ajuda.',
        en: 'Good afternoon. I need some help.',
        when: 'Opening. Buys you a second and sets the language.',
      },
      {
        pt: 'Não me sinto bem.',
        en: 'I do not feel well.',
        when: 'The whole reason you are there, in four words.',
      },
      {
        pt: 'Tem alguma coisa para isto?',
        en: 'Do you have anything for this?',
        when: 'Point at it. Portuguese pharmacists are used to being pointed at.',
      },
      {
        pt: 'Quantas por dia?',
        en: 'How many a day?',
        when: 'The question everybody forgets to ask and then worries about at home.',
      },
      {
        pt: 'Quanto custa?',
        en: 'How much is it?',
        when: 'You already own this one.',
      },
      {
        pt: 'Desculpe, pode repetir?',
        en: 'Sorry, could you say that again?',
        when: 'When the answer arrives faster than you expected. It will.',
      },
    ],
    release: {
      ask: 'I do not feel well. Do you have anything for this?',
      answer: 'Não me sinto bem. Tem alguma coisa para isto?',
    },
    image: {
      src: '/lisbon/pharmacy.jpg',
      // The information, not the mood. Somebody who cannot see it should know what kind
      // of room they are walking into, because that is what the picture is doing here.
      alt: 'Inside a small Portuguese pharmacy: a marble counter, dark wooden drawers, and shelves of boxes to the ceiling. A pharmacist in a white coat stands at the far end.',
      rights_status: 'generated',
    },
    rung: 2,
    review_by: '2027-08-01',
    // A procedure, not a business — but hours and rules change, so it is still reviewed.

  },
  {
    id: 'lisbon_cafe',
    chapter: 'lisbon',
    kind: 'place',
    title: 'A coffee, standing up',
    why: 'You want a coffee the way everybody around you is having one, without pointing at the menu.',
    where: { name: 'Any café counter', area: 'everywhere' },
    lines: [
      {
        pt: 'Um café, por favor.',
        en: 'An espresso, please.',
        when: 'The default. Um café is a small black one — asking for "a coffee" gets you this.',
      },
      {
        pt: 'Uma meia de leite.',
        en: 'A white coffee, in a cup.',
        when: 'When you want it milky. Ordering a latte will mark you out for the whole trip.',
      },
      {
        pt: 'E um pastel de nata.',
        en: 'And a custard tart.',
        when: 'Said in the same breath as the coffee, not as a second request.',
      },
      {
        pt: 'É para aqui.',
        en: 'I am having it here.',
        when: 'At the counter, standing, which is cheaper and how it is done.',
      },
      {
        pt: 'Quanto é?',
        en: 'How much is it?',
        when: 'You pay at the end, usually after you have drunk it.',
      },
    ],
    release: {
      ask: 'An espresso and a custard tart, please.',
      answer: 'Um café e um pastel de nata, por favor.',
    },
    image: {
      src: '/lisbon/cafe-counter.jpg',
      alt: 'A zinc café counter in Lisbon with an empty espresso cup on a saucer and a folded newspaper beside it, tiled panels below the bar.',
      rights_status: 'generated',
    },
    rung: 2,
    review_by: '2027-08-01',
  },
  {
    id: 'lisbon_padaria',
    chapter: 'lisbon',
    kind: 'errand',
    title: 'The bread queue',
    why: 'There is a queue, it moves fast, and everybody in front of you knows exactly what to say.',
    lines: [
      {
        pt: 'Bom dia. Um pão, por favor.',
        en: 'Good morning. One loaf, please.',
        when: 'Open with the greeting. Walking up and naming the thing reads as brusque here.',
      },
      {
        pt: 'Meia dúzia de pastéis de nata.',
        en: 'Half a dozen custard tarts.',
        when: 'Half a dozen is the unit people actually use.',
      },
      {
        pt: 'Mais alguma coisa? — Não, é só isso.',
        en: 'Anything else? — No, that is all.',
        when: 'They will ask. This is the answer that ends it.',
      },
      {
        pt: 'É para levar.',
        en: 'It is to take away.',
        when: 'Say it and they will bag it rather than plate it.',
      },
      {
        pt: 'Obrigado. Bom dia.',
        en: 'Thank you. Good day.',
        when: 'You say bom dia on the way out as well as on the way in.',
      },
    ],
    release: {
      ask: 'Good morning. One loaf, please.',
      answer: 'Bom dia. Um pão, por favor.',
    },
    image: {
      src: '/lisbon/bakery-queue.jpg',
      alt: 'People queuing at a Lisbon bakery counter seen from behind, shelves of bread stacked to the ceiling behind the glass.',
      rights_status: 'generated',
    },
    rung: 2,
    review_by: '2027-08-01',
  },
  {
    id: 'lisbon_junta',
    chapter: 'lisbon',
    kind: 'errand',
    title: 'The Junta de Freguesia',
    why: 'The parish office, where a lot of living here officially begins — and where nobody is going to switch to English for you.',
    where: { name: 'Junta de Freguesia', area: 'your parish' },
    lines: [
      {
        pt: 'Bom dia. É a primeira vez que venho aqui.',
        en: 'Good morning. It is my first time here.',
        when: 'Buys you patience, and it is true.',
      },
      {
        pt: 'Preciso de um atestado de residência.',
        en: 'I need a proof of residence.',
        when: 'The document most people are there for.',
      },
      {
        pt: 'Tenho os documentos aqui.',
        en: 'I have the documents here.',
        when: 'Say it while you put them on the counter.',
      },
      {
        pt: 'Desculpe, pode repetir mais devagar?',
        en: 'Sorry, could you say that again more slowly?',
        when: 'The one that keeps the conversation in Portuguese instead of ending it.',
      },
      {
        pt: 'Quanto tempo demora?',
        en: 'How long does it take?',
        when: 'The question you will otherwise wonder about all week.',
      },
    ],
    release: {
      ask: 'Good morning. I need a proof of residence.',
      answer: 'Bom dia. Preciso de um atestado de residência.',
    },
    image: {
      src: '/lisbon/junta-doorway.jpg',
      alt: 'Three people waiting at the plain stone doorway of a Portuguese municipal office, one stepping inside, calçada pavement underfoot.',
      rights_status: 'generated',
    },
    rung: 3,
    review_by: '2027-02-01',
  },
  {
    id: 'lisbon_electrico',
    chapter: 'lisbon',
    kind: 'place',
    title: 'Getting on the 28',
    why: 'It is full, it is moving, and you have about four seconds to say the right thing.',
    where: { name: 'Eléctrico 28', area: 'Martim Moniz to Campo de Ourique' },
    lines: [
      {
        pt: 'Este vai para o Chiado?',
        en: 'Does this one go to Chiado?',
        when: 'Ask before you get on. Swap in wherever you are going.',
      },
      {
        pt: 'Um bilhete, por favor.',
        en: 'One ticket, please.',
        when: 'Buying on board costs more than a Viva card, and everybody does it anyway.',
      },
      {
        pt: 'Com licença.',
        en: 'Excuse me.',
        when: 'Getting past somebody. Not desculpe — that is for apologising.',
      },
      {
        pt: 'Desço na próxima.',
        en: 'I am getting off at the next one.',
        when: 'Said to whoever is between you and the door.',
      },
      {
        pt: 'Obrigado, boa tarde.',
        en: 'Thank you, good afternoon.',
        when: 'To the driver on the way off. People do.',
      },
    ],
    release: {
      ask: 'Does this one go to Chiado?',
      answer: 'Este vai para o Chiado?',
    },
    image: {
      src: '/lisbon/tram-distant.jpg',
      alt: 'A yellow Lisbon tram far down a long straight street in flat overcast light, a stone wall and empty road in the foreground.',
      rights_status: 'generated',
    },
    rung: 3,
    review_by: '2027-08-01',
  },
]

export function situationsFor(chapter: ChapterId): Situation[] {
  return SITUATIONS.filter((s) => s.chapter === chapter)
}

export function situationById(id: string): Situation | undefined {
  return SITUATIONS.find((s) => s.id === id)
}

/**
 * Hidden rather than wrong.
 *
 * A Club full of things that are no longer true is worse than a Club with less in it, so
 * a Situation past its review date stops being served. It is not deleted — it is a chore
 * with a list, which the lint prints.
 */
export function isCurrent(s: Situation, now = new Date()): boolean {
  if (s.review_by && new Date(s.review_by) < now) return false
  if (s.on && new Date(s.on) < now) return false
  return true
}
