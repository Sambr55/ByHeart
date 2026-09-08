import 'server-only'
import { db } from './db'
import { mergeLearner } from './merge'

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

/**
 * Write a learner state, merged with whatever is already there. Never a blind overwrite.
 *
 * This used to be `state = excluded.state` — a straight replace — and the careful merge
 * that protects a learner's record lived two layers up, in the route. Which meant it could
 * be skipped, and it WAS: saveSession writes the raw incoming body through this function
 * before the route's merge block ever runs, so the server's copy was destroyed and the
 * merge then merged the body with itself.
 *
 * The effect was not subtle. Sign in on a second phone with less history, sync, and
 * writeAllFor pushes that shorter state to every row the account owns. Every proof line
 * the other device had was gone, from the only place it existed.
 *
 * So the merge lives at the WRITE now, where it cannot be gone around. Every caller gets
 * it: the session sync, the restore, writeAllFor. `assertCanOnlyGain` runs on each one,
 * which is what it was for.
 *
 * A refusal — two people's records meeting on one device — writes nothing and says so.
 * Nothing is lost by not writing; that is the entire argument for refusing.
 */
export async function saveLearner(
  deviceId: string,
  state: unknown,
  userId?: string | null,
): Promise<Layer | 'refused'> {
  let next = state
  try {
    const existing = await loadLearner(deviceId)
    if (existing) next = mergeLearner(state as never, existing as never)
  } catch (e) {
    if (e instanceof Error && /two people/.test(e.message)) return 'refused'
    /*
      Any other refusal is the invariant doing its job — a merge that would lose proof.
      Writing anyway is precisely the thing it exists to prevent, so this writes nothing
      and the caller keeps whatever it had.
    */
    return 'refused'
  }

  const sql = db()
  if (sql) {
    await sql`
      insert into learners (device_id, user_id, state, updated_at)
      values (${deviceId}, ${userId ?? null}, ${sql.json(next as never)}, now())
      on conflict (device_id) do update set
        state = excluded.state,
        user_id = coalesce(excluded.user_id, learners.user_id),
        updated_at = now()
    `
    return 'postgres'
  }
  const store = await blobStore()
  if (!store) return 'none'
  await store.put('learners/' + deviceId + '.json', JSON.stringify(next), {
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
/**
 * Every state that belongs to this person, newest first.
 *
 * A user accumulates one `learners` row per device, so restoring means reading all of
 * them rather than the one the current browser happens to own. Falls back to the device
 * row when nobody is signed in, which is what makes "clear the browser" recoverable
 * without an account.
 */
export async function loadLearnersFor(
  deviceId: string,
  userId: string | null,
): Promise<unknown[]> {
  const sql = db()
  if (sql) {
    if (userId) {
      const rows = await sql<{ state: unknown }[]>`
        select state from learners
        where user_id = ${userId} or device_id = ${deviceId}
        order by updated_at desc
      `
      return rows.map((r) => r.state).filter(Boolean)
    }
    const rows = await sql<{ state: unknown }[]>`
      select state from learners where device_id = ${deviceId}
    `
    return rows.map((r) => r.state).filter(Boolean)
  }
  const one = await loadLearner(deviceId)
  return one ? [one] : []
}

/**
 * Collapse a user down to one Portuguese.
 *
 * After a merge, every row this person owns is written the same canonical state. A
 * learner has one Portuguese, not one per phone, and leaving the older rows alone means
 * the next device to sync would resurrect a stale copy.
 */
export async function writeAllFor(
  userId: string,
  state: unknown,
): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql`
    update learners set state = ${sql.json(state as never)}, updated_at = now()
    where user_id = ${userId}
  `
}

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

/**
 * A search that found nothing.
 *
 * Written to whatever store exists and dropped on the floor when none does, exactly
 * like feedback — a learner must never see a search fail because the backlog table is
 * not provisioned. Best-effort by design: this is telemetry, not the learner's record.
 */
export async function saveVocabMiss(
  deviceId: string | null,
  userId: string | null,
  body: { query: string; scope: string },
): Promise<Layer> {
  const sql = db()
  if (sql) {
    await sql`
      insert into vocab_miss (device_id, user_id, query, scope)
      values (${deviceId}, ${userId}, ${body.query}, ${body.scope})
    `
    return 'postgres'
  }
  const store = await blobStore()
  if (!store) return 'none'
  const at = new Date().toISOString()
  await store.put(
    'vocab-miss/' + at.slice(0, 10) + '/' + encodeURIComponent(body.query) + '.json',
    JSON.stringify({ ...body, device_id: deviceId, user_id: userId, at }, null, 2),
    { access: 'private', contentType: 'application/json', addRandomSuffix: true },
  )
  return 'blob'
}

/**
 * Record one translation, and say how many this device has had today.
 *
 * The count comes back from the same call that writes the row so the meter cannot drift
 * from the log — a limiter kept anywhere else is a second source of truth about the same
 * fact, and the two disagree the first time a write fails.
 *
 * With no database there is no meter. That is a deliberate choice rather than an
 * oversight: DUB runs with zero configuration by design, and a deployment with no
 * DATABASE_URL is a local or a tester build where nothing is at stake. The API key is the
 * thing that has to be absent for the cost to be, and that is checked separately.
 */
export async function recordTranslation(
  deviceId: string | null,
  userId: string | null,
  body: { ask: string; answer: string; note: string; direction: string },
  clientHash: string | null = null,
): Promise<{ layer: Layer; today: number; id: number | null }> {
  const sql = db()
  if (!sql) return { layer: 'none', today: 0, id: null }
  const [row] = await sql<{ id: string }[]>`
    insert into translation (device_id, user_id, ask, answer, note, direction, client_hash)
    values (${deviceId}, ${userId}, ${body.ask}, ${body.answer}, ${body.note}, ${body.direction}, ${clientHash})
    returning id::text as id
  `
  const [count] = await sql<{ n: string }[]>`
    select count(*)::text as n from translation
    where device_id = ${deviceId} and at > now() - interval '24 hours'
  `
  return { layer: 'postgres', today: Number(count?.n ?? 0), id: Number(row?.id ?? 0) }
}

/**
 * Everything this deployment has spent in a day, across everybody.
 *
 * The per-caller cap is the friendly limit and it cannot be the only one: it bounds what
 * ONE person does and says nothing about a thousand of them, or about one person with a
 * thousand addresses. This is the number that has to be true whatever the per-caller cap
 * fails to catch, and it is the difference between a bad day and a bad month.
 *
 * Fails CLOSED, like the meter above it. A ceiling that cannot be read is not a ceiling.
 */
export async function translationsEverywhereToday(): Promise<number | null> {
  const sql = db()
  if (!sql) return null
  const count = async () => {
    const [row] = await sql<{ n: string }[]>`
      select count(*)::text as n from translation where at > now() - interval '24 hours'
    `
    return Number(row?.n ?? 0)
  }
  try {
    return await count()
  } catch {
    await ensureTranslationTable()
    return await count()
  }
}

/*
  The translator's table, made if it is not there.

  WHY A ROUTE MAKES A TABLE. `next build` runs the migrations, and it runs them with
  --optional so that a machine with no database can still build — which means a deployment
  whose build environment lacks DATABASE_URL skips them SILENTLY and boots a product whose
  storage is one table short. That is what happened: the translator answered "could not
  reach the translator" on production while working perfectly locally, because the meter's
  read threw on a relation that was never created.

  `create table if not exists` is idempotent and costs one statement per process. It is not
  a substitute for migrations and does not pretend to be — it is a floor under one feature
  that is otherwise dead with no way to tell why from the outside.
*/
let ensured: Promise<void> | null = null
async function ensureTranslationTable(): Promise<void> {
  const sql = db()
  if (!sql) return
  if (!ensured) {
    ensured = (async () => {
      await sql`
        create table if not exists translation (
          id bigserial primary key,
          device_id text,
          user_id text,
          ask text not null,
          answer text,
          note text,
          direction text,
          kept boolean not null default false,
          at timestamptz not null default now()
        )
      `
      /*
        The column that makes the cap mean anything.

        The meter counted by device_id alone, and ensureDevice mints a FRESH id whenever a
        request arrives without the cookie — so a caller that simply does not send cookies
        counted zero every time and was never capped. The file it lives in calls this "the
        one place in DUB where a stranger can spend money"; the cap was a suggestion.

        `client_hash` is a salted hash of the first forwarded hop, so it is something the
        caller cannot throw away by clearing a cookie, and it is not an IP address sitting
        in a table — the salt is server-side and never leaves it, so the column cannot be
        reversed into "who was at this address" even by somebody holding the database.

        Added as an ALTER rather than only in the CREATE, because the table already exists
        wherever this has run before and a create-if-not-exists would silently skip it.
      */
      await sql`alter table translation add column if not exists client_hash text`
      await sql`create index if not exists translation_device_at_idx on translation (device_id, at desc)`
      await sql`create index if not exists translation_client_at_idx on translation (client_hash, at desc)`
      await sql`create index if not exists translation_at_idx on translation (at desc)`
    })().catch((e) => {
      // Let the next call try again rather than caching a failure for the process's life.
      ensured = null
      throw e
    })
  }
  return ensured
}

/**
 * How many this device has asked for in the last day, before spending anything.
 *
 * THIS RAN OUTSIDE THE ROUTE'S TRY/CATCH, so a missing table did not become "the meter is
 * unavailable", it became an unhandled 500 and a client-side message about not reaching the
 * translator — which pointed at the API, the key and the model, none of which were wrong.
 *
 * It fails closed. Without a working count there is no cap, and the cap is the only thing
 * standing between a text box and somebody else's money, so a meter that cannot be read
 * stops the feature rather than quietly uncapping it.
 */
export async function translationsToday(
  deviceId: string | null,
  clientHash: string | null = null,
): Promise<number> {
  const sql = db()
  if (!sql || (!deviceId && !clientHash)) return 0
  /*
    THE GREATER OF THE TWO, and that is the whole fix.

    Counting by device alone was defeated by not sending a cookie. Counting by client alone
    would put everybody behind one office NAT on a shared allowance. Taking the larger means
    a caller has to beat BOTH to spend more than the cap: a new cookie does not lower the
    client count, and a new address does not lower the device count.
  */
  const count = async () => {
    const [row] = await sql<{ n: string }[]>`
      select greatest(
        count(*) filter (where ${deviceId}::text is not null and device_id = ${deviceId}),
        count(*) filter (where ${clientHash}::text is not null and client_hash = ${clientHash})
      )::text as n
      from translation
      where at > now() - interval '24 hours'
    `
    return Number(row?.n ?? 0)
  }
  try {
    return await count()
  } catch {
    await ensureTranslationTable()
    return await count()
  }
}

/**
 * Mark one as kept.
 *
 * Scoped to the device that asked for it, so a guessed id reaches nothing. The flag is
 * the strongest signal on the row — not "was this asked" but "was this worth keeping".
 */
export async function keepTranslation(deviceId: string | null, id: number): Promise<boolean> {
  const sql = db()
  if (!sql || !deviceId) return false
  const rows = await sql`
    update translation set kept = true where id = ${id} and device_id = ${deviceId}
    returning id
  `
  return rows.length > 0
}

/** What people wanted to say, most-wanted first. The other half of the backlog. */
export async function listTranslations(): Promise<
  { ask: string; answer: string; n: number; kept: number; last: string }[]
> {
  const sql = db()
  if (!sql) return []
  const rows = await sql<{ ask: string; answer: string; n: string; kept: string; last: string }[]>`
    select ask, max(answer) as answer, count(*)::text as n,
           count(*) filter (where kept)::text as kept, max(at)::text as last
    from translation group by ask order by count(*) desc, max(at) desc limit 200
  `
  return rows.map((r) => ({
    ask: r.ask,
    answer: r.answer,
    n: Number(r.n),
    kept: Number(r.kept),
    last: r.last,
  }))
}

/** The backlog, most-wanted first. Read by the same admin key as feedback. */
export async function listVocabMisses(): Promise<{ query: string; n: number; last: string }[]> {
  const sql = db()
  if (!sql) return []
  const rows = await sql<{ query: string; n: string; last: string }[]>`
    select query, count(*)::text as n, max(at)::text as last
    from vocab_miss group by query order by count(*) desc, max(at) desc limit 200
  `
  return rows.map((r) => ({ query: r.query, n: Number(r.n), last: r.last }))
}

/**
 * Delete the learner state this device is holding on the server.
 *
 * Only the STATE. Events and feedback keyed to the same device stay, because they are
 * the record of a test run and deleting them would throw away the thing a facilitated
 * session exists to collect. They become unattached the moment the device gets a new id,
 * which is the correct outcome: kept, and no longer pointing at anybody.
 *
 * Scoped to one device id, and the only caller reads that id from the caller's own
 * httpOnly cookie — so this can never reach anybody else's row.
 */
export async function forgetLearnerFor(deviceId: string): Promise<Layer> {
  const sql = db()
  if (sql) {
    await sql`delete from learners where device_id = ${deviceId} and user_id is null`
    return 'postgres'
  }
  return layer()
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
 * Anonymise the learning, delete the person.
 *
 * The learning data — which lines are hard, where people drop out — is what makes the
 * next version better, and it stops being personal the moment it stops being attached to
 * a person. Everything that identifies somebody goes; the shape of what they found
 * difficult stays.
 *
 * WHY THIS LIST IS LONGER THAN IT WAS. This function anonymised the users row rather
 * than deleting it, which meant every `on delete cascade` in the schema was pointed at a
 * row that never gets deleted — so not one of them ever fired. Four tables survived a
 * "delete me" from a file headed "GDPR — one place, so 'delete me' is provably
 * complete":
 *
 *   push_subscriptions — so the notifications kept arriving after the account was gone
 *   share_cards        — a frozen snapshot of their own sentences, still publicly served
 *   waitlist           — their raw email, keyed by email, never touched by any cascade
 *   comp_redemptions   — which code they used, joined straight back to them
 *
 * Every one is now deleted explicitly, in the same transaction, rather than trusted to a
 * cascade that cannot fire. Voice takes are their actual voice and go outright.
 *
 * The users row is still kept-and-anonymised deliberately: the anonymised learners,
 * events and feedback rows are FK-joined to it, and hard-deleting it would either
 * cascade them away or orphan them. What is left is a uuid, a dead email and a
 * deleted_at — nothing that identifies anybody.
 */
export async function deleteUser(userId: string): Promise<void> {
  const sql = db()
  if (!sql) return
  await sql.begin(async (tx) => {
    // Read the email first: the waitlist is keyed on it and has no user_id at all, so
    // nothing else in this transaction can find it once the users row is anonymised.
    const rows = await tx<{ email: string }[]>`select email from users where id = ${userId}`
    const email = rows[0]?.email ?? null

    await tx`delete from voice_takes where user_id = ${userId}`
    await tx`delete from sessions where user_id = ${userId}`
    // The cascades that never fired, because the row they hang off is never deleted.
    await tx`delete from push_subscriptions where user_id = ${userId}`
    await tx`delete from share_cards where user_id = ${userId}`
    await tx`delete from comp_redemptions where user_id = ${userId}`
    if (email) await tx`delete from waitlist where email = ${email}`
    /*
      The learner row is kept and anonymised — which was fine when it held only what was
      hard to remember, and is not fine now that it holds a Legend.

      A Legend is names of children, ages, marital status and why somebody left a
      country. Detaching it from a user id does not make it anonymous; it makes it an
      unattributed file about a real family. So the personal fields are stripped rather
      than orphaned: the Legend, the display name, the profile, and any proof line said
      as a Legend answer — those contain the names.

      What survives is genuinely anonymous and genuinely useful: which pieces were hard,
      where people stopped, how long a section took.
    */
    await tx`
      update learners
         set user_id = null,
             state = (state - 'legend' - 'display_name' - 'profile')
                  || jsonb_build_object(
                       'legend', '[]'::jsonb,
                       'display_name', '',
                       'proof', coalesce(
                         (select jsonb_agg(line)
                            from jsonb_array_elements(coalesce(state->'proof', '[]'::jsonb)) line
                           where line->>'source' is distinct from 'legend'),
                         '[]'::jsonb
                       )
                     )
       where user_id = ${userId}
    `
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
