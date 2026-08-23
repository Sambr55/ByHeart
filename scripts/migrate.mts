/**
 * Run every SQL file in db/migrations, in name order, exactly once.
 *
 *   DATABASE_URL=postgres://… npm run db:migrate
 *
 * Deliberately not a migration framework. The whole point of a schema this size is
 * that a person can read it in one sitting, and a 40-line runner keeps the SQL
 * files themselves as the only source of truth.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    'No DATABASE_URL.\n\n' +
      'Provision one (Neon, Supabase, Vercel Postgres — any Postgres works), then:\n' +
      '  DATABASE_URL=postgres://… npm run db:migrate\n',
  )
  process.exit(1)
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
const dir = join(process.cwd(), 'db', 'migrations')

await sql`
  create table if not exists _migrations (
    name       text primary key,
    applied_at timestamptz not null default now()
  )
`

const applied = new Set(
  (await sql<{ name: string }[]>`select name from _migrations`).map((r) => r.name),
)
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()

let ran = 0
for (const file of files) {
  if (applied.has(file)) continue
  const body = await readFile(join(dir, file), 'utf8')
  // One transaction per migration: a half-applied schema is worse than none.
  await sql.begin(async (tx) => {
    await tx.unsafe(body)
    await tx`insert into _migrations (name) values (${file})`
  })
  console.log('applied ' + file)
  ran++
}

console.log(ran ? ran + ' migration(s) applied' : 'schema already up to date (' + files.length + ' files)')
await sql.end()
