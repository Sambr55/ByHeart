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

/**
 * WHAT SORT OF PLACE THIS IS, because nine concerts were saying one sentence.
 *
 * Every live drop ran the same room — "Onde é o concerto?", "É longe?", "A que horas
 * abre?" — with only the station and the date moving. Sam: "They are all identical, we
 * need to link them in some way to teh context of teh event."
 *
 * The honest lever is the building. Walking into a twenty-thousand-seat arena out at
 * Parque das Nações is not the errand that walking into a hall on Restauradores is: one
 * has gates and a ticket check a hundred metres from the door, the other has a foyer off
 * the street, and the small rooms are the ones nobody can find at all.
 *
 * A TABLE RATHER THAN A FIELD ON THE ROW, for two reasons. The venues repeat — four rows
 * are the MEO Arena — so a field would be the same fact typed four times and wrong the
 * first time somebody edited one of them. And this is a judgement about a building, which
 * is exactly the sort of thing that belongs somewhere a reviewer can read the whole list
 * at once rather than scattered through a calendar.
 *
 * DEFAULTS TO `hall`, deliberately. An unknown venue gets the version that asks where the
 * entrance is and what time it opens, which is true of any building you have a ticket
 * for. The variants differ in what they let you ask NEXT, so a wrong guess here costs a
 * useful sentence rather than producing a false one.
 */
export type VenueKind = 'arena' | 'hall' | 'room' | 'ground'

export const VENUE_KIND: Record<string, VenueKind> = {
  /* Gates, a concourse, and a ticket check well before the door. */
  'MEO Arena': 'arena',
  'Altice Arena': 'arena',
  /* Grand old halls in town. One foyer, off the street, and everybody uses it. */
  'Coliseu dos Recreios': 'hall',
  'Capitólio': 'hall',
  /* A bullring with a concert inside it — an arena's shape, a hall's front door. */
  'Sagres Campo Pequeno': 'hall',
  /* Small, and the whole problem is finding the door. */
  'LAV — Lisboa Ao Vivo': 'room',
  /* Football. Turnstiles, a stand, a block and a seat. */
  'Estádio da Luz': 'ground',
  'Estádio José Alvalade': 'ground',
}

export function venueKind(name: string | undefined): VenueKind {
  return (name && VENUE_KIND[name]) || 'hall'
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
  /*
    AND THE SAME ROOM SAID FOR A DIFFERENT KIND OF BUILDING.

    Authored per venue kind and picked deterministically, so the same venue always says
    the same thing — a drop is a thing somebody reads twice, and language that shuffled
    between visits would read as a fault rather than as variety.

    Only the lines and the release move. The room's purpose, title, image and rung are the
    same errand whichever building it is, and a variant that changed those would be a
    second room wearing the first one's id.

    Absent means the room does not vary, which is most of them: the metro is the metro and
    asking somebody to come is asking somebody to come.
  */
  variants?: Partial<Record<VenueKind, { lines: TemplateLine[]; release: { ask: string; answer: string } }>>
}

/**
 * The room as this venue says it.
 *
 * Falls through to the authored default whenever there is no variant for the kind, which
 * is both the common case and the safe one: a room that has not been written for a
 * bullring is simply the room, rather than nothing.
 */
