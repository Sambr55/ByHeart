/**
 * Every text colour against its own ground.
 *
 *   npm run contrast
 *
 * The accent carries the Portuguese, which is the one thing on screen that must never be
 * hard to read — so it is held to the text threshold wherever it appears as text, not the
 * softer one for borders.
 */
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

const THEMES: Record<string, { ground: string; pairs: [string, string, number][] }> = {
  light: {
    ground: '#efe7d9',
    pairs: [
      ['ink', '#1a2430', AA_TEXT],
      ['muted', '#635c50', AA_TEXT],
      ['azulejo — the Portuguese', '#1f5d8c', AA_TEXT],
      ['telha', '#a8492f', AA_TEXT],
      ['right', '#2c6b4a', AA_TEXT],
      ['coach', '#8a5a12', AA_TEXT],
      ['line-strong (control edge)', '#8a7c62', AA_LARGE],
    ],
  },
  dark: {
    ground: '#171a1f',
    pairs: [
      ['ink', '#f4efe6', AA_TEXT],
      ['muted', '#a09788', AA_TEXT],
      ['azulejo — the Portuguese', '#7FB3DA', AA_TEXT],
      ['telha', '#E0876C', AA_TEXT],
      ['right', '#74C79A', AA_TEXT],
      ['coach', '#DDA45E', AA_TEXT],
      ['line-strong (control edge)', '#6b7482', AA_LARGE],
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

const HEADERS: Record<string, string> = {
  azulejo: '#1f5d8c', kinetic: '#1f5d8c', cool: '#33506b', human: '#8f3550',
  sharp: '#7a2f3a', warm: '#9c4632', reflective: '#4c5a33', blunt: '#343940',
}
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
const BARS: [string, string, string][] = [
  ...Object.entries(HEADERS).map(([n, hex]) => [n, hex, '#ffffff'] as [string, string, string]),
  ['REAL WORLD light', '#1a2430', '#efe7d9'],
  ['REAL WORLD dark', '#f4efe6', '#171a1f'],
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

console.log('')
if (failures) { console.log(failures + ' contrast failure(s)'); process.exit(1) }
console.log('every colour clears its threshold on its own ground')
