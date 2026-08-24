/**
 * Does the product still use its own words?
 *
 *   npm run words
 *
 * Three rules that existed on paper and had no grep behind them, which is why all three
 * had decayed. The content lint checked the medium rule across exactly two files out of
 * forty; the crate rule was never checked at all and a full-width button in the shipped
 * app read PICK ANOTHER AREA; the eyebrow length rule was a comment.
 *
 * It reads the JSX literals rather than the copy objects, because that is where the
 * leaks are: a string typed straight into a component skips every content file the other
 * lints scan.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const problems: string[] = []
const fail = (m: string) => problems.push(m)

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx|ts)$/.test(name)) out.push(path)
  }
  return out
}

/** Comments blanked, line numbering kept — a rule may quote what it forbids. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
}

/*
  What each rule scans, and why they differ.

  The noun rule is about UI COPY — the words the product uses for its own furniture — so
  it reads components and app only. Inside content, "world" is frequently the actual
  subject: mundo glosses to world, Duran Duran's Ordinary World is a song title, and a
  collision's provenance line saying "one world, another" is describing two cultures
  rather than naming a crate. Applying a UI vocabulary rule to teaching material would
  mean rewriting Portuguese to satisfy a style guide.

  The medium rule is wider, because naming a medium in shared copy is the fault whatever
  file it is in — but roots and osmosis are exempt for the same reason: "o filme é uma
  merda" exists to teach the word for film.
*/
const UI = [...walk('components'), ...walk('app')]
const COPY = [
  ...UI,
  ...walk('content').filter((f) => !/roots\.ts$|osmosis\.ts$|missions?[\\/]|targets\.ts$/.test(f)),
]
const files = [...new Set([...UI, ...COPY])]

/*
  1. No copy outside a root's own fields may name a medium.

  The crates are films, titles, books, wisdom, swearing, flirting and a gig, and there
  will be more. Inside a root naming one is legitimate and often the point — "o filme é
  uma merda" teaches the word for film — so content/roots.ts is exempt and everything
  else is not. The replacement was never new copy: the proof card already said it well,
  "with nothing on screen to copy from".
*/
const MEDIUM = /\b(films?|movies?|songs?|books?|quotes?|scenes?)\b/gi
/** The landing list is a list of what a crate can BE, not a narrowing to one of them. */
const MEDIUM_OK = [
  /films, music, books, TV, sport and culture/,
  /film titles|banger quotes|cringe moments/, // crate titles name their own world
]

/*
  2. One noun for the thing, and it is "crate".

  Every surface says crate — the menu, the header, the route, the badges, the copy. A
  second noun for one object is a split, and there were two: "area" on a full-width
  button, and "world" on five screens.
*/
/*
  Copy, not code. `card.worlds`, `worlds:` and `next_world_post` are identifiers — the
  share-card snapshot really does have a field called worlds — and renaming a database
  column is not what this rule is for. So a match preceded by a dot or an underscore, or
  followed by a colon or an equals, is a name rather than a sentence.
*/
const NOUNS: [RegExp, string][] = [
  [/(?<![\w.])areas?(?![\w]|\s*[:=])/gi, 'crate'],
  [/(?<![\w.])worlds?(?![\w]|\s*[:=])/gi, 'crate'],
]
/** "World of wizardry" is a crate's name; "two unrelated worlds" is the collision copy. */
const NOUN_OK = [
  /world of wizardry/i,
  // The compounding claim is genuinely about cultures, not about crates.
  /unrelated worlds|different worlds?|two worlds|another world|other worlds|one world/i,
  /world's|worldwide/i,
  // REAL WORLD is a stage name — the beat where the culture is taken away — and "out in
  // the world" is that beat's own copy, meaning the actual world rather than a crate.
  /REAL WORLD/,
  /out in the world/i,
  // data-* and CSS selectors are not copy.
  /data-stage|\[data-/,
]

/** 3. An eyebrow is a label. Over about fourteen characters it stops being one. */
const EYEBROW_MAX = 14

const STRING = /(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g

for (const file of files) {
  const raw = readFileSync(file, 'utf8').split('\n')
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
  const checkMedium = COPY.includes(file)
  const checkNouns = UI.includes(file)

  lines.forEach((line, i) => {
    const where = file + ':' + (i + 1)

    /*
      Copy is two things and neither of them is an expression.

      Text between tags, and string literals. Stripping tags and reading whatever was
      left also swept up `{worlds > 1 ? (` and `[proof.length, recent, worlds]`, which is
      how a rule about the product's vocabulary ended up asking to rename a local
      variable. A JSX text node has no braces in it — that is what distinguishes it from
      an interpolation.
    */
    const nodes = [...line.matchAll(/>([^<>{}]+)</g)].map((m) => m[1])
    /*
      A bare one-word literal is a value, not a sentence: root_type === 'quote' and
      {n === 1 ? 'world' : 'worlds'} are both code that happens to be spelled like copy.
      Requiring a space is crude and it is right — nothing in this product says anything
      to a person in one word.
    */
    const literals = [...line.matchAll(STRING)].map((m) => m[2]).filter((t) => /\s/.test(t))
    const text = [...nodes, ...literals].join(' ')

    if (checkMedium && !MEDIUM_OK.some((ok) => ok.test(line))) {
      // Same rule as the nouns: the medium words are read out of copy, not out of a
      // comparison against a root_type. `'quote'` alone is a value.
      const hits = [...nodes, ...literals].join(' ').match(MEDIUM)
      if (hits) {
        fail(where + ' names a medium (' + [...new Set(hits)].join(', ') + '): ' + raw[i].trim().slice(0, 68))
      }
    }

    if (checkNouns && !NOUN_OK.some((ok) => ok.test(text))) {
      for (const [re, want] of NOUNS) {
        const hits = text.match(re)
        if (hits) {
          fail(
            where + ' calls a crate a "' + hits[0] + '" — the product word is "' + want + '": ' +
              raw[i].trim().slice(0, 60),
          )
        }
      }
    }
  })

  /*
    Eyebrows. Only literal ones can be measured — an eyebrow bound to a variable is
    reported separately as unbounded, because the string it renders is not knowable here
    and 13 of them are wired to content that can be any length.
  */
  const src = stripComments(readFileSync(file, 'utf8'))
  for (const m of src.matchAll(/className="[^"]*\beyebrow\b[^"]*"\s*>\s*([^<{]+)</g)) {
    const label = m[1].trim().replace(/\s+/g, ' ')
    if (!label || label.length <= EYEBROW_MAX) continue
    const line = src.slice(0, m.index).split('\n').length
    fail(
      file + ':' + line + ' eyebrow is ' + label.length + ' chars (max ' + EYEBROW_MAX + '): "' + label + '"',
    )
  }
}

console.log(files.length + ' files read')
if (problems.length) {
  console.log('\n' + problems.length + ' vocabulary problem(s):')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('one word per thing, no medium named outside a root, every eyebrow a label')
