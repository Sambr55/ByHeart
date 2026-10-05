import { randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { SEATS, canSit, saidCold } from '@/content/table'

/**
 * WHO BELONGS AT A TABLE, AND WHY IT IS NOT A LANGUAGE LEVEL.
 *
 * Sam, on the problem this exists to solve: "The problem with ex-pats is they hang out
 * together and never feel a pressing need to learn the new language." And on the shape:
 * "match the people, not run the dinners."
 *
 * THE MATCH IS ON WHAT SOMEBODY HAS ACTUALLY SAID. Every other app asks "how good is your
 * Portuguese?" and believes the answer — Timeleft has a language dropdown and 20,000
 * members in Lisbon, every one of them self-declared. DUB is the only product that
 * watched you do it: `proof` holds the sentences produced with nothing on screen, and a
 * fake account cannot speak Portuguese. That is the same anti-fraud property lib/invites
 * gets for free, from measuring the right thing rather than from a check.
 *
 * THE BAR IS THE LEGEND, NOT A SCORE. One test: can you introduce yourself out loud?
 * Everything else — words owned, vibes finished, how long you have been here — would
 * sort people into grades, and a room sorted into grades is a class. The Legend is the
 * floor because it is exactly what the first ten minutes asks for, so every person at the
 * table can do the thing the table is for. Above that floor nobody is ranked.
 *
 * WHAT IT DELIBERATELY DOES NOT MATCH ON. Not age, not gender, not what you are into,
 * not whether you are single — all of it is on the record and none of it belongs here.
 * Matching on any of them makes this a dating app by accident, which Sam named as a
 * possible happy consequence and not as the product. Matching on interests would also
 * rebuild the exact failure the Club already measured: filtering by `beach_surf`
 * collapsed it to one card, and somebody who said what they liked got less than somebody
 * who said nothing.
 *
 * SO THE ONLY INPUTS ARE: can you say your Legend, and are you free that night.
 */

export interface TableRow {
  id: string
  chapter: string
  place: string
  area: string | null
  sits_at: Date
  seats: number
  state: string
}


/**
 * The tables somebody could still join, soonest first.
 *
 * Only ones that have not happened and are not full. A past table is not hidden because
 * it is embarrassing — it is simply not a thing anybody can do anything about, and a list
 * of evenings you missed is the opposite of an invitation.
 */
export async function openTables(chapter = 'lisbon'): Promise<(TableRow & { taken: number })[]> {
  const sql = db()
  if (!sql) return []
  try {
    return await sql<(TableRow & { taken: number })[]>`
      select t.id, t.chapter, t.place, t.area, t.sits_at, t.seats, t.state,
             (select count(*)::int from seats s
               where s.table_id = t.id and s.state = 'taken') as taken
        from tables t
       where t.chapter = ${chapter}
         and t.state = 'open'
         and t.sits_at > now()
       order by t.sits_at asc
       limit 20
    `
  } catch {
    return []
  }
}

/**
 * Take a seat.
 *
 * THE RACE IS REAL AND IT IS HANDLED IN THE DATABASE. Six seats and seven people tapping
 * at once is not hypothetical on the night a table fills, and a count read in JavaScript
 * and acted on a moment later is the oldest bug in this shape. The insert is conditional
 * on the count inside the same statement, so the seventh person is refused by Postgres
 * rather than by a hope.
 *
 * Returns what happened, so the caller can say it plainly rather than guessing.
 */
export async function takeSeat(opts: {
  tableId: string
  userId: string
  saidCold: number
}): Promise<'taken' | 'full' | 'already' | 'gone' | 'unavailable'> {
  const sql = db()
  if (!sql) return 'unavailable'
  try {
    const rows = await sql<{ id: string }[]>`
      insert into seats (table_id, user_id, said_cold, state)
      select ${opts.tableId}, ${opts.userId}::uuid, ${opts.saidCold}, 'taken'
       where exists (
               select 1 from tables t
                where t.id = ${opts.tableId}
                  and t.state = 'open'
                  and t.sits_at > now()
             )
         and (
               select count(*) from seats s
                where s.table_id = ${opts.tableId} and s.state = 'taken'
             ) < (select seats from tables where id = ${opts.tableId})
      on conflict (table_id, user_id) do update
        set state = 'taken', took_at = now()
      returning table_id as id
    `
    if (rows.length) return 'taken'
    /* Nothing inserted: either the table has gone, or it filled while they were deciding. */
    const [t] = await sql<{ open: boolean; taken: number; seats: number }[]>`
      select (state = 'open' and sits_at > now()) as open,
             (select count(*)::int from seats s where s.table_id = tables.id and s.state = 'taken') as taken,
             seats
        from tables where id = ${opts.tableId}
    `
    if (!t) return 'gone'
    if (!t.open) return 'gone'
    return t.taken >= t.seats ? 'full' : 'already'
  } catch {
    return 'unavailable'
  }
}

/**
 * Give a seat back.
 *
 * The row stays and flips to 'released' rather than being deleted, so somebody cannot
 * take and release repeatedly to hold a place while they decide — and so a table that
 * emptied out is legible afterwards rather than looking like it was never booked.
 */
export async function releaseSeat(opts: { tableId: string; userId: string }): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  try {
    const rows = await sql<{ table_id: string }[]>`
      update seats set state = 'released'
       where table_id = ${opts.tableId} and user_id = ${opts.userId}::uuid and state = 'taken'
       returning table_id
    `
    return rows.length > 0
  } catch {
    return false
  }
}

