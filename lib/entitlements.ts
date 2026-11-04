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

import { FREE_CRATES } from '@/content/legend'

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
  /*
    Enough to reach the Legend, and DERIVED from that rather than chosen.

    It was three, and the Legend then needed pieces from five crates — so a free learner
    hit the wall at crate three, could never complete five, could never build their Legend,
    and therefore could never reach the thing they would have paid for. The old gate
    blocked the road to the new one, and nobody had noticed because nobody had walked it on
    a free account.

    THAT DEADLOCK IS STRUCTURALLY GONE. The Legend opens on finishing the basics, which is
    the forced doorway and costs no allowance at all — so no combination of choices can
    stand between a free learner and their Legend. This number no longer has to track the
    door, and the two constants are deliberately separate now rather than one wearing two
    names.

    What the free tier IS, said out loud: the Club itself, the starter set of five Lisbon
    rooms and the survival kit (FREE_ROOMS, below), and this many vibes chosen for the
    pleasure of them. The Legend is free too and optional — it is no longer the door, so it
    is no longer the thing the free tier is measured against. What money buys is the rest
    of the city's rooms. The value is delivered before the ask rather than promised.
  */
  crates: FREE_CRATES,
  drops: UNLIMITED,
  booth: false,
  share: true,
  morningLine: true,
}

/**
 * THE FREE STARTER SET — the one place it is written down.
 *
 * Sam, moving the door off the Legend: a free starter set, then pay for the rest. It was
 * "free until the Legend, then pay", which asked a visitor to introduce themselves before
 * they had been shown a single thing they would actually say in Lisbon.
 *
 * FIVE ROOMS, chosen for a first-day visitor rather than for breadth — the order is the
 * order the day happens in:
 *
 *   lisbon_taxi       Getting in a taxi. The airport is the first conversation most
 *                     visitors have, and it is the one where a wrong address costs money.
 *   lisbon_cafe       A coffee, standing up. The counter is where you will speak most
 *                     often, and um café is the single most-used sentence in the city.
 *   lisbon_perdido    Asking the way, and surviving the answer. Lisbon is hills and dead
 *                     ends, and the answer comes back fast — the room teaches the reply.
 *   lisbon_electrico  Getting on the 28. Every visitor rides it, usually on day one, and
 *                     buying on board is where the queue behind you is listening.
 *   lisbon_conta      The bill, and the couvert. Every meal ends here, and the couvert is
 *                     the one surprise on a Portuguese bill a visitor actually asks about.
 *
 * Tickets (lisbon_bilhetes) was the close sixth: monuments sell online in English, and the
 * taxi is a conversation you cannot avoid. Everything else is behind the paywall, and is
 * shown teased rather than hidden — see the Club's `working` stage.
 *
 * AND THE SURVIVAL KIT, which is free and needs no list here because nothing gates it:
 * REPAIR_KIT (content/legend.ts), numbers, greetings and the cheat sheets are all feed
 * cards of kinds other than 'situation', and the feed only ever withholds situations. If
 * that ever changes, FREE_KIT below is the list of what must stay free.
 *
 * Ids, not titles, so a rename never quietly moves a room across the line. Asserted to
 * exist by scripts/club-door.mts.
 */
/*
  THE FIRST TWO LEVELS, WHOLE (2026-11-04). Sam agreed: the paywall falls after Level 2
  rather than room by room from Level 2 on — a habit is built before anybody is asked to
  pay, and no free room ever sits beside a padlock in the levels you can play. Each path's
  Basics and its second level, by id (billing never imports the content tree), plus the
  emergency room wherever it falls. scripts/path-check.mts fails if these stop matching
  the first two levels of content/path.ts. The fun tile that closes every later level
  stays free (FREE_ALWAYS below).
*/
const BASICS = ['lisbon_ola', 'lisbon_numeros', 'lisbon_save', 'lisbon_legend']

export const FREE_ROOMS: readonly string[] = [
  ...BASICS,
  'lisbon_aeroporto', 'lisbon_checkin', 'lisbon_cartao_sim',
  'lisbon_emergencia',
] as const

/**
 * THE FIRST DAY IS DIFFERENT FOR EACH PATH (2026-11-02), because the paths are.
 *
 * Sam asked for the "why" to change the path again — a trip, a season, moving here — and a
 * free set chosen for a visitor would put a padlock on a mover's very first room (the NIF)
 * for the same reason the first cut padlocked the airport. So each path gets its own
 * first day, picked the same way: the rooms you meet first, spread so every early unit can
 * be started, and the emergency room always — and, since 2026-11-02, the save always: it
 * is the first room on all three paths.
 *
 * FREE_ROOMS above stays the visitor's set — it is also what somebody with no purpose
 * gets, and what the older checks and copy count.
 */
/**
 * BASICS AND THE FUN TILES ARE FREE ON EVERY PATH (2026-11-03). Basics is the first level
 * now, and a first level behind a padlock is the mistake FREE_ROOMS' own note describes; a
 * fun tile is one per level and is the reason to keep going, so locking it would lock the
 * fun. Listed by id rather than imported, so billing never reaches into the content tree.
 */
export const FREE_ALWAYS: readonly string[] = [
  'lisbon_ola', 'lisbon_numeros', 'lisbon_legend',
  'fun_cao_hack', 'fun_bluff_time', 'fun_bluff_react',
  'fun_piece_of_cake', 'fun_hold_your_horses', 'fun_bobs_your_uncle', 'fun_the_penny_dropped',
  'fun_fl_m_posso_oferecer', 'fun_dd_wolf',
]

