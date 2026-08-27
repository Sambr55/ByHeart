/**
 * Every text colour against its own ground.
 *
 *   npm run contrast
 *
 * The accent carries the Portuguese, which is the one thing on screen that must never be
 * hard to read — so it is held to the text threshold wherever it appears as text, not the
 * softer one for borders.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const AA_TEXT = 4.5
const AA_LARGE = 3.0

/**
 * Two kinds of line, and only one of them has a threshold.
 *
 * --line is a decorative hairline between cards. WCAG 1.4.11 covers user interface
 * components and meaningful graphics, and a separator beside a high-contrast text label
 * is neither — forcing it to 3:1 would make every divider in the app read as a heavy
 * rule, which is worse for everybody and required by nothing.
 *
 * --line-strong is the one that carries meaning on its own: the edge of a control where
 * no label is doing the work, and focus. That one clears 3:1 on both grounds.
 */

function lum(hex: string): number {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/**
 * The palette, read out of the stylesheet.
 *
 * These were hand-copied hex literals, which means this script could pass while the app
 * rendered something else entirely — the one failure mode a contrast checker must not
 * have. It parses app/globals.css now: the bare :root block for light, and the
 * [data-theme='dark'] block for dark.
 */
function palette(block: RegExp): Record<string, string> {
  const css = readFileSync('app/globals.css', 'utf8')
  const body = block.exec(css)?.[1] ?? ''
  const out: Record<string, string> = {}
  for (const m of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2]
  return out
}

const LIGHT = palette(/:root\s*\{([\s\S]*?)\n\}/)
const DARK = palette(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/)

/** Fail loudly rather than silently checking nothing if the stylesheet moves. */
for (const [name, p] of [['light', LIGHT], ['dark', DARK]] as const) {
  for (const token of ['bg', 'fg', 'muted', 'accent', 'telha', 'correct', 'coach', 'line-strong']) {
    if (!p[token]) {
      console.log('FAIL could not read --' + token + ' from globals.css (' + name + ')')
      process.exit(1)
    }
  }
}

const THEMES: Record<string, { ground: string; pairs: [string, string, number][] }> = {
  light: {
    ground: LIGHT.bg,
    pairs: [
      ['ink', LIGHT.fg, AA_TEXT],
      ['muted', LIGHT.muted, AA_TEXT],
      ['azulejo — the Portuguese', LIGHT.accent, AA_TEXT],
      ['telha', LIGHT.telha, AA_TEXT],
      ['right', LIGHT.correct, AA_TEXT],
      ['coach', LIGHT.coach, AA_TEXT],
      ['line-strong (control edge)', LIGHT['line-strong'], AA_LARGE],
    ],
  },
  dark: {
    ground: DARK.bg,
    pairs: [
      ['ink', DARK.fg, AA_TEXT],
      ['muted', DARK.muted, AA_TEXT],
      ['azulejo — the Portuguese', DARK.accent, AA_TEXT],
      ['telha', DARK.telha, AA_TEXT],
      ['right', DARK.correct, AA_TEXT],
      ['coach', DARK.coach, AA_TEXT],
      ['line-strong (control edge)', DARK['line-strong'], AA_LARGE],
    ],
  },
}

const TONES: Record<string, [string, string]> = {
  kinetic: ['#1f5d8c', '#7FB3DA'],
  cool: ['#3E5C75', '#9BB3C6'],
  human: ['#A8455E', '#DE8FA2'],
  sharp: ['#8E3A46', '#C97883'],
  warm: ['#a8492f', '#E0876C'],
  reflective: ['#5C6B3D', '#A8B87F'],
  blunt: ['#3F4348', '#9AA0A7'],
}

let failures = 0
for (const [name, t] of Object.entries(THEMES)) {
  console.log('\n' + name + '  ground ' + t.ground)
  for (const [label, hex, need] of t.pairs) {
    const r = ratio(hex, t.ground)
    const ok = r >= need
    if (!ok) failures++
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + label.padEnd(26) + hex + '  ' + r.toFixed(2) + ':1 (needs ' + need + ')')
  }
}

console.log('\ncrate tones, as text on their own ground')
for (const [tone, [light, dark]] of Object.entries(TONES)) {
  const l = ratio(light, '#efe7d9')
  const d = ratio(dark, '#171a1f')
  const ok = l >= AA_TEXT && d >= AA_TEXT
  if (!ok) failures++
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + tone.padEnd(12) + 'light ' + l.toFixed(2) + '  dark ' + d.toFixed(2))
}

/*
  One bar, not eight.

  This measured a saturated header per tone. The bar never used them — --bar-bg is declared
  on :root, so var(--tone-header) resolved there and stayed azulejo whatever tone was on the
  screen — so seven of these eight rows were passing a colour nothing rendered.
*/
const HEADERS: Record<string, string> = { azulejo: '#1f5d8c' }
console.log('\nheader bars, carrying white text')
for (const [name, hex] of Object.entries(HEADERS)) {
  const r = ratio('#ffffff', hex)
  const ok = r >= AA_TEXT
  if (!ok) failures++
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + name.padEnd(12) + hex + '  ' + r.toFixed(2) + ':1')
}

/**
 * On-bar pairs.
 *
 * A header is a second palette, and until now nothing tested it — which is how a toggle
 * came to render sand-on-blue. Every derived token is alpha-white (or alpha-ink, in REAL
 * WORLD) over the bar, so it is composited first and then measured, because a translucent
 * colour has no contrast ratio of its own.
 */
function over(ink: string, pct: number, ground: string): string {
  const px = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16))
  const [a, b] = [px(ink), px(ground)]
  const mix = a.map((c, i) => Math.round(c * pct + b[i] * (1 - pct)))
  return '#' + mix.map((c) => c.toString(16).padStart(2, '0')).join('')
}

