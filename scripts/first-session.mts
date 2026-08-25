/**
 * What actually happens the first time somebody opens DUB.
 *
 *   npm run first
 *
 * Every other gate in this repo checks a rule. This one checks an EXPERIENCE, because
 * the worst defects in the product were never rule violations — they were screens that
 * render correctly and say nothing. "You can now ." is valid JSX. Three identical filler
 * prompts are a valid section. A 59-screen first session against a ten-minute promise
 * passes every lint in the tree.
 *
 * So this simulates a brand-new learner — no proof, no inventory, rung 1 — choosing each
 * crate they can actually open, and reports what they would meet. It fails on the things
 * a first session must not do.
 */
import {
  CRATES,
  COLLISIONS,
  PIECES,
  ROOTS_BY_FAMILY,
  entryRung,
  type CultureFamily,
  type Root,
  type Rung,
} from '../content/roots'
import { NO_CUE_PROMPTS } from '../content/front-door'
import { INSIGHTS } from '../content/osmosis'
import { beatsFor, capabilities, sectionRoots } from '../engine/journey'

const problems: string[] = []
const fail = (m: string) => problems.push(m)

/** The picker's own rule, for a learner with nothing. */
const RUNG: Rung = 1
const openable = CRATES.filter((c) => c.built !== false && (c.drop || entryRung(c) <= RUNG))

/** The app's own selection, imported rather than reimplemented. */
const sectionFor = (family: CultureFamily): Root[] => sectionRoots(family, RUNG, [])

console.log('a first session, per crate a rung-1 learner can open\n')
console.log(
  '  ' +
    'crate'.padEnd(22) +
    'roots'.padStart(6) +
    'screens'.padStart(9) +
    'releases'.padStart(9) +
    'pieces'.padStart(8) +
    'acts'.padStart(6) +
    'cold'.padStart(6) +
    'osmosis'.padStart(9) +
    'collide'.padStart(9),
)

for (const crate of openable) {
  const roots = sectionFor(crate.id)
  if (!roots.length) {
    fail(crate.id + ' is openable at rung 1 and has no roots a rung-1 learner can reach')
    continue
  }

  // Root beats, plus osmosis, section-complete, three cold prompts, capability, proof,
  // close — the fixed tail every section ends with.
  const rootScreens = roots.reduce((n, r) => n + beatsFor(r).length, 0)
  const screens = rootScreens + 2 + 3 + 3

  const owned = roots.flatMap((r) => r.extracts.map((e) => e.id))
  const acts = capabilities(owned)
  const releases = roots.filter((r) => r.transfer_prompt?.answer).length
  const cold = NO_CUE_PROMPTS.filter((p) => owned.includes(p.requires)).length
  const osmosis = INSIGHTS.filter((i) => i.requires.every((p) => owned.includes(p))).length
  const collide = COLLISIONS.filter((c) =>
    c.requires.every((p: string) => owned.includes(p)),
  ).length

  console.log(
    '  ' +
      crate.id.padEnd(22) +
      String(roots.length).padStart(6) +
      String(screens).padStart(9) +
      String(releases).padStart(9) +
      String(owned.length).padStart(8) +
      String(acts.length).padStart(6) +
      String(cold).padStart(6) +
      String(osmosis).padStart(9) +
      String(collide).padStart(9),
  )

  const C = crate.id + ': '
  /*
    The capability screen renders "You can now {acts}." — with no acts that is the
    sentence "You can now .", which shipped for three of five openable crates.
  */
  if (!acts.length) {
    fail(C + 'the capability screen would read "You can now ." — no piece here maps to an act')
  }
  /*
    Three cold prompts always render. With nothing owned that they need, a learner gets
    three consecutive identical filler screens at the emotional high point of the session.
  */
  if (cold < 1) {
    fail(C + 'no cold prompt is answerable — the three no-cue screens are dead')
  }
  /*
    Two releases, so one fumble cannot cost the whole rung. recordProof allows an upgrade
    now, but a section with a single release still stakes the entire ladder on one build.
  */
  if (releases < 2) {
    fail(C + 'only ' + releases + ' release — one slip and the learner ends session one still on rung 1')
  }
  // The promise is ten minutes. Thirty-odd screens is about that; sixty is not.
  if (screens > 40) {
    fail(C + screens + ' screens in a first session against a ten-minute promise')
  }
  for (const id of owned) {
    if (!PIECES[id]) fail(C + 'root teaches "' + id + '", which is not a piece')
  }
}

