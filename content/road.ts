/**
 * THE ROAD IN: an authored list of steps, not a computation.
 *
 * Sam, after a week of the door contradicting itself: "we are in a total mess here… I feel
 * we need separate systems for how we get to the Legend and how we run the Club. Getting
 * to the Legend is essentially an information gathering exercise wrapped in learning."
 * And, on the shape: "surely we just have a warm up plus a set number of basics and vibes
 * which populate the legend as best we can."
 *
 * WHY A LIST RATHER THAN A RULE. Five systems used to answer "how far am I" — rungs, the
 * doorway, chosen vibes, stages, and a word count — in five units, three of them visible
 * on one screen at once and none the fraction of another. Every contradiction Sam
 * photographed came from two of them derived separately and drifting: a progress bar
 * reading 10 of 10 above a sentence saying one more session, because the bar counted the
 * card's vocabulary and the door counted sittings.
 *
 * A list cannot do that. The bar is `step N of ROAD.length`, the door is `N === length`,
 * and they are the same number read twice. There is nothing to keep in step because there
 * is only one thing.
 *
 * WHAT EARNS A PLACE ON IT. Every step either teaches a word the Legend card is built from
 * or asks something about the learner. That is the entire admission test, it is asserted
 * by scripts/road-check.mts, and it is what makes the road self-justifying: a person on it
 * is always either learning their card or being asked about themselves, which is the
 * "information gathering wrapped in learning" this is for.
 *
 * NO RUNGS. All twenty basics roots are rung 1, so the ladder never gated anything here —
 * and where it would have, at the forced warm-up, it was already bypassed by a fallback
 * that serves rung-2 Top Gun to a rung-1 learner. It was inert and complicated. Rungs stay
 * in the Club, where content genuinely varies in difficulty.
 *
 * NO VIBE TOLL. The basics teach the whole card for all three purposes — measured — so
 * requiring three chosen vibes before the card would open was asking for payment in a
 * currency the card does not accept. Vibes GROW a Legend now: the deeper questions are
 * what they fill in. Sam: "I buy the idea of vibes growing the legend (plus warm up vibe)."
 *
 * THE CARD IS BUILT ON THE WAY, NOT AT THE END. Sam: "you are literally building the
 * legend as you learn, rather than getting to the legend and then building it from
 * scratch. So the legend part really comes more about learning it, than building it."
 * Every step that asks something writes its answer straight onto the card — see
 * answerLegendFromLesson — so arriving at the Legend means arriving at something already
 * written in your own words.
 */
import type { CultureFamily } from '@/content/roots'
import type { Purpose } from '@/content/situations'

export interface RoadStep {
  /** The root this step plays. */
  root: string
  /** Which crate it comes from, so the journey knows what to open. */
  family: CultureFamily
  /**
   * Why it is on the road, in the author's words.
   *
   * Not decoration: scripts/road-check.mts reads the root and proves the claim, so a step
   * whose reason stops being true fails rather than quietly becoming a detour.
   */
  because: string
  /**
   * Only for learners whose card needs it.
   *
   * The three cards differ in one question — how long are you here, is it your first
   * time, how long have you been here — so three steps are conditional and the rest are
   * everybody's. Absent means every learner takes it.
   */
  only?: Purpose[]
  /**
   * On the road for a reason other than the card, said out loud.
   *
   * The admission test is that every step teaches a Legend word or asks something about
   * the learner, and scripts/road-check.mts enforces it. Exactly one step does neither:
   * the opening wink, which teaches olá and adeus. It is here because the first screen of
   * the product should be something somebody can already say, not because the card needs
   * it — and a rule with a silent exception is the shape of fault this rewrite exists to
   * remove, so the exception is declared rather than allowed for.
   *
   * A second one of these should be argued for, not added.
   */
  not_for_the_card?: true
}

