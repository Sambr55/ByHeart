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
    /*
      A cascade DELAY is not a duration and is checked by its own rule below.

      70ms a step produces 70, 140, 210, 280, 350, 420 — none of which is on the duration
      scale, and all of which are correct. Judging them by it made the gate demand that a
      staggered list arrive all at once.
    */
    if (/animationDelay/.test(line)) return
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
    // The multiplied form: `animationDelay: i * 70 + 'ms'`.
    for (const m of line.matchAll(/animationDelay[^\n]*?\*\s*(\d+)/g)) {
      const ms = Number(m[1])
      if (ms !== CASCADE_MS) {
        fail(file + ':' + (i + 1) + ' staggers at ' + ms + 'ms — a cascade is ' + CASCADE_MS + 'ms')
      }
    }
    /*
      And the written-out form: `animationDelay: '140ms'`. Every step must land on the
      70ms grid, and the whole list inside 420ms — six items, which is the point at which
      a fan of cards stops reading as one gesture and starts reading as a queue.
    */
    for (const m of line.matchAll(/animationDelay:\s*'(\d+)ms'/g)) {
      const ms = Number(m[1])
      if (ms % CASCADE_MS !== 0) {
        fail(file + ':' + (i + 1) + ' delays ' + ms + 'ms — off the ' + CASCADE_MS + 'ms cascade grid')
      } else if (ms > CASCADE_MS * 6) {
        fail(file + ':' + (i + 1) + ' delays ' + ms + 'ms — a cascade ends by ' + CASCADE_MS * 6 + 'ms')
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
  4. Two places may make a sound, and nowhere else may.

  This rule used to be "no interface sound, and no haptics, ever", and the reasoning behind
  it was sound rather than squeamish: the audio channel IS the content channel here, the ear
  is the organ being trained, and a learner who mutes the app's chirps on a bus has just
  muted the Portuguese, because no OS gesture separates them.

  What has changed is the frame rather than the argument. DUB is installed to a home screen
  now, and inside an app a press that makes no sound at all does not read as restraint, it
  reads as a page. So there is exactly one interface sound, it confirms a press and nothing
  else, it is quiet enough to sit under speech, and — the part that answers the objection
  above rather than ignoring it — it has its own switch in the profile, so silencing the
  interface does not silence the language.

  The boundary is kept narrow and enforced here: engine/audio speaks Portuguese, engine/tap
  confirms a press, and a third file doing either is the thing this catches. Haptics are
  allowed in engine/tap on the same terms, and remain worth almost nothing — iOS Safari
  implements no Vibration API at all, so it is a flourish half the audience cannot feel and
  the sound has to carry the confirmation on its own.
*/
const MAY_SOUND = /engine\/(audio|tap)/
for (const file of files) {
  const src = strip(readFileSync(file, 'utf8'))
  src.split('\n').forEach((line, i) => {
    if (/navigator\.vibrate|\.vibrate\(/.test(line) && !MAY_SOUND.test(file)) {
      fail(file + ':' + (i + 1) + ' vibrates outside engine/tap — haptics have one home')
    }
    if (/new AudioContext|webkitAudioContext|new Audio\(/.test(line) && !MAY_SOUND.test(file)) {
      fail(
        file + ':' + (i + 1) +
          ' makes a sound outside engine/audio and engine/tap — those two are the only voices DUB has',
      )
    }
  })
}

/*
  And the one interface sound stays switchable, which is the whole basis of allowing it.

  A tap sound with no way off is the fastest route from "slick" to "uninstalled", and it
  would also re-open the objection the old rule was built on. Asserted rather than trusted,
  because it is the kind of thing a later refactor tidies away as an unused branch.
*/
{
  const tapSrc = readFileSync('engine/tap.ts', 'utf8')
  if (!/export function setSound/.test(tapSrc) || !/soundOn\(\)/.test(tapSrc)) {
    fail('engine/tap.ts has no off switch — an interface sound is only allowed because it has one')
  }
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

console.log(
  '4 durations · 2 curves · ' + drains.length + ' drain call site(s) · one interface sound, switchable',
)
if (problems.length) {
  console.log('\n' + problems.length + ' motion problem(s):')
  problems.forEach((p) => console.log('  ' + p))
  process.exit(1)
}
console.log('the product still moves the way it decided to')
