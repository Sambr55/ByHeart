import { db } from '@/lib/db'

/**
 * Comp codes.
 *
 * No change to entitlementsFor is needed — it already grants Pro to any active
 * plan='pro' row whatever its source. This is only the missing way to write one.
 *
 * A comped user must never reach the Stripe portal, and does not: portalUrl returns
 * null without a stripe_customer_id, and a comp row has none.
 */
export interface CompResult {
  ok: boolean
  reason?: string
  /** null means a permanent grant. */
  until?: string | null
  note?: string | null
}

export async function redeemComp(code: string, userId: string): Promise<CompResult> {
  const sql = db()
  if (!sql) return { ok: false, reason: 'No database configured.' }

  const rows = await sql<
    { code: string; plan: string; note: string | null; max_uses: number; uses: number; expires_at: string | null; grants_until: string | null }[]
  >`select * from comp_codes where lower(code) = lower(${code})`
  const found = rows[0]
  if (!found) return { ok: false, reason: 'That code does not exist.' }
  if (found.expires_at && new Date(found.expires_at) < new Date()) {
    return { ok: false, reason: 'That code has expired.' }
  }

  // Redeeming twice is not an error — it is somebody tapping the button again. Say yes
  // and change nothing rather than telling them off.
  const already = await sql<{ code: string }[]>`
    select code from comp_redemptions where code = ${found.code} and user_id = ${userId}
  `
  if (already.length) {
    return { ok: true, until: found.grants_until, note: found.note }
  }

  if (found.uses >= found.max_uses) return { ok: false, reason: 'That code has been used up.' }

  await sql`
    insert into subscriptions (user_id, source, plan, status, current_period_end)
    values (${userId}, 'comp', ${found.plan}, 'active', ${found.grants_until})
    on conflict (user_id) do update set
      source = 'comp',
      plan = excluded.plan,
      status = 'active',
      current_period_end = excluded.current_period_end
  `
  await sql`insert into comp_redemptions (code, user_id) values (${found.code}, ${userId})`
  await sql`update comp_codes set uses = uses + 1 where code = ${found.code}`

  return { ok: true, until: found.grants_until, note: found.note }
}
