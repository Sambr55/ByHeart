/**
 * Portuguese numbers, said rather than typed.
 *
 * A number slot was a text box with inputMode="numeric", so the Legend came out as
 * "Tenho 56 anos" — a numeral the learner could read and could not say. Somebody who
 * cannot say fifty-six cannot answer "how old are you", which is the entire point of
 * that card.
 *
 * EUROPEAN Portuguese, and the sixteens are where that shows: dezasseis, dezassete,
 * dezanove. Brazil writes dezesseis. Getting this wrong is the exact failure DUB exists
 * to avoid, and it is invisible to anybody who learned from an app that teaches the
 * Brazilian one.
 */

/** 0–19 are their own words. Nothing is composed below twenty. */
const UNITS = [
  'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze',
  'dezasseis', 'dezassete', 'dezoito', 'dezanove',
]

/** The tens, indexed by their first digit. */
const TENS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta',
  'sessenta', 'setenta', 'oitenta', 'noventa',
]

/**
 * The feminine forms, which are not decoration.
 *
 * Only one and two inflect, and they inflect on the thing being counted: duas filhas,
 * dois filhos. A learner told to say "dois filhas" has been taught something wrong, so
 * the caller says which it is rather than the module guessing.
 */
const FEMININE: Record<string, string> = { um: 'uma', dois: 'duas' }

export type NumberGender = 'm' | 'f'

/** The whole number as one Portuguese phrase. */
export function say(n: number, gender: NumberGender = 'm'): string {
  const bend = (w: string) => (gender === 'f' ? FEMININE[w] ?? w : w)
  if (n < 0 || n > 100 || !Number.isInteger(n)) return String(n)
  if (n === 100) return 'cem'
  if (n < 20) return bend(UNITS[n])
  const tens = Math.floor(n / 10)
  const unit = n % 10
  if (!unit) return TENS[tens]
  // "e" between the ten and the unit, always: cinquenta e seis.
  return TENS[tens] + ' e ' + bend(UNITS[unit])
}

/**
 * The number broken into the words it is made of, so the picker can show its working.
 *
 * This is the teaching. Fifty-six is not a word to memorise, it is cinquenta and seis
 * with an e in between — and once somebody has seen that once they can build every
 * number between twenty and a hundred themselves.
 */
export function parts(n: number, gender: NumberGender = 'm'): { pt: string; en: string }[] {
  if (n < 0 || n > 100 || !Number.isInteger(n)) return []
  if (n === 100) return [{ pt: 'cem', en: 'a hundred' }]
  if (n < 20) return [{ pt: say(n, gender), en: String(n) }]
  const tens = Math.floor(n / 10)
  const unit = n % 10
  if (!unit) return [{ pt: TENS[tens], en: String(tens * 10) }]
  return [
    { pt: TENS[tens], en: String(tens * 10) },
    { pt: 'e', en: 'and' },
    { pt: say(unit, gender), en: String(unit) },
  ]
}

/** The rows a picker offers: every ten, and every unit. */
export const TEN_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export const UNIT_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** What a ten is called on its own, for the left-hand column. */
export function tensLabel(t: number): string {
  if (t === 0) return '—'
  if (t === 1) return 'dez'
  return TENS[t]
}
