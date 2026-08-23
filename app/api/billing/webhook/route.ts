import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { recordWebhook, stripe, syncSubscription } from '@/lib/billing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe's side of the conversation.
 *
 * Two non-negotiables, both of which are ways this endpoint could quietly hand out
 * free subscriptions:
 *
 *   1. The signature is verified against the raw body. Parsing first and verifying
 *      after does not work — any re-serialisation invalidates the signature — so
 *      this reads request.text() and never request.json().
 *   2. Every event id is recorded before it is acted on. Stripe retries on any
 *      non-2xx and will happily redeliver the same event for days.
 */
export async function POST(request: Request) {
  const s = stripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!s || !secret) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 })
  }

  const raw = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = await s.webhooks.constructEventAsync(raw, signature, secret)
  } catch (err) {
    console.error('[stripe] bad signature', err)
    return NextResponse.json({ error: 'bad signature' }, { status: 400 })
  }

  if (!(await recordWebhook(event.id, event.type))) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const id =
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          const sub = await s.subscriptions.retrieve(id)
          // client_reference_id is the only link back to our user on the very first
          // event, before the subscription carries our metadata.
          if (session.client_reference_id && !sub.metadata?.user_id) {
            sub.metadata = { ...sub.metadata, user_id: session.client_reference_id }
          }
          await syncSubscription(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription }
        const ref = invoice.subscription
        if (ref) {
          const id = typeof ref === 'string' ? ref : ref.id
          await syncSubscription(await s.subscriptions.retrieve(id))
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    // A 500 makes Stripe retry, which is what we want for a transient database blip.
    console.error('[stripe] handler failed for ' + event.type, err)
    return NextResponse.json({ error: 'handler failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
