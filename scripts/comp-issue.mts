/**
 * Issue comp codes. No admin UI — you are the only admin.
 *
 *   npm run comp:issue -- --note "tester cohort 2" --uses 20 --until 2026-12-31
 *   npm run comp:issue -- --note "native reviewer" --uses 1
 *
 * A cohort code with an --until lapses to Free on its own rather than needing to be
 * revoked. Leave --until off for a permanent grant: native reviewers and Booth voices
 * should never see a paywall.
 */
import { db } from '../lib/db'

const args = process.argv.slice(2)
const flag = (name: string): string | undefined => {
  const i = args.indexOf('--' + name)
  return i === -1 ? undefined : args[i + 1]
}

const note = flag('note') ?? 'comp'
const uses = Number(flag('uses') ?? '1')
const until = flag('until') ?? null
const count = Number(flag('codes') ?? '1')

// Human-typable: no vowels, so it cannot accidentally spell anything, and no 0/O/1/I.
const ALPHABET = 'ABCDFGHJKLMNPQRSTVWXYZ23456789'
function code(): string {
  let out = ''
  for (let i = 0; i < 8; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out.slice(0, 4) + '-' + out.slice(4)
}

const sql = db()
if (!sql) {
  console.log('No DATABASE_URL. Nothing to write to.')
  process.exit(1)
}

const issued: string[] = []
for (let i = 0; i < count; i++) {
  const c = code()
  await sql`
    insert into comp_codes (code, plan, note, max_uses, grants_until)
    values (${c}, 'pro', ${note}, ${uses}, ${until})
  `
  issued.push(c)
}

console.log('')
console.log(issued.length + ' code(s), ' + uses + ' use(s) each, ' + (until ? 'until ' + until : 'permanent'))
console.log('note: ' + note)
console.log('')
for (const c of issued) console.log('  ' + c)
console.log('')
console.log('Redeem at /account. A comped learner never sees a billing button.')
