/**
 * What guards the admin surfaces, and what they hand back.
 *
 *   npm run admin
 *
 * One shared static secret protects every operational route in DUB. That is a decision
 * rather than an oversight — there is one person reading these — but it means the ways the
 * secret can leak matter more than they would if there were five of them.
 *
 * TWO PROPERTIES, AND BOTH ROTTED ONCE. The key must never travel in a URL, because a
 * query string is written into the platform's access log and the CDN's on every request,
 * and the admin page polls. And the routes must hand back what the page renders rather
 * than the row it came from: /api/session was returning `state` whole for a thousand
 * learners, which by this codebase's own account contains the names of children, ages,
 * marital status and why somebody left a country. None of it was displayed.
 *
 * Asserted on the SOURCE, deliberately. The alternative is standing up a database with
 * real learner records to prove that real learner records are not being over-served, which
 * is the wrong way round.
 */
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/** Every route that checks the admin key, and every client that sends it. */
const ROUTES = [
  'app/api/session/route.ts',
  'app/api/feedback/route.ts',
  'app/api/vocab-miss/route.ts',
  'app/api/comp/issue/route.ts',
  'app/api/showing/reports/route.ts',
]
const CLIENTS = ['app/admin/page.tsx', 'app/admin/reports/page.tsx']

console.log('\nthe key never travels in a URL\n')
for (const path of ROUTES) {
  const src = readFileSync(path, 'utf8')
  /*
    Comments are blanked first, because these files EXPLAIN the query string they no longer
    read — and a check that cannot tell a rule from a note about the rule is a check that
    goes red on its own documentation.
  */
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))

  ok(
    path.replace('app/api/', '') + ' reads the key from a header',
    /headers\.get\('x-admin-key'\)/.test(code),
    'a header is not written to an access log by default',
  )
  ok(
    '  and not from the query string',
    !/searchParams\.get\('key'\)/.test(code),
    'left as a fallback, the exposure lasts as long as one caller keeps using it',
  )
  /* And it still checks. A route that reads a header and never compares it is worse. */
  ok('  and it is actually checked', /adminKeyValid\(/.test(code), 'reading is not gating')
}

for (const path of CLIENTS) {
  const src = readFileSync(path, 'utf8')
  ok(
    path.replace('app/', '') + ' sends it as a header',
    /'x-admin-key'/.test(src) && !/key=' \+ encodeURIComponent/.test(src),
    'our own page was the caller keeping the old path alive',
  )
}

console.log('\nand the admin surfaces hand back only what they show\n')
{
  const store = readFileSync('lib/store.ts', 'utf8')
  const page = readFileSync('app/admin/page.tsx', 'utf8')

  /*
    THE RAW LEARNER BLOB DOES NOT LEAVE THE FUNCTION.

    listSessions used to select `l.state` and return it untouched. The narrowing is the
    point of this assertion, so it is made on the shape of the select rather than on a
    comment about it.
  */
  const listing = store.slice(store.indexOf('export async function listSessions'))
  const body = listing.slice(0, listing.indexOf('\n}\n'))
  ok(
    'the session listing does not select the whole learner record',
    !/select l\.device_id, l\.state, l\.updated_at, u\.email/.test(body),
    'state is the entire record, and none of it was rendered',
  )
  ok(
    'and it does not return an email the page never displays',
    !/u\.email/.test(body),
    'the narrowest thing that answers the question is the right thing to send',
  )
  /*
    AND THE SHAPE MATCHES THE PAGE, which is the bug the narrowing happened to fix: the
    page has always read session_id and tester_label, and the Postgres branch returned
    device_id and state. Not one field matched, so against a real database every column
    rendered empty. Only the blob fallback ever produced the shape the table wants.
  */
  for (const field of ['session_id', 'tester_label', 'affinity', 'inventory']) {
    ok(
      '  the listing returns ' + field + ', which the page reads',
      new RegExp(field + ':').test(body) && page.includes(field),
      'a query whose shape the page cannot read renders an empty table',
    )
  }
}

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe key stays out of the logs, and the rows stay narrow')
