import 'server-only'
import Stripe from 'stripe'
import { db } from './db'
import { billingMoments } from './billing-moments'
import { entitlementsFor, type Entitlements, type Plan, type SubStatus } from './entitlements'

/**
 * Billing.
 *
 * The rule this file exists to enforce: **the subscriptions table is the only
 * source of truth for access.** Nothing in the product asks Stripe a question at
 * render time. Stripe pushes state in through the webhook, we write a row, and
 * every gate reads that row.
 *
 * That is not just latency hygiene. Apple requires in-app purchase for digital
 * content sold inside an iOS app, so the App Store build cannot use Stripe
 * Checkout at all. When StoreKit arrives it writes the same row with
 * source = 'apple', and `entitlementsFor` never learns the difference.
 */

let stripeClient: Stripe | null = null

export function stripe(): Stripe | null {
  if (stripeClient) return stripeClient
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  stripeClient = new Stripe(key, { apiVersion: '2025-10-29.clover' as Stripe.LatestApiVersion })
  return stripeClient
}

/**
 * Is billing safe to switch on?
 *
 * This checked the monthly price id alone, so `billingReady` could be true with the
 * annual id unset — the buttons render, somebody picks annual, and the route 500s at the
 * one moment a customer is handing over money. A configuration check that does not cover
 * everything the code can select is not a check.
 *
 * Founding is deliberately not required: it is a launch offer that may not be running,
 * and the checkout route refuses it explicitly rather than substituting another price.
 */
export function billingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRICE_PRO_MONTHLY &&
      process.env.STRIPE_PRICE_PRO_ANNUAL,
  )
}

/** Days free before the first charge. BILLING_TRIAL_DAYS overrides; 0 turns the trial off. */
export function trialDays(): number {
  const n = Number(process.env.BILLING_TRIAL_DAYS ?? 7)
  return Number.isFinite(n) && n >= 0 ? Math.min(30, Math.floor(n)) : 7
}

/**
 * THE FOUNDING OFFER IS THE FIRST 500 (content: PRICING.founding.cap). Counted at Stripe — the
 * one place every founding subscription lives — active and in their free week, at the moment
 * somebody asks for it. Null when it cannot be counted, which the checkout treats as closed.
 */
export const FOUNDING_CAP = 500
export async function foundingLeft(): Promise<number | null> {
  const s = stripe()
  const price = process.env.STRIPE_PRICE_FOUNDING
  if (!s || !price) return null
  let n = 0
  for (const status of ['active', 'trialing', 'past_due'] as const) {
    for await (const _ of s.subscriptions.list({ price, status, limit: 100 })) {
      n++
      if (n >= FOUNDING_CAP) return 0
    }
  }
  return FOUNDING_CAP - n
}

export interface Subscription {
  user_id: string
  source: string
  plan: Plan
  status: SubStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: Date | null
  cancel_at_period_end: boolean
}

export async function subscriptionFor(userId: string): Promise<Subscription | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<Subscription[]>`
    select user_id, source, plan, status, stripe_customer_id, stripe_subscription_id,
           current_period_end, cancel_at_period_end
      from subscriptions where user_id = ${userId}
  `
  return rows[0] ?? null
}

export async function entitlementsForUser(userId: string | null): Promise<Entitlements> {
  if (!userId) return entitlementsFor(null)
  return entitlementsFor(await subscriptionFor(userId))
}

/** Idempotent: a customer is created once per user and remembered. */
export async function ensureCustomer(userId: string, email: string): Promise<string | null> {
  const s = stripe()
  const sql = db()
  if (!s || !sql) return null

  const existing = await subscriptionFor(userId)
  if (existing?.stripe_customer_id) return existing.stripe_customer_id

  const customer = await s.customers.create({ email, metadata: { user_id: userId } })
  await sql`
    insert into subscriptions (user_id, stripe_customer_id, source)
    values (${userId}, ${customer.id}, 'stripe')
    on conflict (user_id) do update set stripe_customer_id = ${customer.id}, updated_at = now()
  `
  return customer.id
}

