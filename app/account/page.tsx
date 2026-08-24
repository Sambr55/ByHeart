import { redirect } from 'next/navigation'
import { Account } from '@/components/Account'
import { currentUser } from '@/lib/auth'
import { billingConfigured, entitlementsForUser, subscriptionFor } from '@/lib/billing'
import { hasDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  if (!hasDb()) redirect('/signin')
  const user = await currentUser()
  if (!user) redirect('/signin')

  const [subscription, entitlements] = await Promise.all([
    subscriptionFor(user.id),
    entitlementsForUser(user.id),
  ])

  return (
    <Account
      user={{ ...user, created_at: user.created_at.toISOString() }}
      entitlements={entitlements}
      subscription={
        subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              source: subscription.source,
              current_period_end: subscription.current_period_end?.toISOString() ?? null,
              cancel_at_period_end: subscription.cancel_at_period_end,
            }
          : null
      }
      billingReady={billingConfigured()}
    />
  )
}
