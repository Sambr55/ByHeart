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
  /**
   * The line above it, which is about the journey rather than the phrase.
   *
   * FOURTEEN CHARACTERS, because that is what an eyebrow is. The screen used to
   * truncate this with slice(0, 14) and Sam read the result: "the eyebrow reads ONE
   * SITTING DO". A cut word is not a shorter line, it is a broken one — so these are
   * authored to fit and the screen no longer cuts them.
   */
  where: string
  /**
   * WHAT THE DECISION IS, said in English before either button.
   *
   * Sam: "It is not at all clear that this is a gate where they can save or keep going,
   * but assumes that is what the user reads into Vamos la. Needs to be much clearer
   * sign-posting."
   *
   * He is right, and the reason is structural: the primary button carries the Portuguese
   * phrase this screen just taught, which is the point of the screen — but a button whose
   * label is a lesson cannot also be the instruction. So the instruction goes here, in
   * plain English, directly above the two ways out.
   */
  choice: string
  /**
   * What the button says. Portuguese, because it is the phrase just taught.
   *
   * IT MUST BE THE PHRASE ON THE CARD, not a longer relative of it. The third break
   * taught `Quase.` and its button said QUASE LÁ — a construction the learner has met
   * nowhere, on the one screen whose job is to teach the thing it says. Sam: "the CTA is
   * QUASE LA - we have no idea what that means at this stage."
   */
  cta: string
}

export const BREAKS: SittingBreak[] = [
  {
    after: 1,
    /*
      THE ONE SAM NAMED, and it is first because it is what you say at a beginning.

      IT NO LONGER CLAIMS THEY ALREADY HAVE VAMOS. This said "You already have vamos. Add
      lá and it stops being we go" — and that was false for most learners who read it.
      `vamos` and `lá` are taught by bob_here_we_go, a Bob Marley vibe, which is not on the
      road at all. Sam took Bridget Jones and met the screen anyway: "just because we have
      learned Vem (comigo) doesnt mean we understand vamos."

      He is right, and the fault is the whole authoring premise of these screens rather
      than one sentence. A break has ten seconds and no lesson behind it, so it cannot
      assume ANY vocabulary — the learner reading it might be four roots into the basics
      and nothing else. So the gloss now teaches the phrase from nothing: what each word is,
      then what the two do together.
    */
    pt: 'Vamos lá.',
    en: 'Come on then. / Let’s go.',
    gloss:
      'Vamos is “we go” and lá is “there”. Together they stop meaning either: vamos lá is what somebody says to get a thing started — a meal, a walk, a difficult conversation. Closest to “come on then”.',
    shelf: 'just_say',
    where: 'ONE DOWN',
    choice: 'Carry on to the next sitting, or save your place and come back to it.',
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
      'Two words, both new. Falta is “is missing” and pouco is “little” — so falta pouco is literally “little is missing”. Portuguese counts what is LEFT where English counts what is done, and you will hear it about a journey, a queue and a deadline.',
    shelf: 'small_words',
    where: 'HALFWAY',
    choice: 'Two sittings left. Carry on now, or save your place and come back to it.',
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
      'One word: quase, “almost”. It does everything English needs three for and it goes in front of whatever it is hedging — quase pronto, almost ready. Said on its own, it is a whole answer.',
    shelf: 'small_words',
    where: 'ONE TO GO',
    choice: 'One sitting and your Legend is written. Carry on, or save your place.',
    cta: 'QUASE',
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

/**
 * JÁ ESTÁ — the end of the road, not a break between sittings.
 *
 * Sam: "Move Ja esta to the very last legend screen that opens the legend."
 *
 * It was the fourth SittingBreak and that was the wrong shape for it. The other three are
 * about carrying on — let's go, not far now, nearly there — and they interrupt a sitting to
 * ask a question. "Já está" asks nothing. It is what a Portuguese person says the second a
 * thing is finished, and the thing finished here is the Legend, so it belongs on the screen
 * that opens it rather than on a gate before one more lesson.
 *
 * Still a phrase the product teaches, on the same terms as the three breaks: the words, what
 * they do together, and nowhere else in DUB has a home for it.
 */
export const DONE = {
  pt: 'Já está.',
  en: 'That’s it. / Done.',
  gloss:
    'Já is “already” and está is “it is”. Neither is worth much alone; together they are what somebody says the second a thing is finished — you will hear it from every waiter, every shopkeeper and every friend who has just fixed something.',
  shelf: 'just_say' as const,
}
