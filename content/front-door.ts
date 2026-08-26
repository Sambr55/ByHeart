/**
 * The two fixed beats. Everything after these belongs to the learner (§20.13).
 *
 * The copy below is verbatim from §02A. It is the one place in the product where the
 * wording is not ours to improve: the landing proposition and the Goose demonstration
 * are specified word for word, and the demo exists to show the mechanic before anyone
 * is asked to imagine it.
 */

/*
  The landing opens on the reader's experience, not on a compliment.

  It used to describe the method and never say what you would be able to DO — and it
  opened by telling somebody they already know more than they think, which is a nice
  thing to say to a stranger who has not asked. "You will understand far more than you
  can say" is the line doing the work now: it is true of every learner, it is exactly the
  Netflix-subtitles experience, and no other language app opens by naming the problem
  instead of promising the cure.

  The old closing line survives, and is better for having something concrete in front of
  it.

  THIS COPY DEPENDS ON CONTENT. The moment the landing promises a Legend, the first
  session has to be able to deliver one — three frames are reachable at rung 1 and
  lint:content fails if that ever drops below two. Do not restore this promise if that
  rule is ever relaxed.
*/
export const LANDING = {
  wordmark: 'DUB',
  /**
   * The door.
   *
   * This was four lines of argument — the wall every learner hits, what DUB does about
   * it, and a reassurance — delivered before anybody had seen a word of Portuguese. It
   * was a good essay and it was a front door made of prose.
   *
   * A place does the arguing now. "Learn Language You Love" is the whole proposition in
   * four words, and everything the four lines used to say is proved two taps later by
   * the Goose demo, which is a demonstration rather than a claim.
   */
  strapline: 'Learn Language You Love',
  /** A door, and the Club is on the other side of it. */
  cta: 'COME IN',
  /**
   * What the picture is, for anybody who cannot see it.
   *
   * Not "a beautiful street in Lisbon" — a screen reader user is owed the same
   * information the image carries, which is where this is and what time of day it feels
   * like, not an adjective about how nice it looks.
   */
  hero_alt:
    'A steep Lisbon street at golden hour: tiled façades, a yellow tram climbing towards the Tejo, people talking at a café table on the pavement.',
} as const

export interface DemoBeat {
  key: 'recognise' | 'build'
  /**
   * The quiet line ABOVE the big one, setting it up.
   *
   * Without it the first thing a stranger meets is four words shouted in caps with no
   * frame around them. The line tells them what they are looking at before they have to
   * work it out, which is the difference between a demonstration and a non sequitur.
   */
  lead?: string
  /** The big thing on screen. */
  display: string
  /** The quiet line under it. */
  gloss?: string
  /** Staged in on the same screen, after the recognition has landed. */
  translation?: { pt: string; en: string }
  /** Staged in last: the piece the line just handed over. */
  takeaway?: { display: string; gloss: string }
  /** The explosion. */
  branches?: { pt: string; en: string }[]
  /** Shown under the branches on the final beat. */
  close?: string
  cta: string
}

/**
 * Beats 3 and 4 are reveals, not exercises. The branch phrases are the payoff of the
 * demonstration — showing them as wrong answers in a quiz, which is what the old
 * Mission 01 did, inverts the whole point of the beat.
 */
/**
 * Two screens, not five.
 *
 * Recognition, translation and extraction are one thought, so they belong on one screen
 * with the translation animating in and the takeaway arriving after it — splitting them
 * across three taps made the learner work for a reveal that should feel like a magic
 * trick. The culture-free release has moved out of the demo entirely: every root ends
 * with one, so proving it here as well only delayed the learner's own choice.
 */
export const DEMO_BEATS: DemoBeat[] = [
  {
    key: 'recognise',
    lead: 'Here’s a line you might recognise:',
    display: 'TALK TO ME, GOOSE.',
    gloss: 'You already know what Maverick means.',
    translation: { pt: 'FALA COMIGO, GOOSE.', en: 'Talk to me, Goose.' },
    takeaway: {
      display: 'COMIGO = WITH ME',
      gloss: 'That one familiar line just gave you something useful.',
    },
    cta: 'SHOW ME WHAT THAT UNLOCKS',
  },
  {
    key: 'build',
    display: 'One line. Three things you can say.',
    branches: [
      { pt: 'Vem comigo.', en: 'Come with me.' },
      { pt: 'Fica comigo.', en: 'Stay with me.' },
      { pt: 'Podes vir comigo?', en: 'Can you come with me?' },
    ],
    close:
      'That’s DUB. Start with something you connect with. Find the useful language inside it. Make it yours.',
    cta: 'MY TURN',
  },
]

