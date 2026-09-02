/**
 * Go and find out what is happening in Lisbon next month.
 *
 *   npm run calendar -- lisbon 2026-10          # gather, write the file
 *   npm run calendar -- lisbon 2026-10 --prompt # print the prompt, ask nobody
 *
 * The supply problem this solves, stated plainly: a Drop pegged to a date is worthless the
 * morning after and costs the same to write as a Situation that lasts forever. Hand-writing
 * them does not scale past the first one — which is why there is exactly one in the product
 * and it has never been seen by anybody.
 *
 * So the tedious half is automated and the risky half is not. Claude goes and reads what is
 * on, with web search, and writes rows: a date, a name, a venue, and — the part that makes
 * this worth doing — WHO IT IS FOR. Same calendar, three products: a tourist never sees the
 * IMI deadline, somebody who has just moved sees it and it is the most useful thing DUB has
 * ever shown them.
 *
 * Every row lands with `verified: false`, and an unverified row makes no Drop.
 *
 * That is not hedging and it is not distrust of the model. It is a claim about what this
 * particular product does with a fact: it puts it in a learner's mouth, out loud, in front
 * of a stranger, in a language they cannot yet argue in. The failure mode is not a missing
 * gig — it is somebody asking a bus driver about a concert that was cancelled, at a venue
 * on the wrong side of the river. A model with web search is very good at finding what is
 * on and entirely capable of being a month out on a date. One keystroke per row per month
 * is the price of never doing that to somebody, and the flag is one line away if you decide
 * otherwise.
 *
 * --prompt prints the whole thing instead of running it, for pasting into a chat window if
 * you would rather do it that way. Same instructions either way.
 */
import Anthropic from '@anthropic-ai/sdk'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { PURPOSES } from '../content/situations'

const [city = 'lisbon', month = ''] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const promptOnly = process.argv.includes('--prompt')

if (!/^\d{4}-\d{2}$/.test(month)) {
  console.error('usage: npm run calendar -- <city> <YYYY-MM> [--prompt]')
  process.exit(1)
}

const CITY_NAME: Record<string, string> = { lisbon: 'Lisbon, Portugal' }
const place = CITY_NAME[city] ?? city
const [year, mon] = month.split('-').map(Number)
const last = new Date(Date.UTC(year, mon, 0)).getUTCDate()
const window = { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }

/**
 * What the model is told.
 *
 * Three things it must get right, in the order they matter.
 *
 * DATES, because everything else on the card is decoration around a date and a wrong one
 * sends somebody to a locked door. It is told to leave a row out rather than guess, which
 * is the opposite of what a helpful assistant does by default.
 *
 * WHO IT IS FOR, because that is the entire reason this file exists. A calendar that does
 * not split by purpose is a listings page, and DUB already has a listings page problem.
 *
 * And RESTRAINT about volume. Fifteen rows that are true beat forty that are mostly true,
 * and a month with little on it should come back short rather than padded — a padded
 * calendar is indistinguishable from a good one until somebody turns up somewhere.
 */
const system = [
  'You are compiling a factual calendar of what is happening in ' + place + ' for a language',
  'learning app. The rows you produce decide what its learners are taught to say out loud to',
  'strangers, so a wrong date is not a small error.',
  '',
  'WINDOW: ' + window.from + ' to ' + window.to + ' inclusive. Nothing outside it.',
  '',
  'Search the web for each of these, and use what you find rather than what you remember:',
  '  - concerts and festivals with a named venue',
  '  - football fixtures (Benfica, Sporting, Belenenses) played in the city',
  '  - public holidays, saints days and municipal holidays',
  '  - deadlines the state sets for residents: tax instalments, registration, renewals',
  '  - announced strikes or closures affecting transport',
  '',
  'RULES, in order of importance:',
  '',
  '1. If you cannot confirm a date from a source you actually read, LEAVE THE ROW OUT.',
  '   A short calendar is correct. A padded one is indistinguishable from a good one until',
  '   somebody turns up at the wrong place. Never infer a date from a previous year.',
  '',
  '2. Decide who each row is for. This is the point of the exercise:',
  PURPOSES.map((p) => '     ' + p.id + ' — ' + p.blurb).join('\n'),
  '   A four-day visitor should never be shown a property-tax deadline. Somebody who has',
  '   just moved should never miss one. Most events are for everybody; paperwork is not.',
  '',
  '3. Ten to fifteen rows is right. Fewer is fine. Do not pad.',
  '',
  '4. Names in English, as a person would say them out loud — "Benfica v Porto", not a',
  '   press-release headline. Venues by their real name, with the nearest metro station if',
  '   you can confirm one.',
  '',
  'Answer with JSON only, no prose around it:',
  '{"rows": [{',
  '  "id": "short_snake_case",',
  '  "kind": "event" | "holiday" | "deadline" | "disruption",',
  '  "on": "YYYY-MM-DD", "until": "YYYY-MM-DD" (only for multi-day),',
  '  "name": "...",',
  '  "where": {"name": "...", "area": "...", "station": "..."} (omit if there is no place),',
  '  "purposes": ["visiting"|"staying"|"moving", ...],',
  '  "sources": ["https://..."],',
  '  "note": "one line on why you are confident, or what you could not confirm"',
  '}]}',
].join('\n')

