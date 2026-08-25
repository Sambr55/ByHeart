import { db } from '@/lib/db'
import { entitlementsFor, type Entitlements } from '@/lib/entitlements'

/**
 * Comp codes.
 *
 * No change to entitlementsFor is needed — it already grants Pro to any active
 * plan='pro' row whatever its source. This is only the missing way to write one.
 *
 * A comped user must never reach the Stripe portal, and does not: portalUrl returns
 * null without a stripe_customer_id, and a comp row has none.
 *
 * A code binds to EITHER an account or a device. The device path exists because
 * requiring an account made the whole system unreachable on the live domain — sign-in
 * needs an email sender, and there isn't one — and because an account is the wrong
 * thing to ask a ten-minute test cohort for. DUB works with no account at all, and a
 * tester code that breaks that promise is testing a different product.
 */
export interface CompResult {
  ok: boolean
  reason?: string
  /** null means a permanent grant. */
  until?: string | null
  note?: string | null
  /** What the grant was attached to, so the UI can say so plainly. */
  bound?: 'account' | 'device'
}

interface CompCode {
  code: string
  plan: string
  note: string | null
  max_uses: number
  uses: number
  expires_at: string | null
  grants_until: string | null
}

/**
 * Find a code and say whether it can still be spent.
 *
 * Shared by both redemption paths so the two can never drift — a code that is expired
 * for an account and live for a device would be a very confusing bug to be handed.
 */
async function usable(code: string): Promise<{ found?: CompCode; reason?: string }> {
  const sql = db()
  if (!sql) return { reason: 'No database configured.' }
  // Matched on letters and digits alone.
  //
  // Codes are printed QNCL-D3XW and typed QNCLD3XW, because the hyphen is a reading aid
  // and nobody thinks it is part of the code. An exact match answered "that code does
  // not exist" — which is not just unhelpful, it is untrue, and it is the first thing a
  // tester sees after being handed something that was supposed to work. Spaces and case
  // go the same way for the same reason.
  const norm = code.replace(/[^a-z0-9]/gi, '').toLowerCase()
  if (!norm) return { reason: 'That code does not exist.' }
  const rows = await sql<CompCode[]>`
    select * from comp_codes
     where lower(regexp_replace(code, '[^A-Za-z0-9]', '', 'g')) = ${norm}
  `
  const found = rows[0]
  if (!found) return { reason: 'That code does not exist.' }
  if (found.expires_at && new Date(found.expires_at) < new Date()) {
    return { reason: 'That code has expired.' }
  }
  return { found }
}

export async function redeemComp(code: string, userId: string): Promise<CompResult> {
  const sql = db()
  if (!sql) return { ok: false, reason: 'No database configured.' }
  const { found, reason } = await usable(code)
  if (!found) return { ok: false, reason }

  // Redeeming twice is not an error — it is somebody tapping the button again. Say yes
  // and change nothing rather than telling them off.
  const already = await sql<{ code: string }[]>`
    select code from comp_redemptions where code = ${found.code} and user_id = ${userId}
  `
  if (already.length) return { ok: true, until: found.grants_until, note: found.note, bound: 'account' }

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

  return { ok: true, until: found.grants_until, note: found.note, bound: 'account' }
}

/**
 * The same code, bound to the device cookie instead.
 *
 * The uses counter is shared with the account path deliberately: a cohort code with
 * twenty uses means twenty testers however each of them arrived, and two separate
 * counters would quietly let it be spent forty times.
 */
export async function redeemCompForDevice(code: string, device: string): Promise<CompResult> {
  const sql = db()
  if (!sql) return { ok: false, reason: 'No database configured.' }
  const { found, reason } = await usable(code)
  if (!found) return { ok: false, reason }

  const already = await sql<{ code: string }[]>`
    select code from device_comps where device_id = ${device} and code = ${found.code}
  `
  if (already.length) return { ok: true, until: found.grants_until, note: found.note, bound: 'device' }

  if (found.uses >= found.max_uses) return { ok: false, reason: 'That code has been used up.' }

  await sql`
    insert into device_comps (device_id, code, plan, grants_until)
    values (${device}, ${found.code}, ${found.plan}, ${found.grants_until})
    on conflict (device_id) do update set
      code = excluded.code,
      plan = excluded.plan,
      grants_until = excluded.grants_until
  `
  await sql`update comp_codes set uses = uses + 1 where code = ${found.code}`

  return { ok: true, until: found.grants_until, note: found.note, bound: 'device' }
}

/**
 * What this device has been comped, if anything.
 *
 * Expiry is enforced here rather than by a cleanup job: a cohort code with an end date
 * lapses to Free on its own, and a row left behind after that date is harmless.
 */
export async function entitlementsForDevice(device: string | null): Promise<Entitlements | null> {
  if (!device) return null
  const sql = db()
  if (!sql) return null
  const rows = await sql<{ plan: string; grants_until: string | null }[]>`
    select plan, grants_until from device_comps where device_id = ${device}
  `
  const row = rows[0]
  if (!row) return null
  if (row.grants_until && new Date(row.grants_until) < new Date()) return null
  return entitlementsFor({ plan: row.plan, status: 'active' })
}

/**
 * Carry a device's grant onto a new device id.
 *
 * /reset deletes the device cookie, so without this a tester who resets their phone to
 * look at the first-run experience — the exact thing testers are asked to do — would
 * silently lose their access and land back behind the paywall. Their PROGRESS should go.
 * Their access should not.
 */
export async function moveDeviceComp(from: string, to: string): Promise<boolean> {
  const sql = db()
  if (!sql || from === to) return false
  const rows = await sql`
    insert into device_comps (device_id, code, plan, grants_until)
    select ${to}, code, plan, grants_until from device_comps where device_id = ${from}
    on conflict (device_id) do update set
      code = excluded.code, plan = excluded.plan, grants_until = excluded.grants_until
    returning device_id
  `
  if (!rows.length) return false
  await sql`delete from device_comps where device_id = ${from}`
  return true
}

/** Mint codes. Used by the CLI and by the admin route, so the two cannot drift. */
export async function issueCodes(opts: {
  note: string
  uses: number
  until: string | null
  count: number
}): Promise<string[]> {
  const sql = db()
  if (!sql) return []
  // Human-typable: no vowels, so it cannot accidentally spell anything, and no 0/O/1/I.
  const ALPHABET = 'ABCDFGHJKLMNPQRSTVWXYZ23456789'
  const out: string[] = []
  for (let i = 0; i < opts.count; i++) {
    let raw = ''
    for (let j = 0; j < 8; j++) raw += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    const code = raw.slice(0, 4) + '-' + raw.slice(4)
    await sql`
      insert into comp_codes (code, plan, note, max_uses, grants_until)
      values (${code}, 'pro', ${opts.note}, ${opts.uses}, ${opts.until})
    `
    out.push(code)
  }
  return out
}
