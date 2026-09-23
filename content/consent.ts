/**
 * WHAT DUB KEEPS, SAID IN PORTUGUESE, BECAUSE THE RULE IS ALSO A LESSON.
 *
 * Sam: "We are wandering into GDPR territory here. I kinda want to ask them their email,
 * again as part of learning and store all of this in their profile. But how are we going
 * to handle GDPR — again, folding in learning?" And then: "We need to ask specific age —
 * not bands because that is part of learning numbers... In Portugal you must be..... and
 * when we collect email — e-mail (or e-posta in Portugal, though e-mail or correio
 * eletrónico are more common). Do you see what I'm getting at?"
 *
 * Yes. Every obligation here is a fact about the country somebody is learning, and a fact
 * about a country is content. The minimum age is not a checkbox, it is "Em Portugal, tens
 * de ter treze anos" — which teaches `tens de`, a number, and something true about
 * Portugal. The email field is not a form, it is the discovery that Portuguese says
 * correio eletrónico and mostly just says e-mail anyway.
 *
 * WHAT IS NOT FOLDED IN, and this is the line that matters. Consent has to be a real,
 * informed choice, freely given, before the thing it permits — GDPR Article 7. A consent
 * hidden inside a lesson is not informed, however charming the lesson. So there is exactly
 * one plain screen, in English, that says what is kept and what a person can do about it,
 * and it comes before any of this. Everything AFTER that point can be woven in, because
 * the permission was already given knowingly.
 *
 * The screen is short on purpose. A wall of policy is the same as no policy: nobody reads
 * it, and the law asks for intelligible and easily accessible, not exhaustive.
 */

/**
 * The one screen that is not a lesson.
 *
 * Four sentences and two buttons. Everything on it is true of the product as built —
 * checked against lib/store.ts, which strips the profile and the Legend on delete rather
 * than orphaning them, and against app/api/account/export, which already returns the lot.
 */
export const CONSENT = {
  eyebrow: 'BEFORE WE START',
  headline: 'What DUB keeps, and how to get it back.',
  /*
    Written as what happens rather than as what is permitted.

    "We process your personal data on the basis of consent" is accurate and tells a person
    nothing. What they want to know is where their work lives, whether it follows them, and
    whether they can take it away — so those are the sentences.
  */
  body: [
    'Everything you learn lives on this phone. Nothing leaves it until you sign in.',
    'Sign in and it follows you — your words, your Legend, and the few things you tell DUB about yourself so the Portuguese it builds for you is true.',
    'You can download all of it, or delete all of it, from Yours. Deleting takes your name, your Legend and everything you said out of DUB for good.',
  ],
  /*
    The age line names the country's own number, because the number is not universal.

    GDPR lets each member state set digital consent anywhere from 13 to 16, and they have
    genuinely chosen differently. See `consent_age` on Chapter.
  */
  age: (country: string, years: number) =>
    'You need to be ' + years + ' or over to have a DUB account. That is the rule in ' + country + '.',
  yes: 'THAT IS FINE',
  more: 'What exactly?',
  /** The longer answer, for anybody who taps. Still not a wall. */
  detail: [
    {
      q: 'What do you actually keep?',
      a: 'The Portuguese you have banked, the sentences you have said, and what you have told DUB about yourself: your name, whether you say obrigado or obrigada, where you are from, how old you are, and why you are here. Each of those exists to make a line DUB builds for you correct rather than generic.',
    },
    {
      q: 'Why do you need my age?',
      a: 'Two reasons and both are real. Portugal speaks to you differently depending on it, and DUB has to know you are old enough to have an account here. It is also the sentence you will be taught either way — tenho trinta anos — so you are learning it while you answer it.',
    },
    {
      q: 'Will you email me?',
      a: 'Only what you ask for. There is no newsletter and nothing is sold. Your address is how you get your Portuguese back on a new phone, and that is the whole of it.',
    },
    {
      q: 'How do I get rid of it?',
      a: 'Yours, then your account. Download takes everything as a file; delete takes your name, your Legend and every sentence you said out of DUB. What survives is anonymous and useful to nobody but us — which words were hard, where people stopped.',
    },
  ],
} as const

/**
 * TOO YOUNG FOR AN ACCOUNT IS NOT TOO YOUNG TO LEARN, which is the part worth getting
 * right.
 *
 * Somebody under the consent age cannot have a DUB account: there is nowhere to put a
 * parental authorisation and no way to verify one, so the honest thing is to not collect
 * from them at all. What they can do is everything else — the whole product, every vibe,
 * the Legend, the Club — on the device, with nothing leaving it.
 *
 * That is a better answer than a wall for the obvious reason and for a less obvious one:
 * it means DUB never holds a child's data, rather than holding it under a consent nobody
 * could give. The screen says so plainly instead of implying they have done something
 * wrong.
 */
export const TOO_YOUNG = {
  eyebrow: 'ALL YOURS, HERE',
  headline: (years: number) => 'An account waits until you are ' + years + '.',
  body: 'Everything else is open. Every vibe, your whole Legend, the Club — all of it works on this phone and stays on it. Nothing you do is sent anywhere and nothing is kept about you.',
  note: 'Come back when you are old enough and sign in, and DUB will take all of it with you.',
  cta: 'KEEP GOING',
} as const
