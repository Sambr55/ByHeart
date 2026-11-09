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
  /**
   * The Club came with it.
   *
   * The door stays real — five vibes and the seven card questions — because that gate is
   * the product rather than an obstacle in front of it. This is a property of the CODE,
   * issued deliberately, so that somebody can look at the room in order to build it.
   */
  club?: boolean
}

interface CompCode {
  code: string
  plan: string
  note: string | null
  max_uses: number
  uses: number
  expires_at: string | null
  grants_until: string | null
  /** Whether this code also opens Dub Club. Off unless it was issued with it on. */
  grants_club: boolean
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
  if (already.length) {
    return { ok: true, until: found.grants_until, note: found.note, bound: 'account', club: found.grants_club }
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

  return { ok: true, until: found.grants_until, note: found.note, bound: 'account', club: found.grants_club }
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
  if (already.length) {
    return { ok: true, until: found.grants_until, note: found.note, bound: 'device', club: found.grants_club }
  }

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

  return { ok: true, until: found.grants_until, note: found.note, bound: 'device', club: found.grants_club }
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
/**
 * Give a device back its ordinary free tier.
 *
 * The counterpart to moveDeviceComp. A comp follows a reset by default — a tester should
 * not lose what they were given because they wanted a clean run — and that means somebody
 * comped can never see the free tier again on any device. This is the way out, and it is
 * the only way to look at the paywall once you have been given the product.
 */
export async function forgetDeviceComp(device: string): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql`delete from device_comps where device_id = ${device}`
}

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
  /** Also opens the Club. Deliberate, per code, and off by default. */
  club?: boolean
  /**
   * What the code is worth. 'pro' by default, which is what a comp has always meant.
   *
   * 'free' exists because the two were welded together: every code granted pro, so a
   * Club pass handed out for testing also removed the paywall — and the person testing
   * then could not see the paywall at all, on any device, because /reset carries a comp
   * forward on purpose. A pass to look at a room is not the same thing as being given
   * the product.
   */
  plan?: 'free' | 'pro'
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
      insert into comp_codes (code, plan, note, max_uses, grants_until, grants_club)
      values (${code}, ${opts.plan ?? 'pro'}, ${opts.note}, ${opts.uses}, ${opts.until}, ${Boolean(opts.club)})
    `
    out.push(code)
  }
  return out
}

/**
 * EXISTING USERS GET FREE ACCESS (Sam, 2026-11-05). One action, pressed once from
 * /admin/people when Stripe goes live: every account and every device that exists before
 * that moment gets Pro for good, through the same comp rows every access check already
 * reads — accounts as a comp subscription, devices (most learners never made an account) as
 * a device comp. Idempotent: pressing it twice changes nothing for anybody already in, and
 * never touches somebody who pays (a Stripe row is left alone).
 */
export const EXISTING_CODE = 'EXISTING-AT-LAUNCH'

export async function compExisting(before: Date): Promise<{ accounts: number; devices: number } | null> {
  const sql = db()
  if (!sql) return null
  await sql`
    insert into comp_codes (code, plan, note, max_uses, uses)
    values (${EXISTING_CODE}, 'pro', 'Everybody who was here before Stripe went live', 1000000000, 0)
    on conflict (code) do nothing
  `
  const accounts = await sql`
    insert into subscriptions (user_id, source, plan, status)
    select u.id, 'comp', 'pro', 'active' from users u
     where u.created_at < ${before} and u.deleted_at is null
    on conflict (user_id) do nothing
    returning user_id
  `
  for (const r of accounts) {
    await sql`insert into comp_redemptions (code, user_id) values (${EXISTING_CODE}, ${r.user_id}) on conflict do nothing`
    await sql`insert into billing_events (user_id, kind, detail) values (${r.user_id}, 'comped', 'existing')`
  }
  const devices = await sql`
    insert into device_comps (device_id, code, plan)
    select l.device_id, ${EXISTING_CODE}, 'pro' from learners l
     where l.created_at < ${before}
    on conflict (device_id) do nothing
    returning device_id
  `
  for (const r of devices) await sql`insert into billing_events (device_id, kind, detail) values (${r.device_id}, 'comped', 'existing')`
  await sql`update comp_codes set uses = uses + ${accounts.length + devices.length} where code = ${EXISTING_CODE}`
  return { accounts: accounts.length, devices: devices.length }
}

/**
 * A device's free access follows its person onto their account at sign-in, so somebody who
 * was here before launch and signs in on a new phone is still in. Never over a paid row.
 */
export async function carryDeviceComp(device: string, userId: string): Promise<void> {
  const sql = db()
  if (!sql) return
  const [d] = await sql<{ plan: string; grants_until: string | null; code: string }[]>`
    select plan, grants_until, code from device_comps where device_id = ${device}
  `
  if (!d || (d.grants_until && new Date(d.grants_until) < new Date())) return
  await sql`
    insert into subscriptions (user_id, source, plan, status, current_period_end)
    values (${userId}, 'comp', ${d.plan}, 'active', ${d.grants_until})
    on conflict (user_id) do nothing
  `
}
