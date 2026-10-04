/**
 * The year itself — drops that are true every year, so the tab can never be empty.
 *
 * THE PROBLEM THIS FILE EXISTS TO FIX, measured rather than feared. On 2026-10-03 the
 * Club served twelve drops. Walked forward with the real functions, it served eight on
 * the 15th, four on the 23rd, one on the 29th, and from 2026-11-04 it served ZERO — not
 * for a week, but for ever, because every drop in the product came from one harvested
 * month and `rowsFor` drops a row the morning after it happens.
 *
 * And nothing said so. `feedFor` still returned forty-seven cards, because thirty-five
 * standing rooms were behind the drops; so the Club did not break, it just quietly stopped
 * being about Lisbon. Sam, who built it, could feel that and could not point at it:
 * "I do not feel that we've really nailed the drop content and the excitement and locality
 * reality of new relevant content."
 *
 * THE FIX IS NOT A BETTER EMPTY STATE. An apology rendered beautifully is still an
 * apology, and a product whose claim is that the city is live cannot answer "what is on"
 * with a box explaining why nothing is. The fix is content with no expiry date in it.
 *
 * WHAT IS IN HERE IS TRUE WITHOUT A LISTING. Nobody has to confirm that Santo António is
 * on the 12th of June, that Lisbon eats sardines in the street that night, that the
 * Christmas lights go up on Rua Augusta, or that the first hot Saturday empties the city
 * on to a train to Cascais. These are not events somebody schedules; they are what the
 * year does here. That is the whole reason this content is safe to author unattended and
 * the harvested gigs are not — I cannot know what is on at the arena in November 2026, and
 * I have invented nothing. Every row needing a real listing is in the report for Sam.
 *
 * THE DATE IS COMPUTED, NOT STORED, which is the only new mechanism. A stored ISO date
 * expires; `rowsFor` compares strings and would delete Christmas on the 26th of December
 * for ever. So a recurring row carries the DAY AND MONTH it falls on and is projected into
 * whichever year is next — see `rowsForYear`. Santo António 2027 is the same row as Santo
 * António 2026 with a different year on the front, which is also how a person thinks
 * about it.
 *
 * THE RUN-UP IS THE POINT, NOT A SIDE EFFECT. DROP_LEAD_DAYS gives `annual` twenty-one
 * days — Sam: "They will all follow this format so AVOID HARD-CODING" — so these open a
 * fortnight and a bit before, which is when somebody would actually make a plan, and they
 * are gone the morning after like every other drop. A learner is never shown Christmas in
 * March. The floor under the tab is not "always the same six things"; it is "something is
 * always within three weeks", which is a different and much better promise.
 *
 * NOT REVIEWED. The Portuguese here is mine, written to the register of the existing
 * blocks and reusing their structures deliberately — `Queres vir comigo`, `É no dia`,
 * `Onde é`, `Quanto custa`, `Pode repetir` all appear in content/drop-templates.ts or the
 * Lisbon blocks already, so nothing here asks a learner to produce a shape they have not
 * met. It still wants a pt-PT reader before anybody says it to a stranger, exactly as the
 * two existing templates do. See the warning in `npm run drops`.
 */
import { DROP_LEAD_DAYS } from '@/content/roots'
import type { Purpose, Situation } from '@/content/situations'
import type { ChapterId } from '@/content/chapters'
import type { Drop, DropSource } from '@/content/drops'

/**
 * A thing the year does, and the language for being in it.
 *
 * Deliberately NOT a CalendarRow with a clever date. A row is a FACT ABOUT THE CITY that a
 * template turns into language, and that bargain is right for a gig: a hundred gigs are a
 * hundred rows and one set of reviewed sentences. It is wrong here. Santo António and the
 * first hot Saturday have nothing in common to template — one is sardines and a crowd in
 * Alfama, the other is a train timetable and sun cream — so there is no abstraction to
 * share, and pretending there is would produce four identical nights out with the nouns
 * swapped. These carry their own rooms, like the hand-authored drop does.
 *
 * What they share with a CalendarRow is the discipline: the facts are separable from the
 * language, and `sources` says what is being vouched for.
 */
export interface Recurring {
  id: string
  chapter: ChapterId
  /** 1-12. The month it falls in, every year. */
  month: number
  /** The day it falls on, every year. */
  day: number
  /**
   * The last day, where it is more than one.
   *
   * Same month, because nothing in here straddles one. A range means the drop survives
   * until the morning after `until` rather than after `day` — Santo António is the 12th
   * and the 13th, and somebody reading it on the 13th is in the middle of it.
   */
  until?: number
  /** What it is, in the words somebody would use about it. */
  event: string
  place: { name: string; area: string }
  /**
   * Who it is for, and this is the field the whole product has been gathering and never
   * spending.
   *
   * CalendarRow has carried a required `purposes` since it was written, the harvester is
   * told it is "the point of the exercise", and all fourteen harvested rows came back
   * `['visiting', 'staying', 'moving']` — one distinct value across the entire calendar.
   * So purpose has never once changed which drop anybody saw, because there has never been
   * a drop that differed by purpose. These differ. The Christmas lights are for somebody
   * on four days in December; the hot Saturday is for whoever is still here in June.
   *
   * Absent means everybody, the same convention as Situation.purposes and for the same
   * reason: most of Lisbon does not care why you came.
   */
  purposes?: Purpose[]
  /**
   * How many days before it starts this becomes worth knowing about.
   *
   * Absent means DROP_LEAD_DAYS for `annual`, which is twenty-one — Sam's own number, and
   * right for a thing you plan a fortnight out.
   *
   * IT EXISTS BECAUSE TWENTY-ONE DAYS EACH LEFT HOLES. Measured across the four hundred
   * days after the harvested calendar runs out, eight entries at the default window still
   * left 136 days with an empty tab, the worst a fifty-day stretch through September. The
   * wrong fix is to pad the file with drops nobody needs; the right one is that some of
   * these genuinely have a longer run-up than three weeks — the sales are a season, August
   * closures are something you plan around for a month, and the beach is on anybody's mind
   * from May. A window is honest when the thing is actually on somebody's mind that far
   * out, and `Drop.from` has existed for exactly this since it was written.
   */
  lead?: number
  /** In teaching order, ending on the invitation. See content/drops.ts. */
  rooms: Situation[]
  sources: DropSource[]
}

/*
  WHY THERE IS NO `shape` AND NO TEMPLATE HERE.

  A `shape` picks a template, and a template is worth having when many rows share one set
  of sentences. These four share nothing — see the note on Recurring. Adding a third
  unreviewed template would also make `npm run drops` warn "0 of 3 templates read by a
  native speaker" while buying nothing, and the honest move is to leave the template count
  where it is until a pt-PT reader has seen the two that are already live.
*/