/**
 * Choosing a language, after the demo rather than before it.
 *
 * A selector at the front asks for a commitment before the learner has been shown what
 * they would be committing to. The Goose moment IS the argument, so it goes first —
 * and having it go first is what earns the transition line, which turns setup admin
 * into the second beat of the story rather than a form.
 */
export const PAIR_STEP = {
  eyebrow: 'ONE DECISION',
  headline: 'That was Portuguese. Where do you want DUB to take you?',
  sub: 'One is built. The others are honest about not being — nothing here will take your email and promise to let you know.',
  soon: 'COMING SOON',
  source_label: 'Learning from',
  source_change: 'Change',
  /**
   * Revealed under the source line rather than asked as a screen of its own: a
   * mandatory second question with exactly one available answer is a tax, not a choice.
   */
  source_note:
    'Which vibes you get depends on the culture you already carry, not the language you speak — Top Gun and Bridget Jones work because of shared anglophone media. Other cultures need their own vibe libraries, and those are not built yet.',
  cta: 'LET’S GO',
  after: 'Let’s find your Portuguese.',
} as const

export const DEMO_CLOSE =
  'That’s DUB. Start with something you connect with. Find the useful language inside it. Make it yours.'

/**
 * The deal — §02B.
 *
 * Placed after the demo rather than before it, because showing beats telling: by the
 * time a person reads this they have already had the trick done to them once and are
 * asking "what is this, actually?". This screen answers that question and no other.
 *
 * The negative block is not a joke. It is the product's whole position, and stating it
 * out loud on the way in is what stops a learner measuring DUB by the thing DUB has
 * deliberately refused to build.
 */
export const DEAL = {
  eyebrow: 'BEFORE YOU START',
  headline: 'Here’s the deal.',
  how: {
    label: 'HOW IT WORKS',
    steps: [
      'Start with something you connect with.',
      'We pull out the useful language hiding inside it, and you keep it.',
      'Then we take it all away and find out whether it stuck.',
    ],
  },
  /**
   * The stages were being shown as a number on a screen before anything had explained
   * what they were — "you are at 5" means nothing to somebody who has never been told
   * there are six of them or what they lead to. This block is that explanation, and it
   * is deliberately the most visual thing on the page.
   */
  /**
   * The Legend, explained where it is sold.
   *
   * It is the biggest thing DUB offers and the deal screen mentioned it in prose exactly
   * never — one line inside a diagram, naming it without saying what it is. Somebody
   * deciding whether to start was being asked to want a thing they had not been told
   * about. (The single line that did mention it was cut in a pass that made the screen
   * shorter, which is how a trim quietly removes the argument.)
   *
   * It is carried by the QUESTIONS rather than by adjectives. Ten real questions in
   * Portuguese, four of which anybody can recognise on sight, does the persuading that
   * "personalised profile" never would — and it is the honest shape of the thing: not a
   * speech, a handful of answers.
   */
  legend: {
    label: 'THE LEGEND',
    head: 'The minute about yourself you can say without thinking.',
    /** The name is doing real work, so the reason for it is worth ten words. */
    why: 'An operative learns a legend until it comes out without being assembled, because hesitation is what gives you away. Yours is the same idea, except all of it is true.',
    intro: 'Every conversation in Portugal opens with the same handful of questions:',
    questions: [
      { pt: 'Como te chamas?', en: 'What are you called?' },
      { pt: 'De onde és?', en: 'Where are you from?' },
      { pt: 'Que idade tens?', en: 'How old are you?' },
      { pt: 'Tens filhos?', en: 'Do you have children?' },
      { pt: 'Porquê Portugal?', en: 'Why Portugal?' },
    ],
    more: 'Ten in all.',
    close: 'You build it a piece at a time, out of language you already own — so the answers come out in your own Portuguese rather than a phrase you memorised. It opens five vibes in.',
  },

  /**
   * Where it goes. Drawn by <Path>, not described here.
   *
   * This block used to be THE SIX STAGES — a hundred-word briefing on a ladder the
   * product no longer surfaces anywhere, delivered before the learner had seen a single
   * word of Portuguese. It was the longest thing on the screen and the least useful. The
   * question somebody actually has at this point is "where does this end up", and the
   * answer is a picture.
   */
  path: {
    label: 'WHERE IT GOES',
    note: 'You never lose a vibe, and nothing expires if you disappear for a month.',
  },
  collect: {
    label: 'WHAT YOU KEEP',
    // HOW IT WORKS already says you keep them, so this only has to say the part that
    // is surprising: that they combine across crates.
    note: 'And they combine — a word out of a Bond title finishing a sentence that started in Bridget Jones.',
    examples: ['comigo', 'onde', 'quanto', 'ajuda', 'ele', 'segunda-feira'],
  },
  ask: {
    label: 'WHAT WE ASK',
    lines: [
      'Ten minutes on the days you feel like it — not every day, we will not ask.',
      'Say it out loud. Reading it is not the same thing.',
    ],
  },
  get: {
    label: 'WHAT YOU GET',
    lines: [
      'Sentences you can say cold, to a real person, without rehearsing first.',
      'Counted honestly — the number only moves when there is nothing on screen to copy from.',
    ],
  },
  not: {
    label: 'WHAT THIS IS NOT',
    line:
      'No streaks, no points, no lives. A thousand-day streak has never once helped anybody order a coffee.',
  },
  cta: 'I’M IN',
} as const