/** Ink, and the alpha it is used at. --line is decorative; --line-strong carries meaning. */
const ON_BAR: [string, number, number][] = [
  ['--fg  (bar text)', 1, AA_TEXT],
  ['--muted', 0.8, AA_TEXT],
  ['--accent (selected)', 1, AA_TEXT],
  ['--line-strong (control edge)', 0.6, AA_LARGE],
]

console.log('\non-bar tokens, composited over the bar they sit on')
/*
  REAL WORLD is not a bar of its own any more.

  It used to flip the header to near-black and back, so this list carried both directions
  and checked ink-on-page and page-on-ink. The bar is the azulejo on every stage now — the
  bottom nav pins it there too — so the pairs it was measuring do not occur, and leaving
  them in would report a fiction as passing.
*/
const BARS: [string, string, string][] = [
  ...Object.entries(HEADERS).map(([n, hex]) => [n, hex, '#ffffff'] as [string, string, string]),
  // The bottom nav, which pins the deep azulejo in both themes rather than following the
  // tone. Same scope, so it has to clear the same set.
  ['bottom nav', '#1f5d8c', '#ffffff'],
]
for (const [name, bg, ink] of BARS) {
  const worst = ON_BAR.map(([label, pct, need]) => {
    const r = ratio(over(ink, pct, bg), bg)
    return { label, r, need, ok: r >= need }
  })
  const bad = worst.filter((w) => !w.ok)
  if (bad.length) failures++
  console.log(
    '  ' + (bad.length ? 'FAIL' : 'ok  ') + ' ' + name.padEnd(18) +
      worst.map((w) => w.label.split(' ')[0] + ' ' + w.r.toFixed(2)).join('  ') +
      (bad.length ? '   <- ' + bad.map((w) => w.label + ' needs ' + w.need).join(', ') : ''),
  )
}

/**
 * The alpha variants, which is where the real failure was.
 *
 * Tokens were checked at full strength only, and the app uses twenty-one translucent
 * variants of them — text-fg/75, text-accent/45, text-muted/40. The script reported a
 * clean sheet while the Portuguese rendered at 2.00:1 on two screens, which is not
 * "slightly low", it is illegible.
 *
 * Only TEXT is checked. A translucent border or background is decoration, and holding
 * bg-accent/10 to a text threshold would mean deleting every tint in the product.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(n)) out.push(p)
  }
  return out
}

const TOKEN: Record<string, keyof typeof LIGHT> = {
  fg: 'fg',
  muted: 'muted',
  accent: 'accent',
  telha: 'telha',
  correct: 'correct',
  coach: 'coach',
}

const found = new Map<string, string[]>()
for (const file of [...walk('components'), ...walk('app')]) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/\btext-(fg|muted|accent|telha|correct|coach)\/(\d{1,3})\b/g)) {
    const key = m[1] + '/' + m[2]
    found.set(key, [...(found.get(key) ?? []), file.split('/').pop() ?? file])
  }
}

console.log('\ntranslucent text, composited over its own ground')
for (const [key, where] of [...found].sort()) {
  const [name, pct] = key.split('/')
  const alpha = Number(pct) / 100
  const l = ratio(over(LIGHT[TOKEN[name]], alpha, LIGHT.bg), LIGHT.bg)
  const d = ratio(over(DARK[TOKEN[name]], alpha, DARK.bg), DARK.bg)
  const worst = Math.min(l, d)
  const ok = worst >= AA_TEXT
  if (!ok) failures++
  console.log(
    '  ' + (ok ? 'ok  ' : 'FAIL') + ' text-' + key.padEnd(12) +
      'light ' + l.toFixed(2) + '  dark ' + d.toFixed(2) +
      (ok ? '' : '   <- ' + [...new Set(where)].slice(0, 3).join(', ')),
  )
}

/*
  One accent, and nothing may move it.

  The stage used to reassign --accent — olive inside the basics, wine-red inside Bridget
  Jones, near-black on the release beat and while the culture drained away. Every one of
  those cleared contrast on its own ground, so no gate here objected, and the product still
  taught the wrong thing: nobody learns "blue means go on" from a control that is a
  different colour on every screen.

  So the rule is structural rather than perceptual. --accent and --bar-bg are declared by
  the palette and by nothing else; a stage, a tone or a state may change any other token it
  likes. This is the check that would have caught it, and the one that keeps it caught.
*/
console.log('\none accent, declared in one place')
{
  const css = readFileSync('app/globals.css', 'utf8').split('\n')
  // Where a palette is legitimately declared: :root, the two dark-theme blocks, and the
  // .bar scope, which inverts inside itself so white is the accent on a coloured ground.
  const PALETTE = /^(:root|\s*:root|@media|\.bar|\.nav-bar)/
  let open: string[] = []
  const strays: string[] = []
  for (let i = 0; i < css.length; i++) {
    const line = css[i]
    const selector = line.match(/^([^\s/{][^{]*)\{\s*$/)
    if (selector) open = [selector[1].trim()]
    if (/^\s*--(accent|bar-bg)\s*:/.test(line)) {
      const owner = open[0] ?? '?'
      if (!PALETTE.test(owner)) strays.push('globals.css:' + (i + 1) + '  ' + owner + ' → ' + line.trim())
    }
  }
  for (const stray of strays) console.log('  FAIL ' + stray)
  if (strays.length) failures += strays.length
  else console.log('  ok   nothing reassigns --accent or --bar-bg outside the palette')
}

console.log('')
if (failures) { console.log(failures + ' contrast failure(s)'); process.exit(1) }
console.log('every colour clears its threshold, and the accent never moves')
