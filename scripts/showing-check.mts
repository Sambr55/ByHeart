/**
 * The showing non-negotiables, checked rather than remembered.
 *
 *   npm run showing
 *
 * Every rule here is one that erodes quietly. Nobody will ever decide to publish somebody's
 * Legend; it will arrive as a second filter written slightly differently in a second file.
 * Nobody will decide to add a message box; a "note" field will look harmless in isolation.
 * So the rules are asserted against the source, not held in anybody's head.
 *
 * Runs with no database and no browser: this is about the shape of the code.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { showableLines, SHOWABLE_CAP } from '../engine/showable'
import { REPORT_REASONS, SHOWING_COPY } from '../content/showing-copy'
import type { ProofLine } from '../engine/learner'

const problems: string[] = []
const ok = (label: string, cond: boolean, detail = '') => {
  console.log('  ' + (cond ? '✓' : '✗') + ' ' + label + (detail ? '   ' + detail : ''))
  if (!cond) problems.push(label + (detail ? ' — ' + detail : ''))
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx)$/.test(path)) out.push(path)
  }
  return out
}
const files = ['app', 'components', 'engine', 'lib', 'content'].flatMap((d) => walk(d))
const read = (p: string) => readFileSync(p, 'utf8')

console.log('\nthe Legend never travels\n')

const line = (pt: string, source: ProofLine['source']): ProofLine =>
  ({ pt, en: pt, source, clean: true, at: '1' }) as ProofLine

const mixed = [
  line('Chamam-se Oscar, Tilly e Ted.', 'legend'),
  line('Um café, se faz favor.', 'release'),
  line('Tenho cinquenta e seis anos.', 'legend'),
  line('Quanto custa?', 'nocue'),
]
const showable = showableLines(mixed)
ok('no legend line survives the filter', !showable.some((l) => l.source === 'legend'))
ok('the vibe lines do', showable.length === 2)
ok('a card is capped', showableLines(Array.from({ length: 20 }, (_, i) => line('x' + i, 'release'))).length === SHOWABLE_CAP, String(SHOWABLE_CAP))
ok('nothing but the Legend is excluded', showableLines([line('a', 'collision')]).length === 1)

/*
  Every publisher goes through the one filter.

  The rule that matters is not "nobody may mention legend lines" — the journey's closing
  screen picks a non-Legend line to show somebody their own sentence, which never leaves
  the phone and is none of this check's business. The rule is that anything which SENDS
  proof lines to the server derives them from showableLines, because a second publisher
  filtering inline is how the Legend eventually leaks: not by a decision, but by the copy
  of the rule being written one clause short.
*/
const publishers = files.filter((f) => read(f).includes("'/api/share'"))
ok('there are publishers to check', publishers.length > 0, publishers.join(' '))
for (const f of publishers) {
  ok(f + ' publishes through showableLines', read(f).includes('showableLines'))
}

console.log('\nnothing arbitrary can be written\n')
/*
  Load-bearing, per the spec: there is nothing to moderate because there is nothing
  arbitrary to write. The first textarea in this feature turns a small obligation into a
  permanent one, and it should be a decision rather than a diff nobody noticed.
*/
const surfaces = files.filter((f) => /Showing|showing/.test(f))
for (const f of surfaces) {
  const src = read(f)
  ok(
    f + ' has no free-text field',
    !/<textarea|type="text"|type='text'|contentEditable/.test(src),
  )
}
ok('report reasons are a closed set', REPORT_REASONS.length > 0 && REPORT_REASONS.every((r) => typeof r === 'string'))
ok(
  'and the UI offers exactly those',
  SHOWING_COPY.report_reasons.every((r) => (REPORT_REASONS as readonly string[]).includes(r.id)) &&
    SHOWING_COPY.report_reasons.length === REPORT_REASONS.length,
)

console.log('\nnothing is counted\n')
/*
  "A count of who has shown you anything is a score with extra steps." The list is a list;
  the moment it renders .length it has become a number that can go up.
*/
for (const f of ['components/ShowThis.tsx', 'components/Showing.tsx', 'app/s/[id]/page.tsx']) {
  const src = read(f)
  const renders = /\{[^}]*\.length\}|\{[^}]*\.length\s*\+/.test(src)
  ok(f + ' renders no total', !renders)
}

console.log('\nreport and block exist before anything is sent\n')
for (const route of ['app/api/showing/report/route.ts', 'app/api/showing/block/route.ts']) {
  let there = true
  try {
    read(route)
  } catch {
    there = false
  }
  ok(route + ' exists', there)
}
/*
  A report button writing to a table nobody opens is worse than no report button: it makes
  a promise on a screen where somebody is already upset.
*/
for (const path of ['app/api/showing/reports/route.ts', 'app/admin/reports/page.tsx']) {
  let there = true
  try {
    read(path)
  } catch {
    there = false
  }
  ok(path + ' exists — somebody reads them', there)
}

const safety = read('components/Showing.tsx')
ok(
  'the recipient is offered both',
  /data-testid=\{'report-'/.test(safety) && /data-testid="block"/.test(safety),
)
/*
  A block you can be talked out of is not one. There is no route that lifts it, and this
  is the check that keeps it that way when somebody reasonably proposes an unblock screen.
*/
const unblock = files.filter((f) => /delete from showing_blocks|unblock/i.test(read(f)))
ok('and there is no way to undo a block', unblock.length === 0, unblock.join(' '))

console.log('\nmutual or nothing\n')
const lib = read('lib/showings.ts')
ok(
  'the recipient is set in the same statement as the returned card',
  /set to_user[\s\S]{0,200}return_card_id/.test(lib),
  'accepting IS showing — there is no accept without an artefact',
)
ok(
  'and only while nobody has taken it',
  /where id = \$\{id\} and to_user is null and to_device is null/.test(lib),
  'two people opening one link cannot both become the recipient',
)
ok('invitations expire', /expires_at/.test(lib) && /LIFETIME_DAYS/.test(lib))

console.log('\nand the public card is untouched\n')
const pub = read('app/p/[id]/page.tsx')
ok(
  '/p/[id] offers no pairing',
  !/show-back|\/api\/showing|components\/Showing/.test(pub),
  'a card posted in public is not an invitation',
)

if (problems.length) {
  console.log('\n' + problems.length + ' problem(s)\n')
  for (const p of problems) console.log('  ✗ ' + p)
  process.exit(1)
}
console.log('\nthe Legend stays home, nothing can be written, nothing is counted')