/** §08 / §09 — the first meaningful learner choice, and it comes after the demo. */
export const PICKER = {
  /*
    "Vibe", not "area".

    The spec offered either and asked for the call. Every other surface in the product
    already says crate — the menu, the header, the route, the badges — so introducing a
    second noun for the same object here would be a split, and the headline is the one
    place a reader meets the word with something to point at.
  */
  headline: 'Pick a vibe you connect with.',
  /** One line, not a banner, and only once the Legend is a thing they have. */
  feeds_legend: 'Everything in here feeds your Legend.',
  /*
    Why the rest of the shelf is dimmed on somebody's first visit.

    Five of the eleven crates have nothing at rung 1, so picking one of those first hands
    a beginner rung-2 or rung-6 content before they can say hello. The basics is the
    doorway rather than a tax: one section, then everything opens.
  */
  basics_first: 'Opens once you have been through a section of the basics — everything here assumes you can already say hello.',
  /** Shown above the list while that is still true. */
  /** The headline before there is anything to pick between. */
  basics_first_headline: 'Start here.',
  basics_first_head: 'The basics come first.',
  basics_first_sub:
    'One session, built out of things you have heard a hundred times: hello, please, thank you, yes, no, and counting to ten. Then every vibe is yours to pick from.',
  /*
    The sub is gone.

    It was the only place the word crate was defined, which would normally make deleting
    it risky — except the deal screen already introduces it, and the deal always comes
    first: "Pieces from different crates combine — a word out of a Bond title finishing a
    sentence that started in Bridget Jones." The word arrives with an example attached,
    which beats the definition it replaces.
  */
  sub: '',
  /*
    The list is sorted, and nobody can see it.

    The picker has ranked crates for months — live drops, open, in progress, explored as
    far as your stage reaches, finished, unreachable — and a silent sort of eleven
    near-identical cards is invisible. Nobody infers a five-tier ranking from card order.
    So the groups are labelled and the ranking becomes readable rather than felt.
  */
  groups: {
    open: 'Open now',
    later: 'Opens as you go',
    done: 'You have been through these',
    pro: 'Comes with DUB Pro',
    drops: 'Drops',
  },
  /*
    The most useful sentence on the screen, and it only appears when it is true.

    When nothing is open, no ordering rescues the list — every card is a dead end and the
    learner has to scroll eleven of them to work that out. This says it first. It is also
    the most honest paywall moment in the product: they are not being blocked from
    starting, they have genuinely used what the free tier offers.
  */
  /*
    Two different reasons nothing is open, and only one of them is about money.

    There was one message and it always blamed the plan — so a stage-1 learner who had
    simply bounced off the four crates their ladder reaches was told they had used up
    their free tier and should pay. A false paywall, shown to somebody who had not hit
    any limit at all, at the exact moment they were most likely to leave.
  */
  nothing_open: 'Nothing new is open right now.',
  nothing_open_paid:
    'Or go through one you have already opened — the second pass is where it sets.',
  nothing_open_ladder:
    'Not because of your plan \u2014 the rest open further up the ladder, and you move up by saying something cold. Go through one you have already opened; the second pass is where it sets.',
  // A whole sentence now. It used to stop mid-clause — "...making progress and " — and
  // be finished by a link underneath the card, so anybody who did not notice the link
  // read a truncated sentence and nothing else.
  join_up: 'Your three free vibes are already chosen. Tap to see what membership opens.',
  /**
   * Shown only when a drop is actually live. The distinction is worth one sentence and
   * not a paragraph — and the last clause is the promise that stops a drop feeling like
   * a trick played on people who were busy that week.
   */
  drop_note:
    'The one with a date is a drop. It is pegged to something really happening and it disappears the morning after — but whatever you learn inside it is yours to keep.',
  /** Shown under the list whenever something is still dimmed. */
  locked_note:
    'The dimmed ones are not gone. Each says what opens it — and it opens by saying something cold, with nothing on screen to copy from, not by turning up.',
  /** The affordance on the stage band, which used to be a number with no explanation. */
  stages_toggle: 'all six',
  /**
   * Said once, quietly, under the list. Not a banner and not a countdown — the three
   * crates are a real product, and somebody a fortnight in has not run out of anything.
   */
  plan_note: 'Three vibes are yours for good, and every drop is always open.',
  plan_cta: 'What DUB adds',
  cta: 'START HERE',
} as const

