/**
 * Three questions, one between sections, each of which pays out immediately.
 *
 * The rule that makes these tolerable: every question is asked because the answer
 * changes what the learner is told next, and the change is shown on the same screen
 * before they move on. A question that does not visibly alter the Portuguese is a form,
 * and testers are right to resent forms.
 *
 * The gender question is about grammatical gender — which endings come out of your
 * mouth — not about identity. Portuguese makes you choose before it will let you say
 * thank you, and that is the honest reason to ask.
 */

export type LanguageGender = 'm' | 'f'
export type AgeBand = 'under25' | '25to39' | '40to59' | '60plus'
export type Goal = 'trip' | 'someone' | 'moving' | 'work' | 'curious'

export interface ProfileQuestion {
  id: 'gender' | 'age' | 'goal'
  /** Who asks. The product's own questions get the same treatment as its lessons. */
  eyebrow: string
  askerLine: string
  headline: string
  /** Why we are asking, in terms of what they get. Never in terms of what we get. */
  why: string
  options: { id: string; label: string; sub?: string }[]
  skip: string
  skipNote: string
}

export const GENDER_QUESTION: ProfileQuestion = {
  id: 'gender',
  /*
    No character asks these any more.

    Bridget asked about gender, Marcus about age and Maverick about your reason — each
    hard-coded to the crate that happened to author the question. So a learner halfway
    through Bridget Jones was interrupted by Maverick, from a different crate entirely,
    which is incoherent in a way no amount of good copy rescues. Giving every crate its
    own asker would mean thirty-six lines of character voice, and the basics has no
    character at all. It is DUB asking. It always was.
  */
  eyebrow: 'ONE QUESTION',
  askerLine: 'Slightly personal, but Portuguese is going to insist.',
  headline: 'Are you speaking as a man or a woman?',
  why:
    'Not about who you are. About which ending comes out of your mouth. Portuguese will not let you say thank you until it knows.',
  options: [
    { id: 'm', label: 'AS A MAN', sub: 'obrigado' },
    { id: 'f', label: 'AS A WOMAN', sub: 'obrigada' },
  ],
  skip: 'SHOW ME BOTH',
  skipNote: 'Then we will always show both forms. Nothing is lost.',
}

export const AGE_QUESTION: ProfileQuestion = {
  id: 'age',
  eyebrow: 'ONE QUESTION',
  askerLine: 'Nobody will ask you this out loud. Portugal decides on sight.',
  headline: 'Roughly how old are you?',
  why:
    /*
      What this question actually does, said accurately.

      It promised "this decides which version you are taught" and decided nothing:
      age_band is read in exactly one place, to work out whether to ask the question
      again, and it never touches content selection. The graph is overwhelmingly tu —
      podes outnumbers pode 28 to 1 and o senhor does not occur once — so a
      sixty-year-old was told he would be given the formal register and then taught
      "Podes repetir?" for the next ninety roots.

      The rule this establishes is bigger than the bug: no screen may promise a
      behaviour the code does not have. Where the two disagree the copy changes today
      and the code changes when it can — the alternative is teaching one register and
      calling it the language, which is the thing this question exists to avoid.
    */
    'Portugal speaks to you differently depending on your age, and expects you to speak back the same way. This decides which version the example sentences come in, and tells you what it means when somebody switches.',
  options: [
    { id: 'under25', label: 'UNDER 25' },
    { id: '25to39', label: '25 TO 39' },
    { id: '40to59', label: '40 TO 59' },
    { id: '60plus', label: '60 OR MORE' },
  ],
  skip: 'SKIP THIS',
  /*
    Skipping is a real answer and gets a real behaviour, not a shrug.

    tu is what the graph is written in, it is what anybody under sixty will hear from
    somebody their own age, and every line that has a formal version shows it underneath.
    Saying "the middle ground" was the vaguer half of the same promise the headline used
    to break.
  */
  skipNote: 'Then we will use tu, which is what you will hear from anybody near your own age — and every line shows the formal version underneath.',
}

export const GOAL_QUESTION: ProfileQuestion = {
  id: 'goal',
  eyebrow: 'LAST ONE',
  askerLine: 'There is no wrong answer, and the last one is a real one.',
  headline: 'Why are you here?',
  why:
    /*
      What answering this actually does, said accurately.

      It claimed to change what you are taught next, and it does not: `goal` is read on
      the proof card and nowhere else. What it genuinely buys is a marker — how much of
      the language for this you already have, and which piece is next — which is a more
      useful thing to be told than a percentage.
    */
    'Your card will tell you how close you are to it, and which piece is next. It does not change the order of anything — it just stops the number being abstract.',
  options: [
    { id: 'trip', label: 'I’VE GOT A TRIP COMING', sub: 'days or weeks, not years' },
    { id: 'someone', label: 'SOMEONE IN MY LIFE SPEAKS IT', sub: 'and I would like to keep up' },
    { id: 'moving', label: 'I’M MOVING THERE', sub: 'or seriously thinking about it' },
    { id: 'work', label: 'IT’S FOR WORK', sub: 'colleagues, clients, calls' },
    { id: 'curious', label: 'NO REASON. I JUST LIKE IT', sub: 'the best reason there is' },
  ],
  skip: 'NOT SURE YET',
  skipNote: 'Fair enough. We will keep giving you the things people actually say.',
}

