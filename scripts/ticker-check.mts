/**
 * THE ROOM AT THE TOP OF YOURS, and what it is never allowed to become.
 *
 *   npm run ticker
 *
 * Sam: "It's about community and we will use this to build out new features. For owned
 * I'd like to show a little ticker bar that shows the avatars or images of anyone who has
 * uploaded them (very small and unclickable) at the top of the yours section."
 *
 * WHAT THIS DEFENDS, and the first two are privacy rules rather than design ones:
 *
 *   it serves first names and nothing else. The endpoint selects one column, and the
 *      rule is that it stays one column — an email, an id, a surname or a joined-at
 *      arriving here would be a personal field shipped to every other member by somebody
 *      adding a line to a query. Asserted on the SQL itself, because that is where it
 *      would happen.
 *
 *   no photograph ever reaches it. engine/avatar.ts keeps a learner's face off the
 *      server on purpose; the ticker is the first surface that would have a reason to
 *      want it, and wanting it is exactly how that decision gets quietly reversed.
 *
 *   it is unclickable, as asked. A name is somebody being in the room, not a profile to
 *      open — and a link here is the first step towards a social product nobody has
 *      decided to build.
 *
 *   it says nothing about how many. The Club intro card settled this: "a number is
 *      honest and cold". A count in this bar would make it a scoreboard, and a product
 *      with two members has nothing to gain from publishing that it has two members.
 *
 *   it is silent until there is a room. One name shown to the person who owns it is a
 *      mirror. Two is the first honest number.
 */
import { readFileSync } from 'node:fs'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

const route = readFileSync('app/api/club/route.ts', 'utf8')
const comp = readFileSync('components/Ticker.tsx', 'utf8')

console.log('\nwhat leaves the server\n')
{
  /*
    The select list, read out of the query rather than inferred. Anything but
    display_name here is a field about a person being handed to strangers.
  */
  const select = route.match(/select\s+([\s\S]*?)\s+from\s+users/i)?.[1] ?? ''
  const columns = select
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
  ok(
    'the query returns first names and nothing else',
    columns.length === 1 && columns[0] === 'display_name',
    columns.join(', ') || 'no select found',
  )

  const LEAKS = /\b(email|user_id|\bid\b|password|token|stripe|created_at|last_seen_at|legend|profile|state)\b/
  const selectLeaks = LEAKS.test(select)
  ok(
    'no personal column is selected',
    !selectLeaks,
    selectLeaks ? 'select mentions ' + (select.match(LEAKS)?.[0] ?? '') : 'display_name only',
  )

  /*
    A photograph must never become a thing this endpoint returns. Checked by name because
    the day somebody adds avatars, this is the file they will add them to.
  */
  const photo = /\b(avatar|photo|image|picture|face)\b/i.test(route.replace(/\/\*[\s\S]*?\*\//g, ''))
  ok(
    'no photograph is served from here',
    !photo,
    photo ? 'the route code mentions a picture' : 'names only',
  )

  ok(
    'deleted accounts are excluded',
    /deleted_at\s+is\s+null/.test(route),
    'deleted_at is null',
  )
}

console.log('\nwhat the bar is\n')
{
  const body = comp.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  const clickable = /<(a|button|Link)\b/i.test(body) || /href=/.test(body)
  ok(
    'nothing in it can be tapped',
    !clickable,
    clickable ? 'it draws a link or a button' : 'no link, no button',
  )

  /*
    A COUNT MUST NEVER BE DRAWN, which is not the same as never being compared.

    The strip chooses between three sentences by how many names there are, so `.length`
    legitimately appears in the markup — what must never happen is a number reaching the
    page. So this looks for a length being RENDERED rather than merely read: inside
    braces on its own, or concatenated into a string.

    Finding the markup is the fiddly part. First written as everything after the first
    `return (`, which is the CLEANUP FUNCTION inside the effect, so the guard below it
    tripped the rule it was meant to pass. The markup is the block carrying the testid.
  */
  const rendered = body.slice(body.indexOf('data-testid'))
  const drawsCount = /\{\s*names\.length\s*\}/.test(rendered) || /\+\s*names\.length/.test(rendered)
  ok(
    'it never says how many',
    !drawsCount,
    drawsCount ? 'a count reaches the markup' : 'length decides the sentence, never prints',
  )

  /*
    AND IT SAYS SOMETHING TRUE WHEN THE ROOM IS NEARLY EMPTY.

    This asserted silence below two names, and the behaviour was wrong: DUB has two
    signed-in learners, so the strip never once appeared on Sam's phone and he asked where
    it had gone. A feature invisible until the product succeeds is absent rather than
    cautious. Being early is the one thing a small room can offer, so it says so.
  */
  ok(
    'it has an honest line for an empty room',
    /You are the first one in/.test(comp),
    'first in, rather than nothing at all',
  )
  ok(
    'and for a room of one',
    /names\.length === 1/.test(comp) && /Early days/.test(comp),
    'names the other person, not a number',
  )

  /*
    THE CALLER IS NEVER IN THEIR OWN STRIP. With two members this rendered "You and
    Sammy" to Sammy — a product telling somebody they have company and naming them.
    Excluded in the query so a future caller cannot reintroduce it.
  */
  ok(
    'the strip never contains the person reading it',
    /currentUser\(\)/.test(route) && /id <> /.test(route),
    'excluded in the query, not the component',
  )

  ok(
    'it holds one line',
    /truncate/.test(comp),
    'a bar that wraps is a block',
  )
}

console.log('\nthe face stays on the phone\n')
{
  /*
    The decision this whole feature was shaped around, asserted where it is written. If
    this comment goes, the reason the ticker shows names rather than faces has gone with
    it and the next person will reasonably wonder why it does not use avatars.
  */
  const avatar = readFileSync('engine/avatar.ts', 'utf8')
  ok(
    'the avatar engine still keeps the photo off the server',
    /never leaves the phone|stays off the server|has no use for it/i.test(avatar),
    'engine/avatar.ts',
  )
  ok(
    'and the ticker says why it shows names instead',
    /engine\/avatar\.ts/.test(comp),
    'the reason is written where somebody would look',
  )
}

console.log(
  '\n' +
    (problems.length
      ? '✗ ' + problems.length + ' problem(s)\n' + problems.map((p) => '  - ' + p).join('\n')
      : '✓ a room, not a scoreboard') +
    '\n',
)
process.exit(problems.length ? 1 : 0)