/** §09 (7:30–8:35) — no cue, no styling, no culture. The absence is the point. */
/*
  What actually happens when a beginner gets it wrong in Portugal.

  The premise most language apps encode is that the consequence of broken Portuguese is
  being corrected. It is not. Correction is rare, and it is a sign of warmth. The
  overwhelmingly common response is the switch to English — done kindly, done to be
  helpful — and it ends the conversation as a Portuguese conversation.

  Told once, at a release beat, after a third failed check. It is the single most
  respectful screen in the product because it tells the learner the truth about the
  country instead of letting them think the difficulty is theirs.
*/
/*
  The release, in the learner's words.

  The screen before the drain showed the cultural cue a second time and said nothing
  else — so it read as the title repeated, and the tap that follows had no meaning. It is
  the most important beat in the product: the only one that moves the ladder, and the only
  one that produces a sentence for the card.

  What was missing was not decoration. It was the sentence explaining what is about to
  happen and why the learner should want it.
*/
export const RELEASE = {
  eyebrow: 'LAST TIME',
  /** Said once, plainly, on the screen where the scaffolding is still standing. */
  why: 'This is the part you were leaning on. You have taken what you need out of it, so now it goes — and the next sentence is yours, with nothing on screen to copy from.',
  cta: 'TAKE IT AWAY',
  /** After the drain, above the build. */
  ask_eyebrow: 'NO CLUES',
} as const

export const THE_SWITCH = {
  eyebrow: 'NOBODY WARNS YOU',
  line: '“Sorry — do you speak English?”',
  body: 'That is what happens. Not because you were bad at it — because they are being kind, and switching is the kindest thing they can think of.',
  answer: 'This is the sentence that answers it. Say it early and they stay in Portuguese.',
  repair: 'Estou a aprender. Tenha paciência.',
  repair_en: 'I am learning. Bear with me.',
  cta: 'GOT IT',
} as const

