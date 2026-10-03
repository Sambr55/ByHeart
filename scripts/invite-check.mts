/**
 * What an invitation can and cannot do.
 *
 *   npm run invite
 *
 * This feature gives away real money — a month of Pro to each of two people — so the
 * properties that stop it being farmed are the ones worth asserting. None of them is a
 * fraud check in the usual sense: they are consequences of measuring the right event, and
 * that is exactly why they are cheap enough to keep.
 *
 * Read at the source rather than against a database, because the whole point is that the
 * rules live in the schema and in one function. A check that needed a live Postgres to
 * run is a check that does not run.
 */
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

/* Comments stripped: a check that matches its own documentation cannot fail. */
const strip = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

const lib = strip(readFileSync('lib/invites.ts', 'utf8'))
/*
  SQL comments are `--`, which the JS strip above does not touch — so a first run of this
  matched the word "contacts" in the migration's own note explaining that it never stores
  one, and reported a file that was already correct. The same self-matching fault the road
  and merge checks each hit once.
*/
const sqlFile = readFileSync('db/migrations/011_invites.sql', 'utf8').replace(/--[^\n]*/g, '')
const session = strip(readFileSync('app/api/session/route.ts', 'utf8'))
const route = strip(readFileSync('app/api/invite/route.ts', 'utf8'))

console.log('\nan invitation pays for learning, not for signing up\n')

/*
  THE ONE THAT MATTERS. Paying on acceptance would reward an expat for adding another
  English speaker to their phone — the behaviour the product exists to counteract — and
  would be farmable with a browser and ten minutes. Paying on a said Legend is
  unspammable without a single fraud check, because a fake account cannot speak
  Portuguese.
*/
ok(
  'the reward is paid on a said Legend, not on acceptance',
  /clubOpen\(/.test(session) && /landInvite\(/.test(session),
  'the session route is where the proof rows arrive',
)
ok(
  'and nothing in the invite route itself can pay',
  !/grant\(|landInvite\(/.test(route),
  'minting and accepting must not be able to issue anything',
)

console.log('\nand it cannot be farmed\n')

ok(
  'a device may only ever take up one invitation',
  /create unique index[\s\S]*invites_one_per_device[\s\S]*on invites \(to_device\)/i.test(sqlFile),
  'clearing storage would otherwise mint free months',
)
ok(
  'you cannot take up your own',
  /That is your own invitation/.test(lib),
  'the cheapest possible fraud',
)
ok(
  'and a landing can only pay once per side',
  /paid_from_at is null/.test(lib) && /paid_to_at is null/.test(lib),
  'the guard and the write are one statement, so a replayed sync cannot pay twice',
)

console.log('\nand it never reads a contact list\n')

/*
  NOT A FIRST VERSION — A CEILING. Sam chose the share sheet over reading the phone book,
  and the schema has nowhere to put a number. Asserted so that adding one is a deliberate
  act with a failing check in front of it rather than a quiet afternoon's work.
*/
for (const [what, src] of [
  ['the schema', sqlFile],
  ['the library', lib],
  ['the route', route],
] as const) {
  ok(
    what + ' has nowhere to put a phone number',
    !/\bphone\b|\bcontact(s)?\b|\bmsisdn\b|\baddress_book\b/i.test(src),
    'reading contacts is the permission that gets apps pulled',
  )
}

console.log('\nand it is a list, never a score\n')

/*
  The rule components/Friends.tsx already holds and lib/showings.ts already enforces: a
  tally of how many people you have recruited is a leaderboard with extra steps.
*/
ok(
  'invitesFrom returns rows and never a count',
  /select code, chapter, pair/.test(lib) && !/count\(\*\)/.test(lib),
  'DUB exists because scores are the wrong fuel',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nit pays when somebody can speak, and it cannot see your phone book')
