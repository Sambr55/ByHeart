/**
 * The ladder is not spoken aloud.
 *
 *   npm run quiet
 *
 * DUB ran two progress systems at once. Rungs (stage 1–6) gated content; the Legend is
 * what the product is actually for. The learner only ever met the first as a bare number
 * — "Talk about other people, stage 5 of 6" on the most prominent line of the Club — with
 * no onboarding anywhere for what a stage is or how to get one.
 *
 * Sam: "Are rungs still valid with where we have got to in constantly building out your
 * legend. Or are they confusing the code?" Measured at the time: six vibes had
 * `entryRung > 1` but five of those needed stage 2, which the very first release grants,
 * so the whole visible ladder was gating exactly ONE vibe.
 *
 * Rungs keep every mechanical job — sequencing roots inside a vibe, and the one real gate
 * on the swearing vibe. They stop being a number the learner is shown and cannot act on.
 * The rung NAMES survive, because "opens once you can ask for it" is a capability
 * somebody can do something about; "opens at stage 2" is not.
 *
 * Internal surfaces are exempt by name: /qa and the facilitator Diagnostic exist to show
 * the machinery, and hiding it there would be hiding it from the only people who want it.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const fail: string[] = []

/** Screens built for the people running the test, not the people taking it. */
const INTERNAL = ['app/qa/', 'components/Diagnostic.tsx', 'app/facilitator/']

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) return []
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })

const files = [...walk('components'), ...walk('app'), ...walk('content')].filter(
  (f) => !INTERNAL.some((i) => f.startsWith(i)),
)

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  /*
    Comments are prose about the code, not copy. Stripped whole-file, line count
    preserved, so the note explaining why a stage line was REMOVED does not itself trip
    the check — a check that punishes its own documentation gets switched off.
  */
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '')

  src.split('\n').forEach((code, i) => {
    /*
      A stage NUMBER shown to a learner. Matches "stage 4", "stage {n}", "stage ' + rung".
      `data-stage` is a different concept entirely — the beat name on a Shell — and
      `stage === 'showcase'` is the Club's own enum, so both are excluded.
    */
    /*
      A stage NUMBER, in prose aimed at a learner: "stage 4", "stage {n}",
      "stage ' + rung". Everything else that contains the word is a different concept —
      `data-stage` is the beat name on a Shell, `state: 'stage'` is the shelf tile's own
      enum, `vibe-stage` is a testid — and each of those tripped a first version of this
      check, which is how a rule ends up with an --ignore next to it.
    */
    /*
      THE SIGNAL IS A NUMBER NEXT TO THE WORD, IN COPY — not the word itself.

      Two wrong versions taught this. The first missed the very line the check exists for,
      `', stage ' + rung + ' of 6.'`, because the number arrives by concatenation and is
      separated by quotes and spaces. Loosening the gap between word and number then fired
      on nine `stage={stage}` props — the Shell's beat name, a different concept entirely —
      and on `You can {RUNGS[stage - 1].name}`, which is the FIXED copy and contains no
      number at all.

      So it looks only inside string literals and JSX text, for the word followed by a
      digit, an interpolation, or "of N".
    */
    const strings = [
      ...code.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g),
    ].map((m) => m[1] ?? m[2] ?? m[3] ?? '')
    /*
      JSX text, in both shapes it takes.

      `>text<` catches copy on the same line as its tags. But prettier puts a long line of
      copy on its OWN line, with no angle bracket anywhere on it — which is exactly how
      `opens at stage {entry.opensAt}` was written, and a first version of this check never
      looked at it. Verified by putting that line back and watching the check stay green.

      So a line that is neither code nor comment — no semicolon, no brackets of its own,
      but some prose — is treated as copy too.
    */
    const jsxText = [...code.matchAll(/>([^<>{}]+)</g)].map((m) => m[1])
    const isBareCopy =
      /^\s*[A-Za-z][^<>;={}]*$/.test(code) || /^\s*[a-z][^<>;=]*\{[^}]*\}\s*$/i.test(code)
    /*
      The BRACES ARE CODE, not copy, and stripping them matters.

      `You can {RUNGS[stage - 1].name}, with {kept} pieces kept.` is the corrected line —
      it says "You can name it" and shows no number at all. But the identifier `stage`
      lives inside the interpolation, so keeping the braces made the fixed copy trip the
      check that exists to enforce the fix. What the learner reads is what is OUTSIDE
      them, with each hole standing in for one value.
    */
    const bare = isBareCopy ? [code.replace(/\{[^}]*\}/g, '{}')] : []
    /*
      Joined with a marker rather than analysed one literal at a time, because the line
      this exists for splits the phrase ACROSS literals:

        RUNGS[rung - 1].name + ', stage ' + rung + ' of 6.'

      "stage" ends one string and the number is an expression between two more. Joining
      the literals in order puts "stage" and "of 6" next to each other again, and the
      marker stands in for whatever was interpolated between them.
    */
    const prose = [...strings, ...jsxText, ...bare].join(' \u2022 ')
    if (!/\bstages?\b/i.test(prose)) return
    if (!/\bstages?\b[^A-Za-z]{0,6}(\{|\d|of\b)/i.test(prose)) return
    fail.push(`${file}:${i + 1} says a stage number to a learner — name the capability instead`)
  })
}

/*
  AND THE TABLE MUST STILL CARRY ITS NAMES, because that is what replaced the numbers.
  If RUNGS ever loses `name`, every line above degrades to nothing.
*/
const roots = readFileSync('content/roots.ts', 'utf8')
if (!/export const RUNGS[\s\S]{0,400}name: '/.test(roots)) {
  fail.push('RUNGS no longer carries names — the copy that replaced the numbers depends on them')
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log(`${files.length} learner-facing files · the ladder is not spoken aloud`)
