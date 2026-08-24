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
    ground: '#FAF7F2',
    pairs: [
      ['ink', '#16202B', AA_TEXT],
      ['muted', '#6E6A63', AA_TEXT],
      ['azulejo — the Portuguese', '#2F6E9E', AA_TEXT],
      ['telha', '#B4553C', AA_TEXT],
      ['right', '#3E7D5A', AA_TEXT],
      ['coach', '#9A5F28', AA_TEXT],
      ['line-strong (control edge)', '#8F8474', AA_LARGE],
    ],
  },
  dark: {
    ground: '#14161A',
    pairs: [
      ['ink', '#F4F0E9', AA_TEXT],
      ['muted', '#9A948B', AA_TEXT],
      ['azulejo — the Portuguese', '#7FB3DA', AA_TEXT],
      ['telha', '#E0876C', AA_TEXT],
      ['right', '#74C79A', AA_TEXT],
      ['coach', '#DDA45E', AA_TEXT],
      ['line-strong (control edge)', '#606771', AA_LARGE],
    ],
  },
}

const TONES: Record<string, [string, string]> = {
  kinetic: ['#2F6E9E', '#7FB3DA'],
  cool: ['#3E5C75', '#9BB3C6'],
  human: ['#A8455E', '#DE8FA2'],
  sharp: ['#8E3A46', '#C97883'],
  warm: ['#B4553C', '#E0876C'],
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
  const l = ratio(light, '#FAF7F2')
  const d = ratio(dark, '#14161A')
  const ok = l >= AA_TEXT && d >= AA_TEXT
  if (!ok) failures++
  console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + tone.padEnd(12) + 'light ' + l.toFixed(2) + '  dark ' + d.toFixed(2))
}

console.log('')
if (failures) { console.log(failures + ' contrast failure(s)'); process.exit(1) }
console.log('every colour clears its threshold on its own ground')
