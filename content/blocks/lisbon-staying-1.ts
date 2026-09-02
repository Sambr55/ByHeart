/**
 * Lisbon · staying · block 1 — a season.
 *
 * Three months to a year. Long enough that the paperwork is somebody else's problem — a
 * season does not need a NIF, a lease or a school place — and long enough that pointing
 * stops working, because you are going to see these people again.
 *
 * WHAT MAKES A SEASON ITS OWN THING, rather than a long holiday or a short move. It is the
 * only one of the three where the SAME PERSON is on the other side of the counter twice.
 * A visitor's exchanges are all first meetings and all last meetings; a mover eventually
 * has a life. In between there is a stretch where you are becoming a regular somewhere and
 * have not got there yet, and that is what this block is about.
 *
 * So the rooms are picked for repetition rather than for difficulty:
 *
 *   The café where they start to know you. "O costume" is four syllables and it is the
 *   entire membership test — you cannot say it on day one and there is no ceremony on the
 *   day you can.
 *
 *   The neighbour on the stairs. Boa tarde said every single time, to everybody, is not
 *   politeness in a Portuguese building, it is the rent. Skipping it is the loudest thing a
 *   foreigner does.
 *
 *   The launderette, the barber, the parcel point, the counter. Small, repeated, and each
 *   one a person who will recognise you next week.
 *
 * AND ONE TRAP WORTH THE ROOM IT TAKES. Fidelização — the lock-in on a gym or a phone
 * contract — is the single most expensive word a seasonal resident does not know. Twelve
 * months signed for a three-month stay, and it is not hidden, it is just asked about in
 * Portuguese and answered in Portuguese.
 *
 * WHAT IS NOT HERE. The Junta and the phone contract are already tagged for staying, and
 * the pharmacy, café, bread queue and the 28 are standing rooms for everybody. Repeating
 * them would count twice and teach once.
 *
 * NOT REVIEWED. Written by me; the register and the fixed phrases want a pt-PT reader
 * before anybody says them to a stranger.
 */
import type { Situation } from '@/content/situations'

