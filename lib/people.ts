import 'server-only'
import { db } from '@/lib/db'

/**
 * WHO IS HERE, AND WHAT THEY DID (Sam, 2026-11-05: "I need an admin function to see
 * registrations, sign-ups and cancels etc"). Read-only numbers for /admin/people:
 *
 *   learners      devices that have saved a learner record — everybody, account or not
 *   accounts      signed-in people (users)
 *   trials, paying, cancelling, ended, comped — from `subscriptions` (state now)
 *   per day       new learners, new accounts and each billing moment, from billing_events
 *   recent        the latest accounts with their plan, and the latest billing moments
 */
export interface PeopleReport {
  totals: Record<string, number>
  days: { day: string; learners: number; accounts: number; trials: number; converted: number; subscribed: number; cancels: number; ended: number }[]
  accounts: { email: string; at: string; plan: string; status: string; source: string | null; cancelling: boolean }[]
  events: { email: string | null; kind: string; detail: string | null; at: string }[]
}

export async function peopleReport(days = 30): Promise<PeopleReport | null> {
  const sql = db()
  if (!sql) return null
  const n = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0
  const totals = {
    learners: await n(sql`select count(*)::int as n from learners`),
    learners7: await n(sql`select count(*)::int as n from learners where created_at > now() - interval '7 days'`),
    accounts: await n(sql`select count(*)::int as n from users where deleted_at is null`),
    accounts7: await n(sql`select count(*)::int as n from users where deleted_at is null and created_at > now() - interval '7 days'`),
    trialing: await n(sql`select count(*)::int as n from subscriptions where source = 'stripe' and status = 'trialing'`),
    paying: await n(sql`select count(*)::int as n from subscriptions where source = 'stripe' and status = 'active'`),
    cancelling: await n(sql`select count(*)::int as n from subscriptions where source = 'stripe' and cancel_at_period_end and status in ('active','trialing')`),
    pastDue: await n(sql`select count(*)::int as n from subscriptions where source = 'stripe' and status = 'past_due'`),
    ended: await n(sql`select count(*)::int as n from subscriptions where source = 'stripe' and status = 'canceled'`),
    compedAccounts: await n(sql`select count(*)::int as n from subscriptions where source = 'comp'`),
    compedDevices: await n(sql`select count(*)::int as n from device_comps`),
  }
  const rows = await sql<PeopleReport['days']>`
    with d as (select generate_series(current_date - ${days - 1}::int, current_date, interval '1 day')::date as day)
    select to_char(d.day, 'YYYY-MM-DD') as day,
      (select count(*)::int from learners l where l.created_at::date = d.day) as learners,
      (select count(*)::int from users u where u.created_at::date = d.day) as accounts,
      (select count(*)::int from billing_events e where e.at::date = d.day and e.kind = 'trial_started') as trials,
      (select count(*)::int from billing_events e where e.at::date = d.day and e.kind = 'converted') as converted,
      (select count(*)::int from billing_events e where e.at::date = d.day and e.kind = 'subscribed') as subscribed,
      (select count(*)::int from billing_events e where e.at::date = d.day and e.kind = 'cancel_requested') as cancels,
      (select count(*)::int from billing_events e where e.at::date = d.day and e.kind = 'ended') as ended
    from d order by d.day desc
  `
  const accounts = await sql<{ email: string; at: Date; plan: string | null; status: string | null; source: string | null; cancelling: boolean | null }[]>`
    select u.email, u.created_at as at, s.plan, s.status, s.source, s.cancel_at_period_end as cancelling
      from users u left join subscriptions s on s.user_id = u.id
     where u.deleted_at is null
     order by u.created_at desc limit 50
  `
  const events = await sql<{ email: string | null; kind: string; detail: string | null; at: Date }[]>`
    select u.email, e.kind, e.detail, e.at
      from billing_events e left join users u on u.id = e.user_id
     where e.kind <> 'comped' or e.user_id is not null
     order by e.at desc limit 50
  `
  return {
    totals,
    days: [...rows],
    accounts: accounts.map((a) => ({ email: a.email, at: new Date(a.at).toISOString(), plan: a.plan ?? 'free', status: a.status ?? 'none', source: a.source, cancelling: Boolean(a.cancelling) })),
    events: events.map((e) => ({ email: e.email, kind: e.kind, detail: e.detail, at: new Date(e.at).toISOString() })),
  }
}