/*
  The compounding claim, and when it can honestly fire.

  A collision combines pieces from unrelated worlds, so it CANNOT fire inside a first
  section — one crate is one world, and asking for that would be asking the product to
  contradict itself. The journey knows this: it offers a bridging collision on arriving
  in a SECOND crate.

  So the real question is whether a beginner reaches one by the end of their second
  section, which is the first moment it is possible. Before the_basics existed the answer
  was no from every pairing, and the product's central promise could not fire for weeks.
*/
const pairs: string[] = []
for (const a of openable) {
  for (const b of openable) {
    if (a.id === b.id) continue
    const owned = [...sectionFor(a.id), ...sectionFor(b.id)].flatMap((r) =>
      r.extracts.map((e) => e.id),
    )
    if (COLLISIONS.some((x) => x.requires.every((p: string) => owned.includes(p)))) {
      pairs.push(a.id + ' → ' + b.id)
    }
  }
}
console.log(
  '\n  ' +
    pairs.length +
    ' of ' +
    openable.length * (openable.length - 1) +
    ' two-section openings reach a collision',
)
if (!pairs.length) {
  fail('no collision is reachable from any two first sections — the compounding claim cannot fire')
}
for (const c of openable) {
  const reaches = pairs.some((p) => p.startsWith(c.id + ' '))
  if (!reaches) {
    fail(
      c.id +
        ' opens no collision as a first crate — a learner starting here cannot see the ' +
        'compounding claim in their second section',
    )
  }
}

/**
 * The doorway keeps the promise printed on it.
 *
 * The basics tile says "Hello, thank you, yes, no and counting to ten". The session cap
 * served two roots — olá and não, obrigado — and stopped, so every number in the crate
 * sat behind a wall the learner had no way to know was there, in the one crate everybody
 * is forced to do. Nothing caught it: the content was present, correct and unreachable,
 * which no content lint can see and no layout gate can either.
 *
 * So the promise is checked where it is made. A number must be taught in the FIRST
 * session, and the crate is measured against the whole of one-to-ten.
 */
const NUMBERS = ['um', 'dois', 'três', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez']
/** 'tres' and 'três' are the same number, counted once. */
const canon = (n: string) => (n === 'tres' ? 'três' : n)
const basics = CRATES.find((c) => c.id === 'the_basics')
if (basics) {
  const numbersIn = (roots: Root[]) => {
    const found = new Set<string>()
    for (const r of roots) {
      for (const e of r.extracts) {
        // Both, because the piece id is unaccented ('tres') while the word the learner
        // actually meets is not ('três') — matching on one alone reports a number as
        // missing while it is being taught two lines away.
        for (const form of [e.id, e.target, e.lemma]) {
          const f = String(form ?? '').toLowerCase()
          if (NUMBERS.includes(f)) found.add(f)
        }
      }
    }
    return new Set([...found].map(canon))
  }

  const firstSession = sectionFor('the_basics' as CultureFamily)
  const early = numbersIn(firstSession)
  console.log(
    '\n  the basics, first session: ' +
      firstSession.map((r) => r.root_id).join(', ') +
      '\n  numbers in it: ' +
      ([...early].join(', ') || 'NONE'),
  )
  if (!early.size) {
    fail(
      'the basics teaches no number in its first session, and its tile promises counting ' +
        'to ten — the session cap stops before the counting roots',
    )
  }

  const whole = numbersIn(ROOTS_BY_FAMILY['the_basics' as CultureFamily] ?? [])
  const missing = [...new Set(NUMBERS.map(canon))].filter((n) => !whole.has(n))
  console.log('  the crate covers ' + whole.size + ' of 10: missing ' + (missing.join(', ') || 'none'))
  if (missing.length) {
    console.log(
      '  warn  the basics promises counting to ten and never teaches ' + missing.join(', '),
    )
  }
}

console.log('')
if (problems.length) {
  console.log(problems.length + ' problem(s) in a first session:')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('a first session works, from every crate a beginner can open')
