/**
 * Lisbon · visiting · block 2 — the gaps.
 *
 * WHAT BLOCK 1 LEFT OUT, which is everything that happens before and around the nice parts.
 * Block 1 is the holiday a visitor imagines: a table, a fado house, the train to Sintra.
 * This is the holiday they actually have — landing tired at Humberto Delgado, a door code
 * that does not work at eleven at night, needing a toilet in the Baixa, a phone with no
 * data, a wallet that was there before the 28 and is not there after it.
 *
 * So the order of the file is the order of a trip: arrive, check in, the body, the phone,
 * the two bad days, then the ordinary days — the supermarket, the beach, a tasca, cash.
 *
 * WHY THE TWO BAD DAYS ARE HERE AT ALL. An emergency and a theft are not what anybody opens
 * a language app for, and they are the two rooms where English most reliably runs out: a
 * crowd at a bus stop, a PSP desk on a Sunday. Both are written short and blunt, like the
 * allergy room in block 1, because they have to survive being said badly by somebody who is
 * frightened. They are the only two here with no purpose tag: a mover is robbed on the 28
 * exactly as often as a visitor, and a pharmacy does not care why you are in the country.
 *
 * THE TWO I CHOSE, and why they are not already somewhere else.
 *
 *   lisbon_tasca — ordering where there is no menu. A café counter, a bread queue and a
 *   table for two are already rooms, but none of them is the room where the menu is the
 *   man's memory and the whole meal turns on two questions: what is the dish of the day,
 *   and can I have half. It is also where Lisbon is cheapest and least in English.
 *
 *   lisbon_multibanco — cash, and the card that did not go through. Block 1 asks "can we
 *   pay by card" at the end of a meal; nothing covers the moment the answer is no, or the
 *   card is declined, and you need a machine and change for a twenty. It is the commonest
 *   small humiliation on a Lisbon holiday and it is four sentences long.
 *
 * FACTS ARE KEPT TO THE STABLE ONES. Station names, which line meets which, that bags cost
 * money at the till, that 112 is 112. No prices, no opening hours, no fares — those rot
 * fastest and a wrong number said to a stranger is worse than none. Everything carries a
 * review_by, and the airport, the phone shop and the two bad days carry an earlier one,
 * because they are the rooms most made of procedure.
 *
 * NO IMAGES, like block 1: the VISITING brief in content/images.ts is the one look these
 * would share, and a room with no image renders on the sand ground and reads perfectly well.
 * Nothing here is pointed at a file that does not exist.
 *
 * WORDS. Every room hands two or three pieces to the library (see Situation.pieces). Where
 * a root or another room already teaches the word, the id is named rather than authored
 * twice — `cartao` is authored once, in the phone shop, and the airport merely reuses it.
 *
 * NOT REVIEWED. Written by me and marked `qa_status: 'pending-native-review'` on every room.
 * The register is formal throughout — o senhor, a senhora, pode…? — because every person in
 * this file is a stranger, and that wants a pt-PT reader before anybody says it to one.
 */
import type { Situation } from '@/content/situations'