/**
 * THE WARM-UP, which is chosen rather than fixed.
 *
 * Two vibes, and the learner picks one. It is the only step on the road that is a choice,
 * and it is first for the reason Sam gave when he asked for it: somebody should find out
 * what DUB IS — that the Portuguese falls out of something already in their head — before
 * being asked for anything about themselves.
 *
 * It is a real vibe and counts as one: its words go into the inventory and into the Club's
 * reckoning like any other. What it is not is a toll.
 */
export const WARM_UP: CultureFamily[] = ['top_gun', 'bridget_jones']

/**
 * THE BASICS, in the order they are met.
 *
 * Authored, so the sequence is readable in one screen and changing it is an edit rather
 * than a re-derivation. The old order came out of a five-term sort — freebie rank,
 * blocking-ask rank, doorway rank, early rank, signature rank, then rung — whose terms
 * disagreed with each other twice this week.
 *
 * THE ORDER'S OWN ARGUMENT, which the sort used to carry in comments:
 *
 *   1. A wink first. olá/adeus is ten seconds and asks nothing, so the first screen of the
 *      product is something you can already say.
 *   2. Then who you are — the name and where you are from — because two Legend questions
 *      hang on it and every later line that says your name needs the answer.
 *   3. Then gender, because until obrigado/obrigada is settled every gendered line in the
 *      product is a guess, and the basics teach several.
 *   4. Then the rest of the card, in the order the questions come up in a real
 *      conversation: what you do, how old you are, how long you are here.
 *   5. The two remaining asks — what you are into, your email — last, because nothing
 *      downstream is wrong while they are unanswered. They are simply not yet known.
 */
export const ROAD: RoadStep[] = [
  {
    root: 'tb_hello_goodbye',
    family: 'the_basics',
    because: 'The ten-second wink. Asks nothing, teaches two words everybody already half-knows.',
    not_for_the_card: true,
  },
  {
    root: 'tb_introduce',
    family: 'the_basics',
    because: 'Your name and where you are from — two card questions, and the answer every later line needs.',
  },
  {
    root: 'tb_thank_you',
    family: 'the_basics',
    because: 'Which of obrigado/obrigada is yours. Until this is answered every gendered line is a guess.',
  },
  {
    root: 'tb_married_work',
    family: 'the_basics',
    because: 'What you do and whether you are married — the two questions a stranger asks third.',
  },
  {
    root: 'tb_age',
    family: 'the_basics',
    because: 'How old you are, on the picker that teaches every number to a hundred at once.',
  },
  {
    root: 'tb_why',
    family: 'the_basics',
    because: 'Why you are here, which is the card question people most want to answer.',
  },
  /*
    tb_patience AFTER tb_why, WHICH IS A PACKING DECISION AND SAYS SO.

    Both are card roots and neither depends on the other, so the order between them is
    free — and a sitting holds thirty screens. tb_age and tb_why are the two eleven-screen
    roots on the road; with them adjacent, a visitor's third sitting took 22 and had eight
    left, one short of the nine tb_eight_days needs, which spilled a single root into a
    fourth sitting. Separating them closes the road in three.

    This is the thing an authored list can do that a sort could not: the old five-term
    sort had no way to express "these two are interchangeable, so put the short one where
    it fits". Here it is one line moved, with the reason beside it.

    IT DID NOT BUY THE FOURTH SITTING BACK, and the order is kept anyway because it is the
    better sequence — why you are here is a more interesting question than the one about
    patience, and it belongs earlier. Visiting's road is 86 screens against a 90-screen
    budget and its third sitting lands on 22 with nine still to place, one screen over. A
    visitor takes the warm-up and four short sittings; staying and moving take three. The
    honest fix for that is a shorter root, not a longer session.
  */
  {
    root: 'tb_patience',
    family: 'the_basics',
    because: 'The sentence that buys you time, and the card question about your Portuguese.',
  },
  /*
    THE THREE THAT DEPEND ON THE ANSWER, and this is the whole of the difference between
    the cards. A visitor is asked how long they are here, somebody staying whether it is
    their first time, somebody moving how long it has been — and none of the three wants
    the other two. Everybody used to take all three.
  */
  {
    root: 'tb_1234',
    family: 'the_basics',
    because: 'Um and dois — how long you are here, or how long it has been.',
    only: ['visiting', 'moving'],
  },
  {
    root: 'tb_eight_days',
    family: 'the_basics',
    because: 'Semana, for saying how long the trip is.',
    only: ['visiting'],
  },
  {
    root: 'tb_yes_no',
    family: 'the_basics',
    because: 'Sim and não, for whether this is your first time.',
    only: ['staying'],
  },
  /*
    THE LAST TWO ASKING ROOTS, which were the only ones NOT on the road.

    Sam: "the two questions I have to go back for contain the email capture and the
    interests selector. So I think we should break the 7 question rule and just complete
    the lot in one run, and take away any confusion."

    tb_into and tb_email were in the basics' remainder — reachable only once the road was
    walked — so a learner finished the road, opened their Legend, and then found two more
    questions waiting behind it. The road's own promise is that walking it is enough, and
    two questions outside it made that false.

    They are not filler. tb_into teaches gosto de, which is the shape half the Club's
    interest content is built on, and tb_into's answer decides what the feed offers.
    tb_email is how the work survives a lost phone, which is the one thing this product
    cannot recover for somebody.

    THE COST IS A FOURTH SITTING, and that is the trade Sam took: 85 screens to 103 for a
    visiting learner against a 30-screen sitting. What pays for it is the break itself —
    see BREAKS below, which turns the gap between sittings into the one place the product
    teaches something it has nowhere else to put.
  */
  {
    root: 'tb_into',
    family: 'the_basics',
    because: 'Gosto de, and what they are into — which decides what the Club offers them.',
  },
  {
    root: 'tb_email',
    family: 'the_basics',
    because: 'Qual é, and somewhere to send the work if the phone is lost.',
  },
]