/*
  WHY THERE ARE EIGHT OF THESE AND NOT THREE, which is a measurement rather than a taste.

  Four entries looked like plenty and were not. A drop opens twenty-one days out and goes
  the morning after, so each one covers about three weeks of the year — and walking the real
  `dropsFor` across the four hundred days after the harvested calendar runs out, four
  entries left 281 of them with an empty tab, including one stretch of 149 days from late
  June to mid-November. A floor with a five-month hole in it is not a floor.

  So the set is chosen to SPREAD, not to be a list of Lisbon's greatest hits: something in
  every season, with no gap longer than about a month. That is the whole design constraint,
  and it is why a quiet one like the November chestnut stand earns its place next to Santo
  António — the year needs covering, not celebrating.
*/
export const RECURRING: Recurring[] = [
  {
    /*
      THE ONE EVERYBODY MEANS WHEN THEY SAY LISBON.

      The 12th of June into the 13th: the Festas de Lisboa peak, every street in Alfama and
      Graça and Madragoa full of smoke, sardines on bread, a plastic cup of beer, and
      arraiais going until it gets light. The 13th is the public holiday — Santo António is
      the city's patron — so the 12th is the night nobody has to get up after.

      It is in `annual` rather than `festival` because it is the year coming round rather
      than a thing somebody programmed. Nobody books Santo António.
    */
    id: 'lisbon_santo_antonio',
    chapter: 'lisbon',
    month: 6,
    day: 12,
    until: 13,
    event: 'Santo António — the night the whole city eats outside',
    /* From mid-May. The Festas de Lisboa run through June and the city is visibly getting
       ready for weeks — bunting up, grills appearing — so three weeks is too late. */
    lead: 30,
    place: { name: 'Alfama, Graça, Madragoa', area: 'the old streets, all of them' },
    /*
      FOR EVERYBODY, AND IT IS THE ONLY ONE IN HERE THAT IS.

      A visitor who happens to be here has walked into the best night of the Lisbon year; a
      mover is being shown what their neighbours do. There is no version of this that is
      somebody else's.
    */
    rooms: [
      {
        id: 'rec_santo_sardinha',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Sardines, standing up',
        why: 'There is a grill on the pavement, a queue that is not a queue, and no menu. This is the entire transaction.',
        image: {
          src: '/bank/santo-antonio-grill.jpg',
          alt: 'A charcoal grill on a Lisbon street at night, packed with sardines and heavy with smoke, two paper plates of bread beside it and a crowd under strings of coloured lights behind.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Uma sardinha no pão, por favor.',
            en: 'One sardine on bread, please.',
            when: 'The whole order. It comes on a slice, not a plate.',
          },
          {
            pt: 'Duas, por favor.',
            en: 'Two, please.',
            when: 'If somebody is with you. The same sentence as any counter in Lisbon.',
          },
          {
            pt: 'Quanto custa?',
            en: 'How much is it?',
            when: 'Worth asking out loud — it is cash, and there is no price up anywhere.',
          },
        ],
        release: { ask: 'Order one sardine on bread.', answer: 'Uma sardinha no pão, por favor.' },
        rung: 2,
      },
      {
        id: 'rec_santo_onde',
        chapter: 'lisbon',
        kind: 'place',
        title: 'Finding the party',
        why: 'You can hear four of them and see none. Everybody on the street knows which way to go and nobody has been asked.',
        image: {
          src: '/bank/santo-antonio-street.jpg',
          alt: 'A narrow Lisbon street at night strung with bunting and paper lanterns, filled shoulder to shoulder with people seen from behind, smoke hanging in the light.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Onde é o arraial?',
            en: 'Where is the street party?',
            when: 'To anybody. Arraial is the word on every poster, so it is the word to use.',
          },
          {
            pt: 'É longe?',
            en: 'Is it far?',
            when: 'When they point vaguely. The same line the arena room teaches.',
          },
          {
            pt: 'Pode repetir, mais devagar?',
            en: 'Can you say that again, more slowly?',
            when: 'The repair. There is a brass band behind you and you will need it.',
          },
        ],
        release: { ask: 'Ask somebody where the street party is.', answer: 'Onde é o arraial?' },
        rung: 2,
      },
      {
        /*
          The point of the cluster, and the same shape as the arena invitation: a sentence
          said to another person about an evening that has not happened yet. The structure
          `Queres vir comigo` is already taught in the concert template, so this asks
          nothing new of anybody's inventory — only a new night to spend it on.
        */
        id: 'rec_santo_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to come',
        why: 'The reason to learn the other two. Everyone is out that night and anybody can be asked.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres vir comigo ao arraial?',
            en: 'Do you want to come to the street party with me?',
            when: 'The ask.',
          },
          {
            pt: 'É no dia doze, à noite.',
            en: 'It is on the twelfth, at night.',
            when: 'When they ask when. It runs until it gets light, so nobody says a time.',
          },
          {
            pt: 'Vamos comer sardinhas.',
            en: 'We are going to eat sardines.',
            when: 'What makes it easy to say yes to, and the only plan anybody needs.',
          },
        ],
        release: {
          ask: 'Ask somebody to come to the street party with you.',
          answer: 'Queres vir comigo ao arraial?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Santo António is Lisbon’s patron saint; the 13th of June is a municipal holiday and the arraiais run through the night of the 12th',
        where: 'common knowledge in Lisbon, and the Festas de Lisboa programme every year',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      CHRISTMAS, AS A STREET RATHER THAN A FEELING.

      The lights on Rua Augusta and the Praça do Comércio tree are up by the start of
      December and the city walks down there to look at them — which makes it the one
      Christmas thing in Lisbon with a PLACE, and therefore the one that can be taught.
      "Christmas" on its own is not a drop; a crowded pedestrian street with a tree at the
      end of it is.

      Deliberately NOT the 24th or the 25th. Consoada is somebody's family at home, which
      is nothing a learner can walk into and nothing DUB should pretend to hand them. The
      lights are public, free, and open to anybody in the city.
    */
    id: 'lisbon_luzes_natal',
    chapter: 'lisbon',
    month: 12,
    day: 8,
    until: 31,
    event: 'The Christmas lights on Rua Augusta',
    place: { name: 'Rua Augusta and Praça do Comércio', area: 'Baixa' },
    /*
      VISITING AND STAYING, and this is the first content in the product where purpose
      genuinely differs rather than being authored `['visiting','staying','moving']` out of
      habit. Somebody who lives here has seen the lights and is not being told about them
      as news; somebody here for four days in December is standing in the middle of it
      wondering what the crowd is for.
    */
    purposes: ['visiting', 'staying'],
    rooms: [
      {
        id: 'rec_natal_luzes',
        chapter: 'lisbon',
        kind: 'place',
        title: 'Where the lights are',
        why: 'Everybody in Baixa is walking the same way and you cannot see why yet.',
        image: {
          src: '/bank/natal-rua-augusta.jpg',
          alt: 'A wide pedestrian street at night under arches of white Christmas lights, crowds walking away from the camera towards a lit archway at the end.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Onde são as luzes de Natal?',
            en: 'Where are the Christmas lights?',
            when: 'To anybody in Baixa. They will point down Rua Augusta.',
          },
          {
            pt: 'A que horas acendem?',
            en: 'What time do they come on?',
            when: 'Early evening, but worth asking rather than standing about.',
          },
          {
            pt: 'É por aqui?',
            en: 'Is it this way?',
            when: 'The short version, when you only need a yes.',
          },
        ],
        release: {
          ask: 'Ask somebody where the Christmas lights are.',
          answer: 'Onde são as luzes de Natal?',
        },
        rung: 2,
      },
      {
        id: 'rec_natal_castanhas',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Chestnuts, from the cart',
        why: 'There is a drum of coals on the corner, a paper cone, and a man who has done this for thirty years and will not slow down for you.',
        image: {
          src: '/bank/castanhas-cart.jpg',
          alt: 'A street vendor turning chestnuts on a drum roaster at dusk, paper cones stacked on the cart beside him, an empty Lisbon street behind.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Um cone de castanhas, por favor.',
            en: 'A cone of chestnuts, please.',
            when: 'The order. They are sold by the cone, not by weight.',
          },
          {
            pt: 'Quanto custa?',
            en: 'How much is it?',
            when: 'Cash, and the price is rarely written down.',
          },
          {
            pt: 'Obrigado, está bom assim.',
            en: 'Thank you, that is enough.',
            when: 'When he keeps filling it. Obrigada if you are a woman.',
          },
        ],
        release: {
          ask: 'Order a cone of chestnuts.',
          answer: 'Um cone de castanhas, por favor.',
        },
        rung: 2,
      },
      {
        id: 'rec_natal_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to come and see them',
        why: 'The lights are an excuse to walk through town with somebody for an hour, which is the entire point of them.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres vir ver as luzes comigo?',
            en: 'Do you want to come and see the lights with me?',
            when: 'The ask. The same shape as the match invitation — vir ver.',
          },
          {
            pt: 'Podemos ir hoje à noite.',
            en: 'We can go this evening.',
            when: 'They are on every night in December, so there is no date to agree.',
          },
          {
            pt: 'Depois bebemos um copo.',
            en: 'Afterwards we can have a drink.',
            when: 'What makes it an evening rather than an errand.',
          },
        ],
        release: {
          ask: 'Ask somebody to come and see the lights with you.',
          answer: 'Queres vir ver as luzes comigo?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Lisbon lights Rua Augusta and the Baixa streets for Christmas each December, with the tree in Praça do Comércio',
        where: 'Câmara Municipal de Lisboa does this every year; the exact switch-on date moves and is not claimed here',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      THE FIRST HOT SATURDAY, which is the most Lisbon thing in this file and the only one
      with no fixed date at all.

      Some Saturday in June the whole city decides at once and the Cascais train is full of
      towels by half nine. Nobody schedules it. It is pegged to the 13th of June only
      because something has to be on the front of a drop and the weekend after Santo
      António is when it reliably happens — which is an honest approximation of a real
      pattern rather than a claim about a date, and it is written as such on the card.

      The language is the part that is exactly true whatever Saturday it falls on: the
      ticket, the platform, the question about the water.
    */
    id: 'lisbon_primeiro_calor',
    chapter: 'lisbon',
    month: 6,
    day: 20,
    event: 'The first properly hot Saturday — everyone on the Cascais train',
    /* From the start of May. The first hot weekend is a thing people talk about well
       before it arrives, and it is the one entry whose date is an approximation anyway. */
    lead: 50,
    place: { name: 'Cais do Sodré to Cascais', area: 'the whole line, and every beach on it' },
    /*
      STAYING AND MOVING. A visitor with four days in Lisbon does not spend one of them on
      a commuter line to a beach — they are at the miradouros and the tram. Somebody who
      lives here, or is here for a season, is the person for whom "the first hot Saturday"
      is a thing that happens TO them and needs a plan.
    */
    purposes: ['staying', 'moving'],
    rooms: [
      {
        id: 'rec_calor_bilhete',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'A ticket at Cais do Sodré',
        why: 'There is a machine, a queue of people who know what they are doing, and a man at a window who is quicker.',
        image: {
          src: '/bank/moving-ticket-machine.jpg',
          alt: 'A row of transport ticket machines in a tiled station hall, one lit screen showing fare options.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Um bilhete para Cascais, por favor.',
            en: 'A ticket to Cascais, please.',
            when: 'At the window. Ida e volta if you want a return.',
          },
          {
            pt: 'Ida e volta.',
            en: 'Return.',
            when: 'Two words, and it is the whole answer to what they will ask you.',
          },
          {
            pt: 'De que linha sai?',
            en: 'Which platform does it leave from?',
            when: 'The one worth having. It is a terminus and the platform changes.',
          },
        ],
        release: {
          ask: 'Ask for a ticket to Cascais.',
          answer: 'Um bilhete para Cascais, por favor.',
        },
        rung: 2,
      },
      {
        id: 'rec_calor_praia',
        chapter: 'lisbon',
        kind: 'place',
        title: 'On the beach, asking about the water',
        why: 'The Atlantic off Carcavelos in June is colder than it looks and everybody on the sand already knows how cold.',
        image: {
          src: '/bank/praia-carcavelos.jpg',
          alt: 'A wide Atlantic beach busy with towels and coloured umbrellas, a railway line running along low cliffs behind it, hard summer light.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'A água está fria?',
            en: 'Is the water cold?',
            when: 'To anybody coming out of it. The most answered question on that beach.',
          },
          {
            pt: 'Está muito fria!',
            en: 'It is very cold!',
            when: 'What you will hear back, and what you can say next time.',
          },
          {
            pt: 'Onde há sombra?',
            en: 'Where is there any shade?',
            when: 'By one o’clock this is the only question that matters.',
          },
        ],
        release: { ask: 'Ask somebody whether the water is cold.', answer: 'A água está fria?' },
        rung: 2,
      },
      {
        id: 'rec_calor_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to come to the beach',
        why: 'Said on a Friday, about a Saturday. The one sentence in this drop that has to be said before the day rather than during it.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres vir à praia comigo?',
            en: 'Do you want to come to the beach with me?',
            when: 'The ask.',
          },
          {
            pt: 'Vamos no sábado de manhã.',
            en: 'We are going on Saturday morning.',
            when: 'Morning, because by midday the train is full and the sand is gone.',
          },
          {
            pt: 'Apanhamos o comboio em Cais do Sodré.',
            en: 'We will get the train at Cais do Sodré.',
            when: 'Comboio is the train. Apanhar is to catch one, and it is the verb everybody uses.',
          },
        ],
        release: {
          ask: 'Ask somebody to come to the beach with you.',
          answer: 'Queres vir à praia comigo?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'The Cascais line runs from Cais do Sodré along the coast past Carcavelos and Estoril; it is the way Lisbon gets to a beach without a car',
        where: 'cp.pt, and the habit of the entire city every June',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      A METRO STRIKE, WHICH IS NOT A DATE AND IS STILL THE MOST USEFUL DROP IN HERE.

      This is the one entry that is deliberately NOT pegged to a real occurrence, and the
      reasoning matters because it is the opposite of everywhere else in this product. A
      strike is called a week or two out, by a union, on a date nobody can know in advance
      — so a row claiming one would be exactly the fiction the `verified` gate exists to
      prevent.

      But a strike in Lisbon is not rare, and the language for one is completely
      predictable: is the metro running, is there a bus instead, is it on tomorrow too. So
      this is authored as a REHEARSAL rather than a bulletin, and the card says so in its
      own words — nothing here claims a strike is happening. It is pegged to the first
      Monday in March as a neutral slot in a quiet month, purely so it comes round and gets
      taught once a year.

      SAM: if a strike IS called, the honest thing is a `disruption` row in the month's
      calendar file with real sources and `verified: true`. DROP_LEAD_DAYS already gives
      disruption fourteen days for exactly that. This drop is the practice; that row would
      be the news.
    */
    id: 'lisbon_greve_metro',
    chapter: 'lisbon',
    month: 3,
    day: 2,
    event: 'When the metro is on strike — the words for a day that has gone wrong',
    place: { name: 'any metro station', area: 'and the bus stop outside it' },
    /*
      STAYING AND MOVING, firmly. A strike ruins a commute and inconveniences a holiday,
      and the sentences below are about getting to work: whether it is on again tomorrow is
      a question somebody with a job asks.
    */
    purposes: ['staying', 'moving'],
    rooms: [
      {
        id: 'rec_greve_fechado',
        chapter: 'lisbon',
        kind: 'place',
        title: 'The gates are shut',
        why: 'There is a printed sheet taped to the glass, a crowd reading it, and one member of staff. This is a rehearsal, not news — no strike is being claimed here.',
        image: {
          src: '/bank/metro-closed-gates.jpg',
          alt: 'Four people seen from behind reading a printed notice taped to the closed metal grille of a metro entrance.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'O metro está a funcionar?',
            en: 'Is the metro running?',
            when: 'The first question, to the person in the uniform.',
          },
          {
            pt: 'Há greve hoje?',
            en: 'Is there a strike today?',
            when: 'Greve is the word on the notice. Knowing it turns a wall of text into one fact.',
          },
          {
            pt: 'Até quando?',
            en: 'Until when?',
            when: 'Two words, and the only thing you actually need to plan around.',
          },
        ],
        release: { ask: 'Ask whether the metro is running.', answer: 'O metro está a funcionar?' },
        rung: 2,
      },
      {
        id: 'rec_greve_alternativa',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Getting there anyway',
        why: 'The buses are running and nobody waiting at the stop knows which of them helps you.',
        image: {
          src: '/bank/bus-stop-crowd.jpg',
          alt: 'A long queue waiting along the kerb at a Lisbon bus stop as a yellow bus pulls in, everybody seen from behind in flat morning light.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Há autocarro para o centro?',
            en: 'Is there a bus to the centre?',
            when: 'At the stop, to anybody. Autocarro, never ónibus — that is Brazil.',
          },
          {
            pt: 'Qual é o autocarro para Alcântara?',
            en: 'Which is the bus to Alcântara?',
            when: 'Swap in wherever you are going.',
          },
          {
            pt: 'Pode repetir, mais devagar?',
            en: 'Can you say that again, more slowly?',
            when: 'The repair. A bus number said fast is a bus you miss.',
          },
        ],
        release: {
          ask: 'Ask whether there is a bus to the centre.',
          answer: 'Há autocarro para o centro?',
        },
        rung: 2,
      },
      {
        id: 'rec_greve_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Telling somebody, and asking them to wait',
        why: 'The invitation, inverted, and it still has to be a question — what you need from the other person is for them to hold on. On a morning like this it is the sentence that matters most.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Vou chegar atrasado.',
            en: 'I am going to be late.',
            when: 'Atrasada if you are a woman. Said on the phone, or sent.',
          },
          {
            pt: 'Há greve no metro.',
            en: 'There is a metro strike.',
            when: 'The reason, and in Lisbon it is accepted without further discussion.',
          },
          {
            pt: 'Podes esperar por mim?',
            en: 'Can you wait for me?',
            when: 'The ask, and the only part that needs an answer from them.',
          },
        ],
        /*
          THE ASK, NOT THE ANNOUNCEMENT. This room ended on "Vou chegar atrasado" — I am
          going to be late — and `npm run drops` rightly failed it: every drop in this
          product ends on a sentence that asks another person for something, and a
          statement is not one. The check is a good check and it caught real content
          drifting off the rule, which is what it is for.
        */
        release: {
          ask: 'Ask somebody to wait for you.',
          answer: 'Podes esperar por mim?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Metro de Lisboa strikes are called by its unions with short notice and are a recurring feature of the city; NO STRIKE IS CLAIMED BY THIS DROP, which teaches the language for one',
        where: 'authored as a rehearsal — see the note in content/recurring.ts',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      SEPTEMBER — THE CITY COMING BACK, which filled the single worst hole in the year.

      Measured: even with seven entries and honest run-ups there were fifty consecutive days
      from the 1st of September with an empty tab. September is not a gap in the Lisbon year
      though, it is one of its most distinct months — everybody is back, the shutters go up
      again, the schools start, and the whole city is renewing a transport pass or a gym
      membership or a lease in the same fortnight.

      The content is the re-entry: the place you go to is open again, and the thing you have
      to sort out is a monthly pass. That is the most-used piece of Lisbon bureaucracy there
      is and it had no room anywhere in the product.
    */
    id: 'lisbon_setembro_regresso',
    chapter: 'lisbon',
    month: 9,
    day: 1,
    until: 30,
    event: 'September — everything open again, and the pass to renew',
    place: { name: 'the Navegante desk', area: 'any big metro station, and your own street' },
    /*
      STAYING AND MOVING. A monthly transport pass is not a four-day errand — a visitor buys
      single tickets or a 24-hour one, and sending them to a pass desk would be exactly the
      "this Club is for somebody else" failure the purposes field exists to prevent.
    */
    purposes: ['staying', 'moving'],
    lead: 25,
    rooms: [
      {
        id: 'rec_setembro_passe',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'The monthly pass',
        why: 'Thirty euros a month for everything in the city, and the only hard part is the sentence that starts it.',
        image: {
          src: '/bank/moving-ticket-machine.jpg',
          alt: 'A row of transport ticket machines in a tiled station hall, one lit screen showing fare options.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queria carregar o passe.',
            en: 'I would like to top up my pass.',
            when: 'The opening. Carregar is to load it, and it is the verb on every machine.',
          },
          {
            pt: 'Para o mês de setembro.',
            en: 'For the month of September.',
            when: 'A pass is monthly, not thirty days, so the month is what they need.',
          },
          {
            pt: 'Onde é que se carrega?',
            en: 'Where do you top it up?',
            when: 'When you cannot find the machine, which is most stations.',
          },
        ],
        release: { ask: 'Say you would like to top up your pass.', answer: 'Queria carregar o passe.' },
        rung: 2,
      },
      {
        id: 'rec_setembro_reabriu',
        chapter: 'lisbon',
        kind: 'place',
        title: 'The place on your street is open again',
        why: 'It has been shut since the end of July. Going in on the first week back is the easiest conversation of the year, because they are pleased to see anybody.',
        image: {
          src: '/bank/queue-outside.jpg',
          alt: 'A short queue of people waiting on a pavement outside a small lit doorway in the evening.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Já abriram!',
            en: 'You are open again!',
            when: 'Said on the way in. It is a greeting rather than a question.',
          },
          {
            pt: 'Como foram as férias?',
            en: 'How were the holidays?',
            when: 'The whole of September’s small talk, and it is always welcome.',
          },
          {
            pt: 'O de sempre, por favor.',
            en: 'The usual, please.',
            when: 'The sentence that means you live here. Worth earning.',
          },
        ],
        release: { ask: 'Ask how their holidays were.', answer: 'Como foram as férias?' },
        rung: 2,
      },
      {
        id: 'rec_setembro_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Starting something again with somebody',
        why: 'September is when people make plans for the year. The invitation here is not for one evening, it is for a habit.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres beber um copo na quinta?',
            en: 'Do you want to have a drink on Thursday?',
            when: 'The ask, with a day in it. Quinta is Thursday.',
          },
          {
            pt: 'Todas as semanas?',
            en: 'Every week?',
            when: 'The real invitation, and the best three words in this file.',
          },
          {
            pt: 'Combinado.',
            en: 'Agreed. / It is a deal.',
            when: 'What you say when it is settled. One word, and very Portuguese.',
          },
        ],
        release: {
          ask: 'Ask somebody for a drink on Thursday.',
          answer: 'Queres beber um copo na quinta?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Lisbon returns from holiday in September: shops and restaurants that closed in August reopen, the school year begins, and monthly Navegante transport passes are loaded per calendar month',
        where: 'the habit of the city, and the Navegante monthly pass rules',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      THE CHESTNUT STAND, which covers November and is the quietest thing in this file.

      Mid-November the carts appear on the corners and stay until February — São Martinho
      on the 11th is when it starts, and it is the moment the city smells of smoke. It is
      here because the year needed covering between the arena gigs ending and the Christmas
      lights going up, and because it is the single easiest real transaction in Lisbon: one
      cone, cash, four words.

      The chestnut lines deliberately overlap the Christmas-lights room. That is reuse, not
      duplication — the same stand, met twice in one winter, which is how a learner actually
      meets it.
    */
    id: 'lisbon_sao_martinho',
    chapter: 'lisbon',
    month: 11,
    day: 11,
    until: 20,
    event: 'São Martinho — the chestnut carts are back on the corners',
    place: { name: 'every corner in Baixa and Chiado', area: 'and outside most metro stations' },
    rooms: [
      {
        id: 'rec_martinho_castanhas',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'The first cone of the winter',
        why: 'The smoke is the point. One cone, cash, and no English anywhere near it.',
        image: {
          src: '/bank/queue-outside.jpg',
          alt: 'A short queue of people waiting on a pavement outside a small lit doorway in the evening.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Um cone de castanhas, por favor.',
            en: 'A cone of chestnuts, please.',
            when: 'The order. Sold by the cone, never by weight.',
          },
          {
            pt: 'Quanto custa?',
            en: 'How much is it?',
            when: 'Cash, and the price is rarely written down.',
          },
          {
            pt: 'Está quente?',
            en: 'Is it hot?',
            when: 'A real question in November, and it starts a conversation every time.',
          },
        ],
        release: {
          ask: 'Order a cone of chestnuts.',
          answer: 'Um cone de castanhas, por favor.',
        },
        rung: 2,
      },
      {
        id: 'rec_martinho_agua_pe',
        chapter: 'lisbon',
        kind: 'place',
        title: 'What they are drinking with them',
        why: 'São Martinho is chestnuts and água-pé, and asking about it is the fastest way into a conversation with somebody’s grandfather.',
        image: {
          src: '/bank/queue-outside.jpg',
          alt: 'A short queue of people waiting on a pavement outside a small lit doorway in the evening.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'O que é água-pé?',
            en: 'What is água-pé?',
            when: 'Ask it. Nobody expects a foreigner to know, and everybody wants to explain.',
          },
          {
            pt: 'Posso provar?',
            en: 'Can I try some?',
            when: 'The sentence that turns a question into a glass.',
          },
          {
            pt: 'Pode repetir, mais devagar?',
            en: 'Can you say that again, more slowly?',
            when: 'The repair. You will get a long answer and you asked for it.',
          },
        ],
        release: { ask: 'Ask what água-pé is.', answer: 'O que é água-pé?' },
        rung: 2,
      },
      {
        id: 'rec_martinho_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody out for chestnuts',
        why: 'Twenty minutes on a cold corner. The lowest-stakes invitation in the language, which is exactly why it is the one to practise.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres ir comer castanhas comigo?',
            en: 'Do you want to go and eat chestnuts with me?',
            when: 'The ask.',
          },
          {
            pt: 'Há uma banca ali.',
            en: 'There is a stand over there.',
            when: 'Banca is the stand. It makes the plan concrete in three words.',
          },
          {
            pt: 'Eu pago.',
            en: 'I will pay.',
            when: 'It is two euros, and it is what makes saying yes easy.',
          },
        ],
        release: {
          ask: 'Ask somebody to go and eat chestnuts with you.',
          answer: 'Queres ir comer castanhas comigo?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'São Martinho is the 11th of November and marks the start of the chestnut season in Lisbon; carts appear across the city from mid-November',
        where: 'the Portuguese calendar, and every street corner in Baixa from November to February',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      JANUARY, WHICH IS THE HARDEST MONTH TO FIND CONTENT FOR AND THE MOST USEFUL.

      Nothing is on. Everybody is broke, the lights come down, and the city goes back to
      work — which is precisely when somebody who has just moved here has their first
      ordinary week and needs the language for one. So this is deliberately not an event at
      all: it is the January sales, which are real, dated by law, and the only reason
      anybody is in a shop in the first fortnight of the year.

      It covers the 39-day hole measured between New Year and Carnaval.
    */
    id: 'lisbon_saldos',
    chapter: 'lisbon',
    month: 1,
    day: 7,
    until: 31,
    event: 'The January sales — the one reason to be in a shop this month',
    /* From mid-December. The sales are advertised before Christmas and anybody holding off
       on a coat is already waiting for them. */
    lead: 25,
    place: { name: 'Chiado and the Avenida', area: 'and every centro comercial' },
    /*
      STAYING AND MOVING. Buying a winter coat you will own for years is not a four-day
      holiday errand; it is what somebody does in their first January here.
    */
    purposes: ['staying', 'moving'],
    rooms: [
      {
        id: 'rec_saldos_tamanho',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Asking for your size',
        why: 'The rail is picked over, the sizes are European, and the one you want is behind the counter.',
        image: {
          src: '/bank/moving-phone-shop.jpg',
          alt: 'A bright shop interior with a counter, a member of staff behind it and stock on the wall shelves.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Tem isto no tamanho M?',
            en: 'Do you have this in a medium?',
            when: 'Swap in S, L, or a number for shoes.',
          },
          {
            pt: 'Posso experimentar?',
            en: 'Can I try it on?',
            when: 'The fitting room is almost always behind somebody.',
          },
          {
            pt: 'Quanto custa com desconto?',
            en: 'How much is it with the discount?',
            when: 'The sale price is often not the one on the label, and this is how you find out.',
          },
        ],
        release: { ask: 'Ask whether they have it in a medium.', answer: 'Tem isto no tamanho M?' },
        rung: 2,
      },
      {
        id: 'rec_saldos_troca',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Paying, and whether you can bring it back',
        why: 'Sale goods and returns are a real conversation here, and it is much cheaper to have it before you pay than after.',
        image: {
          src: '/bank/moving-signing.jpg',
          alt: 'A hand signing a form on a counter, a card machine and a printed receipt beside it.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Posso pagar com cartão?',
            en: 'Can I pay by card?',
            when: 'Almost always yes, and Multibanco is the word you will hear.',
          },
          {
            pt: 'Posso trocar se não servir?',
            en: 'Can I exchange it if it does not fit?',
            when: 'The question worth asking out loud, before the card goes in.',
          },
          {
            pt: 'Pode dar-me o recibo?',
            en: 'Can you give me the receipt?',
            when: 'You need it for any of the above.',
          },
        ],
        release: {
          ask: 'Ask whether you can exchange it if it does not fit.',
          answer: 'Posso trocar se não servir?',
        },
        rung: 2,
      },
      {
        id: 'rec_saldos_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to come along',
        why: 'Nobody shops the sales alone if they can help it. The invitation, on the dullest possible pretext, which is where most real ones happen.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres vir comigo ao Chiado?',
            en: 'Do you want to come to Chiado with me?',
            when: 'The ask. Swap in anywhere.',
          },
          {
            pt: 'Estão nos saldos.',
            en: 'The sales are on.',
            when: 'The reason, and in January it is reason enough.',
          },
          {
            pt: 'Depois tomamos um café.',
            en: 'Afterwards we can have a coffee.',
            when: 'What turns an errand into an afternoon.',
          },
        ],
        release: {
          ask: 'Ask somebody to come to Chiado with you.',
          answer: 'Queres vir comigo ao Chiado?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Portugal’s winter sale period runs from early January; saldos signage goes up across Chiado, the Avenida and the shopping centres',
        where: 'the Portuguese retail calendar — the exact opening date is set nationally and is not claimed here',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      SPRING, AND THE 80-DAY HOLE BETWEEN MARCH AND SANTO ANTÓNIO.

      The 25th of April is the one date in the Portuguese year that is not negotiable: the
      revolution, the carnations, Grândola sung on the Avenida da Liberdade. It is a public
      holiday, it is enormous, and it is the only thing in this file where a learner needs
      to understand what they are standing in before they open their mouth.

      Written carefully. A foreigner asking about the 25th of April is asking about the end
      of a dictatorship that people's parents lived through, so the lines are the ones that
      invite somebody to tell you rather than the ones that perform knowledge.
    */
    id: 'lisbon_25_abril',
    chapter: 'lisbon',
    month: 4,
    day: 25,
    event: 'The 25th of April — carnations, and the Avenida full of people',
    /* From late March. It is a public holiday people book around, which is a longer run-up
       than a street party. */
    lead: 32,
    place: { name: 'Avenida da Liberdade', area: 'from Restauradores up' },
    rooms: [
      {
        id: 'rec_abril_cravo',
        chapter: 'lisbon',
        kind: 'place',
        title: 'The carnations',
        why: 'Somebody will hand you one. It is a red carnation and it is the whole symbol of the day.',
        image: {
          src: '/bank/avenida-cravos.jpg',
          alt: 'A crowd filling a tree-lined avenue, red carnations held up on long stems above their heads, red banners further back in the haze.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'O que se celebra hoje?',
            en: 'What is being celebrated today?',
            when: 'Ask it even if you know. It is the best question you will ask all year.',
          },
          {
            pt: 'Porque é que há cravos?',
            en: 'Why are there carnations?',
            when: 'Cravo is a carnation. This is the question with the long answer.',
          },
          {
            pt: 'Pode repetir, mais devagar?',
            en: 'Can you say that again, more slowly?',
            when: 'You will need it, and asking for it is a compliment here.',
          },
        ],
        release: { ask: 'Ask what is being celebrated today.', answer: 'O que se celebra hoje?' },
        rung: 2,
      },
      {
        id: 'rec_abril_desfile',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'Getting onto the Avenida',
        why: 'The middle of the avenue is closed, the metro is heaving, and everybody is walking the same direction.',
        image: {
          src: '/bank/metro-platform.jpg',
          alt: 'A crowd walking away down a tiled metro passage towards the tunnel, all seen from behind.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'A que horas começa?',
            en: 'What time does it start?',
            when: 'The march builds through the afternoon rather than starting sharp.',
          },
          {
            pt: 'Onde é que começa o desfile?',
            en: 'Where does the march start?',
            when: 'Desfile is the march. Down at Restauradores, going up.',
          },
          {
            pt: 'É por aqui?',
            en: 'Is it this way?',
            when: 'The short one, when you only need a yes.',
          },
        ],
        release: { ask: 'Ask what time it starts.', answer: 'A que horas começa?' },
        rung: 2,
      },
      {
        id: 'rec_abril_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking somebody to go with you',
        why: 'The one day of the year where the invitation is also a way of saying you want to understand the place you live in.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Queres ir à Avenida comigo?',
            en: 'Do you want to go to the Avenida with me?',
            when: 'The ask. Everybody knows which avenue you mean.',
          },
          {
            pt: 'É no dia vinte e cinco.',
            en: 'It is on the twenty-fifth.',
            when: 'When they ask when. The same structure the arena drop teaches.',
          },
          {
            pt: 'Explicas-me o que se passou?',
            en: 'Will you explain to me what happened?',
            when: 'The best sentence in this file. It makes them the expert, which they are.',
          },
        ],
        release: {
          ask: 'Ask somebody to go to the Avenida with you.',
          answer: 'Queres ir à Avenida comigo?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'The 25th of April 1974 is Portugal’s Freedom Day, a national public holiday, marked in Lisbon by a march up the Avenida da Liberdade and by red carnations',
        where: 'the Portuguese national calendar',
        checked: '2026-10-03',
      },
    ],
  },
  {
    /*
      HIGH SUMMER, AND THE WORST GAP OF ALL — 149 measured days from late June to mid-
      November with nothing in the tab.

      August in Lisbon is the month the city belongs to the people who live in it: half of
      everybody is away, the restaurants shut for three weeks with a sign on the door, and
      the ones that stay open are empty at nine o'clock. The CLOSED SIGN is the thing worth
      teaching, because it is the only month where "fechado para férias" is the answer to
      everything and a learner who cannot read it walks to four places in a row.

      Pegged to the 1st of August, running the month, which also puts a drop in the tab for
      the whole of July's run-up.
    */
    id: 'lisbon_agosto_fechado',
    chapter: 'lisbon',
    month: 8,
    day: 1,
    until: 31,
    event: 'August — half the city is shut and the other half is yours',
    /* From early July, which is when the signs start going up and when anybody who lives
       here begins working out what will still be open. */
    lead: 30,
    place: { name: 'your own street', area: 'and whichever place is still open on it' },
    /*
      STAYING AND MOVING, strongly. A visitor in August is at the castle and does not care
      that the good tasca is closed for three weeks; somebody who lives here is standing in
      front of its shutter reading a handwritten sign.
    */
    purposes: ['staying', 'moving'],
    rooms: [
      {
        id: 'rec_agosto_ferias',
        chapter: 'lisbon',
        kind: 'place',
        title: 'Closed for the holidays',
        why: 'A sheet of paper taped inside the glass, handwritten, with a date on it. This is the month it is on every third door.',
        image: {
          src: '/bank/fechado-ferias.jpg',
          alt: 'A blank handwritten sign taped inside a shop door behind a half-pulled metal shutter, an empty cobbled street in low August sun beyond it.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Está fechado para férias?',
            en: 'Is it closed for the holidays?',
            when: 'To a neighbour. Fechado para férias is what the sign says.',
          },
          {
            pt: 'Quando é que abre?',
            en: 'When does it open?',
            when: 'The only thing you need. The answer is usually a date in September.',
          },
          {
            pt: 'Há outro aberto por aqui?',
            en: 'Is there another one open round here?',
            when: 'The question that saves the evening.',
          },
        ],
        release: {
          ask: 'Ask whether it is closed for the holidays.',
          answer: 'Está fechado para férias?',
        },
        rung: 2,
      },
      {
        id: 'rec_agosto_esplanada',
        chapter: 'lisbon',
        kind: 'errand',
        title: 'A table outside, at nine, with nobody about',
        why: 'The best three weeks of the year to eat out in Lisbon, because there is nobody in the way.',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Podemos ficar lá fora?',
            en: 'Can we sit outside?',
            when: 'In August the answer is yes and the table is empty.',
          },
          {
            pt: 'Uma imperial, por favor.',
            en: 'A small draught beer, please.',
            when: 'Imperial is the small glass. Never cerveja on its own.',
          },
          {
            pt: 'Está muito calor hoje.',
            en: 'It is very hot today.',
            when: 'The whole of August’s small talk, and it always gets an answer.',
          },
        ],
        release: { ask: 'Ask whether you can sit outside.', answer: 'Podemos ficar lá fora?' },
        rung: 2,
      },
      {
        id: 'rec_agosto_invite',
        chapter: 'lisbon',
        kind: 'moment',
        title: 'Asking who is still around',
        why: 'The August invitation is really a question: are you here, or are you away like everybody else?',
        image: {
          src: '/bank/two-at-a-bar.jpg',
          alt: 'Two people at a small outdoor table with glasses of white wine, turned towards each other, a Lisbon street behind them at dusk.',
          rights_status: 'generated',
        },
        lines: [
          {
            pt: 'Vais de férias este mês?',
            en: 'Are you going away this month?',
            when: 'The August question. Everybody is asked it and everybody asks it.',
          },
          {
            pt: 'Queres beber um copo comigo?',
            en: 'Do you want to have a drink with me?',
            when: 'The ask, once you know they are still here.',
          },
          {
            pt: 'Está tudo aberto na minha rua.',
            en: 'Everything is open on my street.',
            when: 'Rarely true in August, which is what makes it worth saying.',
          },
        ],
        release: {
          ask: 'Ask somebody whether they are going away this month.',
          answer: 'Vais de férias este mês?',
        },
        rung: 3,
      },
    ],
    sources: [
      {
        fact: 'Lisbon empties in August: many small restaurants and shops close for two to three weeks and post a handwritten fechado para férias notice',
        where: 'the habit of the city every August',
        checked: '2026-10-03',
      },
    ],
  },
]

