/**
 * Lisbon · visiting · block 1 — four days.
 *
 * THE PROBLEM THIS BLOCK EXISTS TO FIX. Of fifteen rooms, `moving` matched all fifteen,
 * `staying` six and `visiting` four — so the person who answered "I am here for a few days"
 * got the emptiest Club of the three, as a reward for telling us the truth. Purpose could
 * only ORDER the feed because filtering on it would have made that worse.
 *
 * WHY A VISITOR IS HARDER TO WRITE FOR THAN A MOVER, which is the opposite of what you
 * would guess. A mover has no choice: a counter at Finanças is a form and a queue and there
 * is no way through it but Portuguese. A visitor can point, smile, and be understood — that
 * is what makes a holiday a holiday — and every one of these rooms will work in English if
 * they give up. So the block cannot be justified by necessity. It has to be justified by
 * what the language BUYS, and that is a different thing in every room:
 *
 *   Sometimes it is money. The couvert on a Lisbon table is not a scam and not free, and
 *   knowing you can decline it is worth more than the phrase costs.
 *
 *   Sometimes it is access. "Is there a minimum spend" asked in Portuguese at a fado house
 *   gets a straight answer; asked in English it gets a menu.
 *
 *   Sometimes it is safety. "It is an allergy, not a preference" is the one line in this
 *   file that has to survive being said badly, so it is written to be short and blunt
 *   rather than polite.
 *
 *   And sometimes it is just the moment. Asking a stranger at a miradouro to take the photo
 *   is the single most likely conversation a visitor will have with a Portuguese person all
 *   week, and it is four days of holiday either way — the difference is whether it happened
 *   in their language.
 *
 * WHAT IS DELIBERATELY NOT HERE. The pharmacy, the coffee standing up, the bread queue and
 * the 28 are already standing rooms and already untagged, because a pharmacy does not care
 * why you are in the country. Repeating them tagged would count twice and teach once.
 *
 * THE REPAIR LINE. Every room carries one — say that again, more slowly, show me. A visitor
 * needs it MORE than a mover, not less: they have no second appointment and no context to
 * guess from, and the alternative to repairing is the conversation switching to English,
 * which is the thing DUB exists to prevent.
 *
 * NOT REVIEWED. Written by me; the register and the fixed phrases want a pt-PT reader
 * before anybody says them to a stranger.
 */
import type { Situation } from '@/content/situations'

