/**
 * Issue comp codes. No admin UI — you are the only admin.
 *
 *   npm run comp:issue -- --note "tester cohort 2" --uses 20 --until 2026-12-31
 *   npm run comp:issue -- --note "native reviewer" --uses 1
 *
 * A cohort code with an --until lapses to Free on its own rather than needing to be
 * revoked. Leave --until off for a permanent grant: native reviewers and Booth voices
 * should never see a paywall.
 *
 * Needs DATABASE_URL locally. Against production that means copying a live credential
 * onto a laptop, so POST /api/comp/issue does the same thing over the wire behind the
 * admin key — it calls the same issueCodes(), so the two cannot drift.
 */
import { issueCodes } from '../lib/comp'
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

if (!db()) {
  console.log('No DATABASE_URL. Nothing to write to.')
  process.exit(1)
}

const issued = await issueCodes({ note, uses, until, count })

console.log('')
console.log(issued.length + ' code(s), ' + uses + ' use(s) each, ' + (until ? 'until ' + until : 'permanent'))
console.log('note: ' + note)
console.log('')
for (const c of issued) console.log('  ' + c)
console.log('')
console.log('Redeem at /account — no account needed, it binds to the device.')
