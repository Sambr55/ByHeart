import { db } from '@/lib/db'
import { getShareCard, type Snapshot } from '@/lib/share'
import type { ReportReason } from '@/content/showing-copy'

/**
 * Showings.
 *
 * One member shows one other person their proof card. The other can show theirs back,
 * and that is the entire feature — no feed, no follower count, no browsable profile.
 *
 * The thing worth understanding here is why identity is a pair of columns rather than a
 * user id. DUB works signed out: the proof card is free at every tier and a learner who
 * has never given an email still has one worth showing. So a party is "the account if
 * there is one, and the device either way", and every match tries the account first and
 * falls back to the device. Sign in later and the showings you made anonymously are
 * still yours, because the device half never changed.
 */
export interface Party {
  userId: string | null
  deviceId: string | null
}

export interface ShowingRow {
  id: string
  from_user: string | null
  from_device: string | null
  to_user: string | null
  to_device: string | null
  card_id: string
  return_card_id: string | null
  created_at: Date
  expires_at: Date
  returned_at: Date | null
}

/** Fourteen days. Long enough to be sent by post; short enough that a stale link dies. */
const LIFETIME_DAYS = 14

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function showingId(): string {
  // Twelve rather than the share card's seven. A share card is meant to be posted in
  // public; a showing is addressed to one person, so the id is the whole access control
  // and guessing it must be hopeless rather than merely unlikely.
  let out = ''
  for (let i = 0; i < 12; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

/** Is this row's `from` (or `to`) side the same person as `party`? */
function matches(user: string | null, device: string | null, party: Party): boolean {
  if (user && party.userId) return user === party.userId
  if (device && party.deviceId) return device === party.deviceId
  return false
}

export function isSender(row: ShowingRow, party: Party): boolean {
  return matches(row.from_user, row.from_device, party)
}

export function isRecipient(row: ShowingRow, party: Party): boolean {
  return matches(row.to_user, row.to_device, party)
}

// ---------------------------------------------------------------------------
// Blocking
// ---------------------------------------------------------------------------

/**
 * One-sided to invoke, two-directional in effect.
 *
 * Whoever blocks, neither party can reach the other again — the person who pressed it is
 * not necessarily the one who would be contacted next, and a block that only stops
 * traffic in the direction it was pressed is a block that does not work.
 */
export async function isBlockedBetween(a: Party, b: Party): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  const rows = await sql<{ n: number }[]>`
    select 1 as n from showing_blocks
     where (
       (${a.userId}::uuid is not null and blocker_user = ${a.userId}::uuid
        or ${a.deviceId}::text is not null and blocker_device = ${a.deviceId})
       and
       (${b.userId}::uuid is not null and blocked_user = ${b.userId}::uuid
        or ${b.deviceId}::text is not null and blocked_device = ${b.deviceId})
     ) or (
       (${b.userId}::uuid is not null and blocker_user = ${b.userId}::uuid
        or ${b.deviceId}::text is not null and blocker_device = ${b.deviceId})
       and
       (${a.userId}::uuid is not null and blocked_user = ${a.userId}::uuid
        or ${a.deviceId}::text is not null and blocked_device = ${a.deviceId})
     )
     limit 1
  `
  return rows.length > 0
}

export async function blockCounterparty(showing: ShowingRow, blocker: Party): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  const other = isSender(showing, blocker)
    ? { userId: showing.to_user, deviceId: showing.to_device }
    : { userId: showing.from_user, deviceId: showing.from_device }
  await sql`
    insert into showing_blocks (blocker_user, blocker_device, blocked_user, blocked_device)
    values (${blocker.userId}, ${blocker.deviceId}, ${other.userId}, ${other.deviceId})
  `
  return true
}

export async function reportShowing(
  showingId: string,
  reporter: Party,
  reason: ReportReason,
): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  await sql`
    insert into showing_reports (showing_id, reporter_user, reporter_device, reason)
    values (${showingId}, ${reporter.userId}, ${reporter.deviceId}, ${reason})
  `
  return true
}

// ---------------------------------------------------------------------------
// The showing itself
// ---------------------------------------------------------------------------

export async function createShowing(cardId: string, from: Party): Promise<string | null> {
  const sql = db()
  if (!sql) return null
  const expires = new Date(Date.now() + LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString()
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = showingId()
    try {
      await sql`
        insert into showings (id, from_user, from_device, card_id, expires_at)
        values (${id}, ${from.userId}, ${from.deviceId}, ${cardId}, ${expires})
      `
      return id
    } catch {
      // Collision, or a card id that no longer exists. Retry; the second failure is
      // indistinguishable here and the caller treats null as "could not".
    }
  }
  return null
}

export async function getShowing(id: string): Promise<ShowingRow | null> {
  const sql = db()
  if (!sql) return null
  const rows = await sql<ShowingRow[]>`
    select id, from_user, from_device, to_user, to_device, card_id, return_card_id,
           created_at, expires_at, returned_at
      from showings where id = ${id}
  `
  return rows[0] ?? null
}

export type Openable =
  | { state: 'gone' }
  | { state: 'expired' }
  | { state: 'blocked' }
  /** Somebody else already took this invitation up. It was addressed to one person. */
  | { state: 'taken' }
  | { state: 'mine'; row: ShowingRow; card: Snapshot; back: Snapshot | null }
  | { state: 'theirs'; row: ShowingRow; card: Snapshot; back: Snapshot | null }
  | { state: 'open'; row: ShowingRow; card: Snapshot }

