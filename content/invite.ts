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
  eyebrow: 'BRING A FRIEND IN',
  /*
    THE ASK, said as the thing it actually is. Not "refer a friend" — a referral is a
    marketing act and this is asking somebody to learn a language with you.
  */
  cta: 'BRING SOMEBODY',
  /** When there is nobody yet. */
  empty:
    'Everybody you know here speaks English to each other. Bring one of them in, and you have somebody to speak Portuguese with, and somebody for your table.',
  /** When there are some. */
  some: 'The people you have asked, and how far they have got.',
  /*
    WHAT IT EARNS, said plainly and only once.

    Buried, deliberately: it is the second reason to do this and it must not become the
    first. A screen that leads on free months is a referral scheme, and a referral scheme
    is what gets somebody to send twenty links to people who will never open them.
  */
  /*
    The trigger moved from the Legend to the first room, said cold — see inviteEarned in
    lib/invites.ts — so the sentence that promises it moved with it.
  */
  reward:
    'When somebody you brought says their first room out loud, with nothing on screen, you both get a month of DUB free. It pays when they can speak, not when they sign up.',
  /*
    THE BOARD'S CARD OPENS A SHEET (Sam, 2026-11-05: "link to a modal overlay rather than deep
    link to the Yours page where it gets lost"). The ask, said in Portuguese first — every
    ask teaches — then the button, then the people already asked, then what it earns.
  */
  sheet: {
    eyebrow: 'Convida um amigo',
    title: 'Bring a friend in',
    body: 'Somebody you know here who still orders in English. Send them a link; they start from the beginning, and you have somebody to speak Portuguese with.',
    line: { pt: 'Queres aprender português comigo?', en: 'Do you want to learn Portuguese with me?' },
    all: 'All your people',
  },
  /** The three states an invitation can be in. */
  state: {
    waiting: 'Not opened yet',
    accepted: 'Started — not said a room out loud yet',
    landed: 'Said their first room. You both got a month.',
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

/**
 * HAS THE PERSON BROUGHT IN EARNED THE REWARD? Their first room, said cold.
 *
 * A proof row with source 'room' — which is what Errand banks when a Situation is said
 * with nothing on screen — and `clean`. It was the whole Legend said cold; the Legend is
 * optional now (the Club opens on set-up), so the reward moved to the first thing every
 * new member actually does. Pure, and here rather than in lib/invites.ts (which imports the database and is
 * server-only) so app/api/session, lib/invites and the check script ask one function.
 */
export function inviteEarned(
  proof: { source: string; clean: boolean }[] | null | undefined,
): boolean {
  return (proof ?? []).some((p) => p.source === 'room' && p.clean)
}
