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

/**
 * Every number word between one and a hundred, as pieces a learner can own.
 *
 * Sam: "I don't see why we can't have the tens and digits selector — which by the way at
 * least shows the translations of counting to 100 — and then store the selected number as
 * a piece and then carry it through?"
 *
 * THE DATA WAS ALREADY HERE. The first attempt at this authored twelve roots — a song or
 * a film per ten — because a word only becomes a piece if some root teaches it. That was
 * the wrong reading of the constraint: it turned one selector into a dozen counting
 * lessons nobody asked for, when this file already holds every word to a hundred with its
 * English beside it. Sam: "you have been way too literal there."
 *
 * So the words are generated from the same tables the picker renders. There is exactly
 * one spelling of cinquenta in the product, and the thing a learner banks is the thing
 * they tapped.
 *
 * RUNG 1, because a number is not difficult — it is long. Somebody who can say seis can
 * say sessenta, and the picker shows them why while they choose.
 *
 * `e` IS NOT HERE, and that is the point of generating rather than splitting a phrase.
 * "Cinquenta e seis" is three words and two of them are numbers; the join is grammar, and
 * banking it would put a conjunction in somebody's counting shelf.
 */
/**
 * A piece id from a Portuguese word: unaccented, lower case, underscores for spaces.
 *
 * Mirrors how the authored ids are written by hand, so a generated number and a taught
 * one land on the same id rather than becoming two entries for one word.
 */
function pieceId(target: string): string {
  return target
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
}

export interface NumberWord {
  id: string
  target: string
  gloss: string
}

export const NUMBER_WORDS: NumberWord[] = (() => {
  const out: NumberWord[] = []
  const add = (n: number, gloss: string) => {
    const target = say(n)
    /*
      The id is the spelling, not the digit. A piece id is a word — `seis`, not `n6` —
      because the inventory, the library and every check read ids as vocabulary, and a
      number filed under a numeral would be the one entry nobody could search for.

      UNACCENTED, because that is the convention every authored piece already follows:
      `tres` for três, `ola` for olá, `nao` for não. Generating `três` split three into
      two unrelated pieces — the authored one from Feist and a second from here — which
      the lint caught, and which is exactly the drift ids exist to prevent.
    */
    out.push({ id: pieceId(target), target, gloss })
  }
  const ENGLISH = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen',
  ]
  for (let n = 1; n < 20; n++) add(n, ENGLISH[n])
  const TENS_EN = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  for (let t = 2; t < 10; t++) add(t * 10, TENS_EN[t])
  add(100, 'a hundred')
  return out
})()

/**
 * The number words a given number is made of, by piece id.
 *
 * Fifty-six is cinquenta and seis — two pieces, both worth owning, and neither of them
 * the `e`. Returns the ids so a caller can bank them without knowing how numbers compose.
 */
export function wordsIn(n: number): string[] {
  if (!Number.isInteger(n) || n < 1 || n > 100) return []
  return parts(n)
    .map((p) => p.pt)
    .filter((w) => w !== 'e')
    .map(pieceId)
}
