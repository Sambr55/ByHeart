import { db } from '@/lib/db'

/**
 * Bringing somebody in, and what it earns.
 *
 * Sam: "This app is primarily for ex-pats and they are all about community, finding and
 * helping each other in a foreign city. But one of the side effects of ex-pats is they
 * then converse in their own language and dont work hard enough to learn the local
 * language. That is where we are going to come in."
 *
 * THE THING BEING REWARDED IS NOT A SIGNUP. An invite that paid on acceptance would pay an
 * ex-pat for adding another English speaker to their phone, which is the exact behaviour
 * the product exists to counteract. This pays when the person brought in can SAY THEIR
 * LEGEND COLD — the one event in DUB that means somebody has learned something rather than
 * installed something. A fake account earns nothing, because a fake account cannot speak
 * Portuguese; that is a stronger anti-fraud property than any check could be, and it comes
 * free from measuring the right thing.
 *
 * NO CONTACTS ARE EVER READ. The invite travels through the operating system's own share
 * sheet, which already knows the sender's contacts and is a UI they trust. DUB never sees
 * the phone book, and db/migrations/011_invites.sql has nowhere to put one — an invite is
 * a code, who minted it, and who redeemed it.
 */

/** How long an unaccepted invitation stands. */
const OPEN_FOR_DAYS = 30

/**
 * What landing earns each side.
 *
 * Both, equally, because the thing being paid for is a person learning to speak — and the
 * learner did that, while the person who brought them made it happen. Paying only the
 * recommender would make this an affiliate scheme; paying only the newcomer would make it
 * a coupon. It is neither: it is two people in a city, one of whom now has a Legend.
 */
export const GRANT_DAYS = 30

export interface Invite {
  code: string
  chapter: string | null
  pair: string | null
  created_at: string
  accepted_at: string | null
  landed_at: string | null
  expires_at: string
}

/** Short, unguessable, and readable aloud in a noisy bar if it has to be. */
function newCode(): string {
  /*
    No 0/O or 1/I/L: this ends up in a URL that somebody may read off a screen to another
    person standing next to them, which is the most likely way an invitation actually
    travels between two people in the same city.
  */
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

/**
 * Mint an invitation.
 *
 * One per call rather than one per person: a code is handed to one human being and its
 * whole job is to name that relationship when it is redeemed. Minting a fresh one for
 * every share is what makes "who did I bring in" answerable at all.
 */
export async function mintInvite(opts: {
  userId: string | null
  device: string | null
  chapter: string | null
  pair: string | null
}): Promise<Invite | null> {
  const sql = db()
  if (!sql) return null
  const code = newCode()
  const expires = new Date(Date.now() + OPEN_FOR_DAYS * 86_400_000).toISOString()
  const rows = await sql<Invite[]>`
    insert into invites (code, from_user, from_device, chapter, pair, expires_at)
    values (${code}, ${opts.userId}, ${opts.device}, ${opts.chapter}, ${opts.pair}, ${expires})
    returning code, chapter, pair, created_at, accepted_at, landed_at, expires_at
  `
  return rows[0] ?? null
}

/**
 * Take up an invitation.
 *
 * REFUSED FOR A DEVICE THAT HAS ALREADY REDEEMED ONE, enforced by a unique index rather
 * than by this function — clearing an app's storage would otherwise be a way to mint free
 * months for whoever holds the code, and the device id is the only stable thing about
 * somebody who has not signed in yet.
 *
 * Refused for your own code too. Sending yourself an invitation is the cheapest possible
 * fraud and the easiest to stop.
 */
export async function acceptInvite(opts: {
  code: string
  userId: string | null
  device: string | null
}): Promise<{ ok: boolean; reason?: string }> {
  const sql = db()
  if (!sql) return { ok: false, reason: 'No database configured.' }
  const found = await sql<
    { code: string; from_user: string | null; from_device: string | null; to_device: string | null; expires_at: string }[]
  >`
    select code, from_user, from_device, to_device, expires_at
    from invites where code = ${opts.code.toUpperCase()}
  `
  const row = found[0]
  if (!row) return { ok: false, reason: 'That invitation is not one of ours.' }
  if (row.to_device && row.to_device !== opts.device) {
    return { ok: false, reason: 'Somebody has already taken that one up.' }
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'That invitation has expired.' }
  }
  /* Your own code pays nobody. */
  if (
    (row.from_user && row.from_user === opts.userId) ||
    (row.from_device && row.from_device === opts.device)
  ) {
    return { ok: false, reason: 'That is your own invitation.' }
  }
  /* Taking up the same one twice is somebody tapping a link again, not an error. */
  if (row.to_device === opts.device) return { ok: true }

  try {
    await sql`
      update invites
         set to_user = ${opts.userId}, to_device = ${opts.device}, accepted_at = now()
       where code = ${row.code} and to_device is null
    `
  } catch {
    /* The one-per-device index refused it. Said plainly rather than as a failure. */
    return { ok: false, reason: 'This device has already taken up an invitation.' }
  }
  return { ok: true }
}