export function roomFor(room: TemplateRoom, kind: VenueKind): TemplateRoom {
  const v = room.variants?.[kind]
  return v ? { ...room, lines: v.lines, release: v.release } : room
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
        /*
          THE SAME ARRIVAL, IN THE BUILDING YOU ARE ACTUALLY ARRIVING AT.

          The default above is the hall version and it was being said for all nine drops —
          an arena out at Parque das Nações and a small room in Alcântara got the identical
          three sentences. These are the questions that building actually puts to you.

          NOT REVIEWED BY A NATIVE SPEAKER, like the rest of this template. `review` on the
          template covers these too, and the reviewer's pass is one sitting for all of it.
        */
        variants: {
          /*
            THE ARENA IS THE DEFAULT, and that is a finding rather than a shortcut.

            The default lines above ARE the arena version: they were lifted from the
            hand-authored Duran Duran drop, which is at the MEO Arena and was written and
            reviewed as language rather than assembled. Writing a separate `arena` variant
            meant writing a second, unreviewed answer to a question a native speaker had
            already answered — and `npm run drops` said so immediately, because the
            template stopped reproducing the drop it was abstracted from.

            Twice. The first attempt replaced all three lines with gates and entrances,
            which answers a later beat than this room: the `when` on the first line is "To
            anybody outside the station", so this is the walk from the metro, before you
            are in the grounds at all. At that moment the question is the same whatever the
            building is.

            So the variants are the buildings that are NOT arenas, and the check that
            refused the other version is the reason to trust the ones that remain.
          */
          /*
            A small room on a side street, where the whole problem is the door. Nobody
            can see it, the sign is small, and the useful sentence names the place.
          */
          room: {
            lines: [
              { pt: 'Onde é o {venue}?', en: 'Where is the {venue}?', when: 'To anybody on the street' },
              { pt: 'É longe daqui?', en: 'Is it far from here?', when: 'When they point' },
              { pt: 'É esta a porta?', en: 'Is this the door?', when: 'When you think you have found it' },
            ],
            release: { ask: 'Ask somebody where the {venue} is.', answer: 'Onde é o {venue}?' },
          },
          /*
            A grand old hall in the middle of town — the Coliseu, the Capitólio, the
            bullring at Campo Pequeno. One foyer, straight off the street, and everybody
            goes in the same way, so there is no gate to find and no concourse to cross.

            What it does have is a queue and a cloakroom, which an arena handles with
            signage and staff. "Já se pode entrar?" is the question people actually ask
            outside the Coliseu on a cold night.
          */
          hall: {
            lines: [
              { pt: 'Onde é o concerto?', en: 'Where is the concert?', when: 'To anybody outside the station' },
              { pt: 'É aqui a entrada?', en: 'Is this the entrance?', when: 'At the front, if there is a queue' },
              { pt: 'Já se pode entrar?', en: 'Can we go in yet?', when: 'When nothing is moving' },
            ],
            release: { ask: 'Ask whether this is the entrance.', answer: 'É aqui a entrada?' },
          },
        },
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
  {
    /*
      THE MATCH TEMPLATE, which unblocks the two most Portuguese evenings in the calendar.

      Benfica v Celtic and Sporting v LASK were both refused with "no match template
      exists yet" — correctly, because the alternative was telling somebody to ask "onde é
      o concerto?" outside the Estádio da Luz. The pipeline blocking them was the guard
      working; this is the content it was waiting for.

      It is not the concert template with nouns swapped. A match has turnstiles rather than
      doors, a stand and a block rather than a gate, and nobody asks what time a football
      ground opens — they ask which way their seat is. The ticket errand is different too:
      you do not turn up at the Luz hoping for a return.

      NOT REVIEWED BY A NATIVE SPEAKER. Same standing as the concert template, and the same
      reviewer's pass covers both.
    */
    id: 'match',
    kind: 'match',
    needs: ['event', 'venue', 'station', 'day', 'day_en'],
    review: 'needs-review',
    rooms: [
      {
        id: 'where',
        kind: 'place',
        title: 'Finding the ground',
        why: 'You can see it from the metro and still not know which turnstile is yours. Everybody around you is going to the same place, which makes it the easiest question you will ask all week.',
        image: 'arena_night',
        lines: [
          { pt: 'Onde é o jogo?', en: 'Where is the match?', when: 'If you have come out of the wrong exit' },
          { pt: 'Para que lado é a bancada?', en: 'Which way is the stand?', when: 'Ticket in hand' },
          { pt: 'É esta a entrada?', en: 'Is this the entrance?', when: 'At the turnstiles' },
        ],
        release: { ask: 'Ask which way your stand is.', answer: 'Para que lado é a bancada?' },
        rung: 2,
      },
      {
        id: 'ticket',
        kind: 'errand',
        title: 'Getting in',
        why: 'A ticket for a European night is not something you buy at the gate, but a scarf is, and both transactions are the same three sentences.',
        image: 'box_office',
        lines: [
          { pt: 'Ainda há bilhetes?', en: 'Are there still tickets?', when: 'At the ticket office' },
          { pt: 'Quanto custa?', en: 'How much is it?', when: 'Before you commit to anything' },
          { pt: 'Aceitam cartão?', en: 'Do you take card?', when: 'At the kiosk outside' },
        ],
        release: { ask: 'Ask whether they take card.', answer: 'Aceitam cartão?' },
        rung: 2,
      },
      {
        id: 'metro',
        kind: 'errand',
        title: 'Getting to {station}',
        why: 'Half the carriage is going where you are going. Follow them, and ask the one question that saves you a walk.',
        image: 'metro_platform',
        /* No line is named, for the reason the concert template's metro room gives at
           length: a metro line invented to fill a slot is the worst thing this pipeline
           could produce. */
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
          The point of this cluster, same as the concert's.

          "Queres vir ver o jogo?" is the sentence somebody actually says in Lisbon, and it
          is the one evening in the calendar where the invitation is more likely to be
          accepted than explained.
        */
        id: 'invite',
        kind: 'moment',
        title: 'Asking somebody to come',
        why: 'The only one of these that is not about getting somewhere. It is the reason to learn the other three.',
        image: 'two_at_a_bar',
        lines: [
          { pt: 'Queres vir ver o jogo comigo?', en: 'Do you want to come and watch the match with me?', when: 'The ask' },
          { pt: 'É no dia {day}.', en: 'It is on the {day_en}.', when: 'When they ask when' },
          { pt: 'Eu compro os bilhetes.', en: 'I will get the tickets.', when: 'To make saying yes easy' },
        ],
        release: {
          ask: 'Ask somebody to come and watch on the {day_en}.',
          answer: 'Queres vir ver o jogo comigo no dia {day}?',
        },
        rung: 3,
      },
    ],
  },
]

export function templateFor(kind: DropTemplate['kind']): DropTemplate | undefined {
  return DROP_TEMPLATES.find((t) => t.kind === kind)
}