export const NO_CUE_PROMPTS = [
  /*
    Rung-1 prompts, and the reason they had to be written.

    All eight original prompts needed a rung 2–4 piece except one, so a beginner reached
    the three cold screens — the emotional high point of a section, where the culture is
    gone and they say something themselves — owning nothing any of them asked for. Four
    of five openable crates produced three consecutive identical filler screens.

    These require only pieces a first section actually hands over. NoCueView also gates on
    how many are answerable now, so it can never again render a prompt nobody can meet.
  */
  {
    context: 'You walk into a bakery. Somebody looks up from behind the counter.',
    ask: 'Hello, good morning.',
    answer: 'Olá, bom dia.',
    requires: 'ola',
  },
  {
    context: 'They are offering you another coffee and you have had three.',
    ask: 'No, thank you.',
    answer: 'Não, obrigado.',
    requires: 'nao',
  },
  {
    context: 'They have carried your bag up two flights of stairs.',
    ask: 'Thank you very much.',
    answer: 'Muito obrigado.',
    requires: 'obrigado',
  },
  {
    context: 'Somebody wants an answer about Saturday and you genuinely do not know.',
    ask: 'Maybe yes, maybe no.',
    answer: 'Talvez sim, talvez não.',
    requires: 'talvez',
  },
  {
    context: 'The row is full and your seat is in the middle of it.',
    ask: 'Excuse me, may I get past.',
    answer: 'Desculpe, com licença.',
    requires: 'desculpe',
  },
  {
    context: 'You have found a table outside and somebody comes over.',
    ask: 'A glass of wine, please.',
    answer: 'Um copo de vinho, por favor.',
    requires: 'vinho',
  },
  {
    context: 'They are holding the lid open and waiting.',
    ask: 'With cheese, please.',
    answer: 'Com queijo, por favor.',
    requires: 'queijo',
  },
  {
    context: 'Three of you at the counter, and it is your round.',
    ask: 'Three coffees, please.',
    answer: 'Três cafés, por favor.',
    requires: 'tres',
  },
  {
    context: 'It is late, you have been walking all day, and somebody asks how you are.',
    ask: 'I am hungry.',
    answer: 'Tenho fome.',
    requires: 'fome',
  },
  {
    context: 'You are leaving a shop and they have been kind to you.',
    ask: 'Goodbye, see you later.',
    answer: 'Adeus, até logo.',
    requires: 'adeus',
  },
  {
    context: 'Somebody has put out a hand and you have half a second.',
    ask: 'Hello, my name is Sam.',
    answer: 'Olá, chamo-me Sam.',
    requires: 'chamo_me',
  },
  {
    context: 'You are trying to pin somebody down to a night out.',
    ask: 'Maybe on Saturday.',
    answer: 'Talvez no sábado.',
    requires: 'sabado',
  },
  {
    context: 'A café. Someone is about to walk out.',
    ask: 'Come with me.',
    answer: 'Vem comigo.',
    requires: 'comigo',
  },
  {
    context: 'You didn’t catch what they said.',
    ask: 'Can you say it again?',
    answer: 'Podes dizer outra vez?',
    requires: 'outra_vez',
  },
  {
    context: 'You arrive, and you are late.',
    ask: 'Sorry I’m late.',
    answer: 'Desculpa o atraso.',
    requires: 'desculpa',
  },
  {
    context: 'You need to get somewhere.',
    ask: 'I need a taxi.',
    answer: 'Preciso de um táxi.',
    requires: 'preciso_de',
  },
  {
    context: 'Someone asks whether today works.',
    ask: 'Tomorrow.',
    answer: 'Amanhã.',
    requires: 'amanha',
  },
  {
    context: 'You meet someone new.',
    ask: 'My name is Sam.',
    answer: 'Chamo-me Sam.',
    requires: 'chamo_me',
  },
  {
    context: 'A friend is panicking.',
    ask: 'Easy.',
    answer: 'Calma.',
    requires: 'calma',
  },
  {
    context: 'Someone asks if you can talk.',
    ask: 'Not now.',
    answer: 'Agora não.',
    requires: 'agora',
  },
]

export const CLOSE = {
  eyebrow: 'YOU ALREADY KNOW MORE THAN YOU THINK.',
  /**
   * Back into the product, not out to a form about it. The end of a good session is the
   * worst possible moment to hand somebody a survey — feedback is a standing menu item
   * and one quiet line here, never the only exit.
   */
  sub: 'That is yours now. From here on DUB opens on your own page — no front door, no starting again.',
  cta: 'INTO DUB CLUB',
  feedback: 'Something not land? Tell us.',
} as const

/**
 * The gateway. What happens when the free three are gone.
 *
 * There was nothing here. A learner who did the basics and picked two crates reached a
 * small grey box reading "nothing new is open right now", which named Pro in prose with
 * no link on it and never mentioned the Legend — so the moment the product had spent
 * three crates building towards arrived as a dead end. This is the ask, and it is the
 * only place in the app that makes one.
 */
export const GATEWAY = {
  eyebrow: 'THAT IS THE FREE THREE',
  headline: 'Basics and two vibes. That is the free part done.',
  // The picture above it already says where this goes. Repeating it in prose was the
  // longest sentence on the screen and taught nobody anything.
  body: 'Everything you kept stays yours, whatever you decide.',
  cta: 'WHAT MEMBERSHIP OPENS',
} as const