export const LISBON_VISITING_2: Situation[] = [
  {
    /*
      The first room of the trip, and the one with the least patience in it.

      Everybody in arrivals is tired and everybody behind you at the machine knows how it
      works. The lines are weighted to the two places a newcomer actually stalls: the card
      the metro runs on, and the change of line, because the red line goes almost nowhere a
      visitor is staying without one.
    */
    id: 'lisbon_aeroporto',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'Getting out of the airport',
    why: 'You have landed, you are tired, and there is a metro, a bus and a taxi rank, and a machine that wants a decision.',
    where: { name: 'Aeroporto Humberto Delgado', area: 'Arrivals' },
    lines: [
      {
        pt: 'Desculpe, onde é o metro?',
        en: 'Excuse me, where is the metro?',
        when: 'The red line starts at the airport. Onde é works for anything that stays put.',
      },
      {
        pt: 'Queria um cartão Viva Viagem, por favor.',
        en: 'I would like a Viva Viagem card, please.',
        when: 'The reusable card the metro runs on. You buy the card once and load journeys onto it.',
      },
      {
        pt: 'Como é que carrego o cartão?',
        en: 'How do I top up the card?',
        when: 'Carregar is to load or top up — the same word as pressing a button. Ask it at the window or of whoever is next to you.',
      },
      {
        pt: 'Onde é que mudo para a linha verde?',
        en: 'Where do I change for the green line?',
        when: 'The red line meets the other three: green at Alameda, yellow at Saldanha, blue at São Sebastião.',
      },
      {
        pt: 'Onde é a paragem do Aerobus?',
        en: 'Where is the Aerobus stop?',
        when: 'If you would rather not change trains with a suitcase. Paragem is a bus stop; a train stops at an estação.',
      },
      {
        pt: 'Mais ou menos, quanto custa um táxi até à Baixa?',
        en: 'Roughly how much is a taxi to the Baixa?',
        when: 'At the rank, before you get in. Not to haggle — to know the number on the meter is sane.',
      },
      {
        pt: 'Pode mostrar-me, por favor?',
        en: 'Could you show me, please?',
        when: 'The repair, at the machine. Being shown beats being told, and nobody minds doing it.',
      },
    ],
    release: { ask: 'Excuse me, where is the metro?', answer: 'Desculpe, onde é o metro?' },
    pieces: [
      {
        id: 'linha',
        target: 'linha',
        gloss: 'line',
        shelf: 'things',
        gender: 'f',
        note: 'On the metro a line goes by its colour — a linha vermelha. At a train station a linha is the platform.',
      },
      {
        id: 'paragem',
        target: 'paragem',
        gloss: 'stop',
        shelf: 'things',
        gender: 'f',
        plural: 'paragens',
        note: 'Where a bus or a tram stops. A train stops at an estação.',
      },
      'cartao',
    ],
    rung: 2,
    review_by: '2027-05-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      Two rooms in one, because a visitor is in one or the other and never both.

      The hotel half is a desk and a person; the Airbnb half is a key box and a message to
      somebody who is not there. The last line is written for the second — the same sentence
      works said at a desk or typed at eleven at night, which is when it is needed.
    */
    id: 'lisbon_checkin',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['visiting'],
    title: 'Checking in',
    why: 'A reservation in your name, a wifi password, a key, and the two times you need to know before you sleep.',
    where: { name: 'a hotel desk, or a key box by a door', area: 'wherever you are staying' },
    lines: [
      {
        pt: 'Boa tarde. Tenho uma reserva para duas noites.',
        en: 'Good afternoon. I have a reservation for two nights.',
        when: 'The opening, and it answers their first question before they ask it.',
      },
      {
        pt: 'Está em nome de Smith.',
        en: 'It is under the name Smith.',
        when: 'Swap in your surname, and have it on the phone screen as well. Names are where this goes wrong.',
      },
      {
        pt: 'Qual é a palavra-passe do wi-fi?',
        en: 'What is the wifi password?',
        when: 'Palavra-passe is the Portuguese; a password is understood too. Wi-fi is said the English way.',
      },
      {
        pt: 'A que horas é o pequeno-almoço?',
        en: 'What time is breakfast?',
        when: 'Pequeno-almoço, the little lunch. Café da manhã is Brazilian and will be understood, but it marks you.',
      },
      {
        pt: 'Até que horas temos de deixar o quarto?',
        en: 'By what time do we have to leave the room?',
        when: 'Check-out, asked as a sentence. They may answer with the English word anyway.',
      },
      {
        pt: 'Podemos deixar as malas aqui até à tarde?',
        en: 'Can we leave our bags here until the afternoon?',
        when: 'On the last morning, when the flight is late and the room is not yours any more.',
      },
      {
        pt: 'O código da porta não está a funcionar.',
        en: 'The door code is not working.',
        when: 'The Airbnb half of the room. Estar a + verb is how Portugal says is …ing — never "está funcionando".',
      },
    ],
    release: {
      ask: 'I have a reservation for two nights.',
      answer: 'Tenho uma reserva para duas noites.',
    },
    pieces: [
      {
        id: 'reserva',
        target: 'reserva',
        gloss: 'reservation',
        shelf: 'things',
        gender: 'f',
        note: 'Ter uma reserva, to have a booking; fazer uma reserva, to make one. A table, a room, a ticket.',
      },
      {
        id: 'pequeno_almoco',
        target: 'o pequeno-almoço',
        gloss: 'breakfast',
        shelf: 'things',
        gender: 'm',
        countable: false,
        note: 'The Portuguese word. Café da manhã is Brazilian.',
      },
      {
        id: 'chave',
        target: 'a chave',
        gloss: 'key',
        shelf: 'things',
        gender: 'f',
        set: 'around_the_house',
      },
    ],
    rung: 2,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      The room every phrasebook is too polite to write, and the one everybody needs by day two.

      Lisbon has few public toilets and a great many cafés, and the arrangement between the
      two is understood rather than posted: you buy something small, and then you ask. The
      fourth line is the etiquette, and it is the line that makes the rest of the room work.
    */
    id: 'lisbon_casa_de_banho',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'Finding a toilet',
    why: 'There are not many public ones, there are a great many cafés, and there is a polite way to use the second as the first.',
    where: { name: 'any café', area: 'the Baixa, and everywhere else' },
    lines: [
      {
        pt: 'Desculpe, onde é a casa de banho?',
        en: 'Excuse me, where is the toilet?',
        when: 'Casa de banho, never banheiro — that is Brazil. On the door it says WC, or Senhoras and Homens.',
      },
      {
        pt: 'Posso usar a casa de banho?',
        en: 'May I use the toilet?',
        when: 'Asked at the counter, not by walking past it.',
      },
      {
        pt: 'É só para clientes?',
        en: 'Is it only for customers?',
        when: 'Often it is, and asking first is what makes the answer kind either way.',
      },
      {
        pt: 'Então, um café, por favor.',
        en: 'An espresso then, please.',
        when: 'The custom. Buy something small and the toilet comes with it — a café is the price and nobody minds.',
      },
      {
        pt: 'É preciso pedir a chave?',
        en: 'Do I need to ask for the key?',
        when: 'Some keep it behind the counter, and some print a code on the receipt.',
      },
      {
        pt: 'Desculpe, não há papel.',
        en: 'Sorry, there is no paper.',
        when: 'Said quietly at the counter on the way out. It is a favour to the next person.',
      },
    ],
    release: {
      ask: 'Excuse me, where is the toilet?',
      answer: 'Desculpe, onde é a casa de banho?',
    },
    pieces: [
      {
        id: 'casa_de_banho',
        target: 'casa de banho',
        gloss: 'toilet',
        shelf: 'things',
        gender: 'f',
        plural: 'casas de banho',
        note: 'The word in Portugal, in a café or in a house — it is also the bathroom. Banheiro is Brazilian.',
      },
      {
        id: 'cliente',
        target: 'cliente',
        gloss: 'customer',
        shelf: 'things',
        gender: 'm',
        note: 'O cliente, a cliente: one word, and the article says which.',
      },
      'desculpe',
    ],
    rung: 2,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      A shop counter with a queue and a form, which makes it the most mover-like room a
      visitor will stand in. The plans change every season, so nothing here names one or
      prices one — the lines are the questions, which do not change.
    */
    id: 'lisbon_cartao_sim',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['visiting'],
    title: 'A SIM card for the trip',
    why: 'Your phone has no data, the shop assistant has a script, and you want the plan without the upsell.',
    where: { name: 'a MEO, NOS or Vodafone shop', area: 'any shopping centre' },
    lines: [
      {
        pt: 'Boa tarde. Queria um cartão SIM pré-pago.',
        en: 'Good afternoon. I would like a prepaid SIM card.',
        when: 'Pré-pago is the word that keeps you out of a contract.',
      },
      {
        pt: 'Tem tarifários para turistas?',
        en: 'Do you have plans for tourists?',
        when: 'Tarifário is a phone plan. Most networks have one aimed at visitors, and it is rarely the one on the poster.',
      },
      {
        pt: 'Quantos gigas tem?',
        en: 'How many gigs does it have?',
        when: 'Gigas is what people say. Dados, data, is the proper word and you will hear both.',
      },
      {
        pt: 'Também têm eSIM?',
        en: 'Do you do eSIM as well?',
        when: 'Têm, plural: you are asking the shop, not the person.',
      },
      {
        pt: 'Precisa do meu passaporte?',
        en: 'Do you need my passport?',
        when: 'Have it on you. Asking first saves the second trip.',
      },
      {
        pt: 'Pode ajudar-me a ativar?',
        en: 'Could you help me activate it?',
        when: 'Before you leave the counter, not after. The settings menu will be in English and the texts will not.',
      },
    ],
    release: {
      ask: 'I would like a prepaid SIM card.',
      answer: 'Queria um cartão SIM pré-pago.',
    },
    pieces: [
      {
        id: 'cartao',
        target: 'cartão',
        gloss: 'card',
        shelf: 'things',
        gender: 'm',
        plural: 'cartões',
        note: 'Any card: a bank card, a SIM, a loyalty card, the metro one. Pagar com cartão, to pay by card.',
      },
      {
        id: 'dados',
        target: 'os dados',
        gloss: 'data',
        shelf: 'things',
        gender: 'm',
        note: 'Mobile data. The amount is said in gigas.',
      },
      'queria',
    ],
    rung: 3,
    review_by: '2027-05-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      THE ROOM THAT HAS TO WORK ON THE WORST DAY OF THE TRIP.

      Untagged: an emergency does not care why you are here. Short, loud, and imperative,
      because the one moment politeness costs something is this one — `chame` is a command,
      and it is the right register for a stranger when somebody is on the ground. The second
      half is for the far commoner case, where it is not an emergency at all and the answer
      is a pharmacy or a phone line rather than a hospital.
    */
    id: 'lisbon_emergencia',
    chapter: 'lisbon',
    kind: 'moment',
    title: 'When something is badly wrong',
    why: 'Somebody is hurt, or you are, and the people around you are about to start speaking very fast.',
    lines: [
      {
        pt: 'Socorro! Preciso de ajuda!',
        en: 'Help! I need help!',
        when: 'Shouted. Socorro is the word for an emergency; ajuda is the word for everything else.',
      },
      {
        pt: 'Chame uma ambulância, por favor!',
        en: 'Call an ambulance, please!',
        when: 'To one person, looking at them. Chame is the formal command and it is not rude here.',
      },
      {
        pt: 'Liguem para o 112!',
        en: 'Call 112!',
        when: 'To everybody around — liguem is plural. Said um, um, dois. It is the European number and works from any phone.',
      },
      {
        pt: 'Onde fica a urgência mais próxima?',
        en: 'Where is the nearest A&E?',
        when: 'A urgência is the emergency department. Santa Maria and São José are the big public hospitals in the city.',
      },
      {
        pt: 'Tenho seguro de viagem.',
        en: 'I have travel insurance.',
        when: 'At the desk, with the card or the policy number in your hand.',
      },
      {
        pt: 'Não é urgente. Há uma farmácia de serviço?',
        en: 'It is not urgent. Is there a duty pharmacy?',
        when: 'For what can wait. Every pharmacy door lists which one is open tonight, and the SNS 24 line, 808 24 24 24, answers and tells you where to go.',
      },
      {
        pt: 'Posso ir a um centro de saúde?',
        en: 'Can I go to a health centre?',
        when: 'The centro de saúde is the local GP. For a visitor with something that can wait, SNS 24 or a pharmacist is usually the quicker way in.',
      },
    ],
    release: {
      ask: 'Call an ambulance, please!',
      answer: 'Chame uma ambulância, por favor!',
    },
    pieces: [
      {
        id: 'ambulancia',
        target: 'ambulância',
        gloss: 'ambulance',
        shelf: 'things',
        gender: 'f',
      },
      {
        id: 'urgencia',
        target: 'a urgência',
        gloss: 'emergency department',
        shelf: 'things',
        gender: 'f',
        note: 'The A&E of a hospital: ir à urgência. Urgente is the adjective — não é urgente, it can wait.',
      },
      'ajuda',
    ],
    rung: 2,
    review_by: '2027-05-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      The 28 is beautiful, packed, and worked by pickpockets, and every guidebook says so.
      What none of them gives you is the sentence for afterwards.

      Untagged, like the emergency: a theft does not ask how long you are staying. The first
      line is built on the impersonal plural — roubaram-me, "they stole from me" — because it
      is how Portuguese reports a theft, and it means you never have to know who.
    */
    id: 'lisbon_roubo',
    chapter: 'lisbon',
    kind: 'errand',
    title: 'Something has been stolen',
    why: 'It was there before the tram and it is not there now, and the report has to be made in Portuguese for the insurance to want it.',
    where: { name: 'a PSP station', area: 'Restauradores, or the nearest esquadra' },
    lines: [
      {
        pt: 'Roubaram-me a carteira.',
        en: 'My wallet has been stolen.',
        when: 'The whole report in three words. Roubaram-me: they stole from me, whoever they were.',
      },
      {
        pt: 'Roubaram-me o telemóvel.',
        en: 'My phone has been stolen.',
        when: 'Telemóvel, never celular — that is Brazil.',
      },
      {
        pt: 'Foi no elétrico 28, há meia hora.',
        en: 'It was on the 28 tram, half an hour ago.',
        when: 'Where and when, which is what they will ask first. Há meia hora: half an hour ago.',
      },
      {
        pt: 'Onde é a esquadra mais próxima?',
        en: 'Where is the nearest police station?',
        when: 'The PSP is the city police. There is a station meant for visitors at Restauradores, in the Palácio Foz.',
      },
      {
        pt: 'Quero apresentar queixa.',
        en: 'I want to report it.',
        when: 'Apresentar queixa, to file a complaint — the phrase for making it official.',
      },
      {
        pt: 'Preciso de uma cópia para o seguro.',
        en: 'I need a copy for the insurance.',
        when: 'The reason you came. Ask before you leave the desk.',
      },
      {
        pt: 'Desculpe, pode falar mais devagar?',
        en: 'Sorry, could you speak more slowly?',
        when: 'The repair. Nobody at that desk is in a hurry, even if it sounds like it.',
      },
    ],
    release: { ask: 'My wallet has been stolen.', answer: 'Roubaram-me a carteira.' },
    pieces: [
      {
        id: 'roubaram_me',
        target: 'roubaram-me',
        gloss: 'they stole my',
        shelf: 'doing',
        lemma: 'roubar',
        form: 'they',
        note: 'The past, with me attached: roubaram-me a carteira, my wallet was stolen. How a theft is reported — nobody needs to know who.',
      },
      {
        id: 'carteira',
        target: 'carteira',
        gloss: 'wallet',
        shelf: 'things',
        gender: 'f',
      },
      {
        id: 'esquadra',
        target: 'esquadra',
        gloss: 'police station',
        shelf: 'things',
        gender: 'f',
        note: 'A PSP station in a city. A polícia is the police themselves.',
      },
    ],
    rung: 3,
    review_by: '2027-05-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      Self-service, until it is not.

      A supermarket looks like the one place a visitor needs no Portuguese, and then the till
      asks four questions in five seconds — a bag, a card, a tax number, a receipt. Every
      line here is an ANSWER, because that is the shape of the room: you are not the one
      asking. The tax-number line is the one that panics people, and the answer is "não".
    */
    id: 'lisbon_supermercado',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'At the supermarket till',
    why: 'You picked it all up without saying a word, and then the till asks you four questions in five seconds.',
    where: { name: 'Pingo Doce, Continente, any supermarket', area: 'everywhere' },
    lines: [
      {
        pt: 'Não, obrigado, não preciso de saco.',
        f: 'Não, obrigada, não preciso de saco.',
        en: 'No thanks, I do not need a bag.',
        when: 'They will ask "Quer saco?". Bags are paid for, so it is a real question. Obrigada if you are a woman.',
      },
      {
        pt: 'Tenho de pesar a fruta?',
        en: 'Do I have to weigh the fruit?',
        when: 'In many, fruit and veg are weighed on a scale in the aisle that prints a sticker. Ask before the queue, not at the front of it.',
      },
      {
        pt: 'Pode ser com cartão?',
        en: 'Can I pay by card?',
        when: 'Pode ser is the easy way to ask if something is all right.',
      },
      {
        pt: 'Contribuinte? — Não, obrigado.',
        f: 'Contribuinte? — Não, obrigada.',
        en: 'Tax number? — No, thank you.',
        when: 'They are asking for a NIF to put on the receipt. A visitor does not have one, and não is the whole answer.',
      },
      {
        pt: 'Não tenho cartão.',
        en: 'I do not have the card.',
        when: 'The loyalty-card question, which both big chains ask. It is not a problem.',
      },
      {
        pt: 'Sim, quero o talão, por favor.',
        en: 'Yes, I would like the receipt, please.',
        when: 'When they ask "Quer o talão?". Talão is the receipt.',
      },
    ],
    release: {
      ask: 'No thanks, I do not need a bag.',
      answer: 'Não, obrigado, não preciso de saco.',
      answer_f: 'Não, obrigada, não preciso de saco.',
    },
    pieces: [
      {
        id: 'saco',
        target: 'saco',
        gloss: 'bag',
        shelf: 'things',
        gender: 'm',
      },
      {
        id: 'talao',
        target: 'talão',
        gloss: 'receipt',
        shelf: 'things',
        gender: 'm',
        plural: 'talões',
        note: 'At a till. In a restaurant the bill is a conta, and an official receipt is a fatura.',
      },
      {
        id: 'contribuinte',
        target: 'contribuinte',
        gloss: 'tax number',
        shelf: 'things',
        gender: 'm',
        note: 'Short for número de contribuinte, which is the NIF. Asked at every till; a visitor says não.',
      },
    ],
    rung: 2,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      The train along the river, and the afternoon at the end of it.

      Not the ticket — the summer drop already teaches buying one at Cais do Sodré, and the
      water being cold. This is the rest: which train stops where you want, the flag, the
      stranger on the next towel, and the last train back, which is the one line in this
      room that has ever really mattered.
    */
    id: 'lisbon_praia',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'The train to the beach',
    why: 'Forty minutes along the river to the sea, a beach full of people who know the rules, and a last train you do not want to miss.',
    where: { name: 'Linha de Cascais, from Cais do Sodré', area: 'Carcavelos, Estoril, Cascais' },
    lines: [
      {
        pt: 'Este comboio para em Carcavelos?',
        en: 'Does this train stop at Carcavelos?',
        when: 'Not every train stops everywhere on the line. Para here is it stops — the same spelling as for, and context does the rest.',
      },
      {
        pt: 'Ainda falta muito para Cascais?',
        en: 'Is it much further to Cascais?',
        when: 'To whoever is opposite. Falta, literally what is missing — how far is left.',
      },
      {
        pt: 'Hoje pode-se tomar banho?',
        en: 'Is it all right to swim today?',
        when: 'Tomar banho at the beach is going in the sea. Where there are lifeguards a flag says it: green yes, yellow careful, red no.',
      },
      {
        pt: 'Pode tomar conta das minhas coisas um minuto?',
        en: 'Could you keep an eye on my things for a minute?',
        when: 'To the next towel along. The commonest favour on any beach, and almost always a yes.',
      },
      {
        pt: 'Onde se aluga um chapéu de sol?',
        en: 'Where can you rent a beach umbrella?',
        when: 'Onde se aluga: where does one rent. The se form is how you ask about a place rather than a person.',
      },
      {
        pt: 'A que horas é o último comboio para Lisboa?',
        en: 'What time is the last train back to Lisbon?',
        when: 'Ask in the afternoon, not at the station at midnight.',
      },
    ],
    release: {
      ask: 'Does this train stop at Carcavelos?',
      answer: 'Este comboio para em Carcavelos?',
    },
    pieces: [
      {
        id: 'tomar_banho',
        target: 'tomar banho',
        gloss: 'to go in the water',
        shelf: 'doing',
        note: 'At the beach, a swim. At home, a shower or a bath. The same two words.',
      },
      {
        id: 'ultimo',
        target: 'último',
        gloss: 'last',
        shelf: 'describing',
        note: 'Última with a feminine noun: a última paragem, the last stop.',
      },
      'comboio',
    ],
    rung: 3,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      Where the menu is a sheet of paper, or the man's memory.

      A tasca is the cheapest good meal in Lisbon and the least likely to be had in English,
      and the whole of it turns on two questions: what is today, and can I have half. Meia
      dose is the line nobody expects and everybody uses — a full dose is often enough for two.
    */
    id: 'lisbon_tasca',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'A tasca with no menu',
    why: 'Paper tablecloths, a handwritten list or none at all, and a man who will tell you what there is, once, quickly.',
    where: { name: 'a tasca', area: 'Alfama, Mouraria, Campo de Ourique' },
    lines: [
      {
        pt: 'Boa tarde. Qual é o prato do dia?',
        en: 'Good afternoon. What is the dish of the day?',
        when: 'The first question at lunch. The dish of the day is the one the kitchen is proud of and the cheapest thing on offer.',
      },
      {
        pt: 'O que é que recomenda?',
        en: 'What do you recommend?',
        when: 'Recomenda, the formal you. People are glad to be asked and the answer is usually the fish.',
      },
      {
        pt: 'Uma meia dose, por favor.',
        en: 'A half portion, please.',
        when: 'Many tascas do a half portion, and a full one is often enough for two.',
      },
      {
        pt: 'Meio jarro de vinho da casa, tinto.',
        en: 'Half a jug of the house red.',
        when: 'Or branco, white. The house wine comes in a jug and nobody here will think less of you for it.',
      },
      {
        pt: 'Desculpe, pode dizer outra vez, mais devagar?',
        en: 'Sorry, could you say that again, more slowly?',
        when: 'The repair. The dishes are said once, at speed, and asking again is entirely normal.',
      },
      {
        pt: 'Estava tudo ótimo, obrigado.',
        f: 'Estava tudo ótimo, obrigada.',
        en: 'It was all great, thank you.',
        when: 'On the way out, to whoever cooked if you can see them.',
      },
    ],
    release: { ask: 'What is the dish of the day?', answer: 'Qual é o prato do dia?' },
    pieces: [
      {
        id: 'prato_do_dia',
        target: 'o prato do dia',
        gloss: 'dish of the day',
        shelf: 'things',
        gender: 'm',
      },
      {
        id: 'meia_dose',
        target: 'meia dose',
        gloss: 'half portion',
        shelf: 'things',
        gender: 'f',
        plural: 'meias doses',
        note: 'Uma dose is a full plate. Meia, because dose is feminine.',
      },
      'qual_e',
    ],
    rung: 2,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
  {
    /*
      The moment "can we pay by card?" gets a no.

      Block 1 asks the question; nothing covered the answer. Small places are still cash,
      cards are declined abroad more often than at home, and the machine you find first is
      not always the one you want. Four sentences, and the day carries on.
    */
    id: 'lisbon_multibanco',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['visiting'],
    title: 'Cash, and the card that did not work',
    why: 'The card was declined, the place is cash only, and you need a machine and change for a twenty.',
    lines: [
      {
        pt: 'Desculpe, há um multibanco aqui perto?',
        en: 'Excuse me, is there a cash machine near here?',
        when: 'Multibanco is the network on Portuguese bank machines, and the machine itself. The free-standing ones on tourist streets are often a different company, and that is where the fees are.',
      },
      {
        pt: 'Só aceitam dinheiro?',
        en: 'Is it cash only?',
        when: 'Aceitam, plural: you are asking about the place. Ask before you order, not after.',
      },
      {
        pt: 'O cartão não passou.',
        en: 'The card did not go through.',
        when: 'What you will be told, and what you can say back when you have understood it.',
      },
      {
        pt: 'Pode tentar outra vez, por favor?',
        en: 'Could you try again, please?',
        when: 'Usually works the second time. If it does not, the next line is the way out.',
      },
      {
        pt: 'Então pago em dinheiro.',
        en: 'I will pay cash, then.',
        when: 'Em dinheiro, in cash. Said as a decision, not an apology.',
      },
      {
        pt: 'Tem troco para vinte euros?',
        en: 'Do you have change for twenty euros?',
        when: 'Small places mean it when they say they do not. Ask before you hand it over.',
      },
    ],
    release: {
      ask: 'Excuse me, is there a cash machine near here?',
      answer: 'Desculpe, há um multibanco aqui perto?',
    },
    pieces: [
      {
        id: 'multibanco',
        target: 'multibanco',
        gloss: 'cash machine',
        shelf: 'things',
        gender: 'm',
        note: 'The network on Portuguese bank machines, and the machine. Pagar com multibanco is paying by card.',
      },
      {
        id: 'troco',
        target: 'troco',
        gloss: 'change',
        shelf: 'things',
        gender: 'm',
        countable: false,
        note: 'The coins you get back. Tem troco? — do you have change?',
      },
      {
        id: 'dinheiro',
        target: 'dinheiro',
        gloss: 'money',
        shelf: 'things',
        gender: 'm',
        countable: false,
        note: 'Money in general; em dinheiro is in cash.',
      },
    ],
    rung: 2,
    review_by: '2027-09-01',
    qa_status: 'pending-native-review',
  },
]
