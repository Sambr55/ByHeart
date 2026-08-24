/**
 * Is there a spacing scale, or thirty numbers?
 *
 *   npm run spacing   (and it runs first inside npm run mobile)
 *
 * There was no scale. Counted across the components: thirty distinct vertical spacing
 * values over 562 uses, so "the spacing feels arbitrary" was not a matter of taste —
 * every child set its own margin and the rhythm was whatever each screen's author felt
 * like that afternoon.
 *
 * Four steps now, and they are chosen by RELATIONSHIP rather than by eye. The question
 * is always how related are these two things, and the answer picks the number.
 *
 * This is a grep, and that is the point: it is the only thing that keeps a scale a
 * scale. A rule nobody checks decays, and this codebase has proved that twice.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** The scale. Nothing else exists. */
export const STEPS = {
  1: 'tight — one thought over two lines: a word and its gloss, a label and its value',
  3: 'close — parts of one group: a headline and its subhead, items in a list',
  6: 'group — one group to the next, inside a section',
  10: 'section — a new section, usually with a rule above it',
} as const

const ALLOWED = new Set(['1', '3', '6', '10', 'auto'])
/*
  Vertical rhythm, wherever it comes from.

  The first version of this rule grepped margin and gap and stopped there, so padding —
  which is the same decision made on the inside of a box — kept fifteen distinct values
  across 242 uses while the gate reported zero violations. A scale that covers half the
  ways to make a gap is not a scale.

  Horizontal padding is deliberately excluded: px is a different problem (it is about the
  width of a control, not the rhythm of a page) and forcing it onto a four-step vertical
  scale would make every button the wrong shape.
*/
const SPACING = /\b(mt|mb|my|pt|pb|py|space-y|gap|gap-x|gap-y)-(auto|[0-9]+(?:\.[0-9]+)?)\b/g
/** The three layers, by name. A fourth number is the bug this catches. */
const Z = /\bz-\[?([0-9]+)\]?\b/g
const Z_ALLOWED = new Set(['1', '30', '50'])

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(path)
  }
  return out
}

const files = [...walk('components'), ...walk('app')]
const spacing: string[] = []
const layers: string[] = []
const used = new Map<string, number>()

/**
 * Blank out comments, keeping the line numbering.
 *
 * Not fussiness: the block in globals.css that documents this very rule quotes the
 * values it forbids, and a checker that fails on its own explanation is a checker
 * nobody keeps. Block comments span lines, so this runs over the whole file.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
}

for (const file of files) {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n')
  const raw = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    const code = line
    for (const m of code.matchAll(SPACING)) {
      used.set(m[0], (used.get(m[0]) ?? 0) + 1)
      if (!ALLOWED.has(m[2])) {
        spacing.push(file + ':' + (i + 1) + '  ' + m[0] + '  ' + raw[i].trim().slice(0, 70))
      }
    }
    for (const m of code.matchAll(Z)) {
      if (!Z_ALLOWED.has(m[1])) {
        layers.push(file + ':' + (i + 1) + '  ' + m[0] + '  ' + raw[i].trim().slice(0, 70))
      }
    }
  })
}

console.log('the scale, in use')
for (const step of ['1', '3', '6', '10'] as const) {
  const n = [...used].filter(([k]) => k.endsWith('-' + step)).reduce((a, [, v]) => a + v, 0)
  console.log('  ' + step.padEnd(4) + String(n).padStart(4) + '  ' + STEPS[Number(step) as 1 | 3 | 6 | 10])
}

if (spacing.length) {
  console.log('\n' + spacing.length + ' off the scale — every value must be 1, 3, 6 or 10')
  spacing.slice(0, 40).forEach((s) => console.log('  ' + s))
  if (spacing.length > 40) console.log('  …and ' + (spacing.length - 40) + ' more')
}
if (layers.length) {
  console.log('\n' + layers.length + ' off the layer scale — only z-[1], z-30 and z-50 exist')
  layers.forEach((s) => console.log('  ' + s))
}

if (spacing.length || layers.length) process.exit(1)
console.log('\nfour spacing steps, three layers, and nothing else')
