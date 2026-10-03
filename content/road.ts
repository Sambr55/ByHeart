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

/*
  THE WARM-UP IS GONE, and the road is why.

  Sam: "Of course you needed to move the warm up, that is now stale. It needs to go
  completely."

  WHAT IT WAS FOR, AND WHY THAT IS SOLVED. It existed because the shelf was the first thing
  after set-up — eleven tiles with nine of them dimmed and captioned BASICS FIRST, so a
  person's first act in DUB was reading a list of things they could not have. The basics
  were the only way in and they are a poor opening line: hello, thank you, yes and no is
  the most useful content in the product and the least surprising. So a forced choice of
  two vibes was put in front of them, to make the argument — Portuguese falls out of
  something already in your head — before anything was asked.

  The road makes that argument now, on step three, with Sean Connery. Seven of its ten
  steps are a film, a band or a person, and the first vibe arrives before any Legend
  question that needs a gendered form. A separate screen whose only job was to prove the
  concept is a screen proving something the next screen also proves.

  The shelf is not a wall any more either: eight of fourteen crates open at rung 1 against
  two of eleven when the warm-up was written, and the road decides the order regardless of
  what the shelf shows.

  IT ALSO STOPPED BEING FREE. Both warm-up crates picked up a road step when the road
  became vibes — tg_school asks `work`, bj_marrieds asks `married` — so warming up asked a
  Legend question on the first screen of the product, before obrigado/obrigada had settled
  gender. Moving it to two crates the road does not use fixed that and left a step whose
  only remaining argument was "a choice is nice", which is not enough to spend somebody's
  first minute on.
*/

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
  /*
    THE ROAD IS VIBES NOW, ONE PER QUESTION.

    Sam, having an existential crisis about the claim: "We claim a user builds their legend
    out of vibes, but actually they do one warm up vibe and then it's all from basics."
    Then: "Could we get to the seven legend questions from cherry picked phrases from our
    original vibes… rather than doing a whole bond section, could we just pick that one,
    see what you can build out of it, then the payoff and audio test is just for that one
    legend question. Then its the next question - which might be rooted in Bridget or
    Audrey." And: "wire it up."

    So the road is nine steps and seven of them are a film, a band or a person. Each one
    teaches the words for exactly one Legend question, asks that question, and releases the
    sentence the card then holds — the three converged in the previous commit, which is
    what makes a step feel like one thing rather than three.

    WHAT IS LEFT OF THE BASICS, and why only this. Two steps, and neither is a card
    question:

      tb_hello_goodbye — the ten-second wink. The first screen of the product should be
        something somebody can already say, and no film owns olá.
      tb_thank_you — gender. This has to come before the question that draws gendered
        chips, and Sam has reported that bug twice: "it needs to feed the language selector
        so we get ingles/inglesa for the right gender." Nothing in the vibes settles it.

    RUNGS ARE NOT CONSULTED, which is Sam's instruction and worth stating because the
    sequence looks like it ignores difficulty: "rungs dont matter in the legend build. We
    just want seven fun, recognisable statements leading to seven legend answers.
    Everything else is noise. Once we're in the Club we can expand the vibes into wider
    learning and rungs."

    THE ORDER IS CONVERSATIONAL, not pedagogical. It is the order a stranger in a bar
    actually asks: name, where from, married, what you do, how old, why here, what you are
    into. The one departure is gender at the top, for the reason above.

    EMAIL CAME OFF. It was on the old road at step three, justified as protection against
    abandonment rather than as a card question — and that argument was about a sixteen-step
    basics road where somebody might leave halfway. This road is nine steps of recognisable
    culture, and set-up already takes an address. A step that admits it is not for the card
    needs a stronger reason than it now has.
  */
  {
    root: 'tb_hello_goodbye',
    family: 'the_basics',
    because: 'The ten-second wink. Asks nothing, teaches two words everybody already half-knows.',
    not_for_the_card: true,
  },
  /*
    GENDER BEFORE ANYTHING GENDERED, which Sam has had to say twice.

    "Move the Obrigado/Obrigada section right up to the top after name - as the gender needs
    to carry through - specifically to I am__ i am from__ - If I am male, I dont want the
    feminine - Inglesa."

    The very next step asks where you are from and draws inglês/inglesa. No vibe settles
    gender, so this is one of the two basics steps that stay.
  */
  {
    root: 'tb_thank_you',
    family: 'the_basics',
    because: 'Which of obrigado/obrigada is yours. Until this is answered every gendered line is a guess.',
  },
  /*
    NAME, and it is Bond. Sam: "Obviously we have My name is Bond, so rather than doing a
    whole bond section, could we just pick that one."

    jb_name teaches chamo_me and nothing else, releases "Chamo-me Ana." — which is exactly
    what the name frame builds — and its credit now says Sean Connery, Dr. No, 1962. One
    root, one question, one sentence.

    `name` itself is answered in set-up rather than here, so this step teaches the words
    for a sentence the learner can already fill in. That is the right way round: the
    question they have answered is the one they should first hear in Portuguese.
  */
  {
    root: 'jb_name',
    family: 'james_bond',
    because: 'Chamo-me — the most famous introduction in film, and the first Legend sentence.',
  },
  {
    root: 'jb_english',
    family: 'james_bond',
    because: 'Sou and inglês/inglesa. Bond gives his surname, his full name and his nationality in that order.',
  },
  {
    root: 'bj_marrieds',
    family: 'bridget_jones',
    because: 'Casado, solteiro, divorciado — the question the Smug Marrieds ask across a dinner table.',
  },
  {
    root: 'tg_school',
    family: 'top_gun',
    because: 'Trabalho. Viper tells the new class what Top Gun actually is: a school, and you are here to work.',
  },
  /*
    AGE TAKES TWO ROOTS, because the sentence takes two words.

    "Tenho trinta anos" needs tenho and anos. dd_wolf has tenho — Portuguese HAS hunger
    where English IS hungry, the swap that also carries your age — and bow_golden_years has
    anos, which is the whole reason that crate exists. They are adjacent so both halves
    land in one sitting.

    THE SECOND ROOT USED TO BE bj_age, and moving it is the fix for a real fault. `anos`
    was taught by nothing outside the basics except Bridget, so Bridget carried TWO road
    steps — married and age — and a crate with two steps opens on a road root instead of
    its own material: three first-session guarantees and a documented promise, broken.
    Sam: "Remember we can build a new vibe if we need it - dont force it." See
    bowie_golden_years in content/roots.ts.
  */
  {
    root: 'dd_wolf',
    family: 'duran_duran_lisboa',
    because: 'Tenho. Portuguese HAS hunger where English IS hungry — and the same verb carries your age.',
  },
  {
    root: 'bow_golden_years',
    family: 'bowie_golden_years',
    because: 'Anos. Golden Years, and years is the word your age lives in: tenho trinta anos.',
  },
  /*
    ONE AUDREY STEP, NOT TWO. ah_adoro now teaches adoro, quero AND porque — see the merge
    note on it. Two steps in one crate is the fault described above, and Audrey had it for
    the same reason Bridget did.
  */
  {
    root: 'ah_adoro',
    family: 'audrey_hepburn',
    because: 'Porque and quero. Why? Because I want to — which is most people’s real answer.',
  },
  {
    root: 'dd_like',
    family: 'duran_duran_lisboa',
    because: 'Gosto de and música — what you are into, which decides what the Club offers you.',
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
  /** Kept in the signature: callers pass it, and nothing here reads it any more. */
  sectionsCompleted?: string[]
  purpose: Purpose | null
}): { done: number; total: number; open: boolean; next: RoadStep | null } {
  const played = new Set(opts.rootsPlayed)
  const steps = roadFor(opts.purpose)
  const doneSteps = steps.filter((s) => played.has(s.root))
  const next = steps.find((s) => !played.has(s.root)) ?? null
  /*
    THE ROAD IS ITS OWN STEPS AND NOTHING ELSE now the warm-up is gone — see the note on
    its removal. It used to add one for a finished warm-up crate, which is why `done` and
    `total` both carried a +1 that corresponded to no entry in ROAD.
  */
  return { done: doneSteps.length, total: steps.length, open: doneSteps.length >= steps.length, next }
}