const ask =
  'Compile the calendar for ' + place + ', ' + window.from + ' to ' + window.to + '.'

if (promptOnly) {
  console.log(system + '\n\n---\n\n' + ask)
  process.exit(0)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    'No ANTHROPIC_API_KEY. Either export one, or run with --prompt and paste it somewhere.',
  )
  process.exit(1)
}

const client = new Anthropic()

/*
  Streaming, and pause_turn handled explicitly.

  A turn that does a dozen web searches runs for minutes and can come back with
  stop_reason "pause_turn" — the server asking to be continued rather than an answer. Left
  unhandled that is a silently truncated calendar: no error, just fewer rows than the month
  has, which is the failure this whole script is trying not to produce.
*/
const messages: Anthropic.MessageParam[] = [{ role: 'user', content: ask }]
let text = ''

for (let turn = 0; turn < 6; turn++) {
  const stream = client.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    system,
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 20 }],
    messages,
  })
  const message = await stream.finalMessage()
  text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  if (message.stop_reason !== 'pause_turn') break
  messages.push({ role: 'assistant', content: message.content })
  process.stderr.write('  … still searching\n')
}

/*
  Tolerant of a fence, strict about the shape — the same handling lib/translate.ts uses,
  for the same reason: models asked for bare JSON occasionally wrap it anyway, and one line
  turns a whole class of intermittent failure into a non-event.
*/
const open = text.indexOf('{')
const close = text.lastIndexOf('}')
if (open < 0 || close <= open) {
  console.error('No JSON came back. Run with --prompt to see what was asked.')
  process.exit(1)
}

type Row = {
  id: string
  kind: string
  on: string
  until?: string
  name: string
  where?: { name: string; area?: string; station?: string }
  purposes: string[]
  sources?: string[]
  note?: string
}
const { rows } = JSON.parse(text.slice(open, close + 1)) as { rows: Row[] }

/* Anything outside the window is a mistake, however confident it looks. */
const inWindow = rows.filter((r) => r.on >= window.from && r.on <= window.to)
const dropped = rows.length - inWindow.length

const file = `content/calendar/${city}-${month}.ts`
mkdirSync('content/calendar', { recursive: true })
if (existsSync(file)) {
  console.error(file + ' already exists. Move it aside first — this will not overwrite a month somebody has already checked.')
  process.exit(1)
}

const body = inWindow
  .map((r) => {
    const where = r.where
      ? `\n    where: ${JSON.stringify(r.where)},`
      : ''
    const until = r.until ? `\n    until: '${r.until}',` : ''
    const note = r.note ? `\n    // ${r.note.replace(/\n/g, ' ')}` : ''
    return `  {${note}
    id: '${city}_${r.id}',
    chapter: '${city}',
    kind: '${r.kind}',
    on: '${r.on}',${until}
    name: ${JSON.stringify(r.name)},${where}
    purposes: ${JSON.stringify(r.purposes)},
    sources: ${JSON.stringify(r.sources ?? [])},
    // Checked by nobody yet. Flip to true when you have, and only then does it make a Drop.
    verified: false,
  },`
  })
  .join('\n')

writeFileSync(
  file,
  `/**
 * ${place} — ${month}. Gathered by scripts/calendar.mts on ${new Date().toISOString().slice(0, 10)}.
 *
 * EVERY ROW IS UNVERIFIED AND MAKES NO DROP UNTIL SOMEBODY SAYS SO. Read each one, follow
 * its sources, and set verified: true on the ones you would be happy for a learner to
 * mention out loud to a stranger. Delete the rest; a short month is a correct month.
 *
 * Then add this file's export to CALENDAR in content/calendar.ts. That import is by hand on
 * purpose — a directory scan would let a file join the product without anybody deciding it
 * should, which is exactly the property this content must not have.
 */
import type { CalendarRow } from '@/content/calendar'

export const ${city.toUpperCase()}_${month.replace('-', '_')}: CalendarRow[] = [
${body}
]
`,
)

console.log('\n' + file)
console.log(inWindow.length + ' rows, all unverified' + (dropped ? ', ' + dropped + ' dropped for being outside the month' : ''))
console.log('\nNext: read them, check the sources, set verified: true on the ones you believe,')
console.log('then add the export to CALENDAR in content/calendar.ts.')