/*
  WHAT IS DELIBERATELY NOT ON THE ROAD, and why that is the same decision twice.

  tb_into and tb_email were the last two steps and they made the difference between three
  sittings and four. Neither is on the seven-card Legend: `into` is a depth 'deeper' frame
  and email is not a frame at all, it is a profile field. So both were being asked for
  BEFORE the door by a road whose only job is to reach it.

  They have not been dropped. Interests are the first thing a Club learner is asked — it
  is what drives their feed and it fills a deeper question, which is precisely the work
  Sam wants vibes to do. The email is offered where it has always been most honest: once
  somebody has built something worth not losing.

  The rule this follows, and the one the road is for: if it is not needed to build the
  card, it is not on the road in. It belongs to the Club.
*/

/** The steps this learner takes, which is the road minus the other cards' questions. */
export function roadFor(purpose: Purpose | null): RoadStep[] {
  return ROAD.filter((s) => !s.only || (purpose ? s.only.includes(purpose) : true))
}

/**
 * How far along the road somebody is.
 *
 * THE ONLY ANSWER TO "how far am I", and the whole reason this file exists. The bar reads
 * `done of total` from here and the door reads `done === total` from here, so the two can
 * never say different things — they are one number read twice.
 *
 * The warm-up is a step and is counted: it is a real sitting, its words are kept, and a
 * learner who has done it has genuinely started. Not counting it would put somebody at 0
 * of 12 having just finished something.
 */
export function roadProgress(opts: {
  rootsPlayed: string[]
  sectionsCompleted: string[]
  purpose: Purpose | null
}): { done: number; total: number; open: boolean; next: RoadStep | null; warmedUp: boolean } {
  const played = new Set(opts.rootsPlayed)
  const steps = roadFor(opts.purpose)
  const warmedUp = WARM_UP.some((v) => opts.sectionsCompleted.includes(v))
  const doneSteps = steps.filter((s) => played.has(s.root))
  const next = steps.find((s) => !played.has(s.root)) ?? null
  /* The warm-up is one step, and it is the first. */
  const done = (warmedUp ? 1 : 0) + doneSteps.length
  const total = 1 + steps.length
  return { done, total, open: done >= total, next, warmedUp }
}