/**
 * What this person may see at this link, in one decision.
 *
 * Spreading "can they look" across a page component and three route handlers is how a
 * feature like this leaks. The page renders what this returns and nothing else.
 */
export async function openShowing(id: string, viewer: Party): Promise<Openable> {
  const row = await getShowing(id)
  if (!row) return { state: 'gone' }

  const card = await getShareCard(row.card_id)
  if (!card) return { state: 'gone' }
  const back = row.return_card_id ? await getShareCard(row.return_card_id) : null

  /*
    Blocked against the OTHER person, not against the sender.

    Checking the sender is right for a recipient and wrong for the sender themselves —
    it asks whether Alice has blocked Alice, which she has not, so a blocked sender kept
    seeing the card of the person who blocked them. Whoever is looking, the question is
    always "is there a block between me and the person at the other end of this".
  */
  const from: Party = { userId: row.from_user, deviceId: row.from_device }
  const to: Party = { userId: row.to_user, deviceId: row.to_device }
  const mine = isSender(row, viewer)
  const other = mine ? to : from
  if (await isBlockedBetween(other, viewer)) return { state: 'blocked' }

  if (mine) return { state: 'mine', row, card, back }
  if (isRecipient(row, viewer)) return { state: 'theirs', row, card, back }

  // Addressed to one person, and somebody has already answered to that description.
  if (row.to_user || row.to_device) return { state: 'taken' }
  if (row.expires_at.getTime() < Date.now()) return { state: 'expired' }
  return { state: 'open', row, card }
}

/**
 * Show one back, which is also how you accept.
 *
 * There is no accept button separate from the act. A mutual follow that costs a tap is a
 * notification to dismiss; a mutual showing costs you an artefact of your own, and that
 * cost is the thing that makes the answer mean something.
 */
export async function returnShowing(
  id: string,
  returnCardId: string,
  by: Party,
): Promise<'ok' | 'gone' | 'taken' | 'expired' | 'blocked'> {
  const sql = db()
  if (!sql) return 'gone'
  const row = await getShowing(id)
  if (!row) return 'gone'
  if (isSender(row, by)) return 'taken'
  if (row.to_user || row.to_device) return isRecipient(row, by) ? 'ok' : 'taken'
  if (row.expires_at.getTime() < Date.now()) return 'expired'
  if (await isBlockedBetween({ userId: row.from_user, deviceId: row.from_device }, by)) {
    return 'blocked'
  }

  // Conditional on to_user/to_device still being null, so two people opening the same
  // link at once cannot both become the recipient.
  const done = await sql`
    update showings
       set to_user = ${by.userId}, to_device = ${by.deviceId},
           return_card_id = ${returnCardId}, returned_at = now()
     where id = ${id} and to_user is null and to_device is null
     returning id
  `
  return done.length ? 'ok' : 'taken'
}

export interface MineRow {
  id: string
  sent: boolean
  returned: boolean
  created_at: Date
  expires_at: Date
}

/**
 * The showings this person is part of.
 *
 * Deliberately a list and never a number. "Nothing here is counted, ranked, or shown as
 * a total" — a count of who has shown you something is a score with extra steps, and the
 * whole product exists because scores are the wrong fuel.
 */
export async function showingsFor(party: Party): Promise<MineRow[]> {
  const sql = db()
  if (!sql) return []
  if (!party.userId && !party.deviceId) return []
  const rows = await sql<
    { id: string; from_user: string | null; from_device: string | null; returned_at: Date | null; created_at: Date; expires_at: Date }[]
  >`
    select id, from_user, from_device, returned_at, created_at, expires_at
      from showings
     where (${party.userId}::uuid is not null and (from_user = ${party.userId}::uuid or to_user = ${party.userId}::uuid))
        or (${party.deviceId}::text is not null and (from_device = ${party.deviceId} or to_device = ${party.deviceId}))
     order by created_at desc
     limit 50
  `
  return rows.map((r) => ({
    id: r.id,
    sent: matches(r.from_user, r.from_device, party),
    returned: Boolean(r.returned_at),
    created_at: r.created_at,
    expires_at: r.expires_at,
  }))
}

// ---------------------------------------------------------------------------
// Reading the reports
// ---------------------------------------------------------------------------

export interface OpenReport {
  id: number
  showing_id: string | null
  reason: string
  created_at: Date
  /** So the reader can see the artefact that was reported without going to the link. */
  card: Snapshot | null
}

/**
 * What has been reported and not yet looked at.
 *
 * Returns the reported card alongside the row, because a reason code on its own is not
 * something a person can act on — "offensive" against three sentences about coffee is a
 * different finding from "offensive" against something else, and the only way to tell is
 * to see it.
 */
export async function openReports(): Promise<OpenReport[]> {
  const sql = db()
  if (!sql) return []
  const rows = await sql<
    { id: number; showing_id: string | null; reason: string; created_at: Date; card_id: string | null }[]
  >`
    select r.id, r.showing_id, r.reason, r.created_at, s.card_id
      from showing_reports r
      left join showings s on s.id = r.showing_id
     where r.reviewed_at is null
     order by r.created_at desc
     limit 200
  `
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      showing_id: r.showing_id,
      reason: r.reason,
      created_at: r.created_at,
      card: r.card_id ? await getShareCard(r.card_id) : null,
    })),
  )
}

export async function markReviewed(id: number): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql`update showing_reports set reviewed_at = now() where id = ${id}`
}
