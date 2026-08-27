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
import { COLLISIONS, ROOTS } from '../content/roots'
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
  2. One noun for the thing, and it is "vibe".

  It was "crate" for a long time, and crate was a metaphor that had to be explained
  before it meant anything — a container nobody had seen, carrying an idea nobody had
  asked for. "Pick your next vibe" needs no gloss at all: it names what the thing
  actually is, which is a mood you want to be able to speak in.

  The rule itself is unchanged and it is the reason a rename this wide is safe: one noun
  for one object, checked on every surface. Crate is now a banned synonym exactly as
  area and world were, so the old word cannot creep back one screen at a time.
*/
/*
  Copy, not code. `card.worlds`, `worlds:` and `next_world_post` are identifiers — the
  share-card snapshot really does have a field called worlds — and renaming a database
  column is not what this rule is for. So a match preceded by a dot or an underscore, or
  followed by a colon or an equals, is a name rather than a sentence.
*/
const NOUNS: [RegExp, string][] = [
  // Not preceded by a hyphen either: safe-area-inset-bottom is CSS, not a word choice.
  [/(?<![\w.-])areas?(?![\w-]|\s*[:=])/gi, 'vibe'],
  [/(?<![\w.])worlds?(?![\w]|\s*[:=])/gi, 'vibe'],
  [/(?<![\w.])crates?(?![\w]|\s*[:=])/gi, 'vibe'],
]
/** "World of wizardry" is a vibe's name; "two unrelated worlds" is the collision copy. */
const NOUN_OK = [
  /world of wizardry/i,
  // The compounding claim is genuinely about cultures, not about crates.
  /unrelated worlds|different worlds?|two worlds|another world|other worlds|one world/i,
  /world's|worldwide/i,
  // "Ordinary World" is a song title and mundo normal is what it teaches. The rule is
  // about what we call a VIBE, and a root explaining word order is not doing that.
  /ordinary world/i,
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

/**
 * JSX text nodes across the whole file, not line by line.
 *
 * Returns the text with the line it starts on, so a failure still points somewhere.
 * String literals are blanked first — an interpolation is code, and a node with braces
 * in it is not a sentence.
 */
function jsxNodes(src: string): { line: number; text: string }[] {
  const blanked = src.replace(new RegExp(STRING.source, "g"), (m) => " ".repeat(m.length))
  const out: { line: number; text: string }[] = []
  for (const m of blanked.matchAll(/>([^<>{}]+)</g)) {
    const text = m[1].replace(/\s+/g, ' ').trim()
    if (!text || !/\s/.test(text)) continue
    /*
      An arrow function supplies a `>` too.

      `=> … <` matches this pattern perfectly and spans whatever code lies between, which
      is how the first version reported a local variable named `crate` as user-facing
      copy. It is the same trap that made my own rename script edit live identifiers.
      Two cheap tests kill it: the bracket must not be the tail of `=>`, and prose does
      not contain parentheses, semicolons or keywords.
    */
    if (blanked[(m.index ?? 0) - 1] === '=') continue
    if (/[(){};=]/.test(text) || /\b(const|let|return|if|else|import|export)\b/.test(text)) continue
    out.push({ line: blanked.slice(0, m.index ?? 0).split('\n').length, text })
  }
  return out
}

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
      …and the same text when it is not all on one line.

      A JSX node written across three lines — `>` on one, the words on the next, `</p>`
      on the third — matched nothing at all, because the pattern above needs both angle
      brackets on the line it is reading. That is not an edge case, it is how every
      button label and every paragraph in this codebase is formatted, so the rule was
      only ever checking single-line JSX and string literals. It missed "ANOTHER CRATE"
      and "OPEN A CRATE" — two buttons — through an entire rename.
    */
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
            where + ' calls a vibe a "' + hits[0] + '" — the product word is "' + want + '": ' +
              raw[i].trim().slice(0, 60),
          )
        }
      }
    }
  })

  if (checkNouns) {
    for (const node of jsxNodes(stripComments(readFileSync(file, 'utf8')))) {
      if (NOUN_OK.some((ok) => ok.test(node.text))) continue
      for (const [re, want] of NOUNS) {
        const hits = node.text.match(re)
        if (hits) {
          fail(
            file + ':' + node.line + ' calls a vibe a "' + hits[0] + '" — the product word is "' +
              want + '": ' + node.text.slice(0, 60),
          )
        }
      }
    }
  }

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
/*
  One strapline.

  There were five at the same time: "Learn Language You Love" on the door, "Find yourself
  in another language" in the Club footer, "Learn a language through things you already
  know" in the metadata, and two more on the share page and the tab title. Each was
  written on the screen it appeared on, which is exactly how a product ends up unable to
  say what it is twice running.

  BRAND.strapline is the only one. This fails on any near-miss written by hand, and near
  misses are the whole risk — nobody would paste a second strapline in deliberately, they
  would type a slightly different one from memory.
*/
{
  const NEAR = [
    /find yourself in (?:another |a )?language/i,
    /learn (?:a )?language you love/i,
    /through (?:things|culture) you already know/i,
  ]
  const OK_FILES = ['content/brand.ts']
  for (const file of files) {
    if (OK_FILES.some((f) => file.endsWith(f))) continue
    const src = stripComments(readFileSync(file, 'utf8'))
    src.split('\n').forEach((line, i) => {
      for (const re of NEAR) {
        const hit = re.exec(line)
        if (!hit) continue
        // The description legitimately names what the product teaches; it is not the
        // strapline and it is allowed to describe.
        if (/description/.test(line)) continue
        fail(
          file + ':' + (i + 1) + ' writes a strapline by hand ("' + hit[0] +
            '") — there is one, and it is BRAND.strapline',
        )
      }
    })
  }
}

