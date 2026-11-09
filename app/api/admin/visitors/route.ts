import { NextResponse } from 'next/server'
import { adminKeyValid } from '@/lib/auth'
import { db } from '@/lib/db'
import { pathUnits } from '@/content/path'
import type { Purpose } from '@/content/situations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * WHO HAS BEEN HERE (Sam, 2026-11-09: "did we ever build the admin function so I can see who
 * has visited the site / logged in?"). For /admin/visitors, behind the admin key.
 * (Sign-ups, trials and billing are /admin/people.)
 *
 *   now     devices and signed-in people active in the last fifteen minutes
 *   totals  devices, accounts, phones with notifications on
 *   days    the last thirty days: visitors (devices that opened the app), new devices,
 *           sign-ins, new accounts
 *   people  every account: email, name, first and last seen, level and rooms, push
 *   devices the most recent devices nobody has signed in on
 *
 * A VISIT is an `app_open` event or a sync, which the app sends on open, after a change and
 * on leaving (startAutoSync in engine/learner.ts) — and only after consent. Before that
 * change shipped (2026-11-09) the app synced at set-up and almost nowhere else, so days
 * before it undercount.
 */
const ACTIVE = "interval '15 minutes'"

type Row = Record<string, unknown>

/** The level a record is on: the first unit of its path with a room not laid. */
function levelOf(state: { finished_cards?: string[]; purpose?: Purpose | null } | null): { level: number; rooms: number } {
  const done = new Set(state?.finished_cards ?? [])
  const units = pathUnits(undefined, new Date(), state?.purpose ?? null)
  const at = units.findIndex((u) => u.rooms.some((r) => !done.has(r.id)))
  return { level: at === -1 ? units.length + 1 : at + 1, rooms: done.size }
}

export async function GET(req: Request) {
  if (!adminKeyValid(req.headers.get('x-admin-key'))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const sql = db()
  if (!sql) return NextResponse.json({ error: 'no database' }, { status: 503 })

  const [now] = await sql.unsafe<Row[]>(`
    select
      (select count(*) from learners where updated_at > now() - ${ACTIVE})::int as devices,
      (select count(distinct user_id) from sessions where last_seen_at > now() - ${ACTIVE} and expires_at > now())::int as signed_in
  `)
  const [totals] = await sql<Row[]>`
    select
      (select count(*) from learners)::int as devices,
      (select count(*) from learners where state->>'deal_accepted_at' is not null)::int as consented,
      (select count(*) from users where deleted_at is null)::int as accounts,
      (select count(*) from push_subscriptions where expired_at is null)::int as push_live,
      (select count(distinct device_id) from events where at > now() - interval '7 days' and device_id is not null)::int as visitors_week
  `
  const days = await sql<Row[]>`
    with d as (select generate_series(current_date - 29, current_date, interval '1 day')::date as day)
    select to_char(d.day, 'YYYY-MM-DD') as day,
      (select count(distinct device_id) from events e where e.at >= d.day and e.at < d.day + 1 and e.device_id is not null)::int as visitors,
      (select count(*) from learners l where l.created_at >= d.day and l.created_at < d.day + 1)::int as new_devices,
      (select count(*) from sessions s where s.created_at >= d.day and s.created_at < d.day + 1)::int as sign_ins,
      (select count(*) from users u where u.created_at >= d.day and u.created_at < d.day + 1)::int as new_accounts
    from d order by d.day desc
  `
  const people = await sql<Row[]>`
    select u.email, u.display_name, u.created_at,
           greatest(u.last_seen_at, max(s.last_seen_at)) as last_seen,
           coalesce(max(s.last_seen_at) > now() - interval '15 minutes', false) as here_now,
           (select count(*) from learners l where l.user_id = u.id)::int as devices,
           (select l.state from learners l where l.user_id = u.id order by l.updated_at desc limit 1) as state,
           exists(select 1 from push_subscriptions p where p.user_id = u.id and p.expired_at is null) as push
      from users u
      left join sessions s on s.user_id = u.id
     where u.deleted_at is null
     group by u.id
     order by last_seen desc nulls last
     limit 300
  `
  const devices = await sql<Row[]>`
    select l.device_id, l.created_at, l.updated_at as last_seen, l.state,
           exists(select 1 from push_subscriptions p where p.device_id = l.device_id and p.expired_at is null) as push
      from learners l
     where l.user_id is null
     order by l.updated_at desc
     limit 100
  `

  type State = { finished_cards?: string[]; purpose?: Purpose | null; chapter?: string; display_name?: string }
  const shape = (st: unknown) => {
    const s = (st ?? null) as State | null
    const { level, rooms } = levelOf(s)
    return { level, rooms, purpose: s?.purpose ?? null, chapter: s?.chapter ?? null }
  }

  return NextResponse.json({
    now,
    totals,
    days,
    people: people.map(({ state, ...p }) => ({ ...p, ...shape(state) })),
    devices: devices.map(({ state, device_id, ...d }) => ({
      ...d,
      /* A device id is a credential-shaped string; eight characters tell two apart. */
      device: String(device_id).slice(0, 8),
      name: ((state ?? {}) as State).display_name ?? null,
      ...shape(state),
    })),
  })
}