/**
 * A recurring thing, as a Drop, in a given year.
 *
 * The projection that makes this content not expire. Everything downstream — dropLive,
 * dropsFor, the Club, the calendar, the countdown — reads a Drop with an ISO date on it and
 * none of it needs to know the date was computed rather than typed.
 *
 * `kind: 'annual'` is what earns the twenty-one-day window from DROP_LEAD_DAYS, and
 * `genre: 'annual'` is what makes it show in the right colour on the two-week view and
 * survive a subscription filter. Both already existed; neither had any content.
 */
export function dropForYear(r: Recurring, year: number): Drop {
  const iso = (d: number) =>
    year + '-' + String(r.month).padStart(2, '0') + '-' + String(d).padStart(2, '0')
  return {
    id: r.id + '_' + year,
    chapter: r.chapter,
    event: r.event,
    place: r.place,
    /* The LAST day is what the drop is pegged to, so a thing that runs for a fortnight is
       live throughout rather than vanishing the morning after it starts. */
    on: iso(r.until ?? r.day),
    kind: 'annual',
    genre: 'annual',
    purposes: r.purposes,
    /*
      The run-up starts from the FIRST day, not the last.

      Without this, a range gets its twenty-one days counted back from the end — so the
      Christmas lights, pegged to the 31st, would open on the 10th and a learner would be
      shown them a fortnight late. DROP_LEAD_DAYS still sets the length; this only fixes
      which end it is measured from.
    */
    from: (() => {
      const first = new Date(iso(r.day) + 'T00:00:00Z')
      first.setUTCDate(first.getUTCDate() - (r.lead ?? DROP_LEAD_DAYS.annual))
      return first.toISOString().slice(0, 10)
    })(),
    /*
      THE YEAR GOES IN THE MIDDLE, NOT ON THE END, and that is load-bearing rather than
      cosmetic.

      Each year's rooms need distinct ids — two Santo Antónios in the pool at once would
      otherwise collide in roomById and in the collection. But `components/Errand.tsx:170`
      decides whether a room is THE INVITATION with /(^|_)invite$/, and drop-check asserts
      the same pattern so the two cannot drift. Appending the year gave
      `rec_santo_invite_2027`, which fails that test — so every recurring drop silently
      lost its shareable invite card, which is the single thing a drop is for. Measured as
      "12 of 13 nights can be offered to somebody" by `npm run drops`, which is exactly the
      check doing its job.

      `rec_santo_2027_invite` keeps the suffix the product matches on and still gives each
      year its own id.
    */
    situations: r.rooms.map((s) => ({
      ...s,
      id: s.id.replace(/^(rec_[a-z]+)_/, '$1_' + year + '_'),
    })),
    sources: r.sources,
    /*
      NO review_by AT ALL, and this is the only content in the product that should not have
      one — which is why the field became optional rather than being filled with a sentinel.

      Everywhere else a review date is the promise that silence beats a lie: a gig nobody has
      re-checked hides itself rather than sending somebody to a cancelled show. There is
      nothing here to go stale. Santo António will not be cancelled, and if the Portuguese
      needs fixing it needs fixing in every year at once, which is an edit to this file
      rather than an expiry on a date.
    */
  }
}

