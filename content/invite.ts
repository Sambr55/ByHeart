/**
 * BRINGING SOMEBODY IN, AND WHAT IT IS FOR.
 *
 * Sam: "This app is primarily for ex-pats and they are all about community, finding and
 * helping each other in a foreign city. But one of the side effects of ex-pats is they
 * then converse in their own language and dont work hard enough to learn the local
 * language. That is where we are going to come in... We need to BUILD communities around
 * language and cities."
 *
 * THE TENSION THIS COPY HAS TO HOLD. An expat community is the best distribution a product
 * like this will ever have and the single biggest reason its members never learn the
 * language — the same group that passes DUB to a friend is the group that then speaks
 * English to them in a bar. So an invitation that said "learn Portuguese with your mates"
 * would be selling the problem.
 *
 * What it says instead is that the two of you will have something to say to the city
 * rather than to each other. That is the whole positioning, and it is why the reward is
 * paid on somebody SAYING THEIR LEGEND rather than on their signing up: the product only
 * profits when the person brought in can actually speak.
 */

/** What the share sheet carries. Short, because it sits above a link in a message. */
export const INVITE_TEXT =
  'I am learning Portuguese properly. Come and do it with me — we can be the ones who actually order in it.'

export const INVITE = {
  /** On the Yours section that lists them. */
  eyebrow: 'BROUGHT IN',
  /*
    THE ASK, said as the thing it actually is. Not "refer a friend" — a referral is a
    marketing act and this is asking somebody to learn a language with you.
  */
  cta: 'BRING SOMEBODY',
  /** When there is nobody yet. */
  empty:
    'Everybody you know here speaks English to each other. Bring one of them and you will both have somewhere else to put it.',
  /** When there are some. */
  some: 'The people you have asked, and how far they have got.',
  /*
    WHAT IT EARNS, said plainly and only once.

    Buried, deliberately: it is the second reason to do this and it must not become the
    first. A screen that leads on free months is a referral scheme, and a referral scheme
    is what gets somebody to send twenty links to people who will never open them.
  */
  reward:
    'When somebody you brought can say their Legend out loud, you both get a month of DUB free. It pays when they can speak, not when they sign up.',
  /** The three states an invitation can be in. */
  state: {
    waiting: 'Not opened yet',
    accepted: 'Started — not said their Legend yet',
    landed: 'Said their Legend. You both got a month.',
  },
} as const

/**
 * The page somebody lands on when they follow one.
 *
 * It has to do two things in the order they matter: say who sent it and what this is, and
 * then get out of the way. An invitation that opened on a paywall or a form would waste
 * the one moment when a person is here because somebody they know asked them to be.
 */
export const COME = {
  eyebrow: 'SOMEBODY ASKED YOU',
  headline: 'Somebody wants you to learn this with them.',
  body:
    'They are learning European Portuguese — the real one, the one Lisbon actually speaks. This is the same thing, from the beginning.',
  /*
    AND WHAT IT IS NOT. Said because an invitation from a friend in an expat group reads,
    reasonably, as another social app — and the honest difference is worth one sentence.
  */
  note:
    'Not a chat app and not a leaderboard. You learn to say things, out loud, that are true about you.',
  cta: 'START HERE',
  /** When the code is spent, expired or theirs. The tone is never an accusation. */
  spent: 'That invitation has already been taken up. You can still start here.',
} as const
