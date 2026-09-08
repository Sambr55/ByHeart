import { say } from '@/content/numbers'
import type { Rung } from '@/content/roots'
import type { SituationKind } from '@/content/situations'

/**
 * Drop templates — the language, written once, for a kind of evening.
 *
 * This is the same architecture as the paradigm table, for the same reason. Generated
 * content is where a language product quietly starts teaching the wrong language, and the
 * rule that keeps it honest is that generation ASSEMBLES rather than invents:
 *
 *   DUB sources the fact. DUB writes the language. The language is never sourced.
 *
 * So a template is authored Portuguese with holes in it for the things that change — the
 * venue, the station, the date — and a candidate event fills the holes. Nothing a drop says
 * in Portuguese was written by a machine or pulled off a website; it was written here, once,
 * and a native reviews it once, and then it is right for every gig at every venue for ever.
 *
 * That is what makes the pipeline safe to run unattended. Reviewing a template is a
 * half-hour that covers a year of drops; reviewing every drop is a job nobody will do.
 *
 * The slots:
 *   {event}   Duran Duran
 *   {venue}   the Altice Arena
 *   {station} Oriente
 *   {day}     catorze — the date said as a Portuguese word, never a numeral
 *   {day_en}  14th — the same date in English, because "on the catorze" is not a sentence
 */
export type Slot = 'event' | 'venue' | 'station' | 'station_to' | 'day' | 'day_en'

/**
 * A station name with the preposition already agreed with it.
 *
 * "para o {station}" was baked into the concert template and is wrong for two of the nine
 * drops that publish today: Praça dos Restauradores takes `os`, Avenida da Liberdade takes
 * `a`. Article agreement is the most audible marker of a foreigner's Portuguese, and this
 * is a sentence somebody says cold to a stranger in a metro station.
 *
 * DELIBERATELY A SMALL, HONEST RULE RATHER THAN A CLEVER ONE. Lisbon's metro stations are
 * a closed list of about fifty names, and the handful that carry an article carry it in
 * their own name — Os Restauradores, A Avenida, O Cais do Sodré. Everything else is a bare
 * proper noun and takes `para` alone, which is both correct and what people say. So the
 * rule is: name the exceptions, and default to no article.
 *
 * Guessing from the ending would be the clever version and it would be wrong — Baixa-Chiado
 * looks feminine and takes none, Areeiro looks masculine and takes none.
 */
const STATION_ARTICLE: Record<string, string> = {
  /*
    Oriente is the one entry here with a native reading behind it: the hand-authored Duran
    Duran drop says "para o Oriente", and that drop was written and reviewed as language
    rather than assembled. The check that replays the template against it caught me
    dropping the article — I had defaulted Oriente to bare and it is not.

    THE REST OF THIS MAP HAS NOT BEEN READ BY A NATIVE SPEAKER. It is my best reading and
    it is the kind of thing that is quietly wrong: os Restauradores and a Avenida are
    confident, the last three less so. It belongs in the reviewer's pass, and until it has
    had one this comment is the honest label on it.
  */
  'Oriente': 'o',
  'Restauradores': 'os',
  'Praça dos Restauradores': 'os',
  'Avenida': 'a',
  'Cais do Sodré': 'o',
  'Rossio': 'o',
  'Marquês de Pombal': 'o',
  'Terreiro do Paço': 'o',
}

/** "para Oriente", "para os Restauradores", "para a Avenida". */
export function stationTo(station: string): string {
  const article = STATION_ARTICLE[station.trim()]
  return article ? article + ' ' + station : station
}

export interface TemplateLine {
  pt: string
  en: string
  when: string
}

export interface TemplateRoom {
  /** Suffixed onto the drop's id. */
  id: string
  kind: SituationKind
  title: string
  why: string
  /** A slug in the image bank. The gate refuses a template that names a hole. */
  image: string
  lines: TemplateLine[]
  release: { ask: string; answer: string }
  rung: Rung
}

export interface DropTemplate {
  id: string
  /** What sort of evening this is. A candidate is matched to a template by this. */
  kind: 'concert' | 'match' | 'exhibition'
  /** What a candidate must supply before this template can be filled. */
  needs: Slot[]
  rooms: TemplateRoom[]
  /**
   * Has somebody who speaks it read this?
   *
   * Reported, and blocking for anything the pipeline publishes — a drop that says the wrong
   * thing sends somebody to the wrong place on the wrong night, which is worse than no drop.
   */
  review: 'needs-review' | 'reviewed'
}

/**
 * Filling a template.
 *
 * Deliberately strict: an unknown slot is left alone rather than blanked, and a missing
 * value throws rather than rendering "Onde é o concerto no dia undefined?". Silent
 * substitution failures are how a pipeline ships nonsense at scale.
 */
export function fill(text: string, values: Partial<Record<Slot, string>>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    if (!(key in values)) return whole
    const v = values[key as Slot]
    if (!v) throw new Error('drop template: slot {' + key + '} has no value')
    return v
  })
}

/**
 * "fourteenth" — the English ordinal in words, because "on the catorze" is not a sentence
 * and "on the 14th" is a form, not speech.
 *
 * Words rather than digits for the same reason the Portuguese side says `catorze`: these
 * are sentences somebody reads out to another person, and a numeral is unpronounceable in
 * the middle of one. The hand-authored drop said "the fourteenth", and matching it is how
 * the template proves it lost nothing.
 */
const ORDINALS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
  'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
  'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first', 'twenty-second',
  'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh',
  'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first',
]

export function dayEnglish(iso: string): string {
  const n = Number(iso.slice(8, 10))
  if (!Number.isFinite(n) || n < 1 || n > 31) {
    throw new Error('drop template: cannot say the date "' + iso + '"')
  }
  return ORDINALS[n]
}

