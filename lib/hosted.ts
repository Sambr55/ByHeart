import 'server-only'
import { randomBytes } from 'node:crypto'
import { db } from '@/lib/db'
import { CODE_ALPHABET, MAX_GUESTS, ROUNDS, type HouseRule } from '@/content/table-night'

/**
 * YOUR TABLE, ON THE SERVER (2026-11-03) — content/table-night.ts for what it is.
 *
 * A host makes a table and gets a code; the code is the invite. Anybody with the link can
 * say they are in, with a first name — which is the "friends only" rule: there is no list
 * to browse and no way to find a table without being sent it. The host's phone moves the
 * round and every other phone follows it.
 *
 * PARTIES ARE DEVICES (the device cookie, lib/auth.ts), so a friend who has never opened
 * DUB can join in one tap. Signing in is not asked for.
 *
 * NO DATABASE, NOT PRODUCTION: an in-memory store, so the feature can be tried on a laptop.
 * In production without a database every call reports 'unavailable' rather than pretending.
 */

export interface Hosted {
  code: string
  host_device: string
  host_name: string
  gem: string | null
  place: string
  sits_at: string
  house_rule: HouseRule
  round: number
  state: 'on' | 'off'
}

export interface Guest {
  device: string
  name: string
}

type Mem = { tables: Map<string, Hosted>; guests: Map<string, Guest[]> }
function mem(): Mem | null {
  if (process.env.NODE_ENV === 'production') return null
  const g = globalThis as unknown as { __dubHosted?: Mem }
  g.__dubHosted ??= { tables: new Map(), guests: new Map() }
  return g.__dubHosted
}

function newCode(): string {
  const b = randomBytes(8)
  return Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join('')
}

const clean = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n)

function row(r: Record<string, unknown>): Hosted {
  return {
    code: String(r.code),
    host_device: String(r.host_device),
    host_name: String(r.host_name),
    gem: (r.gem as string | null) ?? null,
    place: String(r.place),
    sits_at: new Date(r.sits_at as string).toISOString(),
    house_rule: (r.house_rule as HouseRule) ?? 'ten',
    round: Number(r.round ?? 0),
    state: r.state === 'off' ? 'off' : 'on',
  }
}

export async function createTable(o: {
  device: string
  hostName: string
  gem: string | null
  place: string
  sitsAt: Date
  rule: HouseRule
}): Promise<Hosted | 'unavailable'> {
  const t: Hosted = {
    code: newCode(),
    host_device: o.device,
    host_name: clean(o.hostName, 40) || 'Your host',
    gem: o.gem,
    place: clean(o.place, 80),
    sits_at: o.sitsAt.toISOString(),
    house_rule: o.rule,
    round: 0,
    state: 'on',
  }
  const sql = db()
  if (sql) {
    await sql`
      insert into hosted_tables (code, host_device, host_name, gem, place, sits_at, house_rule)
      values (${t.code}, ${t.host_device}, ${t.host_name}, ${t.gem}, ${t.place}, ${t.sits_at}, ${t.house_rule})
    `
    return t
  }
  const m = mem()
  if (!m) return 'unavailable'
  m.tables.set(t.code, t)
  m.guests.set(t.code, [])
  return t
}

export async function getTable(code: string): Promise<{ table: Hosted; guests: Guest[] } | null> {
  const sql = db()
  if (sql) {
    const [t] = await sql`select * from hosted_tables where code = ${code}`
    if (!t) return null
    const guests = await sql<Guest[]>`select device, name from hosted_guests where code = ${code} order by joined_at asc`
    return { table: row(t), guests: [...guests] }
  }
  const m = mem()
  const t = m?.tables.get(code)
  return t && m ? { table: t, guests: m.guests.get(code) ?? [] } : null
}

