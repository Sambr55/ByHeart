/**
 * Lisbon · moving · block 1 — arriving.
 *
 * The ten rooms somebody walks into in their first two months of living here, in roughly
 * the order they walk into them: the NIF before the bank, the bank before the lease, the
 * lease before the utilities, and the health centre before you need it rather than after.
 *
 * WHY THIS BLOCK AND NOT THE TOURIST ONE. A visitor can point, smile, and be understood;
 * that is what makes a holiday a holiday. None of these rooms work like that. A counter at
 * Finanças is a form, a queue, a number called out in Portuguese, and a person who will
 * repeat it once. The stakes are the thing that makes the language matter — a wrong coffee
 * costs a coffee, a wrong morning at Finanças costs a second appointment three weeks later
 * — and it is the reason somebody would choose DUB over an app that teaches them to say
 * "the cat is on the table".
 *
 * WHAT MAKES THESE HARDER, and it is not vocabulary. Three things, all of them structural:
 *
 *   The reply is unpredictable. Ordering a coffee has two possible answers. Asking for a
 *   NIF has a dozen, and half of them are a question back. So every room here carries at
 *   least one REPAIR line — say that again, more slowly, I did not understand — and those
 *   are not filler. They are the sentences that keep an exchange in Portuguese instead of
 *   ending it in English, which is the whole thing DUB exists to prevent.
 *
 *   You cannot leave and come back. A café you can walk out of. An appointment you cannot,
 *   so the language has to survive going wrong in the middle.
 *
 *   The other person is not on your side in the way a waiter is. They are not unkind; they
 *   are the ninth person that morning and they have a screen to fill in.
 *
 * NOT REVIEWED. Every line here was written by me and no native speaker has seen one. The
 * register is the tu/você question DUB already handles elsewhere, but the bureaucratic
 * fixed phrases — "atestado de residência", "número de contribuinte", "comprovativo de
 * morada" — are the kind of thing that is either exactly right or immediately marks you as
 * having learned it from an app. These need the pt-PT reviewer before they go in front of
 * anybody, and the review is the schedule, not the writing.
 *
 * IMAGES. Ten briefs are in content/images.ts under WANTED, sharing one look so the block
 * reads as a set: interiors, waiting, counters, nobody's face. See the note there.
 */
import type { Situation } from '@/content/situations'

