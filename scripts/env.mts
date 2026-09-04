/**
 * Load .env.local for scripts, because nothing else does.
 *
 * THE BUG THIS FIXES. Next.js reads .env.local automatically, so every key in the app works
 * without anybody thinking about it. A script run through tsx does not — it sees only what
 * the shell exported. So `npm run images -- --write` answered "OPENAI_API_KEY is not set"
 * while the key sat in .env.local three lines long, and the message was true and useless:
 * it named the variable rather than the file, so the obvious fix was to set it again in the
 * same place it already was.
 *
 * Three scripts had the same hole — images, calendar, and the translator check — which is
 * why this is a module rather than three copies.
 *
 * It never overwrites something already in the environment. A key exported in the shell, or
 * injected by CI, is a deliberate act and beats a file on disk.
 */
import { existsSync, readFileSync } from 'node:fs'

/** Files in the order Next.js reads them, later ones losing to earlier. */
const FILES = ['.env.local', '.env']

export function loadEnv(): void {
  for (const file of FILES) {
    if (!existsSync(file)) continue
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const name = line.slice(0, eq).trim()
      if (process.env[name]) continue
      /*
        Quotes stripped, and only matching ones.

        A key pasted with a trailing quote and no leading one is a key that will fail
        authentication with a message about credentials rather than about typing, which is
        an afternoon nobody gets back.
      */
      let value = line.slice(eq + 1).trim()
      if (value.length > 1 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")) {
        value = value.slice(1, -1)
      }
      process.env[name] = value
    }
  }
}