export async function join(code: string, device: string, name: string): Promise<'in' | 'full' | 'gone' | 'unavailable'> {
  const n = clean(name, 40)
  if (!n) return 'gone'
  const sql = db()
  if (sql) {
    const rows = await sql`
      insert into hosted_guests (code, device, name)
      select ${code}, ${device}, ${n}
       where exists (select 1 from hosted_tables where code = ${code} and state = 'on')
         and (select count(*) from hosted_guests where code = ${code}) < ${MAX_GUESTS}
      on conflict (code, device) do update set name = excluded.name
      returning code
    `
    if (rows.length) return 'in'
    const [t] = await sql`select state from hosted_tables where code = ${code}`
    return !t || t.state !== 'on' ? 'gone' : 'full'
  }
  const m = mem()
  if (!m) return 'unavailable'
  const t = m.tables.get(code)
  if (!t || t.state !== 'on') return 'gone'
  const list = m.guests.get(code) ?? []
  const had = list.find((g) => g.device === device)
  if (had) had.name = n
  else if (list.length >= MAX_GUESTS) return 'full'
  else list.push({ device, name: n })
  m.guests.set(code, list)
  return 'in'
}

export async function leave(code: string, device: string): Promise<void> {
  const sql = db()
  if (sql) {
    await sql`delete from hosted_guests where code = ${code} and device = ${device}`
    return
  }
  const m = mem()
  if (m) m.guests.set(code, (m.guests.get(code) ?? []).filter((g) => g.device !== device))
}

/** Host only: move every phone at the table to a round, or call the table off. */
export async function hostSet(code: string, device: string, change: { round?: number; state?: 'off' }): Promise<boolean> {
  const round = change.round === undefined ? undefined : Math.max(0, Math.min(ROUNDS.length, Math.floor(change.round)))
  const sql = db()
  if (sql) {
    const rows = await sql`
      update hosted_tables
         set round = coalesce(${round ?? null}::int, round),
             state = coalesce(${change.state ?? null}, state)
       where code = ${code} and host_device = ${device}
      returning code
    `
    return rows.length > 0
  }
  const t = mem()?.tables.get(code)
  if (!t || t.host_device !== device) return false
  if (round !== undefined) t.round = round
  if (change.state) t.state = change.state
  return true
}

/** Tables this device is hosting or sitting at, from yesterday on — soonest first. */
export async function tablesFor(device: string): Promise<(Hosted & { hosting: boolean; count: number })[]> {
  const since = new Date(Date.now() - 86400000).toISOString()
  const sql = db()
  if (sql) {
    const rows = await sql`
      select t.*, (t.host_device = ${device}) as hosting,
             (select count(*)::int from hosted_guests g where g.code = t.code) as count
        from hosted_tables t
       where t.state = 'on' and t.sits_at > ${since}
         and (t.host_device = ${device} or exists (select 1 from hosted_guests g where g.code = t.code and g.device = ${device}))
       order by t.sits_at asc
       limit 10
    `
    return rows.map((r) => ({ ...row(r), hosting: Boolean(r.hosting), count: Number(r.count) }))
  }
  const m = mem()
  if (!m) return []
  return [...m.tables.values()]
    .filter((t) => t.state === 'on' && t.sits_at > since)
    .filter((t) => t.host_device === device || (m.guests.get(t.code) ?? []).some((g) => g.device === device))
    .sort((a, b) => a.sits_at.localeCompare(b.sits_at))
    .map((t) => ({ ...t, hosting: t.host_device === device, count: (m.guests.get(t.code) ?? []).length }))
}

/** What a phone is told about a table: first names and nothing about devices. */
export function publicView(t: Hosted, guests: Guest[], device: string | null) {
  return {
    code: t.code,
    host: t.host_name,
    gem: t.gem,
    place: t.place,
    sitsAt: t.sits_at,
    rule: t.house_rule,
    round: t.round,
    on: t.state === 'on',
    hosting: device !== null && t.host_device === device,
    in: device !== null && guests.some((g) => g.device === device),
    people: [t.host_name, ...guests.map((g) => g.name)],
  }
}
export type TableView = ReturnType<typeof publicView>