export const FREE_BY_PURPOSE: Record<'visiting' | 'staying' | 'moving', readonly string[]> = {
  visiting: FREE_ROOMS,
  staying: [...BASICS, 'lisbon_checkin', 'lisbon_telemovel', 'lisbon_navegante', 'lisbon_cafe', 'lisbon_costume', 'lisbon_emergencia'],
  moving: [...BASICS, 'lisbon_nif', 'lisbon_telemovel', 'lisbon_banco', 'lisbon_loja_cidadao', 'lisbon_junta', 'lisbon_emergencia'],
}

/**
 * Whether a room (a Situation id) is in the free starter set for this learner's path.
 * No purpose means the visitor's set, the same default the path itself uses.
 */
export function isFreeRoom(id: string, purpose: 'visiting' | 'staying' | 'moving' | null = null): boolean {
  return FREE_ALWAYS.includes(id) || FREE_BY_PURPOSE[purpose ?? 'visiting'].includes(id)
}

/** The survival kit, named so the promise is written down — see the note on FREE_ROOMS. */
export const FREE_KIT = ['repair', 'numbers', 'greetings', 'cheat-sheets'] as const

/**
 * Whether this learner has everything — the paid side of the starter-set line.
 *
 * TRUE WHEN BILLING IS NOT CONFIGURED, because nothing is withheld until something is
 * purchasable, and TRUE BEFORE THE SERVER HAS ANSWERED, because a gate that fires early
 * locks a paying subscriber out of their own rooms for the first second of every load.
 * Both rules were already the Club's (it wrote this expression inline); they are here so
 * the new home screen and the feed ask one function instead of copying three clauses.
 *
 * Takes the shape useEntitlements returns, so a client caller passes `access` straight in.
 */
export function hasFullAccess(access: {
  known: boolean
  billingReady: boolean
  entitlements: { plan: Plan }
}): boolean {
  return !access.known || !access.billingReady || access.entitlements.plan === 'pro'
}

/** May this learner open this room? Free rooms always; the rest with full access. */
export function canOpenRoom(
  id: string,
  access: Parameters<typeof hasFullAccess>[0],
  purpose: 'visiting' | 'staying' | 'moving' | null = null,
): boolean {
  return isFreeRoom(id, purpose) || hasFullAccess(access)
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
  What each plan buys.

  This list was once four bullets long and every one of them sold something that did not
  exist — capture, the Booth, offline audio, publishing — rendered verbatim on a live
  page. That is how a paywall loses trust, and it loses it at the exact moment somebody
  is deciding whether to believe the rest of the product. So the rule stands: a bullet
  here is a thing the membership actually gets.

  Recorded voices are on the list because the recording is contracted before launch, not
  because it is aspirational — and nothing is purchasable until it is (`billingConfigured`
  gates the buttons, and the page says so in plain words when it is false). What is gone
  is the separate NOT BUILT YET panel: a sales page that leads with an inventory of its
  own gaps is not being honest, it is arguing against itself, and the visitor cannot tell
  the difference between candour and a warning.
*/
/**
 * Small numbers as words, because prose says five and not 5.
 *
 * Only as far as the allowance can plausibly go. A number past the table falls back to
 * the digit, which is worse-looking and still true — the alternative is a number-to-words
 * library for one sentence.
 */
const WORDS: Record<number, string> = {
  1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
  6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
}

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'DUB',
    price: null,
    /*
      THE NUMBER COMES FROM THE CONSTANT, because typing it let it drift.

      This said "three vibes" while FREE_CRATES is 5 and has been since the door and the
      allowance were deliberately decoupled — the door became "basics plus three vibes you
      chose" and the allowance deliberately did NOT move. None of the copy followed. So
      /pro, /account and the help page all answered a question about a limit that is not
      the limit, and the gateway fired at five under a headline promising three.

      Sam has never seen a paywall, and this is half of why: he was watching for the third.

      Written from FREE_CRATES so the next time one of these two numbers moves, the copy
      moves with it. The Legend door used to have its own three — VIBES_FOR_LEGEND — and
      this note said it "really is three" and stays. It did not: the toll was removed, the
      constant outlived it by weeks, and the door now asks for one warm-up. Five is still
      five here, and it is the only three-or-five left in the product.
    */
    /*
      AND THE STARTER SET LEADS, because it is what the free tier is now. "Your Legend"
      led this line while the Legend was the door; it is an optional card now, and the
      thing a visitor gets for nothing is five rooms of the city they are standing in.
    */
    line:
      'The first two levels of your path, the survival kit, ' +
      (WORDS[FREE_CRATES] ?? String(FREE_CRATES)) +
      ' vibes, and a line every morning.',
    includes: [
      'The first two levels of your path, whole — Basics, then arriving, settling in or the paperwork',
      'The survival kit: the lines that rescue a conversation, numbers, greetings and the cheat sheets',
      (WORDS[FREE_CRATES] ?? String(FREE_CRATES)).replace(/^./, (c) => c.toUpperCase()) +
        ' vibes, chosen by you and yours for good',
      'The morning line, every day',
      'Every live drop, always — those are never gated',
      'Share anything you can say',
    ],
  },
  pro: {
    id: 'pro' as const,
    name: 'DUB Pro',
    price: null, // filled from Stripe at render time
    line: 'Every room in the city, every vibe, and the voices to go with them.',
    includes: [
      'Every room in Lisbon — the market, the fado house, the train to Sintra and the rest',
      'Every vibe, no limit — and every vibe DUB writes from now on',
      'Real Lisbon voices, recorded properly — including your own Legend, read back',
      'The morning line and every live drop, same as free',
      'Share anything you can say',
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