export const QUESTIONS_IN_ORDER = [GENDER_QUESTION, AGE_QUESTION, GOAL_QUESTION]

/**
 * The payoff. A 56-year-old Englishman needs to know how HE should speak — not how a
 * 30-year-old American woman should. So the answers come back as his forms, with the
 * ones that are not his shown greyed beside them.
 */
export const GENDER_PAYOFF: Record<LanguageGender, { yours: string; theirs: string; en: string }[]> =
  {
    m: [
      { yours: 'Obrigado.', theirs: 'Obrigada.', en: 'Thank you.' },
      { yours: 'Sou inglês.', theirs: 'Sou inglesa.', en: 'I’m English.' },
      { yours: 'Estou cansado.', theirs: 'Estou cansada.', en: 'I’m tired.' },
      { yours: 'Estou pronto.', theirs: 'Estou pronta.', en: 'I’m ready.' },
    ],
    f: [
      { yours: 'Obrigada.', theirs: 'Obrigado.', en: 'Thank you.' },
      { yours: 'Sou inglesa.', theirs: 'Sou inglês.', en: 'I’m English.' },
      { yours: 'Estou cansada.', theirs: 'Estou cansado.', en: 'I’m tired.' },
      { yours: 'Estou pronta.', theirs: 'Estou pronto.', en: 'I’m ready.' },
    ],
  }

export const GENDER_RULE: Record<LanguageGender, string> = {
  m: 'Almost anything you say about yourself ends in -o. That is the whole rule, and you now own it.',
  f: 'Almost anything you say about yourself ends in -a. That is the whole rule, and you now own it.',
}

export const AGE_PAYOFF: Record<AgeBand, { headline: string; body: string }> = {
  under25: {
    headline: 'You will get tu almost everywhere.',
    body:
      'Portugal is informal with people your age, and you can be informal straight back. Podes repetir? is right nearly all the time.',
  },
  '25to39': {
    headline: 'Tu with your own age, você in a bank.',
    body:
      'Roughly: tu with anyone about your age or younger, você with someone much older or somewhere official. Podes repetir? and Pode repetir? are the same question, one step apart.',
  },
  '40to59': {
    headline: 'Shops will mostly use você with you.',
    body:
      'That is not distance, it is the default politeness. You can still use tu with friends and with anyone noticeably younger, and nobody will blink.',
  },
  '60plus': {
    headline: 'You will be given o senhor or a senhora a lot.',
    body:
      'That is respect rather than formality for its own sake. Tu stays for people you actually know, and você is your safe setting with everyone else.',
  },
}

export const AGE_PAIR = { tu: 'Podes repetir?', voce: 'Pode repetir?', en: 'Can you repeat?' }

/**
 * What stands between the learner and the thing they said they wanted. Every entry maps
 * to pieces the graph can genuinely teach — promising a capability the content cannot
 * deliver would be the most expensive lie in the product.
 */
export const GOAL_NEEDS: Record<Goal, { label: string; pieces: string[] }[]> = {
  trip: [
    { label: 'asking for something at a counter', pieces: ['preciso_de'] },
    { label: 'ordering it the way you actually want it', pieces: ['com', 'sem'] },
    { label: 'when you did not catch what they said', pieces: ['outra_vez'] },
    { label: 'pointing at something and needing its name', pieces: ['como_se_chama'] },
    { label: 'the moment after you get it wrong', pieces: ['desculpa'] },
    { label: 'agreeing a time with somebody', pieces: ['amanha'] },
  ],
  someone: [
    { label: 'asking them to come with you', pieces: ['comigo'] },
    { label: 'telling them you were thinking about them', pieces: ['estavas_a'] },
    { label: 'apologising so it actually lands', pieces: ['desculpa'] },
    { label: 'telling them they matter', pieces: ['importa'] },
    { label: 'making a plan for tomorrow', pieces: ['amanha'] },
    { label: 'take back what you just said', pieces: ['queria_dizer'] },
  ],
  moving: [
    { label: 'asking for something at a counter', pieces: ['preciso_de'] },
    { label: 'ask what happened', pieces: ['o_que_acontece'] },
    { label: 'ask to change something', pieces: ['mudar'] },
    { label: 'say you can’t', pieces: ['nao_podes'] },
    { label: 'when you did not catch what they said', pieces: ['outra_vez'] },
    { label: 'introduce yourself', pieces: ['chamo_me'] },
  ],
  work: [
    { label: 'introduce yourself', pieces: ['chamo_me'] },
    { label: 'ask who someone is', pieces: ['como_te_chamas'] },
    { label: 'ask for a repeat without losing face', pieces: ['outra_vez'] },
    { label: 'buy yourself a moment', pieces: ['agora', 'tens'] },
    { label: 'be firm without being rude', pieces: ['nao_vou'] },
    { label: 'check you understood', pieces: ['e_verdade'] },
  ],
  curious: [],
}

export const GOAL_LABEL: Record<Goal, string> = {
  trip: 'the trip',
  someone: 'keeping up with them',
  moving: 'living there',
  work: 'work',
  curious: 'no particular destination',
}