/** Which tables this person is sitting at, so a screen can say "you are going". */
export async function seatsFor(userId: string): Promise<string[]> {
  const sql = db()
  if (!sql) return []
  try {
    const rows = await sql<{ table_id: string }[]>`
      select table_id from seats where user_id = ${userId}::uuid and state = 'taken'
    `
    return rows.map((r) => r.table_id)
  } catch {
    return []
  }
}

/**
 * WHO ELSE IS COMING — first names, and what they can say. Nothing else, ever.
 *
 * This is the whole of what one member learns about another, and the list is the feature
 * rather than a limitation of it: you are about to spend an evening with somebody whose
 * name you know and whose Portuguese you know the shape of. No photograph, no surname, no
 * age, no contact, no message — see db/migrations/012_tables.sql for why each of those is
 * absent and why the schema has nowhere to put them.
 *
 * `said_cold` is the number stamped when they took their seat. It is shown as a band
 * rather than a figure by the screen that draws it — see components/Table.tsx — because a
 * leaderboard of who can say most is exactly the sorting-into-grades this avoids.
 */
export async function whoElse(tableId: string, exceptUserId?: string | null) {
  const sql = db()
  if (!sql) return []
  try {
    return await sql<{ name: string; said_cold: number }[]>`
      select coalesce(nullif(split_part(u.display_name, ' ', 1), ''), 'Someone') as name,
             s.said_cold
        from seats s
        join users u on u.id = s.user_id
       where s.table_id = ${tableId}
         and s.state = 'taken'
         and u.deleted_at is null
         and (${exceptUserId ?? null}::uuid is null or s.user_id <> ${exceptUserId ?? null}::uuid)
       order by s.took_at asc
    `
  } catch {
    return []
  }
}

/* Re-exported so a caller needs one import. The rules live in content/table.ts. */
export { SEATS, COLD_FLOOR, canSit, saidCold } from '@/content/table'

/**
 * PUT A TABLE ON THE BOARD.
 *
 * Sam: "build the table builder." Six seats, a place somebody else already chose, and a
 * time — which is the whole of what DUB decides about an evening. There is no venue
 * record, no booking reference and no capacity beyond the seats, because the moment those
 * exist this is a logistics product rather than a language one.
 *
 * ADMIN ONLY, AND DELIBERATELY NOT A MEMBER FEATURE. A member who could create tables
 * would be creating a meeting between strangers using DUB's name, which is a moderation
 * surface the schema was specifically built to avoid — see db/migrations/012_tables.sql.
 * Sam puts the table up; members take seats.
 *
 * The id is minted here rather than supplied, so a caller cannot choose one that collides
 * with or guesses at another.
 */
export async function makeTable(opts: {
  place: string
  area?: string | null
  sitsAt: Date
  chapter?: string
  seats?: number
}): Promise<{ id: string } | null> {
  const sql = db()
  if (!sql) return null
  /*
    Short, unguessable, and the same shape as a showing id — it travels in a URL and
    there is nothing else to carry. Not sequential: a table id that counts up tells
    anybody who sees one how many evenings DUB has ever arranged.
  */
  const id = 't_' + randomBytes(8).toString('base64url')
  try {
    await sql`
      insert into tables (id, chapter, place, area, sits_at, seats, state)
      values (
        ${id},
        ${opts.chapter ?? 'lisbon'},
        ${opts.place.trim()},
        ${opts.area?.trim() || null},
        ${opts.sitsAt},
        ${Math.max(2, Math.min(12, Math.floor(opts.seats ?? SEATS)))},
        'open'
      )
    `
    return { id }
  } catch {
    return null
  }
}

/**
 * Call a table off.
 *
 * Flipped rather than deleted, for the same reason a released seat is: somebody planned
 * an evening around this and the fact that it was arranged is theirs. It also means the
 * people who had seats can be told, where a deleted row could tell nobody anything.
 */
export async function callOffTable(id: string): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  try {
    const rows = await sql<{ id: string }[]>`
      update tables set state = 'called_off' where id = ${id} and state = 'open' returning id
    `
    return rows.length > 0
  } catch {
    return false
  }
}

/** Every table, for the one screen that needs to see the ones that have passed. */
export async function allTables(chapter = 'lisbon') {
  const sql = db()
  if (!sql) return []
  try {
    return await sql<(TableRow & { taken: number })[]>`
      select t.id, t.chapter, t.place, t.area, t.sits_at, t.seats, t.state,
             (select count(*)::int from seats s
               where s.table_id = t.id and s.state = 'taken') as taken
        from tables t
       where t.chapter = ${chapter}
       order by t.sits_at desc
       limit 50
    `
  } catch {
    return []
  }
}