/**
 * Every recurring drop that could be live around a date — this year's and next year's.
 *
 * Both years, because the window straddles New Year: on the 20th of December the Christmas
 * lights of THIS year are live, and on the 20th of May the Santo António of this year is
 * three weeks out, but on the 20th of December somebody should also not be shown anything
 * from the previous January. Generating both and letting `dropLive` decide is simpler than
 * reasoning about it here, and it is the same filter every other drop goes through.
 */
export function recurringDrops(chapter: ChapterId, now: Date = new Date()): Drop[] {
  const y = now.getUTCFullYear()
  return RECURRING.filter((r) => r.chapter === chapter).flatMap((r) => [
    dropForYear(r, y),
    dropForYear(r, y + 1),
  ])
}

/**
 * The next thing the year does, whether or not it is open yet.
 *
 * THIS IS WHAT AN EMPTY TAB SAYS INSTEAD OF SORRY. Even with eight recurring entries there
 * are about sixty-five days in four hundred where nothing is inside its window — short,
 * genuinely quiet stretches, and padding the file to paper over them would mean inventing
 * occasions Lisbon does not have. What those days CAN always have is the truth: the next
 * real thing, named, with its date. "Nothing is open yet — the next one is the 25th of
 * April" is a product that knows what it is talking about. "Nothing live right now" is a
 * product apologising.
 *
 * Never null for a chapter with any recurring content, because it looks into next year as
 * well as this one.
 */
