import type { CalendarKind } from '@/content/calendar'
import type { ChapterId } from '@/content/chapters'
import type { Situation } from '@/content/situations'

/**
 * Drops — a real thing happening on a real date, and the language for going to it.
 *
 * A drop used to be a vibe with an expiry: six Duran Duran song titles, gone the morning
 * after the gig. Which was a fun idea about a band and not much use to somebody who
 * actually wants to go — because what you need that week is not the chorus of Hungry Like
 * the Wolf, it is where the arena is, whether there are tickets left, which metro line goes
 * there, and how to ask somebody to come with you.
 *
 * So a drop is a CLUSTER of Situations pegged to one event. Everything about it is already
 * in the Situation model — a place, an errand, a moment, each ending in something you can
 * say cold — and the only thing that is new is the peg and the expiry.
 *
 * The song titles are not lost. They stay on the shelf as an ordinary vibe, which is where
 * they were always most useful: they are about a band, and a band does not expire.
 *
 * The last Situation in a cluster is the invitation, and it is the point of the whole
 * thing. A sentence you say to another person about an evening that has not happened yet
 * is the most valuable thing DUB can hand anybody, and it is the only reason to learn the
 * other three.
 */

/** Where a fact came from, and when somebody last looked at it. */
export interface DropSource {
  /** Which fact this vouches for. Not "the website" — the claim. */
  fact: string
  where: string
  checked: string
}

export interface Drop {
  id: string
  chapter: ChapterId
  /** What is happening, in the words somebody would use about it. */
  event: string
  place: { name: string; area: string }
  /** ISO date. The drop is gone the morning after. */
  on: string
  /**
   * What sort of thing it is, which decides how far ahead it is worth knowing about.
   *
   * Absent means 'event', because everything pegged to a happening is one. See
   * DROP_LEAD_DAYS: a gig you need a ticket for opens ninety days out, a strike fourteen.
   */
  kind?: CalendarKind
  /**
   * When it starts BEING a drop rather than a date in the diary.
   *
   * Absent means DROP_LEAD_DAYS for its kind. This is the per-thing override, for anything
   * that does not behave like its kind — a festival whose tickets go on sale in February.
   * A drop authored months ahead is not a drop yet, and urgency spent early is urgency
   * spent; but urgency spent TOO LATE is a sold-out show, which is the worse failure.
   */
  from?: string
  link?: { href: string; label: string }
  /** In teaching order, ending with the invitation. */
  situations: Situation[]
  /**
   * Every fact in here that is not language, and where it came from.
   *
   * A drop that gives the wrong metro line is not a small bug — it is somebody standing in
   * the wrong place. DUB sources the fact, DUB writes the language, and the language is
   * never sourced.
   */
  sources: DropSource[]
  review_by: string
}

export const DROPS: Drop[] = [
  {
    id: 'duran_duran_arena',
    chapter: 'lisbon',
    event: 'Duran Duran',
    /*
      3 November, and it was 14 November until somebody checked.

      The arena's own agenda, the official ticket seller and Bandsintown all say the 3rd;
      the 14th is a different show entirely. This is the ONLY Drop in the product, so for
      as long as it was wrong, every live-event claim DUB makes was wrong — and it would
      have put somebody outside an arena on a night with nothing in it.

      The venue is MEO Arena now. It was the Altice Arena, and before that the Pavilhão
      Atlântico, and a learner asking for the old name will still be understood — but the
      signs, the tickets and the metro announcements all say MEO.
    */
    place: { name: 'MEO Arena', area: 'Parque das Nações' },
    on: '2026-11-03',
    link: { href: 'https://arena.meo.pt/en/agenda/duran-duran_en/16275', label: 'TICKETS' },
    situations: [
      {
        id: 'drop_dd_where',
        chapter: 'lisbon',
        kind: 'place',
        title: 'Finding the arena',
        why: 'You have a ticket, you are somewhere near Oriente, and everything is signposted for people who already know where they are going.',
        lines: [
          { pt: 'Onde é o concerto?', en: 'Where is the concert?', when: 'To anybody outside the station' },
          { pt: 'É longe?', en: 'Is it far?', when: 'When they point vaguely' },
          { pt: 'A que horas abre?', en: 'What time does it open?', when: 'At the door' },
        ],
        release: { ask: 'Ask somebody where the concert is.', answer: 'Onde é o concerto?' },
        rung: 2,
        review_by: '2026-11-15',
      },
      {
        id: 'drop_dd_ticket',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'A ticket, on the night',
        why: 'The website says sold out and the box office often says otherwise. It is worth one sentence to find out.',
        lines: [
          { pt: 'Ainda há bilhetes?', en: 'Are there still tickets?', when: 'At the box office' },
          { pt: 'Quanto custa?', en: 'How much is it?', when: 'Before you commit to anything' },
          { pt: 'Dois, se faz favor.', en: 'Two, please.', when: 'If you are taking somebody' },
        ],
        release: { ask: 'Ask whether there are still tickets.', answer: 'Ainda há bilhetes?' },
        rung: 2,
        review_by: '2026-11-15',
      },
      {
        id: 'drop_dd_metro',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Getting to Oriente',
        why: 'It is the red line, it is the last stop, and the crowd will be doing it with you — which makes it the easiest place in Lisbon to ask a question.',
        lines: [
          { pt: 'Qual é a linha para o Oriente?', en: 'Which line goes to Oriente?', when: 'In the station' },
          { pt: 'É a linha vermelha.', en: 'It is the red line.', when: 'What you will hear back' },
          { pt: 'Onde fica a saída?', en: 'Where is the way out?', when: 'When you arrive with everybody else' },
        ],
        release: { ask: 'Ask which line goes to Oriente.', answer: 'Qual é a linha para o Oriente?' },
        rung: 2,
        review_by: '2026-11-15',
      },
      {
        /*
          The point of the whole cluster.

          Three sentences about logistics are worth having and none of them is why anybody
          learns a language. This one is: an evening that has not happened yet, offered to
          somebody, in their language. It is also the compounding claim at its clearest —
          `comigo` came out of Top Gun and `vir` out of a Bond title, and neither was ever
          about a concert.
        */
        id: 'drop_dd_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to come',
        why: 'The only one of these that is not about getting somewhere. It is the reason to learn the other three.',
        on: '2026-11-03',
        lines: [
          { pt: 'Queres vir comigo ao concerto?', en: 'Do you want to come to the concert with me?', when: 'The ask' },
          { pt: 'É no dia três.', en: 'It is on the third.', when: 'When they ask when' },
          { pt: 'Eu compro os bilhetes.', en: 'I will get the tickets.', when: 'To make saying yes easy' },
        ],
        release: {
          ask: 'Ask somebody to come with you on the third.',
          answer: 'Queres vir comigo ao concerto no dia três?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Duran Duran are at the MEO Arena on 3 November 2026',
        where: 'arena.meo.pt',
        checked: '2026-08-27',
      },
      {
        fact: 'Oriente is on the red line, and is the stop for the MEO Arena',
        where: 'metrolisboa.pt',
        checked: '2026-08-27',
      },
    ],
    review_by: '2026-11-15',
  },
]

/** Every situation in every drop, so the rest of the product can find one by id. */
export const DROP_SITUATIONS: Situation[] = DROPS.flatMap((d) => d.situations)

/** Which drop a situation belongs to, or nothing if it is a standing room. */
export function dropFor(situationId: string): Drop | undefined {
  return DROPS.find((d) => d.situations.some((s) => s.id === situationId))
}