export const LISBON_MOVING_1: Situation[] = [
  {
    id: 'lisbon_nif',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Getting your NIF',
    why: 'Nothing else starts until you have one — not a bank account, not a phone contract, not a lease. It is the first morning of actually living here.',
    where: { name: 'Serviço de Finanças', area: 'your parish' },
    lines: [
      {
        pt: 'Bom dia. Preciso de um número de contribuinte.',
        en: 'Good morning. I need a tax number.',
        when: 'The opening. Say "número de contribuinte" rather than NIF — it is what the form says.',
      },
      {
        pt: 'Sou estrangeiro e vivo cá agora.',
        en: 'I am a foreigner and I live here now.',
        when: 'Answers the next question before it is asked, and it is the reason you are entitled to one.',
      },
      {
        pt: 'Trouxe o passaporte e um comprovativo de morada.',
        en: 'I brought my passport and a proof of address.',
        when: 'Say it while you put them down. The two documents this hinges on.',
      },
      {
        pt: 'Desculpe, não percebi. Pode repetir mais devagar?',
        en: 'Sorry, I did not understand. Could you say that again more slowly?',
        when: 'The repair. Use it early — it keeps the whole thing in Portuguese.',
      },
      {
        pt: 'Tenho de voltar noutro dia?',
        en: 'Do I have to come back another day?',
        when: 'The answer you need before you leave, and the one nobody thinks to ask for.',
      },
    ],
    release: {
      ask: 'Good morning. I need a tax number.',
      answer: 'Bom dia. Preciso de um número de contribuinte.',
    },
    rung: 3,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_banco',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Opening a bank account',
    why: 'An hour at a desk with somebody typing, and a lot of questions you will not see coming. Worth having the first four sentences ready.',
    where: { name: 'A bank branch', area: 'anywhere' },
    lines: [
      {
        pt: 'Bom dia. Queria abrir uma conta.',
        en: 'Good morning. I would like to open an account.',
        when: 'Queria, not quero — softer, and what you actually hear at a counter.',
      },
      {
        pt: 'Tenho NIF e comprovativo de morada.',
        en: 'I have a tax number and proof of address.',
        when: 'The two things they are about to ask for. Saying it first shortens the whole meeting.',
      },
      {
        pt: 'Trabalho por conta própria.',
        en: 'I am self-employed.',
        when: 'Or "Trabalho para uma empresa" — I work for a company. They will ask.',
      },
      {
        pt: 'Pode explicar outra vez, por favor?',
        en: 'Could you explain that again, please?',
        when: 'There will be a paragraph about fees. This is how you hear it twice.',
      },
      {
        pt: 'Quando é que recebo o cartão?',
        en: 'When do I get the card?',
        when: 'The one practical answer you need to leave with.',
      },
    ],
    release: {
      ask: 'Good morning. I would like to open an account.',
      answer: 'Bom dia. Queria abrir uma conta.',
    },
    rung: 3,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_telemovel',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving', 'staying'],
    title: 'A phone number that is yours',
    why: 'A local number is what every other form asks for, and a shop is the easiest of these rooms to practise in — low stakes, and they are used to explaining.',
    where: { name: 'A phone shop', area: 'any shopping centre' },
    lines: [
      {
        pt: 'Boa tarde. Queria um cartão com número português.',
        en: 'Good afternoon. I would like a SIM with a Portuguese number.',
        when: 'Opens it without needing the word for SIM, which nobody agrees on anyway.',
      },
      {
        pt: 'Quanto é por mês?',
        en: 'How much is it a month?',
        when: 'You already own quanto. Here it does real work.',
      },
      {
        pt: 'Tem alguma coisa sem fidelização?',
        en: 'Do you have anything without a minimum contract?',
        when: 'Fidelização is the word that costs people money for not knowing it.',
      },
      {
        pt: 'Posso pagar com cartão?',
        en: 'Can I pay by card?',
        when: 'Worth having everywhere, and this is where you first need it.',
      },
      {
        pt: 'Desculpe, pode repetir?',
        en: 'Sorry, could you repeat that?',
        when: 'Short, and it does not apologise for existing.',
      },
    ],
    release: {
      ask: 'Good afternoon. I would like a SIM with a Portuguese number.',
      answer: 'Boa tarde. Queria um cartão com número português.',
    },
    rung: 2,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_visita',
    chapter: 'lisbon',
    kind: 'moment',
    purposes: ['moving'],
    title: 'Seeing a flat',
    why: 'Twenty minutes with an agent who has three more viewings after yours. What you ask in that window decides what you find out.',
    where: { name: 'A viewing', area: 'wherever you are looking' },
    lines: [
      {
        pt: 'Boa tarde. Venho ver o apartamento.',
        en: 'Good afternoon. I am here to see the flat.',
        when: 'At the door. Venho ver — I have come to see.',
      },
      {
        pt: 'Qual é a renda por mês?',
        en: 'What is the rent per month?',
        when: 'Ask even if you think you know. The listing is often the old price.',
      },
      {
        pt: 'As despesas estão incluídas?',
        en: 'Are the bills included?',
        when: 'Despesas is the whole question. It is rarely yes.',
      },
      {
        pt: 'Quantos meses de caução?',
        en: 'How many months deposit?',
        when: 'Two is normal. Three happens. Better to hear it here than in an email.',
      },
      {
        pt: 'Posso pensar e ligar amanhã?',
        en: 'Can I think about it and call tomorrow?',
        when: 'The sentence that gets you out of the room without saying no.',
      },
    ],
    release: {
      ask: 'Are the bills included?',
      answer: 'As despesas estão incluídas?',
    },
    rung: 4,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_contrato',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Signing the lease',
    why: 'The highest-stakes hour on this list. You are agreeing to something in a language you are still learning, and asking is not rude.',
    where: { name: 'Signing', area: 'an agency or a kitchen table' },
    lines: [
      {
        pt: 'Antes de assinar, tenho algumas perguntas.',
        en: 'Before I sign, I have a few questions.',
        when: 'Say this first. It buys you the whole rest of the conversation.',
      },
      {
        pt: 'Por quanto tempo é o contrato?',
        en: 'How long is the contract for?',
        when: 'One year renewable is common, but it is not a rule.',
      },
      {
        pt: 'Como é que devolvem a caução?',
        en: 'How is the deposit returned?',
        when: 'The question people wish they had asked, a year later.',
      },
      {
        pt: 'Pode escrever isso, por favor?',
        en: 'Could you write that down, please?',
        when: 'Better than nodding. Nobody minds, and you can read it afterwards.',
      },
      {
        pt: 'Preciso de ler com calma.',
        en: 'I need to read it properly.',
        when: 'Com calma — without rushing. A completely normal thing to say here.',
      },
    ],
    release: {
      ask: 'Before I sign, I have a few questions.',
      answer: 'Antes de assinar, tenho algumas perguntas.',
    },
    rung: 4,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_luz_agua',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Getting the power on',
    why: 'Usually a phone call, which is the hardest kind of Portuguese there is — no face, no pointing, and a menu before you even start.',
    lines: [
      {
        pt: 'Boa tarde. Queria pôr a luz em meu nome.',
        en: 'Good afternoon. I would like to put the electricity in my name.',
        when: 'A luz — the light. Nobody says electricidade on the phone.',
      },
      {
        pt: 'Mudei-me para uma casa nova.',
        en: 'I have moved into a new place.',
        when: 'Explains everything that follows in five words.',
      },
      {
        pt: 'Tenho o número do contador aqui.',
        en: 'I have the meter number here.',
        when: 'Have it in front of you before you dial. They will ask.',
      },
      {
        pt: 'Desculpe, a ligação está má. Pode repetir?',
        en: 'Sorry, the line is bad. Could you repeat that?',
        when: 'True often enough, and it works whether or not it is.',
      },
      {
        pt: 'A partir de quando é que fica ativo?',
        en: 'From when will it be active?',
        when: 'The only date that matters, and worth making them say it twice.',
      },
    ],
    release: {
      ask: 'Good afternoon. I would like to put the electricity in my name.',
      answer: 'Boa tarde. Queria pôr a luz em meu nome.',
    },
    rung: 4,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_centro_saude',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Registering at the health centre',
    why: 'Do it while you are well. Your número de utente is what makes the whole system work, and finding that out when you are ill is the wrong time.',
    where: { name: 'Centro de Saúde', area: 'your parish' },
    lines: [
      {
        pt: 'Bom dia. Queria inscrever-me no centro de saúde.',
        en: 'Good morning. I would like to register at the health centre.',
        when: 'Inscrever-me — to enrol myself. The word the desk expects.',
      },
      {
        pt: 'Ainda não tenho número de utente.',
        en: 'I do not have a health service number yet.',
        when: 'Says exactly where you are in the process.',
      },
      {
        pt: 'Trouxe o NIF e o atestado de residência.',
        en: 'I brought my tax number and my proof of residence.',
        when: 'The Junta comes before this one. That is why it is on the list.',
      },
      {
        pt: 'Como é que marco uma consulta?',
        en: 'How do I make an appointment?',
        when: 'Ask now, calmly, rather than later, unwell.',
      },
      {
        pt: 'Desculpe, pode escrever o nome?',
        en: 'Sorry, could you write the name down?',
        when: 'For the doctor you have just been assigned, whose name you will not catch.',
      },
    ],
    release: {
      ask: 'Good morning. I would like to register at the health centre.',
      answer: 'Bom dia. Queria inscrever-me no centro de saúde.',
    },
    rung: 3,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_loja_cidadao',
    chapter: 'lisbon',
    kind: 'place',
    purposes: ['moving'],
    title: 'The Loja do Cidadão',
    why: 'Everything under one roof, which means a ticket, a screen, and a number read out in Portuguese while you try to work out if it is yours.',
    where: { name: 'Loja do Cidadão', area: 'Laranjeiras or Saldanha' },
    lines: [
      {
        pt: 'Bom dia. Onde tiro a senha?',
        en: 'Good morning. Where do I take a ticket?',
        when: 'A senha is the ticket. Ask at the door, not at a desk.',
      },
      {
        pt: 'É para o registo civil.',
        en: 'It is for the civil registry.',
        when: 'Swap in whichever counter you need. This is how the machine gets set.',
      },
      {
        pt: 'Desculpe, este número é o meu?',
        en: 'Sorry, is this number mine?',
        when: 'Ask the person next to you. It is what everybody does.',
      },
      {
        pt: 'Quanto tempo é a espera?',
        en: 'How long is the wait?',
        when: 'Worth knowing before you commit your morning to it.',
      },
      {
        pt: 'Volto já.',
        en: 'I will be right back.',
        when: 'If you have to step out. Keeps your place in the conversation, if not the queue.',
      },
    ],
    release: {
      ask: 'Good morning. Where do I take a ticket?',
      answer: 'Bom dia. Onde tiro a senha?',
    },
    rung: 3,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_carro',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Buying a car',
    why: 'A private sale in a language you are learning, with paperwork afterwards. The questions are the same three everywhere, and asking them plainly is the whole job.',
    lines: [
      {
        pt: 'Boa tarde. Ainda está à venda?',
        en: 'Good afternoon. Is it still for sale?',
        when: 'The message and the doorstep both. À venda — for sale.',
      },
      {
        pt: 'Quantos quilómetros tem?',
        en: 'How many kilometres has it done?',
        when: 'The first number anybody asks for.',
      },
      {
        pt: 'Tem a inspeção em dia?',
        en: 'Is the inspection up to date?',
        when: 'Em dia — up to date. The answer that decides whether this is a bargain.',
      },
      {
        pt: 'Posso dar uma volta?',
        en: 'Can I take it for a drive?',
        when: 'Dar uma volta — go around. Nobody says test drive.',
      },
      {
        pt: 'Fazemos a transferência quando?',
        en: 'When do we do the transfer of ownership?',
        when: 'Ask before money moves, not after.',
      },
    ],
    release: {
      ask: 'Is the inspection up to date?',
      answer: 'Tem a inspeção em dia?',
    },
    rung: 4,
    review_by: '2027-06-01',
  },

  {
    id: 'lisbon_escola',
    chapter: 'lisbon',
    kind: 'errand',
    purposes: ['moving'],
    title: 'Getting a place at school',
    why: 'The one on this list that is not about you. Being able to ask clearly is worth more here than anywhere else on it.',
    where: { name: 'A school or creche', area: 'your parish' },
    lines: [
      {
        pt: 'Bom dia. Queria inscrever o meu filho.',
        en: 'Good morning. I would like to enrol my son.',
        when: 'A minha filha for a daughter. Your Legend already knows which.',
      },
      {
        pt: 'Ele tem seis anos.',
        en: 'He is six years old.',
        when: 'Ela tem for a girl. The number you have from the basics.',
      },
      {
        pt: 'Ainda não fala português.',
        en: 'He does not speak Portuguese yet.',
        when: 'Say it early. Schools here are used to it and would rather know.',
      },
      {
        pt: 'Quais são os documentos necessários?',
        en: 'What documents are needed?',
        when: 'There will be a list. This is how you get it.',
      },
      {
        pt: 'Quando é que sabemos?',
        en: 'When will we know?',
        when: 'Places are allocated, not granted. Worth asking gently and directly.',
      },
    ],
    release: {
      ask: 'Good morning. I would like to enrol my son.',
      answer: 'Bom dia. Queria inscrever o meu filho.',
    },
    rung: 4,
    review_by: '2027-06-01',
  },
]
