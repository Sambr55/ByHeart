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
 *   5. What you are into last, because nothing downstream is wrong while it is unanswered.
 *      It is simply not yet known.
 *
 * THE ONE DELIBERATE EXCEPTION IS EMAIL, which sits at step three rather than last. It is
 * not a card question and by the rule above it should be at the end — but the rule is about
 * what the ROAD is for, and email is about what happens if the road is abandoned. Asked
 * last it protects nothing that came before it, and the learner likeliest to lose work is
 * the one who never reaches the end. See the note on the step itself.
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
    because: 'Your name and where you are from — the answer every later line needs.',
  },
  {
    root: 'tb_email',
    family: 'the_basics',
    because: 'Qual é, and somewhere to send the work before there is a road of it to lose.',
  },
  {
    root: 'tb_thank_you',
    family: 'the_basics',
    because: 'Which of obrigado/obrigada is yours. Until this is answered every gendered line is a guess.',
  },
  {
    root: 'tb_married_work',
    family: 'the_basics',
    because: 'Your status — sou, and the ending that agrees with you.',
  },
  {
    root: 'tb_work',
    family: 'the_basics',
    because: 'What you do, which is the question that follows it and has nothing to do with it.',
  },
  {
    root: 'tb_age',
    family: 'the_basics',
    because: 'Tenho and anos, and the number that is yours.',
  },
  {
    root: 'tb_why',
    family: 'the_basics',
    because: 'Porque — why you are here at all.',
  },
  /*
    tb_patience IS NOT HERE — see the note below the road.

    Sam: "remove bear with me I am learning - and make a note to add it to the Repair Kit
    which we are going to move into cheats/hacks later."
  */
  {
    root: 'tb_into',
    family: 'the_basics',
    because: 'Gosto de, and what they are into — which decides what the Club offers them.',
  },
]

/*
  WHAT CAME OFF THE ROAD, AND WHERE IT WENT.

  tb_patience taught "Estou a aprender. Tenha paciência." — bear with me, I am learning.
  Sam: "remove bear with me I am learning - and make a note to add it to the Repair Kit
  which we are going to move into cheats/hacks later."

  IT IS ALREADY IN THE REPAIR KIT. REPAIR_KIT in content/legend.ts has carried the line
  since it was written, alongside "Desculpe, pode falar mais devagar?", "Não percebi." and
  "Como se diz…?" — so taking the root off the road loses the lesson and keeps the
  sentence, which is the right way round for a phrase whose whole job is to be reached for
  rather than recited.

  TO DO, when the repair kit moves into cheats/hacks: it is four sentences that rescue a
  conversation, which is exactly the shape of a BLUFF — see content/cheats.ts, where the
  five bluffs already do this job. The kit should become bluffs rather than sitting in
  content/legend.ts as a list nothing renders as cards.

  `portuguese` was the card question tb_patience answered. It comes off the card with the
  root, because the card is what the road answers — see cardFor.

  THE TWO STEPS THAT ARE NOT CARD QUESTIONS, and why each earns its place anyway.

  Neither tb_into nor tb_email is on the seven-card Legend: `into` is a depth 'deeper'
  frame and email is not a frame at all, it is a profile field. By the road's own rule —
  if it is not needed to build the card, it is not on the road in — both would be cut.

  They stay, for two different reasons, and the reasons decide where they sit.

  tb_into is LAST because it is about what comes after the door: gosto de is the shape half
  the Club's interest content is built on, and the answer decides what the feed offers. It
  costs nothing to be unanswered until the road is walked, so it waits.

  tb_email is THIRD because it is about what happens if the road is never walked. It is the
  only step whose value is entirely in being answered EARLY — an address given at the end
  protects none of the work that came before it. See the note on the step.

  The rule still holds for everything else, which is the point of writing the exceptions
  down rather than quietly widening it.
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
