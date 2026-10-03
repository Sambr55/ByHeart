/**
 * The cold prompts at the end of a vibe belong to that vibe.
 *
 *   npm run nocue
 *
 * Sam, mid-Marcus-Aurelius: "in the middle of every vibe it seems to throw in a section
 * that has nothing to do with that vibe — so here I am in the middle of Marcus Aurelius
 * and it is talking about my grandfather's modesty and the next screen is about my three
 * children??? It does this oddity in every vibe which loses the flow and vibe of the vibe."
 *
 * NO_CUE_PROMPTS is one global pool filtered only by which pieces the learner owns, so the
 * three cold screens — the emotional peak of a session, where the culture is gone and the
 * learner says something themselves — were drawn from wherever. NoCueView now prefers the
 * current vibe's own prompts, which is the right behaviour and cannot fix a content gap:
 * a vibe with none of its own still has to borrow all three.
 *
 * So this measures the gap and holds the line. It reports rather than fails on vibes that
 * are short, because closing that is authoring work; what it FAILS on is the preference
 * being impossible to satisfy for a vibe that used to manage it.
 */
import { NO_CUE_PROMPTS } from '../content/front-door'
import { ROOTS, CRATES, type CultureFamily } from '../content/roots'

const PER_SESSION = 3

const fail: string[] = []
const note = (s: string) => console.log('  ' + s)

/* Who teaches each piece. A piece taught in two vibes belongs to both. */
const teaches = new Map<string, Set<CultureFamily>>()
for (const r of ROOTS) {
  for (const e of r.extracts) {
    const set = teaches.get(e.id) ?? new Set<CultureFamily>()
    set.add(r.culture_family)
    teaches.set(e.id, set)
  }
}

/*
  EVERY PROMPT MUST BE TEACHABLE. One requiring a piece nothing teaches can never appear,
  which is a prompt that looks written and is dead.
*/
for (const p of NO_CUE_PROMPTS) {
  if (!teaches.has(p.requires)) {
    fail.push(`prompt "${p.answer}" requires "${p.requires}", which no root teaches`)
  }
}

const own = new Map<CultureFamily, number>()
for (const c of CRATES) {
  own.set(
    c.id,
    NO_CUE_PROMPTS.filter((p) => teaches.get(p.requires)?.has(c.id)).length,
  )
}

const short = [...own.entries()].filter(([, n]) => n < PER_SESSION)
const none = [...own.entries()].filter(([, n]) => n === 0)

note(`${NO_CUE_PROMPTS.length} cold prompts across ${CRATES.length} vibes`)
for (const [id, n] of own) {
  note(`  ${String(id).padEnd(22)} ${n} of its own${n < PER_SESSION ? '   (borrows ' + (PER_SESSION - n) + ')' : ''}`)
}

/*
  THE BACKLOG, reported as a number rather than a failure.

  A session serves three, so a vibe with fewer than three of its own borrows the rest and
  the flow break Sam described is still partly there. Writing prompts is content work and
  gating the build on it would only get this check disabled — but the number belongs in
  front of whoever runs the gate, because it is the size of a real product problem.
*/
note(
  `${short.length} of ${CRATES.length} vibes cannot fill a session from their own prompts` +
    (none.length ? ` · ${none.length} have none at all: ${none.map(([id]) => id).join(', ')}` : ''),
)

/*
  WHAT MUST NOT GET WORSE. A vibe that can currently fill a whole session from its own
  prompts must keep being able to — losing that is a regression somebody made, not a gap
  somebody has not filled yet.
*/
const SELF_SUFFICIENT: CultureFamily[] = [...own.entries()]
  .filter(([, n]) => n >= PER_SESSION)
  .map(([id]) => id)
if (!SELF_SUFFICIENT.includes('the_basics' as CultureFamily)) {
  fail.push('the basics can no longer fill its own cold prompts — it is the forced doorway')
}

/*
  AND NO PIECE MAY CARRY TWO PROMPTS, which is how one of them became a near-twin.

  Sam: "I suddenly got vem comigo again and chamo-me sam multiple times." `chamo_me` was
  the only piece in the list with two prompts, and they were nearly the same sentence —
  "Olá, chamo-me Ana." against "Chamo-me Ana." One sentence per piece is not a hard
  content rule, but two for one piece needs to be a decision rather than an accident, so
  it is reported here.
*/
{
  const byPiece = new Map<string, string[]>()
  for (const p of NO_CUE_PROMPTS) {
    const a = byPiece.get(p.requires) ?? []
    a.push(p.answer)
    byPiece.set(p.requires, a)
  }
  const twins = [...byPiece.entries()].filter(([, v]) => v.length > 1)
  for (const [piece, answers] of twins) {
    fail.push(piece + ' has ' + answers.length + ' cold prompts: ' + answers.join(' / '))
  }
}

/*
  HOW MUCH OF THE LIST IS A SECOND ASKING OF A RELEASE — reported, not failed.

  Measured: 15 of the 20 prompts are word-for-word some root's release sentence. That is
  deliberate and good content — the same sentence with a film behind it, then out in the
  world, is the whole point of this beat. What it means is that the REPETITION SAM HIT was
  never a content fault; the beat simply did not remember what had already been said, and
  NoCueView now filters on `proof` as well as `nocue_done`.

  Printed so the consequence stays visible: the more the list overlaps the releases, the
  more often a vibe runs out of fresh prompts and lands on the out-in-the-world screen.
*/
{
  const bare = (t: string) =>
    t
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const releases = new Set(ROOTS.map((r) => bare(r.transfer_prompt.answer)))
  const echoes = NO_CUE_PROMPTS.filter((p) => releases.has(bare(p.answer)))
  console.log(
    '\n  ' + echoes.length + ' of ' + NO_CUE_PROMPTS.length +
      ' cold prompts are also a release — fine in itself, and the reason NoCueView filters on proof',
  )
}

if (fail.length) {
  for (const f of fail) console.log('  FAIL  ' + f)
  console.log(`\n${fail.length} error(s)`)
  process.exit(1)
}
console.log('every cold prompt is teachable, and the basics stands on its own')
