import 'server-only'
import postgres from 'postgres'

/**
 * The database, when there is one.
 *
 * DUB has to keep working with zero configuration — the tester cohort is running
 * against a deployment with no DATABASE_URL at all, and a missing env var must
 * degrade the product, never break it. Everything above this file therefore treats
 * `db()` returning null as an ordinary state rather than an error, and falls back
 * to Blob storage or to the learner's own device.
 *
 * Set DATABASE_URL and the same code paths become durable, queryable and joinable.
 */

let client: postgres.Sql | null = null
let attempted = false

export function db(): postgres.Sql | null {
  if (attempted) return client
  attempted = true
  const url = process.env.DATABASE_URL
  if (!url) return null
  client = postgres(url, {
    // Serverless: many short-lived invocations, so keep the pool tiny and let
    // idle connections go rather than exhausting the Postgres side.
    max: Number(process.env.DATABASE_POOL_MAX ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // pgbouncer-safe; Neon and Supabase both pool in front
    onnotice: () => {},
  })
  return client
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/** True when the database is reachable, not merely configured. */
export async function dbHealthy(): Promise<boolean> {
  const sql = db()
  if (!sql) return false
  try {
    await sql`select 1`
    return true
  } catch {
    return false
  }
}