/*
  The roots' own product copy.

  content/roots.ts is excluded from the file scan and rightly so — it is full of
  Portuguese, and a rule about the product's vocabulary has no business reading teaching
  material. But a root carries copy in OUR voice too: semantic_bridge and subtext are
  read by a learner on a teaching screen, and six of them called a vibe a crate straight
  through a rename that reported itself complete.
  
  So the fields are named rather than the file, which keeps the Portuguese out of it.
*/
{
  const FIELDS: [string, (r: (typeof ROOTS)[number]) => string | undefined][] = [
    ['semantic_bridge', (r) => r.semantic_bridge],
    ['subtext', (r) => r.subtext],
    ['literal_note', (r) => r.literal_note],
    ['transfer_prompt.context', (r) => r.transfer_prompt?.context],
    // The English side of the line is our sentence too, not the Portuguese.
    ['source', (r) => r.source],
  ]
  // Collisions carry `provenance` — the sentence that names where two pieces came from,
  // which is the most likely place in the whole graph to say "crate" out loud.
  for (const c of COLLISIONS) {
    const text = c.provenance ?? ''
    if (text && !NOUN_OK.some((ok) => ok.test(text))) {
      for (const [re, want] of NOUNS) {
        const hits = text.match(re)
        if (hits) {
          fail(
            'collision ' + c.id + ' provenance calls a vibe a "' + hits[0] +
              '" — the product word is "' + want + '"',
          )
        }
      }
    }
  }
  for (const root of ROOTS) {
    for (const [name, get] of FIELDS) {
      const text = get(root) ?? ''
      if (!text || NOUN_OK.some((ok) => ok.test(text))) continue
      for (const [re, want] of NOUNS) {
        const hits = text.match(re)
        if (hits) {
          fail(
            'root ' + root.root_id + ' ' + name + ' calls a vibe a "' + hits[0] +
              '" — the product word is "' + want + '"',
          )
        }
      }
    }
  }
}


if (problems.length) {
  console.log('\n' + problems.length + ' vocabulary problem(s):')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('one word per thing, no medium named outside a root, every eyebrow a label')