export const LISBON_STAYING_1: Situation[] = [
  {
    /*
      First in the block because it is first in the stay, and because it is the cheapest
      thing on this list to get wrong for months without noticing.

      A Portuguese building greets. Every landing, every lift, every time — and the person
      who does not is not read as shy, they are read as the foreigner who does not say
      hello. It costs two words and there is no way to earn it back later.
    */
    id: 'lisbon_vizinho',
    chapter: 'lisbon',
    kind: 'person',
    purposes: ['staying', 'moving'],
    title: 'The neighbour on the stairs',
    why: 'Two words, said every single time, and the whole difference between living here and staying here.',
    lines: [
      {
        pt: 'Boa tarde.',
        en: 'Good afternoon.',
        when: 'Every landing, every lift, everybody. Not optional and not once — every time.',
      },
      {
        pt: 'Bom dia, sou o novo vizinho do terceiro.',
        en: 'Good morning, I am the new neighbour from the third floor.',
        when: 'Once, early. Vizinha if you are a woman. It buys you a year of goodwill.',
      },
      {
        pt: 'Desculpe o barulho de ontem.',
        en: 'Sorry about the noise yesterday.',
        when: 'Before they mention it, not after. Said first it is manners; said second it is a dispute.',
      },
      {
        pt: 'Recebeu uma encomenda para mim?',
        en: 'Did you take in a parcel for me?',
        when: 'They probably did. This is how buildings work here.',
      },
      {
        pt: 'Se precisar de alguma coisa, diga.',
        en: 'If you need anything, just say.',
        when: 'The offer that makes you a neighbour rather than a tenant.',
      },
    ],
    release: { ask: 'I am the new neighbour from the third floor.', answer: 'Sou o novo vizinho do terceiro.' },
    rung: 2,
  },
  {
    /*
      The membership test, and there is no ceremony on the day you pass it.

      "O costume" cannot be said on day one — it means nothing until somebody knows what
      your usual IS. Which makes it the only phrase in DUB you have to earn by turning up,
      and the reason it is in this block rather than the visiting one.
    */
    id: 'lisbon_costume',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['staying', 'moving'],
    title: 'Becoming a regular',
    why: 'Four syllables you cannot say on your first morning, and the day you can is the day you live here.',
    where: { name: 'the café nearest your door', area: 'wherever you sleep' },
    lines: [
      {
        pt: 'O costume, por favor.',
        en: 'The usual, please.',
        when: 'Only once they know what it is. Saying it too early is the joke, not the phrase.',
      },
      {
        pt: 'Hoje é diferente — um galão, se faz favor.',
        en: 'Today is different — a galão, please.',
        when: 'Breaking your own order, which is a thing only a regular has to explain.',
      },
      {
        pt: 'Posso pagar tudo no fim da semana?',
        en: 'Can I pay for it all at the end of the week?',
        when: 'A real arrangement in a real neighbourhood café, and never offered to a stranger.',
      },
      {
        pt: 'Como está a família?',
        en: 'How is the family?',
        when: 'The line that turns a transaction into the same conversation every morning.',
      },
      {
        pt: 'Até amanhã.',
        en: 'See you tomorrow.',
        when: 'Better than adeus, because it is a promise and it is true.',
      },
    ],
    release: { ask: 'The usual, please.', answer: 'O costume, por favor.' },
    rung: 2,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_navegante',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying', 'moving'],
    title: 'The Navegante card',
    why: 'Forty euros a month for everything that moves, and the machine will not sell you one.',
    where: { name: 'a Navegante desk in a metro station', area: 'Marquês, Alameda, Campo Grande' },
    lines: [
      {
        pt: 'Boa tarde. Queria um passe Navegante.',
        en: 'Good afternoon. I would like a Navegante pass.',
        when: 'Passe, not bilhete. A bilhete is a single journey.',
      },
      {
        pt: 'Preciso de foto?',
        en: 'Do I need a photo?',
        when: 'You do, and they may take it there. Worth knowing before you queue.',
      },
      {
        pt: 'Serve para o comboio também?',
        en: 'Does it work on the train as well?',
        when: 'The one that decides whether Sintra and Cascais are included. Usually yes.',
      },
      {
        pt: 'Onde é que carrego?',
        en: 'Where do I top it up?',
        when: 'Carregar again — load, this time. Machines, kiosks, and the app.',
      },
      {
        pt: 'Quanto custa por mês?',
        en: 'How much is it per month?',
        when: 'There is more than one price and the cheap one is not the one on the poster.',
      },
    ],
    release: { ask: 'Where do I top it up?', answer: 'Onde é que carrego?' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_lavandaria',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying'],
    title: 'The launderette',
    why: 'A flat for a season rarely has a machine, and this becomes a weekly hour of your life.',
    where: { name: 'lavandaria', area: 'every other street' },
    lines: [
      {
        pt: 'Boa tarde. Quanto é uma máquina?',
        en: 'Good afternoon. How much is one wash?',
        when: 'Uma máquina is a load, not a machine you are buying.',
      },
      {
        pt: 'Tem detergente à venda?',
        en: 'Do you sell detergent?',
        when: 'Usually a coin machine on the wall, and usually not signposted.',
      },
      {
        pt: 'Quanto tempo demora?',
        en: 'How long does it take?',
        when: 'Decides whether you wait or go for a coffee.',
      },
      {
        pt: 'Posso deixar e voltar?',
        en: 'Can I leave it and come back?',
        when: 'At a serviced one, yes. At a self-service one, this is how you find out it is not.',
      },
      {
        pt: 'A que horas fecham?',
        en: 'What time do you close?',
        when: 'The question that stops your clothes spending the night there.',
      },
    ],
    release: { ask: 'How long does it take?', answer: 'Quanto tempo demora?' },
    rung: 2,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_cabeleireiro',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying', 'moving'],
    title: 'A haircut',
    why: 'Twenty minutes of not being able to say stop, on something you have to wear for a month.',
    where: { name: 'cabeleireiro or barbearia', area: 'your street' },
    lines: [
      {
        pt: 'Boa tarde. Preciso de marcação?',
        en: 'Good afternoon. Do I need an appointment?',
        when: 'At the door. Some take you straight away and some absolutely do not.',
      },
      {
        pt: 'Queria cortar o cabelo, não muito curto.',
        en: 'I would like a haircut, not too short.',
        when: 'Both halves in one sentence, because the second half is the one that matters.',
      },
      {
        pt: 'Só as pontas, por favor.',
        en: 'Just the ends, please.',
        when: 'The safest instruction in any language, and the one to fall back on.',
      },
      {
        pt: 'Assim está bom, obrigado.',
        en: 'That is good like that, thank you.',
        when: 'The stop signal. Say it while there is still hair.',
      },
      {
        pt: 'Um bocadinho mais atrás.',
        en: 'A little bit more at the back.',
        when: 'When it is not finished. Bocadinho again — the diminutive does the softening.',
      },
    ],
    release: { ask: 'Just the ends, please.', answer: 'Só as pontas, por favor.' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    /*
      Fidelização, and it is the reason this room exists.

      A twelve-month lock-in signed for a three-month stay is the most expensive mistake on
      this page, and it is not hidden — it is simply asked about in Portuguese and answered
      in Portuguese. One word, and the whole room is built around getting a straight answer
      to it before anything is signed.
    */
    id: 'lisbon_ginasio',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying'],
    title: 'Joining a gym for three months',
    why: 'The contract is twelve months unless you ask, and asking is one word you have never needed before.',
    where: { name: 'any ginásio', area: 'near enough that you go' },
    lines: [
      {
        pt: 'Boa tarde. Queria inscrever-me por três meses.',
        en: 'Good afternoon. I would like to join for three months.',
        when: 'Say the length first. It changes which plan they show you.',
      },
      {
        pt: 'Há fidelização?',
        en: 'Is there a lock-in period?',
        when: 'The most valuable word in this file. Ask it before anything else is discussed.',
      },
      {
        pt: 'Posso cancelar quando quiser?',
        en: 'Can I cancel whenever I want?',
        when: 'The follow-up, because "no fidelização" and "cancel any time" are not always the same thing.',
      },
      {
        pt: 'Qual é a joia de inscrição?',
        en: 'What is the joining fee?',
        when: 'Joia is the sign-up fee. It is separate from the monthly price and rarely mentioned first.',
      },
      {
        pt: 'Posso experimentar primeiro?',
        en: 'Can I try it first?',
        when: 'A free day is usual. It is never offered and always given.',
      },
    ],
    release: { ask: 'Is there a lock-in period?', answer: 'Há fidelização?' },
    rung: 4,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_talho',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['staying', 'moving'],
    title: 'The counter, by weight',
    why: 'A number, a unit, and a person waiting — with a queue behind you and a ticket in your hand.',
    where: { name: 'talho or peixaria', area: 'the market, or the back of the supermarket' },
    lines: [
      {
        pt: 'Bom dia. Trezentos gramas, por favor.',
        en: 'Good morning. Three hundred grams, please.',
        when: 'Grams, not kilos, for anything you are eating this week.',
      },
      {
        pt: 'Um bocadinho mais.',
        en: 'A little bit more.',
        when: 'While the scale is still moving. This and the next line are the whole exchange.',
      },
      {
        pt: 'Assim chega.',
        en: 'That is enough.',
        when: 'The stop. Two words, and they are listening for them.',
      },
      {
        pt: 'Pode amanhar o peixe?',
        en: 'Could you gut the fish?',
        when: 'Amanhar is the word at a peixaria. They will, and they are faster than you.',
      },
      {
        pt: 'Mais nada, obrigado.',
        en: 'Nothing else, thank you.',
        when: 'Ends it. Without it they will keep offering, politely, for a while.',
      },
    ],
    release: { ask: 'Three hundred grams, please.', answer: 'Trezentos gramas, por favor.' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_encomenda',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying', 'moving'],
    title: 'The parcel you missed',
    why: 'It was not left with you, it was left somewhere, and finding out where is a conversation.',
    where: { name: 'the ponto de recolha — a newsagent, a laundry, a phone shop', area: 'somewhere on your street' },
    lines: [
      {
        pt: 'Boa tarde. Veio uma encomenda para mim?',
        en: 'Good afternoon. Did a parcel come for me?',
        when: 'The opening. Encomenda, not pacote.',
      },
      {
        pt: 'Em nome de Silva.',
        en: 'In the name of Silva.',
        when: 'Say the surname, not the first name. Spell it if it is not Portuguese.',
      },
      {
        pt: 'Tenho o código aqui.',
        en: 'I have the code here.',
        when: 'Phone already open. This is what they actually need.',
      },
      {
        pt: 'Até que dia posso levantar?',
        en: 'Until what day can I collect it?',
        when: 'There is a deadline and it is shorter than you think — usually a week.',
      },
      {
        pt: 'Desculpe, pode repetir o número?',
        en: 'Sorry, could you repeat the number?',
        when: 'The repair. Numbers said fast are the hardest thing in the room.',
      },
    ],
    release: { ask: 'Did a parcel come for me?', answer: 'Veio uma encomenda para mim?' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_arranjar',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying', 'moving'],
    title: 'Getting something mended',
    why: 'Shoes, a zip, a phone screen — the small shop that still exists here, and the four questions it takes.',
    where: { name: 'a sapateiro, a costureira, a repair shop', area: 'the street you walk down anyway' },
    lines: [
      {
        pt: 'Boa tarde. Isto tem arranjo?',
        en: 'Good afternoon. Can this be mended?',
        when: 'Ter arranjo — literally "does this have a mend". The way it is asked.',
      },
      {
        pt: 'Vale a pena arranjar?',
        en: 'Is it worth mending?',
        when: 'You will get an honest answer, which is the reason to ask a person rather than a website.',
      },
      {
        pt: 'Quanto fica?',
        en: 'How much will it come to?',
        when: 'Ficar for a price that is being worked out, rather than one on a label.',
      },
      {
        pt: 'Para quando fica pronto?',
        en: 'When will it be ready?',
        when: 'Usually sooner than you expect and never written down.',
      },
      {
        pt: 'Deixo aqui, então.',
        en: 'I will leave it here, then.',
        when: 'Closes it. Então at the end is the small word that makes it sound decided.',
      },
    ],
    release: { ask: 'Can this be mended?', answer: 'Isto tem arranjo?' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    /*
      Last, because it is the room where somebody admits out loud that they are staying.

      Signing up for lessons is the first thing on this list that costs money and time for
      a benefit entirely in the future, and it is only rational once you have stopped
      thinking of yourself as a visitor.
    */
    id: 'lisbon_aulas',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['staying', 'moving'],
    title: 'Signing up for classes',
    why: 'The moment you stop being somebody passing through, and it is a conversation in the language you are signing up to learn.',
    where: { name: 'a language school, or the Junta', area: 'most parishes run them cheaply' },
    lines: [
      {
        pt: 'Boa tarde. Queria inscrever-me nas aulas de português.',
        en: 'Good afternoon. I would like to sign up for the Portuguese classes.',
        when: 'Inscrever-me — sign myself up. The reflexive is doing work here.',
      },
      {
        pt: 'Que nível me recomenda?',
        en: 'What level do you recommend for me?',
        when: 'Better than claiming one. They will ask you something and place you from the answer.',
      },
      {
        pt: 'Há turmas à noite?',
        en: 'Are there evening classes?',
        when: 'The question that decides whether you actually go.',
      },
      {
        pt: 'Quando começa o próximo curso?',
        en: 'When does the next course start?',
        when: 'Terms, not rolling. Missing the start can mean waiting two months.',
      },
      {
        pt: 'Posso assistir a uma aula primeiro?',
        en: 'Can I sit in on a class first?',
        when: 'Assistir a — to attend, not to help. Usually allowed and rarely advertised.',
      },
    ],
    release: {
      ask: 'I would like to sign up for the Portuguese classes.',
      answer: 'Queria inscrever-me nas aulas de português.',
    },
    rung: 4,
    review_by: '2027-09-01',
  },
]