export const LISBON_VISITING_1: Situation[] = [
  {
    id: 'lisbon_mesa',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'A table for two',
    why: 'The first sentence of the evening, and the one that decides whether the rest of it happens in Portuguese.',
    where: { name: 'anywhere with a door and a menu', area: 'Bairro Alto, Alfama, anywhere' },
    lines: [
      {
        pt: 'Boa noite. Uma mesa para dois, por favor.',
        en: 'Good evening. A table for two, please.',
        when: 'On the way in. Boa noite from about six, not boa tarde.',
      },
      {
        pt: 'Não temos reserva. Há muita espera?',
        en: 'We do not have a reservation. Is there much of a wait?',
        when: 'Answers the question they are about to ask, and asks the one you need.',
      },
      {
        pt: 'Podemos ficar lá fora?',
        en: 'Can we sit outside?',
        when: 'Worth asking. The answer is often yes and nobody offers.',
      },
      {
        pt: 'Só um momento, ainda não escolhemos.',
        en: 'Just a moment, we have not chosen yet.',
        when: 'When they come back too soon, which they will.',
      },
      {
        pt: 'Desculpe, não percebi. Pode repetir mais devagar?',
        en: 'Sorry, I did not understand. Could you say that again more slowly?',
        when: 'The repair. Use it early — it keeps the evening in Portuguese.',
      },
    ],
    release: {
      ask: 'Good evening. A table for two, please.',
      answer: 'Boa noite. Uma mesa para dois, por favor.',
    },
    rung: 2,
    review_by: '2027-09-01',
  },
  {
    /*
      The couvert, which is the whole reason this room is separate from the last one.

      Bread, olives and cheese arrive unasked at almost every Lisbon table. It is not a scam
      and it is not free, and you are allowed to send it back — but only if you know that,
      and knowing it in Portuguese is worth more than the phrase costs.
    */
    id: 'lisbon_conta',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: ['visiting'],
    title: 'The bill, and the couvert',
    why: 'The things on the table nobody ordered are not free, and you are allowed to say so.',
    lines: [
      {
        pt: 'O couvert não pedimos, pode levar.',
        en: 'We did not order the couvert, you can take it away.',
        when: 'As it lands, not after you have eaten it. Said plainly — this is normal and nobody minds.',
      },
      {
        pt: 'A conta, por favor.',
        en: 'The bill, please.',
        when: 'Nobody brings it until you ask. Waiting politely is waiting all night.',
      },
      {
        pt: 'Podemos pagar com cartão?',
        en: 'Can we pay by card?',
        when: 'Ask before they start adding up. Some small places are still cash.',
      },
      {
        pt: 'Pode dividir em dois?',
        en: 'Could you split it in two?',
        when: 'Usually fine, occasionally not, and much easier asked than mimed.',
      },
      {
        pt: 'Desculpe, isto o que é?',
        en: 'Sorry, what is this?',
        when: 'Pointing at a line you do not recognise. A complete sentence and entirely polite.',
      },
    ],
    release: { ask: 'The bill, please.', answer: 'A conta, por favor.' },
    rung: 2,
  },
  {
    id: 'lisbon_bilhetes',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['visiting'],
    title: 'Tickets, and which queue',
    why: 'Two queues, one of them for people who already have tickets, and no sign saying which is which.',
    where: { name: 'Castelo de São Jorge, Jerónimos, anywhere with a gate', area: 'the hill, or Belém' },
    lines: [
      {
        pt: 'Bom dia. Dois bilhetes, por favor.',
        en: 'Good morning. Two tickets, please.',
        when: 'The opening.',
      },
      {
        pt: 'A fila é aqui?',
        en: 'Is the queue here?',
        when: 'The sentence that saves forty minutes. Ask it before you join anything.',
      },
      {
        pt: 'Há desconto para estudantes?',
        en: 'Is there a student discount?',
        when: 'Or para maiores de 65 — over 65s. Both exist and neither is advertised in English.',
      },
      {
        pt: 'A que horas fecha?',
        en: 'What time does it close?',
        when: 'Last entry is usually earlier than closing, and this is how you find that out.',
      },
      {
        pt: 'Desculpe, pode escrever?',
        en: 'Sorry, could you write it down?',
        when: 'The repair, for a number said fast through glass.',
      },
    ],
    release: { ask: 'Is the queue here?', answer: 'A fila é aqui?' },
    rung: 2,
    review_by: '2027-09-01',
  },
  {
    /*
      The most likely conversation of the week, and the one nobody prepares for.

      Four days of holiday happen either way. The difference is whether the one exchange
      with an actual Lisboeta was in their language or in mime, and this is the room where
      that is entirely within the learner's control.
    */
    id: 'lisbon_foto',
    chapter: 'lisbon',
    kind: 'person',
    purposes: ['visiting'],
    title: 'Asking somebody to take the photo',
    why: 'The one conversation you are almost certain to have with a stranger, and the one you can decide the language of.',
    where: { name: 'any miradouro', area: 'Graça, Santa Catarina, São Pedro de Alcântara' },
    lines: [
      {
        pt: 'Desculpe, pode tirar-nos uma foto?',
        en: 'Excuse me, could you take a photo of us?',
        when: 'The ask. Desculpe first, always — it is the whole difference between asking and instructing.',
      },
      {
        pt: 'É só carregar aqui.',
        en: 'You just press here.',
        when: 'Handing the phone over. Carregar is press, not load.',
      },
      {
        pt: 'Com o castelo atrás, se faz favor.',
        en: 'With the castle behind us, please.',
        when: 'Swap in whatever is behind you. Se faz favor is the softer por favor.',
      },
      {
        pt: 'Pode tirar mais uma?',
        en: 'Could you take one more?',
        when: 'The second ask, which is the one people abandon and go back to English for.',
      },
      {
        pt: 'Muito obrigado, ficou ótima.',
        en: 'Thank you very much, it came out great.',
        when: 'Obrigada if you are a woman. The photograph does not have to be great.',
      },
    ],
    release: {
      ask: 'Excuse me, could you take a photo of us?',
      answer: 'Desculpe, pode tirar-nos uma foto?',
    },
    rung: 2,
  },
  {
    id: 'lisbon_taxi',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: ['visiting'],
    title: 'Getting in a taxi',
    why: 'You have thirty seconds to say where you are going, and the address is in a language you cannot pronounce yet.',
    lines: [
      {
        pt: 'Boa tarde. Para a Rua Garrett, por favor.',
        en: 'Good afternoon. To Rua Garrett, please.',
        when: 'Para a for a street, para o for a place. Show the screen as you say it.',
      },
      {
        pt: 'Sabe onde fica?',
        en: 'Do you know where it is?',
        when: 'Politer than it looks, and it gets you a yes or a real answer rather than a shrug halfway.',
      },
      {
        pt: 'Pode parar aqui, por favor.',
        en: 'You can stop here, please.',
        when: 'The one that matters. Lisbon streets narrow without warning and the door is often nowhere near.',
      },
      {
        pt: 'Aceita cartão?',
        en: 'Do you take card?',
        when: 'Ask at the start, not at the end.',
      },
      {
        pt: 'Quanto é?',
        en: 'How much is it?',
        when: 'Short, and it is the whole question. Nothing longer is needed.',
      },
    ],
    release: { ask: 'You can stop here, please.', answer: 'Pode parar aqui, por favor.' },
    rung: 2,
  },
  {
    /*
      Asking is easy; the answer is the hard part, and most phrasebooks stop before it.

      So the lines here are weighted to SURVIVING the reply — left or right, is it far, show
      me — rather than to producing a beautiful question you cannot follow up.
    */
    id: 'lisbon_perdido',
    chapter: 'lisbon',
    kind: 'person',
    purposes: ['visiting'],
    title: 'Asking the way, and surviving the answer',
    why: 'Asking is the easy half. These are the lines for the half where somebody is pointing and talking fast.',
    lines: [
      {
        pt: 'Desculpe, onde fica o Chiado?',
        en: 'Excuse me, where is the Chiado?',
        when: 'Onde fica for a place that stays put. Swap in wherever you are going.',
      },
      {
        pt: 'É longe daqui?',
        en: 'Is it far from here?',
        when: 'The question that decides whether you walk. Ask it before the directions, not after.',
      },
      {
        pt: 'À esquerda ou à direita?',
        en: 'Left or right?',
        when: 'The two words to catch out of everything they say. Ask it back to confirm.',
      },
      {
        pt: 'Pode mostrar-me no mapa?',
        en: 'Could you show me on the map?',
        when: 'The repair, and far better than nodding. Have the phone out already.',
      },
      {
        pt: 'Muito obrigado, foi simpático.',
        en: 'Thank you very much, that was kind.',
        when: 'Simpático is the word for it, and it is worth more here than obrigado alone.',
      },
    ],
    release: { ask: 'Is it far from here?', answer: 'É longe daqui?' },
    rung: 3,
  },
  {
    id: 'lisbon_mercado',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'Buying by weight',
    why: 'Everything is priced by the kilo and you want about a handful, which is a sentence rather than a gesture.',
    where: { name: 'Mercado da Ribeira, Campo de Ourique, any market', area: 'Cais do Sodré' },
    lines: [
      {
        pt: 'Bom dia. Quanto é ao quilo?',
        en: 'Good morning. How much per kilo?',
        when: 'The price on the card is almost always per kilo, not per piece.',
      },
      {
        pt: 'Meio quilo, por favor.',
        en: 'Half a kilo, please.',
        when: 'Or duzentos gramas — two hundred grams — which is closer to what you actually want.',
      },
      {
        pt: 'Um bocadinho mais.',
        en: 'A little bit more.',
        when: 'As the scale moves. Bocadinho is the diminutive and it is what people really say.',
      },
      {
        pt: 'Assim chega, obrigado.',
        en: 'That is enough, thank you.',
        when: 'The stop signal, before it becomes a kilo.',
      },
      {
        pt: 'É para levar.',
        en: 'It is to take away.',
        when: 'Tells them how to wrap it, and saves the question.',
      },
    ],
    release: { ask: 'Half a kilo, please.', answer: 'Meio quilo, por favor.' },
    rung: 2,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_fado',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['visiting'],
    title: 'A fado house',
    why: 'There are rules in the room and nobody explains them in English until you have already broken one.',
    where: { name: 'a casa de fado', area: 'Alfama or Bairro Alto' },
    lines: [
      {
        pt: 'Boa noite. Queria reservar uma mesa para as nove.',
        en: 'Good evening. I would like to reserve a table for nine.',
        when: 'Fado starts late. Nine is early, ten is normal.',
      },
      {
        pt: 'Há consumo mínimo?',
        en: 'Is there a minimum spend?',
        when: 'The question that changes the price of the evening. Asked in Portuguese it gets a number.',
      },
      {
        pt: 'A que horas começa o fado?',
        en: 'What time does the fado start?',
        when: 'Dinner and the singing are not the same hour, and the second is the one you came for.',
      },
      {
        pt: 'Fica-se em silêncio durante o fado?',
        en: 'Does one stay silent during the fado?',
        when: 'You do — completely. Asking shows you know it matters, which is the point.',
      },
      {
        pt: 'Foi lindo. Obrigado.',
        en: 'That was beautiful. Thank you.',
        when: 'Afterwards, to whoever sang. Lindo is the right word and nothing bigger is needed.',
      },
    ],
    release: { ask: 'Is there a minimum spend?', answer: 'Há consumo mínimo?' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    id: 'lisbon_comboio',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['visiting'],
    title: 'The train to Sintra',
    why: 'Rossio station, one machine, a queue behind you, and a ticket that has to be validated before you board.',
    where: { name: 'Estação do Rossio', area: 'Rossio' },
    lines: [
      {
        pt: 'Um bilhete para Sintra, ida e volta.',
        en: 'A ticket to Sintra, return.',
        when: 'Ida e volta is return; ida is one way. Say which or you will be asked.',
      },
      {
        pt: 'Tenho de validar aqui?',
        en: 'Do I have to validate here?',
        when: 'You do, and an unvalidated ticket is a fine rather than a misunderstanding.',
      },
      {
        pt: 'De que linha parte?',
        en: 'Which platform does it leave from?',
        when: 'Linha is the platform here, not the line.',
      },
      {
        pt: 'O próximo é a que horas?',
        en: 'What time is the next one?',
        when: 'Every twenty minutes or so, but not late and not always.',
      },
      {
        pt: 'Este comboio vai a Sintra?',
        en: 'Does this train go to Sintra?',
        when: 'Said to anybody on the platform. The last check, and worth making.',
      },
    ],
    release: { ask: 'A ticket to Sintra, return.', answer: 'Um bilhete para Sintra, ida e volta.' },
    rung: 3,
    review_by: '2027-09-01',
  },
  {
    /*
      The one room here that has to survive being said badly.

      Everything else in this block buys a better evening. This buys not spending it in a
      hospital, so the lines are short and blunt rather than polite, and the allergy line is
      built to be understood even if the accent is wrong and the verb is wrong.
    */
    id: 'lisbon_sem',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: ['visiting'],
    title: 'What you cannot eat',
    why: 'The one thing you cannot afford to mime, and the one where being understood beats being polite.',
    lines: [
      {
        pt: 'É alergia, não é preferência.',
        en: 'It is an allergy, not a preference.',
        when: 'The line that changes how the kitchen treats it. Say it first, not last.',
      },
      {
        pt: 'Não posso comer glúten.',
        en: 'I cannot eat gluten.',
        when: 'Swap in what applies — marisco for shellfish, amendoim for peanuts, lactose for lactose.',
      },
      {
        pt: 'Isto leva peixe?',
        en: 'Does this have fish in it?',
        when: 'Levar is what a dish CONTAINS. Ter would be understood; levar is what is said.',
      },
      {
        pt: 'Tem alguma coisa sem carne?',
        en: 'Do you have anything without meat?',
        when: 'Sem is without, and it is the most useful small word in this room.',
      },
      {
        pt: 'Pode perguntar na cozinha?',
        en: 'Could you ask in the kitchen?',
        when: 'When the answer comes back too fast to have been checked.',
      },
    ],
    release: { ask: 'It is an allergy, not a preference.', answer: 'É alergia, não é preferência.' },
    rung: 3,
  },
]