/** The day of the month, said the way somebody would say it: "no dia catorze". */
export function dayWord(iso: string): string {
  const day = Number(iso.slice(8, 10))
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    throw new Error('drop template: cannot say the date "' + iso + '"')
  }
  return say(day)
}

export const DROP_TEMPLATES: DropTemplate[] = [
  {
    /*
      The concert template, and it is the hand-authored Duran Duran drop with its facts
      lifted out. That is not a coincidence — it is the test. A template that cannot
      reproduce the drop somebody wrote by hand is a template that has lost something in
      the abstraction, and `npm run drops` checks exactly that.
    */
    id: 'concert',
    kind: 'concert',
    needs: ['event', 'venue', 'station', 'day', 'day_en'],
    review: 'needs-review',
    rooms: [
      {
        id: 'where',
        kind: 'place',
        title: 'Finding the venue',
        why: 'You have a ticket, you are somewhere near the station, and everything is signposted for people who already know where they are going.',
        image: 'arena_night',
        lines: [
          { pt: 'Onde é o concerto?', en: 'Where is the concert?', when: 'To anybody outside the station' },
          { pt: 'É longe?', en: 'Is it far?', when: 'When they point vaguely' },
          { pt: 'A que horas abre?', en: 'What time does it open?', when: 'At the door' },
        ],
        release: { ask: 'Ask somebody where the concert is.', answer: 'Onde é o concerto?' },
        rung: 2,
      },
      {
        id: 'ticket',
        kind: 'errand',
        title: 'A ticket, on the night',
        why: 'The website says sold out and the box office often says otherwise. It is worth one sentence to find out.',
        image: 'box_office',
        lines: [
          { pt: 'Ainda há bilhetes?', en: 'Are there still tickets?', when: 'At the box office' },
          { pt: 'Quanto custa?', en: 'How much is it?', when: 'Before you commit to anything' },
          { pt: 'Dois, se faz favor.', en: 'Two, please.', when: 'If you are taking somebody' },
        ],
        release: { ask: 'Ask whether there are still tickets.', answer: 'Ainda há bilhetes?' },
        rung: 2,
      },
      {
        id: 'metro',
        kind: 'errand',
        title: 'Getting to {station}',
        why: 'The crowd will be doing it with you, which makes it the easiest place in Lisbon to ask a question.',
        image: 'metro_platform',
        /*
          NO METRO LINE IS NAMED HERE ANY MORE, and this is the most serious thing this
          file has got wrong.

          The second line read "É a linha vermelha." — it is the red line — as "what you
          will hear back". The station is a slot; the colour was not. This template was
          abstracted from the hand-authored Duran Duran drop, which is at Oriente, where red
          is correct, and the claim came along without the sentence that justified it.

          Nine generated drops publish today. Three of them name a station that is not on
          the red line: Restauradores and Avenida are Blue, Campo Pequeno is Yellow. The
          learner reads the reply in full before they go, is primed to hear "vermelha",
          hears "azul", and concludes they misunderstood — which is the exact opposite of
          what this product is for.

          Three separate comments in this pipeline declare this impossible: a drop that
          gives the wrong metro line is somebody standing in the wrong place; a metro line
          invented to fill a slot is the worst thing this pipeline could produce; DUB
          sources the fact and writes the language, and the language is never sourced. Every
          guard checks that FACTS are sourced and that LANGUAGE is authored. This was a fact
          living inside an authored sentence, where no guard looks — and a native speaker
          reviewing the template would see nothing wrong, because it is correct for Oriente.
          The error is manufactured at fill time, out of data no reviewer reads.

          The reply is simply gone. It is the one line in the room nobody needs: you ask
          which line it is BECAUSE you do not know, and a made-up answer is worse than none.
          The right long-term fix is a sourced `line` on the calendar row, refused by
          `needs` when absent the way a missing station already is — but that is a content
          job, and until it is done this file must not guess.

          The article is a slot now for the same reason. "para o {station}" is baked and
          wrong for two of the same nine — os Restauradores, a Avenida — and article
          agreement is the most audible marker of a foreigner's Portuguese.
        */
        lines: [
          { pt: 'Qual é a linha para {station_to}?', en: 'Which line goes to {station}?', when: 'In the station' },
          { pt: 'Onde fica a saída?', en: 'Where is the way out?', when: 'When you arrive with everybody else' },
        ],
        release: {
          ask: 'Ask which line goes to {station}.',
          answer: 'Qual é a linha para {station_to}?',
        },
        rung: 2,
      },
      {
        /*
          The point of the cluster.

          Three rooms about logistics are worth having and none of them is why anybody
          learns a language. This one is an evening that has not happened yet, offered to
          somebody, in their language — and it is the compounding claim at its clearest:
          `comigo` came out of Top Gun and `vir` out of a Bond title, and neither was ever
          about a concert.
        */
        id: 'invite',
        kind: 'moment',
        title: 'Asking somebody to come',
        why: 'The only one of these that is not about getting somewhere. It is the reason to learn the other three.',
        image: 'two_at_a_bar',
        lines: [
          { pt: 'Queres vir comigo ao concerto?', en: 'Do you want to come to the concert with me?', when: 'The ask' },
          { pt: 'É no dia {day}.', en: 'It is on the {day_en}.', when: 'When they ask when' },
          { pt: 'Eu compro os bilhetes.', en: 'I will get the tickets.', when: 'To make saying yes easy' },
        ],
        release: {
          ask: 'Ask somebody to come with you on the {day_en}.',
          answer: 'Queres vir comigo ao concerto no dia {day}?',
        },
        rung: 3,
      },
    ],
  },
]

export function templateFor(kind: DropTemplate['kind']): DropTemplate | undefined {
  return DROP_TEMPLATES.find((t) => t.kind === kind)
}
