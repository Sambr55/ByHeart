import { FIRST_REWARD, PAIR_REWARD, PAIR_WINDOW_H, REWARD_TIERS } from '@/content/board'

/**
 * THE DUB VENUE TERMS — what a venue agrees to on its sign-up link (/venue/<token>), shown
 * at /venue/terms.
 *
 * Sam, 2026-11-05: "I approve the terms. To be clear DUB will make no revenue from the
 * partners." So the first thing they say is that no money moves either way: a venue pays
 * DUB nothing, DUB pays a venue nothing, and every reward is the venue's own promotion.
 *
 * Plain words, short, and true of the code: what a venue's rewards are (content/board.ts),
 * what the staff PIN does and how a voucher locks (lib/venue-rules.ts), what learners'
 * data a venue sees (none — counts only, lib/venues.ts venueBoard), and that pausing stops
 * new rewards (tiersHeld). Not legal advice; a lawyer's read is still worth having.
 *
 * Change UPDATED whenever the words change, and tell signed-up venues (clause 12).
 */
export const VENUE_TERMS_UPDATED = '5 November 2026'
export const VENUE_TERMS_OPERATOR = 'Sam Brownfield, trading as DUB (thisisdub.club)'
export const VENUE_TERMS_CONTACT = 'sambrownfield3@gmail.com'

export interface TermsClause {
  title: string
  body: string[]
}

export const VENUE_TERMS: TermsClause[] = [
  {
    title: 'Who we are',
    body: [
      `DUB is an app for people learning European Portuguese. It is run by ${VENUE_TERMS_OPERATOR} ("DUB", "we"). "You" means the business that signs up on its DUB link.`,
    ],
  },
  {
    title: 'No money changes hands',
    body: [
      'Being a DUB venue is free. You pay DUB nothing: no fee, no commission, no share of sales. DUB pays you nothing either.',
      'DUB makes no money from venues. The rewards you give are your own promotion, paid for by you, and you keep everything your customers spend.',
    ],
  },
  {
    title: 'What DUB does',
    body: [
      'DUB sends learners to say their first Portuguese sentences to a real person, at places like yours. We list your venue in the app with your name, address and a short description we write, and show how many DUB learners have checked in there.',
      'We give you a DUB card to keep behind the counter and a window sticker, free. A learner asks for the card in Portuguese and scans it to check in. They can also check in by their phone’s location.',
    ],
  },
  {
    title: 'The rewards you choose',
    body: [
      `At ${REWARD_TIERS.first} learners: ${FIRST_REWARD}, for every learner who has checked in with you, once each, if you choose it.`,
      `At ${REWARD_TIERS.second} learners: your choice from the options on your link, or nothing. If you choose a free meal you can set a weekly limit.`,
      `${PAIR_REWARD.name}, if you choose it: when a learner and the friend they brought to DUB both check in with you within ${PAIR_WINDOW_H} hours, each gets the small thing you name, once.`,
      'You decide what you offer and can change it on your link at any time. Changes apply to rewards unlocked after you make them.',
    ],
  },
  {
    title: 'Honouring a reward',
    body: [
      'A learner shows the reward on their phone. It shows the time and moves, so a screenshot will not pass. One of your team types your 4-digit staff PIN on the learner’s phone, and the reward is used. Each reward can be used once.',
      'Please give the reward as described when the PIN goes in. Normal house rules still apply: you can refuse service for the usual reasons, and a reward is for one visit, not cash.',
      'Keep the PIN to your team. Five wrong PINs lock a reward. If you think the PIN is known outside your team, change it on your link and tell us.',
    ],
  },
  {
    title: 'Pausing and leaving',
    body: [
      'You can pause or leave at any time, without notice and without any cost: tell us, or ask your DUB contact. While paused, no new rewards unlock at your venue.',
      'Rewards already unlocked when you pause or leave stay good for 30 days, so a learner who earned one is not turned away. After that you may decline them.',
      'If you leave we stop showing you as a DUB venue. Your check-in count may still show, as it does for any place in the app, unless you ask us to remove your venue from DUB altogether.',
      'We can end a venue’s place in DUB if rewards are not honoured or the card is misused. We will tell you first where we can.',
    ],
  },
  {
    title: 'What you see about learners',
    body: [
      'Nothing personal. You see how many DUB learners have checked in with you. You never receive a learner’s name, email or location from DUB.',
      'We keep the contact name and phone or email you give us, to run your place in DUB, and nothing else. We do not share it or sell it. Ask us and we will delete it when you leave.',
    ],
  },
  {
    title: 'Your name and ours',
    body: [
      'You let us use your venue’s name, address and the description we write in the app and on thisisdub.club while you are a DUB venue. Tell us if anything is wrong and we will correct it.',
      'You may say you are a DUB venue and show the sticker. Please do not change the DUB card or sticker or use the DUB name for anything else without asking.',
    ],
  },
  {
    title: 'Your business, our app',
    body: [
      'You are responsible for your venue, food, drink, service and staff, and for your own accounts and taxes, including how you record the rewards you give. We are responsible for the app.',
      'The app is provided as it is. If it is down for a while, nobody owes anybody for that. Neither of us is liable to the other for lost profits or indirect losses. Nothing here limits liability that the law does not allow to be limited.',
    ],
  },
  {
    title: 'No exclusivity',
    body: ['There is no minimum period and no exclusivity. You can work with anybody else, and so can we.'],
  },
  {
    title: 'The prize draw',
    body: ['DUB does not run a prize draw with venues today. If that changes, it will come with its own terms, and taking part will be your choice.'],
  },
  {
    title: 'Changes to these terms',
    body: [
      'If we change these terms we will tell you, using the contact you gave us, at least 14 days before the change applies. If you do not agree, you can leave at any time, as above.',
    ],
  },
  {
    title: 'Law',
    body: [
      'These terms are governed by the law of Portugal, and the courts of Portugal decide any dispute that cannot be settled by talking to us first.',
      `Questions: ${VENUE_TERMS_CONTACT}.`,
    ],
  },
]
