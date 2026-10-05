/**
 * THE TABLE, AND THE CEILING IT MUST NOT GROW THROUGH.
 *
 *   npm run table
 *
 * Sam: "The problem with ex-pats is they hang out together and never feel a pressing need
 * to learn the new language. Take a look at timeleft.com — why cant we do that?" And on
 * the shape of it: "match the people, not run the dinners."
 *
 * WHAT THIS DEFENDS, and every one of them is a door that opens by accident:
 *
 *   nothing about a person but a first name and what they can say. This is the whole of
 *      what one member learns about another, and it is the feature rather than a
 *      limitation of it. A surname, an age, a photograph or a message box each turn a
 *      language product into a social network with a moderation problem — which
 *      components/Feed.tsx already named as "a different company".
 *
 *   DUB matches, it does not host. No venue booking, no payment, no no-show handling.
 *      The moment money or a reservation enters this, it is a logistics business.
 *
 *   the seat is earned by proof, not by a claim. The entire reason this beats Timeleft's
 *      language dropdown is that DUB watched somebody say the sentences. A seat granted
 *      on a self-declared level would throw away the only advantage the product has.
 *
 *   nobody is ranked. The seat stores a count and only `band` may render it. A number
 *      beside a name at a dinner table is a leaderboard.
 */
import { readFileSync } from 'node:fs'
import { SEATS, COLD_FLOOR, canSit, saidCold, TABLE, band } from '../content/table'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const lib = readFileSync('lib/tables.ts', 'utf8')
const route = readFileSync('app/api/tables/route.ts', 'utf8')
const screen = readFileSync('components/Tables.tsx', 'utf8')
const schema = readFileSync('db/migrations/012_tables.sql', 'utf8')
const all = lib + route + screen + schema

console.log('\nwhat one member learns about another\n')
{
  /*
    The select list, read out of the query rather than inferred — the same assertion the
    ticker carries, for the same reason: this is where a personal column gets added by
    somebody being helpful.
  */
  /* whoElse's query specifically — the only one that returns anything about a person. */
  const whoElseSrc = lib.slice(lib.indexOf('export async function whoElse'))
  const select = whoElseSrc.match(/select\s+([\s\S]*?)\s+from\s+seats/i)?.[1] ?? ''
  const LEAKS = /\b(email|phone|surname|last_name|avatar|photo|image|address|lat|lon|location|age|gender|birth)\b/i
  const leaked = LEAKS.test(select)
  ok(
    'a seat shows a first name and a count, nothing else',
    !leaked && /display_name/.test(select) && /said_cold/.test(select),
    leaked ? 'the query selects ' + (select.match(LEAKS)?.[0] ?? '') : 'name + said_cold',
  )

  /* The whole name must never leave the server. split_part is how it does not. */
  ok(
    'only the given name leaves the database',
    /split_part\(u\.display_name, ' ', 1\)/.test(lib),
    '"Sam Brownfield" leaves as "Sam"',
  )

  /*
    THE SCHEMA IS THE CEILING. A column cannot be added without somebody deciding to, and
    this names the ones that would change what this feature is.
  */
  /*
    NO TRAILING WORD BOUNDARY, and that is the whole lesson of this assertion.

    Written first as /\b(photo|avatar|…)\b/ and sabotage-tested by adding
    `photo_url text` to the schema — which PASSED, because `_` is a word character so
    there is no boundary after "photo". The one regex guarding the one rule that matters
    most here was blind to the exact spelling a real column would have.

    Leading boundary only: a column is named photo_url, avatar_id, message_body, so the
    name starts with the banned word and continues. `display_name` is still safe because
    none of these words prefixes it.
  */
  const BANNED = /\b(photo|avatar|image|message|chat|phone|surname|email|lat|lon|address)/i
  const inSchema = BANNED.test(schema.replace(/^\s*--.*$/gm, ''))
  ok(
    'the schema has nowhere to put a photo or a message',
    !inSchema,
    inSchema ? 'a banned column exists' : 'no photo, no messaging, no contact',
  )

  /* No route anywhere lets one member send another anything. */
  ok(
    'members cannot message each other',
    !/\b(sendMessage|postMessage|messageTo|dm\b)/i.test(all),
    'no path from one member to another',
  )
}

console.log('\nDUB matches, it does not host\n')
{
  const HOSTING = /\b(stripe|checkout|payment|charge|refund|booking_ref|reservation|deposit|no_show)\b/i
  const hosts = HOSTING.test(all.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, ''))
  ok(
    'no money and no booking anywhere in it',
    !hosts,
    hosts ? 'found ' + (all.match(HOSTING)?.[0] ?? '') : 'a place and a time, nothing else',
  )
  ok(
    'and the screen says so out loud',
    /weDo/.test(screen) && /weDont/.test(screen) && /do not book it/.test(TABLE.weDont),
    TABLE.weDont,
  )
}

