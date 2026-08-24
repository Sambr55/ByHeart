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
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'

/**
 * Read .env.local if it is there.
 *
 * `vercel env pull` writes the connection string into .env.local, and Next loads that
 * file automatically — but a standalone script does not, so without this the obvious
 * two-command setup fails with "No DATABASE_URL" while the URL is sitting right there.
 */
for (const file of ['.env.local', '.env']) {
  const path = join(process.cwd(), file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (!m) continue
    const value = m[2].trim().replace(/^["']|["']$/g, '')
    process.env[m[1]] ??= value
  }
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    'No DATABASE_URL.\n\n' +
      'Provision one (Neon, Supabase, Vercel Postgres — any Postgres works), connect it\n' +
      'to the project, then either:\n\n' +
      '  npx vercel env pull .env.local --scope sambr55s-projects && npm run db:migrate\n' +
      '  DATABASE_URL=postgres://… npm run db:migrate\n\n' +
      'If the provider set POSTGRES_URL rather than DATABASE_URL, add DATABASE_URL with\n' +
      'the same value — this project reads only DATABASE_URL, on purpose, so it is not\n' +
      'tied to one host.\n',
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
