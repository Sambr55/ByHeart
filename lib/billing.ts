import 'server-only'
import Stripe from 'stripe'
import { db } from './db'
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

export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO_MONTHLY)
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
  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: customer ?? undefined,
    line_items: [{ price, quantity: 1 }],
    /**
     * No trial, deliberately.
     *
     * A trial is a deadline, and the whole thesis of this product is that deadlines and
     * streaks do not produce speakers — shipping a countdown to a subscription while the
     * deal screen promises "no streaks, nothing here will ever congratulate you for
     * opening the app" is the product arguing with itself at the till.
     *
     * The generous free tier does the same job better anyway: seven days is not long
     * enough to feel one crate collide with another, and three free crates over a month
     * is. It also keeps the conversion rate honest, since trial starts are not customers.
     */
    subscription_data: {
      metadata: { user_id: opts.userId },
    },
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
