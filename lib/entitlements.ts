/**
 * What a plan actually unlocks.
 *
 * One file, no store-specific vocabulary, and deliberately no mention of Stripe.
 * When the iOS build ships, StoreKit writes `plan` into the same subscriptions row
 * and every gate in the product keeps working untouched.
 *
 * The shape of the free tier is a product decision, not a billing one, so it is
 * written down here rather than left implicit in scattered `if` statements:
 *
 *   Everything that makes DUB spread is free. Everything that makes it deep is paid.
 *
 * Sharing, the morning line, the feed and taking someone else's crate cost nothing,
 * because a learning product that hides its social loop behind a card has no social
 * loop. Volume — unlimited crates, offline audio, unlimited capture — is what Pro buys.
 *
 * Drops are never gated, at any tier. A drop can be lost forever by being busy, and
 * charging for the one thing that expires would turn the only real deadline in the
 * product into a punishment.
 *
 * And the free tier gets set once and never tightened. Taking something back from an
 * early advocate costs more than it ever earns.
 */

export type Plan = 'free' | 'pro'

/**
 * "No limit", as a number.
 *
 * Not Infinity. Entitlements cross the wire as JSON, and JSON.stringify turns
 * Infinity into null — so every `owned < limit` check on the client would have
 * evaluated false and locked paying subscribers out of everything. A large finite
 * number survives serialisation and compares correctly everywhere.
 */
export const UNLIMITED = 1_000_000
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'

export interface Entitlements {
  plan: Plan
  /** How many crates can be open at once. UNLIMITED on Pro. */
  crates: number
  /** Live, time-limited drops. Never gated — see the note above. */
  drops: number
  /**
   * Recording into the Booth, and hearing a real take rather than a synthetic one.
   *
   * The one non-crate flag that survives, because /api/booth actually enforces it. The
   * feature is a server route with no UI in front of it yet — but the flag is not a lie,
   * it is a gate on something real and incomplete.
   */
  booth: boolean
  /** Everything social. Never gated. */
  share: true
  morningLine: true
}

/*
  What was here, and why it is gone.

  `captures`, `offline`, `publish` and `feed` were four booleans and a number that no
  code anywhere read, naming four features that do not exist — and /pro rendered all
  four to a live page as things a subscription buys. There is no capture feature, no
  audio file to take offline, no way to publish a crate and no feed.

  A flag that lies about what a plan buys is how a paywall loses trust, and it loses it
  at the exact moment somebody is deciding whether to believe the rest of the page. So
  they are deleted rather than left as intentions: when one of them is built, it comes
  back with the code that honours it.
*/

export const FREE_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  crates: 3,
  drops: UNLIMITED,
  booth: false,
  share: true,
  morningLine: true,
}

export const PRO_ENTITLEMENTS: Entitlements = {
  plan: 'pro',
  crates: UNLIMITED,
  drops: UNLIMITED,
  booth: true,
  share: true,
  morningLine: true,
}

/** past_due keeps access: dunning is Stripe's job, and yanking a lesson mid-week is not. */
const GRANTS_PRO: SubStatus[] = ['active', 'trialing', 'past_due']

export function entitlementsFor(
  sub: { plan?: string | null; status?: string | null } | null | undefined,
): Entitlements {
  if (!sub) return FREE_ENTITLEMENTS
  const status = (sub.status ?? 'inactive') as SubStatus
  if (sub.plan === 'pro' && GRANTS_PRO.includes(status)) return PRO_ENTITLEMENTS
  return FREE_ENTITLEMENTS
}

/*
  What each plan buys, and separately what the money is FOR.

  Four of the five Pro bullets sold features that do not exist — capture, the Booth,
  offline audio and publishing — rendered verbatim on a live page. The free tier
  contradicted its own flag too, promising "one live drop at a time" while drops are
  unlimited and always have been, because charging for the one thing that can be lost by
  being busy would turn the only real deadline in the product into a punishment.

  `includes` is now only what is true today, and it is short — deliberately. `funding` is
  what a founding membership pays to build, labelled as exactly that. The distinction is
  the whole of the founding-member pitch: nobody is being told they are buying real
  Portuguese voices today, they are being told their money is what records them.
*/
export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'DUB',
    price: null,
    line: 'Your Legend, three crates, a line every morning, and everything you make is yours to share.',
    includes: [
      'Three crates, chosen by you and yours for good',
      'The morning line, every day',
      'Every live drop, always — those are never gated',
      'Share anything you can say',
    ],
  },
  pro: {
    id: 'pro' as const,
    name: 'DUB Pro',
    price: null, // filled from Stripe at render time
    line: 'Every crate, and it pays for the voices.',
    includes: [
      'Every crate, no limit',
      'Every crate DUB writes from now on',
      'The morning line and every live drop, same as free',
      'Share anything you can say',
    ],
    /** Not owned today. Said plainly, because a bullet that lies costs more than it sells. */
    funding: [
      'Real Lisbon voices, recorded — every line is synthetic today',
      'The Booth: hear a native take under a sentence, and record your own',
      'Audio that works with no signal',
    ],
  },
} as const

/**
 * What things cost, and why.
 *
 * Priced against specificity, not against Duolingo. Duolingo is free, gamified and
 * teaches the wrong Portuguese; competing on price puts DUB in a comparison it loses on
 * features and wins on nothing. Competing on being the European Portuguese one, taught
 * through culture and counted honestly, is a comparison it wins outright — and cheap is
 * a position you cannot climb back out of.
 *
 * GBP and EUR, never USD. The audience is British, Irish and European, and a dollar
 * price on a European Portuguese product reads as wrong.
 */
export const PRICING = {
  currencies: ['GBP', 'EUR'] as const,
  annual: { gbp: 54, eur: 64 },
  /** Deliberately poor value against annual. It exists for the trip in nine weeks. */
  monthly: { gbp: 7.99, eur: 8.99 },
  founding: {
    gbp: 29,
    eur: 34,
    cap: 500,
    /** The only genuinely scarce thing on offer, and it is scarce for a real reason. */
    line: 'Locked for as long as you stay, and it pays for the recordings.',
  },
} as const
