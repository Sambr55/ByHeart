/**
 * WHICH MOMENTS A CHANGE IS (2026-11-05), from the state before and after. Pure, so
 * scripts/accounts-check.mts can hold it still. A first sync of a trial is a trial started; a
 * trial that turns active is a conversion; active from nothing is a straight subscription;
 * the cancel flag going on is a cancel asked for (they keep access to the period end); the
 * status reaching canceled is the end.
 */
export function billingMoments(
  prev: { status: string; cancel_at_period_end: boolean } | null,
  next: { status: string; cancel_at_period_end: boolean },
): string[] {
  const out: string[] = []
  const was = prev?.status ?? 'none'
  if (next.status === 'trialing' && was !== 'trialing') out.push('trial_started')
  if (next.status === 'active' && was === 'trialing') out.push('converted')
  if (next.status === 'active' && (was === 'none' || was === 'inactive' || was === 'canceled')) out.push('subscribed')
  if (next.status === 'past_due' && was !== 'past_due') out.push('payment_failed')
  if (next.cancel_at_period_end && !prev?.cancel_at_period_end && next.status !== 'canceled') out.push('cancel_requested')
  if (!next.cancel_at_period_end && prev?.cancel_at_period_end && next.status !== 'canceled') out.push('cancel_undone')
  if (next.status === 'canceled' && was !== 'canceled') out.push('ended')
  return out
}
