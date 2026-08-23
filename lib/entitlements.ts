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
 * loop. Volume — unlimited crates, every live drop, offline audio, unlimited
 * capture — is what Pro buys.
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
  /** Live, time-limited drops. Free tier sees them but can only run one. */
  drops: number
  /** "DUB this" — turning a subtitle or a lyric into a root. Per rolling week. */
  captures: number
  /** Recording into the Booth, and hearing community takes rather than one voice. */
  booth: boolean
  /** Download audio and run a session with no signal. */
  offline: boolean
  /** Publish a crate under your own name for other people to take. */
  publish: boolean
  /** Everything social. Never gated. */
  share: true
  morningLine: true
  feed: true
}

const FREE: Entitlements = {
  plan: 'free',
  crates: 3,
  drops: 1,
  captures: 3,
  booth: false,
  offline: false,
  publish: false,
  share: true,
  morningLine: true,
  feed: true,
}

const PRO: Entitlements = {
  plan: 'pro',
  crates: UNLIMITED,
  drops: UNLIMITED,
  captures: UNLIMITED,
  booth: true,
  offline: true,
  publish: true,
  share: true,
  morningLine: true,
  feed: true,
}

/** past_due keeps access: dunning is Stripe's job, and yanking a lesson mid-week is not. */
const GRANTS_PRO: SubStatus[] = ['active', 'trialing', 'past_due']

export function entitlementsFor(
  sub: { plan?: string | null; status?: string | null } | null | undefined,
): Entitlements {
  if (!sub) return FREE
  const status = (sub.status ?? 'inactive') as SubStatus
  if (sub.plan === 'pro' && GRANTS_PRO.includes(status)) return PRO
  return FREE
}

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'DUB',
    price: null,
    line: 'Three crates, a line every morning, and everything you make is yours to share.',
    includes: [
      'Three crates open at once',
      'The morning line, every day',
      'One live drop at a time',
      'Three captures a week',
      'Share anything you can say',
    ],
  },
  pro: {
    id: 'pro' as const,
    name: 'DUB Pro',
    price: null, // filled from Stripe at render time
    line: 'Every crate, every drop, real voices, and it works on a plane.',
    includes: [
      'Every crate, no limit',
      'Every live drop while it lasts',
      'Unlimited capture — any subtitle, any lyric',
      'The Booth: hear real people, and be one of them',
      'Offline audio',
      'Publish your own crates',
    ],
  },
} as const