export async function checkoutUrl(opts: {
  userId: string
  email: string
  interval: 'monthly' | 'annual' | 'founding'
  returnTo: string
}): Promise<string | null> {
  const s = stripe()
  if (!s) return null
  const price =
    opts.interval === 'founding'
      ? process.env.STRIPE_PRICE_FOUNDING
      : opts.interval === 'annual'
        ? process.env.STRIPE_PRICE_PRO_ANNUAL
        : process.env.STRIPE_PRICE_PRO_MONTHLY
  if (!price) return null

  const customer = await ensureCustomer(opts.userId, opts.email)
  const had = await subscriptionFor(opts.userId)
  const trial = had?.stripe_subscription_id ? 0 : trialDays()
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customer ?? undefined,
    line_items: [{ price, quantity: 1 }],
    /**
     * THE FIRST WEEK FREE (Sam, 2026-11-05: "I think we start with first week free then the
     * full plan"). This replaces the old "No trial, deliberately" — the owner's decision.
     * Stripe takes the card at checkout, charges nothing for TRIAL_DAYS, then the plan; they
     * can cancel any time in the trial from Account (the Stripe portal) and pay nothing.
     * Once per person: anybody who has had a Stripe subscription before goes straight to
     * the plan. The two free levels stay free regardless — the website promises them.
     */
    subscription_data: {
      metadata: { user_id: opts.userId },
      /* Stripe's recommended billing mode (the integration plan, 2026-11-05). */
      billing_mode: { type: 'flexible' },
      ...(trial
        ? {
            trial_period_days: trial,
            /* A trial that somehow ends with no card is cancelled, never left owing. */
            trial_settings: { end_behavior: { missing_payment_method: 'cancel' as const } },
          }
        : {}),
    },
    /* The card is taken up front even in the free week: that is what a trial means here. */
    payment_method_collection: 'always',
    /* The address, for receipts and for tax once DUB has to collect it (Stripe Tax). */
    billing_address_collection: 'auto',
    ...(customer ? { customer_update: { address: 'auto' as const, name: 'auto' as const } } : {}),
    client_reference_id: opts.userId,
    allow_promotion_codes: true,
    success_url: opts.returnTo + '?billing=done',
    cancel_url: opts.returnTo + '?billing=cancelled',
  })
  return session.url
}

export async function portalUrl(userId: string, returnTo: string): Promise<string | null> {
  const s = stripe()
  if (!s) return null
  const sub = await subscriptionFor(userId)
  if (!sub?.stripe_customer_id) return null
  const session = await s.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnTo,
  })
  return session.url
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

const STATUS: Record<string, SubStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete: 'inactive',
  incomplete_expired: 'inactive',
  paused: 'inactive',
}

/** Returns false when the event has already been handled, so retries are free. */
export async function recordWebhook(id: string, type: string): Promise<boolean> {
  const sql = db()
  if (!sql) return true
  const rows = await sql`
    insert into webhook_events (id, type) values (${id}, ${type})
    on conflict (id) do nothing
    returning id
  `
  return rows.length > 0
}

export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const sql = db()
  if (!sql) return

  const userId =
    (sub.metadata?.user_id as string | undefined) ??
    (await userIdForCustomer(typeof sub.customer === 'string' ? sub.customer : sub.customer.id))
  if (!userId) {
    console.error('[stripe] subscription ' + sub.id + ' matches no user')
    return
  }

  const item = sub.items.data[0]
  const status = STATUS[sub.status] ?? 'inactive'
  const plan: Plan = status === 'canceled' || status === 'inactive' ? 'free' : 'pro'
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null

  /* The moment, for the admin page (017_billing_events.sql): compared with what we held before. */
  const [prev] = await sql<{ status: string; cancel_at_period_end: boolean; source: string }[]>`
    select status, cancel_at_period_end, source from subscriptions where user_id = ${userId}
  `
  const priceId = item?.price?.id
  const detail =
    priceId && priceId === process.env.STRIPE_PRICE_FOUNDING ? 'founding' : item?.price?.recurring?.interval ?? null
  for (const kind of billingMoments(prev && prev.source === 'stripe' ? prev : null, { status, cancel_at_period_end: sub.cancel_at_period_end })) {
    await sql`insert into billing_events (user_id, kind, detail) values (${userId}, ${kind}, ${detail})`
  }

  await sql`
    insert into subscriptions (
      user_id, source, plan, status, stripe_customer_id, stripe_subscription_id,
      current_period_end, cancel_at_period_end, updated_at
    ) values (
      ${userId}, 'stripe', ${plan}, ${status},
      ${typeof sub.customer === 'string' ? sub.customer : sub.customer.id},
      ${sub.id}, ${periodEnd}, ${sub.cancel_at_period_end}, now()
    )
    on conflict (user_id) do update set
      plan = excluded.plan,
      status = excluded.status,
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end,
      updated_at = now()
  `
}

async function userIdForCustomer(customerId: string): Promise<string | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<{ user_id: string }[]>`
    select user_id from subscriptions where stripe_customer_id = ${customerId}
  `
  return rows[0]?.user_id ?? null
}

