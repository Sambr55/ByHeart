/**
 * Language pairs.
 *
 * DUB is not an English-to-Portuguese product. It is a culture-to-language system
 * operating on a source_culture × target_locale pair, and the first implementation
 * happens to be en-GB → pt-PT.
 *
 * The pair is keyed on the learner's cultural furniture, not their language. Top Gun,
 * Bond, Bridget Jones and Pulp Fiction work because of shared anglophone media, not
 * because somebody speaks English — a French learner of Portuguese needs a different
 * crate library even though the target graph is identical. source_language is derived
 * from source_culture, never the other way round.
 *
 * pt-PT is fundamental rather than a variant retrofitted onto "pt". The product is a
 * bet on European Portuguese specifically — estás over você está, telemóvel, bica, the
 * 28 — and calling it Portuguese would misdescribe what is already built.
 *
 * ---------------------------------------------------------------------------
 * The boundary, so nobody tries to genericise the wrong half later:
 *
 *   The ENGINE can be pair-agnostic. The CONTENT cannot.
 *
 * `semantic_bridge` on every root is an English→Portuguese explanation. The osmosis
 * insights are Portuguese grammar — ser and estar, clitic placement, diminutives. The
 * gender rule in content/profile.ts exists because Portuguese adjectives agree. None
 * of that is parameterisable, and pretending otherwise would produce a graph that
 * teaches nothing in either language.
 *
 * The honest claim: the engine takes a pair; each pair is a new content project.
 * ---------------------------------------------------------------------------
 */

export interface Pair {
  /** Which crate library this learner can use. Cultural, not linguistic. */
  source_culture: string
  target_language: string
  /** The thing actually taught. pt-PT, never pt. */
  target_locale: string
  /** Whose morning "today" means — a property of the target, not a global. */
  day_zone: string
}

export const DEFAULT_PAIR: Pair = {
  source_culture: 'en-GB',
  target_language: 'pt',
  target_locale: 'pt-PT',
  day_zone: 'Europe/Lisbon',
}

/**
 * Everything offered, available or not.
 *
 * The unavailable ones are listed rather than hidden because a learner deciding
 * whether this is for them is owed the shape of the plan. A disabled row must never
 * become an email capture: the deal screen promises DUB does not do that, and the only
 * honest moment to ask for an email is at the end, once there is something worth
 * keeping.
 */
export const PAIRS: (Pair & {
  label: string
  /** How the language names itself. */
  native: string
  flag: string
  available: boolean
})[] = [
  {
    ...DEFAULT_PAIR,
    label: 'European Portuguese',
    native: 'Português',
    flag: '🇵🇹',
    available: true,
  },
  {
    source_culture: 'en-GB',
    target_language: 'fr',
    target_locale: 'fr-FR',
    day_zone: 'Europe/Paris',
    label: 'French',
    native: 'Français',
    flag: '🇫🇷',
    available: false,
  },
  {
    source_culture: 'en-GB',
    target_language: 'es',
    target_locale: 'es-ES',
    day_zone: 'Europe/Madrid',
    label: 'Spanish',
    native: 'Español',
    flag: '🇪🇸',
    available: false,
  },
  {
    source_culture: 'en-GB',
    target_language: 'it',
    target_locale: 'it-IT',
    day_zone: 'Europe/Rome',
    label: 'Italian',
    native: 'Italiano',
    flag: '🇮🇹',
    available: false,
  },
  {
    source_culture: 'en-GB',
    target_language: 'de',
    target_locale: 'de-DE',
    day_zone: 'Europe/Berlin',
    label: 'German',
    native: 'Deutsch',
    flag: '🇩🇪',
    available: false,
  },
]

/**
 * What a learner can be arriving with. One available option is not a screen, so this
 * sits behind a "Change" on the selector rather than being asked separately.
 */
export const SOURCE_CULTURES: { id: string; label: string; flag: string; available: boolean }[] = [
  { id: 'en-GB', label: 'English', flag: '🇬🇧', available: true },
  { id: 'fr-FR', label: 'French', flag: '🇫🇷', available: false },
  { id: 'es-ES', label: 'Spanish', flag: '🇪🇸', available: false },
  { id: 'de-DE', label: 'German', flag: '🇩🇪', available: false },
]

export const AVAILABLE_PAIRS = PAIRS.filter((p) => p.available)

export function pairFor(sourceCulture: string, targetLocale: string): Pair | undefined {
  return PAIRS.find(
    (p) => p.source_culture === sourceCulture && p.target_locale === targetLocale,
  )
}

/** Stable, readable, and safe in a storage key. */
export function pairId(pair: Pair): string {
  return pair.source_culture + ':' + pair.target_locale
}