console.log('\nthe seat is earned, not claimed\n')
{
  ok(
    'the bar is sentences said cold',
    COLD_FLOOR === 3 && !canSit([{ source: 'release', clean: true }]),
    COLD_FLOOR + ' produced with nothing on screen',
  )
  ok(
    'and a helped sentence does not count',
    saidCold([
      { source: 'release', clean: true },
      { source: 'release', clean: false },
      { source: 'release', clean: true },
    ]) === 2,
    'only clean lines',
  )
  ok(
    'somebody at the floor can sit',
    canSit([
      { source: 'release', clean: true },
      { source: 'release', clean: true },
      { source: 'release', clean: true },
    ]),
    'three is a seat',
  )
  /*
    THE RACE IS SETTLED IN POSTGRES. Six seats and seven taps is not hypothetical on the
    night a table fills, and a count read in JavaScript then acted on is the oldest bug in
    this shape — it would seat seven people at a table for six.
  */
  ok(
    'the seventh person is refused by the database, not by a hope',
    /where exists[\s\S]*?select count\(\*\) from seats/.test(lib),
    'the insert is conditional on the count',
  )
}

console.log('\nnobody is ranked\n')
{
  /* Only `band` may turn the stored count into something a person reads. */
  /*
    A `key` is not something anybody reads and the interface declares the field — neither
    is a figure on the page. What would be is the value inside a text node, so that is
    what this looks for: braces holding it, not preceded by band(.
  */
  const drawsNumber = /<span[^>]*>\s*\{\s*p\.said_cold\s*\}/.test(screen)
  ok(
    'no figure is shown beside a name',
    !drawsNumber && /band\(p\.said_cold\)/.test(screen),
    drawsNumber ? 'a count reaches the markup' : 'band() is the only renderer',
  )
  ok(
    'the top band does not claim fluency',
    !/fluent/i.test(band(999)),
    band(999),
  )
  /*
    AND THE MATCH IS NOT ON WHO SOMEBODY IS. Age, gender, interests and marital status are
    all on the record; matching on any of them makes this a dating app by accident, which
    Sam named as a possible happy consequence and not as the product.
  */
  /*
    The profile fields, as they are named on the record — `profile.into`, `profile.age`.
    Matching on the bare word caught `insert into seats`, which is SQL rather than a
    preference, and that false positive is worth the longer pattern.
  */
  const MATCHES_ON = /profile\??\.(age|gender|married|into)|\b(order|group) by[^\n]*\b(age|gender|into)\b/
  const sorts = MATCHES_ON.test(lib.replace(/\/\*[\s\S]*?\*\//g, ''))
  ok(
    'the match reads nothing about who somebody is',
    !sorts,
    sorts ? 'matching on ' + (lib.match(MATCHES_ON)?.[0] ?? '') : 'proof and a date, nothing else',
  )
}

console.log('\nonly Sam puts a table up\n')
{
  const make = readFileSync('app/api/tables/make/route.ts', 'utf8')
  const builder = readFileSync('components/TableBuilder.tsx', 'utf8')

  /*
    A MEMBER WHO COULD CREATE A TABLE would be arranging a meeting between strangers under
    DUB's name, which is the moderation surface the schema was built to avoid. Both verbs
    are gated, not just the one that writes.
  */
  const gets = make.match(/export async function GET[\s\S]*?\n}/)?.[0] ?? ''
  const posts = make.match(/export async function POST[\s\S]*?\n}/)?.[0] ?? ''
  ok(
    'both admin verbs check the key',
    /adminKeyValid/.test(gets) && /adminKeyValid/.test(posts),
    'GET and POST',
  )
  ok(
    'the key comes from a header, never a query string',
    /headers\.get\('x-admin-key'\)/.test(make) && !/searchParams[\s\S]{0,40}key/.test(make),
    'a key in a URL reaches logs and history',
  )
  ok(
    'a failed key gets a 404, not a 401',
    /status: 404/.test(make) && !/status: 401/.test(make),
    'the route does not confirm it exists',
  )
  /*
    AND THE ADMIN KEY IS NEVER PERSISTED. In state for the visit and gone when the tab
    closes; localStorage would leave it on whatever device last opened this page.
  */
  /*
    Comments stripped first: the note explaining why localStorage is NOT used mentions it
    by name, and the first version of this assertion failed on its own reasoning.
  */
  const builderCode = builder.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  ok(
    'the builder never stores the key',
    !/localStorage|sessionStorage|document\.cookie/.test(builderCode),
    'held in state for the visit only',
  )
  /* A table in the past is a typo, and the board would silently never show it. */
  ok(
    'a table cannot be put up in the past',
    /that is in the past/.test(make),
    'refused where the mistake is made',
  )
}

console.log('\nthe rule is the product\n')
{
  ok('six seats', SEATS === 6, String(SEATS))
  ok(
    'the ten minutes is stated wherever a seat is offered',
    /first ten minutes are in Portuguese/i.test(TABLE.rule) && /TABLE\.rule/.test(screen),
    TABLE.rule,
  )
  ok(
    'and it has a defined end',
    /then english/i.test(TABLE.rule),
    'the relief is the point',
  )
  ok(
    'nobody is told they are not good enough',
    !/not good enough|too basic|beginner/i.test(TABLE.notYet) && /Not yet/.test(TABLE.notYet),
    TABLE.notYet,
  )
}

console.log(
  '\n' +
    (problems.length
      ? '✗ ' + problems.length + ' problem(s)\n' + problems.map((p) => '  - ' + p).join('\n')
      : '✓ a table, not a social network') +
    '\n',
)
process.exit(problems.length ? 1 : 0)
