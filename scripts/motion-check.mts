/**
 * Does the product still move the way it decided to?
 *
 *   npm run motion
 *
 * Every other rule in this repo that lacked a grep has decayed, and motion is the most
 * decay-prone of all of them: a duration is one number, it looks harmless in a diff, and
 * nobody notices a fifth one arriving until there are thirty.
 *
 * Four rules, and each encodes an argument rather than a preference.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const problems: string[] = []
const fail = (m: string) => problems.push(m)

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx|ts|css)$/.test(n)) out.push(p)
  }
  return out
}

/** Comments blanked, line numbers kept — a rule may quote what it forbids. */
function strip(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
}

const files = [...walk('components'), ...walk('app'), ...walk('engine'), ...walk('content')]
const css = strip(readFileSync('app/globals.css', 'utf8'))

/*
  1. Four durations, and a fifth is a violation.

  There were four different cascade values doing one job, plus a duration-700 on the
  journey Shell that had never done anything at all because --bg and --fg are identical
  in ROOT and REAL WORLD. Time gets the closed scale that spacing and layers already
  have. 0 and 0.001ms are exempt: the first is "no animation" and the second is the
  reduced-motion override.
*/
const ALLOWED_MS = new Set([120, 260, 420, 620, 0, 1])
const DURATION = /(\d+(?:\.\d+)?)ms\b/g
for (const file of [...files, 'app/globals.css']) {
  const src = strip(readFileSync(file, 'utf8'))
  const lines = src.split('\n')
  lines.forEach((line, i) => {
    // A duration is a duration in a transition, an animation or a Tailwind class.
    if (!/transition|animation|duration|--t-/.test(line)) return
    for (const m of line.matchAll(DURATION)) {
      const ms = Math.round(Number(m[1]))
      if (!ALLOWED_MS.has(ms)) {
        fail(file + ':' + (i + 1) + ' uses ' + m[0] + ' — the scale is 120, 260, 420, 620')
      }
    }
  })
}
// Tailwind's duration-N utilities are milliseconds too, and they bypass the tokens.
for (const file of files) {
  const src = strip(readFileSync(file, 'utf8'))
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\bduration-(\d+)\b/g)) {
      if (!ALLOWED_MS.has(Number(m[1]))) {
        fail(file + ':' + (i + 1) + ' uses ' + m[0] + ' — use a --t- token, not a utility')
      }
    }
  })
}

/*
  1b. The cascade, which the duration rule could not see.

  Staggered lists are written as `animationDelay: i * 110 + 'ms'`, and the number never
  sits next to the letters "ms" — so two of them ran at 110 and 90 while the gate
  reported a clean scale. A cascade is 70ms per item, capped so the whole list lands
  inside 420ms: below the threshold where the items read as separate events. A hand
  fanning cards, not a sequence of arrivals.

  The one exception is named rather than tolerated. MiniBuild.showOrder staggers at
  190ms, and it is NOT a cascade — it is deliberately watchable, because the learner is
  meant to see where each word goes. Naming it here is what stops the next person
  "fixing" it into the scale.
*/
const CASCADE_MS = 70
const TEACH_MS = 190
for (const file of files) {
  const src = strip(readFileSync(file, 'utf8'))
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/animationDelay[^\n]*?\*\s*(\d+)/g)) {
      const ms = Number(m[1])
      if (ms !== CASCADE_MS) {
        fail(file + ':' + (i + 1) + ' staggers at ' + ms + 'ms — a cascade is ' + CASCADE_MS + 'ms')
      }
    }
    // The teaching stagger, by its own name, so it cannot drift either.
    for (const m of line.matchAll(/setTimeout\([^\n]*?(\d{2,4})\s*\*\s*\(i/g)) {
      const ms = Number(m[1])
      if (ms !== TEACH_MS) {
        fail(file + ':' + (i + 1) + ' teaches at ' + ms + 'ms — showOrder is ' + TEACH_MS + 'ms')
      }
    }
  })
}

/*
  2. No overshoot, ever.

  A cubic-bezier with a y control point outside [0,1] goes past its destination and comes
  back. That is the mechanical signature of bounce, and bounce is the signature of a toy.
  Checked on the numbers rather than on the curve's name, because "springy" is a word and
  1.6 is a fact.
*/
for (const m of css.matchAll(/cubic-bezier\(([^)]+)\)/g)) {
  const [, y1, , y2] = m[1].split(',').map((n) => Number(n.trim()))
  for (const y of [y1, y2]) {
    if (y < 0 || y > 1) {
      fail('cubic-bezier(' + m[1].trim() + ') overshoots (y=' + y + ') — bounce is the signature of a toy')
    }
  }
}

/*
  3. Scale is not an entrance property.

  A thing that grows into place reads as inflating, and inflating is one derivative from
  bouncing. It survives in exactly one role — downward, on press — because a depressed
  control is physical rather than celebratory. So: no scale inside a @keyframes block.
*/
for (const block of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)) {
  if (/scale\(/.test(block[2])) {
    fail('@keyframes ' + block[1] + ' scales — an entrance may translate and fade, never grow')
  }
}

/*
  4. No interface sound, and no haptics. Ever.

  DUB makes exactly two sounds: European Portuguese, and nothing. The audio channel IS
  the content channel — the ear is the organ being trained — so any sound that is not
  Portuguese competes for the exact channel the product exists to occupy. And a learner
  on a bus who mutes the app's chirps has just muted the Portuguese; no OS gesture
  separates them.

  Haptics are worse: navigator.vibrate does not exist on iOS Safari at all, so it is a
  signature half the audience cannot feel, and on the other half it drives a rotational
  motor with one parameter. It cannot do restraint.
*/
for (const file of files) {
  const src = strip(readFileSync(file, 'utf8'))
  src.split('\n').forEach((line, i) => {
    if (/navigator\.vibrate|\.vibrate\(/.test(line)) {
      fail(file + ':' + (i + 1) + ' vibrates — DUB has no haptics, and iOS Safari has no API for them')
    }
    if (/new AudioContext|webkitAudioContext|new Audio\(/.test(line) && !/engine\/audio/.test(file)) {
      fail(file + ':' + (i + 1) + ' makes a sound outside engine/audio — the only sound DUB makes is Portuguese')
    }
  })
}

/*
  5. The drain is the signature gesture, and a signature used everywhere is a texture.

  Four times a session, at the release beat, and nowhere else. More call sites than that
  means it has started being decoration.
*/
const drains = files.filter((f) => /\.tsx$/.test(f)).flatMap((f) =>
  [...strip(readFileSync(f, 'utf8')).matchAll(/(?<!data-)\bdrain=\{/g)].map(() => f),
)
if (drains.length > 4) {
  fail(drains.length + ' drain call sites (' + [...new Set(drains)].join(', ') + ') — the cap is 4')
}

console.log('4 durations · 2 curves · ' + drains.length + ' drain call site(s) · no sound, no haptics')
if (problems.length) {
  console.log('\n' + problems.length + ' motion problem(s):')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('the product still moves the way it decided to')
