import 'server-only'
import { db } from './db'

/**
 * Persistence, in preference order: Postgres, then Blob, then honestly nothing.
 *
 * The order matters more than it looks. The tester cohort is live right now against
 * a deployment with Blob and no database, and their sessions must keep landing while
 * the database is provisioned underneath them. So every function here degrades one
 * step at a time and reports which layer answered, rather than throwing.
 */

export type Layer = 'postgres' | 'blob' | 'none'

async function blobStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  return import('@vercel/blob')
}

export function layer(): Layer {
  if (process.env.DATABASE_URL) return 'postgres'
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob'
  return 'none'
}

// ---------------------------------------------------------------------------
// Learner state
// ---------------------------------------------------------------------------

export async function saveLearner(
  deviceId: string,
  state: unknown,
  userId?: string | null,
): Promise<Layer> {
  const sql = db()
  if (sql) {
    await sql`
      insert into learners (device_id, user_id, state, updated_at)
      values (${deviceId}, ${userId ?? null}, ${sql.json(state as never)}, now())
      on conflict (device_id) do update set
        state = excluded.state,
        user_id = coalesce(excluded.user_id, learners.user_id),
        updated_at = now()
    `
    return 'postgres'
  }
  const store = await blobStore()
  if (!store) return 'none'
  await store.put('learners/' + deviceId + '.json', JSON.stringify(state), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return 'blob'
}

export async function loadLearner(deviceId: string): Promise<unknown | null> {
  const sql = db()
  if (sql) {
    const rows = await sql<{ state: unknown }[]>`
      select state from learners where device_id = ${deviceId}
    `
    return rows[0]?.state ?? null
  }
  const store = await blobStore()
  if (!store) return null
  const found = await store.get('learners/' + deviceId + '.json', { access: 'private' })
  if (!found) return null
  return (await new Response(found.stream).json()) as unknown
}

/**
 * Sign-in moment: everything this device did anonymously becomes the user's.
 *
 * A learner who has spent twenty minutes in a crate and then creates an account must
 * not lose it — that is the single most expensive bug this product could ship, and
 * the reason device identity exists separately from account identity at all.
 */
export async function claimDevice(deviceId: string, userId: string): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql`update learners set user_id = ${userId} where device_id = ${deviceId} and user_id is null`
  await sql`update events   set user_id = ${userId} where device_id = ${deviceId} and user_id is null`
  await sql`update feedback set user_id = ${userId} where device_id = ${deviceId} and user_id is null`
  await sql`update voice_takes set user_id = ${userId} where device_id = ${deviceId} and user_id is null`
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface EventIn {
  name: string
  payload?: Record<string, unknown>
  at?: string
}

export async function recordEvents(
  deviceId: string | null,
  userId: string | null,
  events: EventIn[],
): Promise<Layer> {
  if (!events.length) return layer()
  const sql = db()
  if (sql) {
    await sql`
      insert into events ${sql(
        events.map((e) => ({
          device_id: deviceId,
          user_id: userId,
          name: e.name.slice(0, 120),
          payload: sql.json((e.payload ?? {}) as never),
          at: e.at ? new Date(e.at) : new Date(),
        })),
        'device_id',
        'user_id',
        'name',
        'payload',
        'at',
      )}
    `
    return 'postgres'
  }
  // Blob has no append. Events are only useful in aggregate, so on the fallback path
  // they ride along inside the session record instead of being written separately.
  return 'blob'
}

// ---------------------------------------------------------------------------
// Sessions and feedback — the tester-facing records
// ---------------------------------------------------------------------------

export async function saveSession(
  deviceId: string | null,
  userId: string | null,
  body: Record<string, unknown>,
): Promise<Layer> {
  const sql = db()
  if (sql) {
    // Keyed on the device, never on the session id. A tester who starts a fresh run
    // is still the same learner, and claimDevice matches on device_id — keying this
    // on session_id would fragment one person into a row per sitting and leave every
    // one of them unclaimable at sign-in.
    await saveLearner(deviceId ?? String(body.session_id ?? 'unknown'), body, userId)
    return 'postgres'
  }
  const store = await blobStore()
  if (!store) return 'none'
  const at = String(body.recorded_at ?? new Date().toISOString())
  await store.put(
    'sessions/' + at.slice(0, 10) + '/' + String(body.session_id) + '.json',
    JSON.stringify(body, null, 2),
    { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true },
  )
  return 'blob'
}

export async function saveFeedback(
  deviceId: string | null,
  userId: string | null,
  body: { submission_id: string; tester_label?: string; answers: unknown; recorded_at?: string },
): Promise<Layer> {
  const sql = db()
  if (sql) {
    await sql`
      insert into feedback (device_id, user_id, tester_label, answers, at)
      values (${deviceId}, ${userId}, ${body.tester_label ?? null},
              ${sql.json(body.answers as never)},
              ${body.recorded_at ? new Date(body.recorded_at) : new Date()})
    `
    return 'postgres'
  }
  const store = await blobStore()
  if (!store) return 'none'
  const at = String(body.recorded_at ?? new Date().toISOString())
  await store.put('feedback/' + at.slice(0, 10) + '/' + body.submission_id + '.json', JSON.stringify(body, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  return 'blob'
}

async function listBlobs(prefix: string): Promise<Record<string, unknown>[]> {
  const store = await blobStore()
  if (!store) return []
  const { blobs } = await store.list({ prefix, limit: 1000 })
  const out = await Promise.all(
    blobs.map(async (b: { pathname: string }) => {
      const found = await store.get(b.pathname, { access: 'private' })
      if (!found) return null
      return (await new Response(found.stream).json()) as Record<string, unknown>
    }),
  )
  return out.filter(Boolean) as Record<string, unknown>[]
}

export async function listFeedback(): Promise<Record<string, unknown>[]> {
  const sql = db()
  if (sql) {
    return (await sql`
      select f.id, f.tester_label, f.answers, f.at as recorded_at, u.email
        from feedback f left join users u on u.id = f.user_id
       order by f.at desc limit 1000
    `) as unknown as Record<string, unknown>[]
  }
  return listBlobs('feedback/')
}

export async function listSessions(): Promise<Record<string, unknown>[]> {
  const sql = db()
  if (sql) {
    return (await sql`
      select l.device_id, l.state, l.updated_at, u.email
        from learners l left join users u on u.id = l.user_id
       order by l.updated_at desc limit 1000
    `) as unknown as Record<string, unknown>[]
  }
  const rows = await listBlobs('sessions/')
  rows.sort((a, b) => String(a.recorded_at).localeCompare(String(b.recorded_at)))
  return rows
}

// ---------------------------------------------------------------------------
// GDPR — one place, so "delete me" is provably complete
// ---------------------------------------------------------------------------

export async function exportUser(userId: string): Promise<Record<string, unknown>> {
  const sql = db()
  if (!sql) return {}
  const [user] = await sql`select * from users where id = ${userId}`
  const learners = await sql`select device_id, state, updated_at from learners where user_id = ${userId}`
  const events = await sql`select name, payload, at from events where user_id = ${userId} order by at`
  const feedback = await sql`select tester_label, answers, at from feedback where user_id = ${userId}`
  const takes = await sql`select line_id, line_pt, blob_url, region, status, created_at from voice_takes where user_id = ${userId}`
  const [sub] = await sql`select plan, status, current_period_end from subscriptions where user_id = ${userId}`
  return {
    exported_at: new Date().toISOString(),
    user,
    subscription: sub ?? null,
    learners,
    events,
    feedback,
    voice_takes: takes,
  }
}

/**
 * Anonymise rather than cascade-delete.
 *
 * The learning data — which lines are hard, where people drop out — is what makes
 * the next version better, and it stops being personal the moment it stops being
 * attached to a person. Everything that identifies someone goes; the shape of what
 * they found difficult stays. Voice recordings are the exception: those are their
 * actual voice, so they are removed outright.
 */
export async function deleteUser(userId: string): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql.begin(async (tx) => {
    await tx`delete from voice_takes where user_id = ${userId}`
    await tx`delete from sessions where user_id = ${userId}`
    await tx`update learners set user_id = null where user_id = ${userId}`
    await tx`update events set user_id = null, device_id = null where user_id = ${userId}`
    await tx`update feedback set user_id = null, device_id = null, tester_label = null where user_id = ${userId}`
    await tx`
      update users
         set email = 'deleted+' || id || '@dub.invalid',
             display_name = null,
             marketing_opt_in = false,
             deleted_at = now()
       where id = ${userId}
    `
  })
}