export function nextRecurring(chapter: ChapterId, now: Date = new Date()): Drop | null {
  const today = now.toISOString().slice(0, 10)
  return (
    recurringDrops(chapter, now)
      .filter((d) => d.on >= today)
      .sort((a, b) => a.on.localeCompare(b.on))[0] ?? null
  )
}

/** Every room in every recurring drop, for both years, so the product can resolve one by id. */
export function recurringSituations(chapter: ChapterId, now: Date = new Date()): Situation[] {
  return recurringDrops(chapter, now).flatMap((d) => d.situations)
}

/*
  WHAT IS DELIBERATELY NOT IN THIS FILE, and belongs in Sam's report rather than here.

  CARNAVAL moves with Easter and I am not going to compute it from a paschal algorithm to
  save one row; it also matters far more in Torres Vedras and Loulé than in Lisbon.

  NEW YEAR'S EVE in Praça do Comércio is real and annual, and the language for it is almost
  entirely the Christmas-lights language with a different noun — so it would be a fourth
  drop teaching nothing new. Worth adding when there is something distinct to say.

  THE SAINTS' NIGHTS OTHER THAN ANTÓNIO — São João on the 23rd of June and São Pedro on the
  28th — are Porto's and Lisbon's second-tier respectively. They belong in a Porto chapter,
  which does not exist yet.

  A MATCH DAY was in the brief and is NOT here, deliberately. "Benfica are at home on a
  Saturday" is true most Saturdays and specifically false on the one somebody opens the app,
  and the `match` template already covers a real fixture the moment a harvested row carries
  one. A recurring drop for it would be inventing a fixture, which is the one thing this
  file must not do.

  IMI, THE SECOND INSTALMENT — the most `moving`-only thing in the Lisbon year, named in the
  October calendar file's own header as belonging to November. It is a `deadline`, there is
  no deadline template, and the date is set by Finanças rather than by the year. It is the
  top item in the report.
*/
