/**
 * Harvest, draft, and put the drafts where a person will read them.
 *
 *   npm run pipeline              real sources
 *   npm run pipeline -- --fixture use the sample candidates instead
 *
 * The middle of it. Nothing here publishes: it writes `data/pending-drops.json`, and a drop
 * reaches the Club only when somebody has read it and moved it into content/drops.ts. That
 * is not a temporary arrangement — a drop says where to go on a particular night, and the
 * step where a person looks at it is the product, not the bottleneck.
 *
 * Runs offline with --fixture, which is how it is tested: the harvest is the only part that
 * touches the outside world and it is one function behind an interface.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { harvest } from '../lib/harvest'
import { SOURCES } from '../lib/harvest/sources'
import { draftDrop, alreadyPublished, type Candidate } from '../lib/draft'
import { DROP_TEMPLATES } from '../content/drop-templates'
import { WANTED } from '../content/images'

const fixture = process.argv.includes('--fixture')
const now = new Date()

console.log('\nharvest\n')
let candidates: Candidate[] = []
if (fixture) {
  const path = 'data/fixture-candidates.json'
  if (!existsSync(path)) {
    console.log('  no fixture at ' + path)
    process.exit(1)
  }
  candidates = JSON.parse(readFileSync(path, 'utf8')) as Candidate[]
  console.log('  ' + candidates.length + ' from the fixture')
} else if (!SOURCES.length) {
  /*
    Said out loud rather than exiting quietly.

    No source is switched on yet — each one needs its terms read by a person before it can
    be trusted, and an adapter nobody has cleared is worse than none. This is the honest
    state of the pipeline and it should be obvious every time somebody runs it.
  */
  console.log('  no sources are switched on.')
  console.log('  Each needs its terms read before it can be trusted: see lib/harvest/sources.ts.')
  console.log('  Run with --fixture to exercise everything downstream of the network.')
  process.exit(0)
} else {
  const run = await harvest(SOURCES, now)
  candidates = run.candidates
  for (const r of run.report) {
    console.log('  ' + r.source.padEnd(24) + (r.error ? 'FAILED — ' + r.error : r.got + ' found'))
  }
}

console.log('\ndraft\n')
const drafted = []
const rejected: { id: string; why: string }[] = []
const wanted = new Set<string>()
for (const c of candidates) {
  if (alreadyPublished(c.id)) {
    rejected.push({ id: c.id, why: 'already in the Club' })
    continue
  }
  const result = draftDrop(c, now)
  if (!result.ok) {
    rejected.push({ id: c.id, why: result.why })
    continue
  }
  for (const w of result.wants) wanted.add(w)
  drafted.push(result.drop)
}

for (const d of drafted) {
  console.log('  ✓ ' + d.id.padEnd(34) + d.event + ' · ' + d.place.name + ' · ' + d.on)
}
/*
  Every rejection printed, never a count.

  "40 candidates dropped" is a number that hides a bug — a station table missing one venue
  looks exactly like forty events being genuinely unusable. The reasons are the useful part.
*/
for (const r of rejected) {
  console.log('  · ' + r.id.padEnd(34) + 'not drafted — ' + r.why)
}

if (wanted.size) {
  /*
    A picture the bank does not have yet. The cards still work — they fall back to a
    designed ground — but this is the list that makes the image brief a thing somebody can
    act on rather than a thing discovered on the night.
  */
  console.log('')
  console.log('  pictures these drafts would like and the bank does not have:')
  for (const w of [...wanted].sort()) {
    const brief = WANTED.find((x) => x.slug === w)
    console.log('    ' + w.padEnd(18) + (brief ? brief.brief.slice(0, 64) + '…' : 'no brief written'))
  }
}

console.log('\nwaiting for somebody to read them\n')
if (!existsSync('data')) mkdirSync('data')
writeFileSync(
  'data/pending-drops.json',
  JSON.stringify(
    {
      generated_at: now.toISOString(),
      /*
        Carried into the file so a reviewer sees it. The template's review state IS the
        review state of everything drafted from it — that is the whole point of templates,
        and a reviewer opening this needs to know whether the Portuguese in front of them
        has ever been read by somebody who speaks it.
      */
      templates: DROP_TEMPLATES.map((t) => ({ id: t.id, review: t.review })),
      drops: drafted,
      rejected,
    },
    null,
    2,
  ),
)
console.log('  data/pending-drops.json — ' + drafted.length + ' draft(s)')

const unreviewed = DROP_TEMPLATES.filter((t) => t.review !== 'reviewed')
if (unreviewed.length) {
  console.log(
    '\n  ⚠ ' +
      unreviewed.length +
      ' of ' +
      DROP_TEMPLATES.length +
      ' templates have not been read by a native speaker.',
  )
  console.log('    Nothing drafted from them should reach anybody until they have.')
}
console.log('')