/**
 * The person brought in has said their Legend cold. Pay both sides.
 *
 * IDEMPOTENT, and that is the whole of its correctness: the event that triggers this is a
 * client reporting progress, so it will arrive more than once. `paid_from_at` and
 * `paid_to_at` are the record of what has been granted, checked inside the same statement
 * that sets them.
 */
export async function landInvite(opts: {
  userId: string | null
  device: string | null
}): Promise<{ paid: boolean }> {
  const sql = db()
  if (!sql) return { paid: false }
  /*
    The invitation this learner took up, if any, and only while it is unpaid. A learner
    with no invite is the ordinary case and costs one indexed read.
  */
  const rows = await sql<{ code: string; from_user: string | null; from_device: string | null }[]>`
    select code, from_user, from_device
      from invites
     where (to_device = ${opts.device} or (to_user is not null and to_user = ${opts.userId}))
       and landed_at is null
     limit 1
  `
  const row = rows[0]
  if (!row) return { paid: false }

  await sql`update invites set landed_at = now() where code = ${row.code} and landed_at is null`
  await grant({ userId: row.from_user, device: row.from_device, code: row.code, side: 'from' })
  await grant({ userId: opts.userId, device: opts.device, code: row.code, side: 'to' })
  return { paid: true }
}

/**
 * Hand somebody their free time.
 *
 * EXTENDS RATHER THAN REPLACES, which is why this does not reuse redeemComp. That writes
 * `on conflict do update set current_period_end = excluded.current_period_end`, which is
 * right for a cohort code with a fixed end date and wrong twice here: it would overwrite a
 * paying subscriber's real period end with a comp date, and bringing in a second person
 * would move the date to the same place as the first rather than a month further out.
 *
 * So: start from whichever is later — now, or what they already have — and add the grant
 * to that. Three friends is three months, and a Stripe subscriber's own billing is never
 * touched because a paid row is only ever extended, never retyped as a comp.
 */
async function grant(opts: {
  userId: string | null
  device: string | null
  code: string
  side: 'from' | 'to'
}): Promise<void> {
  const sql = db()
  if (!sql) return
  /*
    The guard and the write in one statement, so a second delivery of the same event
    cannot pay twice however it races.
  */
  const claimed =
    opts.side === 'from'
      ? await sql<{ code: string }[]>`
          update invites set paid_from_at = now()
           where code = ${opts.code} and paid_from_at is null returning code`
      : await sql<{ code: string }[]>`
          update invites set paid_to_at = now()
           where code = ${opts.code} and paid_to_at is null returning code`
  if (!claimed.length) return

  const until = new Date(Date.now() + GRANT_DAYS * 86_400_000).toISOString()
  if (opts.userId) {
    /*
      `source` IS DELIBERATELY NOT TOUCHED ON UPDATE.

      A Stripe subscriber who brings a friend in keeps source = 'stripe', and that is
      correct rather than an oversight: Account.tsx hides the billing button on
      source === 'comp', so retyping a paying member as comped would take away the only
      route they have to manage a subscription they are still being charged for. They get
      the free month as extra time on their own period end, which is what was promised and
      nothing more.
    */
    await sql`
      insert into subscriptions (user_id, source, plan, status, current_period_end)
      values (${opts.userId}, 'comp', 'pro', 'active', ${until})
      on conflict (user_id) do update set
        status = 'active',
        plan = case when subscriptions.plan = 'pro' then subscriptions.plan else 'pro' end,
        current_period_end =
          greatest(coalesce(subscriptions.current_period_end, now()), now())
          + (${GRANT_DAYS} || ' days')::interval
    `
    return
  }
  if (opts.device) {
    await sql`
      insert into device_comps (device_id, code, plan, grants_until)
      values (${opts.device}, ${'INVITE-' + opts.code}, 'pro', ${until})
      on conflict (device_id) do update set
        plan = 'pro',
        grants_until =
          greatest(coalesce(device_comps.grants_until, now()), now())
          + (${GRANT_DAYS} || ' days')::interval
    `
  }
}

/**
 * The invitations this learner has out, and what became of them.
 *
 * A LIST AND NEVER A SCORE, which is the rule components/Friends.tsx already holds and the
 * showings API already enforces: showingsFor returns rows and refuses to count them. A
 * tally of how many people you have recruited is a leaderboard with extra steps, and DUB
 * exists because scores are the wrong fuel. What this answers is "who have I asked, and
 * has it landed" — two states, neither of them a position.
 */
export async function invitesFrom(opts: {
  userId: string | null
  device: string | null
}): Promise<Invite[]> {
  const sql = db()
  if (!sql) return []
  return await sql<Invite[]>`
    select code, chapter, pair, created_at, accepted_at, landed_at, expires_at
      from invites
     where (from_device = ${opts.device} or (from_user is not null and from_user = ${opts.userId}))
     order by created_at desc
     limit 50
  `
}
