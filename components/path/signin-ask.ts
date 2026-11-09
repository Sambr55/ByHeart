/**
 * WHEN TO ASK SOMEBODY TO SIGN IN (Sam, 2026-11-09: "Too many anonymous visitors… a log in
 * two steps in" — skippable, he chose).
 *
 * Three moments, each asked once: after the second room laid, after the fourth, and on
 * reaching Level 2. "Not now" puts away every moment already reached, so the next one is
 * the next ask — never the same one twice. Signing in ends it. Nobody is ever blocked: the
 * free levels stay free, as promised.
 *
 * Pure, so scripts/signin-ask-check.mts runs it on plain numbers.
 */
export type AskMoment = 'r2' | 'r4' | 'l2'

export function reached(rooms: number, level: number): AskMoment[] {
  const out: AskMoment[] = []
  if (rooms >= 2) out.push('r2')
  if (rooms >= 4) out.push('r4')
  if (level >= 2) out.push('l2')
  return out
}

/** The moment to ask about now, or null. The latest one reached and not yet put away. */
export function askNow(rooms: number, level: number, dismissed: readonly string[]): AskMoment | null {
  const open = reached(rooms, level).filter((m) => !dismissed.includes(m))
  return open.length ? open[open.length - 1] : null
}

export const ASK_COPY: Record<AskMoment, string> = {
  r2: 'Two rooms in. Keep them.',
  r4: 'Four rooms in, and all on this phone.',
  l2: 'Level 1 done. Don’t lose it.',
}
