/**
 * THE GAP BETWEEN SITTINGS, TAUGHT RATHER THAN SPENT.
 *
 * Sam, on the road growing to four sittings: "add a keep going? mechanic between each
 * sitting, but make them fun and add some Portuguese learning at every sitting break.
 * Make sure each is different. So for instance it would be an obvious place to teach
 * vamos-la. Obvs if they choose to come back later they will have to give us their email
 * to save progress. We should really encourage them to get to the end of their legend."
 *
 * WHY THIS EXISTS AT ALL. The road picked up two more roots — tb_into and tb_email, which
 * were the only asking roots outside it — and that pushed a visiting learner from three
 * sittings to four. A fourth stopping point is a fourth chance to leave, and the honest
 * answer to that is not to hide the break but to make it worth arriving at.
 *
 * WHAT A BREAK IS. One short Portuguese expression, of the kind nothing else in this
 * product has a home for: the words Portuguese people actually say to keep something
 * moving. Vamos lá. Já está. Falta pouco. They are useless in a lesson about counting and
 * exactly right at the moment somebody is deciding whether to carry on, because that is
 * what they MEAN — and a learner who reads one at that moment has been taught the phrase
 * by the situation rather than by a card.
 *
 * EACH ONE DIFFERENT, and in order, because they describe the shape of the journey: let's
 * go, then not far now, then nearly there, then done. Sam: "make sure each is different."
 * The fourth is the only one that celebrates, because it is the only one that should.
 *
 * NOT A GATE AND NOT A SCORE. Nothing is counted, nothing is unlocked, and the phrase is
 * not tested. It goes into the library the same way any other word does if they tap it,
 * and a learner who reads it and carries straight on has lost nothing.
 */
import type { Shelf } from '@/content/roots'

export interface SittingBreak {
  /** Which break this is — the first is shown after the first sitting. */
  after: number
  /** The expression itself. */
  pt: string
  en: string
  /** What it is doing, in the words somebody would use about it. */
  gloss: string
  /** Where it belongs in the library, for the learner who keeps it. */
  shelf: Shelf
  /** The line above it, which is about the journey rather than the phrase. */
  where: string
  /** What the button says. Portuguese, because by now they can read it. */
  cta: string
}

export const BREAKS: SittingBreak[] = [
  {
    after: 1,
    /*
      THE ONE SAM NAMED, and it is first because it is what you say at a beginning.

      "Vamos lá" is vamos — already taught, and already on this learner's shelf — with a
      lá on the end that turns "we go" into "come on then". That is the cheapest possible
      lesson: one new word, attached to one they own, at the moment it is true.
    */
    pt: 'Vamos lá.',
    en: 'Come on then. / Let’s go.',
    gloss:
      'You already have vamos. Add lá and it stops being “we go” and becomes what somebody says to get a thing started — a meal, a walk, a difficult conversation.',
    shelf: 'just_say',
    where: 'One sitting down.',
    cta: 'VAMOS LÁ',
  },
  {
    after: 2,
    /*
      THE ONE THAT MEASURES WHAT IS LEFT, said the way Portugal says it: not "a little
      remains" but "little is missing". The verb is the interesting half and it is the
      half English does not have.
    */
    pt: 'Falta pouco.',
    en: 'Not far now.',
    gloss:
      'Faltar is the verb for something being missing, and Portuguese counts what is LEFT rather than what is done. Falta pouco — little is missing. You will hear it about a journey, a queue and a deadline.',
    shelf: 'small_words',
    where: 'Halfway.',
    cta: 'FALTA POUCO',
  },
  {
    after: 3,
    /*
      THE ONE THAT IS ALMOST THERE. `quase` is the word this product has been missing —
      it turns every adjective into a hedge and it is one of the first words anybody
      actually needs.
    */
    pt: 'Quase.',
    en: 'Almost.',
    gloss:
      'One word, and it does everything English needs three for. Quase pronto — almost ready. Quase lá — nearly there. Said on its own it is a whole answer.',
    shelf: 'small_words',
    where: 'One to go.',
    cta: 'QUASE LÁ',
  },
  {
    after: 4,
    /*
      THE ONLY ONE THAT CELEBRATES, because it is the only one that should. Já está is
      what a Portuguese person says the moment a thing is finished — handing back a card,
      closing a bag, finishing a job — and it is the right sentence to hand somebody at
      the end of their Legend.
    */
    pt: 'Já está.',
    en: 'That’s it. / Done.',
    gloss:
      'Já is “already” and está is “it is” — together they are what somebody says the second a thing is finished. You will hear it from every waiter, every shopkeeper and every friend who has just fixed something.',
    shelf: 'just_say',
    where: 'Your Legend is finished.',
    cta: 'JÁ ESTÁ',
  },
]

/**
 * The break for a learner who has just finished their nth sitting.
 *
 * Past the end it returns the last one rather than nothing, because a learner who comes
 * back for more basics after their Legend is open is still owed a screen — and "Já está"
 * remains true of them.
 */
export function breakAfter(sittings: number): SittingBreak {
  const n = Math.max(1, sittings)
  return BREAKS.find((b) => b.after === n) ?? BREAKS[BREAKS.length - 1]
}
